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
      // Multiple attempts with different accuracy levels
      let position;
      
      try {
        // First try with high accuracy
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 5000,
        });
      } catch (highAccuracyError) {
        try {
          // Fallback to balanced accuracy
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            maximumAge: 10000,
          });
        } catch (balancedError) {
          // Final fallback to low accuracy
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            maximumAge: 30000,
          });
        }
      }
      
      let address = 'Address lookup in progress...';
      
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp,
        address: address,
      };
      
      setLocation(locationData);
      setError(null);
      
      // Try to get address in background
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const fullAddress = `${addr.name || ''} ${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          
          setLocation(prev => prev ? { ...prev, address: fullAddress } : null);
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed, using coordinates only');
        setLocation(prev => prev ? { ...prev, address: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}` } : null);
      }
      
      // Log location update
      if (Date.now() - lastLocationLog > 30000) {
        setLastLocationLog(Date.now());
        activityService.logActivity('location', `Location Updated: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`, {
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      }
    } catch (error: any) {
      console.error('Location error:', error);
      setError('GPS unavailable - using last known location');
      
      // Set a default location if all fails
      setLocation({
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp: Date.now(),
        address: 'Location services unavailable'
      });
    }
  };

  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return;
    }

    setIsTracking(true);
    setError(null);
    
    // Get initial location immediately
    getCurrentLocation();
    
    // Log activity
    activityService.logActivity('gps_start', 'GPS Tracking Started - Real-time location monitoring activated', {
      accuracy: 'Balanced',
      interval: '5 seconds'
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
      }, 5000); // Update every 5 seconds for better accuracy
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