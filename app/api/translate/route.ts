import { NextRequest, NextResponse } from "next/server";
import {
  buildUserPrompt,
  SYSTEM_PROMPT,
  type CatgirlMode,
  type ReplyLevel,
} from "@/lib/prompt";

export const runtime = "nodejs";

const VALID_MODES = new Set<CatgirlMode>(["soft", "tsundere", "cool", "energetic"]);
const VALID_LEVELS = new Set<ReplyLevel>(["short", "medium", "long"]);

const MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions";
const MIMO_MODEL = "mimo-v2.5-pro";
const MIMO_MAX_TOKENS = 720;

function cleanGeneratedText(value: string) {
  return value
    .replace(
      /^(好的[，,]?|以下是|这是|帮你|我来|改写成|猫娘版[：:])[^\n]{0,40}[：:，,]?\s*/g,
      "",
    )
    .replace(/（[^）]{1,10}）/g, "")
    .replace(/\([^)]{1,10}\)/g, "")
    .replace(/^[""「」『』]{1,2}/, "")
    .replace(/[""「」『』]{1,2}$/, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function demoResult(text: string, mode: CatgirlMode) {
  const subject = text.replace(/[。！？!?]+$/g, "");

  const responses: Record<CatgirlMode, string> = {
    soft: `主人说的"${subject}"，人家听到啦~蹭蹭主人，不管什么事，本喵都会陪着你的喵~`,
    tsundere: `哼，"${subject}"什么的……才不是本喵在意的事情呢！不过……主人要是需要帮忙，本喵也不是不可以帮忙的喵！`,
    cool: `"${subject}"……嗯，知道了。别担心，有本喵在。……喵。`,
    energetic: `收到收到喵！"${subject}"这件事就交给本喵吧！本喵一定会帮主人搞定的喵喵~`,
  };

  return responses[mode] ?? responses.soft;
}

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
        signal: AbortSignal.timeout(45000),
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

async function callMiMo(
  apiKey: string,
  text: string,
  mode: CatgirlMode,
  level: ReplyLevel,
) {
  const userPrompt = buildUserPrompt(text, mode, level);

  const response = await callMiMoWithRetry(apiKey, {
    model: MIMO_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: MIMO_MAX_TOKENS,
    temperature: 0.9,
    stream: false,
    thinking: { type: "disabled" },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("MiMo API error:", data);
    return null;
  }

  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function POST(request: NextRequest) {
  let body: {
    text?: unknown;
    mode?: unknown;
    level?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "数据格式不对喵，请重新输入~" },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const mode = VALID_MODES.has(body.mode as CatgirlMode)
    ? (body.mode as CatgirlMode)
    : "soft";
  const level = VALID_LEVELS.has(body.level as ReplyLevel)
    ? (body.level as ReplyLevel)
    : "medium";

  if (!text) {
    return NextResponse.json(
      { error: "喵？主人什么都没说呢，先写一句话吧~" },
      { status: 400 },
    );
  }

  if (text.length > 300) {
    return NextResponse.json(
      { error: "太长了喵！本喵记不住这么多，请控制在300字以内喵~" },
      { status: 400 },
    );
  }

  const apiKey = process.env.MIMO_API_KEY;
  const clientId = request.headers.get("x-client-id") || "anonymous";
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";

  const logRequest = async (isDemo: boolean) => {
    try {
      await fetch(
        "https://neko-stats-worker.neko-translator-ufo.workers.dev/api/log",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, level, isDemo, clientId, ip }),
        },
      );
    } catch (error) {
      console.error("Failed to log request:", error);
    }
  };

  if (!apiKey) {
    const result = demoResult(text, mode);

    await logRequest(true);

    return NextResponse.json({
      result,
      model: "本地演示",
      demo: true,
    });
  }

  try {
    const raw = await callMiMo(apiKey, text, mode, level);
    const result = cleanGeneratedText(raw || "");

    if (!result) {
      return NextResponse.json(
        { error: "本喵没想好怎么说，再试一次吧~" },
        { status: 502 },
      );
    }

    await logRequest(false);

    return NextResponse.json({
      result,
      model: MIMO_MODEL,
      demo: false,
    });
  } catch (error) {
    console.error("Translate request failed:", error);
    return NextResponse.json(
      { error: "本喵暂时迷路了，请稍后再试~" },
      { status: 502 },
    );
  }
}
