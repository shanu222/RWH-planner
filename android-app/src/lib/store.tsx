// App state: settings, planner inputs, saved designs, live rates (with offline cache), remote config and network.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, useColorScheme } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { CITIES, DEFAULTS, compute, normalizeInputs } from "../shared/calc.js";
import { DEFAULT_APP_CONFIG, validateAppConfig } from "../shared/app-config.js";
import { cachedGet, getJSON, readCache } from "./api";
import { KEYS, readJSON, writeJSON } from "./storage";
import { dark as darkPalette, light as lightPalette, type Palette } from "./theme";
import { tr, type Lang } from "./strings";

export type Settings = {
  lang: Lang; areaUnit: "m2" | "ft2"; volUnit: "L" | "gal"; theme: "system" | "light" | "dark";
  onboarded: boolean; onboardStep: number; reminders: boolean;
};
export const DEFAULT_SETTINGS: Settings = { lang: "en", areaUnit: "m2", volUnit: "L", theme: "system", onboarded: false, onboardStep: 0, reminders: false };

export type Inputs = ReturnType<typeof normalizeInputs>;
export type Design = { id: string; name: string; inputs: Inputs; createdAt: string; updatedAt: string };
export type RateInfo = { rate: number; src?: string; url?: string; asOf?: string; estimate?: boolean; live?: "pbs" | "sheet" | "admin"; city?: string };
export type RatesPayload = {
  city: string; rates: Record<string, RateInfo>; live: boolean; sources: { pbs: boolean; sheet: boolean; admin: boolean };
  pbsMonth: string | null; bundledMonth: string; fetchedAt: string;
};
export type RatesState = { status: "loading" | "live" | "bundled" | "offline"; data: RatesPayload | null; at: number | null };
export type AppConfig = typeof DEFAULT_APP_CONFIG & { updatedAt?: string; ai?: boolean };

const REFRESH_MS = 3 * 3600 * 1000;

type Ctx = {
  ready: boolean;
  settings: Settings; setSettings: (p: Partial<Settings>) => void;
  palette: Palette; lang: Lang; rtl: boolean; t: (k: string, v?: Record<string, string | number>) => string;
  inputs: Inputs; setInputs: (p: Partial<Inputs> | ((s: Inputs) => Partial<Inputs>)) => void; resetInputs: () => void;
  result: ReturnType<typeof compute>;
  rates: RatesState; refreshRates: () => Promise<void>;
  config: AppConfig; configFromCache: boolean; refreshConfig: () => Promise<void>;
  online: boolean;
  designs: Design[]; saveDesign: (name: string) => Design; updateDesigns: (fn: (d: Design[]) => Design[]) => void;
};

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

const defaultInputs = (): Inputs => normalizeInputs({ ...DEFAULTS });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [inputs, setInputsState] = useState<Inputs>(defaultInputs);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [rates, setRates] = useState<RatesState>({ status: "loading", data: null, at: null });
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG as AppConfig);
  const [configFromCache, setConfigFromCache] = useState(true);
  const [online, setOnline] = useState(true);
  const configAt = useRef(0);

  // load persisted state
  useEffect(() => {
    (async () => {
      const [s, i, d, c] = await Promise.all([
        readJSON<Partial<Settings>>(KEYS.settings, {}),
        readJSON<Partial<Inputs> | null>(KEYS.inputs, null),
        readJSON<Design[]>(KEYS.designs, []),
        readCache<AppConfig>(KEYS.appConfig),
      ]);
      setSettingsState({ ...DEFAULT_SETTINGS, ...s });
      if (i) setInputsState(normalizeInputs({ ...DEFAULTS, ...i }));
      setDesigns(Array.isArray(d) ? d : []);
      if (c?.data) { setConfig({ ...validateAppConfig(c.data).config, ai: c.data.ai } as AppConfig); configAt.current = c.at; }
      setReady(true);
    })();
  }, []);

  const setSettings = useCallback((p: Partial<Settings>) => {
    setSettingsState(prev => { const next = { ...prev, ...p }; writeJSON(KEYS.settings, next); return next; });
  }, []);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setInputs = useCallback((p: Partial<Inputs> | ((s: Inputs) => Partial<Inputs>)) => {
    setInputsState(prev => {
      const patch = typeof p === "function" ? p(prev) : p;
      const next = normalizeInputs({ ...prev, ...patch });
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => writeJSON(KEYS.inputs, next), 400);
      return next;
    });
  }, []);
  const resetInputs = useCallback(() => setInputs({ ...defaultInputs(), city: inputs.city }), [setInputs, inputs.city]);

  // network
  useEffect(() => NetInfo.addEventListener(s => setOnline(s.isConnected !== false && s.isInternetReachable !== false)), []);

  // live rates for the current city
  const city = inputs.city;
  const refreshRates = useCallback(async () => {
    setRates(r => ({ ...r, status: r.data && r.data.city === city ? r.status : "loading" }));
    try {
      const r = await cachedGet<RatesPayload>(`/api/rates?city=${encodeURIComponent(city)}`, KEYS.rates(city), 30000);
      setRates({ status: r.fromCache ? "offline" : r.data.live ? "live" : "bundled", data: r.data, at: r.at });
    } catch {
      setRates({ status: "offline", data: null, at: null });
    }
  }, [city]);
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(refreshRates, 0); // fetch outside the effect body
    return () => clearTimeout(id);
  }, [ready, refreshRates]);

  // remote config: on launch, then every few hours while the app is in use
  const refreshConfig = useCallback(async () => {
    try {
      const r = await cachedGet<AppConfig>("/api/app-config", KEYS.appConfig, 15000);
      setConfig({ ...validateAppConfig(r.data).config, ai: r.data.ai } as AppConfig);
      setConfigFromCache(r.fromCache);
      if (!r.fromCache) configAt.current = r.at;
    } catch { setConfigFromCache(true); }
    // Older API versions have no /api/app-config: ask the AI status endpoint directly.
    try {
      const s = await getJSON<{ available: boolean }>("/api/ai/status", 15000);
      setConfig(c => (c.ai === s.available ? c : { ...c, ai: s.available }));
    } catch {}
  }, []);
  useEffect(() => {
    if (!ready) return;
    const first = setTimeout(refreshConfig, 0);
    const id = setInterval(refreshConfig, REFRESH_MS);
    const sub = AppState.addEventListener("change", st => {
      if (st === "active" && Date.now() - configAt.current > 10 * 60 * 1000) { refreshConfig(); refreshRates(); }
    });
    return () => { clearTimeout(first); clearInterval(id); sub.remove(); };
  }, [ready, refreshConfig, refreshRates]);
  // when the connection comes back, refresh what failed
  const wasOnline = useRef(true);
  useEffect(() => {
    if (online && !wasOnline.current && ready) { refreshConfig(); refreshRates(); }
    wasOnline.current = online;
  }, [online, ready, refreshConfig, refreshRates]);

  const published = rates.data && rates.data.city === city ? rates.data.rates : null;
  const result = useMemo(() => compute(inputs, published), [inputs, published]);

  const updateDesigns = useCallback((fn: (d: Design[]) => Design[]) => {
    setDesigns(prev => { const next = fn(prev); writeJSON(KEYS.designs, next); return next; });
  }, []);
  const saveDesign = useCallback((name: string) => {
    const now = new Date().toISOString();
    const d: Design = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, inputs, createdAt: now, updatedAt: now };
    updateDesigns(list => [d, ...list]);
    return d;
  }, [inputs, updateDesigns]);

  const dark = settings.theme === "dark" || (settings.theme === "system" && scheme === "dark");
  const palette = dark ? darkPalette : lightPalette;
  const lang = settings.lang;
  const t = useCallback((k: string, v?: Record<string, string | number>) => tr(lang, k, v), [lang]);

  const value: Ctx = {
    ready, settings, setSettings, palette, lang, rtl: lang === "ur", t,
    inputs, setInputs, resetInputs, result, rates, refreshRates,
    config, configFromCache, refreshConfig, online, designs, saveDesign, updateDesigns,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const cityName = (key: string, lang: Lang) => (CITIES as Record<string, { en: string; ur: string }>)[key]?.[lang] ?? key;
