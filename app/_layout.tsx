import { LocationProvider } from '@/context/LocationContext';
import { PrayerTimesProvider } from '@/context/PrayerTimesContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/context/ThemeContext';
import '@/lib/i18n';
import { registerPushToken } from '@/service/registerPushNot';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Navigation theme wrapper component
function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    registerPushToken();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <CustomThemeProvider>
      <LocationProvider>
        <PrayerTimesProvider>
          <NavigationThemeWrapper>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeWrapper>
        </PrayerTimesProvider>
      </LocationProvider>
    </CustomThemeProvider>
  );
}
