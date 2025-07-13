import * as Device from "expo-device";
import { getLocales } from "expo-localization";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabaseClient";

export async function registerPushToken() {
  if (!Device.isDevice) {
    console.warn("Push notifications only work on real devices.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Permission not granted for push notifications.");
    return;
  }

  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
  const token = expoPushToken;

  let latitude = null;
  let longitude = null;

  const { status: locationStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (locationStatus === "granted") {
    const location = await Location.getCurrentPositionAsync({});
    latitude = location.coords.latitude;
    longitude = location.coords.longitude;
  }

  const language = getLocales()[0]?.languageCode || "en";
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul";

  // 👇 varsayılan veya ayar ekranından gelen hesaplama yöntemi
  const calculation_method = 2; // Örn: MWL

  const { error } = await supabase.from("user_push_tokens").upsert({
    token,
    latitude,
    longitude,
    language,
    timezone,
    calculation_method,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Push token kaydı sırasında hata:", error.message);
  } else {
    console.log("Push token kaydedildi:", token);
  }
}
