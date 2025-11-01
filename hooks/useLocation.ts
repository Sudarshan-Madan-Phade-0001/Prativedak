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
      // Check if GPS is actually enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('GPS is disabled. Please enable location services in device settings.');
        return;
      }

      // Multiple attempts with different accuracy levels and timeouts
      let position;
      
      try {
        // First try: Balanced accuracy with timeout (most reliable)
        position = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            maximumAge: 10000,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('GPS timeout')), 10000)
          )
        ]);
      } catch (balancedError) {
        console.log('Balanced accuracy failed, trying low accuracy...');
        try {
          // Fallback: Low accuracy (works even with weak GPS)
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            maximumAge: 60000, // Accept older location
          });
        } catch (lowError) {
          console.log('Low accuracy failed, trying last known location...');
          try {
            // Last resort: Get last known location
            position = await Location.getLastKnownPositionAsync({
              maxAge: 300000, // 5 minutes old is acceptable
            });
          } catch (lastKnownError) {
            throw new Error('All location methods failed');
          }
        }
      }
      
      let address = 'Address lookup in progress...';
      
      // Check if position and coords are valid
      if (!position || !position.coords) {
        throw new Error('Invalid position data received');
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
      
      // Try to get address in background (non-blocking)
      setTimeout(async () => {
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          
          if (reverseGeocode && reverseGeocode.length > 0) {
            const addr = reverseGeocode[0];
            const fullAddress = `${addr.name || ''} ${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
            
            setLocation(prev => prev ? { ...prev, address: fullAddress || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` } : null);
          } else {
            setLocation(prev => prev ? { ...prev, address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` } : null);
          }
        } catch (geocodeError) {
          console.log('Reverse geocoding failed, keeping coordinates');
          setLocation(prev => prev ? { ...prev, address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` } : null);
        }
      }, 1000);
      
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
      setError('GPS signal weak - trying to get approximate location');
      
      // Try to use network-based location as final fallback
      try {
        const networkPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest, // Use network/WiFi location
          maximumAge: 300000, // Accept very old location
        });
        
        if (networkPosition && networkPosition.coords) {
          const locationData = {
            latitude: networkPosition.coords.latitude,
            longitude: networkPosition.coords.longitude,
            accuracy: networkPosition.coords.accuracy || 1000,
            timestamp: networkPosition.timestamp,
            address: `Approximate: ${networkPosition.coords.latitude.toFixed(4)}, ${networkPosition.coords.longitude.toFixed(4)}`,
          };
          
          setLocation(locationData);
          setError('Using approximate location (GPS unstable)');
        } else {
          throw new Error('Network position is null');
        }
      } catch (networkError) {
        // Absolute fallback
        setLocation({
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: Date.now(),
          address: 'Location unavailable - GPS disabled'
        });
        setError('Location unavailable - please enable GPS and restart app');
      }
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