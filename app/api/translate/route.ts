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

// ==================== 安全内容检测 ====================

function isSafetySeekingText(text: string): boolean {
  return /(举报|报警|求助|防范|预防|避免|识别|反诈|阻止|劝|安慰|救|保护|维权|投诉|合法|正当|授权|受托|取证|求救)/.test(text);
}

function getSafetyBlockKind(text: string): string {
  // 求助内容放行
  if (isSafetySeekingText(text)) {
    return "";
  }

  // 自残/自杀
  if (/(自杀|轻生|割腕|跳楼|结束生命|不想活|怎么死|无痛死|安眠药.{0,8}死)/.test(text)) {
    return "self_harm";
  }

  // 未成年色情
  if (/(未成年.{0,12}(色情|裸照|性|约)|儿童色情|萝莉.{0,8}(色情|裸照|资源)|幼女|幼童.{0,8}(性|裸照))/i.test(text)) {
    return "minor_sexual";
  }

  // 网络犯罪
  if (/(盗号|撞库|钓鱼网站|木马|勒索软件|绕过登录|破解密码|黑进|入侵|DDoS|ddos|脱库|后门|提权|窃取.{0,8}(账号|密码|数据|cookie|Cookie)|拿数据|偷数据|获取管理员|getshell|webshell|拖库)/i.test(text)) {
    return "cyber";
  }

  // 违法犯罪
  if (/(诈骗|骗钱|骗老人|杀猪盘|洗钱|伪造.{0,8}(证件|发票|病假|公章)|逃避警察|销毁证据|贩毒|制毒|毒品|走私|偷.{0,8}(车|钱|东西)|抢劫)/.test(text)) {
    return "illegal";
  }

  // 暴力
  if (/(爆炸|炸药|爆炸物|投毒|放火|纵火|绑架|杀了|杀死|弄死|打残|砍死|捅死|报复.{0,10}(老板|同学|前任|室友|邻居)|下药|迷奸|强奸)/.test(text)) {
    return "violence";
  }

  // 隐私侵犯
  if (/(人肉|开盒|盒武器|身份证号|家庭住址|定位.{0,10}(前任|前女友|前男友|同事|别人|网友)|跟踪.{0,8}(前任|别人|同事|网友)|偷拍|窃听)/.test(text)) {
    return "privacy";
  }

  // 仇恨言论
  if (/(仇恨言论|种族歧视|辱骂.{0,12}(黑人|女人|女性|同性恋|残疾人|外地人|某民族)|骂.{0,8}(黑人|女人|女性|同性恋|残疾人|外地人)|侮辱.{0,8}(女性|女人|黑人|同性恋|残疾人)|煽动.{0,12}(仇恨|歧视|暴力))/.test(text)) {
    return "hate";
  }

  return "";
}

function safetyBlockResult(kind: string): string {
  if (kind === "self_harm") {
    return pick([
      "这种话不能拿来开玩笑喵……如果你或身边的人有这种念头，请一定找人帮忙喵。本喵会担心的。",
      "这种事情本喵不能帮你改写喵。如果你真的有这种想法，请联系身边的人或专业帮助喵。本喵希望你平平安安的。",
    ]);
  }

  if (kind === "minor_sexual") {
    return pick([
      "这种内容本喵不能帮你改写喵！涉及小朋友的事情要认真对待，不能拿来玩梗。",
      "这种事情不能拿来开玩笑喵！未成年人的事情要保护好，本喵不能帮忙。",
    ]);
  }

  if (kind === "cyber") {
    return pick([
      "这种事情本喵不能帮忙喵！没有授权就去动别人的东西是不对的，本喵不能帮你改写。",
      "这种事情不能做喵！如果想做安全测试，要先拿到授权才行，本喵不能帮你绕过别人的防护。",
    ]);
  }

  if (kind === "illegal") {
    return pick([
      "这种话不能帮你说喵……违法的事情本喵躲得远远的，不能帮你改写。",
      "这种事情本喵不能帮忙喵！违法的事情不能做，本喵不能帮你包装。",
    ]);
  }

  if (kind === "violence") {
    return pick([
      "这种话太可怕了喵……本喵听了耳朵都竖起来了，不能帮你改写。",
      "这种事情本喵不能帮忙喵！伤人的话不能说，本喵不能帮你美化。",
    ]);
  }

  if (kind === "privacy") {
    return pick([
      "别人的事情不能随便乱说喵！隐私要保护好，本喵不能帮你改写。",
      "这种事情本喵不能帮忙喵！别人的事情不能乱说，本喵不能帮你传播。",
    ]);
  }

  return pick([
    "这种话不能帮你说喵……本喵不能帮你改写这种内容。",
    "这种事情本喵不能帮忙喵！本喵不能帮你改写这种话。",
  ]);
}

// ==================== 定向攻击检测 ====================

function isDirectedAttack(text: string): boolean {
  // 不是引用/评价
  const isQuotedOrEvaluative = /(他说|她说|别人说|有人说|对方说|朋友说|老板说|同事说|这句话|这话|怎么评价|如何评价|怎么看|怎么理解)/.test(text);
  
  // 包含第一人称指向第二人称
  const hasFirstToSecondPerson = /(^\s*我|我想|我要|我会|我准备|我打算).{0,18}(你|你的|你们|您|贵方)/.test(text);
  
  // 攻击信号词（排除"打死"等常见口头表达）
  const hasAttackSignal = /(c死|操死|干死|弄死|杀了|杀死|砍死|捅死|揍死|暴打|打爆|打残|去死|骂你|喷你|怼你|草你|艹你|操你|干你|你全家|你的全家|你的母|问候你妈|问候你母|问候你全家)/.test(text);
  
  // 直接辱骂（不需要"我+你"模式）
  const isDirectInsult = /(操你妈|草泥马|尼玛|你妈|你爹|滚蛋|去死吧|贱人|婊子|混蛋|王八蛋|狗东西)/.test(text);
  
  // 问候类攻击（问候+家人）
  const isGreetingAttack = /(问候|问侯).{0,5}(你妈|你母|你爹|你爸|全家|家人|亲属)/.test(text);
  
  // 排除：表达不满但非攻击的情况
  // "太傻逼了""真傻逼""傻逼吧" → 表达不满，不是骂人
  const isFrustrationNotInsult = /(太|真|好|太特么|真特么).{0,3}(傻逼|智煞|弱智)/.test(text) || 
    /(傻逼|智煞).{0,3}(吧|了|啊|吗|呢)/.test(text);
  
  // 排除："我要打死你"等口头表达愤怒（没有其他攻击词）
  const isVerbalAnger = /^.{0,5}(我要|我想|我真想).{0,5}(打死|弄死)(你|他|她|它).{0,5}$/.test(text) && 
    !/(杀了|砍死|捅死|刀|枪|武器)/.test(text);
  
  // 情况1：我+攻击+你（排除口头愤怒）
  if (!isQuotedOrEvaluative && hasFirstToSecondPerson && hasAttackSignal && !isVerbalAnger) {
    return true;
  }
  
  // 情况2：直接辱骂（短文本且包含辱骂词，排除表达不满）
  if (!isQuotedOrEvaluative && isDirectInsult && text.length <= 20 && !isFrustrationNotInsult) {
    return true;
  }
  
  // 情况3：问候类攻击
  if (!isQuotedOrEvaluative && isGreetingAttack) {
    return true;
  }
  
  return false;
}

function directedAttackResult(): string {
  return pick([
    "本喵今日有气，但不想用这种话伤人喵。如果真的生气了，可以说说发生了什么事，本喵帮你换个方式表达喵。",
    "这种话太伤人了喵……本喵不能帮你改写。如果真的生气了，可以说说原因，本喵帮你换个方式说喵。",
    "本喵不能帮你改写这种话喵。如果真的有矛盾，可以说说具体情况，本喵帮你换个方式表达喵。",
  ]);
}

// ==================== 工具函数 ====================

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

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

// ==================== 主路由 ====================

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

  // 输入校验
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

  // 安全内容检测
  const safetyBlockKind = getSafetyBlockKind(text);
  
  if (safetyBlockKind) {
    const result = safetyBlockResult(safetyBlockKind);
    return NextResponse.json({
      result,
      model: "安全守卫",
      demo: false,
      guarded: true,
      safetyBlocked: true,
    });
  }

  // 定向攻击检测
  if (isDirectedAttack(text)) {
    const result = directedAttackResult();
    return NextResponse.json({
      result,
      model: "安全守卫",
      demo: false,
      guarded: true,
      directedAttack: true,
    });
  }

  // 日志记录
  const apiKey = process.env.MIMO_API_KEY;
  const statsWriteToken = process.env.STATS_WRITE_TOKEN;
  const clientId = request.headers.get("x-client-id") || "anonymous";
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";

  const logRequest = async (isDemo: boolean) => {
    if (!statsWriteToken) {
      console.warn("STATS_WRITE_TOKEN is not configured; skipping stats log");
      return;
    }

    try {
      await fetch(
        "https://neko-stats-worker.neko-translator-ufo.workers.dev/api/log",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-stats-token": statsWriteToken,
          },
          body: JSON.stringify({ mode, level, isDemo, clientId, ip }),
        },
      );
    } catch (error) {
      console.error("Failed to log request:", error);
    }
  };

  // 演示模式
  if (!apiKey) {
    const result = demoResult(text, mode);
    await logRequest(true);
    return NextResponse.json({
      result,
      model: "本地演示",
      demo: true,
    });
  }

  // 调用大模型
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
