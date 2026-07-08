# 更新历史

## v1.1

### 新增功能

- **塔菲聊天页面** (`/taffy-chat`)
  - 基于 ace-taffy-skill 的永雏塔菲 AI 人格聊天
  - 多轮上下文对话
  - 塔菲风格回复（taffy 自称、适度喵、活泼语气）
  - 清空对话功能
  - 安全内容检测（与猫娘翻译器共用公共模块）

- **数据统计系统**
  - 独立统计 Worker（Cloudflare D1 数据库）
  - 猫娘翻译器统计：总翻译次数、今日翻译、独立用户、正式模式占比、性格分布、长度分布、7 天趋势
  - 塔菲聊天统计：总消息数、今日消息、独立用户、7 天趋势
  - 统计写入接口安全校验（token 认证）
  - 统计页面 `/stats` 分区展示两个服务的数据

- **公共安全模块** (`lib/safety.ts`)
  - 7 类危险内容检测（自残、未成年色情、网络犯罪、违法、暴力、隐私、仇恨）
  - 求助内容放行
  - 通用输入校验
  - 猫娘翻译器和塔菲聊天共用

### 改进

- 统计页面区分猫娘翻译器和塔菲聊天两个独立区块
- `.gitignore` 排除 `.env.local` 防止密钥泄露

### 安全

- 统计写入接口添加 `STATS_WRITE_TOKEN` 密钥校验
- 输入字段白名单校验（mode、level、clientId、ip）
- CORS 收紧：`/api/log` 不返回开放 CORS
- 移除生产环境用户原文调试日志

### 技术细节

- Stats Worker 独立部署（`wrangler-stats.jsonc`）
- D1 数据库 `translate_logs` 表新增 `type` 列（`neko` / `taffy`）
- `lib/taffy/` 模块：`prompt.ts`、`source.ts`、`response.ts`

---

## v1.0

### 初始版本

- **猫娘翻译器**
  - 四种猫娘性格：软萌、傲娇、高冷、元气
  - 三档回复长度：短回复、中回复、长回复
  - 示例一键填入
  - 复制结果、再来一次
  - 实时字数统计（最多 300 字）
  - 演示模式（无 API Key 时可用）
  - 性格按钮显示标记字和描述文字
  - 操作按钮样式统一

- **前端**
  - 二次元粉色系风格
  - 响应式布局（双栏 → 单栏）

- **部署**
  - Next.js 16 + React 19 + TypeScript
  - Cloudflare Workers（OpenNext）
  - 自定义域名 `uuufo-exploration.top`
  - MiMo API（Xiaomi MiMo-V2.5-Pro）
