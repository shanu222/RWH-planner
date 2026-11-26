// PDF reports from the existing backend endpoint, in English or Urdu, saved on the device and shared via the share sheet.
import React, { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useApp, cityName } from "../lib/store";
import { createReport, deleteReport, listReports, shareReport, type ReportMeta } from "../lib/reports";
import { useAds } from "../lib/ads";
import { space } from "../lib/theme";
import { Screen } from "../components/Screen";
import { Badge, Button, Card, EmptyState, IconButton, Row, Txt, haptic, useToast } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Reports() {
  const { palette, t, lang, inputs, online } = useApp();
  const { afterExport } = useAds();
  const toast = useToast();
  const [list, setList] = useState<ReportMeta[] | null>(null);
  const [busy, setBusy] = useState<"en" | "ur" | null>(null);
  const [error, setError] = useState(false);
  const reload = useCallback(() => listReports().then(setList), []);
  useEffect(() => { reload(); }, [reload]);

  const make = async (l: "en" | "ur") => {
    setBusy(l); setError(false);
    try {
      const r = await createReport(inputs, l);
      haptic.success(); toast(t("reportSaved")); await reload();
      await shareReport(r);
      afterExport(); // a full-screen ad may follow a finished export (rate-limited by remote config)
    } catch { setError(true); }
    finally { setBusy(null); }
  };

  return (
    <Screen back title={t("reportsTitle")} sub={t("reportsSub")}>
      <View style={{ gap: space.l }}>
        <Card>
          <Row gap={10} align="flex-start">
            <Icon name="file" color={palette.primary} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt weight="semibold">{t("newReport")}</Txt>
              <Txt v="small" color={palette.muted}>{t("reportCardDesc")}</Txt>
            </View>
          </Row>
          <Row gap={10} wrap style={{ marginTop: 12 }}>
            <Button title={busy === "en" ? t("reportMaking") : t("reportEnglish")} icon="download" loading={busy === "en"} disabled={!!busy || !online} onPress={() => make("en")} style={{ flexGrow: 1 }} />
            <Button title={busy === "ur" ? t("reportMaking") : t("reportUrdu")} icon="download" kind="tonal" loading={busy === "ur"} disabled={!!busy || !online} onPress={() => make("ur")} style={{ flexGrow: 1 }} />
          </Row>
          {error ? <Txt v="small" color={palette.bad} style={{ marginTop: 10 }}>{t("reportFail")}</Txt> : null}
          {!online ? <Txt v="small" color={palette.warn} style={{ marginTop: 10 }}>{t("offline")}</Txt> : null}
        </Card>
        {list && list.length === 0 ? <EmptyState icon="file" title={t("noReports")} body={t("noReportsBody")} /> : null}
        {(list || []).map(r => (
          <Card key={r.id} onPress={() => shareReport(r)} label={r.name}>
            <Row gap={12}>
              <View style={{ width: 44, height: 52, borderRadius: 8, backgroundColor: palette.badSoft, alignItems: "center", justifyContent: "center" }}><Txt v="tiny" latin weight="bold" color={palette.bad}>PDF</Txt></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="medium" numberOfLines={1}>{cityName(r.city, lang)}</Txt>
                <Row gap={6} wrap><Badge tone="neutral" label={r.lang === "ur" ? "اردو" : "English"} /><Txt v="tiny" color={palette.muted} latin style={{ flexShrink: 1 }}>{Math.round(r.size / 1024)} KB · {new Date(r.createdAt).toLocaleString(lang === "ur" ? "ur-PK" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}</Txt></Row>
              </View>
              <IconButton name="share" label={t("share")} onPress={() => shareReport(r)} />
              <IconButton name="trash" label={t("delete")} color={palette.bad} onPress={() => Alert.alert(t("confirmDelete", { n: r.name }), t("confirmDeleteBody"), [
                { text: t("cancel"), style: "cancel" }, { text: t("delete"), style: "destructive", onPress: async () => { await deleteReport(r); reload(); } },
              ])} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
