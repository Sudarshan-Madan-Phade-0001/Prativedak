import { Linking } from 'react-native';
import { NativeSmsService } from './nativeSmsService';

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
    
    // Update countdown every second
    this.countdownTimer = setInterval(() => {
      countdown--;
      onCountdownUpdate?.(countdown);
      
      if (countdown <= 0) {
        this.clearCountdown();
        this.sendEmergencyMessages(user, location);
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

    const locationText = location 
      ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : 'Location: Unknown';

    const message = `🚨 EMERGENCY ALERT 🚨\n\nUser: ${user.name || 'Unknown'}\nTime: ${new Date().toLocaleString()}\n${locationText}\n\nThis is an automatic emergency alert from Prativedak Safety App.`;

    // Sort contacts by priority
    const sortedContacts = user.emergencyContacts.sort((a: EmergencyContact, b: EmergencyContact) => a.priority - b.priority);

    for (const contact of sortedContacts) {
      try {
        // Send SMS
        await this.sendSMS(contact.phone, message);
        
        // Send WhatsApp
        await this.sendWhatsApp(contact.phone, message);
        
        console.log(`Emergency messages sent to ${contact.name} (${contact.phone})`);
      } catch (error) {
        console.error(`Failed to send emergency message to ${contact.name}:`, error);
      }
    }
  }

  private async sendSMS(phoneNumber: string, message: string) {
    try {
      await NativeSmsService.sendDirectSMS(phoneNumber, message);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  private async sendWhatsApp(phoneNumber: string, message: string) {
    try {
      // Format phone number for WhatsApp (remove any non-digits and add country code if needed)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      const whatsappNumber = formattedNumber.startsWith('91') ? formattedNumber : `91${formattedNumber}`;
      
      const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      throw error;
    }
  }
}

export const emergencyService = new EmergencyService();