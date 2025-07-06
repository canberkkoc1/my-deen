import { CALCULATION_METHODS } from '@/constants';
import { useLocation } from '@/context/LocationContext';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
import { useTheme } from '@/context/ThemeContext';
import { SettingSection } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const { requestLocationPermission } = useLocation();
    const { refreshPrayerTimes } = usePrayerTimes();
    const { isDark, setThemeMode, colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);
    const [settings, setSettings] = useState<SettingSection[]>([
        {
            title: t('prayerTimes.title'),
            icon: 'clock-outline',
            items: [
                {
                    title: t('prayerTimes.calculationMethod'),
                    description: t('prayerTimes.calculationMethodDesc'),
                    type: 'select',
                    value: 13,
                    options: CALCULATION_METHODS,
                },
                {
                    title: t('prayerTimes.use24Hour'),
                    description: t('prayerTimes.use24HourDesc'),
                    type: 'switch',
                    value: true,
                },
            ],
        },
        {
            title: t('notifications.title'),
            icon: 'bell-outline',
            items: [
                {
                    title: t('notifications.prayerTimeNotifications'),
                    description: t('notifications.prayerTimeNotificationsDesc'),
                    type: 'switch',
                    value: false,
                },
                {
                    title: t('notifications.notificationSound'),
                    description: t('notifications.notificationSoundDesc'),
                    type: 'switch',
                    value: true,
                },
            ],
        },
        {
            title: t('appearance.title'),
            icon: 'palette-outline',
            items: [
                {
                    title: t('appearance.darkTheme'),
                    description: t('appearance.darkThemeDesc'),
                    type: 'switch',
                    value: isDark,
                },
            ],
        },
    ]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedMethodId = await AsyncStorage.getItem('calculationMethod');
                if (storedMethodId !== null) {
                    setSettings(currentSettings => {
                        const newSettings = [...currentSettings];
                        newSettings[0].items[0].value = JSON.parse(storedMethodId);
                        return newSettings;
                    });
                }
            } catch (error) {
                console.error('Ayarlar yüklenemedi:', error);
            }
        };
        loadSettings();
    }, []);

    // Update dark theme switch when theme changes
    useEffect(() => {
        setSettings(currentSettings => {
            const newSettings = [...currentSettings];
            newSettings[2].items[0].value = isDark;
            return newSettings;
        });
    }, [isDark]);

    const handleSettingChange = async (sectionIndex: number, itemIndex: number, newValue: boolean | number) => {
        const newSettings = [...settings];
        newSettings[sectionIndex].items[itemIndex].value = newValue;
        setSettings(newSettings);

        // Hesaplama metodunu kaydet
        if (sectionIndex === 0 && itemIndex === 0) {
            try {
                await AsyncStorage.setItem('calculationMethod', JSON.stringify(newValue));
                // Namaz vakitlerini yenile
                await refreshPrayerTimes();
            } catch (error) {
                console.error('Hesaplama metodu kaydedilemedi:', error);
            }
            setModalVisible(false);
        }

        // Dark theme değişikliği
        if (sectionIndex === 2 && itemIndex === 0) {
            setThemeMode(newValue ? 'dark' : 'light');
        }
    };

    // Dil değiştirme fonksiyonu
    const handleLanguageChange = async (languageCode: string) => {
        await AsyncStorage.setItem('userLanguage', languageCode);
        await i18n.changeLanguage(languageCode);
        setLanguageModalVisible(false);
    };

    const renderCalculationMethodModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.sectionBackground }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Hesaplama Metodu Seçin</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.methodList}>
                        {CALCULATION_METHODS.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.methodItem,
                                    { backgroundColor: colors.surface },
                                    settings[0].items[0].value === method.id && { borderColor: colors.primary },
                                ]}
                                onPress={() => handleSettingChange(0, 0, method.id)}
                            >
                                <View style={[styles.methodIcon, { backgroundColor: colors.background }]}>
                                    <MaterialCommunityIcons
                                        name={method.icon}
                                        size={28}
                                        color={settings[0].items[0].value === method.id ? colors.primary : colors.textMuted}
                                    />
                                </View>
                                <View style={styles.methodInfo}>
                                    <Text style={[styles.methodName, { color: colors.textPrimary }]}>{method.name}</Text>
                                    <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                                </View>
                                {settings[0].items[0].value === method.id && (
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={24}
                                        color={colors.primary}
                                        style={styles.checkIcon}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderLanguageModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={languageModalVisible}
            onRequestClose={() => setLanguageModalVisible(false)}
        >
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.sectionBackground }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('language.select')}</Text>
                        <TouchableOpacity
                            onPress={() => setLanguageModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.methodList}>
                        <TouchableOpacity
                            style={[
                                styles.methodItem,
                                { backgroundColor: colors.surface },
                                i18n.language === 'tr' && { borderColor: colors.primary },
                            ]}
                            onPress={() => handleLanguageChange('tr')}
                        >
                            <View style={[styles.methodIcon, { backgroundColor: colors.background }]}>
                                <MaterialCommunityIcons
                                    name="translate"
                                    size={28}
                                    color={i18n.language === 'tr' ? colors.primary : colors.textMuted}
                                />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={[styles.methodName, { color: colors.textPrimary }]}>Türkçe</Text>
                            </View>
                            {i18n.language === 'tr' && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={24}
                                    color={colors.primary}
                                    style={styles.checkIcon}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodItem,
                                { backgroundColor: colors.surface },
                                i18n.language === 'en' && { borderColor: colors.primary },
                            ]}
                            onPress={() => handleLanguageChange('en')}
                        >
                            <View style={[styles.methodIcon, { backgroundColor: colors.background }]}>
                                <MaterialCommunityIcons
                                    name="translate"
                                    size={28}
                                    color={i18n.language === 'en' ? colors.primary : colors.textMuted}
                                />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={[styles.methodName, { color: colors.textPrimary }]}>English</Text>
                            </View>
                            {i18n.language === 'en' && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={24}
                                    color={colors.primary}
                                    style={styles.checkIcon}
                                />
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.sectionBackground }]} edges={['top']}>
            <Stack.Screen
                options={{
                    title: t('common.settings'),
                    headerStyle: {
                        backgroundColor: colors.sectionBackground,
                    },
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                }}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {settings.map((section, sectionIndex) => (
                    <View key={section.title} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name={section.icon} size={26} color={colors.sectionHeader} />
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
                        </View>

                        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                            {section.items.map((item, itemIndex) => {
                                const isLastItem = itemIndex === section.items.length - 1;
                                return (
                                    <View
                                        key={item.title}
                                        style={[
                                            styles.settingItem,
                                            { borderBottomColor: colors.border },
                                            isLastItem && { borderBottomWidth: 0 },
                                        ]}
                                    >
                                        <View style={styles.settingInfo}>
                                            <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>{item.title}</Text>
                                            {item.description && (
                                                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>{item.description}</Text>
                                            )}
                                        </View>

                                        {item.type === 'switch' ? (
                                            <Switch
                                                value={item.value as boolean}
                                                onValueChange={(newValue) => handleSettingChange(sectionIndex, itemIndex, newValue)}
                                                trackColor={{ false: colors.separator, true: colors.primary }}
                                                thumbColor={item.value ? colors.accent : colors.textMuted}
                                                style={styles.switch}
                                            />
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.methodSelector}
                                                onPress={() => setModalVisible(true)}
                                            >
                                                <Text style={[styles.selectedMethod, { color: colors.primary }]}>
                                                    {CALCULATION_METHODS.find(m => m.id === item.value)?.name}
                                                </Text>
                                                <MaterialCommunityIcons
                                                    name="chevron-right"
                                                    size={24}
                                                    color={colors.textMuted}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Dil seçimi bölümü */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="translate" size={26} color={colors.sectionHeader} />
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('language.title')}</Text>
                    </View>

                    <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.settingItem, { borderBottomWidth: 0 }]}
                            onPress={() => setLanguageModalVisible(true)}
                        >
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>{t('language.select')}</Text>
                                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>{t('language.selectDesc')}</Text>
                            </View>
                            <View style={styles.methodSelector}>
                                <Text style={[styles.selectedMethod, { color: colors.primary }]}>
                                    {i18n.language === 'tr' ? 'Türkçe' : 'English'}
                                </Text>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color={colors.textMuted}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.version, { color: colors.textMuted }]}>{t('common.version')} 1.0.0</Text>
                </View>
            </ScrollView>

            {renderCalculationMethodModal()}
            {renderLanguageModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    sectionContent: {
        borderRadius: 16,
        marginHorizontal: 24,
        paddingHorizontal: 8,
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
    },
    switch: {
        transform: [{ scale: 0.9 }],
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingBottom: 48,
    },
    version: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    methodList: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    methodDescription: {
        fontSize: 14,
    },
    checkIcon: {
        marginLeft: 12,
    },
    methodSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedMethod: {
        fontSize: 14,
        marginRight: 4,
        fontWeight: '500',
    },
}); 