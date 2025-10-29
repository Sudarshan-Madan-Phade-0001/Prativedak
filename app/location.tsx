import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocation } from '@/hooks/useLocation';

export default function LocationScreen() {
  const { location, error, isTracking, startTracking, stopTracking } = useLocation();

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
});