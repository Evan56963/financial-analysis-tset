import React, { useState } from 'react';
import Head from 'next/head';

const LINE_ID = '@157fqxej'; // <-- 把這裡替換成你的 LINE 官方帳號（包含 @）

export default function LineAddPage() {
	const [copied, setCopied] = useState(false);

	const webUrl = `https://line.me/R/ti/p/${encodeURIComponent(LINE_ID)}`;
	const nativeUrl = `line://ti/p/${encodeURIComponent(LINE_ID)}`;
	const qrSrc = `https://qr-official.line.me/gs/M_157fqxej_GW.png`;

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(LINE_ID);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// 若 clipboard API 不可用可提示使用者手動複製
			alert('複製失敗，請手動複製 LINE 帳號');
		}
	};

	return (
		<>
			<Head>
				<title>加入 LINE 好友</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<div style={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
				padding: '2rem 1rem'
			}}>
				<main style={{
					maxWidth: '800px',
					margin: '0 auto',
					background: 'rgba(255, 255, 255, 0.95)',
					borderRadius: '24px',
					padding: '3rem 2rem',
					boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
					backdropFilter: 'blur(10px)',
					border: '1px solid rgba(255, 255, 255, 0.2)'
				}}>
					<div style={{ textAlign: 'center', marginBottom: '3rem' }}>
						<h1 style={{
							fontSize: '2.5rem',
							fontWeight: '700',
							background: 'linear-gradient(135deg, #00c300, #00a700)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
							marginBottom: '1rem',
							lineHeight: '1.2'
						}}>
							加入我們的 LINE 好友
						</h1>
						<p style={{
							color: '#64748b',
							fontSize: '1.1rem',
							lineHeight: '1.6',
							maxWidth: '700px',
							margin: '0 auto'
						}}>
							使用下列連結或掃描 QR Code 加入官方 LINE 帳號，加入後可收到最新消息與服務通知
						</p>
					</div>

					<section style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '3rem',
						alignItems: 'center'
					}}>
						<div style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center'
						}}>
							<div style={{
								background: 'white',
								padding: '1.5rem',
								borderRadius: '20px',
								boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
								border: '1px solid #e5e7eb'
							}}>
								<img
									src={qrSrc}
									alt="LINE 加入好友 QR Code"
									style={{
										width: '220px',
										height: '220px',
										borderRadius: '12px',
										display: 'block'
									}}
								/>
							</div>
						</div>

						<div>
							<div style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '16px',
								marginBottom: '2rem',
								border: '1px solid #e2e8f0'
							}}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '0.5rem'
								}}>
									<span style={{
										fontSize: '1.1rem',
										fontWeight: '600',
										color: '#374151'
									}}>
									    LINE 帳號
									</span>
								</div>
								<span style={{
									fontFamily: 'Monaco, "SF Mono", "Roboto Mono", monospace',
									fontSize: '1.2rem',
									color: '#059669',
									fontWeight: '600',
									background: '#ecfdf5',
									padding: '0.5rem 1rem',
									borderRadius: '8px',
									display: 'inline-block'
								}}>
									{LINE_ID}
								</span>
							</div>

							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem'
							}}>
								<a
									href={webUrl}
									target="_blank"
									rel="noopener noreferrer"
									style={{
										background: 'linear-gradient(135deg, #00c300, #00a700)',
										color: 'white',
										padding: '1rem 1.5rem',
										borderRadius: '12px',
										textDecoration: 'none',
										fontWeight: '600',
										fontSize: '1rem',
										textAlign: 'center',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										transition: 'all 0.3s ease',
										boxShadow: '0 4px 12px rgba(0, 195, 0, 0.3)',
										border: 'none'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = 'translateY(-2px)';
										e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 195, 0, 0.4)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 195, 0, 0.3)';
									}}
									aria-label="用 Web 開啟加入 LINE 好友"
								>
									🌐 以網頁加入
								</a>

								<a
									href={nativeUrl}
									style={{
										background: 'linear-gradient(135deg, #1f2937, #374151)',
										color: 'white',
										padding: '1rem 1.5rem',
										borderRadius: '12px',
										textDecoration: 'none',
										fontWeight: '600',
										fontSize: '1rem',
										textAlign: 'center',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										transition: 'all 0.3s ease',
										boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)',
										border: 'none'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = 'translateY(-2px)';
										e.currentTarget.style.boxShadow = '0 8px 20px rgba(31, 41, 55, 0.4)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.3)';
									}}
									aria-label="以 LINE 應用程式加入好友"
								>
									📱 用 LINE App 開啟
								</a>

								<button
									onClick={copyToClipboard}
									style={{
										background: copied ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
										color: copied ? 'white' : '#374151',
										border: copied ? 'none' : '2px solid #d1d5db',
										padding: '1rem 1.5rem',
										borderRadius: '12px',
										cursor: 'pointer',
										fontWeight: '600',
										fontSize: '1rem',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										transition: 'all 0.3s ease',
										boxShadow: copied ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
									}}
									onMouseEnter={(e) => {
										if (!copied) {
											e.currentTarget.style.background = '#f9fafb';
											e.currentTarget.style.borderColor = '#9ca3af';
										}
										e.currentTarget.style.transform = 'translateY(-2px)';
									}}
									onMouseLeave={(e) => {
										if (!copied) {
											e.currentTarget.style.background = 'white';
											e.currentTarget.style.borderColor = '#d1d5db';
										}
										e.currentTarget.style.transform = 'translateY(0)';
									}}
									aria-label="複製 LINE 帳號"
								>
									{copied ? '✅ 已複製' : '📋 複製帳號'}
								</button>
							</div>

							<div style={{
								marginTop: '2rem',
								background: '#fef3c7',
								border: '1px solid #fcd34d',
								borderRadius: '12px',
								padding: '1rem 1.25rem',
								color: '#92400e',
								fontSize: '0.9rem',
								lineHeight: '1.5'
							}}>
								💡 <strong>提示：</strong>若使用桌面瀏覽器無法直接開啟 LINE App，請掃描上方 QR Code 或複製帳號後在手機上搜尋加入。
							</div>
						</div>
					</section>
				</main>
			</div>
		</>
	);
}