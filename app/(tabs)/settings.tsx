import { CALCULATION_METHODS } from '@/constants';
import { useLocation } from '@/context/LocationContext';
import { usePrayerTimes } from '@/context/PrayerTimesContext';
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
                    value: false,
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
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Hesaplama Metodu Seçin</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#2c3e50" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.methodList}>
                        {CALCULATION_METHODS.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.methodItem,
                                    settings[0].items[0].value === method.id && styles.selectedMethodItem,
                                ]}
                                onPress={() => handleSettingChange(0, 0, method.id)}
                            >
                                <View style={styles.methodIcon}>
                                    <MaterialCommunityIcons
                                        name={method.icon}
                                        size={28}
                                        color={settings[0].items[0].value === method.id ? '#2196F3' : '#95a5a6'}
                                    />
                                </View>
                                <View style={styles.methodInfo}>
                                    <Text style={styles.methodName}>{method.name}</Text>
                                    <Text style={styles.methodDescription}>{method.description}</Text>
                                </View>
                                {settings[0].items[0].value === method.id && (
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={24}
                                        color="#2196F3"
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
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('language.select')}</Text>
                        <TouchableOpacity
                            onPress={() => setLanguageModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#2c3e50" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.methodList}>
                        <TouchableOpacity
                            style={[
                                styles.methodItem,
                                i18n.language === 'tr' && styles.selectedMethodItem,
                            ]}
                            onPress={() => handleLanguageChange('tr')}
                        >
                            <View style={styles.methodIcon}>
                                <MaterialCommunityIcons
                                    name="translate"
                                    size={28}
                                    color={i18n.language === 'tr' ? '#2196F3' : '#95a5a6'}
                                />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>Türkçe</Text>
                            </View>
                            {i18n.language === 'tr' && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={24}
                                    color="#2196F3"
                                    style={styles.checkIcon}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodItem,
                                i18n.language === 'en' && styles.selectedMethodItem,
                            ]}
                            onPress={() => handleLanguageChange('en')}
                        >
                            <View style={styles.methodIcon}>
                                <MaterialCommunityIcons
                                    name="translate"
                                    size={28}
                                    color={i18n.language === 'en' ? '#2196F3' : '#95a5a6'}
                                />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>English</Text>
                            </View>
                            {i18n.language === 'en' && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={24}
                                    color="#2196F3"
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen
                options={{
                    title: t('common.settings'),
                    headerStyle: {
                        backgroundColor: '#f8f9fa',
                    },
                    headerShadowVisible: false,
                }}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {settings.map((section, sectionIndex) => (
                    <View key={section.title} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name={section.icon} size={26} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>

                        <View style={styles.sectionContent}>
                            {section.items.map((item, itemIndex) => {
                                const isLastItem = itemIndex === section.items.length - 1;
                                return (
                                    <View
                                        key={item.title}
                                        style={[
                                            styles.settingItem,
                                            isLastItem && { borderBottomWidth: 0 },
                                        ]}
                                    >
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingTitle}>{item.title}</Text>
                                            {item.description && (
                                                <Text style={styles.settingDescription}>{item.description}</Text>
                                            )}
                                        </View>

                                        {item.type === 'switch' ? (
                                            <Switch
                                                value={item.value as boolean}
                                                onValueChange={(newValue) => handleSettingChange(sectionIndex, itemIndex, newValue)}
                                                trackColor={{ false: '#E2E8F0', true: '#63B3ED' }}
                                                thumbColor={item.value ? '#4299E1' : '#f4f3f4'}
                                                style={styles.switch}
                                            />
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.methodSelector}
                                                onPress={() => setModalVisible(true)}
                                            >
                                                <Text style={styles.selectedMethod}>
                                                    {CALCULATION_METHODS.find(m => m.id === item.value)?.name}
                                                </Text>
                                                <MaterialCommunityIcons
                                                    name="chevron-right"
                                                    size={24}
                                                    color="#A0AEC0"
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
                        <MaterialCommunityIcons name="translate" size={26} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>{t('language.title')}</Text>
                    </View>

                    <View style={styles.sectionContent}>
                        <TouchableOpacity
                            style={[styles.settingItem, { borderBottomWidth: 0 }]}
                            onPress={() => setLanguageModalVisible(true)}
                        >
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>{t('language.select')}</Text>
                                <Text style={styles.settingDescription}>{t('language.selectDesc')}</Text>
                            </View>
                            <View style={styles.methodSelector}>
                                <Text style={styles.selectedMethod}>
                                    {i18n.language === 'tr' ? 'Türkçe' : 'English'}
                                </Text>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#A0AEC0"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.version}>{t('common.version')} 1.0.0</Text>
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
        backgroundColor: '#F7F9FC',
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
        color: '#2D3748',
        marginLeft: 12,
    },
    sectionContent: {
        backgroundColor: '#FFFFFF',
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
        borderBottomColor: '#EDF2F7',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4A5568',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: '#718096',
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
        color: '#A0AEC0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F7F9FC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 30, // For safe area
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
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
        backgroundColor: '#FFFFFF',
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
    selectedMethodItem: {
        borderColor: '#4299E1',
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EDF2F7',
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
        color: '#2D3748',
        marginBottom: 4,
    },
    methodDescription: {
        fontSize: 14,
        color: '#718096',
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
        color: '#4299E1',
        marginRight: 4,
        fontWeight: '500',
    },
}); 