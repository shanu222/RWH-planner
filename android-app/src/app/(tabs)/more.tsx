import React from "react";
import { Linking, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../lib/store";
import { shareText } from "../../lib/share";
import { PACKAGE } from "../../lib/config";
import { space } from "../../lib/theme";
import { Screen } from "../../components/Screen";
import { Card, Divider, ListRow, Txt } from "../../components/ui";

export default function More() {
  const { t, designs, config, lang, palette } = useApp();
  const rate = () => Linking.openURL(`market://details?id=${PACKAGE}`).catch(() => Linking.openURL(config.playStoreUrl));
  return (
    <Screen title={t("moreTitle")}>
      <View style={{ gap: space.l }}>
        <Card pad={false}>
          <ListRow icon="folder" title={t("myDesigns")} sub={`${t("myDesignsSub")} · ${designs.length}`} onPress={() => router.push("/designs")} />
          <Divider />
          <ListRow icon="file" title={t("reportsLink")} sub={t("reportsSub")} onPress={() => router.push("/reports")} />
          <Divider />
          <ListRow icon="calendar" title={t("calTitle")} onPress={() => router.push("/learn?seg=calendar")} />
        </Card>
        <Card pad={false}>
          <ListRow icon="settings" title={t("settingsLink")} onPress={() => router.push("/settings")} />
          <Divider />
          <ListRow icon="share" title={t("shareApp")} onPress={() => shareText(`${config.shareMessage[lang]}\n${config.playStoreUrl}`, t("appName"))} />
          <Divider />
          <ListRow icon="star" title={t("rateApp")} onPress={rate} />
          <Divider />
          <ListRow icon="info" title={t("aboutLink")} onPress={() => router.push("/about")} />
        </Card>
        <Txt v="tiny" center color={palette.muted}>{t("footer")}</Txt>
      </View>
    </Screen>
  );
}
