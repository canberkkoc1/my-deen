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
    const { colors, isDark } = useTheme();

    const nextPrayer = getNextPrayer();
    const timeUntilNext = getTimeUntilNext();

    const prayerList = prayerTimes ? [
        { key: 'fajr', name: t('prayerTimes.prayers.fajr'), time: prayerTimes.fajr, icon: 'weather-night' },
        { key: 'sunrise', name: t('prayerTimes.prayers.sunrise'), time: prayerTimes.sunrise, icon: 'weather-sunset-up' },
        { key: 'dhuhr', name: t('prayerTimes.prayers.dhuhr'), time: prayerTimes.dhuhr, icon: 'weather-sunny' },
        { key: 'asr', name: t('prayerTimes.prayers.asr'), time: prayerTimes.asr, icon: 'weather-sunset' },
        { key: 'maghrib', name: t('prayerTimes.prayers.maghrib'), time: prayerTimes.maghrib, icon: 'weather-sunset-down' },
        { key: 'isha', name: t('prayerTimes.prayers.isha'), time: prayerTimes.isha, icon: 'weather-night' },
    ] : [];

    const getNextPrayerKey = (prayerName: string) => {
        // Map Turkish prayer names from API to prayer keys
        const turkishToKeyMap: { [key: string]: string } = {
            'İmsak': 'fajr',
            'Güneş': 'sunrise',
            'Öğle': 'dhuhr',
            'İkindi': 'asr',
            'Akşam': 'maghrib',
            'Yatsı': 'isha'
        };

        return turkishToKeyMap[prayerName] || '';
    };

    const getCurrentPrayerStatus = (prayerKey: string) => {
        if (!nextPrayer) return 'passed';

        const currentTime = new Date();
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const prayerTime = prayerList.find(p => p.key === prayerKey)?.time;
        if (!prayerTime) return 'passed';

        const [hours, minutes] = prayerTime.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;

        // Convert nextPrayer.name (Turkish) to key for comparison
        const nextPrayerKey = getNextPrayerKey(nextPrayer.name);
        if (nextPrayerKey === prayerKey && !nextPrayer.isNextDay) {
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
                    cardBg: isDark ? colors.primary + '20' : colors.primary + '15',
                    border: colors.primary,
                    icon: colors.primary,
                    text: colors.primary,
                    time: colors.primary,
                    shadowColor: colors.primary,
                };
            case 'passed':
                return {
                    cardBg: colors.surface,
                    border: colors.border,
                    icon: colors.textMuted,
                    text: colors.textMuted,
                    time: colors.textMuted,
                    shadowColor: colors.shadow,
                };
            default: // upcoming
                return {
                    cardBg: colors.surface,
                    border: colors.border,
                    icon: colors.textSecondary,
                    text: colors.textSecondary,
                    time: colors.textPrimary,
                    shadowColor: colors.shadow,
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
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('prayerTimes.loading')}</Text>
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
                                    <Text style={[styles.nextPrayerLabel, { color: colors.textMuted }]}>{t('prayerTimes.nextPrayer')}</Text>
                                    <Text style={[styles.nextPrayerNameHeader, { color: colors.nextPrayer }]}>{nextPrayer.name}</Text>
                                    <Text style={[styles.nextPrayerTime, { color: colors.textPrimary }]}>{nextPrayer.time}</Text>
                                    {timeUntilNext && (
                                        <Text style={[styles.timeRemaining, { color: colors.textSecondary }]}>{timeUntilNext} {t('prayerTimes.remaining')}</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Prayer Times List */}
                        <View style={styles.prayerTimesContainer}>
                            {prayerList.map((prayer, index) => {
                                const status = getCurrentPrayerStatus(prayer.key);
                                const statusColors = getStatusColors(status);
                                const isNext = status === 'next';

                                if (isNext) {
                                    return (
                                        <View key={prayer.key} style={[styles.nextPrayerWrapper, {
                                            backgroundColor: statusColors.cardBg,
                                            borderColor: statusColors.border,
                                            shadowColor: statusColors.shadowColor,
                                            shadowOffset: { width: 0, height: 8 },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 16,
                                            elevation: 12,
                                        }]}>
                                            <View style={styles.nextPrayerContent}>
                                                <View style={styles.nextPrayerMain}>
                                                    <View style={[styles.nextPrayerIconContainer, {
                                                        backgroundColor: statusColors.icon + '15',
                                                        borderColor: statusColors.icon + '30',
                                                    }]}>
                                                        <MaterialCommunityIcons
                                                            name={prayer.icon as any}
                                                            size={36}
                                                            color={statusColors.icon}
                                                        />
                                                    </View>
                                                    <View style={styles.nextPrayerInfo}>
                                                        <Text style={[styles.nextPrayerLabelCard, { color: statusColors.text }]}>
                                                            {t('prayerTimes.nextPrayer')}
                                                        </Text>
                                                        <Text style={[styles.nextPrayerNameCard, { color: statusColors.text }]}>
                                                            {prayer.name}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.nextPrayerTimeContainer}>
                                                    <Text style={[styles.nextPrayerTimeCard, { color: statusColors.time }]}>
                                                        {prayer.time}
                                                    </Text>
                                                    <View style={[styles.nextPrayerBadge, { backgroundColor: statusColors.icon }]}>
                                                        <MaterialCommunityIcons name="bell-ring" size={18} color="#FFFFFF" />
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                }

                                return (
                                    <View
                                        key={prayer.key}
                                        style={[
                                            styles.prayerCard,
                                            {
                                                backgroundColor: statusColors.cardBg,
                                                borderColor: statusColors.border,
                                                borderWidth: 1,
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
                                            { color: statusColors.time }
                                        ]}>
                                            {prayer.time}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Method Info */}
                        <View style={[styles.methodContainer, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.methodText, { color: colors.textTertiary }]}>
                                {t('prayerTimes.methodInfo', { method: prayerTimes.method.name })}
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
        paddingTop: 0,
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
    // Regular prayer card styles
    prayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
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
    // Next prayer special styles
    nextPrayerWrapper: {
        marginBottom: 18,
        borderRadius: 20,
        borderWidth: 3,
        padding: 20,
    },
    nextPrayerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nextPrayerMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    nextPrayerIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    nextPrayerInfo: {
        flex: 1,
    },
    nextPrayerLabelCard: {
        fontSize: 13,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 6,
        opacity: 0.9,
        letterSpacing: 0.5,
    },
    nextPrayerNameCard: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    nextPrayerTimeContainer: {
        alignItems: 'center',
    },
    nextPrayerTimeCard: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    nextPrayerBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
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