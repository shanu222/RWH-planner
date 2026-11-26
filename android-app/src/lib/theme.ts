// Design tokens: water-themed Material 3 palette (deep teal + aqua on warm neutrals), light and dark.
export type Palette = {
  dark: boolean;
  bg: string; surface: string; surface2: string; surface3: string; line: string;
  ink: string; ink2: string; muted: string;
  primary: string; onPrimary: string; primarySoft: string; primaryInk: string;
  aqua: string; aquaSoft: string;
  good: string; goodSoft: string; warn: string; warnSoft: string; bad: string; badSoft: string;
  heroA: string; heroB: string; onHero: string; onHeroMuted: string;
  chartRain: string; chartDemand: string; chartGrid: string;
  overlay: string;
};

export const light: Palette = {
  dark: false,
  bg: "#F6F3EE", surface: "#FFFDF9", surface2: "#EFEBE4", surface3: "#E6E1D8", line: "#DDD6CB",
  ink: "#152326", ink2: "#2E3D41", muted: "#56666A",
  primary: "#0B5C66", onPrimary: "#FFFFFF", primarySoft: "#D9EEEF", primaryInk: "#0A4D56",
  aqua: "#1AA3AD", aquaSoft: "#DDF4F5",
  good: "#1E6B3A", goodSoft: "#DDF0E3", warn: "#8A5A00", warnSoft: "#FBEFD5", bad: "#A3261F", badSoft: "#F8E0DE",
  heroA: "#0B5C66", heroB: "#073F47", onHero: "#FFFFFF", onHeroMuted: "#C4E6E8",
  chartRain: "#1AA3AD", chartDemand: "#C9822B", chartGrid: "#E3DDD3",
  overlay: "rgba(10,20,22,0.45)",
};

export const dark: Palette = {
  dark: true,
  bg: "#0C1517", surface: "#132024", surface2: "#1A2A2F", surface3: "#223439", line: "#2A3C41",
  ink: "#E8F0F0", ink2: "#C9D6D7", muted: "#9DB0B2",
  primary: "#5FD3D8", onPrimary: "#04282C", primarySoft: "#163A3F", primaryInk: "#8FE3E7",
  aqua: "#4FD6DC", aquaSoft: "#143539",
  good: "#7FD69C", goodSoft: "#173325", warn: "#F2C46B", warnSoft: "#3A2E14", bad: "#FF9C93", badSoft: "#3D1C1A",
  heroA: "#0F4A52", heroB: "#082C31", onHero: "#FFFFFF", onHeroMuted: "#A9D9DC",
  chartRain: "#4FD6DC", chartDemand: "#E5A65A", chartGrid: "#26383C",
  overlay: "rgba(0,0,0,0.6)",
};

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 };
export const radius = { s: 10, m: 14, l: 20, xl: 28, pill: 999 };

// Embedded font families (see app.config.js expo-font plugin)
export const fonts = {
  regular: "Inter_400Regular", medium: "Inter_500Medium", semibold: "Inter_600SemiBold", bold: "Inter_700Bold",
  urdu: "NotoNastaliqUrdu_500Medium", urduBold: "NotoNastaliqUrdu_700Bold",
};

export const type = {
  display: { size: 34, weight: "bold" as const },
  h1: { size: 24, weight: "bold" as const },
  h2: { size: 19, weight: "semibold" as const },
  h3: { size: 16, weight: "semibold" as const },
  body: { size: 15, weight: "regular" as const },
  small: { size: 13, weight: "regular" as const },
  tiny: { size: 11.5, weight: "medium" as const },
};
