import { Linking } from 'react-native';

export class WhatsAppService {
  static async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Format phone number for WhatsApp (remove any non-digits)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Add country code if not present (assuming India +91)
      const whatsappNumber = formattedNumber.startsWith('91') ? formattedNumber : `91${formattedNumber}`;
      
      // Create WhatsApp URL
      const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
      
      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        console.log(`WhatsApp message sent to: ${phoneNumber}`);
        return true;
      } else {
        // Try web WhatsApp as fallback
        const webWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webWhatsappUrl);
        console.log(`Web WhatsApp opened for: ${phoneNumber}`);
        return true;
      }
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      return false;
    }
  }

  static async isWhatsAppInstalled(): Promise<boolean> {
    try {
      return await Linking.canOpenURL('whatsapp://');
    } catch {
      return false;
    }
  }
}