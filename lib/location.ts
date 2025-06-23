import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  zipCode: string;
  city: string;
  state: string;
  country: string;
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'LOCATION_UNAVAILABLE' | 'GEOCODING_FAILED' | 'UNKNOWN_ERROR';
  message: string;
}

/**
 * Requests location permission from the user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Gets the user's current location and converts it to address information including zip code
 */
export const getCurrentLocationWithZipCode = async (): Promise<LocationData | LocationError> => {
  try {
    // Check if location services are enabled
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      return {
        code: 'LOCATION_UNAVAILABLE',
        message: 'Location services are not enabled. Please enable location services and try again.'
      };
    }

    // Request permission
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return {
        code: 'PERMISSION_DENIED',
        message: 'Location permission is required to find doctors near you.'
      };
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
    });

    const { latitude, longitude } = location.coords;

    // Reverse geocode to get address information
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (reverseGeocode.length === 0) {
      return {
        code: 'GEOCODING_FAILED',
        message: 'Unable to determine your address from your location.'
      };
    }

    const address = reverseGeocode[0];

    // Extract zip code (postal code)
    const zipCode = address.postalCode;
    if (!zipCode) {
      return {
        code: 'GEOCODING_FAILED',
        message: 'Unable to determine your zip code from your location.'
      };
    }

    return {
      latitude,
      longitude,
      zipCode,
      city: address.city || '',
      state: address.region || '',
      country: address.country || '',
    };

  } catch (error) {
    console.error('Error getting location:', error);
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while getting your location.'
    };
  }
};

/**
 * Shows a user-friendly alert for location permission
 */
export const showLocationPermissionAlert = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Location Access',
      'We need access to your location to find doctors near you. This helps us provide personalized healthcare recommendations.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Allow Location',
          onPress: () => resolve(true),
        },
      ]
    );
  });
}; 