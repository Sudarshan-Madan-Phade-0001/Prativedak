import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from './firebaseService';
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

class AuthService {
  private readonly STORAGE_KEYS = {
    USER: 'user_data',
    IS_FIRST_TIME: 'is_first_time',
    AUTH_TOKEN: 'auth_token'
  };



  // Check if first time user
  async isFirstTime(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.STORAGE_KEYS.IS_FIRST_TIME);
      return value === null;
    } catch (error) {
      console.error('Error checking first time:', error);
      return true;
    }
  }

  // Complete onboarding
  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.IS_FIRST_TIME, 'false');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }

  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
      }
      
      const result = await firebaseService.login(email, password);
      if (result.success && result.user) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(result.user));
        await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, 'firebase_token');
        return { success: true, message: 'Login successful', user: result.user };
      }
      
      return { success: false, message: result.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Register user
  async register(userData: any): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      if (!userData.name || !userData.email || !userData.password) {
        return { success: false, message: 'Name, email and password are required' };
      }

      const result = await firebaseService.register(userData.email, userData.password, userData);
      if (result.success && result.user) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(result.user));
        await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, 'firebase_token');
        return { success: true, message: 'Registration successful', user: result.user };
      }
      
      return { success: false, message: result.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      return await firebaseService.getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const currentUser = await AsyncStorage.getItem('current_user');
      return currentUser !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USER,
        this.STORAGE_KEYS.AUTH_TOKEN,
        'current_user'
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'User not found' };
      }

      // Update in Firebase
      const result = await firebaseService.updateProfile(currentUser.id, userData);
      if (result.success && result.user) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(result.user));
        return { success: true, message: 'Profile updated successfully', user: result.user };
      }
      
      return { success: false, message: result.message || 'Profile update failed' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  }
}

export const authService = new AuthService();