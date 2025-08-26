import { MECCA_COORDINATES } from '@/constants';
import { debug } from '@/lib/debug';
import { LocationContextType } from '@/types';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';





const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [latitude, setLatitude] = useState<number>(MECCA_COORDINATES.latitude);
    const [longitude, setLongitude] = useState<number>(MECCA_COORDINATES.longitude);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUsingDefaultLocation, setIsUsingDefaultLocation] = useState(true);

    const showLocationPermissionAlert = () => {
        Alert.alert(
            'Konum İzni',
            'Konum izni vermediğiniz için namaz vakitleri Mekke\'ye göre ayarlanmıştır. Konumunuza göre namaz vakitlerini görmek için ayarlardan konum iznini etkinleştirebilirsiniz.',
            [
                {
                    text: 'Tamam',
                    onPress: () => debug.log('Konum izni alert kapatıldı')
                }
            ]
        );
    };

    const openSettings = async () => {
        if (Platform.OS === 'ios') {
            await Linking.openURL('app-settings:');
        } else {
            await Linking.openSettings();
        }
    };

    const requestLocationPermission = async () => {
        try {
            setLoading(true);
            setError(null);

            // Önce mevcut izin durumunu kontrol et
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

            if (existingStatus === 'denied') {
                // Eğer izin daha önce reddedildiyse, kullanıcıyı ayarlara yönlendir
                Alert.alert(
                    'Konum İzni Gerekli',
                    'Namaz vakitlerini konumunuza göre gösterebilmek için konum iznine ihtiyacımız var. Lütfen sistem ayarlarından konum iznini etkinleştirin.',
                    [
                        {
                            text: 'Ayarlara Git',
                            onPress: openSettings
                        },
                        {
                            text: 'Vazgeç',
                            style: 'cancel'
                        }
                    ]
                );
                return;
            }

            // İzin iste
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setError('Konum izni reddedildi');
                setIsUsingDefaultLocation(true);
                debug.log('Konum izni reddedildi, Mekke koordinatları kullanılıyor');
                showLocationPermissionAlert();
                return;
            }

            // İzin verildiyse konumu al
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setLatitude(location.coords.latitude);
            setLongitude(location.coords.longitude);
            setIsUsingDefaultLocation(false);
            debug.log('Konum alındı:', { lat: location.coords.latitude, lng: location.coords.longitude });

        } catch (err) {
            setError('Konum alınırken bir hata oluştu');
            setIsUsingDefaultLocation(true);
            debug.error('Konum alınırken hata:', err);
            showLocationPermissionAlert();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Delay location permission request to not block app startup
        const timer = setTimeout(() => {
            requestLocationPermission();
        }, 1000); // Start location request after 1 second

        return () => clearTimeout(timer);
    }, []);

    const value = {
        latitude,
        longitude,
        loading,
        error,
        isUsingDefaultLocation,
        requestLocationPermission,
    };

    console.log(value)
    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
} 