import React from "react";
import { Image, View } from "react-native";
import { useApp } from "../lib/store";
import { APP_VERSION, VERSION_CODE } from "../lib/config";
import { space } from "../lib/theme";
import { Screen } from "../components/Screen";
import { Card, Txt } from "../components/ui";

export default function About() {
  const { t, palette, lang } = useApp();
  return (
    <Screen back title={t("aboutLink")} banners={false}>
      <View style={{ gap: space.l, alignItems: "stretch" }}>
        <View style={{ alignItems: "center", gap: 8, paddingVertical: space.l }}>
          <Image source={require("../../assets/icon.png")} style={{ width: 88, height: 88, borderRadius: 22 }} accessibilityIgnoresInvertColors />
          <Txt v="h2" center>{t("appName")}</Txt>
          <Txt v="small" center color={palette.muted}>{t("version", { v: APP_VERSION, c: VERSION_CODE })}</Txt>
        </View>
        <Card><Txt color={palette.ink2}>{t("tagline")}</Txt></Card>
        <Card>
          <Txt v="h3" style={{ marginBottom: 6 }}>{lang === "ur" ? "طریقۂ کار" : "Method"}</Txt>
          {["rM1", "rM2", "rM3", "rM4", "rM5"].map(k => <Txt key={k} v="small" color={palette.ink2} style={{ marginBottom: 6 }}>{t(k)}</Txt>)}
        </Card>
        <Txt v="tiny" color={palette.muted}>{t("rDisclaimer")}</Txt>
      </View>
    </Screen>
  );
}
