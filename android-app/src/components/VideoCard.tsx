import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { VIDEO_LANGS } from "../shared/videos.js";
import { useApp } from "../lib/store";
import { fmtDuration, type Video } from "../lib/videos";
import { space } from "../lib/theme";
import { Badge, Card, Row, Txt } from "./ui";
import { Icon } from "./Icon";

type L = { en: string; ur: string };

export function VideoCard({ v, wide }: { v: Video; wide?: boolean }) {
  const { palette, lang, t } = useApp();
  const langName = (VIDEO_LANGS as Record<string, L>)[v.lang]?.[lang] ?? v.lang;
  return (
    <Card pad={false} onPress={() => router.push(`/video/${v.id}`)} label={`${v.title[lang] || v.title.en}. ${langName}`} style={wide ? { flex: 1 } : undefined}>
      <View style={{ aspectRatio: 16 / 9, backgroundColor: palette.surface3 }}>
        {v.thumb ? <Image source={{ uri: v.thumb }} style={{ flex: 1 }} contentFit="cover" transition={200} cachePolicy="disk" recyclingKey={v.id} accessibilityIgnoresInvertColors /> : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Icon name="learn" size={40} color={palette.muted} /></View>
        )}
        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}><Icon name="play" color="#fff" size={26} /></View>
        </View>
        {v.duration ? <View style={{ position: "absolute", right: 8, bottom: 8, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}><Txt v="tiny" latin color="#fff">{fmtDuration(v.duration)}</Txt></View> : null}
      </View>
      <View style={{ padding: space.m, gap: 4 }}>
        <Txt weight="semibold" numberOfLines={2}>{v.title[lang] || v.title.en}</Txt>
        <Row gap={6} wrap>
          <Badge tone="neutral" label={langName} icon="globe" />
          {v.source ? <Txt v="tiny" color={palette.muted} numberOfLines={1} style={{ flexShrink: 1 }}>{t("sourceBy", { s: v.source })}</Txt> : null}
        </Row>
      </View>
    </Card>
  );
}

