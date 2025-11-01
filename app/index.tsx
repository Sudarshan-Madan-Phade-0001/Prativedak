import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isFirstTime } = useAuth();

  useEffect(() => {
    const navigate = () => {
      if (isFirstTime) {
        router.replace('/onboarding');
      } else if (!isAuthenticated) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
    };
    
    // Small delay to ensure state is properly set
    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isFirstTime]);

  return null;
}