import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSensors } from '@/hooks/useSensors';

export default function SensorsScreen() {
  const {
    isMonitoring,
    currentData,
    accidentDetected,
    error,
    startMonitoring,
    stopMonitoring,
    clearAccident,
  } = useSensors();

  useEffect(() => {
    if (accidentDetected) {
      Alert.alert(
        'ACCIDENT DETECTED!',
        'High impact or sudden movement detected. Emergency services will be notified.',
        [
          { text: 'False Alarm', onPress: clearAccident },
          { text: 'Emergency!', onPress: () => router.push('/emergency') },
        ]
      );
    }
  }, [accidentDetected]);

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
  };

  const formatSensorValue = (value: number | undefined) => (value || 0).toFixed(3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Sensor Monitoring</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons 
            name={isMonitoring ? "radio-button-on" : "radio-button-off"} 
            size={24} 
            color={isMonitoring ? "#28a745" : "#dc3545"} 
          />
          <Text style={styles.statusText}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.toggleButton, isMonitoring ? styles.stopButton : styles.startButton]}
          onPress={handleToggleMonitoring}
        >
          <Text style={styles.toggleButtonText}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {accidentDetected && (
        <View style={styles.alertCard}>
          <Ionicons name="warning" size={30} color="#dc3545" />
          <Text style={styles.alertTitle}>ACCIDENT DETECTED!</Text>
          <Text style={styles.alertText}>High impact detected at {new Date().toLocaleTimeString()}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearAccident}>
            <Text style={styles.clearButtonText}>Clear Alert</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentData && (
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Live Sensor Data</Text>
          
          <View style={styles.sensorSection}>
            <View style={styles.sensorHeader}>
              <Ionicons name="speedometer" size={20} color="#007AFF" />
              <Text style={styles.sensorTitle}>Accelerometer (G)</Text>
            </View>
            <View style={styles.sensorValues}>
              <Text style={styles.sensorValue}>X: {formatSensorValue(currentData.accelerometer?.x)}</Text>
              <Text style={styles.sensorValue}>Y: {formatSensorValue(currentData.accelerometer?.y)}</Text>
              <Text style={styles.sensorValue}>Z: {formatSensorValue(currentData.accelerometer?.z)}</Text>
            </View>
          </View>

          <View style={styles.sensorSection}>
            <View style={styles.sensorHeader}>
              <Ionicons name="refresh" size={20} color="#28a745" />
              <Text style={styles.sensorTitle}>Gyroscope (rad/s)</Text>
            </View>
            <View style={styles.sensorValues}>
              <Text style={styles.sensorValue}>X: {formatSensorValue(currentData.gyroscope?.x)}</Text>
              <Text style={styles.sensorValue}>Y: {formatSensorValue(currentData.gyroscope?.y)}</Text>
              <Text style={styles.sensorValue}>Z: {formatSensorValue(currentData.gyroscope?.z)}</Text>
            </View>
          </View>

          <View style={styles.sensorSection}>
            <View style={styles.sensorHeader}>
              <Ionicons name="location" size={20} color="#ff6b35" />
              <Text style={styles.sensorTitle}>Location & Speed</Text>
            </View>
            <View style={styles.locationValues}>
              <Text style={styles.sensorValue}>
                Lat: {(currentData.location?.latitude || 0).toFixed(6)}
              </Text>
              <Text style={styles.sensorValue}>
                Lng: {(currentData.location?.longitude || 0).toFixed(6)}
              </Text>
              <Text style={styles.sensorValue}>
                Speed: {currentData.location?.speed ? `${currentData.location.speed.toFixed(1)} km/h` : 'N/A'}
              </Text>
            </View>
          </View>

          <Text style={styles.timestamp}>
            Last Update: {new Date(currentData.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Detection Thresholds</Text>
        <Text style={styles.infoText}>• Acceleration: 2.5G sudden change</Text>
        <Text style={styles.infoText}>• Rotation: 5.0 rad/s angular velocity</Text>
        <Text style={styles.infoText}>• Speed Change: 20 km/h sudden change</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#1a1a1a',
  },
  toggleButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
  },
  errorText: {
    color: '#721c24',
    marginLeft: 8,
    flex: 1,
  },
  alertCard: {
    backgroundColor: '#f8d7da',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#721c24',
    marginTop: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#721c24',
    marginTop: 4,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dataCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sensorSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  sensorValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  locationValues: {
    gap: 4,
  },
  sensorValue: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#e8f5e8',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
});