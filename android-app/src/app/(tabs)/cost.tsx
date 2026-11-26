// Cost estimate (BOQ) with live rates from /api/rates, a source for each rate, and user-editable rates.
import React, { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { RATE_ITEMS } from "../../shared/rates.js";
import { cityName, useApp, type RateInfo } from "../../lib/store";
import { ago, fmt, pkr, pkrExact } from "../../lib/format";
import { radius, space } from "../../lib/theme";
import { AdSlot } from "../../lib/ads";
import { Screen, useLayout } from "../../components/Screen";
import { Badge, Button, Card, NumField, Row, SectionTitle, Skeleton, Stepper, Txt, haptic } from "../../components/ui";
import { Icon } from "../../components/Icon";

type Meta = { key: string; group: string; unit: string; en: string; ur: string };
const META = Object.fromEntries((RATE_ITEMS as Meta[]).map(i => [i.key, i]));
const GROUPS: [string, string][] = [["conv", "gConv"], ["store", "gStore"], ["well", "gWell"], ["lab", "gLab"]];

function RateStatus() {
  const { rates, t, palette, lang, inputs } = useApp();
  if (rates.status === "loading") return <Skeleton h={28} w={180} r={14} />;
  const d = rates.data;
  const badges: React.ReactNode[] = [];
  if (rates.status === "offline") badges.push(<Badge key="off" tone="warn" icon="offline" label={d ? t("badgeOffline") : t("badgeBundled")} />);
  else if (d?.live) {
    badges.push(<Badge key="live" tone="good" label={t("badgeLive")} />);
    if (d.sources.pbs && d.pbsMonth) badges.push(<Badge key="pbs" tone="primary" label={t("badgePbs", { m: d.pbsMonth })} />);
    if (d.sources.sheet) badges.push(<Badge key="sheet" tone="primary" label={t("badgeSheet")} />);
    if (d.sources.admin) badges.push(<Badge key="admin" tone="aqua" label={t("badgeAdmin")} />);
  } else badges.push(<Badge key="pub" tone="neutral" label={t("badgeBundled")} />);
  return (
    <View style={{ gap: 6 }}>
      <Row wrap gap={6}>{badges}</Row>
      <Txt v="tiny" color={palette.muted}>{t("ratesFrom", { city: cityName(inputs.city, lang) })}{rates.at ? ` · ${t("lastUpdated", { t: ago(lang, rates.at) })}` : ""}</Txt>
    </View>
  );
}

function liveTag(r: RateInfo & { edited?: boolean }, t: (k: string) => string) {
  if (r.edited) return { label: t("rateEdited"), tone: "warn" as const };
  if (r.live === "admin") return { label: t("liveTagAdmin"), tone: "aqua" as const };
  if (r.live === "pbs") return { label: t("liveTagPbs"), tone: "good" as const };
  if (r.live === "sheet") return { label: t("liveTagSheet"), tone: "good" as const };
  if (r.estimate) return { label: t("estimateTag"), tone: "neutral" as const };
  return null;
}

function Item({ k, qty, amount }: { k: string; qty?: number; amount?: number }) {
  const { result: r, inputs, setInputs, palette, t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const m = META[k];
  const rate = (r.rates as Record<string, RateInfo & { edited?: boolean }>)[k];
  const tag = liveTag(rate, t);
  const unit = t("u_" + m.unit);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: palette.line }}>
      <Pressable onPress={() => { haptic.tap(); setOpen(o => !o); }} accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={`${m[lang as "en" | "ur"]}, ${pkrExact(lang, Math.round(rate.rate))} / ${unit}${amount != null ? `, ${pkr(lang, amount)}` : ""}`}
        android_ripple={{ color: palette.primarySoft }} style={{ paddingVertical: 12, paddingHorizontal: space.l, gap: 4 }}>
        <Row justify="space-between" align="flex-start" gap={12}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight="medium">{m[lang as "en" | "ur"]}</Txt>
            <Txt v="small" color={palette.muted} latin>
              {qty != null ? t("qtyLine", { q: fmt(qty, qty < 10 && qty % 1 ? 2 : 0), u: unit, r: fmt(Math.round(rate.rate)) }) : `${fmt(Math.round(rate.rate))} / ${unit}`}
            </Txt>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {amount != null ? <Txt weight="semibold" latin>{pkr(lang, amount)}</Txt> : null}
            {tag ? <Badge label={tag.label} tone={tag.tone} /> : null}
          </View>
        </Row>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: space.l, paddingBottom: space.l, gap: 10 }}>
          <Row gap={10} wrap>
            <View style={{ gap: 4 }}>
              <Txt v="tiny" color={palette.muted}>{t("editRate")} / {unit}</Txt>
              <NumField value={Math.round(rate.rate)} label={`${t("editRate")} ${m.en}`} width={160}
                onCommit={n => setInputs({ rates: { ...(inputs.rates || {}), [k]: Math.max(0, n) } })} />
            </View>
            {rate.edited ? <Button title={t("reset")} kind="text" small icon="refresh" style={{ alignSelf: "flex-end" }}
              onPress={() => { const next = { ...(inputs.rates || {}) } as Record<string, number>; delete next[k]; setInputs({ rates: Object.keys(next).length ? next : null }); }} /> : null}
          </Row>
          <View style={{ backgroundColor: palette.surface2, borderRadius: radius.s, padding: 10, gap: 2 }}>
            <Txt v="tiny" color={palette.muted}>{t("srcLabel")}</Txt>
            <Txt v="small" latin color={palette.ink2}>{rate.src || "—"}</Txt>
            {rate.asOf ? <Txt v="tiny" color={palette.muted}>{t("asOfLabel", { d: rate.asOf })}</Txt> : null}
            {rate.url ? (
              <Pressable onPress={() => Linking.openURL(rate.url!)} accessibilityRole="link" style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 4, minHeight: 32 }}>
                <Icon name="external" size={14} color={palette.primary} /><Txt v="tiny" latin color={palette.primary} numberOfLines={1}>{rate.url.replace(/^https?:\/\//, "")}</Txt>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function Cost() {
  const { result: r, inputs, setInputs, palette, t, lang, refreshRates, refreshConfig, rates } = useApp();
  const { tablet } = useLayout();
  const boq = r.boq;
  const items = boq.items as { key: string; group: string; qty: number; amount: number }[];

  const summary = (
    <Card style={{ backgroundColor: palette.heroA, borderWidth: 0 }}>
      <Txt v="small" color={palette.onHeroMuted}>{t("grandTotal")}</Txt>
      <Txt v="display" latin color={palette.onHero}>{pkr(lang, boq.total)}</Txt>
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 10 }} />
      {GROUPS.map(([g, label]) => (
        <Row key={g} justify="space-between" style={{ paddingVertical: 3 }}>
          <Txt v="small" color={palette.onHeroMuted}>{t(label)}</Txt>
          <Txt v="small" latin color={palette.onHero}>{pkr(lang, (boq.groups as Record<string, number>)[g] || 0)}</Txt>
        </Row>
      ))}
      <Row justify="space-between" style={{ paddingVertical: 3 }}>
        <Txt v="small" color={palette.onHeroMuted}>{t("contingencyLabel", { p: boq.contingencyPct })}</Txt>
        <Txt v="small" latin color={palette.onHero}>{pkr(lang, boq.contingency)}</Txt>
      </Row>
      <Row justify="space-between" wrap style={{ marginTop: 12, gap: 8 }}>
        <Txt v="small" color={palette.onHeroMuted}>{t("kSaving")}: <Txt v="small" latin color={palette.onHero}>{pkr(lang, r.cost.save)}</Txt></Txt>
        <Txt v="small" color={palette.onHeroMuted}>{t("kPayback")}: <Txt v="small" latin color={palette.onHero}>{r.cost.payback ? t("yrsShort", { n: fmt(r.cost.payback, 1) }) : t("noSaving")}</Txt></Txt>
      </Row>
    </Card>
  );

  const controls = (
    <Card>
      <SectionTitle title={t("contingencyPct")} icon="shield" />
      <Stepper value={inputs.contingency} min={0} max={50} step={5} label={t("contingencyPct")} format={n => `${n}%`} onChange={n => setInputs({ contingency: n })} />
      {inputs.rates ? <Button title={t("resetRatesBtn")} kind="tonal" small icon="refresh" style={{ alignSelf: "flex-start", marginTop: 12 }} onPress={() => setInputs({ rates: null })} /> : null}
      <Txt v="tiny" color={palette.muted} style={{ marginTop: 10 }}>{t("costNote2")}</Txt>
    </Card>
  );

  const list = (
    <View style={{ gap: space.l }}>
      {rates.status === "loading" && !rates.data ? (
        <Card>{[0, 1, 2, 3, 4].map(i => <View key={i} style={{ paddingVertical: 10, gap: 6 }}><Skeleton h={14} w="70%" /><Skeleton h={12} w="40%" /></View>)}</Card>
      ) : GROUPS.map(([g, label]) => (
        <Card key={g} pad={false}>
          <View style={{ padding: space.l, paddingBottom: space.s }}><Txt v="h3">{t(label)}</Txt></View>
          {items.filter(i => i.group === g).map(i => <Item key={i.key} k={i.key} qty={i.qty} amount={i.amount} />)}
        </Card>
      ))}
      <Card pad={false}>
        <View style={{ padding: space.l, paddingBottom: space.s }}><Txt v="h3">{t("pTanker")}</Txt><Txt v="tiny" color={palette.muted}>{t("costNote")}</Txt></View>
        <Item k="tanker" />
      </Card>
    </View>
  );

  return (
    <Screen title={t("costScreenTitle")} sub={t("costScreenSub")} onRefresh={() => { refreshRates(); refreshConfig(); }} refreshing={rates.status === "loading"} footer={<AdSlot placement="cost" />}>
      <View style={{ marginBottom: space.l }}><RateStatus /></View>
      {tablet ? (
        <View style={{ flexDirection: "row", gap: space.xl, alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>{list}</View>
          <View style={{ width: 380, gap: space.l }}>{summary}{controls}</View>
        </View>
      ) : (
        <View style={{ gap: space.l }}>{summary}{list}{controls}</View>
      )}
    </Screen>
  );
}
