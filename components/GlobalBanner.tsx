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

    // (iOS) WKWebView can terminate if app is in a "suspended state", resulting in an empty banner when app returns to foreground.
    // Therefore it's advised to "manually" request a new ad when the app is foregrounded
    useForeground(() => {
        if (!adError) {
            Platform.OS === 'ios' && bannerRef.current?.load();
        }
    });

    // Don't render banner if there's an error
    if (adError) {
        return null;
    }

    return (
        <View style={[
            styles.bannerContainer,
            {
                paddingTop: insets.top + 8, // Biraz daha padding ekledim
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
            }
        ]}>
            <BannerAd
                ref={bannerRef}
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                onAdFailedToLoad={(error) => {
                    console.warn('Banner ad failed to load:', error);
                    setAdError(true);
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded successfully');
                    setAdError(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8, // Biraz vertical padding
        borderBottomWidth: 0.5,
    }
});