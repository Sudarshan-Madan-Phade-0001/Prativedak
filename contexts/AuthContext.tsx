import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';

interface EmergencyContact {
  name: string;
  phone: string;
  priority: number;
  relationship: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleNumber: string;
  emergencyContacts: EmergencyContact[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isFirstTime: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const [authenticated, hasOnboarded, currentUser] = await Promise.all([
        authService.isAuthenticated(),
        AsyncStorage.getItem('hasOnboarded'),
        authService.getCurrentUser()
      ]);
      
      setIsAuthenticated(authenticated);
      setIsFirstTime(!hasOnboarded);
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setIsAuthenticated(true);
      setUser(result.user);
    }
    return result;
  };

  const register = async (userData: RegisterData) => {
    const result = await authService.register(userData);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const updateProfile = async (userData: Partial<User>) => {
    const result = await authService.updateProfile(userData);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    setIsFirstTime(false);
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isFirstTime, user, login, register, logout, completeOnboarding, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};