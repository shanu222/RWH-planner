# Google Play Console – everything to paste or choose

App: **RWH Planner – Rainwater Harvesting** · package `com.resiliencetech.rwhplanner` · version 1.0.0 (versionCode 1) · target SDK 36 · min SDK 24

## 1. Store listing

| Field | English (en-US) | Urdu (ur) |
| --- | --- | --- |
| App name (≤30) | `en-US/title.txt` | `ur/title.txt` |
| Short description (≤80) | `en-US/short-description.txt` | `ur/short-description.txt` |
| Full description (≤4000) | `en-US/full-description.txt` | `ur/full-description.txt` |
| What's new | `en-US/whats-new.txt` | `ur/whats-new.txt` |

Graphics (all generated from the real app, see `graphics/`):

| Asset | File |
| --- | --- |
| App icon 512×512 (32-bit PNG) | `graphics/icon-512.png` |
| Feature graphic 1024×500 | `graphics/feature-graphic.png` |
| Phone screenshots 1080×1920, English (8) | `graphics/phone-en/01…08.png` |
| Phone screenshots 1080×1920, Urdu (8) | `graphics/phone-ur/01…08.png` |
| 7-inch tablet screenshots (4) | `graphics/tablet-7/01…04.png` |
| 10-inch tablet screenshots (4) | `graphics/tablet-10/01…04.png` |

- **App category:** Tools (alternative: Education). Recommended: *Tools*.
- **Tags:** Utilities / Home & Garden calculators (choose the closest offered).
- **Contact email:** shahnawaz@sustainablesolution360.com
- **Website:** https://rwh-planner.vercel.app
- **Privacy policy URL:** https://rwh-planner.vercel.app/privacy.html (live after the frontend deploys this commit)

## 2. App content

### Privacy policy
`https://rwh-planner.vercel.app/privacy.html` (source: `frontend/public/privacy.html`).

### Ads
**Does your app contain ads? → Yes.** The listing will show “Contains ads”.

### App access
**All functionality is available without special access** (no login).

### Content rating (IARC questionnaire)
- Category: **Reference, News, or Educational** (or “Utility, Productivity, Communication, or Other” if offered; both give the same answers).
- Violence: No · Sexuality: No · Language (profanity): No · Controlled substances: No · Gambling / simulated gambling: No · Horror/fear: No
- Users can interact or exchange content with other users: **No** (no chat between users; the AI assistant is not user-to-user)
- Shares the user's current physical location with other users: **No**
- Allows users to purchase digital goods: **No**
- Unrestricted internet access (web browser): **No**
- Contains AI-generated content: **Yes** – an AI assistant answers questions about rainwater harvesting; output is text only, filtered to the topic by a system prompt, labelled “AI-generated”, with a disclaimer.
- Expected rating: **Everyone / PEGI 3 / IARC 3+**.

### Target audience and content
- Target age groups: **18 and over** only. (Do not tick under-13 or 13–17; the app is not designed for children.)
- Could the app unintentionally appeal to children? **No.**
- Ads are not tagged as child-directed (`tagForChildDirectedTreatment = false`), consistent with this choice.

### News app: **No.** · COVID-19 contact tracing: **No.** · Government app: **No.** · Financial features: **None.** · Health: **None.**

### Data safety form

**Does your app collect or share any of the required user data types? → Yes.**
**Is all of the user data collected by your app encrypted in transit? → Yes** (HTTPS only; cleartext is blocked in release builds).
**Do you provide a way for users to request that their data be deleted? → Yes** (no account; clear app data / uninstall; email for questions; see privacy policy §9).

| Data type | Collected | Shared | Optional? | Purpose | Notes |
| --- | --- | --- | --- | --- | --- |
| Location → **Approximate location** | Yes | Yes (Google AdMob) | Required for ads | Advertising or marketing; Fraud prevention, security | Derived from IP by the ads SDK |
| App activity → **App interactions** | Yes | Yes (Google AdMob) | Required | Advertising or marketing; Analytics | Ad views/taps |
| App activity → **Other user-generated content** | Yes | Yes (AI providers: OpenAI, Google, OpenRouter) | **Optional** (only if the user uses the AI assistant) | App functionality | Chat text and design figures, processed ephemerally, not stored |
| App info and performance → **Crash logs** | Yes | Yes (Google AdMob) | Required | Analytics | Collected by the Google Mobile Ads SDK |
| App info and performance → **Diagnostics** | Yes | Yes (Google AdMob) | Required | Analytics; Advertising | Ads SDK performance data |
| Device or other IDs → **Device or other IDs** | Yes | Yes (Google AdMob) | Required | Advertising or marketing; Fraud prevention | Android advertising ID |

For the AI chat text, also tick **“Data is processed ephemerally”**.
Not collected: name, email, user IDs, phone, address, precise location, contacts, photos/videos, audio, files, calendar, messages, health, financial info, web browsing, installed apps, search history.

### Advertising ID declaration
**Yes, the app uses an advertising ID** → purposes: *Advertising or marketing*, *Analytics*. (The manifest contains `com.google.android.gms.permission.AD_ID` from the ads SDK.)

### Data deletion statement (for the “Delete data” URL field, optional)
> RWH Planner has no user accounts and stores your designs and reports only on your device. To delete all app data, open Android Settings → Apps → RWH Planner → Storage → Clear storage, or uninstall the app. You can delete individual designs and reports inside the app, and clear cached data in Settings → Clear cache. Advertising data is held by Google; manage it in Android Settings → Google → Ads. Questions: shahnawaz@sustainablesolution360.com.

## 3. Release

1. **Play App Signing:** keep it ON (default for new apps). Upload `android-app/dist-apk/rwh-planner-1.0.0-release.aab`, signed with the **upload key** (`android-app/keystore/rwh-upload.keystore`). Google holds the app signing key.
2. Start with **Internal testing**, then **Closed testing**. New personal developer accounts must run a closed test with **at least 12 testers for 14 continuous days** before Production access is granted.
3. **Countries:** Pakistan (plus any others you want).
4. **What's new:** `en-US/whats-new.txt` / `ur/whats-new.txt`.

## 4. AdMob follow-up (manual)

1. AdMob → Apps → *RWH planner* → **App store details → Add**: link it to the Play listing once it is published (this clears “Requires review”). Ads serve with limited demand until then.
2. AdMob → **Privacy & messaging → GDPR**: create and publish a consent message for the app (the app already shows Google's UMP form when a published message applies). Optionally add a **US state regulations** message.
3. Add an **app-ads.txt** file at `https://rwh-planner.vercel.app/app-ads.txt` (already added in `frontend/public/app-ads.txt`) and set the developer website in the Play listing to `https://rwh-planner.vercel.app` so AdMob can verify it.
4. Ad unit IDs are managed in the admin **App settings** tab; no rebuild is needed to change them.

## 5. Policy checklist

- Ads: banners are anchored below content, never over buttons; interstitial only after a finished PDF export, at most once per 3 minutes and 3 per session (both adjustable in the admin). No ads in onboarding, no rewarded or auto-click behaviour.
- User data: matches the Data safety answers above; privacy policy linked in the app (Settings → Privacy policy) and in the listing.
- Deceptive behaviour: no impersonation; rates show their real sources; results labelled as planning estimates.
- AI-generated content: AI answers labelled, topic-restricted, disclaimer shown; report button for problematic content = Contact us (email) in Settings. Consider adding an in-app “Report this answer” link later if Play asks.
- Target API level: targetSdk 36 (Android 16), meeting the current requirement for new apps.
- Permissions: INTERNET, ACCESS_NETWORK_STATE, POST_NOTIFICATIONS (asked only when the user turns reminders on), SCHEDULE_EXACT_ALARM is not used, AD_ID (ads).
