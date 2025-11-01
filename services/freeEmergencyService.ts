import { Linking, Alert } from 'react-native';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

export class FreeEmergencyService {
  
  // Make emergency call using device dialer (free)
  static async makeEmergencyCall(contacts: EmergencyContact[]): Promise<void> {
    try {
      if (contacts.length === 0) {
        await this.callEmergencyServices();
        return;
      }

      // Sort by priority and call first contact
      const sortedContacts = contacts.sort((a, b) => a.priority - b.priority);
      const primaryContact = sortedContacts[0];
      
      Alert.alert(
        'Emergency Call',
        `Calling ${primaryContact.name} (${primaryContact.relationship})`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => Linking.openURL(`tel:${primaryContact.phone}`)
          }
        ]
      );
    } catch (error) {
      console.error('Emergency call failed:', error);
      await this.callEmergencyServices();
    }
  }

  // Call emergency services (112/911)
  static async callEmergencyServices(): Promise<void> {
    Alert.alert(
      'Emergency Services',
      'Calling emergency services (112)',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 112', 
          onPress: () => Linking.openURL('tel:112')
        }
      ]
    );
  }

  // Send SMS using device SMS app (free)
  static async sendBulkSMS(
    contacts: EmergencyContact[], 
    userName: string, 
    location: LocationData
  ): Promise<void> {
    try {
      const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = `🚨 EMERGENCY: ${userName} needs help! Location: ${locationUrl} Time: ${new Date().toLocaleString()}`;
      
      // Open SMS app with pre-filled message
      const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
      await Linking.openURL(smsUrl);
      
      Alert.alert(
        'SMS Ready',
        'SMS app opened with emergency message. Add contact numbers and send.'
      );
    } catch (error) {
      console.error('SMS failed:', error);
      Alert.alert('Error', 'Failed to open SMS app');
    }
  }

  // Send WhatsApp message (free)
  static async sendBulkWhatsApp(
    contacts: EmergencyContact[], 
    userName: string, 
    location: LocationData
  ): Promise<void> {
    try {
      const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = `🚨 EMERGENCY ALERT 🚨\n\n${userName} needs immediate help!\n\nLocation: ${locationUrl}\nTime: ${new Date().toLocaleString()}\n\nPlease respond immediately!`;
      
      if (contacts.length > 0) {
        const primaryContact = contacts.sort((a, b) => a.priority - b.priority)[0];
        const whatsappUrl = `whatsapp://send?phone=${primaryContact.phone}&text=${encodeURIComponent(message)}`;
        
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('WhatsApp Not Found', 'WhatsApp is not installed on this device');
        }
      }
    } catch (error) {
      console.error('WhatsApp failed:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  }

  // Complete emergency sequence (free methods only)
  static async triggerEmergencySequence(
    contacts: EmergencyContact[], 
    userName: string, 
    location: LocationData
  ): Promise<{ success: boolean; methods: string[] }> {
    const methods: string[] = [];
    
    try {
      // 1. Make emergency call
      await this.makeEmergencyCall(contacts);
      methods.push('Emergency Call');
      
      // 2. Send SMS
      await this.sendBulkSMS(contacts, userName, location);
      methods.push('SMS Alert');
      
      // 3. Send WhatsApp
      await this.sendBulkWhatsApp(contacts, userName, location);
      methods.push('WhatsApp Alert');
      
      return { success: true, methods };
    } catch (error) {
      console.error('Emergency sequence failed:', error);
      return { success: false, methods };
    }
  }
}