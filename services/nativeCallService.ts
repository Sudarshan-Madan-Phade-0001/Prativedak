import { NativeModules, Platform } from 'react-native';

// For bare workflow - automatic calling without user interaction
export class NativeCallService {
  static async makeAutomaticCall(phoneNumber: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Use Android's TelecomManager for automatic calling
        const { RNDirectCall } = NativeModules;
        if (RNDirectCall) {
          await RNDirectCall.makeCall(phoneNumber);
          return true;
        }
      }
      
      // Fallback to regular dialer
      const { Linking } = require('react-native');
      await Linking.openURL(`tel:${phoneNumber}`);
      return false; // User still needs to tap
    } catch (error) {
      console.error('Automatic call failed:', error);
      return false;
    }
  }

  static async makeEmergencyCall(phoneNumber: string): Promise<boolean> {
    try {
      console.log(`Making automatic emergency call to: ${phoneNumber}`);
      
      if (Platform.OS === 'android') {
        // For bare workflow - direct call without user interaction
        const { RNEmergencyCall } = NativeModules;
        if (RNEmergencyCall) {
          const result = await RNEmergencyCall.makeEmergencyCall(phoneNumber);
          console.log('Emergency call initiated automatically');
          return result;
        }
      }
      
      // Fallback for Expo Go
      const { Linking } = require('react-native');
      await Linking.openURL(`tel:${phoneNumber}`);
      console.log('Opened dialer - user needs to tap call');
      return false;
    } catch (error) {
      console.error('Emergency call failed:', error);
      return false;
    }
  }
}

// Native module interface for Android
export interface RNDirectCallModule {
  makeCall(phoneNumber: string): Promise<boolean>;
  makeEmergencyCall(phoneNumber: string): Promise<boolean>;
}