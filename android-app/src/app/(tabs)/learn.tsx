// Learn: training videos (search, categories, in-app player), technique guides and the seasonal maintenance calendar.
import React, { useMemo, useState } from "react";
import { Switch, TextInput, View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CALENDAR, GUIDES, THEMES } from "../../shared/guides.js";
import { useApp } from "../../lib/store";
import { useVideos, type Video } from "../../lib/videos";
import { VideoCard } from "../../components/VideoCard";
import { askPermission, cancelReminders, scheduleReminders, testReminder } from "../../lib/reminders";
import { radius, space } from "../../lib/theme";
import { AdSlot } from "../../lib/ads";
import { Screen, useLayout } from "../../components/Screen";
import { Badge, Button, Card, Chip, EmptyState, Row, Segmented, Skeleton, Txt, haptic, useFont, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

type L = { en: string; ur: string };
type Guide = { key: string; video: string; theme: number; title: L; summary: L };
type Season = { key: string; when: L; tasks: { en: string[]; ur: string[] } };

function Videos() {
  const { palette, t, lang, config } = useApp();
  const font = useFont();
  const { width, medium } = useLayout();
  const { status, data } = useVideos();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const cols = width >= 1000 ? 3 : medium ? 2 : 1;
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.videos || []).filter(v => (cat === "all" || v.category === cat) &&
      (!s || [v.title.en, v.title.ur, v.desc?.en, v.desc?.ur, v.source].some(x => String(x || "").toLowerCase().includes(s))));
  }, [data, q, cat]);
  if (!config.features.videos) return <EmptyState icon="learn" title={t("videosOff")} />;
  const cats = (data?.categories || []).filter(c => data?.videos.some(v => v.category === c.key));
  const rows: Video[][] = [];
  for (let i = 0; i < list.length; i += cols) rows.push(list.slice(i, i + cols));
  return (
    <View style={{ gap: space.m }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 16, minHeight: 50 }}>
        <Icon name="search" size={20} color={palette.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder={t("searchVideos")} placeholderTextColor={palette.muted} returnKeyType="search" accessibilityLabel={t("searchVideos")}
          style={[font("body"), { flex: 1, color: palette.ink, paddingVertical: 0 }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={t("allCats")} selected={cat === "all"} onPress={() => setCat("all")} />
        {cats.map(c => <Chip key={c.key} label={c[lang]} selected={cat === c.key} onPress={() => setCat(c.key)} />)}
      </ScrollView>
      {status === "loading" && !data ? (
        [0, 1, 2].map(i => <Card key={i} pad={false}><Skeleton h={180} r={0} /><View style={{ padding: 12, gap: 8 }}><Skeleton h={16} w="80%" /><Skeleton h={12} w="40%" /></View></Card>)
      ) : list.length === 0 ? (
        <EmptyState icon="search" title={t("noVideos")} body={t("noVideosBody")} />
      ) : rows.map((row, i) => (
        <View key={i} style={{ gap: space.m }}>
          <View style={{ flexDirection: "row", gap: space.m }}>
            {row.map(v => <View key={v.id} style={{ flex: 1 }}><VideoCard v={v} /></View>)}
            {row.length < cols ? Array.from({ length: cols - row.length }).map((_, k) => <View key={k} style={{ flex: 1 }} />) : null}
          </View>
          {i === Math.min(1, rows.length - 1) ? <AdSlot placement="videos" inline /> : null}
        </View>
      ))}
    </View>
  );
}

function Guides() {
  const { palette, lang, t } = useApp();
  const { medium } = useLayout();
  return (
    <View style={{ gap: space.m }}>
      <Txt v="small" color={palette.muted}>{t("gSub")}</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.m }}>
        {(GUIDES as Guide[]).map(g => {
          const theme = (THEMES as ({ n: number } & L)[]).find(x => x.n === g.theme);
          return (
            <Card key={g.key} onPress={() => router.push(`/guide/${g.key}`)} label={g.title[lang]} style={{ width: medium ? "48.8%" : "100%" }}>
              <Row gap={12} align="flex-start">
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={g.key.includes("well") || g.key.includes("recharge") ? "well" : g.key.includes("tank") ? "tank" : "book"} color={palette.primary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  {theme ? <Txt v="tiny" color={palette.primary} weight="semibold">{theme[lang]}</Txt> : null}
                  <Txt weight="semibold">{g.title[lang]}</Txt>
                  <Txt v="small" color={palette.muted} numberOfLines={3}>{g.summary[lang]}</Txt>
                </View>
              </Row>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

function Calendar() {
  const { palette, lang, t, settings, setSettings, config } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const month = new Date().getMonth();
  const current = month >= 4 && month <= 5 ? "pre" : month >= 6 && month <= 8 ? "during" : month === 9 ? "post" : month >= 11 || month <= 2 ? "winter" : "";
  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (on) {
        if (!(await askPermission())) { toast(t("remindersDenied")); setSettings({ reminders: false }); return; }
        await scheduleReminders(lang); setSettings({ reminders: true }); haptic.success();
      } else { await cancelReminders(); setSettings({ reminders: false }); }
    } finally { setBusy(false); }
  };
  return (
    <View style={{ gap: space.m }}>
      <Txt v="small" color={palette.muted}>{t("calSub")}</Txt>
      {config.features.reminders ? (
        <Card style={{ backgroundColor: palette.primarySoft, borderWidth: 0 }}>
          <Row gap={12}>
            <Icon name="bell" color={palette.primary} />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold">{t("remindersTitle")}</Txt>
              <Txt v="small" color={palette.ink2}>{settings.reminders ? t("remindersOn") : t("remindersBody")}</Txt>
            </View>
            <Switch value={settings.reminders} disabled={busy} onValueChange={toggle} accessibilityLabel={t("remindersTitle")}
              trackColor={{ true: palette.primary, false: palette.surface3 }} thumbColor={palette.surface} />
          </Row>
          {settings.reminders ? <Button title={t("testReminder")} kind="text" small icon="bell" style={{ alignSelf: "flex-start", marginTop: 6 }}
            onPress={async () => { await testReminder(lang); toast(t("testSent")); }} /> : null}
        </Card>
      ) : null}
      {(CALENDAR as Season[]).map(s => (
        <Card key={s.key} style={s.key === current ? { borderColor: palette.primary, borderWidth: 2 } : undefined}>
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <Txt v="h3" style={{ flex: 1 }}>{s.when[lang]}</Txt>
            {s.key === current ? <Badge tone="good" label={lang === "ur" ? "موجودہ" : "Now"} /> : null}
          </Row>
          {s.tasks[lang].map((task, i) => (
            <Row key={i} gap={10} align="flex-start" style={{ paddingVertical: 4 }}>
              <View style={{ marginTop: 3 }}><Icon name="check" size={18} color={palette.primary} /></View>
              <Txt v="small" color={palette.ink2} style={{ flex: 1 }}>{task}</Txt>
            </Row>
          ))}
        </Card>
      ))}
    </View>
  );
}

export default function Learn() {
  const { t, config } = useApp();
  const { refresh, status } = useVideos();
  const params = useLocalSearchParams<{ seg?: string }>();
  const initial = params.seg === "calendar" ? "calendar" : params.seg === "guides" || !config.features.videos ? "guides" : "videos";
  const [seg, setSeg] = useState<"videos" | "guides" | "calendar">(initial);
  // reminder taps and the More menu open /learn?seg=calendar, also when the tab is already mounted
  const [seenSeg, setSeenSeg] = useState(params.seg);
  if (params.seg !== seenSeg) {
    setSeenSeg(params.seg);
    if (params.seg === "calendar" || params.seg === "guides" || params.seg === "videos") setSeg(params.seg);
  }
  const opts = [
    ...(config.features.videos ? [{ key: "videos" as const, label: t("segVideos"), icon: "learn" as const }] : []),
    { key: "guides" as const, label: t("segGuides"), icon: "book" as const },
    { key: "calendar" as const, label: t("segCalendar"), icon: "calendar" as const },
  ];
  const active = seg === "videos" && !config.features.videos ? "guides" : seg;
  return (
    <Screen title={t("learnTitle")} onRefresh={active === "videos" ? refresh : undefined} refreshing={status === "loading"}>
      <View style={{ marginBottom: space.l }}><Segmented value={active} options={opts} onChange={setSeg} label={t("learnTitle")} /></View>
      {active === "videos" ? <Videos /> : active === "guides" ? <Guides /> : <Calendar />}
    </Screen>
  );
}
