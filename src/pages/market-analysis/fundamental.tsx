import React, { useEffect, useState } from "react";

type DataPoint = { date: string; value: number };
type IndicatorKey = "oil" | "gold" | "cpi" | "nfp";

const INDICATORS: { key: IndicatorKey; label: string; endpoint: string }[] = [
  // NOTE: 調整 endpoint 至實際後端路由
  { key: "oil", label: "石油 (WTI)", endpoint: "/api/fundamentals/oil" },
  { key: "gold", label: "黃金 (Gold)", endpoint: "/api/fundamentals/gold" },
  { key: "cpi", label: "CPI", endpoint: "/api/fundamentals/cpi" },
  { key: "nfp", label: "NFP (非農就業)", endpoint: "/api/fundamentals/nfp" },
];

// 簡單線圖（SVG）
const LineChart: React.FC<{ data: DataPoint[]; width?: number; height?: number }> = ({
  data,
  width = 520,
  height = 160,
}) => {
  if (!data || data.length === 0) return <div style={{ color: "#666" }}>無資料</div>;
  const vals = data.map((d) => d.value);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const pad = 8;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * innerW;
    const y = pad + ((max - d.value) / (max - min || 1)) * innerH;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} style={{ background: "#fff", borderRadius: 6 }}>
      <polyline fill="none" stroke="#2563eb" strokeWidth={2} points={points.join(" ")} />
      {data.map((d, i) => {
        const [xStr, yStr] = points[i].split(",");
        return <circle key={i} cx={Number(xStr)} cy={Number(yStr)} r={2.5} fill="#1f2937" />;
      })}
    </svg>
  );
};

// 計算趨勢與強弱：使用簡單線性回歸斜率與 z-score 判定
function evaluateStrength(data: DataPoint[]): { status: "偏弱" | "中性" | "偏強"; score: number } {
  if (!data || data.length < 5) return { status: "中性", score: 1 };
  const recent = data.slice(-30);
  const y = recent.map((d) => d.value);
  const n = y.length;
  const mean = y.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(y.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1;
  const last = y[y.length - 1];
  const z = (last - mean) / sd;

  // linear regression slope (x: 0..n-1)
  const xs = recent.map((_, i) => i);
  const xMean = (n - 1) / 2;
  const num = xs.reduce((s, xi, i) => s + (xi - xMean) * (y[i] - mean), 0);
  const den = xs.reduce((s, xi) => s + (xi - xMean) ** 2, 0) || 1;
  const slope = num / den;

  // thresholds: 調整可依指標特性 tweak
  if (z > 0.6 || slope > Math.abs(mean) * 0.002) return { status: "偏強", score: 2 };
  if (z < -0.6 || slope < -Math.abs(mean) * 0.002) return { status: "偏弱", score: 0 };
  return { status: "中性", score: 1 };
}

export default function FundamentalPage(): React.ReactElement {
  const [active, setActive] = useState<IndicatorKey>("oil");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [dataMap, setDataMap] = useState<Record<string, DataPoint[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 預載入四項指標的最近資料（非必需，可按需調整）
    INDICATORS.forEach((it) => fetchIndicator(it.key));
  }, []);

  async function fetchIndicator(key: IndicatorKey) {
    const info = INDICATORS.find((i) => i.key === key);
    if (!info) return;
    setError(null);
    setLoadingMap((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch(info.endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // 預期回傳格式: [{date: "...", value: number}, ...]
      setDataMap((s) => ({ ...s, [key]: json }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoadingMap((s) => ({ ...s, [key]: false }));
    }
  }

  // 一鍵統整：對四項指標分別評估並生成總索引（0-100）
  function aggregateIndex() {
    const results: { key: IndicatorKey; status: string; score: number }[] = [];
    INDICATORS.forEach((it) => {
      const d = dataMap[it.key] || [];
      const ev = evaluateStrength(d);
      results.push({ key: it.key, status: ev.status, score: ev.score });
    });
    const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length; // 0..2
    const index = Math.round((avgScore / 2) * 100); // 0..100
    // 簡短結論
    const strongCount = results.filter((r) => r.status === "偏強").length;
    const weakCount = results.filter((r) => r.status === "偏弱").length;
    let conclusion = "";
    if (strongCount >= 3) conclusion = "整體偏強 — 基本面支持風險資產表現。";
    else if (weakCount >= 3) conclusion = "整體偏弱 — 市場基本面偏保守，注意風險。";
    else conclusion = "中性 — 基本面呈現混合訊號，建議配合技術面與資金面確認。";
    return { index, results, conclusion };
  }

  const agg = aggregateIndex();

  return (
    <div style={{ padding: 20, fontFamily: "Segoe UI, Roboto, Arial" }}>
      <h2>基本面分析 — 綜合指標</h2>

      {/* 新增：顯示聚合指標 */}
      <div
        style={{
          padding: 16,
          marginBottom: 16,
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, color: "#1e293b" }}>基本面綜合指數</h3>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 14 }}>{agg.conclusion}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: agg.index >= 70 ? "#059669" : agg.index <= 30 ? "#dc2626" : "#6b7280",
              }}
            >
              {agg.index}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>0-100</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        {/* 左側：基本面各項現況，逐一展示石油、黃金、NFP、CPI 的目前現況 */}
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, minWidth: 320 }}>
          <div style={{ fontSize: 13, color: "#666" }}>基本面各項現況</div>

          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {INDICATORS.map((it) => {
              const d = dataMap[it.key] || [];
              const ev = evaluateStrength(d);
              const latest = d.length ? d[d.length - 1].value : "—";
              const latestDate = d.length ? d[d.length - 1].date : "";
              return (
                <div
                  key={it.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "#fff",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{it.label}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      最近數值：<span style={{ fontWeight: 700, color: "#111" }}>{latest}</span>
                      {latestDate ? (
                        <span style={{ marginLeft: 8, color: "#999", fontSize: 11 }}>
                          ({latestDate})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: ev.status === "偏強" ? "#047857" : ev.status === "偏弱" ? "#dc2626" : "#666",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {ev.status}
                    </div>
                    <div style={{ fontSize: 12, color: "#999" }}>score: {ev.score}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => {
                // 重新抓取全部資料
                INDICATORS.forEach((it) => fetchIndicator(it.key));
              }}
              style={{ marginTop: 10, padding: "8px 10px" }}
            >
              重新抓取資料
            </button>
          </div>
        </div>

        {/* 右側：原有互動與圖表展示 */}
        <div style={{ flex: 1, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
            {INDICATORS.map((it) => {
              const d = dataMap[it.key] || [];
              const ev = evaluateStrength(d);
              return (
                <button
                  key={it.key}
                  onClick={() => setActive(it.key)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: active === it.key ? "2px solid #2563eb" : "1px solid #ddd",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 13 }}>{it.label}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: ev.status === "偏強" ? "#047857" : ev.status === "偏弱" ? "#dc2626" : "#666",
                    }}
                  >
                    {ev.status}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{INDICATORS.find((i) => i.key === active)?.label}</h3>
              <div style={{ fontSize: 13, color: "#666" }}>
                <button onClick={() => fetchIndicator(active)} style={{ padding: "6px 10px", marginRight: 8 }}>
                  重新載入
                </button>
                <span>{loadingMap[active] ? "載入中..." : `資料點數：${(dataMap[active] || []).length}`}</span>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {error && <div style={{ color: "crimson" }}>{error}</div>}
              <LineChart data={dataMap[active] || []} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600 }}>近期判斷</div>
              <div style={{ color: "#444", marginTop: 6 }}>
                {
                  // 顯示評估結果明細
                  (() => {
                    const ev = evaluateStrength(dataMap[active] || []);
                    return `${INDICATORS.find((i) => i.key === active)?.label}：${ev.status}（數據點 ${
                      (dataMap[active] || []).length
                    }）`;
                  })()
                }
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600 }}>建議</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
                {(() => {
                  const ev = evaluateStrength(dataMap[active] || []);
                  const status = ev.status;
                  switch (active) {
                    case "cpi":
                      if (status === "偏強")
                        return "CPI 偏強：通膨壓力升高，央行可能偏向收緊貨幣政策。後果可能包含利率上行、債券價格承壓與美元走強。建議：減少利率敏感與高槓桿部位、關注能源與食品等輸入性通膨來源。";
                      if (status === "偏弱")
                        return "CPI 偏弱：物價壓力趨緩，貨幣政策可能維持寬鬆或放緩升息。後果可能包含債券收益率下降與風險資產表現改善。建議：關注成長型資產與消費類表現，並留意就業與薪資數據。";
                      return "CPI 中性：物價走勢穩定，短期對資產配置影響有限。建議：維持分散配置，觀察後續數據與核心通膨趨勢。";

                    case "nfp":
                      if (status === "偏強")
                        return "NFP 偏強：就業與薪資動能佳，短期可能加速升息節奏，推升利率與美元。建議：檢視利率敏感資產（如長債、房地產）風險，並留意薪資成長是否推升核心通膨。";
                      if (status === "偏弱")
                        return "NFP 偏弱：就業疲弱，可能降低升息壓力或促成寬鬆政策，利好債市與部分風險資產。建議：關注失業率、勞動參與率與薪資趨勢，留意消費性支出變化。";
                      return "NFP 中性：就業數據無明顯方向，建議以薪資與勞動參與率等補充指標做進一步判斷。";

                    case "oil":
                      if (status === "偏強")
                        return "石油偏強：油價上升可能推升輸入性通膨並利好能源股，但會增加企業與消費者成本。建議：評估上游能源曝險與消費品成本壓力，關注地緣政治與供需變化。";
                      if (status === "偏弱")
                        return "石油偏弱：油價下跌有助於緩解通膨與降低企業成本，利好消費類股但壓抑能源股。建議：關注下游消費與運輸成本改善的產業機會。";
                      return "石油中性：油價波動有限，短期對通膨影響較小。建議：以供需與地緣事件為重點監控。";

                    case "gold":
                      if (status === "偏強")
                        return "黃金偏強：可能反映避險需求上升或實質利率下降，對通膨與市場風險情緒敏感。建議：考慮適度保值配置並留意美元與利率走勢。";
                      if (status === "偏弱")
                        return "黃金偏弱：避險需求減少或利率上行，對黃金不利。建議：關注美元強弱與實質利率變動，調整貴金屬曝險。";
                      return "黃金中性：市場對風險與通膨預期平衡，建議以事件驅動調整倉位。";

                    default:
                      return "建議：以上為自動化簡單評估結果，請搭配技術面與其他基本面指標進行綜合判斷。";
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
        <h4>各指標詳情</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          {INDICATORS.map((it) => {
            const d = dataMap[it.key] || [];
            const ev = evaluateStrength(d);
            return (
              <div key={it.key} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{it.label}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>{d.length ? `${d.length} 筆資料` : "尚無資料"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: ev.status === "偏強" ? "#047857" : ev.status === "偏弱" ? "#b91c1c" : "#666",
                        fontWeight: 700,
                      }}
                    >
                      {ev.status}
                    </div>
                    <div style={{ fontSize: 12, color: "#999" }}>score: {ev.score}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <LineChart data={d} width={300} height={100} />
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button onClick={() => fetchIndicator(it.key)} style={{ padding: "6px 8px" }}>
                    重新載入
                  </button>
                  <button onClick={() => setActive(it.key)} style={{ padding: "6px 8px" }}>
                    查看
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}