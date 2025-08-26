import type {
  PrayerTimeRequest,
  PrayerTimesResponse,
  SimplePrayerTimes,
} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debug } from "./debug";

const API_BASE_URL = "https://api.aladhan.com/v1";
const CACHE_KEY_PREFIX = "prayer_times_";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class PrayerTimesApi {
  private static instance: PrayerTimesApi;

  private constructor() {}

  public static getInstance(): PrayerTimesApi {
    if (!PrayerTimesApi.instance) {
      PrayerTimesApi.instance = new PrayerTimesApi();
    }
    return PrayerTimesApi.instance;
  }

  /**
   * Get prayer times for a specific date and location
   */
  public async getPrayerTimes(
    request: PrayerTimeRequest
  ): Promise<SimplePrayerTimes> {
    try {
      debug.log("Namaz vakitleri isteniyor:", request);

      // Check cache first
      const cachedData = await this.getCachedPrayerTimes(request);
      if (cachedData) {
        debug.log("Önbellekten namaz vakitleri alındı");
        return cachedData;
      }

      // Make API request
      const url = await this.buildApiUrl(request);
      debug.log("API URL:", url);

      // Get timezone info for debugging
      const detectedTimezone = await this.getTimezoneFromCoordinates(
        request.latitude,
        request.longitude
      );

      console.log("🌍 API Request Details:", {
        url: url,
        date: request.date,
        latitude: request.latitude,
        longitude: request.longitude,
        method: request.method,
        detectedTimezone: detectedTimezone,
        deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: new Date().toISOString(),
        localTime: new Date().toLocaleString(),
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `API hatası: ${response.status} ${response.statusText}`
        );
      }

      const data: PrayerTimesResponse = await response.json();

      // Debug: API'den dönen namaz vakitlerini logla
      console.log("📊 API Response Details:", {
        status: data.status,
        code: data.code,
        date: {
          readable: data.data.date.readable,
          timestamp: data.data.date.timestamp,
          gregorian: data.data.date.gregorian,
          hijri: data.data.date.hijri.date,
        },
        rawTimings: data.data.timings,
        cleanedTimings: {
          Fajr: this.cleanTime(data.data.timings.Fajr),
          Sunrise: this.cleanTime(data.data.timings.Sunrise),
          Dhuhr: this.cleanTime(data.data.timings.Dhuhr),
          Asr: this.cleanTime(data.data.timings.Asr),
          Maghrib: this.cleanTime(data.data.timings.Maghrib),
          Isha: this.cleanTime(data.data.timings.Isha),
        },
        meta: {
          method: data.data.meta.method,
          timezone: data.data.meta.timezone,
          school: data.data.meta.school,
          offset: data.data.meta.offset,
        },
        coordinates: `${request.latitude}, ${request.longitude}`,
      });

      if (data.code !== 200) {
        throw new Error(`API hatası: ${data.status}`);
      }

      // Transform response to simplified format
      const simplifiedData = this.transformResponse(data, request);

      // Cache the result
      await this.cachePrayerTimes(request, simplifiedData);

      debug.log("Namaz vakitleri başarıyla alındı ve önbelleğe kaydedildi");
      return simplifiedData;
    } catch (error) {
      debug.error("Namaz vakitleri alınamadı:", error);
      console.error("Prayer times API error:", error);
      throw error;
    }
  }

  /**
   * Get prayer times for today
   */
  public async getTodaysPrayerTimes(
    latitude: number,
    longitude: number,
    method: number = 13
  ): Promise<SimplePrayerTimes> {
    const today = new Date();
    const dateString = this.formatDate(today);

    return this.getPrayerTimes({
      date: dateString,
      latitude,
      longitude,
      method,
    });
  }

  /**
   * Build API URL with parameters
   */
  private async buildApiUrl(request: PrayerTimeRequest): Promise<string> {
    const timezone = await this.getTimezoneFromCoordinates(
      request.latitude,
      request.longitude
    );

    const params = new URLSearchParams({
      latitude: request.latitude.toString(),
      longitude: request.longitude.toString(),
      method: request.method.toString(),
      shafaq: "general",
      timezonestring: timezone,
      calendarMethod: "DIYANET",
    });

    return `${API_BASE_URL}/timings/${request.date}?${params.toString()}`;
  }

  /**
   * Transform API response to simplified format
   */
  private transformResponse(
    data: PrayerTimesResponse,
    request: PrayerTimeRequest
  ): SimplePrayerTimes {
    const { timings, date, meta } = data.data;

    return {
      fajr: this.cleanTime(timings.Fajr),
      sunrise: this.cleanTime(timings.Sunrise),
      dhuhr: this.cleanTime(timings.Dhuhr),
      asr: this.cleanTime(timings.Asr),
      maghrib: this.cleanTime(timings.Maghrib),
      isha: this.cleanTime(timings.Isha),
      date: date.readable,
      hijriDate: date.hijri.date,
      location: {
        latitude: request.latitude,
        longitude: request.longitude,
      },
      method: {
        id: meta.method.id,
        name: meta.method.name,
      },
    };
  }

  /**
   * Clean time string (remove timezone info)
   */
  private cleanTime(timeString: string): string {
    return timeString.split(" ")[0];
  }

  /**
   * Format date to DD-MM-YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    const formatted = `${day}-${month}-${year}`;

    console.log("📅 Date Format:", {
      inputDate: date.toISOString(),
      localDate: date.toLocaleDateString(),
      formatted: formatted,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return formatted;
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: PrayerTimeRequest): string {
    return `${CACHE_KEY_PREFIX}${request.date}_${request.latitude}_${request.longitude}_${request.method}`;
  }

  /**
   * Get cached prayer times if available and not expired
   */
  private async getCachedPrayerTimes(
    request: PrayerTimeRequest
  ): Promise<SimplePrayerTimes | null> {
    try {
      const cacheKey = this.getCacheKey(request);
      const cachedItem = await AsyncStorage.getItem(cacheKey);

      if (!cachedItem) {
        return null;
      }

      const { data, timestamp } = JSON.parse(cachedItem);
      const now = Date.now();

      // Check if cache is expired
      if (now - timestamp > CACHE_DURATION) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      debug.error("Önbellek okunamadı:", error);
      return null;
    }
  }

  /**
   * Cache prayer times data
   */
  private async cachePrayerTimes(
    request: PrayerTimeRequest,
    data: SimplePrayerTimes
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(request);
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      debug.error("Önbelleğe kaydedilemedi:", error);
    }
  }

  /**
   * Clear all cached prayer times
   */
  public async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prayerTimesKeys = keys.filter((key) =>
        key.startsWith(CACHE_KEY_PREFIX)
      );

      if (prayerTimesKeys.length > 0) {
        await AsyncStorage.multiRemove(prayerTimesKeys);
        debug.log("Namaz vakitleri önbelleği temizlendi");
      }
    } catch (error) {
      debug.error("Önbellek temizlenemedi:", error);
    }
  }

  /**
   * Get next prayer time
   */
  public getNextPrayerTime(prayerTimes: SimplePrayerTimes): {
    key: "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
    name: string;
    time: string;
    isNextDay: boolean;
  } {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { key: "fajr" as const, name: "İmsak", time: prayerTimes.fajr },
      { key: "sunrise" as const, name: "Güneş", time: prayerTimes.sunrise },
      { key: "dhuhr" as const, name: "Öğle", time: prayerTimes.dhuhr },
      { key: "asr" as const, name: "İkindi", time: prayerTimes.asr },
      { key: "maghrib" as const, name: "Akşam", time: prayerTimes.maghrib },
      { key: "isha" as const, name: "Yatsı", time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(":").map(Number);
      const prayerTime = hours * 60 + minutes;

      if (prayerTime > currentTime) {
        return {
          key: prayer.key,
          name: prayer.name,
          time: prayer.time,
          isNextDay: false,
        };
      }
    }

    // If no prayer left today, return first prayer of tomorrow
    return {
      key: "fajr",
      name: "İmsak",
      time: prayerTimes.fajr,
      isNextDay: true,
    };
  }

  /**
   * Get time remaining until next prayer
   */
  public getTimeUntilNextPrayer(prayerTimes: SimplePrayerTimes): string {
    const nextPrayer = this.getNextPrayerTime(prayerTimes);
    const now = new Date();

    let targetTime = new Date();
    const [hours, minutes] = nextPrayer.time.split(":").map(Number);

    if (nextPrayer.isNextDay) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    targetTime.setHours(hours, minutes, 0, 0);

    const timeDiff = targetTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `${hoursLeft}s ${minutesLeft}d`;
    } else {
      return `${minutesLeft}d`;
    }
  }

  /**
   * Get timezone from coordinates using device timezone as primary, geographical as fallback
   */
  private async getTimezoneFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      console.log("🕐 Timezone Detection:", {
        latitude,
        longitude,
        deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Türkiye koordinatları için özel kontrol
      if (
        latitude >= 35.8 &&
        latitude <= 42.1 &&
        longitude >= 25.7 &&
        longitude <= 44.8
      ) {
        debug.log(
          "Türkiye koordinatları tespit edildi, Europe/Istanbul kullanılıyor"
        );
        console.log("✅ Using Turkey timezone: Europe/Istanbul");
        return "Europe/Istanbul";
      }

      // Koordinatlara göre geographical timezone'u belirle
      const geographicalTimezone = this.getGeographicalTimezone(
        latitude,
        longitude
      );

      // Cihazın timezone'unu al ve koordinatlarla uyumlu mu kontrol et
      try {
        const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Timezone-koordinat uyumunu kontrol et
        if (
          this.isTimezoneCompatibleWithCoordinates(
            deviceTimezone,
            latitude,
            longitude
          )
        ) {
          debug.log(
            `Cihaz timezone'u koordinatlarla uyumlu: ${deviceTimezone}`
          );
          console.log(`✅ Using compatible device timezone: ${deviceTimezone}`);
          return deviceTimezone;
        } else {
          console.log(
            `⚠️ Device timezone (${deviceTimezone}) incompatible with coordinates (${latitude}, ${longitude}), using geographical timezone (${geographicalTimezone})`
          );
        }
      } catch (deviceError) {
        debug.log("Cihaz timezone alınamadı:", deviceError);
      }

      // Fallback: Use the already calculated geographical timezone
      debug.log(`Geographical timezone kullanılıyor: ${geographicalTimezone}`);
      console.log(`✅ Using geographical timezone: ${geographicalTimezone}`);
      return geographicalTimezone;
    } catch (error) {
      debug.error("Timezone tespit hatası:", error);
      return "UTC"; // En son fallback
    }
  }

  /**
   * Check if device timezone is compatible with the given coordinates
   */
  private isTimezoneCompatibleWithCoordinates(
    deviceTimezone: string,
    latitude: number,
    longitude: number
  ): boolean {
    console.log("🔍 Checking timezone compatibility:", {
      deviceTimezone,
      latitude,
      longitude,
    });

    // Türkiye koordinatları kontrolü
    if (
      latitude >= 35.8 &&
      latitude <= 42.1 &&
      longitude >= 25.7 &&
      longitude <= 44.8
    ) {
      const compatible = deviceTimezone === "Europe/Istanbul";
      console.log(
        `🇹🇷 Turkey coordinates: ${compatible ? "✅" : "❌"} (${deviceTimezone})`
      );
      return compatible;
    }

    // San Francisco Bay Area kontrolü
    if (
      latitude >= 37.0 &&
      latitude <= 38.0 &&
      longitude >= -123.0 &&
      longitude <= -121.0
    ) {
      const compatible =
        deviceTimezone.includes("America/Los_Angeles") ||
        deviceTimezone.includes("America/Pacific") ||
        deviceTimezone === "America/Los_Angeles";
      console.log(
        `🇺🇸 SF Bay Area coordinates: ${
          compatible ? "✅" : "❌"
        } (${deviceTimezone})`
      );
      return compatible;
    }

    // Avrupa genel kontrolü
    if (
      latitude >= 35 &&
      latitude <= 71 &&
      longitude >= -10 &&
      longitude <= 40
    ) {
      const compatible = deviceTimezone.includes("Europe/");
      console.log(
        `🇪🇺 Europe coordinates: ${compatible ? "✅" : "❌"} (${deviceTimezone})`
      );
      return compatible;
    }

    // Kuzey Amerika genel kontrolü
    if (
      latitude >= 25 &&
      latitude <= 70 &&
      longitude >= -170 &&
      longitude <= -50
    ) {
      const compatible = deviceTimezone.includes("America/");
      console.log(
        `🌎 North America coordinates: ${
          compatible ? "✅" : "❌"
        } (${deviceTimezone})`
      );
      return compatible;
    }

    // Asya kontrolü
    if (
      latitude >= 10 &&
      latitude <= 70 &&
      longitude >= 40 &&
      longitude <= 180
    ) {
      const compatible = deviceTimezone.includes("Asia/");
      console.log(
        `🌏 Asia coordinates: ${compatible ? "✅" : "❌"} (${deviceTimezone})`
      );
      return compatible;
    }

    // Bilinmeyen bölge için false döndür (geographical kullanılsın)
    console.log(`❓ Unknown region: incompatible (${deviceTimezone})`);
    return false;
  }

  /**
   * Simple geographical timezone detection (fallback method)
   */
  private getGeographicalTimezone(latitude: number, longitude: number): string {
    // Türkiye koordinatları için özel kontrol
    if (
      latitude >= 35.8 &&
      latitude <= 42.1 &&
      longitude >= 25.7 &&
      longitude <= 44.8
    ) {
      return "Europe/Istanbul";
    }

    // Avrupa
    if (
      latitude >= 35 &&
      latitude <= 71 &&
      longitude >= -10 &&
      longitude <= 40
    ) {
      if (longitude >= 5 && longitude <= 15) return "Europe/Berlin";
      if (longitude >= 15 && longitude <= 25) return "Europe/Warsaw";
      if (longitude >= -5 && longitude <= 5) return "Europe/Paris";
      if (longitude >= -10 && longitude <= -5) return "Europe/London";
      return "Europe/Berlin"; // Default for Europe
    }

    // Kuzey Amerika
    if (
      latitude >= 25 &&
      latitude <= 70 &&
      longitude >= -170 &&
      longitude <= -50
    ) {
      // San Francisco Bay Area özel kontrol
      if (
        latitude >= 37.0 &&
        latitude <= 38.0 &&
        longitude >= -123.0 &&
        longitude <= -121.0
      ) {
        return "America/Los_Angeles";
      }
      // Genel Kuzey Amerika timezone'ları
      if (longitude >= -75) return "America/New_York"; // Doğu
      if (longitude >= -90) return "America/Chicago"; // Merkez
      if (longitude >= -105) return "America/Denver"; // Dağ
      if (longitude >= -125) return "America/Los_Angeles"; // Batı/Pasifik
      return "America/Los_Angeles"; // Varsayılan Batı
    }

    // Asya
    if (
      latitude >= 10 &&
      latitude <= 70 &&
      longitude >= 40 &&
      longitude <= 180
    ) {
      if (longitude >= 100 && longitude <= 140) return "Asia/Shanghai";
      if (longitude >= 60 && longitude <= 100) return "Asia/Karachi";
      if (longitude >= 40 && longitude <= 60) return "Asia/Dubai";
      return "Asia/Tokyo";
    }

    // Afrika
    if (
      latitude >= -35 &&
      latitude <= 35 &&
      longitude >= -20 &&
      longitude <= 55
    ) {
      return "Africa/Cairo";
    }

    // Avustralya
    if (
      latitude >= -45 &&
      latitude <= -10 &&
      longitude >= 110 &&
      longitude <= 155
    ) {
      return "Australia/Sydney";
    }

    // Varsayılan UTC
    return "UTC";
  }
}

// Export singleton instance
export const prayerTimesApi = PrayerTimesApi.getInstance();
