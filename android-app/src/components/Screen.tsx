// Screen shell: large header, global banners (offline, admin announcement, optional update), edge-to-edge insets.
import React, { useEffect, useState } from "react";
import { Linking, RefreshControl, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "../lib/store";
import { readJSON, writeJSON } from "../lib/storage";
import { VERSION_CODE } from "../lib/config";
import { space } from "../lib/theme";
import { Banner, IconButton, Row, Txt } from "./ui";

const DISMISS_KEY = "rwh.announce.dismissed";

export function GlobalBanners() {
  const { online, config, lang, t } = useApp();
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => { readJSON<string | null>(DISMISS_KEY, null).then(setDismissed); }, []);
  const a = config.announcement;
  const text = a?.enabled ? (a[lang] || a.en || a.ur) : "";
  const showAnn = !!text && dismissed !== a.id;
  const updateAvail = config.latestVersionCode > VERSION_CODE;
  if (online && !showAnn && !updateAvail) return null;
  return (
    <View style={{ gap: 8, marginBottom: space.m }}>
      {!online ? <Banner tone="warn" icon="offline" text={t("offline")} /> : null}
      {showAnn ? (
        <Banner tone="primary" icon="megaphone" text={text}
          action={a.link ? t("learnMore") : undefined}
          onPress={a.link ? () => Linking.openURL(a.link) : undefined}
          onClose={() => { setDismissed(a.id); writeJSON(DISMISS_KEY, a.id); }} />
      ) : null}
      {updateAvail ? <Banner icon="download" text={t("updateAvailable")} action={t("updateNow")} onPress={() => Linking.openURL(config.playStoreUrl)} /> : null}
    </View>
  );
}

export function useLayout() {
  const { width } = useWindowDimensions();
  return { width, tablet: width >= 840, medium: width >= 600, compact: width < 380, contentMax: 1180 };
}

export function Screen({ title, sub, children, right, back, refreshing, onRefresh, footer, scroll = true, banners = true, padded = true }: {
  title?: string; sub?: string; children: React.ReactNode; right?: React.ReactNode; back?: boolean;
  refreshing?: boolean; onRefresh?: () => void; footer?: React.ReactNode; scroll?: boolean; banners?: boolean; padded?: boolean;
}) {
  const { palette, rtl, t } = useApp();
  const insets = useSafeAreaInsets();
  const { contentMax, medium } = useLayout();
  const px = medium ? space.xxl : space.l;
  const header = title ? (
    <Row style={{ paddingTop: insets.top + 8, paddingHorizontal: back ? 4 : px, paddingBottom: 8 }} justify="space-between" align="center">
      <Row gap={4} style={{ flex: 1 }}>
        {back ? <IconButton name="back" label={t("back")} flip={rtl} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} /> : null}
        <View style={{ flex: 1 }}>
          <Txt v="h1" numberOfLines={2}>{title}</Txt>
          {sub ? <Txt v="small" color={palette.muted}>{sub}</Txt> : null}
        </View>
      </Row>
      {right}
    </Row>
  ) : <View style={{ height: insets.top }} />;
  const body = (
    <View style={{ width: "100%", maxWidth: contentMax, alignSelf: "center", paddingHorizontal: padded ? px : 0, paddingBottom: space.xxl }}>
      {banners ? <GlobalBanners /> : null}
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {header}
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 4 }}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[palette.primary]} progressBackgroundColor={palette.surface} /> : undefined}>
          {body}
        </ScrollView>
      ) : <View style={{ flex: 1 }}>{body}</View>}
      {footer}
    </View>
  );
}
