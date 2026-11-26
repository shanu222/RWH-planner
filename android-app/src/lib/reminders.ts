// Local seasonal maintenance reminders, built from shared/guides.js CALENDAR.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { CALENDAR } from "../shared/guides.js";
import { tr, type Lang } from "./strings";

const CHANNEL = "reminders";
// month is 0-based (JS Date), day of month, 9:00 local time
const SCHEDULE: Record<string, { month: number; day: number }[]> = {
  pre: [{ month: 4, day: 15 }],                     // mid-May
  during: [{ month: 6, day: 1 }, { month: 7, day: 1 }, { month: 8, day: 1 }], // Jul, Aug, Sep
  post: [{ month: 9, day: 5 }],                     // October
  winter: [{ month: 11, day: 10 }],                 // December
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

async function ensureChannel(lang: Lang) {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: lang === "ur" ? "دیکھ بھال کی یاد دہانیاں" : "Maintenance reminders",
      // eslint-disable-next-line import/namespace -- re-exported enum; TypeScript resolves it
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function askPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

type Season = { key: string; when: Record<Lang, string>; tasks: Record<Lang, string[]> };

export async function scheduleReminders(lang: Lang) {
  await ensureChannel(lang);
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const season of CALENDAR as Season[]) {
    for (const s of SCHEDULE[season.key] || []) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: tr(lang, "reminderTitle", { when: season.when[lang].split("·")[0].trim() }),
          body: season.tasks[lang].slice(0, 3).join(" · "),
          data: { url: "/learn?seg=calendar" },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.YEARLY, month: s.month, day: s.day, hour: 9, minute: 0, channelId: CHANNEL },
      });
    }
  }
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function testReminder(lang: Lang) {
  await ensureChannel(lang);
  const season = (CALENDAR as Season[])[0];
  await Notifications.scheduleNotificationAsync({
    content: { title: tr(lang, "reminderTitle", { when: season.when[lang].split("·")[0].trim() }), body: season.tasks[lang].slice(0, 3).join(" · "), data: { url: "/learn?seg=calendar" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL },
  });
}
