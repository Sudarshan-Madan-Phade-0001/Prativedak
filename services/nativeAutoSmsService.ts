import { NativeModules, Platform } from 'react-native';

// For bare workflow - automatic SMS sending without user interaction
export class NativeAutoSmsService {
  static async sendAutomaticSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Use Android's SmsManager for automatic SMS sending
        const { RNAutoSMS } = NativeModules;
        if (RNAutoSMS) {
          await RNAutoSMS.sendSMS(phoneNumber, message);
          console.log(`Automatic SMS sent to: ${phoneNumber}`);
          return true;
        }
      }
      
      // Fallback to SMS app
      const { Linking } = require('react-native');
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      await Linking.openURL(smsUrl);
      console.log('Opened SMS app - user needs to tap send');
      return false;
    } catch (error) {
      console.error('Automatic SMS failed:', error);
      return false;
    }
  }

  static async sendBulkEmergencySMS(contacts: any[], message: string): Promise<number> {
    let sentCount = 0;
    
    for (const contact of contacts) {
      try {
        const success = await this.sendAutomaticSMS(contact.phone, message);
        if (success) sentCount++;
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to send SMS to ${contact.name}:`, error);
      }
    }
    
    return sentCount;
  }
}

// Native module interface for Android
export interface RNAutoSMSModule {
  sendSMS(phoneNumber: string, message: string): Promise<boolean>;
  sendBulkSMS(contacts: string[], message: string): Promise<number>;
}