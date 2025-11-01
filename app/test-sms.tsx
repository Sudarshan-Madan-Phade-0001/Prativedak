import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SimpleSmsService } from '@/services/simpleSmsService';

export default function TestSmsScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Test emergency message from Prativedak');
  const [sending, setSending] = useState(false);

  const testSMS = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setSending(true);
    try {
      const result = await SimpleSmsService.sendSMS(phoneNumber, message);
      Alert.alert(
        'SMS Test Result', 
        result.success ? '✅ SMS sent successfully!' : `❌ SMS failed: ${result.message}`
      );
    } catch (error) {
      Alert.alert('Error', `SMS failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test SMS Sending</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter phone number (e.g., +919876543210)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Enter message"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      
      <TouchableOpacity 
        style={[styles.button, sending && styles.buttonDisabled]} 
        onPress={testSMS}
        disabled={sending}
      >
        <Text style={styles.buttonText}>
          {sending ? 'Sending...' : 'Test SMS'}
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