# RWH Planner – Android app: build and release

Expo SDK 58 · React Native 0.88 · Expo Router · package `com.resiliencetech.rwhplanner` · min SDK 24 · target SDK 36.

The app uses the same backend as the website. Rates, videos, the Google Sheet link, AI keys and the **App settings** (ads, announcement, feature switches, minimum version) all come from the API, so admin changes reach the app without a new build. The calculation engine is `shared/calc.js`, copied into `android-app/src/shared/` by `npm run sync` (never edit the copy).

## Requirements

- Node 20+ (tested with 24), JDK 17 or 21, Android SDK (platform 36/37, build-tools; Gradle downloads what is missing).
- Environment (PowerShell):

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"; $env:JAVA_HOME="C:\Program Files\Java\jdk-21"
```

**Windows path length:** the native (C++) build fails with `Filename longer than 260 characters` when the project sits in a deep folder. Build through a short drive letter (no admin rights needed), and run every Gradle command from `R:\android`:

```powershell
subst R: D:\RWH\android-app
```

If Gradle stalls or throws `StackOverflowError` in `FreeListBlockStore`, the shared Gradle cache is damaged. Use a clean one: `$env:GRADLE_USER_HOME="D:\gradle-home"`.

## First setup

```powershell
cd D:\RWH; npm run sync; cd android-app; npm ci
```

## Configuration

| What | Where |
| --- | --- |
| API URL | `EXPO_PUBLIC_API_URL` (default `https://rwh-planner-production.up.railway.app`). Release builds refuse non-https URLs. |
| Dev/test mode | `APP_VARIANT=development`: Google **test** AdMob App ID and test ad units, http allowed (for a local API such as `http://10.0.2.2:8080`). |
| **AdMob App ID** | `app.config.js` → `ADMOB_APP_ID_RELEASE` (currently your real ID `ca-app-pub-3753880887983252~1798305899`), or env `ADMOB_ANDROID_APP_ID`. |
| AdMob ad unit IDs | Not in the app. Admin → **App settings** (defaults in `shared/app-config.js`). |
| Version | `app.config.js` → `VERSION` (shown to users) and `VERSION_CODE` (must increase by 1 for every Play upload). |
| Signing | `android-app/keystore.properties` + `android-app/keystore/rwh-upload.keystore` (both git-ignored). |

## Develop (Metro, fast refresh)

```powershell
$env:APP_VARIANT="development"; npx expo prebuild -p android --clean; npx expo run:android
```

Point the dev app at a local backend: `$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:8080"; npx expo start`.

## Debug APK (standalone, test ads)

```powershell
$env:APP_VARIANT="development"; $env:STANDALONE_DEBUG="1"; npx expo prebuild -p android --clean
cd android; .\gradlew assembleDebug; cd ..
```

Output: `android/app/build/outputs/apk/debug/app-universal-debug.apk` (plus per-ABI APKs).

## Release AAB (Google Play) and release APKs

Clear the dev variables first, then generate the release project:

```powershell
Remove-Item Env:APP_VARIANT, Env:STANDALONE_DEBUG -ErrorAction SilentlyContinue; npx expo prebuild -p android --clean
```

```powershell
cd android; .\gradlew bundleRelease; cd ..
```

```powershell
cd android; .\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a; cd ..
```

Run the two tasks separately: ABI splits are switched off automatically for `bundle*` tasks (Play splits the bundle itself) and on for `assemble*` tasks. The APK build is limited to the two ARM ABIs that real phones use, which keeps the universal APK much smaller (drop the `-P` flag to also include x86/x86_64 for emulators).

Outputs:
- `android/app/build/outputs/bundle/release/app-release.aab` → upload to Play Console.
- `android/app/build/outputs/apk/release/app-universal-release.apk` → share directly (any ARM phone).
- `app-arm64-v8a-release.apk` (modern phones), `app-armeabi-v7a-release.apk` (older 32-bit phones) → smaller per-device APKs.

R8 minification and resource shrinking are on for release (`expo-build-properties`). Keep rules (ads SDK, UMP, WorkManager's Room database) are in `app.config.js` → `extraProguardRules`. Always smoke-test a release build: R8 problems only show up there.

## Bump the version

1. `app.config.js`: `VERSION = "1.0.1"` and `VERSION_CODE = 2`.
2. Rebuild the release AAB and upload it.
3. To force old installs to update, raise **Minimum supported version code** in Admin → App settings. To show a gentle "update available" banner, raise **Latest version code**.

## Checks

```powershell
npm run typecheck; npm run lint; cd ..; npm run check
```

Verify a bundle and build device APKs from it with bundletool:

```powershell
java -jar bundletool.jar validate --bundle=android\app\build\outputs\bundle\release\app-release.aab
java -jar bundletool.jar build-apks --bundle=android\app\build\outputs\bundle\release\app-release.aab --output=rwh.apks --ks=keystore\rwh-upload.keystore --ks-key-alias=rwh-upload
```

## Store graphics

Screenshots are captured from the running app (`scripts/capture.sh`) into `store-listing/raw/`, then framed with captions by `node scripts/store-graphics.mjs` (uses headless Edge/Chrome so Urdu Nastaliq renders correctly). Icons: `python scripts/make-icons.py`.

## Signing and Play App Signing

The keystore in `keystore/` is your **upload key**. Play App Signing keeps the app signing key at Google. Back up `keystore/rwh-upload.keystore` and `keystore.properties` somewhere safe (a password manager and an offline copy). If the upload key is lost, ask Google Play support to reset it; the app itself stays safe because Google holds the signing key.

## Network and CORS

The app only calls https endpoints (cleartext is blocked by `network_security_config.xml` in release builds). Native requests send no `Origin` header, which the backend's CORS check already allows, so `ALLOWED_ORIGINS` needs no change.
