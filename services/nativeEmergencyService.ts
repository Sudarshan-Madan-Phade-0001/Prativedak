import { NativeModules } from 'react-native';

const { AutoEmergencyModule } = NativeModules;

// Debug: Check if native module is loaded
console.log('🔍 Available Native Modules:', Object.keys(NativeModules));
console.log('🔍 AutoEmergencyModule available:', !!AutoEmergencyModule);
if (AutoEmergencyModule) {
  console.log('✅ Native emergency module loaded successfully');
} else {
  console.log('❌ Native emergency module NOT loaded');
}

export class NativeEmergencyService {
  
  static async requestPermissions(): Promise<boolean> {
    try {
      if (AutoEmergencyModule) {
        await AutoEmergencyModule.requestPermissions();
        console.log('✅ Permissions requested');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }
  
  static async sendAutomaticSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log(`📱 Sending DIRECT SMS to ${phoneNumber}`);
      
      if (AutoEmergencyModule) {
        console.log('📱 Using NATIVE SMS module for direct sending');
        const result = await AutoEmergencyModule.sendAutomaticSMS(phoneNumber, message);
        console.log(`✅ DIRECT SMS sent to ${phoneNumber}`);
        return result;
      } else {
        console.log('❌ Native module not available');
        return false;
      }
    } catch (error) {
      console.error('❌ Direct SMS failed:', error);
      return false;
    }
  }

  static async makeAutomaticCall(phoneNumber: string): Promise<boolean> {
    try {
      console.log(`🔍 Attempting native call to ${phoneNumber}`);
      console.log(`🔍 AutoEmergencyModule exists: ${!!AutoEmergencyModule}`);
      
      if (AutoEmergencyModule) {
        console.log('📞 Using NATIVE CALL module');
        const result = await AutoEmergencyModule.makeAutomaticCall(phoneNumber);
        console.log(`✅ NATIVE CALL made to ${phoneNumber}`);
        return result;
      } else {
        console.log('❌ Native module not available - falling back to dialer');
        const { Linking } = require('react-native');
        await Linking.openURL(`tel:${phoneNumber}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Automatic call failed:', error);
      return false;
    }
  }

  static async sendBulkSMS(phoneNumbers: string[], message: string): Promise<number> {
    try {
      if (AutoEmergencyModule) {
        console.log(`📱 Sending DIRECT bulk SMS to ${phoneNumbers.length} contacts`);
        const successCount = await AutoEmergencyModule.sendBulkSMS(phoneNumbers, message);
        console.log(`✅ DIRECT bulk SMS sent: ${successCount}/${phoneNumbers.length}`);
        return successCount;
      } else {
        console.log('❌ Native module not available');
        return 0;
      }
    } catch (error) {
      console.error('❌ Direct bulk SMS failed:', error);
      return 0;
    }
  }
}

export default NativeEmergencyService;