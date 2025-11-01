import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';

export interface SensorData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  magnetometer: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
}

export interface AccidentDetectionResult {
  isAccident: boolean;
  confidence: number;
  type: 'collision' | 'rollover' | 'sudden_stop' | 'none';
  severity: 'low' | 'medium' | 'high';
}

class SensorService {
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private magnetometerSubscription: any = null;
  
  private currentData: SensorData = {
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    magnetometer: { x: 0, y: 0, z: 0 },
    timestamp: Date.now()
  };

  private listeners: ((data: SensorData) => void)[] = [];
  private accidentListeners: ((result: AccidentDetectionResult) => void)[] = [];
  
  // Accident detection thresholds
  private readonly THRESHOLDS = {
    COLLISION_ACCELERATION: 15, // m/s²
    ROLLOVER_GYROSCOPE: 3, // rad/s
    SUDDEN_STOP_ACCELERATION: 12 // m/s²
  };

  // Start monitoring sensors
  async startMonitoring(): Promise<boolean> {
    try {
      // Set update intervals
      Accelerometer.setUpdateInterval(100); // 10Hz
      Gyroscope.setUpdateInterval(100);
      Magnetometer.setUpdateInterval(100);

      // Subscribe to accelerometer
      this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        this.currentData.accelerometer = { x, y, z };
        this.currentData.timestamp = Date.now();
        this.notifyListeners();
        this.checkForAccident();
      });

      // Subscribe to gyroscope
      this.gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
        this.currentData.gyroscope = { x, y, z };
        this.notifyListeners();
      });

      // Subscribe to magnetometer
      this.magnetometerSubscription = Magnetometer.addListener(({ x, y, z }) => {
        this.currentData.magnetometer = { x, y, z };
        this.notifyListeners();
      });

      return true;
    } catch (error) {
      console.error('Failed to start sensor monitoring:', error);
      return false;
    }
  }

  // Stop monitoring sensors
  stopMonitoring(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }
    
    if (this.magnetometerSubscription) {
      this.magnetometerSubscription.remove();
      this.magnetometerSubscription = null;
    }
  }

  // Get current sensor data
  getCurrentData(): SensorData {
    return { ...this.currentData };
  }

  // Add data listener
  addListener(callback: (data: SensorData) => void): void {
    this.listeners.push(callback);
  }

  // Remove data listener
  removeListener(callback: (data: SensorData) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Add accident detection listener
  addAccidentListener(callback: (result: AccidentDetectionResult) => void): void {
    this.accidentListeners.push(callback);
  }

  // Remove accident detection listener
  removeAccidentListener(callback: (result: AccidentDetectionResult) => void): void {
    this.accidentListeners = this.accidentListeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentData));
  }

  // Notify accident listeners
  private notifyAccidentListeners(result: AccidentDetectionResult): void {
    this.accidentListeners.forEach(listener => listener(result));
  }

  // Check for accident based on sensor data
  private checkForAccident(): void {
    const { accelerometer, gyroscope } = this.currentData;
    
    // Calculate total acceleration magnitude
    const totalAcceleration = Math.sqrt(
      accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2
    );
    
    // Calculate total gyroscope magnitude
    const totalGyroscope = Math.sqrt(
      gyroscope.x ** 2 + gyroscope.y ** 2 + gyroscope.z ** 2
    );

    let result: AccidentDetectionResult = {
      isAccident: false,
      confidence: 0,
      type: 'none',
      severity: 'low'
    };

    // Check for collision (high acceleration)
    if (totalAcceleration > this.THRESHOLDS.COLLISION_ACCELERATION) {
      result = {
        isAccident: true,
        confidence: Math.min(totalAcceleration / this.THRESHOLDS.COLLISION_ACCELERATION, 1),
        type: 'collision',
        severity: totalAcceleration > 20 ? 'high' : totalAcceleration > 17 ? 'medium' : 'low'
      };
    }
    
    // Check for rollover (high rotation)
    else if (totalGyroscope > this.THRESHOLDS.ROLLOVER_GYROSCOPE) {
      result = {
        isAccident: true,
        confidence: Math.min(totalGyroscope / this.THRESHOLDS.ROLLOVER_GYROSCOPE, 1),
        type: 'rollover',
        severity: totalGyroscope > 5 ? 'high' : totalGyroscope > 4 ? 'medium' : 'low'
      };
    }
    
    // Check for sudden stop (negative acceleration)
    else if (accelerometer.z < -this.THRESHOLDS.SUDDEN_STOP_ACCELERATION) {
      result = {
        isAccident: true,
        confidence: Math.min(Math.abs(accelerometer.z) / this.THRESHOLDS.SUDDEN_STOP_ACCELERATION, 1),
        type: 'sudden_stop',
        severity: Math.abs(accelerometer.z) > 15 ? 'high' : Math.abs(accelerometer.z) > 13 ? 'medium' : 'low'
      };
    }

    // Only notify if accident detected
    if (result.isAccident) {
      this.notifyAccidentListeners(result);
    }
  }

  // Check sensor availability
  async checkSensorAvailability(): Promise<{
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
  }> {
    try {
      const [accelAvailable, gyroAvailable, magAvailable] = await Promise.all([
        Accelerometer.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
        Magnetometer.isAvailableAsync()
      ]);

      return {
        accelerometer: accelAvailable,
        gyroscope: gyroAvailable,
        magnetometer: magAvailable
      };
    } catch (error) {
      console.error('Error checking sensor availability:', error);
      return {
        accelerometer: false,
        gyroscope: false,
        magnetometer: false
      };
    }
  }

  // Simulate accident for testing
  simulateAccident(type: 'collision' | 'rollover' | 'sudden_stop' = 'collision'): void {
    let mockResult: AccidentDetectionResult;
    
    switch (type) {
      case 'collision':
        mockResult = {
          isAccident: true,
          confidence: 0.9,
          type: 'collision',
          severity: 'high'
        };
        break;
      case 'rollover':
        mockResult = {
          isAccident: true,
          confidence: 0.85,
          type: 'rollover',
          severity: 'high'
        };
        break;
      case 'sudden_stop':
        mockResult = {
          isAccident: true,
          confidence: 0.8,
          type: 'sudden_stop',
          severity: 'medium'
        };
        break;
    }
    
    this.notifyAccidentListeners(mockResult);
  }
}

export const sensorService = new SensorService();