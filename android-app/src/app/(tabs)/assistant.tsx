// AI assistant and AI design review (/api/ai/chat, /api/ai/review). The tab only shows when AI is available.
import React, { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { postJSON } from "../../lib/api";
import { useApp } from "../../lib/store";
import { radius, space } from "../../lib/theme";
import { GlobalBanners, useLayout } from "../../components/Screen";
import { Badge, Button, Card, Chip, IconButton, Row, Txt, haptic, useFont } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { Markdown } from "../../components/Markdown";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; shown?: number };

function TypingDots() {
  const { palette, t } = useApp();
  const [a] = useState(() => [new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)]);
  useEffect(() => {
    const loops = a.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 160), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0.3, duration: 300, useNativeDriver: true }), Animated.delay((2 - i) * 160),
    ])));
    loops.forEach(l => l.start()); return () => loops.forEach(l => l.stop());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View accessibilityLabel={t("typing")} accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 5, padding: 14, backgroundColor: palette.surface, borderRadius: radius.l, alignSelf: "flex-start", borderWidth: 1, borderColor: palette.line }}>
      {a.map((v, i) => <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary, opacity: v, transform: [{ scale: v }] }} />)}
    </View>
  );
}

// reveal the answer progressively (streaming-style)
function useTypewriter(full: string, active: boolean, onTick?: () => void) {
  const [n, setN] = useState(active ? 0 : full.length);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const step = Math.max(2, Math.round(full.length / 120));
    const id = setInterval(() => { i = Math.min(full.length, i + step); setN(i); onTick?.(); if (i >= full.length) clearInterval(id); }, 16);
    return () => clearInterval(id);
  }, [full, active]); // eslint-disable-line react-hooks/exhaustive-deps
  return active ? full.slice(0, n) : full;
}

function Bubble({ m, animate, onTick }: { m: Msg; animate: boolean; onTick: () => void }) {
  const { palette, t } = useApp();
  const text = useTypewriter(m.content, animate && m.role === "assistant" && !m.error, onTick);
  const mine = m.role === "user";
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", gap: 4 }}>
      {!mine && !m.error ? <Row gap={4}><Icon name="spark" size={14} color={palette.primary} /><Txt v="tiny" color={palette.muted}>{t("aiLabel")}</Txt></Row> : null}
      <View style={{ backgroundColor: mine ? palette.primary : m.error ? palette.badSoft : palette.surface, borderRadius: radius.l, padding: 12,
        borderWidth: mine ? 0 : 1, borderColor: palette.line, borderBottomRightRadius: mine ? 6 : radius.l, borderBottomLeftRadius: mine ? radius.l : 6 }}>
        {mine ? <Txt color={palette.onPrimary} selectable>{m.content}</Txt> : <Markdown text={text} color={m.error ? palette.bad : palette.ink} />}
      </View>
    </View>
  );
}

export default function Assistant() {
  const { palette, t, lang, inputs, config, online } = useApp();
  const insets = useSafeAreaInsets();
  const font = useFont();
  const { medium } = useLayout();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [review, setReview] = useState<{ text?: string; busy?: boolean; error?: boolean } | null>(null);
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [lastAnimated, setLastAnimated] = useState(-1);
  const scrollEnd = () => scroller.current?.scrollToEnd({ animated: true });
  const aiOn = !!config.ai && config.features.ai;

  const send = async (text: string) => {
    const s = text.trim(); if (!s || busy) return;
    haptic.press();
    const history = [...msgs.filter(m => !m.error), { role: "user" as const, content: s }];
    setMsgs(m => [...m, { role: "user", content: s }]); setQ(""); setBusy(true);
    setTimeout(scrollEnd, 50);
    try {
      const r = await postJSON<{ text: string }>("/api/ai/chat", { messages: history.map(({ role, content }) => ({ role, content })), lang, inputs }, 90000);
      setLastAnimated(msgs.length + 1); // index of this answer: after the earlier messages and the question
      setMsgs(m => [...m, { role: "assistant", content: r.text }]);
    } catch {
      // server messages are English only: show the app's own text in the user's language
      setMsgs(m => [...m, { role: "assistant", content: t("aiError"), error: true }]);
    } finally { setBusy(false); setTimeout(scrollEnd, 80); }
  };

  const runReview = async () => {
    setReview({ busy: true });
    try { const r = await postJSON<{ text: string }>("/api/ai/review", { lang, inputs }, 90000); setReview({ text: r.text }); haptic.success(); }
    catch { setReview({ error: true }); }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: palette.bg }}>
      <Row justify="space-between" style={{ paddingTop: insets.top + 8, paddingHorizontal: medium ? space.xxl : space.l, paddingBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Txt v="h1">{t("asTitle")}</Txt>
          <Txt v="small" color={palette.muted}>{t("asSub")}</Txt>
        </View>
        {msgs.length ? <IconButton name="refresh" label={t("newChat")} onPress={() => { setMsgs([]); setReview(null); }} /> : null}
      </Row>
      <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: medium ? space.xxl : space.l, paddingTop: 8, gap: space.m, maxWidth: 860, width: "100%", alignSelf: "center" }}>
        <GlobalBanners />
        {!aiOn ? <Card><Txt color={palette.muted}>{t("aiUnavailable")}</Txt></Card> : null}
        <Card style={{ backgroundColor: palette.primarySoft, borderWidth: 0 }}>
          <Row gap={10} align="flex-start">
            <Icon name="spark" color={palette.primary} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt weight="semibold">{t("reviewTitle")}</Txt>
              <Txt v="small" color={palette.ink2}>{t("aiReviewDesc")}</Txt>
            </View>
          </Row>
          {review?.text ? (
            <View style={{ marginTop: 12, backgroundColor: palette.surface, borderRadius: radius.m, padding: 12, gap: 6 }}>
              <Badge tone="aqua" icon="spark" label={t("aiLabel")} />
              <Markdown text={review.text} color={palette.ink} />
            </View>
          ) : review?.error ? <Txt v="small" color={palette.bad} style={{ marginTop: 10 }}>{t("aiError")}</Txt> : null}
          <Button title={review?.busy ? t("reviewing") : t("reviewBtn")} icon="spark" loading={review?.busy} disabled={!aiOn || !online} onPress={runReview} style={{ marginTop: 12, alignSelf: "flex-start" }} small />
        </Card>
        {msgs.map((m, i) => <Bubble key={i} m={m} animate={i === lastAnimated} onTick={scrollEnd} />)}
        {busy ? <TypingDots /> : null}
        {!msgs.length && aiOn ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["aiS1", "aiS2", "aiS3", "aiS4"].map(k => <Chip key={k} label={t(k)} icon="spark" onPress={() => send(t(k))} />)}
          </View>
        ) : null}
        <Row gap={6} align="flex-start" style={{ marginTop: 4 }}>
          <Icon name="info" size={16} color={palette.muted} />
          <Txt v="tiny" color={palette.muted} style={{ flex: 1 }}>{t("aiDisclaimer")}</Txt>
        </Row>
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: space.m, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.surface }}>
        <TextInput value={q} onChangeText={setQ} placeholder={t("aiPlaceholder")} placeholderTextColor={palette.muted} multiline maxLength={1500} editable={aiOn}
          accessibilityLabel={t("aiPlaceholder")}
          style={[font("body"), { flex: 1, color: palette.ink, backgroundColor: palette.surface2, borderRadius: radius.l, paddingHorizontal: 14, paddingVertical: 10, minHeight: 48, maxHeight: 140 }]} />
        <Pressable onPress={() => send(q)} disabled={!q.trim() || busy || !aiOn} accessibilityRole="button" accessibilityLabel={t("aiSend")}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: q.trim() && !busy ? palette.primary : palette.surface3, alignItems: "center", justifyContent: "center" }}>
          <Icon name="send" color={q.trim() && !busy ? palette.onPrimary : palette.muted} flip={lang === "ur"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
