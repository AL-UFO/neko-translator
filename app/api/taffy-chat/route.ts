import { NextRequest, NextResponse } from "next/server";
import { buildTaffyMessages } from "@/lib/taffy/prompt";
import {
  getTaffySafetyBlockKind,
  getTaffySafetyBlockResult,
  validateTaffyInput,
  sanitizeHistory,
} from "@/lib/taffy/response";

export const runtime = "nodejs";

const MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions";
const MIMO_MODEL = "mimo-v2.5-pro";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callMiMoWithRetry(apiKey: string, body: Record<string, unknown>) {
  const retryDelays = [800];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      const response = await fetch(MIMO_BASE_URL, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (
        response.ok ||
        response.status < 500 ||
        attempt >= retryDelays.length
      ) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt >= retryDelays.length) throw error;
    }

    await wait(retryDelays[attempt]);
  }

  throw lastError;
}

function cleanReply(value: string): string {
  return value
    .replace(/^(好的[，,]?|以下是|这是|塔菲说[：:])[^\n]{0,30}[：:，,]?\s*/g, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  let body: {
    message?: unknown;
    history?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "数据格式不对喵，请重新输入~" },
      { status: 400 },
    );
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  // 输入校验
  const validation = validateTaffyInput(message);
  if (validation.error) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  // 安全检测
  const safetyKind = getTaffySafetyBlockKind(message);
  if (safetyKind) {
    return NextResponse.json({
      reply: getTaffySafetyBlockResult(safetyKind),
      model: "安全守卫",
      guarded: true,
    });
  }

  // 清洗 history
  const safeHistory = sanitizeHistory(body.history);

  // 获取 API Key
  const apiKey = process.env.MIMO_API_KEY;
  const statsWriteToken = process.env.STATS_WRITE_TOKEN;
  const clientId = request.headers.get("x-client-id") || "anonymous";

  const logRequest = async () => {
    if (!statsWriteToken) return;
    try {
      await fetch(
        "https://neko-stats-worker.neko-translator-ufo.workers.dev/api/log",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-stats-token": statsWriteToken,
          },
          body: JSON.stringify({
            mode: "chat",
            level: safeHistory.length > 0 ? "multi" : "single",
            isDemo: !apiKey,
            clientId,
            type: "taffy",
          }),
        },
      );
    } catch (e) {
      console.warn("Failed to log taffy request:", e);
    }
  };

  if (!apiKey) {
    return NextResponse.json({
      reply: "taffy现在有点累喵，稍后再来找taffy吧~",
      model: "未配置",
      demo: true,
    });
  }

  // 组装消息
  const messages = buildTaffyMessages(message, safeHistory);

  // 调用 MiMo
  try {
    const response = await callMiMoWithRetry(apiKey, {
      model: MIMO_MODEL,
      messages,
      max_completion_tokens: 1024,
      temperature: 0.85,
      stream: false,
      thinking: { type: "disabled" },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MiMo API error:", data);
      return NextResponse.json(
        { error: "taffy现在有点累喵，稍后再来找taffy吧~" },
        { status: 502 },
      );
    }

    const raw = data?.choices?.[0]?.message?.content?.trim() || "";
    const reply = cleanReply(raw);

    if (!reply) {
      return NextResponse.json(
        { error: "taffy没想好怎么说，再试一次吧~" },
        { status: 502 },
      );
    }

    await logRequest();

    return NextResponse.json({
      reply,
      model: MIMO_MODEL,
    });
  } catch (error) {
    console.error("Taffy chat request failed:", error);
    return NextResponse.json(
      { error: "taffy暂时迷路了，请稍后再试~" },
      { status: 502 },
    );
  }
}
