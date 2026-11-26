import React, { useEffect, useRef } from "react";
import { I18nManager, Linking, View } from "react-native";
import { Stack, ThemeProvider, DarkTheme, DefaultTheme, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { reloadAppAsync } from "expo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../lib/store";
import { AdsProvider } from "../lib/ads";
import { VERSION_CODE } from "../lib/config";
import { Button, ToastProvider, Txt } from "../components/ui";
import { Icon } from "../components/Icon";
import { space } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 250 });

function UpdateRequired() {
  const { palette, t, config } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center", padding: space.xxl, gap: 14 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name="download" size={40} color={palette.primary} />
      </View>
      <Txt v="h1" center>{t("updateTitle")}</Txt>
      <Txt center color={palette.muted}>{t("updateBody")}</Txt>
      <Button title={t("updateBtn")} icon="external" onPress={() => Linking.openURL(config.playStoreUrl)} style={{ marginTop: 8, alignSelf: "stretch" }} />
    </View>
  );
}

function Root() {
  const { ready, settings, palette, config } = useApp();
  const rtlChecked = useRef(false);

  // Urdu uses a full right-to-left layout; switching direction needs a restart.
  useEffect(() => {
    if (!ready || rtlChecked.current) return;
    rtlChecked.current = true;
    const wantRTL = settings.lang === "ur";
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== wantRTL) {
      I18nManager.forceRTL(wantRTL);
      reloadAppAsync("layout direction").catch(() => {});
      return;
    }
    SplashScreen.hideAsync().catch(() => {});
  }, [ready, settings.lang]);

  useEffect(() => { SystemUI.setBackgroundColorAsync(palette.bg).catch(() => {}); }, [palette.bg]);

  // reminder notification taps open the calendar
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(r => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === "string") router.push(url as never);
    });
    return () => sub.remove();
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  const navTheme = palette.dark ? DarkTheme : DefaultTheme;
  const theme = { ...navTheme, colors: { ...navTheme.colors, background: palette.bg, card: palette.surface, primary: palette.primary, text: palette.ink, border: palette.line } };
  const mustUpdate = VERSION_CODE < config.minVersionCode;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={palette.dark ? "light" : "dark"} />
      {mustUpdate ? <UpdateRequired /> : (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: palette.bg } }}>
          <Stack.Protected guard={!settings.onboarded}>
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          </Stack.Protected>
          <Stack.Protected guard={settings.onboarded}>
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen name="video/[id]" />
            <Stack.Screen name="guide/[key]" />
            <Stack.Screen name="designs" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="about" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ToastProvider>
          <AdsProvider>
            <Root />
          </AdsProvider>
        </ToastProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
