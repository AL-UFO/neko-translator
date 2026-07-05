import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "猫娘翻译器｜把寻常的话说得喵喵叫",
  description:
    "输入一句寻常话，把它翻译成猫娘语气。软萌、傲娇、高冷、元气，四种猫娘任你选。",
  keywords: ["猫娘", "翻译器", "AI翻译", "猫娘语气", "MiMo"],
  openGraph: {
    title: "猫娘翻译器",
    description: "把寻常的话说得喵喵叫。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
