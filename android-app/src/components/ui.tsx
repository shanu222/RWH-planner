// UI kit: typography (Inter / Noto Nastaliq Urdu), cards, buttons, chips, steppers, banners, skeletons, empty states, toast.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  AccessibilityRole, ActivityIndicator, Animated, Pressable, StyleProp, Text, TextInput, TextStyle, View, ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../lib/store";
import { fonts, radius, space, type as T } from "../lib/theme";
import { Icon, type IconName } from "./Icon";

type Variant = keyof typeof T;

export const haptic = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
};

export function useFont() {
  const { lang } = useApp();
  return useCallback((v: Variant = "body", opts: { latin?: boolean; weight?: "regular" | "medium" | "semibold" | "bold" } = {}): TextStyle => {
    const base = T[v];
    const w = opts.weight || base.weight;
    if (lang === "ur" && !opts.latin) {
      const size = base.size * 0.92;
      return { fontFamily: w === "bold" || w === "semibold" ? fonts.urduBold : fonts.urdu, fontSize: size, lineHeight: Math.round(size * 2.4), writingDirection: "rtl" };
    }
    return { fontFamily: fonts[w], fontSize: base.size, lineHeight: Math.round(base.size * 1.4) };
  }, [lang]);
}

export function Txt({ v = "body", color, weight, latin, style, children, numberOfLines, center, accessibilityRole, selectable }: {
  v?: Variant; color?: string; weight?: "regular" | "medium" | "semibold" | "bold"; latin?: boolean; style?: StyleProp<TextStyle>;
  children: React.ReactNode; numberOfLines?: number; center?: boolean; accessibilityRole?: AccessibilityRole; selectable?: boolean;
}) {
  const { palette } = useApp();
  const font = useFont();
  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      accessibilityRole={accessibilityRole ?? (v === "h1" || v === "h2" || v === "display" ? "header" : undefined)}
      style={[font(v, { latin, weight }), { color: color ?? palette.ink, textAlign: center ? "center" : "left" }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style, pad = true, onPress, label }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: boolean; onPress?: () => void; label?: string }) {
  const { palette } = useApp();
  const s: ViewStyle = { backgroundColor: palette.surface, borderRadius: radius.l, borderWidth: 1, borderColor: palette.line, padding: pad ? space.l : 0, overflow: "hidden" };
  if (onPress) {
    return (
      <Pressable onPress={() => { haptic.tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={label}
        android_ripple={{ color: palette.primarySoft }} style={({ pressed }) => [s, { opacity: pressed ? 0.92 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s, style]}>{children}</View>;
}

export function Row({ children, style, gap = space.s, wrap, align = "center", justify }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean; align?: ViewStyle["alignItems"]; justify?: ViewStyle["justifyContent"] }) {
  return <View style={[{ flexDirection: "row", alignItems: align, gap, flexWrap: wrap ? "wrap" : "nowrap", justifyContent: justify }, style]}>{children}</View>;
}

export function Button({ title, onPress, kind = "primary", icon, loading, disabled, style, small, label }: {
  title: string; onPress: () => void; kind?: "primary" | "tonal" | "outline" | "text" | "danger"; icon?: IconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean; label?: string;
}) {
  const { palette } = useApp();
  const bg = { primary: palette.primary, tonal: palette.primarySoft, outline: "transparent", text: "transparent", danger: palette.badSoft }[kind];
  const fg = { primary: palette.onPrimary, tonal: palette.primaryInk, outline: palette.primary, text: palette.primary, danger: palette.bad }[kind];
  return (
    <Pressable
      onPress={() => { if (!disabled && !loading) { haptic.press(); onPress(); } }}
      accessibilityRole="button" accessibilityLabel={label || title} accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      android_ripple={{ color: kind === "primary" ? "rgba(255,255,255,0.2)" : palette.primarySoft, borderless: false }}
      style={({ pressed }) => [{
        minHeight: small ? 40 : 48, paddingHorizontal: small ? 14 : 20, borderRadius: radius.pill, backgroundColor: bg,
        borderWidth: kind === "outline" ? 1.5 : 0, borderColor: palette.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: disabled ? 0.45 : pressed ? 0.88 : 1, overflow: "hidden",
      }, style]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <Icon name={icon} size={small ? 18 : 20} color={fg} /> : null}
      <Txt v={small ? "small" : "h3"} weight="semibold" color={fg} numberOfLines={1}>{title}</Txt>
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color, size = 22, bg, flip }: { name: IconName; onPress: () => void; label: string; color?: string; size?: number; bg?: string; flip?: boolean }) {
  const { palette } = useApp();
  return (
    <Pressable onPress={() => { haptic.tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      android_ripple={{ color: palette.primarySoft, borderless: true, radius: 24 }}
      style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: bg }}>
      <Icon name={name} size={size} color={color ?? palette.ink2} flip={flip} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon, badge, latin }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; badge?: string; latin?: boolean }) {
  const { palette } = useApp();
  return (
    <Pressable onPress={() => { haptic.tap(); onPress(); }} accessibilityRole="button" accessibilityState={{ selected: !!selected }} accessibilityLabel={badge ? `${label}, ${badge}` : label}
      android_ripple={{ color: palette.primarySoft }}
      style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5,
        borderColor: selected ? palette.primary : palette.line, backgroundColor: selected ? palette.primarySoft : palette.surface,
        flexDirection: "row", alignItems: "center", gap: 6 }}>
      {selected ? <Icon name="check" size={16} color={palette.primaryInk} stroke={2.4} /> : icon ? <Icon name={icon} size={16} color={palette.ink2} /> : null}
      <Txt v="small" weight={selected ? "semibold" : "medium"} latin={latin} color={selected ? palette.primaryInk : palette.ink2}>{label}</Txt>
      {badge ? <View style={{ backgroundColor: palette.aqua, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}><Txt v="tiny" color="#fff" weight="bold">{badge}</Txt></View> : null}
    </Pressable>
  );
}

export function Segmented<K extends string>({ value, options, onChange, label }: { value: K; options: { key: K; label: string; icon?: IconName }[]; onChange: (k: K) => void; label?: string }) {
  const { palette } = useApp();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", backgroundColor: palette.surface2, borderRadius: radius.pill, padding: 4, gap: 4 }}>
      {options.map(o => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => { haptic.tap(); onChange(o.key); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={o.label}
            style={{ flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
              backgroundColor: on ? palette.primarySoft : "transparent" }}>
            {o.icon ? <Icon name={o.icon} size={18} color={on ? palette.primary : palette.muted} /> : null}
            <Txt v="small" weight={on ? "semibold" : "medium"} color={on ? palette.primaryInk : palette.muted} numberOfLines={1}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min, max, step = 1, label, format }: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number; label: string; format?: (n: number) => string }) {
  const { palette } = useApp();
  const btn = (dir: -1 | 1) => {
    const next = Math.min(max, Math.max(min, Math.round((value + dir * step) * 100) / 100));
    const disabled = dir < 0 ? value <= min : value >= max;
    return (
      <Pressable disabled={disabled} onPress={() => { haptic.tap(); onChange(next); }} accessibilityRole="button" accessibilityLabel={`${label} ${dir < 0 ? "−" : "+"}`}
        android_ripple={{ color: palette.primarySoft, borderless: true, radius: 24 }}
        style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: palette.surface2, opacity: disabled ? 0.4 : 1 }}>
        <Icon name={dir < 0 ? "minus" : "plus"} size={20} color={palette.ink} />
      </Pressable>
    );
  };
  return (
    <View accessible accessibilityLabel={`${label}: ${format ? format(value) : value}`} accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={e => onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === "increment" ? step : -step))))}
      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {btn(-1)}
      <Txt v="h2" latin style={{ minWidth: 44, textAlign: "center" }}>{format ? format(value) : String(value)}</Txt>
      {btn(1)}
    </View>
  );
}

export function NumField({ value, onCommit, label, suffix, width = 120, decimals = 0 }: { value: number; onCommit: (n: number) => void; label: string; suffix?: string; width?: number; decimals?: number }) {
  const { palette } = useApp();
  const font = useFont();
  const fmtV = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 10 ** decimals) / 10 ** decimals) : "");
  const [text, setText] = useState(fmtV(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(fmtV(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => { const n = Number(text.replace(/,/g, "")); if (Number.isFinite(n) && text.trim() !== "") onCommit(n); else setText(fmtV(value)); };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.surface2, borderRadius: radius.s, paddingHorizontal: 12, minHeight: 48, width, borderWidth: 1, borderColor: palette.line }}>
      <TextInput
        value={text} onChangeText={setText} keyboardType="decimal-pad" inputMode="decimal" returnKeyType="done" selectTextOnFocus
        onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; commit(); }} onSubmitEditing={commit}
        accessibilityLabel={label}
        style={[font("h3", { latin: true }), { flex: 1, color: palette.ink, padding: 0, textAlign: "left" }]}
        placeholderTextColor={palette.muted}
      />
      {suffix ? <Txt v="small" color={palette.muted}>{suffix}</Txt> : null}
    </View>
  );
}

export function Badge({ label, tone = "primary", icon }: { label: string; tone?: "primary" | "good" | "warn" | "bad" | "neutral" | "aqua"; icon?: IconName }) {
  const { palette } = useApp();
  const map = {
    primary: [palette.primarySoft, palette.primaryInk], good: [palette.goodSoft, palette.good], warn: [palette.warnSoft, palette.warn],
    bad: [palette.badSoft, palette.bad], neutral: [palette.surface2, palette.ink2], aqua: [palette.aquaSoft, palette.primaryInk],
  }[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: map[0], borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      {tone === "good" && !icon ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: map[1] }} /> : null}
      {icon ? <Icon name={icon} size={14} color={map[1]} /> : null}
      <Txt v="tiny" weight="semibold" color={map[1]}>{label}</Txt>
    </View>
  );
}

export function SectionTitle({ title, icon, right }: { title: string; icon?: IconName; right?: React.ReactNode }) {
  const { palette } = useApp();
  return (
    <Row style={{ marginBottom: space.m }} justify="space-between">
      <Row gap={8} style={{ flexShrink: 1 }}>
        {icon ? <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={18} color={palette.primary} /></View> : null}
        <Txt v="h3" style={{ flexShrink: 1 }} accessibilityRole="header">{title}</Txt>
      </Row>
      {right}
    </Row>
  );
}

export function Skeleton({ h = 16, w = "100%", r = 8, style }: { h?: number; w?: ViewStyle["width"]; r?: number; style?: StyleProp<ViewStyle> }) {
  const { palette } = useApp();
  const [a] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.5, duration: 650, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [a]);
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ height: h, width: w, borderRadius: r, backgroundColor: palette.surface3, opacity: a }, style]} />;
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body?: string; action?: string; onAction?: () => void }) {
  const { palette } = useApp();
  return (
    <View style={{ alignItems: "center", paddingVertical: 36, paddingHorizontal: 24, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={34} color={palette.primary} />
      </View>
      <Txt v="h3" center>{title}</Txt>
      {body ? <Txt v="small" center color={palette.muted}>{body}</Txt> : null}
      {action && onAction ? <Button title={action} onPress={onAction} kind="tonal" icon="refresh" small style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

export function Banner({ text, tone = "neutral", icon, onPress, onClose, action }: { text: string; tone?: "neutral" | "warn" | "primary"; icon?: IconName; onPress?: () => void; onClose?: () => void; action?: string }) {
  const { palette, t } = useApp();
  const bg = tone === "warn" ? palette.warnSoft : tone === "primary" ? palette.primary : palette.surface2;
  const fg = tone === "warn" ? palette.warn : tone === "primary" ? palette.onPrimary : palette.ink2;
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: bg, borderRadius: radius.m, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Pressable style={{ flex: 1 }} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "link" : undefined}>
        <Txt v="small" color={fg}>{text}</Txt>
        {action ? <Txt v="small" weight="bold" color={fg} style={{ textDecorationLine: "underline" }}>{action}</Txt> : null}
      </Pressable>
      {onClose ? <IconButton name="close" size={18} color={fg} label={t("dismiss")} onPress={onClose} /> : null}
    </View>
  );
}

export function ListRow({ icon, title, sub, onPress, right, danger, chevron = true }: { icon?: IconName; title: string; sub?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean; chevron?: boolean }) {
  const { palette, rtl } = useApp();
  return (
    <Pressable onPress={onPress ? () => { haptic.tap(); onPress(); } : undefined} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={sub ? `${title}. ${sub}` : title}
      android_ripple={{ color: palette.primarySoft }}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: space.l, paddingVertical: 12, minHeight: 56 }}>
      {icon ? <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: danger ? palette.badSoft : palette.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color={danger ? palette.bad : palette.primary} /></View> : null}
      <View style={{ flex: 1 }}>
        <Txt weight="medium" color={danger ? palette.bad : palette.ink}>{title}</Txt>
        {sub ? <Txt v="small" color={palette.muted}>{sub}</Txt> : null}
      </View>
      {right}
      {onPress && chevron && !right ? <Icon name="chevron" size={20} color={palette.muted} flip={rtl} /> : null}
    </Pressable>
  );
}

export function Divider() {
  const { palette } = useApp();
  return <View style={{ height: 1, backgroundColor: palette.line, marginHorizontal: space.l }} />;
}

// ---- toast ----
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { palette } = useApp();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string | null>(null);
  const [y] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    Animated.spring(y, { toValue: 1, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => Animated.timing(y, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null)), 2800);
  }, [y]);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View pointerEvents="none" accessibilityLiveRegion="polite"
          style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 96, opacity: y, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={{ backgroundColor: palette.dark ? palette.surface3 : palette.ink, borderRadius: radius.m, paddingVertical: 12, paddingHorizontal: 16, elevation: 6 }}>
            <Txt v="small" color={palette.dark ? palette.ink : "#fff"}>{msg}</Txt>
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}
