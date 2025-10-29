import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isFirstTime } = useAuth();

  useEffect(() => {
    if (isFirstTime) {
      router.replace('/onboarding');
    } else if (!isAuthenticated) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isFirstTime]);

  return null;
}