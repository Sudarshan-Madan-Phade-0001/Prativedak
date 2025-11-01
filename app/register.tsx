import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
  const [emergencyContact1, setEmergencyContact1] = useState({ name: '', phone: '', relationship: '' });
  const [emergencyContact2, setEmergencyContact2] = useState({ name: '', phone: '', relationship: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const scrollToInput = (inputPosition: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: inputPosition,
        animated: true,
      });
    }, 100);
  };

  const handleRegister = async () => {
    // Basic validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name.');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Missing Information', 'Please enter a password.');
      return;
    }
    
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!validateVehicleNumber(vehicleNumber)) {
      Alert.alert('Invalid Vehicle Number', 'Please enter a valid vehicle number (e.g., MH12AB1234)');
      return;
    }
    
    if (!emergencyContact1.name || !emergencyContact1.phone) {
      Alert.alert('Missing Emergency Contact', 'Please provide at least one emergency contact.');
      return;
    }

    setLoading(true);
    try {
      const emergencyContacts = [];
      if (emergencyContact1.name && emergencyContact1.phone) {
        emergencyContacts.push({ ...emergencyContact1, priority: 1 });
      }
      if (emergencyContact2.name && emergencyContact2.phone) {
        emergencyContacts.push({ ...emergencyContact2, priority: 2 });
      }
      
      const userData = {
        name,
        email,
        password,
        phone,
        vehicleNumber,
        emergencyContacts
      };
      
      const result = await register(userData);
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please login.');
        router.replace('/login');
      } else {
        // Show specific error message and suggest login if account exists
        if (result.message.includes('already exists')) {
          Alert.alert(
            'Account Already Exists', 
            result.message,
            [
              { text: 'Try Again', style: 'cancel' },
              { text: 'Login', onPress: () => router.replace('/login') }
            ]
          );
        } else {
          Alert.alert('Registration Failed', result.message);
        }
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled={true}
        enableOnAndroid={true}
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
            onFocus={() => scrollToInput(0)}
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
            onFocus={() => scrollToInput(100)}
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
            onFocus={() => scrollToInput(200)}
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
            onFocus={() => scrollToInput(300)}
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
            onFocus={() => scrollToInput(400)}
          />
        </View>
        
        <Text style={styles.sectionTitle}>Emergency Contact 1</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            value={emergencyContact1.name}
            onChangeText={(text) => setEmergencyContact1({...emergencyContact1, name: text})}
            onFocus={() => scrollToInput(500)}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={emergencyContact1.phone}
            onChangeText={(text) => setEmergencyContact1({...emergencyContact1, phone: text})}
            keyboardType="phone-pad"
            maxLength={10}
            onFocus={() => scrollToInput(600)}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="heart" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g., Father, Mother)"
            value={emergencyContact1.relationship}
            onChangeText={(text) => setEmergencyContact1({...emergencyContact1, relationship: text})}
            onFocus={() => scrollToInput(700)}
          />
        </View>
        
        <Text style={styles.sectionTitle}>Emergency Contact 2 (Optional)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            value={emergencyContact2.name}
            onChangeText={(text) => setEmergencyContact2({...emergencyContact2, name: text})}
            onFocus={() => scrollToInput(800)}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={emergencyContact2.phone}
            onChangeText={(text) => setEmergencyContact2({...emergencyContact2, phone: text})}
            keyboardType="phone-pad"
            maxLength={10}
            onFocus={() => scrollToInput(900)}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="heart" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g., Brother, Sister)"
            value={emergencyContact2.relationship}
            onChangeText={(text) => setEmergencyContact2({...emergencyContact2, relationship: text})}
            onFocus={() => scrollToInput(1000)}
          />
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
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
    minHeight: 600,
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
    marginTop: 'auto',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
});