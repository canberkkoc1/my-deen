import { useTheme } from '@/context/ThemeContext';
import React, { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-3782077697240059/9019861463';

export const GlobalBanner = () => {
    const bannerRef = useRef<BannerAd>(null);
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    // (iOS) WKWebView can terminate if app is in a "suspended state", resulting in an empty banner when app returns to foreground.
    // Therefore it's advised to "manually" request a new ad when the app is foregrounded
    useForeground(() => {
        Platform.OS === 'ios' && bannerRef.current?.load();
    });

    return (
        <View style={[
            styles.bannerContainer,
            {
                paddingTop: insets.top + 0,
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
            }
        ]}>
            <BannerAd
                ref={bannerRef}
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 0,
        borderBottomWidth: 0.5,
    }
});