import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { validatePassword, validatePhone, validateVehicleNumber } from '@/utils/validation';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [emergencyContact1, setEmergencyContact1] = useState('');
  const [emergencyContact2, setEmergencyContact2] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!validateVehicleNumber(vehicleNumber)) {
      Alert.alert('Invalid Vehicle Number', 'Please enter a valid vehicle number (e.g., MH12AB1234)');
      return;
    }

    setLoading(true);
    try {
      const emergencyContacts = [emergencyContact1, emergencyContact2].filter(contact => contact.trim());
      const result = await register({
        name,
        email,
        password,
        phone,
        vehicleNumber,
        emergencyContacts
      });
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please login.');
        router.replace('/login');
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={60} color="#007AFF" />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="car" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Number (e.g., MH12AB1234)"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="people" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Emergency Contact 1"
            value={emergencyContact1}
            onChangeText={setEmergencyContact1}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="people" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Emergency Contact 2 (Optional)"
            value={emergencyContact2}
            onChangeText={setEmergencyContact2}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        
        <View style={styles.passwordNote}>
          <Text style={styles.noteText}>Password must be at least 5 characters (letters, numbers, or symbols)</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  passwordNote: {
    backgroundColor: '#e6f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#87ceeb',
  },
  noteText: {
    fontSize: 14,
    color: '#4682b4',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  linkText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
  },
});