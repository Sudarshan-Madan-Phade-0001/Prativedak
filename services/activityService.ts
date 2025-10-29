import AsyncStorage from '@react-native-async-storage/async-storage';

interface ActivityLog {
  id: string;
  type: 'monitoring_start' | 'monitoring_stop' | 'gps_start' | 'gps_stop' | 'location_update' | 'sensor_data' | 'accident_simulation';
  title: string;
  description: string;
  detail?: string;
  timestamp: number;
  data?: any;
}

interface AlertLog {
  id: string;
  type: 'simulation' | 'speed_alert' | 'impact_detected' | 'system_status';
  message: string;
  description?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

class ActivityService {
  private readonly ACTIVITY_KEY = 'app_activity_logs';
  private readonly ALERTS_KEY = 'app_alert_logs';

  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const activities = await this.getActivities();
      const newActivity: ActivityLog = {
        ...activity,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      
      activities.unshift(newActivity);
      
      // Keep only last 100 activities
      if (activities.length > 100) {
        activities.splice(100);
      }
      
      await AsyncStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async logAlert(alert: Omit<AlertLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const alerts = await this.getAlerts();
      const newAlert: AlertLog = {
        ...alert,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      
      alerts.unshift(newAlert);
      
      // Keep only last 50 alerts
      if (alerts.length > 50) {
        alerts.splice(50);
      }
      
      await AsyncStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to log alert:', error);
    }
  }

  async getActivities(): Promise<ActivityLog[]> {
    try {
      const data = await AsyncStorage.getItem(this.ACTIVITY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async getAlerts(): Promise<AlertLog[]> {
    try {
      const data = await AsyncStorage.getItem(this.ALERTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.ACTIVITY_KEY, this.ALERTS_KEY]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

export const activityService = new ActivityService();
export type { ActivityLog, AlertLog };