import { useTheme } from '@/context/ThemeContext';
import { usePreload } from '@/hooks/usePreload';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
    message?: string;
    showProgress?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = React.memo(({
    message = 'Yükleniyor...',
    showProgress = true
}) => {
    const { colors, isDark } = useTheme();
    const { currentTask, progress } = usePreload();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Memoize styles to prevent unnecessary re-renders
    const containerStyle = useMemo(() => [
        styles.container,
        { backgroundColor: colors.background }
    ], [colors.background]);

    const logoCircleStyle = useMemo(() => [
        styles.logoCircle,
        {
            backgroundColor: isDark ? colors.tint : colors.tint + '20',
            borderColor: colors.tint,
        }
    ], [isDark, colors.tint]);

    const logoTextStyle = useMemo(() => [
        styles.logoText,
        { color: colors.tint }
    ], [colors.tint]);

    const messageStyle = useMemo(() => [
        styles.message,
        { color: colors.text }
    ], [colors.text]);

    const appNameStyle = useMemo(() => [
        styles.appName,
        { color: colors.tint }
    ], [colors.tint]);

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Scale up animation
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();

        // Continuous rotation animation
        const rotationAnimation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );

        // Pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        if (showProgress) {
            rotationAnimation.start();
        }
        pulseAnimation.start();

        return () => {
            rotationAnimation.stop();
            pulseAnimation.stop();
        };
    }, [fadeAnim, scaleAnim, rotateAnim, pulseAnim, showProgress]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={containerStyle}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }
                ]}
            >
                {/* Logo/Icon Area */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            transform: [{ scale: pulseAnim }],
                        }
                    ]}
                >
                    <View style={logoCircleStyle}>
                        <Text style={logoTextStyle}>
                            🕌
                        </Text>
                    </View>
                </Animated.View>

                {/* Loading Spinner */}
                {showProgress && (
                    <Animated.View
                        style={[
                            styles.spinner,
                            {
                                transform: [{ rotate: spin }],
                            }
                        ]}
                    >
                        <View style={[
                            styles.spinnerRing,
                            { borderTopColor: colors.tint, borderRightColor: colors.tint + '30' }
                        ]} />
                    </Animated.View>
                )}

                {/* Loading Message */}
                <Text style={messageStyle}>
                    {currentTask || message}
                </Text>

                {/* Progress Bar - Only show for app initialization */}
                {showProgress && progress > 0 && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.tint,
                                        width: `${progress}%`
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.text }]}>
                            {progress}%
                        </Text>
                    </View>
                )}

                {/* App Name - Only show for app initialization */}
                {showProgress && (
                    <Text style={appNameStyle}>
                        My Deen
                    </Text>
                )}

                {/* Loading Dots */}
                <View style={styles.dotsContainer}>
                    {[0, 1, 2].map((index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: colors.tint + '60' },
                                {
                                    transform: [{
                                        scale: pulseAnim.interpolate({
                                            inputRange: [1, 1.1],
                                            outputRange: [1, 1.2],
                                        })
                                    }]
                                }
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: 300, // API loading için daha küçük
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 30,
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    logoText: {
        fontSize: 24,
    },
    spinner: {
        position: 'absolute',
        top: -8,
        left: -8,
        width: 76,
        height: 76,
    },
    spinnerRing: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        borderTopColor: '#007AFF',
        borderRightColor: '#007AFF',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    message: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 30,
        textAlign: 'center',
    },
    appName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    progressContainer: {
        width: '80%',
        marginTop: 20,
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
