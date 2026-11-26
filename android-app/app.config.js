// RWH Planner – Android app configuration (Expo).
// Build-time switches (see BUILD.md):
//   APP_VARIANT=development   debug build: Google TEST AdMob App ID and test ad units, http allowed for a local API
//   EXPO_PUBLIC_API_URL       API base URL (default: the production Railway API)
//   ADMOB_ANDROID_APP_ID      overrides the real AdMob App ID below
const IS_DEV = process.env.APP_VARIANT === "development";

// ─────────────────────────────────────────────────────────────────────────────
// ADMOB APP ID  ← your real AdMob App ID ("RWH planner" in AdMob → App settings → App ID).
// The ad UNIT IDs are not here: they come from the admin "App settings" tab (GET /api/app-config),
// with defaults in shared/app-config.js.
const ADMOB_APP_ID_RELEASE = process.env.ADMOB_ANDROID_APP_ID || "ca-app-pub-3753880887983252~1798305899";
// Google's official sample App ID, used by development builds so no real ads are requested.
const ADMOB_APP_ID_TEST = "ca-app-pub-3940256099942544~3347511713";
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://rwh-planner-production.up.railway.app").replace(/\/+$/, "");
if (!IS_DEV && !API_URL.startsWith("https://")) throw new Error("Release builds must use an https:// API URL.");

const VERSION = "1.0.0";
const VERSION_CODE = 1;

module.exports = {
  expo: {
    name: "RWH Planner – Rainwater Harvesting",
    slug: "rwh-planner",
    scheme: "rwhplanner",
    version: VERSION,
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    backgroundColor: "#F6F3EE",
    platforms: ["android"],
    android: {
      package: "com.resiliencetech.rwhplanner",
      versionCode: VERSION_CODE,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon-mono.png",
        backgroundColor: "#0B5C66",
      },
      predictiveBackGestureEnabled: true,
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
      ],
      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: "https", host: "rwh-planner.vercel.app", pathPrefix: "/" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      "expo-router",
      ["expo-splash-screen", {
        image: "./assets/splash-icon.png", imageWidth: 168, resizeMode: "contain", backgroundColor: "#F6F3EE",
        dark: { image: "./assets/splash-icon-dark.png", backgroundColor: "#0C1517" },
      }],
      ["expo-font", {
        fonts: [
          "./node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf",
          "./node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf",
          "./node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf",
          "./node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf",
          "./node_modules/@expo-google-fonts/noto-nastaliq-urdu/500Medium/NotoNastaliqUrdu_500Medium.ttf",
          "./node_modules/@expo-google-fonts/noto-nastaliq-urdu/700Bold/NotoNastaliqUrdu_700Bold.ttf",
        ],
      }],
      ["expo-notifications", { icon: "./assets/notification-icon.png", color: "#0B5C66", defaultChannel: "reminders" }],
      "expo-video",
      "expo-image",
      "expo-sharing",
      ["react-native-google-mobile-ads", {
        androidAppId: IS_DEV ? ADMOB_APP_ID_TEST : ADMOB_APP_ID_RELEASE,
        delayAppMeasurementInit: true,
        optimizeInitialization: true,
        optimizeAdLoading: true,
      }],
      ["expo-build-properties", {
        android: {
          minSdkVersion: 24,
          targetSdkVersion: 36,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          enableBundleCompression: false,
          usesCleartextTraffic: IS_DEV,
          extraProguardRules: [
            "-keep class com.google.android.gms.ads.** { *; }",
            "-keep class com.google.android.ump.** { *; }",
            "-keep class expo.modules.** { *; }",
            "-dontwarn com.google.android.gms.**",
            // WorkManager (used by expo-notifications and the ads SDK) creates its Room database by reflection
            "-keep class * extends androidx.room.RoomDatabase { <init>(); }",
            "-keep class androidx.work.impl.WorkDatabase_Impl { *; }",
            "-keep class androidx.room.** { *; }",
          ].join("\n"),
        },
      }],
      ["./plugins/with-android-release", { standaloneDebug: process.env.STANDALONE_DEBUG === "1" }],
    ],
    experiments: { typedRoutes: false },
    extra: {
      apiUrl: API_URL,
      adsTestMode: IS_DEV,
      variant: IS_DEV ? "development" : "production",
      contactEmail: "shahnawaz@sustainablesolution360.com",
      privacyUrl: "https://rwh-planner.vercel.app/privacy.html",
      termsUrl: "https://rwh-planner.vercel.app/terms.html",
    },
  },
};
