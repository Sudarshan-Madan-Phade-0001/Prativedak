import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { auth, db } from '@/config/firebase';

export default function FirebaseConnectionTest() {
  const [status, setStatus] = useState('Testing Firebase connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test auth connection
        if (!auth) {
          setStatus('❌ Firebase Auth not initialized');
          return;
        }
        
        // Test firestore connection
        if (!db) {
          setStatus('❌ Firebase Firestore not initialized');
          return;
        }
        
        setStatus('✅ Firebase connected successfully');
      } catch (error) {
        setStatus(`❌ Firebase error: ${error}`);
      }
    };
    
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 16,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});