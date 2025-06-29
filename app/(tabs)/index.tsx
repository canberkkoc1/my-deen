import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrayerTimesScreen() {
    const { t } = useTranslation();
    const { prayerTimes, loading, error, refreshPrayerTimes, getNextPrayer, getTimeUntilNext } = usePrayerTimes();

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

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: t('common.prayerTimes'),
                    headerStyle: {
                        backgroundColor: '#F7F9FC',
                    },
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshPrayerTimes}
                        colors={['#4A90E2']}
                        tintColor="#4A90E2"
                    />
                }
            >
                {error && (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color="#e74c3c" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {loading && !prayerTimes && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={styles.loadingText}>Namaz vakitleri yükleniyor...</Text>
                    </View>
                )}

                {prayerTimes && (
                    <>
                        {/* Date and Next Prayer Info */}
                        <View style={styles.headerCard}>
                            <View style={styles.dateContainer}>
                                <Text style={styles.gregorianDate}>{prayerTimes.date}</Text>
                                <Text style={styles.hijriDate}>{prayerTimes.hijriDate}</Text>
                            </View>

                            {nextPrayer && (
                                <View style={styles.nextPrayerContainer}>
                                    <Text style={styles.nextPrayerLabel}>Sonraki Namaz</Text>
                                    <Text style={styles.nextPrayerNameHeader}>{nextPrayer.name}</Text>
                                    <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
                                    {timeUntilNext && (
                                        <Text style={styles.timeRemaining}>{timeUntilNext} kaldı</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Prayer Times List */}
                        <View style={styles.prayerTimesContainer}>
                            {prayerList.map((prayer, index) => {
                                const status = getCurrentPrayerStatus(prayer.name);
                                return (
                                    <View
                                        key={prayer.name}
                                        style={[
                                            styles.prayerCard,
                                            status === 'next' && styles.nextPrayerCard,
                                            status === 'passed' && styles.passedPrayerCard
                                        ]}
                                    >
                                        <View style={styles.prayerInfo}>
                                            <MaterialCommunityIcons
                                                name={prayer.icon as any}
                                                size={24}
                                                color={status === 'next' ? '#4A90E2' : status === 'passed' ? '#A0AEC0' : '#2D3748'}
                                            />
                                            <Text style={[
                                                styles.prayerName,
                                                status === 'next' && styles.nextPrayerName,
                                                status === 'passed' && styles.passedPrayerName
                                            ]}>
                                                {prayer.name}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            styles.prayerTime,
                                            status === 'next' && styles.nextPrayerTimeText,
                                            status === 'passed' && styles.passedPrayerTime
                                        ]}>
                                            {prayer.time}
                                        </Text>
                                        {status === 'next' && (
                                            <View style={styles.nextIndicator}>
                                                <MaterialCommunityIcons name="chevron-right" size={20} color="#4A90E2" />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Method Info */}
                        <View style={styles.methodContainer}>
                            <Text style={styles.methodText}>
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
        backgroundColor: '#F7F9FC',
    },
    scrollContent: {
        padding: 20,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FED7D7',
    },
    errorText: {
        marginLeft: 8,
        color: '#e74c3c',
        fontSize: 14,
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        color: '#718096',
        fontSize: 16,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
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
        color: '#2D3748',
        marginBottom: 4,
    },
    hijriDate: {
        fontSize: 14,
        color: '#718096',
    },
    nextPrayerContainer: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
    },
    nextPrayerLabel: {
        fontSize: 12,
        color: '#A0AEC0',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    nextPrayerNameHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 4,
    },
    nextPrayerTime: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    timeRemaining: {
        fontSize: 14,
        color: '#718096',
    },
    prayerTimesContainer: {
        marginBottom: 20,
    },
    prayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    nextPrayerCard: {
        borderWidth: 2,
        borderColor: '#4A90E2',
        backgroundColor: '#F7FAFF',
    },
    passedPrayerCard: {
        opacity: 0.6,
    },
    prayerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    prayerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 12,
    },
    nextPrayerName: {
        color: '#4A90E2',
    },
    passedPrayerName: {
        color: '#A0AEC0',
    },
    prayerTime: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A5568',
    },
    nextPrayerTimeText: {
        color: '#4A90E2',
        fontSize: 18,
    },
    passedPrayerTime: {
        color: '#A0AEC0',
    },
    nextIndicator: {
        marginLeft: 8,
    },
    methodContainer: {
        backgroundColor: '#FFFFFF',
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
        color: '#718096',
        textAlign: 'center',
    },
}); 