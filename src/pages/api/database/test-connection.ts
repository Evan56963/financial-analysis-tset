import { NextApiRequest, NextApiResponse } from "next";
import sql from "mssql";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "只允許 POST 請求",
      data: [],
      count: 0,
    });
  }

  try {
    // 直接從 body 取得所有連線資訊（允許前端傳入 user/password/server/port/database）
    const { user, password, server, port, database } = req.body;
    if (!server || !user || !password) {
      return res.status(400).json({
        success: false,
        message: "請填寫完整的連接資訊：伺服器地址、使用者名稱和密碼",
        data: [],
        count: 0,
      });
    }
    const config: sql.config = {
      user: user.trim(),
      password,
      server: server.trim(),
      port: port ? parseInt(port) : 1433,
      database: database?.trim() || "master",
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    };
    let pool: sql.ConnectionPool | null = null;
    try {
      if (database && database !== "master") {
        console.log("[API] 檢查指定資料庫是否存在:", database);
        const checkConfig: sql.config = {
          ...config,
          database: "master",
        };
        const checkPool = new sql.ConnectionPool(checkConfig);
        await checkPool.connect();
        const checkRequest = checkPool.request();
        checkRequest.input("dbName", sql.VarChar, database);
        const result = await checkRequest.query(`
          SELECT COUNT(*) as db_count 
          FROM sys.databases 
          WHERE name = @dbName
        `);
        await checkPool.close();
        const dbExists = result.recordset[0].db_count > 0;
        console.log("[API] 資料庫存在檢查結果:", {
          database,
          exists: dbExists,
        });
        if (!dbExists) {
          return res.status(400).json({
            success: false,
            message: "資料庫名稱錯誤：找不到指定的資料庫，請檢查資料庫名稱",
            data: [],
            count: 0,
          });
        }
        // 資料庫存在，現在檢查使用者權限
        console.log("[API] 資料庫存在，檢查使用者權限");
      }
      // 如果資料庫存在（或使用master），嘗試連接到目標資料庫
      console.log("[API] 嘗試連接到目標資料庫");
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      const request = pool.request();
      await request.query("SELECT 1 as test");
      console.log("[API] 連接測試結果", { success: true });
      res.status(200).json({
        success: true,
        message: "資料庫連接成功！",
        data: [],
        count: 0,
      });
    } catch (dbError: unknown) {
      console.error("[API] 資料庫連接錯誤", dbError);
      const dbErrorObj = dbError as { code?: string; message?: string; originalError?: { message?: string } };
      console.log("[API] 錯誤詳細資訊:", {
        code: dbErrorObj.code,
        message: dbErrorObj.message,
        originalError: dbErrorObj.originalError?.message,
        database: database,
      });
      let errorMessage = "資料庫連接失敗";
      if (dbErrorObj.code === "ELOGIN") {
        if (database && database !== "master") {
          try {
            console.log("[API] 驗證帳號密碼（連接master資料庫）");
            const masterConfig: sql.config = {
              ...config,
              database: "master",
            };
            const masterPool = new sql.ConnectionPool(masterConfig);
            await masterPool.connect();
            await masterPool.request().query("SELECT 1 as test");
            await masterPool.close();
            console.log("[API] 帳號密碼正確，判定為權限問題");
            errorMessage =
              "權限不足：使用者沒有存取此資料庫的權限，請聯繫資料庫管理員";
          } catch {
            console.log("[API] 無法連接master，判定為帳號密碼問題");
            errorMessage = "登入失敗：請檢查使用者名稱和密碼";
          }
        } else {
          errorMessage = "登入失敗：請檢查使用者名稱和密碼";
        }
      } else if (dbErrorObj.code === "ESOCKET") {
        errorMessage = "網路連接失敗：請檢查伺服器地址和端口";
      } else if (dbErrorObj.code === "ETIMEOUT") {
        errorMessage = "連接超時：請檢查網路連接和伺服器狀態";
      } else if (
        dbErrorObj.message &&
        dbErrorObj.message.includes("Cannot open database")
      ) {
        errorMessage = "資料庫名稱錯誤：找不到指定的資料庫，請檢查資料庫名稱";
      } else if (
        dbErrorObj.message &&
        dbErrorObj.message.includes("database") &&
        dbErrorObj.message.includes("does not exist")
      ) {
        errorMessage = "資料庫不存在：請檢查資料庫名稱是否正確";
      } else if (dbErrorObj.message && dbErrorObj.message.includes("permission")) {
        errorMessage = "權限不足：使用者沒有存取此資料庫的權限";
      } else if (dbErrorObj.message) {
        errorMessage = `連接錯誤：${dbErrorObj.message}`;
      }
      res.status(400).json({
        success: false,
        message: errorMessage,
        data: [],
        count: 0,
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error("[API] 關閉連接池時發生錯誤", closeError);
        }
      }
    }
  } catch (error: unknown) {
    console.error("[API] 連接測試發生錯誤", error);
    const errorObj = error as { message?: string };
    res.status(500).json({
      success: false,
      message: `伺服器錯誤: ${errorObj.message || "未知錯誤"}`,
      data: [],
      count: 0,
    });
  }
}
