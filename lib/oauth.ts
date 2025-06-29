import { Platform } from 'react-native';

// Platform-specific imports with error handling
let GoogleSignin: any = null;
let Settings: any = null;

try {
  if (Platform.OS !== 'web') {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    Settings = require('react-native-fbsdk-next').Settings;
  }
} catch (error) {
  console.warn('OAuth native modules not available:', error);
}

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web' || !GoogleSignin) {
    console.log('Google Sign-In not available on web platform');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.error('Error configuring Google Sign-In:', error);
  }
};

// Configure Facebook SDK
export const configureFacebookSDK = () => {
  if (Platform.OS === 'web' || !Settings) {
    console.log('Facebook SDK not available on web platform');
    return;
  }

  try {
    Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '');
    Settings.initializeSDK();
    console.log('Facebook SDK configured successfully');
  } catch (error) {
    console.error('Error configuring Facebook SDK:', error);
  }
};

// Initialize OAuth providers
export const initializeOAuth = () => {
  try {
    configureGoogleSignIn();
    configureFacebookSDK();
    console.log('OAuth providers initialization completed');
  } catch (error) {
    console.error('Error initializing OAuth providers:', error);
  }
};

// Web-compatible Google Sign-In
export const signInWithGoogleWeb = async () => {
  if (Platform.OS !== 'web') {
    throw new Error('This method is only for web platform');
  }

  // For web, we would typically use Google's JavaScript SDK
  // This is a placeholder for web implementation
  throw new Error('Google Sign-In on web requires additional setup. Please use email/password for now.');
};

// Web-compatible Facebook Sign-In
export const signInWithFacebookWeb = async () => {
  if (Platform.OS !== 'web') {
    throw new Error('This method is only for web platform');
  }

  // For web, we would typically use Facebook's JavaScript SDK
  // This is a placeholder for web implementation
  throw new Error('Facebook Sign-In on web requires additional setup. Please use email/password for now.');
};

// Check if OAuth is available
export const isOAuthAvailable = () => {
  return Platform.OS !== 'web' && GoogleSignin && Settings;
};