"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "无需王座与冠冕，我即是所有平行世界的奇迹，让流星焚尽希望，独属于永雏塔菲的传说，现在开演！\n\n雏草姬来找taffy玩啦？今天想聊什么呀喵~",
};

export default function TaffyChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setInput("");
    setLoading(true);
    setError("");

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20);

      setMessages((prev) => [...prev, userMsg]);

      const response = await fetch("/api/taffy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "请求失败");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "请求失败，请稍后再试~";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `taffy暂时迷路了喵……${errorMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([WELCOME_MESSAGE]);
    setError("");
    setInput("");
  }

  return (
    <main className="taffy-chat-page">
      <nav className="taffy-chat-nav">
        <a href="/" className="taffy-chat-back">
          ← 猫娘翻译器
        </a>
        <span className="taffy-chat-title">永雏塔菲</span>
        <button
          className="taffy-chat-clear"
          onClick={clearChat}
          type="button"
          disabled={loading}
        >
          清空对话
        </button>
      </nav>

      <div className="taffy-chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`taffy-chat-bubble ${
              msg.role === "user" ? "taffy-chat-user" : "taffy-chat-assistant"
            }`}
          >
            {msg.role === "assistant" && (
              <img src="/taffy.jpg" alt="taffy" className="taffy-chat-avatar" />
            )}
            <div className="taffy-chat-bubble-content">
              {msg.content.split("\n").map((line, j) =>
                line ? <p key={j}>{line}</p> : <br key={j} />,
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="taffy-chat-bubble taffy-chat-assistant">
            <img src="/taffy.jpg" alt="taffy" className="taffy-chat-avatar" />
            <div className="taffy-chat-bubble-content">
              <div className="taffy-chat-loading">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="taffy-chat-input-area">
        <textarea
          ref={textareaRef}
          className="taffy-chat-input"
          placeholder="想对taffy说什么..."
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          maxLength={500}
          rows={1}
          disabled={loading}
        />
        <button
          className="taffy-chat-send"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          type="button"
        >
          发送
        </button>
      </div>
      <div className="taffy-chat-char-count">{input.length} / 500</div>
    </main>
  );
}
