import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/config/firebase';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  lastLoginAt?: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

interface AlertData {
  id: string;
  userId: string;
  type: 'accident' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  sensorData?: any;
  status: 'active' | 'resolved';
}

export class FirebaseService {
  async register(email: string, password: string, userData: Partial<User>) {
    try {
      console.log('Attempting Firebase registration...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = {
        id: user.uid,
        email: user.email,
        name: userData.name || '',
        phone: userData.phone || '',
        vehicleNumber: userData.vehicleNumber || '',
        emergencyContacts: userData.emergencyContacts || [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log('Firebase registration successful');
      return { success: true, user: userDoc };
    } catch (error: any) {
      console.error('Firebase registration error:', error.code, error.message);
      
      // Use fallback for configuration errors
      if (error.code === 'auth/configuration-not-found') {
        console.log('Firebase not configured, using AsyncStorage fallback');
        return this.registerFallback(email, password, userData);
      }
      
      let message = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please try a different password.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      }
      
      return { success: false, message };
    }
  }
  
  // Registration using AsyncStorage
  private async registerFallback(email: string, password: string, userData: Partial<User>) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Check if user already exists
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      if (users.find((u: any) => u.email === email)) {
        return { success: false, message: 'An account with this email already exists. Please login instead.' };
      }
      
      const newUser = {
        id: Date.now().toString(),
        email: email,
        name: userData.name || '',
        phone: userData.phone || '',
        vehicleNumber: userData.vehicleNumber || '',
        emergencyContacts: userData.emergencyContacts || [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        password: password // Store for fallback login
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Store current user
      await AsyncStorage.setItem('current_user', JSON.stringify(newUser));
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Fallback registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('Attempting Firebase login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date().toISOString()
      });
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        console.log('Firebase login successful');
        return { success: true, user: userDoc.data() as User };
      } else {
        return { success: false, message: 'User data not found' };
      }
    } catch (error: any) {
      console.error('Firebase login error:', error.code, error.message);
      
      // Use fallback for configuration errors
      if (error.code === 'auth/configuration-not-found') {
        console.log('Firebase not configured, using AsyncStorage fallback');
        return this.loginFallback(email, password);
      }
      
      let message = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Account not found. Please check your email or sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      }
      
      return { success: false, message };
    }
  }
  
  // Login using AsyncStorage
  private async loginFallback(email: string, password: string) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        return { success: false, message: 'Account not found. Please check your email or sign up first.' };
      }
      
      // Update last login time
      user.lastLoginAt = new Date().toISOString();
      const userIndex = users.findIndex((u: any) => u.email === email);
      users[userIndex] = user;
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Store current user
      await AsyncStorage.setItem('current_user', JSON.stringify(user));
      
      return { success: true, user };
    } catch (error) {
      console.error('Fallback login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async updateProfile(userId: string, userData: Partial<User>) {
    try {
      await updateDoc(doc(db, 'users', userId), userData);
      const updatedDoc = await getDoc(doc(db, 'users', userId));
      return { success: true, user: updatedDoc.data() as User };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Fallback to AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const currentUserData = await AsyncStorage.getItem('current_user');
        return currentUserData ? JSON.parse(currentUserData) : null;
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      return userDoc.exists() ? userDoc.data() as User : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Fallback to AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const currentUserData = await AsyncStorage.getItem('current_user');
        return currentUserData ? JSON.parse(currentUserData) : null;
      } catch {
        return null;
      }
    }
  }

  async saveAlert(alertData: Omit<AlertData, 'id'>) {
    try {
      const alertDoc = {
        ...alertData,
        id: Date.now().toString()
      };
      
      await setDoc(doc(db, 'alerts', alertDoc.id), alertDoc);
      return { success: true, alert: alertDoc };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getUserAlerts(userId: string) {
    try {
      const alertsRef = collection(db, 'alerts');
      const q = query(alertsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const alerts: AlertData[] = [];
      querySnapshot.forEach((doc) => {
        alerts.push(doc.data() as AlertData);
      });
      
      return { success: true, alerts };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const firebaseService = new FirebaseService();