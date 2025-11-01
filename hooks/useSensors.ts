import { useState, useEffect, useCallback } from 'react';
import { sensorService, SensorData } from '@/services/sensorService';

export const useSensors = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [accidentDetected, setAccidentDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccidentDetection = useCallback((result: any) => {
    setAccidentDetected(true);
    console.log('Accident detected:', result);
  }, []);

  const startMonitoring = async () => {
    try {
      const success = await sensorService.startMonitoring();
      if (success) {
        sensorService.addAccidentListener(handleAccidentDetection);
        setIsMonitoring(true);
        setError(null);
        
        // Log activity
        const { activityService } = require('@/services/activityService');
        activityService.logActivity('monitoring_start', 'Accelerometer & Gyroscope monitoring started', {
          sensors: ['accelerometer', 'gyroscope', 'magnetometer'],
          timestamp: new Date().toISOString()
        });
      } else {
        setError('Failed to start sensor monitoring');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const stopMonitoring = () => {
    sensorService.stopMonitoring();
    sensorService.removeAccidentListener(handleAccidentDetection);
    setIsMonitoring(false);
    
    // Log activity
    const { activityService } = require('@/services/activityService');
    activityService.logActivity('monitoring_stop', 'Sensor monitoring stopped', {
      duration: 'Unknown',
      timestamp: new Date().toISOString()
    });
  };

  const clearAccident = () => {
    setAccidentDetected(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isMonitoring) {
        const data = sensorService.getCurrentData();
        if (data) {
          setCurrentData(data);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  return {
    isMonitoring,
    currentData,
    accidentDetected,
    error,
    startMonitoring,
    stopMonitoring,
    clearAccident,
    simulateAccident: (type?: 'collision' | 'rollover' | 'sudden_stop') => sensorService.simulateAccident(type),
  };
};