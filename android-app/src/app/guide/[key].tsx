import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { GUIDES } from "../../shared/guides.js";
import { useApp } from "../../lib/store";
import { useVideos } from "../../lib/videos";
import { space } from "../../lib/theme";
import { Screen } from "../../components/Screen";
import { Card, EmptyState, Row, SectionTitle, Txt } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { VideoCard } from "../../components/VideoCard";

type L = { en: string; ur: string };
type Guide = { key: string; video: string; title: L; summary: L; when: L; points: { en: string[]; ur: string[] }; care: { en: string[]; ur: string[] } };

export default function GuideScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { palette, lang, t, config } = useApp();
  const { data } = useVideos();
  const g = (GUIDES as Guide[]).find(x => x.key === key);
  if (!g) return <Screen back title={t("segGuides")}><EmptyState icon="book" title={t("errTitle")} /></Screen>;
  const vids = config.features.videos ? (data?.videos || []).filter(v => v.category === g.video).slice(0, 2) : [];
  const list = (items: string[], icon: "check" | "refresh") => items.map((p, i) => (
    <Row key={i} gap={10} align="flex-start" style={{ paddingVertical: 5 }}>
      <View style={{ marginTop: 3 }}><Icon name={icon} size={18} color={palette.primary} /></View>
      <Txt color={palette.ink2} style={{ flex: 1 }}>{p}</Txt>
    </Row>
  ));
  return (
    <Screen back title={g.title[lang]} banners={false}>
      <View style={{ gap: space.l }}>
        <Txt color={palette.ink2}>{g.summary[lang]}</Txt>
        <Card><SectionTitle title={t("guideWhen")} icon="info" /><Txt color={palette.ink2}>{g.when[lang]}</Txt></Card>
        <Card><SectionTitle title={t("guidePoints")} icon="ruler" />{list(g.points[lang], "check")}</Card>
        <Card><SectionTitle title={t("guideCare")} icon="calendar" />{list(g.care[lang], "refresh")}</Card>
        {vids.length ? <Txt v="h3">{t("relatedVideos")}</Txt> : null}
        {vids.map(v => <VideoCard key={v.id} v={v} />)}
        <Txt v="tiny" color={palette.muted}>{t("gNote")}</Txt>
      </View>
    </Screen>
  );
}
