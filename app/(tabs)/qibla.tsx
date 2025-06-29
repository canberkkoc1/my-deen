import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { MECCA_COORDINATES } from '@/constants';
import { useLocation } from '@/context/LocationContext';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width, height) * 0.8;

// Function to calculate the circular mean of an array of angles in degrees
/* const getCircularMean = (angles: number[]): number => {
    if (angles.length === 0) return 0;

    const sumSin = angles.reduce((sum, angle) => sum + Math.sin(angle * Math.PI / 180), 0);
    const sumCos = angles.reduce((sum, angle) => sum + Math.cos(angle * Math.PI / 180), 0);

    const avgSin = sumSin / angles.length;
    const avgCos = sumCos / angles.length;

    const meanAngleRad = Math.atan2(avgSin, avgCos);
    let meanAngleDeg = meanAngleRad * 180 / Math.PI;

    return (meanAngleDeg + 360) % 360;
}; */

export default function QiblaScreen() {
    const { latitude, longitude, loading, error } = useLocation();

    // State management
    const [deviceHeading, setDeviceHeading] = useState<number>(0);
    const [qiblaDirection, setQiblaDirection] = useState<number>(0);
    const [distanceToKaaba, setDistanceToKaaba] = useState<number>(0);
    const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | 'unreliable'>('unreliable');

    // Animation values
    const compassRotation = useRef(new Animated.Value(0)).current;
    const qiblaArrowRotation = useRef(new Animated.Value(0)).current;

    // Calculate Qibla direction
    const calculateQiblaDirection = useCallback((userLat: number, userLng: number): number => {
        const userLatRad = userLat * Math.PI / 180;
        const userLngRad = userLng * Math.PI / 180;
        const kaabaLatRad = MECCA_COORDINATES.latitude * Math.PI / 180;
        const kaabaLngRad = MECCA_COORDINATES.longitude * Math.PI / 180;

        const deltaLng = kaabaLngRad - userLngRad;

        const y = Math.sin(deltaLng) * Math.cos(kaabaLatRad);
        const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
            Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLng);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }, []);

    // Calculate distance to Kaaba
    const calculateDistance = useCallback((userLat: number, userLng: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (MECCA_COORDINATES.latitude - userLat) * Math.PI / 180;
        const dLng = (MECCA_COORDINATES.longitude - userLng) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(MECCA_COORDINATES.latitude * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // Use OS-level heading updates for stability and accuracy
    useEffect(() => {
        let headingSubscription: { remove: () => void } | null = null;

        const startWatchingHeading = async () => {
            try {
                headingSubscription = await Location.watchHeadingAsync((heading: Location.LocationHeadingObject) => {
                    if (heading.magHeading) {
                        // Apply a -90 degree correction to fix orientation offset
                        const correctedHeading = (heading.magHeading - 90 + 360) % 360;
                        setDeviceHeading(correctedHeading);
                    }

                    // Update accuracy based on the new API's value
                    // iOS: 0: v.good, 1: good, 2: poor, 3: unreliable
                    // Android: 3: high, 2: medium, 1: low, 0: unreliable
                    if (Platform.OS === 'ios') {
                        if (heading.accuracy <= 1) setAccuracy('high');
                        else if (heading.accuracy === 2) setAccuracy('medium');
                        else if (heading.accuracy === 3) setAccuracy('low');
                        else setAccuracy('unreliable');
                    } else { // Android
                        if (heading.accuracy === 3) setAccuracy('high');
                        else if (heading.accuracy === 2) setAccuracy('medium');
                        else if (heading.accuracy === 1) setAccuracy('low');
                        else setAccuracy('unreliable');
                    }
                });
            } catch (e) {
                console.error("Could not start heading updates", e);
                setAccuracy('unreliable');
            }
        };

        startWatchingHeading();

        return () => {
            if (headingSubscription) {
                headingSubscription.remove();
            }
        };
    }, []);

    // Calculate qibla direction when location changes
    useEffect(() => {
        if (latitude && longitude) {
            const qiblaAngle = calculateQiblaDirection(latitude, longitude);
            const distance = calculateDistance(latitude, longitude);
            setQiblaDirection(qiblaAngle);
            setDistanceToKaaba(distance);
        }
    }, [latitude, longitude, calculateQiblaDirection, calculateDistance]);

    // Smooth compass rotation animation
    useEffect(() => {
        Animated.spring(compassRotation, {
            toValue: -deviceHeading,
            speed: 10,
            bounciness: 5,
            useNativeDriver: true,
        }).start();
    }, [deviceHeading]);

    // Animate Qibla arrow based on qibla and device direction
    useEffect(() => {
        // The angle for the arrow to point towards Qibla from the device's top
        const qiblaAngleOnScreen = qiblaDirection - deviceHeading;

        Animated.spring(qiblaArrowRotation, {
            toValue: qiblaAngleOnScreen,
            speed: 10,
            bounciness: 5,
            useNativeDriver: true,
        }).start();
    }, [qiblaDirection, deviceHeading]);

    // Simple angle difference calculation
    const getAngleDifference = (angle1: number, angle2: number): number => {
        let diff = Math.abs(angle1 - angle2);
        if (diff > 180) {
            diff = 360 - diff;
        }
        return diff;
    };

    const angleDifference = getAngleDifference(qiblaDirection, deviceHeading);

    const getAccuracyInfo = () => {
        switch (accuracy) {
            case 'high': return { text: "Yüksek", color: "#2ecc71", emoji: "✅" };
            case 'medium': return { text: "Orta", color: "#f1c40f", emoji: "🤔" };
            case 'low': return { text: "Düşük", color: "#e74c3c", emoji: "⚠️" };
            default: return { text: "Kalibre Ediliyor", color: "#95a5a6", emoji: "🔄" };
        }
    };

    const accuracyInfo = getAccuracyInfo();

    // Get status message
    const getStatusMessage = () => {
        if (angleDifference < 2) return '🎯 Mükemmel Kıble Yönü!';
        if (angleDifference < 5) return '✅ Kıbleye Çok Yakın';
        if (angleDifference < 15) return '🔄 Kıbleye Yakın';
        return '🧭 Kıble Yönünü Bulmak İçin Dönün';
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Kıble Pusulası',
                    headerShown: false
                }}
            />

            <LinearGradient
                colors={['#1D2B4A', '#0D172A']}
                style={styles.gradientBackground}
            />

            <View style={styles.header}>
                <Text style={styles.title}>Kıble</Text>
                <View style={styles.accuracyIndicator}>
                    <Text style={styles.accuracyText}>
                        {accuracyInfo.emoji} {accuracyInfo.text}
                    </Text>
                </View>
            </View>

            <View style={styles.compassContainer}>
                <Animated.View style={[{
                    transform: [{
                        rotate: compassRotation.interpolate({
                            inputRange: [-360, 360],
                            outputRange: ['-360deg', '360deg']
                        })
                    }]
                }]}>
                    <Svg height={COMPASS_SIZE} width={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                        <Defs>
                            <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
                                <Stop offset="85%" stopColor="#152238" stopOpacity="1" />
                                <Stop offset="100%" stopColor="#0D172A" stopOpacity="1" />
                            </RadialGradient>
                        </Defs>

                        {/* Baseplate */}
                        <Circle cx={COMPASS_SIZE / 2} cy={COMPASS_SIZE / 2} r={COMPASS_SIZE / 2} fill="url(#grad)" />
                        <Circle cx={COMPASS_SIZE / 2} cy={COMPASS_SIZE / 2} r={COMPASS_SIZE / 2 * 0.96} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

                        {/* North Indicator */}
                        <G rotation={0} origin={`${COMPASS_SIZE / 2}, ${COMPASS_SIZE / 2}`}>
                            <Path
                                d={`M ${COMPASS_SIZE / 2} ${COMPASS_SIZE * 0.05} L ${COMPASS_SIZE / 2 - 8} ${COMPASS_SIZE * 0.1} L ${COMPASS_SIZE / 2 + 8} ${COMPASS_SIZE * 0.1} Z`}
                                fill="#e74c3c"
                            />
                        </G>

                        {/* Degree Ticks */}
                        {Array.from({ length: 360 / 2 }).map((_, i) => {
                            const angle = i * 2;
                            const isMajor = angle % 30 === 0;
                            const isMinor = angle % 10 === 0;
                            return (
                                <Line
                                    key={`tick-${i}`}
                                    x1={COMPASS_SIZE / 2}
                                    y1={COMPASS_SIZE * 0.04}
                                    x2={COMPASS_SIZE / 2}
                                    y2={COMPASS_SIZE * (isMajor ? 0.1 : isMinor ? 0.08 : 0.06)}
                                    stroke={isMajor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}
                                    strokeWidth={isMajor ? 2 : 1}
                                    transform={`rotate(${angle} ${COMPASS_SIZE / 2} ${COMPASS_SIZE / 2})`}
                                />
                            );
                        })}

                        {/* Direction Text */}
                        {['N', 'E', 'S', 'W'].map((dir, i) => (
                            <SvgText
                                key={dir}
                                x={COMPASS_SIZE / 2}
                                y={COMPASS_SIZE * 0.15}
                                textAnchor="middle"
                                fontSize="18"
                                fontWeight="bold"
                                fill={dir === 'N' ? '#e74c3c' : 'rgba(255,255,255,0.7)'}
                                transform={`rotate(${i * 90} ${COMPASS_SIZE / 2} ${COMPASS_SIZE / 2})`}
                            >
                                {dir}
                            </SvgText>
                        ))}
                    </Svg>
                </Animated.View>

                {/* Qibla Indicator */}
                <Animated.View
                    style={[
                        styles.qiblaIndicator,
                        {
                            transform: [{
                                rotate: qiblaArrowRotation.interpolate({
                                    inputRange: [-360, 360],
                                    outputRange: ['-360deg', '360deg']
                                })
                            }],
                        },
                    ]}
                >
                    <Svg height={COMPASS_SIZE * 0.55} width={40} viewBox="0 0 40 110">
                        <Path
                            d="M20,0 L0,80 L20,70 L40,80 Z"
                            fill="#2ecc71"
                        />
                        <Circle cx="20" cy="95" r="15" fill="#2ecc71" />
                        <SvgText x="20" y="101" textAnchor="middle" fontSize="18" fill="#fff">🕋</SvgText>
                    </Svg>
                </Animated.View>

                <View style={styles.compassCenter}>
                    <Text style={styles.degreeText}>{Math.round(qiblaDirection)}°</Text>
                    <Text style={styles.degreeSubText}>Kıble</Text>
                </View>
            </View>

            <View style={styles.bottomPanel}>
                <View style={styles.statusContainer}>
                    <Text style={styles.statusTitle}>{getStatusMessage()}</Text>
                    <Text style={styles.statusSubtitle}>
                        Cihaz Yönünden {angleDifference.toFixed(1)}° Farkla
                    </Text>
                </View>
                <View style={styles.infoContainer}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Yönünüz</Text>
                        <Text style={styles.infoValue}>{Math.round(deviceHeading)}°</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Mesafe</Text>
                        <Text style={styles.infoValue}>{Math.round(distanceToKaaba)} km</Text>
                    </View>
                </View>
            </View>

            {__DEV__ && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugTitle}>Debug Bilgileri</Text>
                    <Text style={styles.debugInfo}>
                        Konum: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                    </Text>
                    <Text style={styles.debugInfo}>
                        Cihaz Yönü: {deviceHeading.toFixed(1)}° | Kıble: {qiblaDirection.toFixed(1)}°
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D172A',
        alignItems: 'center',
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        width: '100%',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    accuracyIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    accuracyText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '600',
    },
    compassContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    qiblaIndicator: {
        position: 'absolute',
        alignItems: 'center',
    },
    compassCenter: {
        position: 'absolute',
        width: COMPASS_SIZE * 0.4,
        height: COMPASS_SIZE * 0.4,
        borderRadius: (COMPASS_SIZE * 0.4) / 2,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    degreeText: {
        fontSize: 36,
        color: '#FFF',
        fontWeight: 'bold',
    },
    degreeSubText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    bottomPanel: {
        width: '90%',
        backgroundColor: 'rgba(29, 43, 74, 0.8)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    statusSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 20,
    },
    infoBox: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    debugContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderRadius: 8,
    },
    debugTitle: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    debugInfo: {
        color: '#ffffff',
        fontSize: 10,
        fontFamily: 'monospace',
    },
});
