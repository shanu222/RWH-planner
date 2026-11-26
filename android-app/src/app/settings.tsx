import React from "react";
import { Alert, I18nManager, Linking, View } from "react-native";
import { Image } from "expo-image";
import { reloadAppAsync } from "expo";
import { useApp } from "../lib/store";
import { useAds } from "../lib/ads";
import { clearCaches } from "../lib/storage";
import { cancelReminders, scheduleReminders } from "../lib/reminders";
import { loadVideos } from "../lib/videos";
import { APP_VERSION, CONTACT_EMAIL, PRIVACY_URL, TERMS_URL, VERSION_CODE } from "../lib/config";
import { space } from "../lib/theme";
import { Screen } from "../components/Screen";
import { Card, Divider, ListRow, Segmented, SectionTitle, Txt, useToast } from "../components/ui";

export default function Settings() {
  const { t, settings, setSettings, palette, refreshRates, refreshConfig, lang } = useApp();
  const { privacyRequired, showPrivacyOptions } = useAds();
  const toast = useToast();

  const setLang = (l: "en" | "ur") => {
    if (l === settings.lang) return;
    setSettings({ lang: l });
    if (settings.reminders) scheduleReminders(l).catch(() => {});
    if ((l === "ur") !== I18nManager.isRTL) {
      I18nManager.forceRTL(l === "ur");
      setTimeout(() => reloadAppAsync("language").catch(() => {}), 200);
    }
  };

  const clear = () => Alert.alert(t("clearCache"), t("clearCacheBody"), [
    { text: t("cancel"), style: "cancel" },
    { text: t("clearCache"), style: "destructive", onPress: async () => {
      await clearCaches(); await Image.clearDiskCache(); await Image.clearMemoryCache();
      toast(t("cacheCleared")); refreshRates(); refreshConfig(); loadVideos(true);
    } },
  ]);

  return (
    <Screen back title={t("settingsTitle")} banners={false}>
      <View style={{ gap: space.l }}>
        <Card>
          <SectionTitle title={t("sLanguage")} icon="globe" />
          <Segmented value={settings.lang} onChange={setLang} label={t("sLanguage")} options={[{ key: "en", label: "English" }, { key: "ur", label: "اردو" }]} />
          <Txt v="tiny" color={palette.muted} style={{ marginTop: 8 }}>{t("langRestart")}</Txt>
        </Card>
        <Card>
          <SectionTitle title={t("sUnits")} icon="ruler" />
          <Txt v="small" color={palette.muted} style={{ marginBottom: 6 }}>{t("sArea")}</Txt>
          <Segmented value={settings.areaUnit} onChange={v => setSettings({ areaUnit: v })} label={t("sArea")} options={[{ key: "m2", label: t("m2") }, { key: "ft2", label: t("ft2") }]} />
          <Txt v="small" color={palette.muted} style={{ marginBottom: 6, marginTop: 12 }}>{t("sVolume")}</Txt>
          <Segmented value={settings.volUnit} onChange={v => setSettings({ volUnit: v })} label={t("sVolume")} options={[{ key: "L", label: t("litresU") }, { key: "gal", label: t("gallonsU") }]} />
        </Card>
        <Card>
          <SectionTitle title={t("sTheme")} icon="sun" />
          <Segmented value={settings.theme} onChange={v => setSettings({ theme: v })} label={t("sTheme")} options={[
            { key: "system", label: t("themeSystem"), icon: "phone" }, { key: "light", label: t("themeLight"), icon: "sun" }, { key: "dark", label: t("themeDark"), icon: "moon" },
          ]} />
        </Card>
        <Card pad={false}>
          <View style={{ padding: space.l, paddingBottom: 0 }}><SectionTitle title={t("sData")} icon="folder" /></View>
          <ListRow icon="trash" title={t("clearCache")} sub={t("clearCacheBody")} onPress={clear} />
          {settings.reminders ? <><Divider /><ListRow icon="bell" title={t("remindersTitle")} sub={t("remindersOn")} onPress={async () => { await cancelReminders(); setSettings({ reminders: false }); }} /></> : null}
        </Card>
        <Card pad={false}>
          <View style={{ padding: space.l, paddingBottom: 0 }}><SectionTitle title={t("sAds")} icon="megaphone" /></View>
          {privacyRequired ? <><ListRow icon="shield" title={t("adPrivacy")} onPress={showPrivacyOptions} /><Divider /></> : null}
          {/* Placeholder only: no billing is built. */}
          <ListRow icon="star" title={t("removeAds")} sub={t("removeAdsBody")} chevron={false} />
        </Card>
        <Card pad={false}>
          <View style={{ padding: space.l, paddingBottom: 0 }}><SectionTitle title={t("sAbout")} icon="info" /></View>
          <ListRow icon="shield" title={t("privacy")} onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Divider />
          <ListRow icon="file" title={t("terms")} onPress={() => Linking.openURL(TERMS_URL)} />
          <Divider />
          <ListRow icon="mail" title={t("contact")} sub={CONTACT_EMAIL} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("RWH Planner (Android " + APP_VERSION + ")")}`)} />
          <Divider />
          <ListRow icon="info" title={t("version", { v: APP_VERSION, c: VERSION_CODE })} chevron={false} />
        </Card>
        <Txt v="tiny" center color={palette.muted}>{lang === "ur" ? "ریزیلینس ٹیکنالوجیز لیبز" : "Resilience Technologies Labs"}</Txt>
      </View>
    </Screen>
  );
}
