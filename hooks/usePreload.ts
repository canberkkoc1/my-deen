import { debug } from "@/lib/debug";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

interface PreloadState {
  isPreloaded: boolean;
  progress: number;
  currentTask: string;
}

export function usePreload() {
  const [preloadState, setPreloadState] = useState<PreloadState>({
    isPreloaded: false,
    progress: 0,
    currentTask: "Başlatılıyor...",
  });

  useEffect(() => {
    const preloadData = async () => {
      try {
        const tasks = [
          { name: "Tema ayarları yükleniyor...", weight: 20 },
          { name: "Dil ayarları yükleniyor...", weight: 20 },
          { name: "Hesaplama metodu yükleniyor...", weight: 20 },
          { name: "Zaman formatı yükleniyor...", weight: 20 },
          { name: "Cache temizleniyor...", weight: 20 },
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
          currentTask: "Hazır!",
        }));

        debug.log("Preload completed successfully");
      } catch (error) {
        debug.error("Preload failed:", error);
        // Continue anyway
        setPreloadState((prev) => ({
          ...prev,
          isPreloaded: true,
          progress: 100,
          currentTask: "Hazır!",
        }));
      }
    };

    preloadData();
  }, []);

  return preloadState;
}
