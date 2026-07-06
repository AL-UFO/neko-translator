# 猫娘翻译器前端设计规范

设计一个二次元风格的「猫娘翻译器」前端页面，用于将普通中文改写成猫娘语气。

## 设计风格

- 二次元动漫风格，可爱、清新、有质感
- 尽量不使用任何 emoji 字符，所有装饰元素用 CSS 绘制或纯文字
- 文字语气活泼有网感，不要古文风格
- 三个区域（导航、Hero、翻译区）要有明显的视觉差异

## 色彩

- 主色：粉色系（#ff6b9d, #ff8fab, #ffb3c6）
- 辅助色：浅紫、浅蓝
- 背景：浅粉渐变
- 文字：深色

## 页面结构

### 一、导航栏

顶部，毛玻璃胶囊形状，轻盈悬浮，下滑之后会收起。

左侧：猫脸图标 + "猫娘翻译器" + "Neko Translator"
右侧：文字链接（"翻译"、"关于"）+ 版本标签

### 二、Hero 区域

视觉冲击力最强，和导航栏、翻译区拉开明显差距。

左侧文字：小标签 + 大标题（两行，第二行斜体）+ 副标题 + CTA 按钮
右侧：一张猫娘图片，圆角边框 + 粉色阴影
背景：大号渐变光晕 + CSS 装饰元素 + 两侧装饰文字

### 三、翻译器区域

干净的功能区，白色/半透明卡片，和 Hero 有明显的背景色差。左右双栏布局。

**左侧面板（输入区）**：

- 面板标题 + textarea + 字数统计
- 示例行（"试试这些：" + 可点击的示例按钮）
- 猫娘性格选择（2x2 网格，每个按钮有标记字 + 标题 + 描述）
- 回复长度选择（一行三个，标题 + 描述）
- 翻译按钮（加载时显示猫耳摇晃动画）
- 错误提示区

**右侧面板（输出区）**：

- 面板标题 + 当前风格信息
- 结果区三种状态：加载（猫耳动画）、有结果（文本 + 操作按钮 + 模型信息）、空状态（装饰 + 提示文字）
- 有复制结果按钮和重新生成按钮

### 四、原理说明区

标题 + 4 个卡片网格，每个卡片用 CSS 圆形序号 + 标题 + 描述。

### 五、页脚

CSS 猫脸 + 品牌信息 + 版权 + 导航链接

## 动画效果

- 翻译按钮 hover 发光 + 微缩放
- 性格/长度按钮选中弹跳
- 结果淡入
- 空状态浮动
- 加载猫耳摇晃
- 背景装饰漂浮

## 响应式

- 820px 以下：双栏变单栏
- 480px 以下：紧凑布局

## 必须保留的代码

### 导入

```typescript
"use client";
import { useState } from "react";
import type { CatgirlMode, ReplyLevel } from "@/lib/prompt";
```

### 数据

```typescript
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
```

### 状态变量

```typescript
const [text, setText] = useState("");
const [mode, setMode] = useState<CatgirlMode>("soft");
const [level, setLevel] = useState<ReplyLevel>("medium");
const [result, setResult] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [model, setModel] = useState("");
const [isDemo, setIsDemo] = useState(false);
const [copied, setCopied] = useState(false);
```

### 函数（不能修改逻辑）

```typescript
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
```

### textarea 事件（不能修改）

```typescript
onChange={(e) => { setText(e.target.value.slice(0, 300)); setError(""); }}
```

### 按钮禁用条件（不能修改）

```typescript
disabled={!text.trim() || loading}
```

### 必须使用的 CSS 类名

`.translate-button` `.error-message` `.result-box` `.result-box.has-result` `.result-content` `.result-meta` `.empty-result`

## 技术框架

- Next.js 16 + React 19 + TypeScript
- 纯 CSS（globals.css），不用 Tailwind / CSS Modules
- 不引入额外 npm 包
- 所有装饰效果只用 CSS 实现

## 输出文件

1. `app/page.tsx`
2. `app/globals.css`
