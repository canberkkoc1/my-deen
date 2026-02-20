import { CalculationMethod } from "@/types";

export const CALCULATION_METHODS: CalculationMethod[] = [
  {
    id: 3,
    key: "muslimWorldLeague",
    name: "Muslim World League",
    description:
      "Dünya Müslüman Birliği tarafından kabul edilen standart metot",
    icon: "earth",
  },
  {
    id: 2,
    key: "isna",
    name: "Islamic Society of North America",
    description: "Kuzey Amerika'da yaygın olarak kullanılan metot",
    icon: "map-marker",
  },
  {
    id: 13,
    key: "turkey",
    name: "Turkey",
    description: "Türkiye'de kullanılan resmi metot",
    icon: "flag",
  },
  {
    id: 5,
    key: "egyptian",
    name: "Egyptian General Authority",
    description: "Mısır Genel Fetva Kurulu tarafından kabul edilen metot",
    icon: "pyramid",
  },
  {
    id: 4,
    key: "ummAlQura",
    name: "Umm Al-Qura University",
    description: "Suudi Arabistan'da kullanılan resmi metot",
    icon: "mosque",
  },
];

export const MECCA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};
