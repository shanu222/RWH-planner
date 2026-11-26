// My designs: save, rename, duplicate, delete and share designs stored on this device.
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { compute } from "../shared/calc.js";
import { cityName, useApp, type Design } from "../lib/store";
import { designUrl, shareText } from "../lib/share";
import { area, fmt, pkr } from "../lib/format";
import { space } from "../lib/theme";
import { Screen } from "../components/Screen";
import { Button, Card, EmptyState, IconButton, Row, Txt, useToast } from "../components/ui";
import { Prompt } from "../components/Prompt";
import { Icon } from "../components/Icon";

function DesignCard({ d, onRename }: { d: Design; onRename: (d: Design) => void }) {
  const { palette, lang, t, setInputs, updateDesigns, config, settings, rates } = useApp();
  const toast = useToast();
  // same rates as the planner when they are for this city, otherwise the published ones
  const r = compute(d.inputs, rates.data && rates.data.city === d.inputs.city ? rates.data.rates : null);
  const load = () => { setInputs(d.inputs); toast(t("designLoaded")); router.navigate("/"); };
  return (
    <Card>
      <Row gap={12} align="flex-start">
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }}><Icon name="home" color={palette.primary} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt weight="semibold">{d.name}</Txt>
          <Txt v="small" color={palette.muted}>{cityName(d.inputs.city, lang)} · {area(lang, d.inputs.area, settings.areaUnit)} · {d.inputs.people} {t("people")}</Txt>
          <Txt v="small" color={palette.ink2} latin>{fmt(r.harvest)} L · {Math.round(r.met)}% · {pkr(lang, r.cost.total)}</Txt>
          <Txt v="tiny" color={palette.muted}>{new Date(d.updatedAt).toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB")}</Txt>
        </View>
      </Row>
      <Row wrap gap={4} style={{ marginTop: 10 }} justify="space-between">
        <Button title={t("loadDesign")} small icon="check" onPress={load} />
        <Row gap={0}>
          <IconButton name="edit" label={t("rename")} onPress={() => onRename(d)} />
          <IconButton name="copy" label={t("duplicate")} onPress={() => {
            const now = new Date().toISOString();
            updateDesigns(list => [{ ...d, id: Date.now().toString(36), name: `${d.name} (${t("copySuffix")})`, createdAt: now, updatedAt: now }, ...list]);
          }} />
          <IconButton name="share" label={t("share")} onPress={() => shareText(`${d.name}\n${config.shareMessage[lang]}\n${designUrl(config.webUrl, d.inputs)}`, d.name)} />
          <IconButton name="trash" label={t("delete")} color={palette.bad} onPress={() => Alert.alert(t("confirmDelete", { n: d.name }), t("confirmDeleteBody"), [
            { text: t("cancel"), style: "cancel" },
            { text: t("delete"), style: "destructive", onPress: () => updateDesigns(list => list.filter(x => x.id !== d.id)) },
          ])} />
        </Row>
      </Row>
    </Card>
  );
}

export default function Designs() {
  const { designs, t, updateDesigns } = useApp();
  const [renaming, setRenaming] = useState<Design | null>(null);
  return (
    <Screen back title={t("myDesigns")} sub={t("myDesignsSub")}>
      {designs.length === 0 ? (
        <EmptyState icon="folder" title={t("noDesigns")} body={t("noDesignsBody")} />
      ) : (
        <View style={{ gap: space.m }}>{designs.map(d => <DesignCard key={d.id} d={d} onRename={setRenaming} />)}</View>
      )}
      <Prompt visible={!!renaming} title={t("rename")} initial={renaming?.name ?? ""} onClose={() => setRenaming(null)}
        onSubmit={name => renaming && updateDesigns(list => list.map(x => (x.id === renaming.id ? { ...x, name, updatedAt: new Date().toISOString() } : x)))} />
    </Screen>
  );
}
