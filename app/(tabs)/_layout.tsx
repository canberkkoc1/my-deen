import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#2196F3',
                tabBarInactiveTintColor: '#95a5a6',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e1e1e1',
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('navigation.prayerTimes'),
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="qibla"
                options={{
                    title: t('navigation.qibla'),
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="compass" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: t('navigation.settings'),
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
} 