import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEYS = {
  settings: "rwh.settings.v1",
  inputs: "rwh.inputs.v1",
  designs: "rwh.designs.v1",
  reports: "rwh.reports.v1",
  appConfig: "rwh.cache.appconfig",
  videos: "rwh.cache.videos",
  ai: "rwh.cache.ai",
  rates: (city: string) => `rwh.cache.rates.${city}`,
  adsState: "rwh.ads.v1",
};

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export async function clearCaches() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter(k => k.startsWith("rwh.cache.")));
}
