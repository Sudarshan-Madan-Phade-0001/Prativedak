import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { dataClearService } from '@/services/dataClearService';
import { useAuth } from '@/contexts/AuthContext';

export default function DataClearButton() {
  const { logout } = useAuth();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all stored data and log you out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataClearService.clearAllData();
              Alert.alert('Success', 'All data cleared successfully');
              logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleClearData}>
      <Text style={styles.buttonText}>🗑️ Clear All Data</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});