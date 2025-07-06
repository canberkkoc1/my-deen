import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { MECCA_COORDINATES } from '@/constants';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width, height) * 0.85;

export default function QiblaScreen() {
    const { latitude, longitude, loading, error } = useLocation();
    const { colors, isDark } = useTheme();

    // State management
    const [deviceHeading, setDeviceHeading] = useState<number>(0);
    const [qiblaDirection, setQiblaDirection] = useState<number>(0);
    const [distanceToKaaba, setDistanceToKaaba] = useState<number>(0);
    const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | 'unreliable'>('unreliable');
    const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

    // Animation values
    const compassRotation = useRef(new Animated.Value(0)).current;
    const qiblaArrowRotation = useRef(new Animated.Value(0)).current;
    const pulseAnimation = useRef(new Animated.Value(1)).current;

    // Get theme-aware colors
    const getThemeColors = () => {
        if (isDark) {
            return {
                gradientColors: ['#0F1419', '#1A202C', '#2D3748'] as const,
                compassBg: '#2D3748',
                compassBorder: '#4A5568',
                compassCenter: 'rgba(45, 55, 72, 0.95)',
                cardBg: 'rgba(45, 55, 72, 0.9)',
                cardBorder: '#4A5568',
                primaryText: '#FFFFFF',
                secondaryText: '#A0AEC0',
                directionColors: {
                    N: '#E53E3E',
                    E: '#38B2AC',
                    S: '#4299E1',
                    W: '#ED8936'
                },
                markersHigh: '#E2E8F0',
                markersMid: '#A0AEC0',
                markersLow: '#4A5568',
                qiblaArrow: '#48BB78',
                qiblaArrowDark: '#2F855A',
            };
        } else {
            return {
                gradientColors: ['#EDF2F7', '#F7FAFC', '#FFFFFF'] as const,
                compassBg: '#FFFFFF',
                compassBorder: '#E2E8F0',
                compassCenter: 'rgba(255, 255, 255, 0.95)',
                cardBg: 'rgba(255, 255, 255, 0.9)',
                cardBorder: '#E2E8F0',
                primaryText: '#2D3748',
                secondaryText: '#4A5568',
                directionColors: {
                    N: '#E53E3E',
                    E: '#00A3A3',
                    S: '#3182CE',
                    W: '#DD6B20'
                },
                markersHigh: '#2D3748',
                markersMid: '#4A5568',
                markersLow: '#A0AEC0',
                qiblaArrow: '#38A169',
                qiblaArrowDark: '#2F7D32',
            };
        }
    };

    const themeColors = getThemeColors();

    // Calculate Qibla direction using proper great circle calculation
    const calculateQiblaDirection = useCallback((userLat: number, userLng: number): number => {
        const userLatRad = (userLat * Math.PI) / 180;
        const userLngRad = (userLng * Math.PI) / 180;
        const kaabaLatRad = (MECCA_COORDINATES.latitude * Math.PI) / 180;
        const kaabaLngRad = (MECCA_COORDINATES.longitude * Math.PI) / 180;

        const deltaLng = kaabaLngRad - userLngRad;

        const y = Math.sin(deltaLng) * Math.cos(kaabaLatRad);
        const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
            Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLng);

        let bearing = Math.atan2(y, x) * (180 / Math.PI);
        return (bearing + 360) % 360;
    }, []);

    // Calculate distance to Kaaba using Haversine formula
    const calculateDistance = useCallback((userLat: number, userLng: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = ((MECCA_COORDINATES.latitude - userLat) * Math.PI) / 180;
        const dLng = ((MECCA_COORDINATES.longitude - userLng) * Math.PI) / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) * Math.cos((MECCA_COORDINATES.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // Start compass heading tracking
    useEffect(() => {
        let headingSubscription: { remove: () => void } | null = null;

        const startCompass = async () => {
            try {
                // Request permissions
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Pusula çalışması için konum izni gereklidir.');
                    return;
                }

                headingSubscription = await Location.watchHeadingAsync((heading: Location.LocationHeadingObject) => {
                    // Use trueHeading if available, fallback to magHeading
                    const headingValue = heading.trueHeading ?? heading.magHeading;

                    if (headingValue !== undefined && headingValue !== null) {
                        setDeviceHeading(headingValue);
                        setIsCalibrated(true);
                    }

                    // Set accuracy based on platform
                    if (Platform.OS === 'ios') {
                        if (heading.accuracy <= 1) setAccuracy('high');
                        else if (heading.accuracy === 2) setAccuracy('medium');
                        else if (heading.accuracy === 3) setAccuracy('low');
                        else setAccuracy('unreliable');
                    } else {
                        if (heading.accuracy === 3) setAccuracy('high');
                        else if (heading.accuracy === 2) setAccuracy('medium');
                        else if (heading.accuracy === 1) setAccuracy('low');
                        else setAccuracy('unreliable');
                    }
                });
            } catch (error) {
                console.error('Compass initialization error:', error);
                setAccuracy('unreliable');
                Alert.alert('Hata', 'Pusula başlatılamadı. Cihazınızın pusula sensörü çalışmıyor olabilir.');
            }
        };

        startCompass();

        return () => {
            if (headingSubscription) {
                headingSubscription.remove();
            }
        };
    }, []);

    // Calculate qibla when location changes
    useEffect(() => {
        if (latitude && longitude) {
            const qiblaAngle = calculateQiblaDirection(latitude, longitude);
            const distance = calculateDistance(latitude, longitude);
            setQiblaDirection(qiblaAngle);
            setDistanceToKaaba(distance);
        }
    }, [latitude, longitude, calculateQiblaDirection, calculateDistance]);

    // Animate compass rotation
    useEffect(() => {
        Animated.spring(compassRotation, {
            toValue: -deviceHeading, // Negative to counter-rotate
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [deviceHeading]);

    // Animate qibla arrow
    useEffect(() => {
        const qiblaAngleRelative = qiblaDirection - deviceHeading + 180;

        Animated.spring(qiblaArrowRotation, {
            toValue: qiblaAngleRelative,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [qiblaDirection, deviceHeading]);

    // Pulse animation for accuracy indicator
    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        pulse();
    }, []);

    // Calculate angle difference for status
    const getAngleDifference = (angle1: number, angle2: number): number => {
        let diff = Math.abs(angle1 - angle2);
        if (diff > 180) {
            diff = 360 - diff;
        }
        return diff;
    };

    const angleDifference = getAngleDifference(qiblaDirection, deviceHeading);

    // Get accuracy information
    const getAccuracyInfo = () => {
        switch (accuracy) {
            case 'high': return { text: "Yüksek Doğruluk", color: colors.success, emoji: "🎯" };
            case 'medium': return { text: "Orta Doğruluk", color: colors.warning, emoji: "📍" };
            case 'low': return { text: "Düşük Doğruluk", color: colors.error, emoji: "⚠️" };
            default: return { text: "Kalibre Ediliyor", color: colors.textMuted, emoji: "🔄" };
        }
    };

    // Get status message
    const getStatusMessage = () => {
        if (!isCalibrated) return 'Pusula Kalibre Ediliyor...';
        if (angleDifference < 3) return '🎯 Mükemmel! Kıble Yönü Bulundu';
        if (angleDifference < 8) return '✅ Çok İyi! Kıbleye Çok Yakın';
        if (angleDifference < 20) return '🔄 İyi! Kıbleye Yaklaşıyorsunuz';
        return '🧭 Kıble Yönünü Bulmak İçin Dönün';
    };

    const accuracyInfo = getAccuracyInfo();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.gradientColors[0] }]}>
            <Stack.Screen options={{ title: 'Kıble', headerShown: false }} />

            {/* Background */}
            <LinearGradient
                colors={themeColors.gradientColors}
                locations={[0, 0.5, 1]}
                style={styles.gradientBackground}
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: themeColors.primaryText }]}>Kıble Pusulası</Text>
                    <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>
                        {latitude && longitude ? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` : 'Konum Alınıyor...'}
                    </Text>
                </View>
                <Animated.View
                    style={[
                        styles.accuracyBadge,
                        { backgroundColor: accuracyInfo.color },
                        { transform: [{ scale: pulseAnimation }] }
                    ]}
                >
                    <Text style={styles.accuracyText}>{accuracyInfo.emoji}</Text>
                </Animated.View>
            </View>

            {/* Main Compass */}
            <View style={styles.compassContainer}>
                {/* Compass Background */}
                <Animated.View
                    style={[
                        styles.compassBase,
                        {
                            transform: [{
                                rotate: compassRotation.interpolate({
                                    inputRange: [-360, 360],
                                    outputRange: ['-360deg', '360deg']
                                })
                            }]
                        }
                    ]}
                >
                    <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                        <Defs>
                            <RadialGradient id="compassGrad" cx="50%" cy="50%" r="50%">
                                <Stop offset="0%" stopColor={themeColors.compassBg} stopOpacity="0.9" />
                                <Stop offset="70%" stopColor={themeColors.gradientColors[1]} stopOpacity="0.95" />
                                <Stop offset="100%" stopColor={themeColors.gradientColors[0]} stopOpacity="1" />
                            </RadialGradient>
                        </Defs>

                        {/* Main circle */}
                        <Circle
                            cx={COMPASS_SIZE / 2}
                            cy={COMPASS_SIZE / 2}
                            r={COMPASS_SIZE / 2 - 10}
                            fill="url(#compassGrad)"
                            stroke={themeColors.compassBorder}
                            strokeWidth="2"
                        />

                        {/* Degree markers */}
                        {Array.from({ length: 72 }).map((_, i) => {
                            const angle = i * 5;
                            const isMajor = angle % 30 === 0;
                            const isMinor = angle % 10 === 0;
                            const radius = COMPASS_SIZE / 2 - 10;
                            const innerRadius = radius - (isMajor ? 25 : isMinor ? 15 : 8);

                            const x1 = COMPASS_SIZE / 2 + Math.sin((angle * Math.PI) / 180) * radius;
                            const y1 = COMPASS_SIZE / 2 - Math.cos((angle * Math.PI) / 180) * radius;
                            const x2 = COMPASS_SIZE / 2 + Math.sin((angle * Math.PI) / 180) * innerRadius;
                            const y2 = COMPASS_SIZE / 2 - Math.cos((angle * Math.PI) / 180) * innerRadius;

                            return (
                                <Line
                                    key={i}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke={isMajor ? themeColors.markersHigh : isMinor ? themeColors.markersMid : themeColors.markersLow}
                                    strokeWidth={isMajor ? "3" : isMinor ? "2" : "1"}
                                />
                            );
                        })}

                        {/* Direction letters */}
                        {[
                            { dir: 'N', angle: 0, color: themeColors.directionColors.N },
                            { dir: 'E', angle: 90, color: themeColors.directionColors.E },
                            { dir: 'S', angle: 180, color: themeColors.directionColors.S },
                            { dir: 'W', angle: 270, color: themeColors.directionColors.W }
                        ].map(({ dir, angle, color }) => {
                            const radius = COMPASS_SIZE / 2 - 45;
                            const x = COMPASS_SIZE / 2 + Math.sin((angle * Math.PI) / 180) * radius;
                            const y = COMPASS_SIZE / 2 - Math.cos((angle * Math.PI) / 180) * radius;

                            return (
                                <SvgText
                                    key={dir}
                                    x={x}
                                    y={y + 6}
                                    textAnchor="middle"
                                    fontSize="24"
                                    fontWeight="bold"
                                    fill={color}
                                >
                                    {dir}
                                </SvgText>
                            );
                        })}

                        {/* Degree numbers */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((degree) => {
                            const radius = COMPASS_SIZE / 2 - 70;
                            const x = COMPASS_SIZE / 2 + Math.sin((degree * Math.PI) / 180) * radius;
                            const y = COMPASS_SIZE / 2 - Math.cos((degree * Math.PI) / 180) * radius;

                            return (
                                <SvgText
                                    key={degree}
                                    x={x}
                                    y={y + 4}
                                    textAnchor="middle"
                                    fontSize="14"
                                    fontWeight="500"
                                    fill={themeColors.secondaryText}
                                >
                                    {degree}°
                                </SvgText>
                            );
                        })}
                    </Svg>
                </Animated.View>

                {/* Qibla Arrow */}
                <Animated.View
                    style={[
                        styles.qiblaArrow,
                        {
                            transform: [{
                                rotate: qiblaArrowRotation.interpolate({
                                    inputRange: [-360, 360],
                                    outputRange: ['-360deg', '360deg']
                                })
                            }]
                        }
                    ]}
                >
                    <Svg width={60} height={COMPASS_SIZE * 0.7} viewBox="0 0 60 200">
                        <Defs>
                            <RadialGradient id="arrowGrad" cx="50%" cy="50%" r="50%">
                                <Stop offset="0%" stopColor={themeColors.qiblaArrow} stopOpacity="1" />
                                <Stop offset="100%" stopColor={themeColors.qiblaArrowDark} stopOpacity="1" />
                            </RadialGradient>
                        </Defs>

                        {/* Arrow body */}
                        <Path
                            d="M30,10 L22,160 L30,150 L38,160 Z"
                            fill="url(#arrowGrad)"
                            stroke={themeColors.qiblaArrowDark}
                            strokeWidth="2"
                        />

                        {/* Kaaba symbol */}
                        <Circle cx="30" cy="180" r="18" fill={themeColors.qiblaArrowDark} stroke={themeColors.compassBorder} strokeWidth="2" />
                        <SvgText x="30" y="188" textAnchor="middle" fontSize="20" fill="#FFFFFF">🕋</SvgText>
                    </Svg>
                </Animated.View>

                {/* Center Info */}
                <View style={[styles.centerInfo, {
                    backgroundColor: themeColors.compassCenter,
                    borderColor: themeColors.compassBorder
                }]}>
                    <Text style={[styles.qiblaAngle, { color: themeColors.qiblaArrow }]}>{Math.round(qiblaDirection)}°</Text>
                    <Text style={[styles.qiblaLabel, { color: themeColors.secondaryText }]}>Kıble</Text>
                    <Text style={[styles.deviceAngle, { color: themeColors.primaryText }]}>{Math.round(deviceHeading)}°</Text>
                </View>
            </View>

            {/* Bottom Info Panel */}
            <View style={styles.bottomPanel}>
                <View style={[styles.statusCard, {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.cardBorder
                }]}>
                    <Text style={[styles.statusTitle, { color: themeColors.primaryText }]}>{getStatusMessage()}</Text>
                    <Text style={[styles.statusSubtitle, { color: themeColors.secondaryText }]}>
                        Cihaz yönünden {angleDifference.toFixed(1)}° fark var
                    </Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={[styles.infoCard, {
                        backgroundColor: themeColors.cardBg,
                        borderColor: themeColors.cardBorder
                    }]}>
                        <Text style={[styles.infoLabel, { color: themeColors.secondaryText }]}>Mesafe</Text>
                        <Text style={[styles.infoValue, { color: themeColors.primaryText }]}>{Math.round(distanceToKaaba)} km</Text>
                    </View>
                    <View style={[styles.infoCard, {
                        backgroundColor: themeColors.cardBg,
                        borderColor: themeColors.cardBorder
                    }]}>
                        <Text style={[styles.infoLabel, { color: themeColors.secondaryText }]}>Doğruluk</Text>
                        <Text style={[styles.infoValue, { color: accuracyInfo.color }]}>
                            {accuracyInfo.text.split(' ')[0]}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Debug Info (Development only) */}
            {__DEV__ && (
                <View style={[styles.debugPanel, { backgroundColor: colors.overlay }]}>
                    <Text style={[styles.debugTitle, { color: themeColors.primaryText }]}>Debug Bilgileri</Text>
                    <Text style={[styles.debugText, { color: themeColors.secondaryText }]}>Konum: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}</Text>
                    <Text style={[styles.debugText, { color: themeColors.secondaryText }]}>Cihaz: {deviceHeading.toFixed(1)}° | Kıble: {qiblaDirection.toFixed(1)}°</Text>
                    <Text style={[styles.debugText, { color: themeColors.secondaryText }]}>Açı Farkı: {angleDifference.toFixed(1)}° | Doğruluk: {accuracy}</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    accuracyBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    accuracyText: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    compassContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    compassBase: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    qiblaArrow: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerInfo: {
        position: 'absolute',
        borderRadius: 60,
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    qiblaAngle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    qiblaLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    deviceAngle: {
        fontSize: 14,
        fontWeight: '600',
    },
    bottomPanel: {
        paddingHorizontal: 24,
        paddingBottom: 30,
    },
    statusCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    statusSubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoCard: {
        borderRadius: 12,
        padding: 16,
        flex: 0.48,
        alignItems: 'center',
        borderWidth: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    debugPanel: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        padding: 12,
        borderRadius: 8,
        maxWidth: width * 0.9,
    },
    debugTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    debugText: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 2,
    },
});
