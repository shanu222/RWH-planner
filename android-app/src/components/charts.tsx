// Responsive SVG charts: monthly water balance, tank-size reliability curve, reliability ring.
import React, { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { MONTHS } from "../shared/i18n.js";
import { useApp } from "../lib/store";
import { compact, fmt } from "../lib/format";
import { fonts } from "../lib/theme";
import { Row, Txt } from "./ui";

function useWidth(initial = 320) {
  const [w, setW] = useState(initial);
  return { w, onLayout: (e: { nativeEvent: { layout: { width: number } } }) => setW(Math.max(200, e.nativeEvent.layout.width)) };
}

function Legend({ items }: { items: { color: string; label: string; line?: boolean }[] }) {
  const { palette } = useApp();
  return (
    <Row wrap gap={14} style={{ marginTop: 8 }}>
      {items.map(i => (
        <Row key={i.label} gap={6}>
          <View style={{ width: 14, height: i.line ? 3 : 10, borderRadius: 2, backgroundColor: i.color }} />
          <Txt v="tiny" color={palette.muted}>{i.label}</Txt>
        </Row>
      ))}
    </Row>
  );
}

// Monthly: collected (bars), household demand (line), used from tank (inner bar)
export function MonthlyChart({ inflow, demand, used, height = 190 }: { inflow: number[]; demand: number[]; used: number[]; height?: number }) {
  const { palette, lang, rtl, t } = useApp();
  const { w, onLayout } = useWidth();
  const padL = 40, padR = 8, padT = 10, padB = 22;
  const iw = w - padL - padR, ih = height - padT - padB;
  const max = Math.max(1, ...inflow, ...demand) * 1.08;
  const bw = iw / 12;
  const order = (i: number) => (rtl ? 11 - i : i);
  const x = (i: number) => padL + order(i) * bw;
  const y = (v: number) => padT + ih - (v / max) * ih;
  const ticks = [0, 0.5, 1].map(f => f * max);
  const months = lang === "ur" ? MONTHS.ur : MONTHS.en;
  const narrow = w < 330;
  const demandPath = demand.map((d, i) => `${i ? "L" : "M"}${x(i) + bw / 2},${y(d)}`).join(" ");
  const total = inflow.reduce((a, b) => a + b, 0);
  return (
    <View onLayout={onLayout} accessible accessibilityLabel={`${t("waterSaved")}. ${t("collected")}: ${fmt(total)} L`}>
      <Svg width={w} height={height}>
        {ticks.map((v, i) => (
          <G key={i}>
            <Line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke={palette.chartGrid} strokeWidth={1} />
            <SvgText x={padL - 6} y={y(v) + 4} fontSize={10} fill={palette.muted} textAnchor="end" fontFamily={fonts.regular}>{compact(v)}</SvgText>
          </G>
        ))}
        {inflow.map((v, i) => (
          <G key={i}>
            <Rect x={x(i) + bw * 0.16} y={y(v)} width={bw * 0.68} height={Math.max(0, padT + ih - y(v))} rx={3} fill={palette.chartRain} opacity={0.35} />
            <Rect x={x(i) + bw * 0.16} y={y(used[i] || 0)} width={bw * 0.68} height={Math.max(0, padT + ih - y(used[i] || 0))} rx={3} fill={palette.chartRain} />
            {(!narrow || i % 2 === 0) ? (
              <SvgText x={x(i) + bw / 2} y={height - 6} fontSize={lang === "ur" ? 9 : 10} fill={palette.muted} textAnchor="middle" fontFamily={lang === "ur" ? fonts.urdu : fonts.regular}>
                {lang === "ur" ? months[i].slice(0, 4) : months[i].slice(0, 3)}
              </SvgText>
            ) : null}
          </G>
        ))}
        <Path d={demandPath} stroke={palette.chartDemand} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        {demand.map((d, i) => <Circle key={i} cx={x(i) + bw / 2} cy={y(d)} r={2.6} fill={palette.chartDemand} />)}
      </Svg>
      <Legend items={[
        { color: palette.chartRain, label: t("used") },
        { color: palette.chartRain + "59", label: t("collected") },
        { color: palette.chartDemand, label: t("demand"), line: true },
      ]} />
    </View>
  );
}

// Share of demand met (%) by tank size, with the recommended and selected sizes marked
export function TankCurve({ curve, recommended, selected, height = 170 }: { curve: { V: number; pct: number }[]; recommended: number; selected: number; height?: number }) {
  const { palette, rtl, t } = useApp();
  const { w, onLayout } = useWidth();
  const padL = 34, padR = 12, padT = 12, padB = 24;
  const iw = w - padL - padR, ih = height - padT - padB;
  const n = curve.length;
  const x = (i: number) => padL + ((rtl ? n - 1 - i : i) / (n - 1)) * iw;
  const y = (p: number) => padT + ih - (Math.min(100, p) / 100) * ih;
  const path = curve.map((c, i) => `${i ? "L" : "M"}${x(i)},${y(c.pct)}`).join(" ");
  const area = `${path} L${x(n - 1)},${padT + ih} L${x(0)},${padT + ih} Z`;
  const ri = curve.findIndex(c => c.V === recommended), si = curve.findIndex(c => c.V === selected);
  return (
    <View onLayout={onLayout} accessible accessibilityLabel={`${t("tankCurveTitle")}. ${t("recommendedShort")}: ${fmt(recommended)} L, ${Math.round(curve[ri]?.pct ?? 0)}%`}>
      <Svg width={w} height={height}>
        {[0, 50, 100].map(p => (
          <G key={p}>
            <Line x1={padL} x2={w - padR} y1={y(p)} y2={y(p)} stroke={palette.chartGrid} />
            <SvgText x={padL - 6} y={y(p) + 4} fontSize={10} fill={palette.muted} textAnchor="end" fontFamily={fonts.regular}>{`${p}%`}</SvgText>
          </G>
        ))}
        <Path d={area} fill={palette.primary} opacity={0.12} />
        <Path d={path} stroke={palette.primary} strokeWidth={2.5} fill="none" />
        {ri >= 0 ? <Line x1={x(ri)} x2={x(ri)} y1={padT} y2={padT + ih} stroke={palette.aqua} strokeDasharray="4 4" strokeWidth={1.5} /> : null}
        {curve.map((c, i) => (i % 2 === 0 || i === n - 1) ? (
          <SvgText key={c.V} x={x(i)} y={height - 6} fontSize={9.5} fill={palette.muted} textAnchor="middle" fontFamily={fonts.regular}>{c.V >= 1000 ? `${c.V / 1000}k` : c.V}</SvgText>
        ) : null)}
        {si >= 0 ? <Circle cx={x(si)} cy={y(curve[si].pct)} r={6} fill={palette.surface} stroke={palette.primary} strokeWidth={3} /> : null}
      </Svg>
    </View>
  );
}

export function Ring({ pct, size = 76, stroke = 9, color, track, label }: { pct: number; size?: number; stroke?: number; color: string; track: string; label?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={label ?? `${Math.round(p)}%`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${(c * p) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
        <Txt v="h3" latin color={color}>{Math.round(p)}%</Txt>
      </View>
    </View>
  );
}
