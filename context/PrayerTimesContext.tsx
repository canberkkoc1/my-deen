import { debug } from '@/lib/debug';
import { prayerTimesApi } from '@/lib/prayerTimesApi';
import type { SimplePrayerTimes } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from './LocationContext';

interface PrayerTimesContextType {
    prayerTimes: SimplePrayerTimes | null;
    loading: boolean;
    error: string | null;
    refreshPrayerTimes: () => Promise<void>;
    getNextPrayer: () => { name: string; time: string; isNextDay: boolean } | null;
    getTimeUntilNext: () => string | null;
    use24Hour: boolean;
    setUse24Hour: (value: boolean) => void;
}

const PrayerTimesContext = createContext<PrayerTimesContextType | undefined>(undefined);

interface PrayerTimesProviderProps {
    children: ReactNode;
}

export function PrayerTimesProvider({ children }: PrayerTimesProviderProps) {
    const [prayerTimes, setPrayerTimes] = useState<SimplePrayerTimes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [use24Hour, setUse24HourState] = useState(true);

    const { latitude, longitude, loading: locationLoading, isUsingDefaultLocation } = useLocation();

    // Get calculation method from storage
    const getCalculationMethod = async (): Promise<number> => {
        try {
            const storedMethod = await AsyncStorage.getItem('calculationMethod');
            return storedMethod ? JSON.parse(storedMethod) : 13; // Default to Turkey method (ID: 13)
        } catch (error) {
            debug.error('Hesaplama metodu okunamadı:', error);
            return 13; // Turkey method as fallback
        }
    };

    // Fetch prayer times
    const fetchPrayerTimes = async () => {
        if (!latitude || !longitude || locationLoading) {
            debug.log('Konum bilgisi mevcut değil veya lokasyon yükleniyor, namaz vakitleri alınamıyor');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const method = await getCalculationMethod();
            debug.log('Namaz vakitleri alınıyor:', {
                latitude,
                longitude,
                method,
                isUsingDefaultLocation
            });

            const times = await prayerTimesApi.getTodaysPrayerTimes(latitude, longitude, method);
            setPrayerTimes(times);

            debug.log('Namaz vakitleri başarıyla alındı:', times);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
            setError(errorMessage);
            debug.error('Namaz vakitleri alınamadı:', err);
        } finally {
            setLoading(false);
        }
    };

    // Refresh prayer times manually
    const refreshPrayerTimes = async () => {
        await fetchPrayerTimes();
    };

    // Get next prayer info
    const getNextPrayer = () => {
        if (!prayerTimes) return null;
        return prayerTimesApi.getNextPrayerTime(prayerTimes);
    };

    // Get time until next prayer
    const getTimeUntilNext = () => {
        if (!prayerTimes) return null;
        return prayerTimesApi.getTimeUntilNextPrayer(prayerTimes);
    };

    // Set 24 hour format preference
    const setUse24Hour = async (value: boolean) => {
        try {
            setUse24HourState(value);
            await AsyncStorage.setItem('use24Hour', JSON.stringify(value));
            debug.log(`24 saat formatı ayarı güncellendi: ${value}`);
        } catch (error) {
            debug.error('24 saat formatı ayarı kaydedilemedi:', error);
        }
    };

    // Load 24 hour format preference on mount
    useEffect(() => {
        const loadTimeFormat = async () => {
            try {
                const stored24Hour = await AsyncStorage.getItem('use24Hour');
                if (stored24Hour !== null) {
                    setUse24HourState(JSON.parse(stored24Hour));
                }
            } catch (error) {
                debug.error('24 saat formatı ayarı okunamadı:', error);
            }
        };
        loadTimeFormat();
    }, []);

    // Effect to fetch prayer times when location changes
    useEffect(() => {
        if (latitude && longitude && !locationLoading) {
            fetchPrayerTimes();
        }
    }, [latitude, longitude, locationLoading]);

    // Effect to refresh prayer times at midnight
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        const timeoutId = setTimeout(() => {
            debug.log('Gece yarısı geçti, namaz vakitleri yenileniyor');
            fetchPrayerTimes();

            // Set up daily refresh
            const intervalId = setInterval(() => {
                fetchPrayerTimes();
            }, 24 * 60 * 60 * 1000); // 24 hours

            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, []);

    // Listen for calculation method changes
    useEffect(() => {
        const handleStorageChange = async () => {
            debug.log('Ayarlar değişti, namaz vakitleri yenileniyor');
            await fetchPrayerTimes();
        };

        // Note: AsyncStorage doesn't have a built-in listener
        // We'll handle this through the settings component

        return () => { };
    }, []);

    const contextValue: PrayerTimesContextType = {
        prayerTimes,
        loading,
        error,
        refreshPrayerTimes,
        getNextPrayer,
        getTimeUntilNext,
        use24Hour,
        setUse24Hour
    };

    return (
        <PrayerTimesContext.Provider value={contextValue}>
            {children}
        </PrayerTimesContext.Provider>
    );
}

export function usePrayerTimes(): PrayerTimesContextType {
    const context = useContext(PrayerTimesContext);
    if (context === undefined) {
        throw new Error('usePrayerTimes must be used within a PrayerTimesProvider');
    }
    return context;
} 