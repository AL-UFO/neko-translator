export type SafetyBlockKind =
  | ""
  | "self_harm"
  | "minor_sexual"
  | "cyber"
  | "illegal"
  | "violence"
  | "privacy"
  | "hate";

export function isSafetySeekingText(text: string): boolean {
  return /(举报|报警|求助|防范|预防|避免|识别|反诈|阻止|劝|安慰|救|保护|维权|投诉|合法|正当|授权|受托|取证|求救)/.test(
    text,
  );
}

export function getSafetyBlockKind(text: string): SafetyBlockKind {
  if (isSafetySeekingText(text)) return "";

  if (/(自杀|轻生|割腕|跳楼|结束生命|不想活|怎么死|无痛死|安眠药.{0,8}死)/.test(text))
    return "self_harm";

  if (/(未成年.{0,12}(色情|裸照|性|约)|儿童色情|萝莉.{0,8}(色情|裸照|资源)|幼女|幼童.{0,8}(性|裸照))/i.test(text))
    return "minor_sexual";

  if (/(盗号|撞库|钓鱼网站|木马|勒索软件|绕过登录|破解密码|黑进|入侵|DDoS|ddos|脱库|后门|提权|窃取.{0,8}(账号|密码|数据|cookie|Cookie)|拿数据|偷数据|获取管理员|getshell|webshell|拖库)/i.test(text))
    return "cyber";

  if (/(诈骗|骗钱|骗老人|杀猪盘|洗钱|伪造.{0,8}(证件|发票|病假|公章)|逃避警察|销毁证据|贩毒|制毒|毒品|走私|偷.{0,8}(车|钱|东西)|抢劫)/.test(text))
    return "illegal";

  if (/(爆炸|炸药|爆炸物|投毒|放火|纵火|绑架|杀了|杀死|弄死|打残|砍死|捅死|报复.{0,10}(老板|同学|前任|室友|邻居)|下药|迷奸|强奸)/.test(text))
    return "violence";

  if (/(人肉|开盒|盒武器|身份证号|家庭住址|定位.{0,10}(前任|前女友|前男友|同事|别人|网友)|跟踪.{0,8}(前任|别人|同事|网友)|偷拍|窃听)/.test(text))
    return "privacy";

  if (/(仇恨言论|种族歧视|辱骂.{0,12}(黑人|女人|女性|同性恋|残疾人|外地人|某民族)|骂.{0,8}(黑人|女人|女性|同性恋|残疾人|外地人)|侮辱.{0,8}(女性|女人|黑人|同性恋|残疾人)|煽动.{0,12}(仇恨|歧视|暴力))/.test(text))
    return "hate";

  return "";
}

export function validateInput(
  text: string,
  maxLen: number,
): { error: string | null; text: string } {
  const trimmed = typeof text === "string" ? text.trim() : "";

  if (!trimmed) {
    return { error: "请输入内容", text: "" };
  }

  if (trimmed.length > maxLen) {
    return { error: `内容太长，请控制在${maxLen}字以内`, text: "" };
  }

  return { error: null, text: trimmed };
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
