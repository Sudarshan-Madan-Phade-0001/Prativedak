import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { NativeSmsService } from '@/services/nativeSmsService';

export default function TestNativeSmsScreen() {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [isSending, setIsSending] = useState(false);

  const testContacts = [
    { name: 'Emergency Contact 1', phone: '+1234567890', priority: 1, relationship: 'Family' },
    { name: 'Emergency Contact 2', phone: '+0987654321', priority: 2, relationship: 'Friend' }
  ];

  const handleTestSingleSMS = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsSending(true);
    try {
      const success = await NativeSmsService.sendDirectSMS(
        phoneNumber,
        '🚨 TEST: This is a test emergency SMS from Prativedak app. Please ignore.'
      );
      
      Alert.alert(
        'SMS Test Result',
        success ? 'SMS sent successfully!' : 'SMS failed to send'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestEmergencySMS = async () => {
    setIsSending(true);
    Alert.alert('Testing...', 'Sending emergency SMS to all contacts');

    try {
      const result = await NativeSmsService.sendEmergencySMS(
        testContacts,
        'Test User',
        { latitude: 28.6139, longitude: 77.2090 } // Delhi coordinates
      );
      
      Alert.alert(
        'Emergency SMS Result',
        `Success: ${result.success}\nSent to ${result.results.filter(r => r.status === 'sent').length} contacts`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send emergency SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await NativeSmsService.requestSmsPermission();
    Alert.alert(
      'SMS Permission',
      granted ? 'Permission granted!' : 'Permission denied'
    );
  };

  const handleCheckPermission = async () => {
    const hasPermission = await NativeSmsService.hasSmsPermission();
    Alert.alert(
      'SMS Permission Status',
      hasPermission ? 'Permission granted' : 'Permission not granted'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Native SMS Testing</Text>
      <Text style={styles.subtitle}>Bare Workflow - Direct SMS</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoText}>✅ Direct SMS sending (no user interaction)</Text>
        <Text style={styles.infoText}>✅ Works when app is closed</Text>
        <Text style={styles.infoText}>✅ Native Android SMS permissions</Text>
        <Text style={styles.infoText}>✅ Bulk emergency SMS</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test Phone Number:</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+1234567890"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCheckPermission}>
        <Text style={styles.buttonText}>Check SMS Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
        <Text style={styles.buttonText}>Request SMS Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.testButton, isSending && styles.buttonDisabled]} 
        onPress={handleTestSingleSMS}
        disabled={isSending}
      >
        <Text style={styles.buttonText}>
          {isSending ? 'Sending...' : 'Send Test SMS'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.emergencyButton, isSending && styles.buttonDisabled]} 
        onPress={handleTestEmergencySMS}
        disabled={isSending}
      >
        <Text style={styles.buttonText}>
          {isSending ? 'Sending...' : '🚨 Send Emergency SMS'}
        </Text>
      </TouchableOpacity>

      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          ⚠️ This will send actual SMS messages. Use test numbers only.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  infoContainer: { backgroundColor: '#f0f8ff', padding: 15, borderRadius: 8, marginBottom: 20 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#333', marginBottom: 5 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 15 },
  testButton: { backgroundColor: '#28a745' },
  emergencyButton: { backgroundColor: '#dc3545' },
  buttonDisabled: { backgroundColor: '#6c757d' },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  warningContainer: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 8, marginTop: 20 },
  warningText: { color: '#856404', textAlign: 'center', fontSize: 14 }
});