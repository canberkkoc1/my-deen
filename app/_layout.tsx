import { GlobalBanner } from '@/components/GlobalBanner';
import { LoadingProvider } from '@/context/LoadingContext';
import { LocationProvider } from '@/context/LocationContext';
import { PrayerTimesProvider } from '@/context/PrayerTimesContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/context/ThemeContext';
import '@/lib/i18n';
import { registerPushToken } from '@/service/registerPushNot';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import MobileAds from 'react-native-google-mobile-ads';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Navigation theme wrapper component
function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appReady, setAppReady] = useState(false);

  // Keep splash screen visible until app is ready
  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (!loaded) return;

        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));

        setAppReady(true);
      } catch (e) {
        console.warn('App preparation failed:', e);
        setAppReady(true);
      }
    }

    prepare();
  }, [loaded]);

  // Hide splash screen when app is ready
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Defer heavy initialization until after app is visible
  useEffect(() => {
    if (!appReady) return;

    // Initialize services in background after app is ready
    const initializeServices = async () => {
      try {
        // Register push notifications (non-blocking)
        registerPushToken().catch(err => console.warn('Push token registration failed:', err));

        // Initialize Google Mobile Ads (non-blocking)
        setTimeout(async () => {
          try {
            if (Platform.OS === 'ios') {
              const { status } = await getTrackingPermissionsAsync();
              if (status === PermissionStatus.UNDETERMINED) {
                await requestTrackingPermissionsAsync();
              }
            }

            const adapterStatuses = await MobileAds().initialize();
            console.log('Google Mobile Ads initialized successfully:', adapterStatuses);
          } catch (error) {
            console.error('Failed to initialize Google Mobile Ads:', error);
          }
        }, 2000); // Delay ads initialization
      } catch (error) {
        console.error('Service initialization failed:', error);
      }
    };

    initializeServices();
  }, [appReady]);

  // Setup notification listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  if (!appReady) {
    // Show nothing while app is preparing - splash screen will be visible
    return null;
  }

  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <LoadingProvider>
          <LocationProvider>
            <PrayerTimesProvider>
              <NavigationThemeWrapper>
                <GlobalBanner />
                <Stack screenOptions={{ headerShown: false, }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </NavigationThemeWrapper>
            </PrayerTimesProvider>
          </LocationProvider>
        </LoadingProvider>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}
