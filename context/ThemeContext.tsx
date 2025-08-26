import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: 'light' | 'dark';
    themeMode: ThemeMode;
    colors: typeof Colors.light;
    setThemeMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoading, setIsLoading] = useState(true);

    // Calculate actual theme based on mode
    const getActualTheme = (mode: ThemeMode, systemTheme: 'light' | 'dark' | null | undefined): 'light' | 'dark' => {
        if (mode === 'system') {
            return systemTheme === 'dark' ? 'dark' : 'light';
        }
        return mode;
    };

    const theme = getActualTheme(themeMode, systemColorScheme);
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    // Load saved theme mode from storage
    useEffect(() => {
        const loadThemeMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem('themeMode');
                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setThemeModeState(savedMode as ThemeMode);
                }
            } catch (error) {
                console.error('Theme mode yüklenemedi:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadThemeMode();
    }, []);

    // Save theme mode to storage
    const setThemeMode = async (mode: ThemeMode) => {
        try {
            await AsyncStorage.setItem('themeMode', mode);
            setThemeModeState(mode);
        } catch (error) {
            console.error('Theme mode kaydedilemedi:', error);
        }
    };

    const value: ThemeContextType = {
        theme,
        themeMode,
        colors,
        setThemeMode,
        isDark,
    };

    // Use default theme while loading to avoid blocking
    // This prevents the entire app from being blocked during theme loading

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
} 