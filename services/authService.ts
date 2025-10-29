import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateEmail, isPasswordValid } from '@/utils/validation';

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
  password: string;
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

interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
}

class AuthService {
  private readonly USERS_KEY = 'app_users';
  private readonly CURRENT_USER_KEY = 'current_user';
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { name, email, password, phone, vehicleNumber, emergencyContacts } = userData;
    
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim() || !vehicleNumber.trim()) {
      return { success: false, message: 'All fields are required' };
    }

    if (!validateEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    if (!isPasswordValid(password)) {
      return { success: false, message: 'Password must be at least 5 characters' };
    }

    const users = await this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'Email already registered' };
    }

    const user: User = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      phone: phone.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      emergencyContacts: emergencyContacts || [],
      password: btoa(password + 'salt'),
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, message: 'Registration successful', user: userWithoutPassword };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email.trim() || !password.trim()) {
      return { success: false, message: 'Email and password are required' };
    }

    if (!validateEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    const users = await this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || btoa(password + 'salt') !== user.password) {
      return { success: false, message: 'Invalid email or password' };
    }

    const token = btoa(`${user.id}_${Date.now()}`);
    await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, token);
    
    const { password: _, ...userWithoutPassword } = user;
    await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

    return { success: true, message: 'Login successful', user: userWithoutPassword };
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([this.AUTH_TOKEN_KEY, this.CURRENT_USER_KEY]);
  }

  async getCurrentUser(): Promise<Omit<User, 'password'> | null> {
    try {
      const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
      if (!token) return null;
      const userStr = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      // Ensure emergencyContacts is always an array
      if (!user.emergencyContacts) {
        user.emergencyContacts = [];
      }
      return user;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    return !!token;
  }

  async updateProfile(userData: Partial<User>): Promise<AuthResponse> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'User not found' };
      }

      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }

      // Update user data
      const updatedUser = { ...users[userIndex], ...userData };
      users[userIndex] = updatedUser;
      
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      // Update current user in storage
      const { password: _, ...userWithoutPassword } = updatedUser;
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      
      return { success: true, message: 'Profile updated successfully', user: userWithoutPassword };
    } catch (error) {
      return { success: false, message: 'Failed to update profile' };
    }
  }

  private async getUsers(): Promise<User[]> {
    try {
      const usersStr = await AsyncStorage.getItem(this.USERS_KEY);
      return usersStr ? JSON.parse(usersStr) : [];
    } catch {
      return [];
    }
  }
}

export const authService = new AuthService();