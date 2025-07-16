import AsyncStorage from "@react-native-async-storage/async-storage";
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

  // Check if notifications are enabled in settings
  let notificationEnabled = true;
  try {
    const notificationsEnabled = await AsyncStorage.getItem(
      "notificationsEnabled"
    );
    notificationEnabled = notificationsEnabled !== "false";
  } catch (error) {
    console.error("Could not check notification settings:", error);
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
  let calculation_method = 13; // Default: MWL
  try {
    const storedMethod = await AsyncStorage.getItem("calculationMethod");
    if (storedMethod !== null) {
      calculation_method = JSON.parse(storedMethod);
    }
  } catch (error) {
    console.error("Could not get calculation method:", error);
  }

  const { error } = await supabase.from("user_push_tokens").upsert(
    {
      token,
      latitude,
      longitude,
      language,
      timezone,
      calculation_method,
      notification_enabled: notificationEnabled,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "token",
    }
  );

  if (error) {
    console.error("Push token kaydı sırasında hata:", error.message);
  } else {
    console.log(
      "Push token kaydedildi:",
      token,
      "- Notifications enabled:",
      notificationEnabled
    );
  }
}
