import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, TextInput } from "react-native";
import { useApp } from "../lib/store";
import { radius, space } from "../lib/theme";
import { Button, Row, Txt, useFont } from "./ui";

type PromptProps = { visible: boolean; title: string; initial: string; onSubmit: (v: string) => void; onClose: () => void; submitLabel?: string };

// The body is keyed on each opening, so the text field starts from `initial` every time.
export function Prompt(props: PromptProps) {
  return <PromptBody key={props.visible ? `open:${props.initial}` : "closed"} {...props} />;
}

function PromptBody({ visible, title, initial, onSubmit, onClose, submitLabel }: PromptProps) {
  const { palette, t } = useApp();
  const font = useFont();
  const [v, setV] = useState(initial);
  const ok = () => { if (v.trim()) { onSubmit(v.trim().slice(0, 80)); onClose(); } };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: palette.overlay, justifyContent: "center", padding: space.xl }} onPress={onClose}>
          <Pressable onPress={() => {}} style={{ backgroundColor: palette.surface, borderRadius: radius.xl, padding: space.xl, gap: space.l, maxWidth: 480, width: "100%", alignSelf: "center" }}>
            <Txt v="h2">{title}</Txt>
            <TextInput value={v} onChangeText={setV} autoFocus selectTextOnFocus onSubmitEditing={ok} maxLength={80} accessibilityLabel={title}
              style={[font("body"), { color: palette.ink, borderWidth: 1.5, borderColor: palette.primary, borderRadius: radius.s, paddingHorizontal: 12, minHeight: 50, backgroundColor: palette.surface2 }]} />
            <Row justify="flex-end" gap={8}>
              <Button title={t("cancel")} kind="text" onPress={onClose} small />
              <Button title={submitLabel ?? t("save")} onPress={ok} small disabled={!v.trim()} />
            </Row>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
