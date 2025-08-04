import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Dil dosyalarını içe aktar
import ar from "../locales/ar.json";
import en from "../locales/en.json";
import tr from "../locales/tr.json";

// Desteklenen diller
export const SUPPORTED_LANGUAGES = {
  en: "English",
  tr: "Türkçe",
  ar: "العربية",
};

// RTL dilleri (sadece bilgi amaçlı)
export const RTL_LANGUAGES = ["ar"];

// RTL kontrol fonksiyonu (sadece bilgi amaçlı)
export const isRTL = (language: string) => RTL_LANGUAGES.includes(language);

// Cihaz dilini al
const deviceLanguage = getLocales()[0]?.languageCode || "tr";

// i18n yapılandırması
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    ar: { translation: ar },
  },
  lng: deviceLanguage, // Cihaz dilini kullan
  fallbackLng: "tr", // Varsayılan dil
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
