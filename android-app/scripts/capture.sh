#!/usr/bin/env bash
# Capture a real screenshot from the running emulator/device into store-listing/raw/<set>/<NN>.png
#   scripts/capture.sh phone-en 01
# Hides the status-bar clutter with Android's demo mode (clock 12:00, full battery and signal).
set -e
SET="$1"; N="$2"
DIR="$(cd "$(dirname "$0")/.." && pwd)/store-listing/raw/$SET"
mkdir -p "$DIR"
adb shell settings put global sysui_demo_allowed 1 >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command exit >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command enter >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200 >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 >/dev/null
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false >/dev/null
adb exec-out screencap -p > "$DIR/$N.png"
echo "saved $DIR/$N.png"
