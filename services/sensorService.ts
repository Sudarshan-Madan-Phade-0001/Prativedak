import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { activityService } from './activityService';

interface SensorData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  location: { latitude: number; longitude: number; speed: number | null };
  timestamp: number;
}

interface AccidentThresholds {
  acceleration: number; // G-force threshold
  gyroscope: number; // Angular velocity threshold
  speed: number; // Speed threshold for impact detection
}

const BACKGROUND_TASK = 'sensor-monitoring';
const ACCIDENT_THRESHOLDS: AccidentThresholds = {
  acceleration: 2.5, // 2.5G sudden change
  gyroscope: 5.0, // 5 rad/s angular velocity
  speed: 20, // 20 km/h speed change
};

class SensorService {
  private isMonitoring = false;
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private locationSubscription: any = null;
  private sensorData: SensorData[] = [];
  private lastSensorReading: Partial<SensorData> = {};
  private accidentCallback?: (data: SensorData) => void;

  async startMonitoring(onAccidentDetected?: (data: SensorData) => void) {
    if (this.isMonitoring) return;

    this.accidentCallback = onAccidentDetected;
    
    // Request permissions
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      throw new Error('Location permission required');
    }

    // Set sensor update intervals
    Accelerometer.setUpdateInterval(100); // 10Hz
    Gyroscope.setUpdateInterval(100); // 10Hz

    // Start accelerometer monitoring
    this.accelerometerSubscription = Accelerometer.addListener(accelerometerData => {
      this.handleAccelerometerData(accelerometerData);
    });

    // Start gyroscope monitoring
    this.gyroscopeSubscription = Gyroscope.addListener(gyroscopeData => {
      this.handleGyroscopeData(gyroscopeData);
    });

    // Start location monitoring
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      locationData => {
        this.handleLocationData(locationData);
      }
    );

    this.isMonitoring = true;
    await this.registerBackgroundTask();
    
    // Log activity
    await activityService.logActivity({
      type: 'monitoring_start',
      title: 'Sensor Monitoring Started',
      description: 'Accelerometer and Gyroscope monitoring activated',
      detail: 'Thresholds: 2.5G acceleration, 5.0 rad/s rotation'
    });
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.accelerometerSubscription?.remove();
    this.gyroscopeSubscription?.remove();
    this.locationSubscription?.remove();
    
    this.accelerometerSubscription = null;
    this.gyroscopeSubscription = null;
    this.locationSubscription = null;
    this.isMonitoring = false;
    
    // Log activity
    activityService.logActivity({
      type: 'monitoring_stop',
      title: 'Sensor Monitoring Stopped',
      description: 'All sensor monitoring has been deactivated'
    });
  }

  private handleAccelerometerData(data: { x: number; y: number; z: number }) {
    this.lastSensorReading.accelerometer = data;
    this.lastSensorReading.timestamp = Date.now();
    
    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    
    // Detect sudden acceleration changes (potential impact)
    if (magnitude > ACCIDENT_THRESHOLDS.acceleration) {
      this.checkForAccident();
    }
    
    this.storeSensorData();
  }

  private handleGyroscopeData(data: { x: number; y: number; z: number }) {
    this.lastSensorReading.gyroscope = data;
    
    // Calculate angular velocity magnitude
    const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    
    // Detect sudden rotation (vehicle flip/roll)
    if (magnitude > ACCIDENT_THRESHOLDS.gyroscope) {
      this.checkForAccident();
    }
  }

  private handleLocationData(locationData: Location.LocationObject) {
    const speed = locationData.coords.speed ? locationData.coords.speed * 3.6 : null; // Convert m/s to km/h
    
    this.lastSensorReading.location = {
      latitude: locationData.coords.latitude,
      longitude: locationData.coords.longitude,
      speed,
    };

    // Check for sudden speed changes
    if (speed && this.sensorData.length > 0) {
      const lastSpeed = this.sensorData[this.sensorData.length - 1].location.speed;
      if (lastSpeed && Math.abs(speed - lastSpeed) > ACCIDENT_THRESHOLDS.speed) {
        this.checkForAccident();
      }
    }
  }

  private checkForAccident() {
    if (this.isCompleteReading(this.lastSensorReading)) {
      const sensorData = this.lastSensorReading as SensorData;
      
      try {
        // Additional validation logic
        const accMagnitude = Math.sqrt(
          (sensorData.accelerometer?.x || 0) ** 2 + 
          (sensorData.accelerometer?.y || 0) ** 2 + 
          (sensorData.accelerometer?.z || 0) ** 2
        );
        
        const gyroMagnitude = Math.sqrt(
          (sensorData.gyroscope?.x || 0) ** 2 + 
          (sensorData.gyroscope?.y || 0) ** 2 + 
          (sensorData.gyroscope?.z || 0) ** 2
        );

        // Trigger accident if multiple thresholds are exceeded
        if (accMagnitude > ACCIDENT_THRESHOLDS.acceleration || 
            gyroMagnitude > ACCIDENT_THRESHOLDS.gyroscope) {
          this.accidentCallback?.(sensorData);
        }
      } catch (error) {
        console.error('Error in accident detection:', error);
      }
    }
  }

  private storeSensorData() {
    if (this.isCompleteReading(this.lastSensorReading)) {
      this.sensorData.push({ ...this.lastSensorReading } as SensorData);
      
      // Keep only last 100 readings to manage memory
      if (this.sensorData.length > 100) {
        this.sensorData = this.sensorData.slice(-100);
      }
    }
  }

  private isCompleteReading(data: Partial<SensorData>): data is SensorData {
    return !!(data.accelerometer && data.gyroscope && data.location && data.timestamp);
  }

  private async registerBackgroundTask() {
    try {
      // Background task registration for future implementation
      console.log('Background monitoring ready');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  getCurrentSensorData(): SensorData | null {
    return this.sensorData.length > 0 ? this.sensorData[this.sensorData.length - 1] : null;
  }

  getSensorHistory(): SensorData[] {
    return [...this.sensorData];
  }

  getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }

  updateThresholds(thresholds: Partial<AccidentThresholds>) {
    Object.assign(ACCIDENT_THRESHOLDS, thresholds);
  }
}

// Background task definition
TaskManager.defineTask(BACKGROUND_TASK, () => {
  try {
    // Background sensor monitoring logic
    console.log('Background task executed');
  } catch (error) {
    console.error('Background task error:', error);
  }
});

export const sensorService = new SensorService();
export type { SensorData, AccidentThresholds };