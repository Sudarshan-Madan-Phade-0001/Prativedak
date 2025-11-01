import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { activityService } from '@/services/activityService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocationLog, setLastLocationLog] = useState<number>(0);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }
      return true;
    } catch (error: any) {
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('Location services are disabled. Please enable GPS.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000,
      });
      
      let address = 'Address not available';
      
      // Try to get reverse geocoding (address from coordinates)
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = `${addr.name || ''} ${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }
      
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp,
        address: address,
      };
      
      setLocation(locationData);
      setError(null);
      
      // Log location update occasionally (every 30 seconds)
      if (Date.now() - lastLocationLog > 30000) {
        setLastLocationLog(Date.now());
        activityService.logActivity('location', `Location Updated: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} - ${address}`, {
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          address: address
        });
      }
    } catch (error: any) {
      console.error('Location error:', error);
      setError(error.message || 'Failed to get location. Please check GPS settings.');
    }
  };

  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return;
    }

    setIsTracking(true);
    setError(null);
    
    // Get initial location
    await getCurrentLocation();
    
    // Log activity
    activityService.logActivity('gps_start', 'GPS Tracking Started - Real-time location monitoring activated', {
      accuracy: 'Balanced',
      interval: '10 seconds'
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    
    // Log activity
    activityService.logActivity('gps_stop', 'GPS Tracking Stopped - Location monitoring deactivated', {});
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTracking) {
      interval = setInterval(() => {
        getCurrentLocation();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
  };
};