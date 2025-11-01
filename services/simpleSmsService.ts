import { NativeModules, Platform, Linking } from 'react-native';

interface SmsResult {
  success: boolean;
  message: string;
}

export class SimpleSmsService {
  static async sendSMS(phoneNumber: string, message: string): Promise<SmsResult> {
    try {
      if (Platform.OS === 'android') {
        // Try native module first
        const { RNDirectSms } = NativeModules;
        
        if (RNDirectSms) {
          try {
            await RNDirectSms.sendDirectSms(phoneNumber, message);
            console.log(`✅ SMS sent via native module to: ${phoneNumber}`);
            return { success: true, message: 'SMS sent via native module' };
          } catch (nativeError) {
            console.log('Native SMS failed, using SMS app:', nativeError);
          }
        }
      }
      
      // Fallback to SMS app
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      await Linking.openURL(smsUrl);
      console.log(`📱 SMS app opened for: ${phoneNumber}`);
      return { success: true, message: 'SMS app opened' };
      
    } catch (error: any) {
      console.error('❌ All SMS methods failed:', error);
      return { success: false, message: error.message || 'SMS sending failed' };
    }
  }

  static async sendMultipleSMS(contacts: Array<{phone: string, name: string}>, message: string): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const result = await this.sendSMS(contact.phone, message);
        if (result.success) {
          sent++;
          console.log(`✅ SMS sent to ${contact.name}`);
        } else {
          failed++;
          console.log(`❌ SMS failed to ${contact.name}`);
        }
        
        // Wait 500ms between SMS to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.error(`❌ Error sending to ${contact.name}:`, error);
      }
    }

    return { sent, failed };
  }
}