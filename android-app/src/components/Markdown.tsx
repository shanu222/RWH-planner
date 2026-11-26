// Small safe markdown for AI answers: paragraphs, "-" / numbered bullets and **bold** (same subset as the web app).
import React from "react";
import { Text, View } from "react-native";
import { useApp } from "../lib/store";
import { Row, Txt } from "./ui";

function inline(s: string, color: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) => p.startsWith("**") && p.endsWith("**")
    ? <Text key={i} style={{ fontWeight: "700", color }}>{p.slice(2, -2)}</Text>
    : <Text key={i}>{p}</Text>);
}

export function Markdown({ text, color }: { text: string; color: string }) {
  const { palette } = useApp();
  const blocks: React.ReactNode[] = [];
  String(text).split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) blocks.push(
      <Row key={i} gap={8} align="flex-start">
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.primary, marginTop: 9 }} />
        <Txt color={color} style={{ flex: 1 }} selectable>{inline(m[1], color)}</Txt>
      </Row>);
    else if (line.trim()) blocks.push(<Txt key={i} color={color} selectable>{inline(line.trim().replace(/^#+\s*/, ""), color)}</Txt>);
  });
  return <View style={{ gap: 6 }}>{blocks}</View>;
}
