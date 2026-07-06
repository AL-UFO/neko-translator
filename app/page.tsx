"use client";
import { useState, useEffect, useRef } from "react";
import type { CatgirlMode, ReplyLevel } from "@/lib/prompt";

const modes: Array<{
  id: CatgirlMode;
  title: string;
  mark: string;
  description: string;
}> = [
  {
    id: "soft",
    title: "软萌猫娘",
    mark: "萌",
    description: "温柔撒娇，软乎乎",
  },
  {
    id: "tsundere",
    title: "傲娇猫娘",
    mark: "傲",
    description: "嘴硬心软，别扭关心",
  },
  {
    id: "cool",
    title: "高冷猫娘",
    mark: "冷",
    description: "克制简洁，淡淡可爱",
  },
  {
    id: "energetic",
    title: "元气猫娘",
    mark: "元",
    description: "活泼热情，充满精神",
  },
];

const levels: Array<{ id: ReplyLevel; title: string; description: string }> = [
  { id: "short", title: "短回复", description: "一句话搞定" },
  { id: "medium", title: "中回复", description: "两三句话说完" },
  { id: "long", title: "长回复", description: "展开说一段" },
];

const examples = [
  "今天好累啊，不想上班",
  "疯狂星期四，谁请我吃饭",
  "这个东西也太离谱了吧",
  "你能不能帮我写个作业",
];

const principles = [
  {
    index: "01",
    title: "猫娘为本",
    description: "所有输出都是猫娘在说话的感觉，不是普通 AI 回复。",
  },
  {
    index: "02",
    title: "只改不答",
    description: "不会回答你的问题，只会把你说的话改成猫娘语气。",
  },
  {
    index: "03",
    title: "原意保留",
    description: "不管怎么改写，你原本的意思、情绪和立场都不会变。",
  },
  {
    index: "04",
    title: "四种性格",
    description: "软萌、傲娇、高冷、元气，总有一款适合你。",
  },
];

const modeMap: Record<CatgirlMode, string> = {
  soft: "软萌",
  tsundere: "傲娇",
  cool: "高冷",
  energetic: "元气",
};
const levelMap: Record<ReplyLevel, string> = {
  short: "短回复",
  medium: "中回复",
  long: "长回复",
};

export default function Page() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CatgirlMode>("soft");
  const [level, setLevel] = useState<ReplyLevel>("medium");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setNavHidden(y > 80 && y > lastScrollY.current);
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <>
      {/* 背景漂浮装饰 */}
      <div className="bg-decor" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* 1. 顶部导航栏 */}
      <nav className={`nav${navHidden ? " nav-hidden" : ""}`}>
        <div className="nav-brand">
          <span className="logo">🐱</span>
          <span className="nav-name">猫娘翻译器</span>
          <span className="nav-sub">Neko Translator</span>
        </div>
        <div className="nav-links">
          <a href="#translator">翻译</a>
          <a href="#about">关于</a>
          <span className="nav-tag">v1.0</span>
        </div>
      </nav>

      <div className="page">
        {/* 2. Hero 区域 */}
        <section className="hero" id="top">
          <div className="hero-bg" aria-hidden="true">
            <span className="hero-glow glow-a" />
            <span className="hero-glow glow-b" />
            <span className="ic-paw decor d1">🐾</span>
            <span className="ic-paw decor d2">🐾</span>
            <span className="ic-star decor d3">✨</span>
            <span className="ic-star decor d4">✨</span>
            <span className="side-text left">嘴硬心软</span>
            <span className="side-text right">软萌可爱</span>
          </div>

          <div className="hero-image-wrap" aria-hidden="true">
            <img className="hero-image" src="/hero-neko.png" alt="" />
            <span className="hero-image-mask" />
          </div>

          <div className="hero-inner">
            <div className="hero-text">
              <span className="hero-label">二次元猫娘语气转换器</span>
              <h1 className="hero-title">
                把普通中文
                <br />
                <em>翻译成猫娘语</em>
              </h1>
              <p className="hero-sub">
                输入一句平平无奇的话，选个你喜欢的猫娘性格，一秒变身软萌可爱~
              </p>
              <a className="hero-cta" href="#translator">
                开始翻译喵
                <span className="arrow" />
              </a>
            </div>
          </div>
        </section>

        {/* 3. 翻译器区域 */}
        <section className="translator-section" id="translator">
          <h2 className="section-title">✨ 翻译工坊</h2>
          <div className="translator">
            {/* 左侧 - 输入 */}
            <div className="panel input-panel">
              <div className="panel-head">
                <div className="panel-head-left">
                  <span className="panel-icon">📝</span>
                  <span className="panel-title">输入你想说的话</span>
                </div>
                <span className="cat-chip">喵~</span>
              </div>

              <div className="textarea-wrap">
                <textarea
                  className="input"
                  placeholder="在这里输入想改成猫娘语的话..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value.slice(0, 300));
                    setError("");
                  }}
                />
                <span className="count">{text.length} / 300</span>
              </div>

              <div className="examples">
                <span className="examples-label">试试这些：</span>
                <div className="examples-btns">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      className="example-btn"
                      onClick={() => {
                        setText(ex.slice(0, 300));
                        setError("");
                      }}
                      type="button"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider-label">🐾 猫娘性格</div>
              <div className="modes">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    className={`mode-btn${mode === m.id ? " selected" : ""}`}
                    onClick={() => setMode(m.id)}
                    type="button"
                  >
                    <span className="mark">{m.mark}</span>
                    <span className="mode-info">
                      <strong>{m.title}</strong>
                      <small>{m.description}</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="divider-label">📏 回复长度</div>
              <div className="levels">
                {levels.map((l) => (
                  <button
                    key={l.id}
                    className={`level-btn${level === l.id ? " selected" : ""}`}
                    onClick={() => setLevel(l.id)}
                    type="button"
                  >
                    <strong>{l.title}</strong>
                    <small>{l.description}</small>
                  </button>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                className="translate-button"
                onClick={translate}
                disabled={!text.trim() || loading}
                type="button"
              >
                {loading ? (
                  <span className="loading-text">
                    <span className="dots" aria-label="加载中">
                      <span />
                      <span />
                      <span />
                    </span>
                    猫娘正在思考中...
                  </span>
                ) : (
                  <>
                    <span className="btn-dec">✨</span>
                    开始翻译喵
                    <span className="arrow" />
                  </>
                )}
              </button>
            </div>

            {/* 右侧 - 输出 */}
            <div className="panel output-panel">
              <div className="panel-head">
                <div className="panel-head-left">
                  <span className="panel-icon">✨</span>
                  <span className="panel-title">猫娘的回复</span>
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
                    <div className="result-content">
                      {result
                        .split("\n")
                        .map((p, i) =>
                          p ? <p key={i}>{p}</p> : <br key={i} />,
                        )}
                    </div>

                    <div className="result-actions">
                      <button
                        className="action-btn"
                        onClick={copyResult}
                        type="button"
                      >
                        {copied ? "已复制 ✓" : "复制结果"}
                      </button>
                      <button
                        className="action-btn"
                        onClick={translate}
                        disabled={loading}
                        type="button"
                      >
                        重新生成
                      </button>
                    </div>

                    <div className="result-meta">
                      <span>{modeMap[mode]} · {levelMap[level]}</span>
                      <span>{model && `${model}`}</span>
                      {isDemo && <span className="demo-tag">演示模式</span>}
                    </div>
                  </>
                ) : (
                  <div className="empty-result">
                    <span className="empty-icon">🌸</span>
                    <p>还没有猫娘回复哦~</p>
                    <small>在左边输入文字，点翻译试试</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. 原理说明区 */}
        <section className="principles-section" id="about">
          <h2 className="section-title center">✨ 为什么用猫娘翻译器</h2>
          <div className="principles-grid">
            {principles.map((p) => (
              <article className="principle-card" key={p.index}>
                <span className="principle-num">{p.index}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* 5. 页脚 */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo">🐱</span>
            <div className="footer-text">
              <strong>猫娘翻译器</strong>
              <small>Neko Translator</small>
            </div>
          </div>
          <div className="footer-disclaimer">
            <p>本工具仅用于语言娱乐与趣味创作，生成内容由 AI 产出，请自行判断与核实。</p>
          </div>
          <div className="footer-links">
            <a href="#translator">翻译</a>
            <a href="#about">关于</a>
            <a
              href="https://github.com/AL-UFO/neko-translator"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
