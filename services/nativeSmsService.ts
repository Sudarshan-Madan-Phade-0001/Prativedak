import { Linking, Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import SendSMS from 'react-native-sms';

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

export class NativeSmsService {
  
  // Request SMS permission
  static async requestSmsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission',
          message: 'Prativedak needs SMS permission to send emergency alerts',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('SMS permission error:', err);
      return false;
    }
  }

  // Check SMS permission
  static async hasSmsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );
      return hasPermission;
    } catch (err) {
      return false;
    }
  }

  // Send direct SMS using react-native-sms
  static async sendDirectSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // First check if we have SMS permission
      const hasPermission = await this.hasSmsPermission();
      if (!hasPermission) {
        const granted = await this.requestSmsPermission();
        if (!granted) {
          console.log('SMS permission denied');
          return false;
        }
      }

      return new Promise((resolve) => {
        SendSMS.send({
          body: message,
          recipients: [phoneNumber],
          successTypes: ['sent', 'queued'],
          allowAndroidSendWithoutReadPermission: true
        }, (completed, cancelled, error) => {
          if (completed) {
            console.log(`SMS sent successfully to: ${phoneNumber}`);
            resolve(true);
          } else if (cancelled) {
            console.log('SMS sending cancelled');
            resolve(false);
          } else if (error) {
            console.error('SMS sending failed:', error);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  // Send emergency SMS to multiple contacts
  static async sendEmergencySMS(
    contacts: EmergencyContact[], 
    userName: string, 
    location: LocationData
  ): Promise<{ success: boolean; results: any[] }> {
    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const message = `🚨 EMERGENCY ALERT 🚨\n\n${userName} needs immediate help!\n\nLocation: ${locationUrl}\nTime: ${new Date().toLocaleString()}\n\nThis is an automated emergency message from Prativedak Safety App.`;
    
    const results = [];
    let successCount = 0;

    // Sort by priority
    const sortedContacts = contacts.sort((a, b) => a.priority - b.priority);
    
    for (const contact of sortedContacts) {
      try {
        const success = await this.sendDirectSMS(contact.phone, message);
        results.push({
          contact: contact.name,
          phone: contact.phone,
          status: success ? 'sent' : 'failed'
        });
        
        if (success) {
          successCount++;
          console.log(`Emergency SMS sent to ${contact.name}`);
        }
        
        // Wait 1 second between SMS
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          contact: contact.name,
          phone: contact.phone,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      success: successCount > 0,
      results
    };
  }

  // Initialize SMS service
  static async initialize(): Promise<boolean> {
    const hasPermission = await this.hasSmsPermission();
    
    if (!hasPermission) {
      console.log('Requesting SMS permission...');
      return await this.requestSmsPermission();
    }
    
    console.log('SMS permission already granted');
    return true;
  }
}