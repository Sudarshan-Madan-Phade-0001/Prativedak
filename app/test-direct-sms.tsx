import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import NativeEmergencyService from '@/services/nativeEmergencyService';

export default function TestDirectSmsScreen() {
  const [phoneNumber, setPhoneNumber] = useState('7588641263');
  const [message, setMessage] = useState('Test direct SMS from Prativedak');
  const [sending, setSending] = useState(false);

  const testDirectSMS = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setSending(true);
    try {
      console.log('🧪 Testing direct SMS...');
      const result = await NativeEmergencyService.sendAutomaticSMS(phoneNumber, message);
      console.log('🧪 Direct SMS result:', result);
      
      Alert.alert(
        'Direct SMS Test Result', 
        result ? '✅ SMS sent directly!' : '❌ SMS failed'
      );
    } catch (error) {
      console.error('🧪 Direct SMS error:', error);
      Alert.alert('Error', `SMS failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Direct SMS</Text>
      <Text style={styles.subtitle}>Test native SMS module</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      
      <TouchableOpacity 
        style={[styles.button, sending && styles.buttonDisabled]} 
        onPress={testDirectSMS}
        disabled={sending}
      >
        <Text style={styles.buttonText}>
          {sending ? 'Sending...' : 'Test Direct SMS'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});