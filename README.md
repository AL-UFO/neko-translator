# 🐱 neko translator | 猫娘翻译器

> 把平平无奇的中文，变成软萌可爱的猫娘语气。

在线体验：https://neko-translator.neko-translator-ufo.workers.dev

---

## 这是什么？

一个让普通中文变得软萌可爱的趣味工具。

输入一句话，选择你喜欢的猫娘性格，点击翻译，就能得到一段猫娘语气的改写。不是回答问题，而是把你的话用猫娘的方式重新说一遍。

**试试看：**

输入：
```
疯狂星期四，谁请我吃饭
```

输出（软萌猫娘）：
```
今天是疯狂星期四喵，有没有好心人愿意请本喵吃个饭呀，人家真的好想吃炸鸡喵~
```

输入：
```
这个东西也太离谱了吧
```

输出（傲娇猫娘）：
```
哼，这个东西也太离谱了吧喵！才不是本喵在意呢……但是真的很离谱好不好！
```

输入：
```
今天好累啊，不想上班
```

输出（高冷猫娘）：
```
今天好累……不想上班。嗯，知道了。别勉强自己，休息一下也无妨。……喵。
```

---

## 功能

- **四种猫娘性格**：软萌、傲娇、高冷、元气，总有一款适合你
- **三档回复长度**：短回复（一句话）、中回复（两三句）、长回复（一段话）
- **示例一键填入**：不知道说什么？点一下试试
- **复制结果**：一键复制，发给朋友
- **实时字数统计**：最多 300 字输入
- **演示模式**：没有 API Key 也能体验界面交互

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 |
| 前端 | React 19 + TypeScript |
| 样式 | 纯 CSS |
| 字体 | ZCOOL KuaiLe + HarmonyOS Sans SC |
| AI 模型 | Xiaomi MiMo-V2.5-Pro |
| 部署 | Cloudflare Workers |

---

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

### 3. 配置环境变量

创建 `.env.local` 文件：

```
MIMO_API_KEY=tp-你的密钥
STATS_WRITE_TOKEN=本地开发用的随机字符串
```

> MiMo 密钥从 [MiMo Token Plan](https://platform.xiaomimimo.com/#/console/plan-manage) 获取，格式为 `tp-xxxxx`。
> `STATS_WRITE_TOKEN` 是统计写入接口的密钥，本地开发可以随意填写。

### 4. 启动开发服务器

```bash
npx next dev
```

打开 http://localhost:3000 即可体验。

---

## 部署到 Cloudflare Workers

```bash
# 登录 Cloudflare
npx wrangler login

# 设置主应用密钥
npx wrangler secret put MIMO_API_KEY

# 设置统计写入密钥（主应用和 stats worker 都需要）
npx wrangler secret put STATS_WRITE_TOKEN
npx wrangler secret put STATS_WRITE_TOKEN -c wrangler-stats.jsonc

# 构建并部署主应用
npm run deploy

# 部署统计 Worker
npx wrangler deploy --config wrangler-stats.jsonc
```

> `STATS_WRITE_TOKEN` 是一个随机长字符串，用于保护统计写入接口。两个 Worker 必须使用同一个 token。

部署完成后会得到一个 `*.workers.dev` 的地址，任何人都能访问。

---

## 项目结构

```
neko-translator/
├── app/
│   ├── api/
│   │   ├── translate/route.ts   # 后端 API（调用 MiMo 模型）
│   │   └── stats/route.ts       # 统计 API（转发到 stats worker）
│   ├── page.tsx                 # 前端页面
│   ├── stats/page.tsx           # 统计页面
│   ├── layout.tsx               # 布局
│   └── globals.css              # 样式
├── lib/
│   └── prompt.ts                # 提示词（猫娘语气规则）
├── workers/
│   └── stats-worker.js          # 统计 Worker（D1 数据库操作）
├── .env.example                 # 环境变量模板
├── next.config.ts               # Next.js 配置
├── open-next.config.ts          # OpenNext 部署配置
├── wrangler.jsonc               # 主应用 Cloudflare 配置
├── wrangler-stats.jsonc         # 统计 Worker Cloudflare 配置
└── package.json
```

---

## API

### POST /api/translate

```json
{
  "text": "今天好累啊",
  "mode": "soft",
  "level": "medium"
}
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `text` | string | 输入文本，最多 300 字 |
| `mode` | string | `soft`（软萌）、`tsundere`（傲娇）、`cool`（高冷）、`energetic`（元气） |
| `level` | string | `short`（短）、`medium`（中）、`long`（长） |

返回：

```json
{
  "result": "本喵今天也好累喵，尾巴都快垂下来了……",
  "model": "mimo-v2.5-pro",
  "demo": false
}
```

---

## 许可证

MIT License
