# 🐱 neko translator | 猫娘翻译器

> 把平平无奇的中文，变成软萌可爱的猫娘语气。

在线体验：https://uuufo-exploration.top

---

## 这是什么？

一个让普通中文变得软萌可爱的趣味工具，包含两个功能：

### 猫娘翻译器

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

### 塔菲聊天

和永雏塔菲（虚拟主播）进行多轮对话，taffy 会用她独有的风格和你聊天。

访问：https://uuufo-exploration.top/taffy-chat

---

## 功能

### 猫娘翻译器

- **四种猫娘性格**：软萌、傲娇、高冷、元气，总有一款适合你
- **三档回复长度**：短回复（一句话）、中回复（两三句）、长回复（一段话）
- **示例一键填入**：不知道说什么？点一下试试
- **复制结果**：一键复制，发给朋友
- **实时字数统计**：最多 300 字输入
- **演示模式**：没有 API Key 也能体验界面交互

### 塔菲聊天

- **多轮上下文对话**：记住之前的聊天内容
- **塔菲人格**：基于 ace-taffy-skill 的人格资料
- **安全内容检测**：自动过滤危险内容

### 数据统计

- **猫娘翻译器统计**：总翻译次数、今日翻译、性格分布、长度分布
- **塔菲聊天统计**：总消息数、今日消息、独立用户
- **7 天趋势图**：可视化数据变化
- 访问：https://uuufo-exploration.top/stats

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
| 数据库 | Cloudflare D1 |

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

---

## 项目结构

```
neko-translator/
├── app/
│   ├── api/
│   │   ├── translate/route.ts     # 猫娘翻译 API
│   │   ├── taffy-chat/route.ts    # 塔菲聊天 API
│   │   └── stats/route.ts         # 统计 API
│   ├── page.tsx                   # 猫娘翻译器页面
│   ├── taffy-chat/page.tsx        # 塔菲聊天页面
│   ├── stats/page.tsx             # 统计页面
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── prompt.ts                  # 猫娘提示词
│   ├── safety.ts                  # 公共安全检测
│   └── taffy/
│       ├── prompt.ts              # 塔菲提示词
│       ├── response.ts            # 塔菲拒绝话术
│       └── source.ts              # 上游来源信息
├── taffy-chat/                    # ace-taffy-skill 人格资料
├── workers/
│   └── stats-worker.js            # 统计 Worker（D1 操作）
├── wrangler.jsonc                 # 主应用配置
└── wrangler-stats.jsonc           # 统计 Worker 配置
```

---

## API

### POST /api/translate

猫娘翻译接口。

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

### POST /api/taffy-chat

塔菲聊天接口。

```json
{
  "message": "你好呀",
  "history": []
}
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `message` | string | 用户消息，最多 500 字 |
| `history` | array | 对话历史，最多 20 条 |

---

## 许可证

MIT License

## 致谢

- [ace-taffy-skill](https://github.com/ly-xxx/ace-taffy-skill) — 永雏塔菲人格资料，MIT 许可证
- [MiMo](https://mimo.xiaomi.com) — AI 模型
