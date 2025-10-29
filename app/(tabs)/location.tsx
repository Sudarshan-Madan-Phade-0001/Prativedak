import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/useLocation';
import { useSensors } from '@/hooks/useSensors';

export default function LocationTab() {
  const { location, error, isTracking, startTracking, stopTracking } = useLocation();
  const { isMonitoring: sensorMonitoring, currentData, accidentDetected } = useSensors();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>GPS Tracking</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.status}>
          Status: {isTracking ? 'Tracking' : 'Stopped'}
        </Text>
      </View>

      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.label}>Current Location:</Text>
          <Text style={styles.coordinate}>Lat: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.coordinate}>Lng: {location.longitude.toFixed(6)}</Text>
          <Text style={styles.accuracy}>Accuracy: {location.accuracy.toFixed(1)}m</Text>
          <Text style={styles.timestamp}>
            Updated: {new Date(location.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>Error: {error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.buttonText}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      <View style={styles.sensorSection}>
        <Text style={styles.sectionTitle}>Sensor Monitoring</Text>
        
        <View style={styles.sensorStatusCard}>
          <View style={styles.sensorStatusHeader}>
            <Ionicons 
              name={sensorMonitoring ? "radio-button-on" : "radio-button-off"} 
              size={20} 
              color={sensorMonitoring ? "#28a745" : "#dc3545"} 
            />
            <Text style={styles.sensorStatusText}>
              {sensorMonitoring ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          {accidentDetected && (
            <View style={styles.alertBanner}>
              <Ionicons name="warning" size={16} color="#dc3545" />
              <Text style={styles.alertText}>ACCIDENT DETECTED!</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.sensorButton} 
            onPress={() => router.push('/sensors')}
          >
            <Ionicons name="speedometer" size={20} color="#fff" />
            <Text style={styles.sensorButtonText}>Open Sensor Dashboard</Text>
          </TouchableOpacity>
        </View>
        
        {currentData && (
          <View style={styles.quickDataCard}>
            <Text style={styles.quickDataTitle}>Quick Sensor Data</Text>
            <View style={styles.quickDataRow}>
              <Text style={styles.quickDataLabel}>Acceleration:</Text>
              <Text style={styles.quickDataValue}>
                {Math.sqrt(
                  (currentData.accelerometer?.x || 0) ** 2 + 
                  (currentData.accelerometer?.y || 0) ** 2 + 
                  (currentData.accelerometer?.z || 0) ** 2
                ).toFixed(2)}G
              </Text>
            </View>
            <View style={styles.quickDataRow}>
              <Text style={styles.quickDataLabel}>Speed:</Text>
              <Text style={styles.quickDataValue}>
                {currentData.location?.speed ? `${currentData.location.speed.toFixed(1)} km/h` : 'N/A'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1a1a1a',
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  locationContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d5a2d',
  },
  coordinate: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
  accuracy: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ffe8e8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sensorSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  sensorStatusCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sensorStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  alertText: {
    color: '#721c24',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sensorButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  quickDataCard: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
  },
  quickDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5a2d',
    marginBottom: 12,
  },
  quickDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickDataLabel: {
    fontSize: 14,
    color: '#333',
  },
  quickDataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5a2d',
    fontFamily: 'monospace',
  },
});