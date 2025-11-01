import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSensors } from '@/hooks/useSensors';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, Linking } from 'react-native';
import { activityService } from '@/services/activityService';
import { firebaseService } from '@/services/firebaseService';

export default function MonitorScreen() {
  const { theme } = useTheme();
  const { isMonitoring, currentData, accidentDetected, startMonitoring, stopMonitoring } = useSensors();
  const { isTracking, startTracking, stopTracking, location } = useLocation();
  const { user } = useAuth();

  const simulateAccident = () => {
    Alert.alert(
      'Simulate Accident',
      'This will trigger emergency protocols. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate',
          style: 'destructive',
          onPress: async () => {
            // Save alert to Firebase with location
            if (user?.id) {
              await firebaseService.saveAlert({
                userId: user.id,
                type: 'emergency',
                location: {
                  latitude: location?.latitude || 0,
                  longitude: location?.longitude || 0,
                  address: location?.address || 'Unknown location'
                },
                timestamp: new Date().toISOString(),
                sensorData: currentData,
                status: 'active'
              });
            }
            
            // Log to local activity service
            await activityService.logActivityObject({
              type: 'accident_simulation',
              title: 'Accident Simulation Triggered',
              description: 'Emergency protocols activated via simulation',
              detail: 'User initiated accident simulation for testing'
            });
            
            await activityService.logAlert({
              type: 'simulation',
              message: 'Accident Simulation Started',
              description: 'Emergency response sequence initiated',
              severity: 'high'
            });
            
            // Navigate to emergency screen which will handle the countdown and messaging
            router.push('/emergency');
          }
        }
      ]
    );
  };

  const monitorOptions = [
    { 
      title: 'Sensors', 
      subtitle: 'Accelerometer & Gyroscope',
      icon: 'radio', 
      action: () => router.push('/(tabs)/activity'),
      status: isMonitoring ? 'Active' : 'Inactive',
      color: isMonitoring ? theme.success : theme.textSecondary
    },
    { 
      title: 'Alerts', 
      subtitle: 'Emergency & Notifications',
      icon: 'notifications', 
      action: () => {
        router.push('/(tabs)/activity');
        // Switch to alerts tab after navigation
        setTimeout(() => {
          // This will be handled by the activity screen
        }, 100);
      },
      status: accidentDetected ? 'Alert!' : 'Normal',
      color: accidentDetected ? theme.error : theme.success
    },
    { 
      title: 'Emergency', 
      subtitle: 'Quick Emergency Response',
      icon: 'warning', 
      action: () => router.push('/emergency'),
      status: 'Ready',
      color: theme.warning
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="speedometer" size={32} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Monitor Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Real-time monitoring and controls
        </Text>
      </View>

      {currentData && (
        <Card style={styles.quickStatsCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {Math.sqrt(
                  (currentData.accelerometer?.x || 0) ** 2 + 
                  (currentData.accelerometer?.y || 0) ** 2 + 
                  (currentData.accelerometer?.z || 0) ** 2
                ).toFixed(1)}G
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Acceleration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.secondary }]}>
                {currentData.location?.speed ? `${currentData.location.speed.toFixed(0)}` : '0'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>km/h</Text>
            </View>
          </View>
        </Card>
      )}

      <View style={styles.optionsGrid}>
        {monitorOptions.map((option, index) => (
          <Card key={index} style={styles.optionCard}>
            <TouchableOpacity 
              style={styles.optionContent}
              onPress={option.action}
            >
              <View style={styles.optionHeader}>
                <Ionicons name={option.icon as any} size={28} color={option.color} />
                <View style={styles.optionStatus}>
                  <Text style={[styles.statusText, { color: option.color }]}>
                    {option.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                {option.title}
              </Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                {option.subtitle}
              </Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      <Card style={styles.quickActionsCard}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button
            title={isMonitoring ? "Stop Sensors" : "Start Sensors"}
            onPress={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "danger" : "success"}
            icon={isMonitoring ? "stop" : "play"}
            style={styles.actionButton}
          />
          <Button
            title={isTracking ? "Stop GPS" : "Start GPS"}
            onPress={isTracking ? stopTracking : startTracking}
            variant={isTracking ? "danger" : "success"}
            icon={isTracking ? "location" : "location-outline"}
            style={styles.actionButton}
          />
          <Button
            title="Simulate Accident"
            onPress={simulateAccident}
            variant="warning"
            icon="warning"
            style={styles.actionButton}
          />
        </View>
      </Card>
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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  quickStatsCard: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  optionsGrid: {
    marginBottom: 20,
  },
  optionCard: {
    marginBottom: 12,
  },
  optionContent: {
    padding: 4,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  quickActionsCard: {
    marginBottom: 32,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});