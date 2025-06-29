import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Dil dosyalarını içe aktar
import en from "../locales/en.json";
import tr from "../locales/tr.json";

// Desteklenen diller
export const SUPPORTED_LANGUAGES = {
  en: "English",
  tr: "Türkçe",
};

// i18n yapılandırması
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: Localization.locale.split("-")[0], // Cihaz dilini kullan
  fallbackLng: "tr", // Varsayılan dil
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
