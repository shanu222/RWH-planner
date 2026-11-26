import React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../lib/store";
import { Icon, type IconName } from "../../components/Icon";
import { haptic } from "../../components/ui";
import { fonts } from "../../lib/theme";

// Tab bar icon renderer (named function, so React DevTools and lint see a display name)
const tabIcon = (name: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Icon name={name} color={String(color)} size={24} stroke={focused ? 2.3 : 1.9} />;
  };

export default function TabsLayout() {
  const { palette, t, config, lang } = useApp();
  const insets = useSafeAreaInsets();
  const aiOn = !!config.ai && config.features.ai;
  const icon = tabIcon;
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.tap() }}
      screenOptions={{
        headerShown: false,
        animation: "shift",
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarActiveBackgroundColor: "transparent",
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.line, height: 64 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
        tabBarLabelStyle: lang === "ur" ? { fontFamily: fonts.urdu, fontSize: 11, lineHeight: 20 } : { fontFamily: fonts.medium, fontSize: 12 },
        tabBarAllowFontScaling: false,
        sceneStyle: { backgroundColor: palette.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: t("tPlanner"), tabBarIcon: icon("drop"), tabBarAccessibilityLabel: t("tPlanner") }} />
      <Tabs.Screen name="cost" options={{ title: t("tCost"), tabBarIcon: icon("receipt"), tabBarAccessibilityLabel: t("tCost") }} />
      <Tabs.Screen name="learn" options={{ title: t("tLearn"), tabBarIcon: icon("learn"), tabBarAccessibilityLabel: t("tLearn") }} />
      <Tabs.Screen name="assistant" options={{ title: t("tAssistant"), tabBarIcon: icon("spark"), href: aiOn ? undefined : null, tabBarAccessibilityLabel: t("tAssistant") }} />
      <Tabs.Screen name="more" options={{ title: t("tMore"), tabBarIcon: icon("menu"), tabBarAccessibilityLabel: t("tMore") }} />
    </Tabs>
  );
}
