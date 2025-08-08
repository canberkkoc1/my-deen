import { useTheme } from '@/context/ThemeContext';
import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-3782077697240059/9374905449';

export const GlobalBanner = () => {
    const bannerRef = useRef<BannerAd>(null);
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [adError, setAdError] = useState(false);
    const [adLoaded, setAdLoaded] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // (iOS) WKWebView can terminate if app is in a "suspended state", resulting in an empty banner when app returns to foreground.
    // Therefore it's advised to "manually" request a new ad when the app is foregrounded
    useForeground(() => {
        if (!adError && (adLoaded || __DEV__)) {
            Platform.OS === 'ios' && bannerRef.current?.load();
        }
    });

    // Determine if we should show placeholder
    const shouldShowPlaceholder = () => {
        if (__DEV__) {
            // In development, only show placeholder if there's an explicit error
            return adError;
        } else {
            // In production, show placeholder if there's an error OR ad hasn't loaded yet
            return adError || !adLoaded;
        }
    };

    // Always render the container to maintain layout consistency
    return (
        <View style={[
            styles.bannerContainer,
            {
                paddingTop: insets.top + 8,
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
                // Set minimum height to prevent layout shifts
                minHeight: 60, // Always maintain minimum height
            }
        ]}>
            {/* Show ad component - in dev it will always try to load test ads */}
            {!adError && (
                <BannerAd
                    ref={bannerRef}
                    unitId={adUnitId}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    onAdFailedToLoad={(error) => {
                        console.warn('Banner ad failed to load:', error);
                        setAdError(true);
                        setAdLoaded(false);
                        setIsInitialLoad(false);
                    }}
                    onAdLoaded={() => {
                        console.log('Banner ad loaded successfully');
                        setAdError(false);
                        setAdLoaded(true);
                        setIsInitialLoad(false);
                    }}
                />
            )}

            {/* Show placeholder when ad is not available */}
            {shouldShowPlaceholder() && (
                <View style={[
                    styles.adPlaceholder,
                    {
                        backgroundColor: __DEV__ ? colors.background : 'transparent',
                    }
                ]}>
                    {__DEV__ && adError && (
                        <View style={styles.devErrorIndicator} />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8, // Biraz vertical padding
        borderBottomWidth: 0.5,
    },
    adPlaceholder: {
        width: '100%',
        height: 50, // Standard banner height
        justifyContent: 'center',
        alignItems: 'center',
    },
    devErrorIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF6B6B',
        opacity: 0.3,
    }
});