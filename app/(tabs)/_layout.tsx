import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
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
                    title: 'Namaz Vakitleri',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="qibla"
                options={{
                    title: 'Kıble',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="compass" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Ayarlar',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
} 