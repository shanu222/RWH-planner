import Constants from "expo-constants";
import * as Application from "expo-application";

const extra = (Constants.expoConfig?.extra || {}) as Record<string, unknown>;

// EXPO_PUBLIC_API_URL is inlined by Metro at bundle time (also used by app.config.js, which refuses http in release builds).
export const API_URL = String(process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || "https://rwh-planner-production.up.railway.app").replace(/\/+$/, "");
export const ADS_TEST_MODE = !!extra.adsTestMode || __DEV__;
export const CONTACT_EMAIL = String(extra.contactEmail || "shahnawaz@sustainablesolution360.com");
export const PRIVACY_URL = String(extra.privacyUrl || "https://rwh-planner.vercel.app/privacy.html");
export const TERMS_URL = String(extra.termsUrl || "https://rwh-planner.vercel.app/terms.html");
export const APP_VERSION = Application.nativeApplicationVersion || Constants.expoConfig?.version || "1.0.0";
export const VERSION_CODE = Number(Application.nativeBuildVersion || 1);
export const PACKAGE = "com.resiliencetech.rwhplanner";
