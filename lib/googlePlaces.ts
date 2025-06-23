interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface AddressComponents {
  streetNumber: string;
  route: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export class GooglePlacesService {
  private static instance: GooglePlacesService;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      GooglePlacesService.instance = new GooglePlacesService();
    }
    return GooglePlacesService.instance;
  }

  async getAutocompleteSuggestions(input: string): Promise<PlaceAutocompleteResult[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    if (input.length < 3) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions || [];
      } else if (data.status === 'ZERO_RESULTS') {
        return [];
      } else {
        throw new Error(`Google Places API error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<AddressComponents> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const url = `${this.baseUrl}/details/json?place_id=${placeId}&fields=formatted_address,address_components,geometry&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return this.parseAddressComponents(data.result);
      } else {
        throw new Error(`Google Places API error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  private parseAddressComponents(placeDetails: PlaceDetails): AddressComponents {
    const components = placeDetails.address_components;
    const result: AddressComponents = {
      streetNumber: '',
      route: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      formattedAddress: placeDetails.formatted_address,
    };

    components.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        result.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        result.route = component.long_name;
      } else if (types.includes('locality')) {
        result.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        result.state = component.short_name;
      } else if (types.includes('postal_code')) {
        result.zipCode = component.long_name;
      } else if (types.includes('country')) {
        result.country = component.long_name;
      }
    });

    return result;
  }
}

export const googlePlacesService = GooglePlacesService.getInstance();