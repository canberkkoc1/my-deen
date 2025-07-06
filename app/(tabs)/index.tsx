import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrayerTimesScreen() {
    const { t } = useTranslation();
    const { prayerTimes, loading, error, refreshPrayerTimes, getNextPrayer, getTimeUntilNext } = usePrayerTimes();
    const { colors } = useTheme();

    const nextPrayer = getNextPrayer();
    const timeUntilNext = getTimeUntilNext();

    const prayerList = prayerTimes ? [
        { name: 'İmsak', time: prayerTimes.fajr, icon: 'weather-night' },
        { name: 'Güneş', time: prayerTimes.sunrise, icon: 'weather-sunset-up' },
        { name: 'Öğle', time: prayerTimes.dhuhr, icon: 'weather-sunny' },
        { name: 'İkindi', time: prayerTimes.asr, icon: 'weather-sunset' },
        { name: 'Akşam', time: prayerTimes.maghrib, icon: 'weather-sunset-down' },
        { name: 'Yatsı', time: prayerTimes.isha, icon: 'weather-night' },
    ] : [];

    const getCurrentPrayerStatus = (prayerName: string) => {
        if (!nextPrayer) return 'passed';

        const currentTime = new Date();
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const prayerTime = prayerList.find(p => p.name === prayerName)?.time;
        if (!prayerTime) return 'passed';

        const [hours, minutes] = prayerTime.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;

        if (nextPrayer.name === prayerName && !nextPrayer.isNextDay) {
            return 'next';
        } else if (prayerMinutes > currentMinutes) {
            return 'upcoming';
        } else {
            return 'passed';
        }
    };

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'next':
                return {
                    cardBg: colors.primary + '15', // Semi-transparent primary
                    border: colors.primary,
                    icon: colors.primary,
                    text: colors.primary,
                    time: colors.primary,
                };
            case 'passed':
                return {
                    cardBg: colors.surface,
                    border: colors.border,
                    icon: colors.textMuted,
                    text: colors.textMuted,
                    time: colors.textMuted,
                };
            default: // upcoming
                return {
                    cardBg: colors.surface,
                    border: colors.border,
                    icon: colors.textSecondary,
                    text: colors.textSecondary,
                    time: colors.textPrimary,
                };
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: t('common.prayerTimes'),
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshPrayerTimes}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {error && (
                    <View style={[styles.errorContainer, {
                        backgroundColor: colors.error + '15',
                        borderColor: colors.error + '40'
                    }]}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    </View>
                )}

                {loading && !prayerTimes && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Namaz vakitleri yükleniyor...</Text>
                    </View>
                )}

                {prayerTimes && (
                    <>
                        {/* Date and Next Prayer Info */}
                        <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.dateContainer}>
                                <Text style={[styles.gregorianDate, { color: colors.textPrimary }]}>{prayerTimes.date}</Text>
                                <Text style={[styles.hijriDate, { color: colors.textSecondary }]}>{prayerTimes.hijriDate}</Text>
                            </View>

                            {nextPrayer && (
                                <View style={[styles.nextPrayerContainer, { borderTopColor: colors.border }]}>
                                    <Text style={[styles.nextPrayerLabel, { color: colors.textMuted }]}>Sonraki Namaz</Text>
                                    <Text style={[styles.nextPrayerNameHeader, { color: colors.nextPrayer }]}>{nextPrayer.name}</Text>
                                    <Text style={[styles.nextPrayerTime, { color: colors.textPrimary }]}>{nextPrayer.time}</Text>
                                    {timeUntilNext && (
                                        <Text style={[styles.timeRemaining, { color: colors.textSecondary }]}>{timeUntilNext} kaldı</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Prayer Times List */}
                        <View style={styles.prayerTimesContainer}>
                            {prayerList.map((prayer, index) => {
                                const status = getCurrentPrayerStatus(prayer.name);
                                const statusColors = getStatusColors(status);

                                return (
                                    <View
                                        key={prayer.name}
                                        style={[
                                            styles.prayerCard,
                                            {
                                                backgroundColor: statusColors.cardBg,
                                                borderColor: statusColors.border,
                                                borderWidth: status === 'next' ? 2 : 1,
                                            }
                                        ]}
                                    >
                                        <View style={styles.prayerInfo}>
                                            <MaterialCommunityIcons
                                                name={prayer.icon as any}
                                                size={24}
                                                color={statusColors.icon}
                                            />
                                            <Text style={[
                                                styles.prayerName,
                                                { color: statusColors.text }
                                            ]}>
                                                {prayer.name}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            styles.prayerTime,
                                            { color: statusColors.time },
                                            status === 'next' && { fontSize: 18, fontWeight: 'bold' }
                                        ]}>
                                            {prayer.time}
                                        </Text>
                                        {status === 'next' && (
                                            <View style={styles.nextIndicator}>
                                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Method Info */}
                        <View style={[styles.methodContainer, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.methodText, { color: colors.textTertiary }]}>
                                Hesaplama Yöntemi: {prayerTimes.method.name}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
    },
    errorText: {
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    headerCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    dateContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    gregorianDate: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    hijriDate: {
        fontSize: 14,
    },
    nextPrayerContainer: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    nextPrayerLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    nextPrayerNameHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    nextPrayerTime: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    timeRemaining: {
        fontSize: 14,
    },
    prayerTimesContainer: {
        marginBottom: 20,
    },
    prayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    prayerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    prayerName: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    prayerTime: {
        fontSize: 16,
        fontWeight: '600',
    },
    nextIndicator: {
        marginLeft: 8,
    },
    methodContainer: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    methodText: {
        fontSize: 12,
        textAlign: 'center',
    },
}); 