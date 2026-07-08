"use client";

import { useState, useEffect } from "react";

interface ServiceStats {
  total: number;
  today: number;
  uniqueClients: number;
  byMode: Array<{ mode: string; count: number }>;
  byLevel: Array<{ level: string; count: number }>;
  demoStats: Array<{ is_demo: number; count: number }>;
  last7Days: Array<{ date: string; count: number }>;
}

interface StatsData {
  neko: ServiceStats;
  taffy: ServiceStats;
}

const modeNames: Record<string, string> = {
  soft: "软萌猫娘",
  tsundere: "傲娇猫娘",
  cool: "高冷猫娘",
  energetic: "元气猫娘",
};

const levelNames: Record<string, string> = {
  short: "短回复",
  medium: "中回复",
  long: "长回复",
};

const taffyLevelNames: Record<string, string> = {
  single: "单轮对话",
  multi: "多轮对话",
};

function NekoSection({ stats }: { stats: ServiceStats }) {
  const maxModeCount = Math.max(...stats.byMode.map((m) => m.count), 1);
  const maxLevelCount = Math.max(...stats.byLevel.map((l) => l.count), 1);
  const maxDayCount = Math.max(...stats.last7Days.map((d) => d.count), 1);

  const demoCount = stats.demoStats.find((d) => d.is_demo === 1)?.count || 0;
  const realCount = stats.demoStats.find((d) => d.is_demo === 0)?.count || 0;
  const totalDemoReal = demoCount + realCount || 1;

  return (
    <div className="stats-service">
      <div className="stats-header">
        <h1>猫娘翻译器 · 数据统计</h1>
        <p>Neko Translator Analytics</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{stats.total.toLocaleString()}</div>
          <div className="stat-label">总翻译次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.today.toLocaleString()}</div>
          <div className="stat-label">今日翻译</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.uniqueClients.toLocaleString()}</div>
          <div className="stat-label">独立用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {realCount > 0 ? ((realCount / totalDemoReal) * 100).toFixed(1) : "0"}%
          </div>
          <div className="stat-label">正式模式占比</div>
        </div>
      </div>

      <div className="stats-section">
        <h2>最近 7 天</h2>
        <div className="chart-bar">
          {stats.last7Days.length > 0 ? (
            stats.last7Days.map((day) => (
              <div key={day.date} className="bar-item">
                <div className="bar-wrapper">
                  <div className="bar-fill" style={{ height: `${(day.count / maxDayCount) * 100}%` }}>
                    <span className="bar-value">{day.count}</span>
                  </div>
                </div>
                <div className="bar-label">{day.date.slice(5)}</div>
              </div>
            ))
          ) : (
            <div className="chart-empty">暂无数据</div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-section">
          <h2>猫娘性格分布</h2>
          <div className="distribution-list">
            {stats.byMode.length > 0 ? stats.byMode.map((item) => (
              <div key={item.mode} className="distribution-item">
                <div className="distribution-label">
                  <span>{modeNames[item.mode] || item.mode}</span>
                  <span className="distribution-count">{item.count}</span>
                </div>
                <div className="distribution-bar">
                  <div className="distribution-fill" style={{ width: `${(item.count / maxModeCount) * 100}%` }} />
                </div>
              </div>
            )) : <div className="chart-empty">暂无数据</div>}
          </div>
        </div>
        <div className="stats-section">
          <h2>回复长度分布</h2>
          <div className="distribution-list">
            {stats.byLevel.length > 0 ? stats.byLevel.map((item) => (
              <div key={item.level} className="distribution-item">
                <div className="distribution-label">
                  <span>{levelNames[item.level] || item.level}</span>
                  <span className="distribution-count">{item.count}</span>
                </div>
                <div className="distribution-bar">
                  <div className="distribution-fill" style={{ width: `${(item.count / maxLevelCount) * 100}%` }} />
                </div>
              </div>
            )) : <div className="chart-empty">暂无数据</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaffySection({ stats }: { stats: ServiceStats }) {
  const maxDayCount = Math.max(...stats.last7Days.map((d) => d.count), 1);

  return (
    <div className="stats-service">
      <div className="stats-header">
        <h1>塔菲聊天 · 数据统计</h1>
        <p>Taffy Chat Analytics</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{stats.total.toLocaleString()}</div>
          <div className="stat-label">总消息数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.today.toLocaleString()}</div>
          <div className="stat-label">今日消息</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.uniqueClients.toLocaleString()}</div>
          <div className="stat-label">独立用户</div>
        </div>
      </div>

      <div className="stats-section">
        <h2>最近 7 天</h2>
        <div className="chart-bar">
          {stats.last7Days.length > 0 ? (
            stats.last7Days.map((day) => (
              <div key={day.date} className="bar-item">
                <div className="bar-wrapper">
                  <div className="bar-fill" style={{ height: `${(day.count / maxDayCount) * 100}%` }}>
                    <span className="bar-value">{day.count}</span>
                  </div>
                </div>
                <div className="bar-label">{day.date.slice(5)}</div>
              </div>
            ))
          ) : (
            <div className="chart-empty">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <main className="stats-page">
        <div className="stats-container">
          <div className="stats-loading">
            <div className="cat-ear-loader"><span /><span /></div>
            <p>正在加载统计数据...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="stats-page">
        <div className="stats-container">
          <div className="stats-error"><p>加载失败：{error}</p></div>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  return (
    <main className="stats-page">
      <div className="stats-container">
        <NekoSection stats={stats.neko} />
        <div className="stats-divider" />
        <TaffySection stats={stats.taffy} />
        <div className="stats-footer">
          <div className="stats-footer-links">
            <a href="/">← 猫娘翻译器</a>
            <a href="/taffy-chat">→ 塔菲聊天</a>
          </div>
          <span>数据每分钟更新</span>
        </div>
      </div>
    </main>
  );
}
