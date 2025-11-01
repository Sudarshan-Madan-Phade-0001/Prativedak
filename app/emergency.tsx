import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import * as Location from 'expo-location';
import { emergencyService } from '@/services/emergencyService';
import { bareWorkflowEmergencyService } from '@/services/bareWorkflowEmergencyService';
import { NativeCallService } from '@/services/nativeCallService';
import { NativeAutoSmsService } from '@/services/nativeAutoSmsService';
import NativeEmergencyService from '@/services/nativeEmergencyService';

export default function EmergencyScreen() {
  const { user } = useAuth();
  const { location } = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [isCancelled, setIsCancelled] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);
  const [emergencyResults, setEmergencyResults] = useState<any>(null);
  const [isBareWorkflow, setIsBareWorkflow] = useState(true); // Set to true for bare workflow
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  // Get current location when component mounts
  useEffect(() => {
    getCurrentLocation();
    requestPermissions();
    startEmergencyCountdown();
  }, []);
  
  const requestPermissions = async () => {
    if (isBareWorkflow) {
      await NativeEmergencyService.requestPermissions();
    }
  };

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

  const startEmergencyCountdown = () => {
    const locationData = currentLocation || location;
    
    if (isBareWorkflow) {
      // Use bare workflow service for automatic actions
      bareWorkflowEmergencyService.triggerFullEmergencySequence(
        user,
        locationData,
        (seconds) => setCountdown(seconds),
        (results) => {
          setEmergencySent(true);
          setEmergencyResults(results);
          
          const smsCount = results.smsResults.filter((r: any) => r.success).length;
          const callStatus = results.callResult?.automatic ? 'automatically made' : 'dialer opened';
          
          Alert.alert(
            'Emergency Actions Completed',
            `✅ SMS sent: ${smsCount}/${results.smsResults.length}\n📞 Emergency call: ${callStatus}\n📱 Messages app used for SMS delivery`,
            [{ text: 'OK' }]
          );
        }
      );
    } else {
      // Fallback to regular service for Expo Go
      emergencyService.triggerEmergencyAlert(
        user,
        locationData,
        (seconds) => setCountdown(seconds),
        () => {
          setEmergencySent(true);
          Alert.alert(
            'Emergency Messages Sent',
            'SMS and WhatsApp messages have been sent to your emergency contacts.',
            [{ text: 'OK' }]
          );
        }
      );
    }
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
    
    if (isBareWorkflow) {
      bareWorkflowEmergencyService.cancelEmergencySequence();
    } else {
      emergencyService.cancelEmergencyAlert();
    }
    
    Alert.alert(
      'Emergency Cancelled',
      'Emergency sequence has been cancelled. Stay safe!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCallNow = async () => {
    setIsCancelled(true);
    
    if (isBareWorkflow) {
      bareWorkflowEmergencyService.cancelEmergencySequence();
    } else {
      emergencyService.cancelEmergencyAlert();
    }
    
    await callEmergencyContacts();
  };

  const callEmergencyContacts = async () => {
    if (user?.emergencyContacts?.length) {
      const primaryContact = user.emergencyContacts.sort((a, b) => a.priority - b.priority)[0];
      
      if (isBareWorkflow) {
        // TRUE automatic call using native module
        const success = await NativeEmergencyService.makeAutomaticCall(primaryContact.phone);
        Alert.alert(
          'Native Call Result',
          success ? '✅ Emergency call made automatically!\n(No user interaction required!)' : '❌ Call failed - check permissions',
          [{ text: 'OK' }]
        );
      } else {
        // Regular dialer for Expo Go
        Linking.openURL(`tel:${primaryContact.phone}`);
      }
    } else {
      if (isBareWorkflow) {
        const success = await NativeEmergencyService.makeAutomaticCall('112');
        Alert.alert(
          'Emergency Services',
          success ? '✅ Emergency call made automatically!' : '❌ Call failed - check permissions',
          [{ text: 'OK' }]
        );
      } else {
        Linking.openURL('tel:112');
      }
    }
  };

  const sendSMSToEmergencyContacts = async () => {
    if (user?.emergencyContacts?.length) {
      const locationData = currentLocation || location;
      const message = `🚨 MANUAL EMERGENCY ALERT 🚨\n\nUser: ${user.name}\nTime: ${new Date().toLocaleString()}\nLocation: ${locationData ? `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}` : 'Unknown'}\n\nManual emergency alert from Prativedak Safety App.`;
      
      if (isBareWorkflow) {
        // TRUE automatic SMS using native module
        const phoneNumbers = user.emergencyContacts.map(c => c.phone);
        const sentCount = await NativeEmergencyService.sendBulkSMS(phoneNumbers, message);
        Alert.alert(
          'Native SMS Results',
          `✅ Automatic SMS sent: ${sentCount}/${user.emergencyContacts.length} contacts\n(No user interaction required!)`,
          [{ text: 'OK' }]
        );
      } else {
        // Fallback for Expo Go
        for (const contact of user.emergencyContacts) {
          try {
            const { NativeSmsService } = require('@/services/nativeSmsService');
            await NativeSmsService.sendDirectSMS(contact.phone, message);
          } catch (error) {
            console.error('SMS failed:', error);
          }
        }
        Alert.alert('SMS Sent', 'Emergency SMS sent to all contacts');
      }
    }
  };

  const sendWhatsAppAlert = async () => {
    if (user?.emergencyContacts?.length) {
      const locationData = currentLocation || location;
      const message = `🚨 EMERGENCY ALERT 🚨\n\nUser: ${user.name}\nTime: ${new Date().toLocaleString()}\nLocation: ${locationData ? `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}` : 'Unknown'}\n\nManual emergency alert from Prativedak Safety App.`;
      
      const primaryContact = user.emergencyContacts.sort((a, b) => a.priority - b.priority)[0];
      const formattedNumber = primaryContact.phone.replace(/\D/g, '');
      const whatsappNumber = formattedNumber.startsWith('91') ? formattedNumber : `91${formattedNumber}`;
      
      const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
      
      try {
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          const webWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
          await Linking.openURL(webWhatsappUrl);
        }
      } catch (error) {
        console.error('WhatsApp failed:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.emergencyCard}>
        <Ionicons name="warning" size={80} color="#dc3545" />
        
        <Text style={styles.title}>EMERGENCY ALERT</Text>
        <Text style={styles.subtitle}>Accident simulation activated</Text>
        
        {!isCancelled && !emergencySent && (
          <>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.countdownLabel}>seconds until automatic SMS/WhatsApp</Text>
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
        
        {emergencySent && (
          <View style={styles.sentContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#28a745" />
            <Text style={styles.sentText}>
              {isBareWorkflow ? 'Automatic Emergency Actions Completed!' : 'Emergency Messages Sent!'}
            </Text>
            <Text style={styles.sentSubtext}>
              {isBareWorkflow 
                ? 'Automatic SMS, calls, and WhatsApp alerts have been triggered'
                : 'SMS and WhatsApp alerts have been sent to your emergency contacts'
              }
            </Text>
            
            {emergencyResults && isBareWorkflow && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Action Results:</Text>
                
                {emergencyResults.smsResults?.map((result: any, index: number) => (
                  <Text key={index} style={styles.resultItem}>
                    {result.success ? '✅' : '❌'} SMS to {result.contact}: {result.success ? 'Sent automatically' : 'Opened SMS app'}
                  </Text>
                ))}
                
                {emergencyResults.callResult && (
                  <Text style={styles.resultItem}>
                    {emergencyResults.callResult.success ? '✅' : '❌'} Call to {emergencyResults.callResult.contact}: {emergencyResults.callResult.automatic ? 'Called automatically' : 'Opened dialer'}
                  </Text>
                )}
                
                {emergencyResults.whatsappResult && (
                  <Text style={styles.resultItem}>
                    {emergencyResults.whatsappResult.success ? '✅' : '❌'} WhatsApp: {emergencyResults.whatsappResult.success ? 'Opened successfully' : 'Failed to open'}
                  </Text>
                )}
              </View>
            )}
          </View>
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
  sentContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  sentText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 8,
  },
  sentSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  resultsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    width: '100%',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'left',
  },
});