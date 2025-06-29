# SymSense Health App

A comprehensive health tracking application built with React Native and Expo.

## Setup Instructions

### Prerequisites

1. **Node.js** (v18 or later)
2. **Expo CLI** (`npm install -g @expo/cli`)
3. **EAS CLI** (`npm install -g eas-cli`)

### OAuth Setup (Required for Google/Facebook Sign-In)

#### Google Sign-In Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web client ID**: For general OAuth
   - **Android client ID**: For Android app
   - **iOS client ID**: For iOS app
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
6. Place these files in the project root
7. Update `.env` with your `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`

#### Facebook Sign-In Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Update `.env` with your `EXPO_PUBLIC_FACEBOOK_APP_ID`

### Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in all required environment variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
   EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
   RESEND_API_KEY=your-resend-api-key
   ```

### Installation & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Prebuild native code (REQUIRED for OAuth):**
   ```bash
   expo prebuild --clean
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Run on device/simulator:**
   ```bash
   # For iOS
   npm run ios
   
   # For Android  
   npm run android
   ```

### Important Notes

- **OAuth requires native build**: Google and Facebook Sign-In only work in native builds, not in Expo Go
- **Run prebuild after OAuth setup**: Always run `expo prebuild --clean` after adding OAuth configuration
- **Google Services files**: Make sure `google-services.json` and `GoogleService-Info.plist` are in project root
- **Bundle identifiers**: Ensure bundle IDs match in app.json, Google Console, and Facebook Console

### Troubleshooting

#### "RNGoogleSignin could not be found" Error

This error occurs when the native module isn't properly linked. To fix:

1. Run `expo prebuild --clean`
2. Rebuild the app with `expo run:ios` or `expo run:android`
3. Ensure Google Services files are in place
4. Verify environment variables are set correctly

#### OAuth Not Working

1. Check that bundle identifiers match across all platforms
2. Verify OAuth redirect URIs are configured correctly
3. Ensure you're testing on a physical device or proper simulator
4. Check that Google Play Services are available (Android)

### Features

- 🔐 **Authentication**: Email/password, Google, and Facebook sign-in
- 📧 **Email Verification**: Automated email verification with Resend
- 🏥 **Health Tracking**: Symptoms, medications, food logging
- 📊 **Analytics**: Health statistics and trends
- 🤖 **AI Chat**: Health assistant powered by AI
- 🎨 **Theming**: Light/dark mode support
- 📱 **Cross-platform**: iOS and Android support

### Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Database**: Supabase
- **Authentication**: Supabase Auth + OAuth
- **Styling**: React Native StyleSheet
- **Email**: Resend API
- **Icons**: Lucide React Native

## License

MIT License