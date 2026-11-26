// Google AdMob: UMP consent first, then SDK init. Placements and unit IDs come from remote config.
// Development builds always use Google's test ad units. Ads never cover controls and collapse when they fail.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import mobileAds, {
  AdEventType, AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, BannerAd, BannerAdSize, InterstitialAd, MaxAdContentRating, TestIds,
} from "react-native-google-mobile-ads";
import { ADS_TEST_MODE } from "./config";
import { useApp } from "./store";

type Placement = "results" | "cost" | "videos";
// Store-listing screenshots are taken with EXPO_PUBLIC_SCREENSHOT=1 (development only) so no test ads appear in them.
const SCREENSHOT_MODE = __DEV__ && process.env.EXPO_PUBLIC_SCREENSHOT === "1";
type AdsCtx = { canShow: boolean; privacyRequired: boolean; showPrivacyOptions: () => Promise<void>; afterExport: () => void };
const Ctx = createContext<AdsCtx>({ canShow: false, privacyRequired: false, showPrivacyOptions: async () => {}, afterExport: () => {} });
export const useAds = () => useContext(Ctx);

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { config, ready } = useApp();
  const [canShow, setCanShow] = useState(false);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const started = useRef(false);
  const inter = useRef<InterstitialAd | null>(null);
  const interLoaded = useRef(false);
  const lastShown = useRef(0);
  const shownCount = useRef(0);

  const enabled = config.ads.enabled && !SCREENSHOT_MODE;

  useEffect(() => {
    if (!ready || !enabled || started.current) return;
    started.current = true;
    (async () => {
      try {
        // Google UMP consent (GDPR / regional privacy laws). Shows a form only where it is required.
        const info = await AdsConsent.requestInfoUpdate({ tagForUnderAgeOfConsent: false });
        let consent = info;
        if (info.isConsentFormAvailable) consent = await AdsConsent.loadAndShowConsentFormIfRequired();
        setPrivacyRequired(consent.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED);
        if (!consent.canRequestAds) return;
        await mobileAds().setRequestConfiguration({
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
          maxAdContentRating: MaxAdContentRating.G,
          testDeviceIdentifiers: ["EMULATOR"],
        });
        await mobileAds().initialize();
        setCanShow(true);
      } catch {
        setCanShow(false); // ads fail silently
      }
    })();
  }, [ready, enabled]);

  // preload one interstitial for the "after PDF export" moment
  const interUnit = ADS_TEST_MODE ? TestIds.INTERSTITIAL : config.ads.units.interstitial;
  useEffect(() => {
    if (!canShow || !enabled || !config.ads.placements.interstitial) return;
    const ad = InterstitialAd.createForAdRequest(interUnit);
    inter.current = ad; interLoaded.current = false;
    const subs = [
      ad.addAdEventListener(AdEventType.LOADED, () => { interLoaded.current = true; }),
      ad.addAdEventListener(AdEventType.CLOSED, () => { interLoaded.current = false; ad.load(); }),
      ad.addAdEventListener(AdEventType.ERROR, () => { interLoaded.current = false; }),
    ];
    ad.load();
    return () => { subs.forEach(u => u()); inter.current = null; };
  }, [canShow, enabled, config.ads.placements.interstitial, interUnit]);

  // Called after a finished PDF export (never mid-task). Rate-limited: min gap and max per session from remote config.
  const afterExport = useCallback(() => {
    const a = config.ads;
    if (!canShow || !a.enabled || !a.placements.interstitial || !inter.current || !interLoaded.current) return;
    if (shownCount.current >= a.interstitialMaxPerSession) return;
    if (Date.now() - lastShown.current < a.interstitialMinSeconds * 1000) return;
    lastShown.current = Date.now(); shownCount.current += 1;
    inter.current.show().catch(() => {});
  }, [canShow, config.ads]);

  const showPrivacyOptions = useCallback(async () => {
    try { await AdsConsent.showPrivacyOptionsForm(); } catch {}
  }, []);

  return <Ctx.Provider value={{ canShow: canShow && enabled, privacyRequired, showPrivacyOptions, afterExport }}>{children}</Ctx.Provider>;
}

// Adaptive banner. Space is reserved while it loads and released if it fails, so there is never an empty gap.
export function AdSlot({ placement, inline = false }: { placement: Placement; inline?: boolean }) {
  const { canShow } = useAds();
  const { config, palette } = useApp();
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  if (!canShow || !config.ads.enabled || !config.ads.placements[placement] || state === "failed") return null;
  const unit = ADS_TEST_MODE ? TestIds.ADAPTIVE_BANNER : placement === "videos" ? config.ads.units.videos : config.ads.units.banner;
  return (
    <View
      accessibilityLabel="Advertisement"
      style={{ alignItems: "center", minHeight: state === "loading" ? (inline ? 0 : 56) : undefined, backgroundColor: inline ? "transparent" : palette.surface, marginVertical: inline ? 8 : 0 }}>
      <BannerAd
        unitId={unit}
        size={inline ? BannerAdSize.INLINE_ADAPTIVE_BANNER : BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setState("loaded")}
        onAdFailedToLoad={() => setState("failed")}
      />
    </View>
  );
}
