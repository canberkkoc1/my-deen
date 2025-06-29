import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface CalculationMethod {
  id: number;
  name: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface SettingSection {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  items: SettingItem[];
}

export interface SettingItem {
  title: string;
  description?: string;
  type: "switch" | "select";
  value: boolean | number;
  options?: { id: number; name: string; description: string; icon: string }[];
}

export interface LocationContextType {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
  isUsingDefaultLocation: boolean;
  requestLocationPermission: () => Promise<void>;
}

// Prayer Times API Types
export interface PrayerTimesResponse {
  code: number;
  status: string;
  data: PrayerTimesData;
}

export interface PrayerTimesData {
  timings: PrayerTimings;
  date: PrayerDate;
  meta: PrayerMeta;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface PrayerDate {
  readable: string;
  timestamp: string;
  hijri: {
    date: string;
    format: string;
    day: string;
    weekday: {
      en: string;
      ar: string;
    };
    month: {
      number: number;
      en: string;
      ar: string;
    };
    year: string;
    designation: {
      abbreviated: string;
      expanded: string;
    };
    holidays: string[];
  };
  gregorian: {
    date: string;
    format: string;
    day: string;
    weekday: {
      en: string;
    };
    month: {
      number: number;
      en: string;
    };
    year: string;
    designation: {
      abbreviated: string;
      expanded: string;
    };
  };
}

export interface PrayerMeta {
  latitude: number;
  longitude: number;
  timezone: string;
  method: {
    id: number;
    name: string;
    params: {
      Fajr: number;
      Isha: number;
    };
    location: {
      latitude: number;
      longitude: number;
    };
  };
  latitudeAdjustmentMethod: string;
  midnightMode: string;
  school: string;
  offset: {
    Imsak: number;
    Fajr: number;
    Sunrise: number;
    Dhuhr: number;
    Asr: number;
    Maghrib: number;
    Sunset: number;
    Isha: number;
    Midnight: number;
  };
}

export interface PrayerTimeRequest {
  date: string; // DD-MM-YYYY format
  latitude: number;
  longitude: number;
  method: number;
}

export interface SimplePrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  hijriDate: string;
  location: {
    latitude: number;
    longitude: number;
  };
  method: {
    id: number;
    name: string;
  };
}
