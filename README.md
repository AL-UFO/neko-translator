# 猫娘翻译器 | Neko Translate

把普通中文翻译成猫娘语气的趣味工具。

**在线体验**：https://neko-translator.neko-translator-ufo.workers.dev

## 功能

- **四种猫娘性格**：软萌、傲娇、高冷、元气
- **三档回复长度**：短回复、中回复、长回复
- **示例一键填入**：快速体验不同场景
- **复制结果**：一键复制猫娘回复
- **实时字数统计**：最多 300 字输入
- **演示模式**：无 API Key 时仍可体验界面交互

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 |
| 前端 | React 19 + TypeScript |
| 样式 | 纯 CSS（globals.css） |
| 字体 | ZCOOL KuaiLe（标题）+ HarmonyOS Sans SC（正文） |
| AI 模型 | Xiaomi MiMo-V2.5-Pro |
| 部署 | Cloudflare Workers（OpenNext） |

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/AL-UFO/neko-translator.git
cd neko-translator
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API Key

创建 `.env.local` 文件：

```bash
MIMO_API_KEY=tp-你的MiMo密钥
```

> 密钥从 [MiMo Token Plan](https://platform.xiaomimimo.com/#/console/plan-manage) 获取，格式为 `tp-xxxxx`。

### 4. 本地运行

```bash
npx next dev
```

打开 http://localhost:3000

## 部署到 Cloudflare Workers

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 设置密钥

```bash
npx wrangler secret put MIMO_API_KEY
```

### 3. 部署

```bash
npm run deploy
```

## 项目结构

```
neko-translator/
├── app/
│   ├── api/translate/route.ts   # API 接口（调用 MiMo 模型）
│   ├── page.tsx                 # 前端页面（React 组件）
│   ├── layout.tsx               # 布局组件
│   └── globals.css              # 全局样式
├── lib/
│   └── prompt.ts                # 提示词定义
├── .env.example                 # 环境变量模板
├── .gitignore
├── next.config.ts               # Next.js 配置
├── open-next.config.ts          # OpenNext 部署配置
├── package.json
├── tsconfig.json
└── wrangler.jsonc               # Cloudflare Workers 配置
```

## API 接口

### POST /api/translate

请求体：

```json
{
  "text": "今天好累啊",
  "mode": "soft",
  "level": "medium"
}
```

参数说明：

| 参数 | 类型 | 说明 |
|---|---|---|
| `text` | string | 输入文本（最多 300 字） |
| `mode` | string | 猫娘性格：`soft`（软萌）、`tsundere`（傲娇）、`cool`（高冷）、`energetic`（元气） |
| `level` | string | 回复长度：`short`（短）、`medium`（中）、`long`（长） |

成功响应：

```json
{
  "result": "本喵今天也好累喵，尾巴都快垂下来了……",
  "model": "mimo-v2.5-pro",
  "demo": false
}
```

## 许可证

MIT License
