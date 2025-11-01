import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { activityService } from '@/services/activityService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocationLog, setLastLocationLog] = useState<number>(0);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  const getCurrentLocation = async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });
      
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp,
      };
      
      setLocation(locationData);
      setError(null);
      
      // Log location update occasionally (every 30 seconds)
      if (Date.now() - lastLocationLog > 30000) {
        setLastLocationLog(Date.now());
        activityService.logActivity('location', `Location Updated: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`, {
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get location');
    }
  };

  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      return;
    }

    setIsTracking(true);
    getCurrentLocation();
    
    // Log activity
    activityService.logActivity('gps_start', 'GPS Tracking Started - Real-time location monitoring activated', {
      accuracy: 'High',
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