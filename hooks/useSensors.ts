import { useState, useEffect, useCallback } from 'react';
import { sensorService, SensorData } from '@/services/sensorService';

export const useSensors = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [accidentDetected, setAccidentDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccidentDetection = useCallback((data: SensorData) => {
    setAccidentDetected(true);
    setCurrentData(data);
  }, []);

  const startMonitoring = async () => {
    try {
      await sensorService.startMonitoring(handleAccidentDetection);
      setIsMonitoring(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const stopMonitoring = () => {
    sensorService.stopMonitoring();
    setIsMonitoring(false);
  };

  const clearAccident = () => {
    setAccidentDetected(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isMonitoring) {
        const data = sensorService.getCurrentSensorData();
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
    getSensorHistory: () => sensorService.getSensorHistory(),
  };
};