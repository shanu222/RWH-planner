// Bottom-sheet list picker (cities and other long lists).
import React from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../lib/store";
import { radius, space } from "../lib/theme";
import { Icon } from "./Icon";
import { haptic, Txt } from "./ui";

export type PickerOption = { key: string; label: string; sub?: string };

export function Picker({ visible, title, options, value, onSelect, onClose }: {
  visible: boolean; title: string; options: PickerOption[]; value: string; onSelect: (k: string) => void; onClose: () => void;
}) {
  const { palette } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: palette.overlay }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "75%", paddingBottom: insets.bottom + 8 }}>
        <View style={{ alignItems: "center", paddingTop: 10 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line }} /></View>
        <Txt v="h2" style={{ paddingHorizontal: space.xl, paddingVertical: space.m }}>{title}</Txt>
        <ScrollView>
          {options.map(o => {
            const on = o.key === value;
            return (
              <Pressable key={o.key} onPress={() => { haptic.tap(); onSelect(o.key); onClose(); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
                android_ripple={{ color: palette.primarySoft }}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: space.xl, minHeight: 56, paddingVertical: 8, backgroundColor: on ? palette.primarySoft : "transparent" }}>
                <View style={{ flex: 1 }}>
                  <Txt weight={on ? "semibold" : "regular"} color={on ? palette.primaryInk : palette.ink}>{o.label}</Txt>
                  {o.sub ? <Txt v="small" color={palette.muted}>{o.sub}</Txt> : null}
                </View>
                {on ? <Icon name="check" color={palette.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
