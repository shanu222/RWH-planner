// Public training video library (GET /api/videos), cached for offline use. Thumbnails are cached by expo-image.
import { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { cachedGet, readCache } from "./api";
import { KEYS } from "./storage";
import { SEED_VIDEOS, VIDEO_CATEGORIES } from "../shared/videos.js";

export type Video = {
  id: string; type: "youtube" | "vimeo" | "file"; ref?: string; src?: string; thumb?: string | null; category: string; lang: string; subtitles?: string;
  title: { en: string; ur: string }; desc?: { en: string; ur: string }; source?: string; sourceUrl?: string; duration?: number | null;
};
export type Category = { key: string; en: string; ur: string };
type Payload = { categories: Category[]; videos: Video[] };

type State = { status: "loading" | "ok" | "offline" | "error"; data: Payload | null; at: number | null };
let shared: State = { status: "loading", data: null, at: null };
const listeners = new Set<(s: State) => void>();
const set = (s: State) => { shared = s; listeners.forEach(l => l(s)); };

const seed = (): Payload => ({
  categories: VIDEO_CATEGORIES as Category[],
  videos: (SEED_VIDEOS as Video[]).map(v => ({ ...v, thumb: v.type === "youtube" ? `https://i.ytimg.com/vi/${v.ref}/hqdefault.jpg` : null })),
});

let inflight: Promise<void> | null = null;
export function loadVideos(force = false) {
  if (inflight && !force) return inflight;
  if (!shared.data) readCache<Payload>(KEYS.videos).then(c => { if (c && !shared.data) set({ status: "loading", data: c.data, at: c.at }); });
  inflight = cachedGet<Payload>("/api/videos", KEYS.videos, 20000)
    .then(r => {
      set({ status: r.fromCache ? "offline" : "ok", data: r.data, at: r.at });
      const thumbs = r.data.videos.map(v => v.thumb).filter(Boolean) as string[];
      if (thumbs.length) Image.prefetch(thumbs, "disk").catch(() => {});
    })
    .catch(() => set({ status: shared.data ? "offline" : "error", data: shared.data ?? seed(), at: shared.at }))
    .finally(() => { inflight = null; });
  return inflight;
}

export function useVideos() {
  const [s, setS] = useState(shared);
  useEffect(() => {
    listeners.add(setS);
    if (!shared.data || shared.status === "loading") loadVideos();
    return () => { listeners.delete(setS); };
  }, []);
  const refresh = useCallback(() => loadVideos(true), []);
  return { ...s, refresh };
}

export const fmtDuration = (s?: number | null) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "");
