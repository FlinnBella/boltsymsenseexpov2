import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Import native modules with proper error handling
let GoogleSignin: any = null;
let Settings: any = null;

// Only import on native platforms
if (Platform.OS !== 'web') {
  try {
    const googleModule = require('@react-native-google-signin/google-signin');
    const facebookModule = require('react-native-fbsdk-next');
    
    GoogleSignin = googleModule.GoogleSignin;
    Settings = facebookModule.Settings;
    
    console.log('✅ OAuth native modules loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load OAuth native modules:', error);
    console.log('📱 Make sure you have run "expo prebuild" and built the native app');
  }
}

// Configure Google Sign-In for native platforms only
export const configureGoogleSignIn = async () => {
  if (Platform.OS === 'web') {
    console.log('🌐 Google Sign-In not configured for web platform');
    return false;
  }

  if (!GoogleSignin) {
    console.error('❌ Google Sign-In module not available. Run "expo prebuild" and rebuild the app.');
    return false;
  }

  try {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    
    if (!webClientId) {
      console.error('❌ EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID not found in environment variables');
      return false;
    }

    await GoogleSignin.configure({
      webClientId: webClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      accountName: '',
      iosClientId: webClientId, // Use same client ID for iOS
      googleServicePlistPath: '', // Path to GoogleService-Info.plist
    });
    
    console.log('✅ Google Sign-In configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Error configuring Google Sign-In:', error);
    return false;
  }
};

// Configure Facebook SDK for native platforms only
export const configureFacebookSDK = () => {
  if (Platform.OS === 'web') {
    console.log('🌐 Facebook SDK not configured for web platform');
    return false;
  }

  if (!Settings) {
    console.error('❌ Facebook SDK module not available. Run "expo prebuild" and rebuild the app.');
    return false;
  }

  try {
    const appId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
    
    if (!appId) {
      console.error('❌ EXPO_PUBLIC_FACEBOOK_APP_ID not found in environment variables');
      return false;
    }

    Settings.setAppID(appId);
    Settings.initializeSDK();
    
    console.log('✅ Facebook SDK configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Error configuring Facebook SDK:', error);
    return false;
  }
};

// Initialize OAuth providers
export const initializeOAuth = async () => {
  if (Platform.OS === 'web') {
    console.log('🌐 OAuth initialization skipped for web platform');
    return;
  }

  console.log('📱 Initializing OAuth providers for native platform...');
  
  try {
    const googleConfigured = await configureGoogleSignIn();
    const facebookConfigured = configureFacebookSDK();
    
    if (!googleConfigured && !facebookConfigured) {
      console.warn('⚠️ No OAuth providers configured successfully');
      console.log('💡 To fix this:');
      console.log('1. Run "expo prebuild --clean"');
      console.log('2. Build the app with "expo run:ios" or "expo run:android"');
      console.log('3. Make sure Google Services files are in place');
    } else {
      console.log('✅ OAuth providers initialization completed');
    }
  } catch (error) {
    console.error('❌ Error initializing OAuth providers:', error);
  }
};

// Check if native OAuth is available
export const isNativeOAuthAvailable = () => {
  return Platform.OS !== 'web' && GoogleSignin && Settings;
};

// Check if Google Sign-In is properly configured
export const isGoogleSignInAvailable = async () => {
  if (Platform.OS === 'web' || !GoogleSignin) {
    return false;
  }

  try {
    // Check if Google Play Services are available (Android)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    return true;
  } catch (error) {
    console.error('Google Play Services not available:', error);
    return false;
  }
};

// Show helpful error message for OAuth setup
export const showOAuthSetupError = (provider: 'google' | 'facebook') => {
  const providerName = provider === 'google' ? 'Google' : 'Facebook';
  
  Alert.alert(
    `${providerName} Sign-In Not Available`,
    `${providerName} Sign-In requires a native build. Please use email/password authentication or contact support.`,
    [
      { text: 'OK', style: 'default' }
    ]
  );
};