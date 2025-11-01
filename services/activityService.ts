export interface ActivityLog {
  id: string;
  type: 'movement' | 'location' | 'sensor' | 'accident_simulation' | 'monitoring_start' | 'monitoring_stop' | 'gps_start' | 'gps_stop' | 'sensor_data';
  message: string;
  timestamp: Date;
  data?: any;
  title?: string;
  description?: string;
  detail?: string;
}

export interface AlertLog {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'simulation';
  message: string;
  timestamp: Date;
  resolved: boolean;
  severity?: string;
  description?: string;
}

class ActivityService {
  private activities: ActivityLog[] = [];
  private alerts: AlertLog[] = [];

  // Activity logging
  logActivity(type: ActivityLog['type'], message: string, data?: any): void {
    const activity: ActivityLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      data
    };
    
    this.activities.unshift(activity);
    
    // Keep only last 100 activities
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }
  }

  // Log activity with object interface (async version)
  async logActivityObject(activity: { type: string; title: string; description: string; detail?: string }): Promise<void> {
    this.logActivity(activity.type as any, activity.title, { description: activity.description, detail: activity.detail });
  }

  getActivities(): ActivityLog[] {
    return this.activities;
  }

  // Alert management
  createAlert(type: AlertLog['type'], message: string): string {
    const alert: AlertLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      resolved: false
    };
    
    this.alerts.unshift(alert);
    return alert.id;
  }

  // Log alert with object interface (async version)
  async logAlert(alert: { type: string; message: string; description?: string; severity?: string }): Promise<string> {
    const alertLog: AlertLog = {
      id: Date.now().toString(),
      type: alert.type as any,
      message: alert.message,
      timestamp: new Date(),
      resolved: false,
      severity: alert.severity || 'medium',
      description: alert.description
    };
    
    this.alerts.unshift(alertLog);
    return alertLog.id;
  }

  getAlerts(): AlertLog[] {
    return this.alerts;
  }

  resolveAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
    }
  }

  getUnresolvedAlerts(): AlertLog[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Clear data
  clearActivities(): void {
    this.activities = [];
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

export const activityService = new ActivityService();