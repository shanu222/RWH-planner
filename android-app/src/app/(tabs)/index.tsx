// Planner: roof, rainfall, demand and tank inputs with live results (same engine as the web app: shared/calc.js).
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CITIES, ROOFS, TANKS } from "../../shared/calc.js";
import { MONTHS } from "../../shared/i18n.js";
import { PLOTS } from "../../shared/rates.js";
import { cityName, useApp } from "../../lib/store";
import { area, areaToM2, areaValue, fmt, pkr, vol } from "../../lib/format";
import { decodeDesign, designUrl, shareText } from "../../lib/share";
import { radius, space } from "../../lib/theme";
import { AdSlot } from "../../lib/ads";
import { Screen, useLayout } from "../../components/Screen";
import { Badge, Button, Card, Chip, IconButton, NumField, Row, SectionTitle, Stepper, Txt, useToast } from "../../components/ui";
import { MonthlyChart, Ring, TankCurve } from "../../components/charts";
import { Picker } from "../../components/Picker";
import { Prompt } from "../../components/Prompt";
import { Icon } from "../../components/Icon";

type CityMap = Record<string, { en: string; ur: string; mm: number[]; src: string }>;
type RoofMap = Record<string, { c: number; en: string; ur: string }>;

function Hero() {
  const { result: r, palette, t, lang, settings } = useApp();
  const { medium } = useLayout();
  const pay = r.cost.payback;
  const kpi = (label: string, value: string, icon: Parameters<typeof Icon>[0]["name"]) => (
    <View style={{ flexGrow: 1, flexBasis: medium ? 0 : "46%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.m, padding: 12, gap: 2 }}>
      <Row gap={6}><Icon name={icon} size={16} color={palette.onHeroMuted} /><Txt v="tiny" color={palette.onHeroMuted}>{label}</Txt></Row>
      <Txt v="h3" latin color={palette.onHero} numberOfLines={1}>{value}</Txt>
    </View>
  );
  return (
    <View style={{ backgroundColor: palette.heroA, borderRadius: radius.xl, padding: space.xl, gap: space.m, overflow: "hidden" }}
      accessible accessibilityLabel={`${t("heroCollect")}: ${vol(lang, r.harvest, settings.volUnit)} ${t("perYear")}`}>
      <View style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: palette.heroB, opacity: 0.7 }} />
      <Txt v="small" color={palette.onHeroMuted}>{t("heroCollect")}</Txt>
      <Row align="flex-end" gap={8} wrap>
        <Txt v="display" latin color={palette.onHero}>{fmt(settings.volUnit === "gal" ? r.harvest / 3.78541 : r.harvest)}</Txt>
        <Txt color={palette.onHeroMuted} style={{ marginBottom: 6 }}>{settings.volUnit === "gal" ? t("gallonsU") : t("perYear")}</Txt>
      </Row>
      <Txt v="small" color={palette.onHeroMuted}>{t("heroTankers", { n: fmt(r.tankersEquivalent, 1) })}</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {kpi(t("kMet"), `${Math.round(r.met)}%`, "check")}
        {kpi(t("kTank"), vol(lang, r.tank, settings.volUnit), "tank")}
        {kpi(t("kPayback"), pay ? t("yrsShort", { n: fmt(pay, 1) }) : t("noSaving"), "refresh")}
        {kpi(t("kCost"), pkr(lang, r.cost.total), "receipt")}
      </View>
    </View>
  );
}

function Inputs() {
  const { inputs, setInputs, result: r, palette, t, lang, settings } = useApp();
  const [cityOpen, setCityOpen] = useState(false);
  const [monthly, setMonthly] = useState(false);
  const cities = CITIES as CityMap, roofs = ROOFS as RoofMap;
  const unitLabel = settings.areaUnit === "ft2" ? t("ft2") : t("m2");
  const months = lang === "ur" ? MONTHS.ur : MONTHS.en;
  const rain = r.rain as number[];
  return (
    <View style={{ gap: space.l }}>
      <Card>
        <SectionTitle title={t("rainSection")} icon="drop" />
        <Card onPress={() => setCityOpen(true)} label={`${t("cityLabel")}: ${cityName(inputs.city, lang)}`} style={{ backgroundColor: palette.surface2, borderWidth: 0 }}>
          <Row justify="space-between">
            <View>
              <Txt v="tiny" color={palette.muted}>{t("cityLabel")}</Txt>
              <Txt v="h3">{cityName(inputs.city, lang)}</Txt>
              <Txt v="small" color={palette.muted}>{t("annualRainShort", { n: fmt(r.annualRain) })}{r.edited ? ` ${t("edited")}` : ""}</Txt>
            </View>
            <Icon name="chevron" color={palette.muted} flip={lang === "ur"} />
          </Row>
        </Card>
        <Button title={monthly ? t("hideMonthly") : t("editMonthly")} kind="text" small icon="edit" onPress={() => setMonthly(m => !m)} style={{ alignSelf: "flex-start", marginTop: 6 }} />
        {monthly ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {rain.map((mm, i) => (
                <View key={i} style={{ width: "30%", flexGrow: 1, gap: 2 }}>
                  <Txt v="tiny" color={palette.muted}>{months[i]}</Txt>
                  <NumField value={mm} decimals={1} label={`${months[i]} mm`} width={"100%" as unknown as number}
                    onCommit={n => { const next = rain.slice(); next[i] = Math.max(0, n); setInputs({ rain: next }); }} />
                </View>
              ))}
            </View>
            <Txt v="tiny" color={palette.muted}>{t("source")}: {cities[inputs.city].src}</Txt>
            {r.edited ? <Button title={t("resetRain")} kind="tonal" small icon="refresh" onPress={() => setInputs({ rain: null })} style={{ alignSelf: "flex-start" }} /> : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title={t("roofSection")} icon="home" />
        <Txt v="small" color={palette.muted} style={{ marginBottom: 8 }}>{t("plotSize")}</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(PLOTS as { key: string; en: string; ur: string }[]).map(p => (
            <Chip key={p.key} label={p[lang]} selected={inputs.plot === p.key} onPress={() => setInputs({ plot: p.key })} />
          ))}
          <Chip label={t("customRoof")} icon="ruler" selected={inputs.plot === "custom"} onPress={() => setInputs({ plot: "custom", area: inputs.area })} />
        </View>
        <Row justify="space-between" wrap style={{ marginTop: space.l, gap: 12 }}>
          <View style={{ gap: 4 }}>
            <Txt v="small" color={palette.muted}>{t("areaLabel", { u: unitLabel })}</Txt>
            {inputs.plot === "custom"
              ? <NumField value={areaValue(inputs.area, settings.areaUnit)} label={t("areaLabel", { u: unitLabel })} suffix={unitLabel} width={170}
                  onCommit={n => setInputs({ area: areaToM2(Math.max(1, n), settings.areaUnit) })} />
              : <Txt v="h2" latin>{area(lang, inputs.area, settings.areaUnit)}</Txt>}
          </View>
          <View style={{ gap: 4 }}>
            <Txt v="small" color={palette.muted}>{t("storeysLabel")}</Txt>
            <Stepper value={inputs.storeys} min={1} max={6} label={t("storeysLabel")} onChange={n => setInputs({ storeys: n })} />
          </View>
        </Row>
        {inputs.plot !== "custom" ? <Txt v="tiny" color={palette.muted} style={{ marginTop: 8 }}>{t("plotHint")}</Txt> : null}
        <Txt v="small" color={palette.muted} style={{ marginTop: space.l, marginBottom: 8 }}>{t("roofType")}</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(roofs).map(([k, v]) => (
            <Chip key={k} label={`${v[lang]} · C ${v.c}`} selected={inputs.roof === k} onPress={() => setInputs({ roof: k })} />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title={t("useSection")} icon="drop" />
        <Row justify="space-between" wrap style={{ gap: 12 }}>
          <View style={{ gap: 4 }}>
            <Txt v="small" color={palette.muted}>{t("peopleLabel")}</Txt>
            <Stepper value={inputs.people} min={1} max={200} label={t("peopleLabel")} onChange={n => setInputs({ people: n })} />
          </View>
          <View style={{ gap: 4 }}>
            <Txt v="small" color={palette.muted}>{t("lpcdLabel")}</Txt>
            <Stepper value={inputs.lpcd} min={5} max={300} step={5} label={t("lpcdLabel")} onChange={n => setInputs({ lpcd: n })} />
          </View>
        </Row>
        <Txt v="tiny" color={palette.muted} style={{ marginTop: 8 }}>{t("useHint")}</Txt>
      </Card>

      <Card>
        <SectionTitle title={t("tankSection")} icon="tank" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <Chip label={`${t("tankAuto")} · ${fmt(r.recommended)} L`} selected={inputs.tank == null} onPress={() => setInputs({ tank: null })} />
          {(TANKS as number[]).map(v => (
            <Chip key={v} latin label={`${fmt(v)} L`} selected={inputs.tank === v} badge={v === r.recommended ? "★" : undefined} onPress={() => setInputs({ tank: v })} />
          ))}
        </ScrollView>
        <Txt v="tiny" color={palette.muted} style={{ marginTop: 8 }}>{t("tankHint", { v: vol(lang, r.recommended, settings.volUnit) })}</Txt>
      </Card>

      <Picker visible={cityOpen} title={t("cityLabel")} value={inputs.city} onClose={() => setCityOpen(false)}
        onSelect={k => setInputs({ city: k, rain: null })}
        options={Object.entries(cities).map(([k, c]) => ({ key: k, label: c[lang], sub: t("annualRainShort", { n: fmt(c.mm.reduce((a, b) => a + b, 0)) }) }))} />
    </View>
  );
}

function Results() {
  const { result: r, palette, t, lang, settings } = useApp();
  return (
    <View style={{ gap: space.l }}>
      <Card>
        <Row gap={16}>
          <Ring pct={r.met} color={palette.primary} track={palette.surface3} label={`${t("reliability")}: ${Math.round(r.met)}%`} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="h3">{t("reliability")}</Txt>
            <Txt v="small" color={palette.muted}>{t("reliabilityBody", { p: Math.round(r.met) })}</Txt>
            <Row gap={6} wrap>
              <Badge tone="good" label={`${t("kSaving")}: ${pkr(lang, r.cost.save)}`} />
            </Row>
          </View>
        </Row>
      </Card>
      <Card>
        <SectionTitle title={t("waterSaved")} icon="drop" />
        <MonthlyChart inflow={r.inflow as number[]} demand={r.demand as number[]} used={(r.sim?.usedM ?? []) as number[]} />
      </Card>
      <Card>
        <SectionTitle title={t("tankCurveTitle")} icon="tank" right={<Badge tone="aqua" label={`${t("recommendedShort")} ${fmt(r.recommended)} L`} />} />
        <TankCurve curve={r.curve as { V: number; pct: number }[]} recommended={r.recommended} selected={r.tank} />
      </Card>
      <Card>
        <SectionTitle title={t("wellTitle")} icon="well" />
        <Txt v="small" color={palette.ink2}>{t("wellBody", {
          n: r.well.wells, w: r.well.wells === 1 ? t("well1") : t("wellN"), d: fmt(r.well.diameter, 1), depth: fmt(r.well.depth, 1), o: vol(lang, r.well.overflow, settings.volUnit),
        })}</Txt>
        <Txt v="tiny" color={palette.muted} style={{ marginTop: 8 }}>{t("rechargeNote")}</Txt>
      </Card>
    </View>
  );
}

export default function Planner() {
  const { inputs, setInputs, t, lang, config, saveDesign, refreshRates, refreshConfig, rates, resetInputs } = useApp();
  const { tablet } = useLayout();
  const toast = useToast();
  const params = useLocalSearchParams<{ d?: string }>();
  const [naming, setNaming] = useState(false);

  // a shared link (https://rwh-planner.vercel.app/?d=… or rwhplanner://?d=…) opens the design here
  useEffect(() => {
    if (!params.d) return;
    const d = decodeDesign(String(params.d));
    router.setParams({ d: undefined });
    if (!d) return;
    Alert.alert(t("openShared"), t("openSharedBody"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("open"), onPress: () => { setInputs(d); toast(t("sharedOpened")); } },
    ]);
  }, [params.d]); // eslint-disable-line react-hooks/exhaustive-deps

  const plotName = inputs.plot === "custom" ? t("customRoof") : (PLOTS as { key: string; en: string; ur: string }[]).find(p => p.key === inputs.plot)?.[lang] ?? "";
  const actions = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      <Button title={t("saveDesign")} icon="folder" onPress={() => setNaming(true)} style={{ flexGrow: 1 }} />
      <Button title={t("shareLink")} icon="share" kind="tonal" style={{ flexGrow: 1 }}
        onPress={() => shareText(`${config.shareMessage[lang]}\n${designUrl(config.webUrl, inputs)}`, t("appName"))} />
      <Button title={t("makeReport")} icon="file" kind="outline" style={{ flexGrow: 1 }} onPress={() => router.push("/reports")} />
    </View>
  );

  return (
    <Screen title={t("plannerTitle")} sub={t("plannerSub")} onRefresh={() => { refreshRates(); refreshConfig(); }} refreshing={rates.status === "loading"}
      right={<IconButton name="refresh" label={t("resetInputs")} onPress={() => Alert.alert(t("resetInputs"), undefined, [{ text: t("cancel"), style: "cancel" }, { text: t("reset"), onPress: resetInputs }])} />}
      footer={<AdSlot placement="results" />}>
      {tablet ? (
        <View style={{ flexDirection: "row", gap: space.xl, alignItems: "flex-start" }}>
          <View style={{ width: 400 }}><Inputs /></View>
          <View style={{ flex: 1, gap: space.l }}><Hero /><Results />{actions}</View>
        </View>
      ) : (
        <View style={{ gap: space.l }}>
          <Hero />
          <Inputs />
          <Results />
          {actions}
        </View>
      )}
      <Prompt visible={naming} title={t("designNamePrompt")} initial={t("defaultDesignName", { city: cityName(inputs.city, lang), plot: plotName })}
        onClose={() => setNaming(false)} onSubmit={name => { saveDesign(name); toast(t("savedToast")); }} />
    </Screen>
  );
}
