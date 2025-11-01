import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { auth, db } from '@/config/firebase';

export default function FirebaseTest() {
  const [status, setStatus] = useState('Checking Firebase connection...');

  useEffect(() => {
    try {
      // Test Firebase initialization
      if (auth && db) {
        setStatus('✅ Firebase connected successfully');
      } else {
        setStatus('❌ Firebase connection failed');
      }
    } catch (error) {
      setStatus(`❌ Firebase error: ${error}`);
    }
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