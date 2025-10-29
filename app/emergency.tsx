import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import * as Location from 'expo-location';

export default function EmergencyScreen() {
  const { user } = useAuth();
  const { location, startTracking } = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  // Get current location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  useEffect(() => {
    if (countdown > 0 && !isCancelled) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isCancelled) {
      handleAutoEmergencySequence();
    }
  }, [countdown, isCancelled]);

  const handleAutoEmergencySequence = async () => {
    // Step 1: Call immediately
    callEmergencyContacts();
    
    // Step 2: Send SMS after 3 seconds
    setTimeout(() => {
      sendSMSToEmergencyContacts();
    }, 3000);
    
    // Step 3: Send WhatsApp after 6 seconds
    setTimeout(() => {
      sendWhatsAppAlert();
    }, 6000);
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'Calling emergency contact now...',
      [{ text: 'OK', onPress: callEmergencyContacts }]
    );
  };

  const handleCancel = () => {
    setIsCancelled(true);
    Alert.alert(
      'Emergency Cancelled',
      'Emergency call has been cancelled. Stay safe!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCallNow = () => {
    setIsCancelled(true);
    callEmergencyContacts();
  };

  const callEmergencyContacts = () => {
    if (user?.emergencyContacts?.length) {
      // Sort by priority and call in order
      const sortedContacts = [...user.emergencyContacts].sort((a, b) => a.priority - b.priority);
      
      if (sortedContacts[0]?.phone) {
        Linking.openURL(`tel:${sortedContacts[0].phone}`);
      }
    } else {
      // Default to emergency services
      Linking.openURL('tel:112');
    }
  };

  const sendSMSToEmergencyContacts = () => {
    if (user?.emergencyContacts?.length) {
      const loc = currentLocation || location;
      const locationText = loc ? `https://maps.google.com/?q=${loc.latitude},${loc.longitude}` : 'Location unavailable';
      const message = `🚨 EMERGENCY: ${user.name} has been in an accident. Location: ${locationText}`;
      
      user.emergencyContacts.forEach(contact => {
        if (contact?.phone) {
          const phoneNumber = contact.phone.replace(/\D/g, ''); // Remove non-digits
          const smsUrl = `sms:+91${phoneNumber}?body=${encodeURIComponent(message)}`;
          Linking.openURL(smsUrl).catch(err => {
            console.error('Failed to send SMS:', err);
            // Fallback without country code
            Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
          });
        }
      });
    }
  };

  const sendWhatsAppAlert = () => {
    if (user?.emergencyContacts?.length) {
      const loc = currentLocation || location;
      const locationText = loc ? `https://maps.google.com/?q=${loc.latitude},${loc.longitude}` : 'Location unavailable';
      const message = `🚨 EMERGENCY ALERT: ${user.name} has been in an accident. Location: ${locationText}`;
      const primaryContact = user.emergencyContacts.find(c => c.priority === 1);
      if (primaryContact) {
        const phoneNumber = primaryContact.phone.replace(/\D/g, ''); // Remove non-digits
        const whatsappUrl = `whatsapp://send?phone=91${phoneNumber}&text=${encodeURIComponent(message)}`;
        Linking.openURL(whatsappUrl).catch(err => {
          console.error('Failed to open WhatsApp:', err);
          // Fallback to web WhatsApp
          Linking.openURL(`https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`);
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.emergencyCard}>
        <Ionicons name="warning" size={80} color="#dc3545" />
        
        <Text style={styles.title}>EMERGENCY ALERT</Text>
        <Text style={styles.subtitle}>Accident simulation activated</Text>
        
        {!isCancelled && (
          <>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.countdownLabel}>seconds until emergency call</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.callButton} onPress={handleCallNow}>
                <Ionicons name="call" size={24} color="#fff" />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        <View style={styles.alertActions}>
          <TouchableOpacity style={styles.smsButton} onPress={sendSMSToEmergencyContacts}>
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.smsButtonText}>Send SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.whatsappButton} onPress={sendWhatsAppAlert}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
        
        {(currentLocation || location) && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>
              Location: {(currentLocation || location).latitude.toFixed(6)}, {(currentLocation || location).longitude.toFixed(6)}
            </Text>
          </View>
        )}
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>User: {user.name}</Text>
            <Text style={styles.userInfoText}>Vehicle: {user.vehicleNumber}</Text>
            <Text style={styles.userInfoText}>Phone: {user.phone}</Text>
            {user.emergencyContacts?.length > 0 && (
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyTitle}>Emergency Contacts:</Text>
                {user.emergencyContacts
                  .sort((a, b) => a.priority - b.priority)
                  .map((contact, index) => (
                    <Text key={index} style={styles.emergencyContact}>
                      {contact.priority}. {contact.name} ({contact.relationship}): {contact.phone}
                    </Text>
                  ))
                }
              </View>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>Emergency Numbers</Text>
        <TouchableOpacity style={styles.helpButton} onPress={() => Linking.openURL('tel:112')}>
          <Text style={styles.helpButtonText}>112 - Emergency Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton} onPress={() => Linking.openURL('tel:108')}>
          <Text style={styles.helpButtonText}>108 - Ambulance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton} onPress={() => Linking.openURL('tel:100')}>
          <Text style={styles.helpButtonText}>100 - Police</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    justifyContent: 'center',
  },
  emergencyCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#dc3545',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  smsButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  whatsappButton: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  whatsappButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  smsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userInfoText: {
    fontSize: 12,
    color: '#666',
  },
  emergencyInfo: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emergencyContact: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  helpContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  helpButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  helpButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
});