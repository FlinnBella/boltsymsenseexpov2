import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID, // Optional for iOS
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  });
};

// Configure Facebook SDK
export const configureFacebookSDK = () => {
  if (Platform.OS !== 'web') {
    Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '');
    Settings.initializeSDK();
  }
};

// Initialize OAuth providers
export const initializeOAuth = () => {
  try {
    configureGoogleSignIn();
    configureFacebookSDK();
    console.log('OAuth providers initialized successfully');
  } catch (error) {
    console.error('Error initializing OAuth providers:', error);
  }
};