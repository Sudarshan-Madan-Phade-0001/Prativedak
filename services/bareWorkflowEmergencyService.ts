import { NativeCallService } from './nativeCallService';
import { NativeAutoSmsService } from './nativeAutoSmsService';
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

    const locationText = location 
      ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : 'Location: Unknown';

    const emergencyMessage = `🚨 AUTOMATIC EMERGENCY ALERT 🚨\n\nUser: ${user.name}\nTime: ${new Date().toLocaleString()}\n${locationText}\n\nThis is an AUTOMATIC alert from Prativedak Safety App. The user may be in danger and unable to respond.`;

    // Sort contacts by priority
    const sortedContacts = user.emergencyContacts.sort((a: EmergencyContact, b: EmergencyContact) => a.priority - b.priority);

    // 1. Send automatic SMS to all contacts
    console.log('📱 Sending automatic SMS to all emergency contacts...');
    for (const contact of sortedContacts) {
      try {
        const smsSuccess = await NativeAutoSmsService.sendAutomaticSMS(contact.phone, emergencyMessage);
        results.smsResults.push({
          contact: contact.name,
          phone: contact.phone,
          success: smsSuccess,
          method: 'SMS'
        });
        console.log(`SMS to ${contact.name}: ${smsSuccess ? 'SUCCESS' : 'FALLBACK'}`);
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

    // 2. Make automatic call to primary contact
    const primaryContact = sortedContacts[0];
    console.log(`📞 Making automatic emergency call to ${primaryContact.name}...`);
    try {
      const callSuccess = await NativeCallService.makeEmergencyCall(primaryContact.phone);
      results.callResult = {
        contact: primaryContact.name,
        phone: primaryContact.phone,
        success: callSuccess,
        automatic: callSuccess
      };
      console.log(`Emergency call: ${callSuccess ? 'AUTOMATIC SUCCESS' : 'DIALER OPENED'}`);
    } catch (error) {
      console.error('Emergency call failed:', error);
      results.callResult = {
        contact: primaryContact.name,
        phone: primaryContact.phone,
        success: false,
        error: error.message
      };
    }

    // 3. Send WhatsApp to primary contact
    console.log('💬 Opening WhatsApp for primary contact...');
    try {
      results.whatsappResult = await this.sendWhatsAppEmergency(primaryContact.phone, emergencyMessage);
    } catch (error) {
      console.error('WhatsApp failed:', error);
      results.whatsappResult = { success: false, error: error.message };
    }

    console.log('🚨 Emergency sequence completed:', results);
    onComplete?.(results);
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
}

export const bareWorkflowEmergencyService = new BareWorkflowEmergencyService();