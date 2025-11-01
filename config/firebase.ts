import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD0obZpx8IznjCSY1D255iWYlZ-NsiyovA",
  authDomain: "prativedak-e4f52.firebaseapp.com",
  projectId: "prativedak-e4f52",
  storageBucket: "prativedak-e4f52.firebasestorage.app",
  messagingSenderId: "86500982345",
  appId: "1:86500902345:web:465c24ddb487c9653b8998"
};

let app, db, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { db, auth };
export default app;