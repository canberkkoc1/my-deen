import { debug } from "@/lib/debug";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface PreloadState {
  isPreloaded: boolean;
  progress: number;
  currentTask: string;
}

export function usePreload() {
  const { t } = useTranslation();
  const [preloadState, setPreloadState] = useState<PreloadState>({
    isPreloaded: false,
    progress: 0,
    currentTask: t("preload.initializing"),
  });

  useEffect(() => {
    const preloadData = async () => {
      try {
        const tasks = [
          { name: t("preload.loadingTheme"), weight: 20 },
          { name: t("preload.loadingLanguage"), weight: 20 },
          { name: t("preload.loadingCalculation"), weight: 20 },
          { name: t("preload.loadingTimeFormat"), weight: 20 },
          { name: t("preload.clearingCache"), weight: 20 },
        ];

        let totalProgress = 0;

        for (const task of tasks) {
          setPreloadState((prev) => ({
            ...prev,
            currentTask: task.name,
          }));

          // Simulate task completion
          await new Promise((resolve) => setTimeout(resolve, 100));

          totalProgress += task.weight;
          setPreloadState((prev) => ({
            ...prev,
            progress: totalProgress,
          }));
        }

        // Preload essential data
        await Promise.all([
          AsyncStorage.getItem("themeMode"),
          AsyncStorage.getItem("calculationMethod"),
          AsyncStorage.getItem("use24Hour"),
          AsyncStorage.getItem("language"),
        ]);

        setPreloadState((prev) => ({
          ...prev,
          isPreloaded: true,
          progress: 100,
          currentTask: t("preload.ready"),
        }));

        debug.log("Preload completed successfully");
      } catch (error) {
        debug.error("Preload failed:", error);
        // Continue anyway
        setPreloadState((prev) => ({
          ...prev,
          isPreloaded: true,
          progress: 100,
          currentTask: t("preload.ready"),
        }));
      }
    };

    preloadData();
  }, [t]);

  return preloadState;
}
