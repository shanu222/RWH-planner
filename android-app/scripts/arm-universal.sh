#!/usr/bin/env bash
# Makes the direct-share APK: the universal release APK without x86/x86_64 native libraries
# (emulator-only ABIs), re-aligned and re-signed with the upload key from keystore.properties.
#   scripts/arm-universal.sh <in.apk> <out.apk>
set -e
cd "$(dirname "$0")/.."
IN="$1"; OUT="$2"
BT="$(ls -d "${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"/build-tools/* | sort -V | tail -1)"
TMP="$(mktemp -d)"
python - "$IN" "$TMP/stripped.apk" <<'PY'
import sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w") as zo:
    for i in zi.infolist():
        if i.filename.startswith(("lib/x86/", "lib/x86_64/", "META-INF/")) and not i.filename.startswith("META-INF/services/"):
            if i.filename.startswith("lib/") or i.filename.endswith((".SF", ".RSA", ".EC", ".DSA", ".MF")):
                continue
        zo.writestr(i, zi.read(i.filename), compress_type=i.compress_type)
PY
"$BT/zipalign" -f -p 4 "$TMP/stripped.apk" "$TMP/aligned.apk"
PASS="$(grep '^storePassword=' keystore.properties | cut -d= -f2-)"
KS="$(grep '^storeFile=' keystore.properties | cut -d= -f2-)"
ALIAS="$(grep '^keyAlias=' keystore.properties | cut -d= -f2-)"
"$BT/apksigner.bat" sign --v4-signing-enabled false --ks "$KS" --ks-key-alias "$ALIAS" --ks-pass "pass:$PASS" --key-pass "pass:$PASS" --out "$OUT" "$TMP/aligned.apk" 2>/dev/null || \
  "$BT/apksigner" sign --v4-signing-enabled false --ks "$KS" --ks-key-alias "$ALIAS" --ks-pass "pass:$PASS" --key-pass "pass:$PASS" --out "$OUT" "$TMP/aligned.apk"
rm -rf "$TMP"
echo "wrote $OUT"
