import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { activityService, ActivityLog, AlertLog } from '@/services/activityService';
import { Card } from '@/components/ui/Card';

export default function ActivityScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('history');
  const [activityData, setActivityData] = useState<ActivityLog[]>([]);
  const [alertsData, setAlertsData] = useState<AlertLog[]>([]);

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const activities = await activityService.getActivities();
    const alerts = await activityService.getAlerts();
    setActivityData(activities);
    setAlertsData(alerts);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'monitoring_start':
      case 'monitoring_stop': return 'radio';
      case 'gps_start':
      case 'gps_stop': return 'location';
      case 'location_update': return 'navigate';
      case 'sensor_data': return 'speedometer';
      case 'accident_simulation': return 'warning';
      case 'simulation': return 'warning';
      case 'speed_alert': return 'alert-circle';
      case 'impact_detected': return 'flash';
      case 'system_status': return 'information-circle';
      default: return 'time';
    }
  };

  const getColor = (type: string, severity?: string) => {
    if (severity) {
      switch (severity) {
        case 'high': return theme.error;
        case 'medium': return theme.warning;
        case 'low': return theme.info;
        default: return theme.textSecondary;
      }
    }
    
    switch (type) {
      case 'monitoring_start':
      case 'gps_start': return theme.success;
      case 'monitoring_stop':
      case 'gps_stop': return theme.textSecondary;
      case 'location_update': return theme.primary;
      case 'accident_simulation': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const tabs = [
    { id: 'history', title: 'Activity', icon: 'time' },
    { id: 'alerts', title: 'Alerts', icon: 'notifications' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={32} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Activity</Text>
      </View>

      <Card style={styles.tabsCard}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { 
                  backgroundColor: activeTab === tab.id ? theme.primary : 'transparent',
                }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.id ? '#fff' : theme.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { 
                  color: activeTab === tab.id ? '#fff' : theme.textSecondary,
                }
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {activeTab === 'history' && (
        <View>
          {activityData.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No activity yet. Start monitoring to see real-time activity logs.
              </Text>
            </Card>
          ) : (
            activityData.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <Ionicons
                    name={getIcon(item.type) as any}
                    size={24}
                    color={getColor(item.type)}
                  />
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemDetail, { color: theme.textSecondary }]}>
                      {item.description}
                    </Text>
                    {item.detail && (
                      <Text style={[styles.itemSubDetail, { color: theme.textSecondary }]}>
                        {item.detail}
                      </Text>
                    )}
                    <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                      {formatTime(item.timestamp)} • {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {activeTab === 'alerts' && (
        <View>
          {alertsData.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="shield-checkmark-outline" size={48} color={theme.success} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No alerts yet. System is monitoring for any incidents.
              </Text>
            </Card>
          ) : (
            alertsData.map((alert) => (
              <Card key={alert.id} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <Ionicons
                    name={getIcon(alert.type) as any}
                    size={24}
                    color={getColor(alert.type, alert.severity)}
                  />
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, { color: theme.text }]}>
                      {alert.message}
                    </Text>
                    {alert.description && (
                      <Text style={[styles.itemDetail, { color: theme.textSecondary }]}>
                        {alert.description}
                      </Text>
                    )}
                    <View style={styles.alertMeta}>
                      <View style={[styles.severityBadge, { backgroundColor: getColor(alert.type, alert.severity) + '20' }]}>
                        <Text style={[styles.severityText, { color: getColor(alert.type, alert.severity) }]}>
                          {alert.severity.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                        {formatTime(alert.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  tabsCard: {
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemText: {
    flex: 1,
    marginLeft: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 14,
    marginTop: 4,
  },
  itemSubDetail: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemDate: {
    fontSize: 12,
    marginTop: 8,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});