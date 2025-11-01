import { Linking } from 'react-native';
import { SimpleSmsService } from './simpleSmsService';
import * as Location from 'expo-location';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
}

export class EmergencyService {
  private countdownTimer: NodeJS.Timeout | null = null;

  async triggerEmergencyAlert(
    user: any,
    location: Location | null,
    onCountdownUpdate?: (seconds: number) => void,
    onEmergencySent?: () => void
  ) {
    console.log('Emergency alert triggered - starting 30 second countdown');
    
    let countdown = 30;
    let currentLocation = location;
    
    // Try to get fresh location immediately
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 5000,
      });
      
      currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp,
        address: 'Getting address...'
      };
      
      // Try to get address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const fullAddress = `${addr.name || ''} ${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          currentLocation.address = fullAddress || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        }
      } catch (geocodeError) {
        currentLocation.address = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      }
    } catch (locationError) {
      console.log('Could not get fresh location:', locationError);
    }
    
    // Update countdown every second
    this.countdownTimer = setInterval(() => {
      countdown--;
      onCountdownUpdate?.(countdown);
      
      if (countdown <= 0) {
        this.clearCountdown();
        this.sendEmergencyMessages(user, currentLocation);
        onEmergencySent?.();
      }
    }, 1000);
    
    // Initial countdown update
    onCountdownUpdate?.(countdown);
  }

  cancelEmergencyAlert() {
    console.log('Emergency alert cancelled');
    this.clearCountdown();
  }

  private clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private async sendEmergencyMessages(user: any, location: Location | null) {
    if (!user?.emergencyContacts?.length) {
      console.log('No emergency contacts found');
      return;
    }

    // Get current location text
    let locationText = 'Location: GPS unavailable';
    if (location && location.latitude !== 0 && location.longitude !== 0) {
      const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      const mapLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      locationText = location.address && location.address !== 'Address lookup in progress...' 
        ? `Location: ${location.address}\nCoordinates: ${coords}\nMap: ${mapLink}`
        : `Location: ${coords}\nMap: ${mapLink}`;
    }

    const message = `🚨 EMERGENCY ALERT 🚨\n\nUser: ${user.name || 'Unknown'}\nPhone: ${user.phone || 'Not available'}\nTime: ${new Date().toLocaleString()}\n\n${locationText}\n\nThis is an AUTOMATIC alert from Prativedak Safety App. The user may be in danger and unable to respond.`;

    // Sort contacts by priority
    const sortedContacts = user.emergencyContacts.sort((a: EmergencyContact, b: EmergencyContact) => a.priority - b.priority);

    // First make calls to all contacts
    for (const contact of sortedContacts) {
      try {
        const callUrl = `tel:${contact.phone}`;
        await Linking.openURL(callUrl);
        console.log(`📞 Emergency call initiated to ${contact.name}`);
        
        // Wait 2 seconds between calls
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to call ${contact.name}:`, error);
      }
    }

    // Then send SMS to all contacts
    console.log(`📱 Starting SMS sending to ${sortedContacts.length} contacts`);
    for (const contact of sortedContacts) {
      try {
        console.log(`📱 Attempting SMS to ${contact.name} (${contact.phone})`);
        const smsSuccess = await this.sendSMS(contact.phone, message);
        console.log(`📱 SMS result for ${contact.name}: ${smsSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        // Wait 1 second between SMS
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to send SMS to ${contact.name}:`, error);
      }
    }
    console.log(`📱 Finished SMS sending process`);
  }

  private async sendSMS(phoneNumber: string, message: string) {
    try {
      console.log(`📱 Calling SimpleSmsService.sendSMS for ${phoneNumber}`);
      const result = await SimpleSmsService.sendSMS(phoneNumber, message);
      console.log(`📱 SimpleSmsService result:`, result);
      if (!result.success) {
        console.error('SMS sending failed:', result.message);
      }
      return result.success;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }


}

export const emergencyService = new EmergencyService();