import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';

export class DataClearService {
  async clearAllData() {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Sign out from Firebase
      if (auth.currentUser) {
        await signOut(auth);
      }
      
      console.log('All data cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error };
    }
  }
}

export const dataClearService = new DataClearService();