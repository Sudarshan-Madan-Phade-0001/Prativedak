import { NativeCallService } from './nativeCallService';
import { NativeAutoSmsService } from './nativeAutoSmsService';
import NativeEmergencyService from './nativeEmergencyService';
import { Linking } from 'react-native';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export class BareWorkflowEmergencyService {
  private countdownTimer: NodeJS.Timeout | null = null;

  async triggerFullEmergencySequence(
    user: any,
    location: Location | null,
    onCountdownUpdate?: (seconds: number) => void,
    onEmergencyComplete?: (results: any) => void
  ) {
    console.log('🚨 BARE WORKFLOW: Starting full emergency sequence');
    
    let countdown = 30;
    
    // Update countdown every second
    this.countdownTimer = setInterval(() => {
      countdown--;
      onCountdownUpdate?.(countdown);
      
      if (countdown <= 0) {
        this.clearCountdown();
        this.executeEmergencyActions(user, location, onEmergencyComplete);
      }
    }, 1000);
    
    // Initial countdown update
    onCountdownUpdate?.(countdown);
  }

  private async executeEmergencyActions(
    user: any,
    location: Location | null,
    onComplete?: (results: any) => void
  ) {
    console.log('🚨 EXECUTING EMERGENCY ACTIONS (BARE WORKFLOW)');
    
    const results = {
      smsResults: [],
      callResult: null,
      whatsappResult: null,
      timestamp: new Date().toISOString()
    };

    if (!user?.emergencyContacts?.length) {
      console.log('No emergency contacts - calling emergency services');
      results.callResult = await this.callEmergencyServices();
      onComplete?.(results);
      return;
    }

    let locationText = 'Location: Getting current location...';
    
    // Try multiple methods to get location
    try {
      console.log('📍 Getting location for emergency (multiple attempts)...');
      const Location = require('expo-location');
      
      // Check if location services are enabled
      if (!Location || !Location.hasServicesEnabledAsync) {
        throw new Error('expo-location not properly linked');
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        locationText = 'Location: GPS disabled - please enable location services';
      } else {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          locationText = 'Location: Permission denied';
        } else {
          let position = null;
          
          // Try multiple accuracy levels
          try {
            // First try: High accuracy with timeout
            position = await Promise.race([
              Location.getCurrentPositionAsync({ 
                accuracy: Location.Accuracy.High,
                maximumAge: 5000 
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('High accuracy timeout')), 8000))
            ]);
          } catch (highError) {
            console.log('📍 High accuracy failed, trying balanced...');
            try {
              // Second try: Balanced accuracy
              position = await Promise.race([
                Location.getCurrentPositionAsync({ 
                  accuracy: Location.Accuracy.Balanced,
                  maximumAge: 10000 
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Balanced accuracy timeout')), 5000))
              ]);
            } catch (balancedError) {
              console.log('📍 Balanced failed, trying low accuracy...');
              try {
                // Third try: Low accuracy (most reliable)
                position = await Location.getCurrentPositionAsync({ 
                  accuracy: Location.Accuracy.Low,
                  maximumAge: 30000 
                });
              } catch (lowError) {
                console.log('📍 All GPS attempts failed');
              }
            }
          }
          
          if (position && position.coords && position.coords.latitude && position.coords.longitude) {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            const accuracy = position.coords.accuracy || 'unknown';
            locationText = `Location: ${lat}, ${lng}\nAccuracy: ${accuracy}m\nMap: https://maps.google.com/?q=${lat},${lng}`;
            console.log(`📍 Location obtained: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
          } else {
            throw new Error('No valid coordinates obtained');
          }
        }
      }
    } catch (error) {
      console.error('📍 All location methods failed:', error);
      // Use fallback location if available
      if (location && location.latitude !== 0 && location.longitude !== 0) {
        const lat = location.latitude.toFixed(6);
        const lng = location.longitude.toFixed(6);
        locationText = `Location: ${lat}, ${lng} (cached)\nMap: https://maps.google.com/?q=${lat},${lng}`;
        console.log(`📍 Using cached location: ${lat}, ${lng}`);
      } else {
        locationText = 'Location: GPS unstable - using approximate location\nPlease check GPS settings';
      }
    }

    const emergencyMessage = `🚨 AUTOMATIC EMERGENCY ALERT 🚨\n\nUser: ${user.name}\nTime: ${new Date().toLocaleString()}\n${locationText}\n\nThis is an AUTOMATIC alert from Prativedak Safety App. The user may be in danger and unable to respond.`;

    // Sort contacts by priority
    const sortedContacts = user.emergencyContacts.sort((a: EmergencyContact, b: EmergencyContact) => a.priority - b.priority);

    // 1. Make automatic call to primary contact FIRST
    const primaryContact = sortedContacts[0];
    console.log(`📞 Making DIRECT emergency call to ${primaryContact.name}...`);
    try {
      const callSuccess = await NativeEmergencyService.makeAutomaticCall(primaryContact.phone);
      results.callResult = {
        contact: primaryContact.name,
        phone: primaryContact.phone,
        success: callSuccess,
        automatic: callSuccess
      };
      console.log(`Emergency call: ${callSuccess ? 'DIRECT SUCCESS' : 'FALLBACK TO DIALER'}`);
    } catch (error) {
      console.error('Emergency call failed:', error);
      results.callResult = {
        contact: primaryContact.name,
        phone: primaryContact.phone,
        success: false,
        error: error.message
      };
    }

    // 2. Send automatic SMS to all contacts
    console.log('📱 Sending DIRECT SMS to all emergency contacts...');
    for (const contact of sortedContacts) {
      try {
        const smsSuccess = await NativeEmergencyService.sendAutomaticSMS(contact.phone, emergencyMessage);
        results.smsResults.push({
          contact: contact.name,
          phone: contact.phone,
          success: smsSuccess,
          method: 'DIRECT_SMS'
        });
        console.log(`SMS to ${contact.name}: ${smsSuccess ? 'DIRECT SUCCESS' : 'FALLBACK'}`);
      } catch (error) {
        console.error(`SMS failed for ${contact.name}:`, error);
        results.smsResults.push({
          contact: contact.name,
          phone: contact.phone,
          success: false,
          error: error.message
        });
      }
    }

    // 3. Send WhatsApp to primary contact (after 5 seconds delay)
    console.log('💬 Opening WhatsApp for primary contact after delay...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    try {
      results.whatsappResult = await this.sendWhatsAppEmergency(primaryContact.phone, emergencyMessage);
    } catch (error) {
      console.error('WhatsApp failed:', error);
      results.whatsappResult = { success: false, error: error.message };
    }

    console.log('🚨 Emergency sequence completed:', results);
    onComplete?.(results);
  }



  private async callEmergencyServices(): Promise<any> {
    try {
      // Try automatic call to emergency services
      const success = await NativeCallService.makeEmergencyCall('112');
      return {
        service: 'Emergency Services (112)',
        success: success,
        automatic: success
      };
    } catch (error) {
      return {
        service: 'Emergency Services (112)',
        success: false,
        error: error.message
      };
    }
  }

  cancelEmergencySequence() {
    console.log('Emergency sequence cancelled');
    this.clearCountdown();
  }

  private clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private async sendWhatsAppEmergency(phoneNumber: string, message: string) {
    try {
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      const whatsappNumber = formattedNumber.startsWith('91') ? formattedNumber : `91${formattedNumber}`;
      
      const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return { success: true, method: 'app' };
      } else {
        const webWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webWhatsappUrl);
        return { success: true, method: 'web' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const bareWorkflowEmergencyService = new BareWorkflowEmergencyService();