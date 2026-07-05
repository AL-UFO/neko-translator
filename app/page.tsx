"use client";
import { useState } from "react";
import type { CatgirlMode, ReplyLevel } from "@/lib/prompt";

const modes: Array<{ id: CatgirlMode; title: string; emoji: string }> = [
  { id: "soft", title: "软萌猫娘", emoji: "🐾" },
  { id: "tsundere", title: "傲娇猫娘", emoji: "💢" },
  { id: "cool", title: "高冷猫娘", emoji: "😎" },
  { id: "energetic", title: "元气猫娘", emoji: "⚡" },
];

const levels: Array<{ id: ReplyLevel; title: string }> = [
  { id: "short", title: "短回复" },
  { id: "medium", title: "中回复" },
  { id: "long", title: "长回复" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CatgirlMode>("soft");
  const [level, setLevel] = useState<ReplyLevel>("medium");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  async function translate() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), mode, level }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "请求失败");
      setResult(data.result);
      setModel(data.model || "");
      setIsDemo(Boolean(data.demo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后再试~");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="catgirl-page">
      <nav className="top-nav">
        <div className="brand">
          <span className="brand-icon">🐱</span>
          <span className="brand-name">Neko Translate</span>
        </div>
        <span className="brand-desc">让每句话都变得软乎乎</span>
      </nav>

      <section className="hero">
        <div className="hero-badge">Anime Catgirl Converter</div>
        <h1>猫娘翻译器</h1>
        <p>把普通的话翻译成猫娘语气</p>
      </section>

      <section className="translator-shell">
        <div className="panel input-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Input</span>
              <h2>输入普通中文</h2>
            </div>
            <span className="cat-chip">喵~</span>
          </div>

          <div className="textarea-wrap">
            <textarea
              value={text}
              placeholder="在这里输入想要改写的话，比如：今天辛苦了，早点休息。"
              onChange={(e) => {
                setText(e.target.value.slice(0, 300));
                setError("");
              }}
            />
            <div className="text-count">{text.length} / 300</div>
          </div>

          <div className="options-area">
            <div className="option-group">
              <div className="option-title">
                <span>🐾</span>
                猫娘性格
              </div>
              <div className="mode-grid">
                {modes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`choice-card ${mode === item.id ? "active" : ""}`}
                    onClick={() => setMode(item.id)}
                  >
                    <span className="choice-emoji">{item.emoji}</span>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <div className="option-title">
                <span>🍓</span>
                回复长度
              </div>
              <div className="level-row">
                {levels.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`level-button ${level === item.id ? "active" : ""}`}
                    onClick={() => setLevel(item.id)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="translate-button"
            onClick={translate}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <>
                <span className="paw-loader" />
                正在猫化中...
              </>
            ) : (
              <>
                <span>✨</span>
                开始翻译喵
              </>
            )}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="panel output-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Output</span>
              <h2>猫娘回复</h2>
            </div>
            <span className="cat-chip">ฅ^•ﻌ•^ฅ</span>
          </div>

          <div className={`result-box${result ? " has-result" : ""}`}>
            {loading ? (
              <div className="loading-state">
                <div className="cat-ear-loader">
                  <span />
                  <span />
                </div>
                <p>猫娘正在认真组织语言中...</p>
              </div>
            ) : result ? (
              <>
                <div className="result-content">{result}</div>
                <div className="result-meta">
                  {model ? `模型：${model}` : "模型：未知"}
                  {isDemo ? " · Demo 模式" : ""}
                </div>
              </>
            ) : (
              <div className="empty-result">
                <div className="empty-icon">🌸</div>
                <p>翻译后的猫娘语气会显示在这里</p>
                <span>输入文字后点击按钮试试看吧</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
