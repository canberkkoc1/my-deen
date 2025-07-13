// supabase/functions/schedule-prayer-notifications/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Kaabe koordinatları sabit
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const API_BASE = "https://api.aladhan.com/v1/timings";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // 1. Tüm kullanıcıları al
  const { data: users, error } = await supabase
    .from("user_push_tokens")
    .select("*");

  if (error) {
    console.error("Error fetching users:", error.message);
    return new Response("Internal error", { status: 500 });
  }

  const today = new Date().toISOString().split("T")[0];

  for (const user of users) {
    const { token, latitude, longitude, language, timezone } = user;

    const lat = latitude ?? 41.0082;
    const lng = longitude ?? 28.9784;
    const tz = timezone ?? "Europe/Istanbul";

    // 2. Aladhan API'den o lokasyon için bugünün vakitlerini al
    const res = await fetch(
      `${API_BASE}/${today}?latitude=${lat}&longitude=${lng}&method=2&timezonestring=${tz}`
    );

    const json = await res.json();
    const timings = json.data.timings;

    for (const prayer of PRAYER_NAMES) {
      const timeStr = timings[prayer]; // "16:41"
      if (!timeStr) continue;

      const [h, m] = timeStr.split(":").map(Number);
      const localPrayerDate = new Date(today);
      localPrayerDate.setHours(h, m - 15, 0, 0); // 15 dakika öncesi
      const utcPrayerDate = new Date(
        localPrayerDate.toLocaleString("en-US", { timeZone: "UTC" })
      );

      // 3. Tabloya ekle
      const titleMap = {
        en: `${prayer} Time`,
        tr: `${getTurkishName(prayer)} Vakti`,
        ar: getArabicName(prayer),
      };

      const bodyMap = {
        en: `It's almost time for ${prayer} prayer.`,
        tr: `${getTurkishName(prayer)} namazı için hazırlan.`,
        ar: `اقترب وقت صلاة ${getArabicName(prayer)}`,
      };

      await supabase.from("scheduled_notifications").insert({
        token,
        prayer_name: prayer.toLowerCase(),
        scheduled_for_date: today,
        send_at: utcPrayerDate.toISOString(),
        title: titleMap[language] || titleMap["en"],
        body: bodyMap[language] || bodyMap["en"],
      });
    }
  }

  return new Response("✅ Notifications scheduled", { status: 200 });
});

// Yardımcı çeviriler
function getTurkishName(prayer: string) {
  return (
    {
      Fajr: "Sabah",
      Dhuhr: "Öğle",
      Asr: "İkindi",
      Maghrib: "Akşam",
      Isha: "Yatsı",
    }[prayer] ?? prayer
  );
}

function getArabicName(prayer: string) {
  return (
    {
      Fajr: "الفجر",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء",
    }[prayer] ?? prayer
  );
}
