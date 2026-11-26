// Config plugin: release signing from keystore.properties (kept out of git), ABI-split APKs,
// a standalone debug APK (JS bundle embedded) when requested, and https-only network security.
const { withAppBuildGradle, withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SIGNING = `
// --- rwh: release signing (keystore.properties is not in git; see BUILD.md) ---
def rwhKeystoreProps = new Properties()
def rwhKeystoreFile = rootProject.file("../keystore.properties")
if (rwhKeystoreFile.exists()) { rwhKeystoreFile.withInputStream { rwhKeystoreProps.load(it) } }
`;

function withGradle(config, { standaloneDebug }) {
  return withAppBuildGradle(config, cfg => {
    let g = cfg.modResults.contents;
    if (!g.includes("rwh: release signing")) {
      g = g.replace(/^android \{/m, SIGNING + "\nandroid {");
      // add a release signing config next to the debug one
      g = g.replace(/signingConfigs \{\s*debug \{/m, `signingConfigs {
        release {
            if (rwhKeystoreProps["storeFile"]) {
                storeFile rootProject.file("../" + rwhKeystoreProps["storeFile"])
                storePassword rwhKeystoreProps["storePassword"]
                keyAlias rwhKeystoreProps["keyAlias"]
                keyPassword rwhKeystoreProps["keyPassword"]
            }
        }
        debug {`);
      // use it for release builds (falls back to debug signing if the keystore is missing)
      g = g.replace(/(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/m,
        `$1signingConfig rwhKeystoreProps["storeFile"] ? signingConfigs.release : signingConfigs.debug`);
      // ABI splits for APKs (the AAB is split by Google Play itself)
      g = g.replace(/^android \{/m, `android {
    splits {
        abi {
            enable !gradle.startParameter.taskNames.any { it.toLowerCase().contains("bundle") }
            reset()
            include(*((findProperty("reactNativeArchitectures") ?: "arm64-v8a,armeabi-v7a,x86_64,x86").split(",")))
            universalApk true
        }
    }`);
    }
    // Windows: CMake mirrors absolute source paths into object paths, which overflow MAX_PATH (260) for deep
    // codegen sources (e.g. react-native-gesture-handler). Let CMake hash object names that get too long.
    if (!g.includes("CMAKE_OBJECT_PATH_MAX")) {
      g = g.replace(/defaultConfig \{/, `defaultConfig {
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_OBJECT_PATH_MAX=250"
            }
        }`);
    }
    if (standaloneDebug && !g.includes("debuggableVariants = []")) {
      g = g.replace(/^react \{/m, "react {\n    debuggableVariants = []");
    }
    cfg.modResults.contents = g;
    return cfg;
  });
}

// https only (release); development builds may also use a local http API (usesCleartextTraffic)
function withNetworkSecurity(config) {
  config = withDangerousMod(config, ["android", async cfg => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/res/xml");
    fs.mkdirSync(dir, { recursive: true });
    const dev = cfg.extra?.variant === "development";
    fs.writeFileSync(path.join(dir, "network_security_config.xml"), `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="${dev ? "true" : "false"}">
        <trust-anchors><certificates src="system" /></trust-anchors>
    </base-config>
</network-security-config>
`);
    return cfg;
  }]);
  return withAndroidManifest(config, cfg => {
    const app = cfg.modResults.manifest.application[0];
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    // foldables / multi-window / display-size changes: keep the activity (and the React root) alive
    for (const act of app.activity || []) {
      if (act.$["android:name"] !== ".MainActivity") continue;
      const cur = new Set(String(act.$["android:configChanges"] || "").split("|").filter(Boolean));
      ["orientation", "screenSize", "smallestScreenSize", "screenLayout", "density", "keyboard", "keyboardHidden", "uiMode"].forEach(c => cur.add(c));
      act.$["android:configChanges"] = [...cur].join("|");
    }
    app.$["android:allowBackup"] = "false";
    return cfg;
  });
}

module.exports = (config, props = {}) => withNetworkSecurity(withGradle(config, props));
