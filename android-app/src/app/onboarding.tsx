import React, { useState } from "react";
import { Animated, I18nManager, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";
import { reloadAppAsync } from "expo";
import { CITIES } from "../shared/calc.js";
import { useApp } from "../lib/store";
import { fonts, radius, space } from "../lib/theme";
import { Button, haptic, Row, Txt } from "../components/ui";
import { Icon } from "../components/Icon";
import { useLayout } from "../components/Screen";

function ArtRoof({ c }: { c: ReturnType<typeof useApp>["palette"] }) {
  return (
    <Svg width={240} height={190} viewBox="0 0 240 190" accessibilityElementsHidden>
      <Defs><LinearGradient id="g" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.aqua} stopOpacity="0.35" /><Stop offset="1" stopColor={c.aqua} stopOpacity="0.05" /></LinearGradient></Defs>
      <Circle cx="120" cy="100" r="88" fill="url(#g)" />
      {[40, 70, 100, 130, 160, 190].map((x, i) => <Line key={x} x1={x} y1={18 + (i % 2) * 10} x2={x - 8} y2={40 + (i % 2) * 10} stroke={c.aqua} strokeWidth="4" strokeLinecap="round" />)}
      <Path d="M48 98 L120 50 L192 98" stroke={c.primary} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="68" y="98" width="104" height="70" rx="6" fill={c.surface} stroke={c.primary} strokeWidth="4" />
      <Rect x="108" y="128" width="24" height="40" rx="3" fill={c.primarySoft} />
      <Path d="M178 112 v30" stroke={c.primary} strokeWidth="5" strokeLinecap="round" />
      <Rect x="176" y="138" width="40" height="34" rx="6" fill={c.aqua} />
      <Path d="M182 152c6 3 22 3 28 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}
function ArtResults({ c }: { c: ReturnType<typeof useApp>["palette"] }) {
  return (
    <Svg width={240} height={190} viewBox="0 0 240 190" accessibilityElementsHidden>
      <Rect x="24" y="20" width="192" height="150" rx="20" fill={c.surface} stroke={c.line} strokeWidth="2" />
      {[30, 52, 76, 98, 64, 40].map((h, i) => <Rect key={i} x={46 + i * 26} y={140 - h} width="16" height={h} rx="4" fill={i === 3 ? c.primary : c.aqua} opacity={i === 3 ? 1 : 0.6} />)}
      <Path d="M44 100 C80 80, 120 110, 196 60" stroke={c.chartDemand} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Circle cx="190" cy="40" r="22" fill={c.primary} />
      <Path d="M181 40l6 6 12-12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function Onboarding() {
  const { palette, t, settings, setSettings, setInputs, inputs, lang } = useApp();
  const insets = useSafeAreaInsets();
  const { medium } = useLayout();
  const [step, setStep] = useState(Math.min(2, settings.onboardStep || 0));
  const [fade] = useState(() => new Animated.Value(1));

  const go = (n: number) => {
    haptic.tap();
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(n); setSettings({ onboardStep: n });
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };
  const chooseLang = (l: "en" | "ur") => {
    haptic.tap();
    setSettings({ lang: l, onboardStep: 0 });
    if ((l === "ur") !== I18nManager.isRTL) { I18nManager.forceRTL(l === "ur"); setTimeout(() => reloadAppAsync("language").catch(() => {}), 150); }
  };
  const finish = () => { haptic.success(); setSettings({ onboarded: true, onboardStep: 0 }); };

  const dots = (
    <Row gap={8} justify="center" style={{ marginVertical: space.l }}>
      {[0, 1, 2].map(i => <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? palette.primary : palette.line }} />)}
    </Row>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}>
      <Row justify="space-between" style={{ paddingHorizontal: space.l, minHeight: 56 }}>
        <Row gap={8}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" }}><Icon name="drop" color="#fff" size={22} /></View>
          <Txt v="h3">{t("appName")}</Txt>
        </Row>
        {step < 2 ? <Pressable onPress={() => go(2)} accessibilityRole="button" style={{ padding: 12 }}><Txt color={palette.primary} weight="semibold">{t("skip")}</Txt></Pressable> : null}
      </Row>
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: medium ? 64 : space.xl, justifyContent: "center", maxWidth: 640, alignSelf: "center", width: "100%" }}>
          {step === 0 ? (
            <View style={{ gap: space.l, alignItems: "center" }}>
              <ArtRoof c={palette} />
              <Txt v="h1" center>{t("ob1Title")}</Txt>
              <Txt center color={palette.muted}>{t("ob1Body")}</Txt>
              <View style={{ alignSelf: "stretch", gap: 10, marginTop: space.m }}>
                <Txt v="h3" center>{lang === "ur" ? "اپنی زبان منتخب کریں · Choose your language" : "Choose your language · اپنی زبان منتخب کریں"}</Txt>
                <Row gap={12}>
                  {(["en", "ur"] as const).map(l => {
                    const on = settings.lang === l;
                    return (
                      <Pressable key={l} onPress={() => chooseLang(l)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                        style={{ flex: 1, minHeight: 64, borderRadius: radius.l, borderWidth: 2, borderColor: on ? palette.primary : palette.line, backgroundColor: on ? palette.primarySoft : palette.surface, alignItems: "center", justifyContent: "center" }}>
                        <Txt v="h2" latin={l === "en"} color={on ? palette.primaryInk : palette.ink} style={l === "ur" ? { fontFamily: fonts.urdu, lineHeight: 40 } : undefined}>{l === "en" ? "English" : "اردو"}</Txt>
                      </Pressable>
                    );
                  })}
                </Row>
              </View>
            </View>
          ) : step === 1 ? (
            <View style={{ gap: space.l, alignItems: "center" }}>
              <ArtResults c={palette} />
              <Txt v="h1" center>{t("ob2Title")}</Txt>
              <Txt center color={palette.muted}>{t("ob2Body")}</Txt>
            </View>
          ) : (
            <View style={{ gap: space.m }}>
              <Txt v="h1" center>{t("ob3Title")}</Txt>
              <Txt center color={palette.muted}>{t("ob3Body")}</Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: space.m, justifyContent: "center" }}>
                {Object.entries(CITIES as Record<string, { en: string; ur: string; mm: number[] }>).map(([k, c]) => {
                  const on = inputs.city === k;
                  const mm = Math.round(c.mm.reduce((a, b) => a + b, 0));
                  return (
                    <Pressable key={k} onPress={() => { haptic.tap(); setInputs({ city: k }); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
                      accessibilityLabel={`${c[lang]}, ${t("annualRainShort", { n: mm })}`}
                      style={{ width: medium ? "31%" : "47%", minHeight: 64, borderRadius: radius.m, borderWidth: 2, padding: 10, borderColor: on ? palette.primary : palette.line, backgroundColor: on ? palette.primarySoft : palette.surface, justifyContent: "center" }}>
                      <Txt weight="semibold" color={on ? palette.primaryInk : palette.ink}>{c[lang]}</Txt>
                      <Txt v="tiny" color={palette.muted}>{t("annualRainShort", { n: mm })}</Txt>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      {dots}
      <Row gap={12} style={{ paddingHorizontal: space.xl, maxWidth: 640, alignSelf: "center", width: "100%" }}>
        {step > 0 ? <Button title={t("back")} kind="outline" onPress={() => go(step - 1)} style={{ flex: 1 }} /> : null}
        <Button title={step === 2 ? t("getStarted") : t("next")} onPress={() => (step === 2 ? finish() : go(step + 1))} style={{ flex: 2 }} />
      </Row>
    </View>
  );
}
