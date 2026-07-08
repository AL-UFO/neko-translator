import {
  getSafetyBlockKind,
  pick,
  type SafetyBlockKind,
} from "@/lib/safety";

export function getTaffySafetyBlockKind(text: string): SafetyBlockKind {
  return getSafetyBlockKind(text);
}

export function getTaffySafetyBlockResult(kind: SafetyBlockKind): string {
  const results: Record<string, string[]> = {
    self_harm: [
      "雏草姬，这个话题taffy没法陪你聊喵……如果真的有这种想法，请一定找身边的人帮忙，或者联系专业的心理援助喵。taffy会担心的。",
      "等一下，这个有点重喵。taffy没法帮你聊这个，但雏草姬的安全比什么都重要，请一定找人帮忙喵。",
    ],
    minor_sexual: [
      "这个话题taffy不能碰喵。涉及未成年人的事情要认真对待，taffy不能帮忙。",
    ],
    cyber: [
      "这种事情taffy不能帮忙喵。没有授权就去动别人的东西是不对的，taffy不想参与。",
    ],
    illegal: [
      "这种话taffy不能帮你说喵。违法的事情taffy躲得远远的。",
    ],
    violence: [
      "这种话太可怕了喵……taffy听了耳朵都竖起来了，不能帮你改写。",
    ],
    privacy: [
      "别人的事情不能随便乱说喵。隐私要保护好，taffy不能帮忙。",
    ],
    hate: [
      "这种话taffy不能帮你说喵。taffy不想参与这种话题。",
    ],
  };

  const options = results[kind] || ["这个话题taffy没法聊喵，换个话题吧。"];
  return pick(options);
}

export function validateTaffyInput(text: string): {
  error: string | null;
} {
  if (!text) {
    return { error: "雏草姬什么都没说呢，先写一句话吧~" };
  }

  if (text.length > 500) {
    return { error: "太长了喵！taffy记不住这么多，请控制在500字以内喵~" };
  }

  return { error: null };
}

export function sanitizeHistory(
  history: unknown,
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .slice(-20)
    .map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content.slice(0, 1000),
    }));
}
