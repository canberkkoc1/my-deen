import { GlobalBanner } from '@/components/GlobalBanner';
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
import { useEffect } from 'react';
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

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    registerPushToken();

    // Notification received listener
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification);
      }
    );

    // Notification response listener (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    // Initialize Google Mobile Ads after app is ready
    const initializeAds = async () => {
      try {
        // Request App Tracking Transparency authorization on iOS
        if (Platform.OS === 'ios') {
          const { status } = await getTrackingPermissionsAsync();
          if (status === PermissionStatus.UNDETERMINED) {
            await requestTrackingPermissionsAsync();
          }
        }

        // Initialize the Google Mobile Ads SDK
        const adapterStatuses = await MobileAds().initialize();

        // Initialization complete!
        console.log('Google Mobile Ads initialized successfully:', adapterStatuses);
      } catch (error) {
        console.error('Failed to initialize Google Mobile Ads:', error);
      }
    };

    // Delay initialization to ensure app is fully loaded
    const timer = setTimeout(initializeAds, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
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
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}
