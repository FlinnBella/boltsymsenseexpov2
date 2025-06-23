import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { googlePlacesService } from '@/lib/googlePlaces';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect: (address: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  }) => void;
  placeholder?: string;
  style?: any;
}

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onAddressSelect,
  placeholder = "Street Address",
  style,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const [lastSelectedValue, setLastSelectedValue] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search for very short inputs
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check if user has manually edited the address after selection
    if (hasSelectedAddress && value !== lastSelectedValue) {
      // User is editing the previously selected address
      setHasSelectedAddress(false);
      setLastSelectedValue('');
    }

    // Don't show suggestions if user has already selected an address and hasn't changed it
    if (hasSelectedAddress && value === lastSelectedValue) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the API call
    debounceRef.current = setTimeout(async () => {
      await fetchSuggestions(value);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, hasSelectedAddress, lastSelectedValue]);

  const fetchSuggestions = async (input: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await googlePlacesService.getAutocompleteSuggestions(input);
      setSuggestions(results);
      setShowSuggestions(results.length > 0 && !hasSelectedAddress);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Unable to fetch address suggestions. Please check your internet connection.');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: Suggestion) => {
    try {
      setLoading(true);
      setShowSuggestions(false);
      setError(null);
      
      const addressDetails = await googlePlacesService.getPlaceDetails(suggestion.place_id);
      
      // Combine street number and route for full street address
      const streetAddress = `${addressDetails.streetNumber} ${addressDetails.route}`.trim();
      const finalAddress = streetAddress || addressDetails.formattedAddress;
      
      // Mark that user has selected an address
      setHasSelectedAddress(true);
      setLastSelectedValue(finalAddress);
      
      // Call the parent callback with the address data
      onAddressSelect({
        streetAddress: finalAddress,
        city: addressDetails.city,
        state: addressDetails.state,
        zipCode: addressDetails.zipCode,
      });
      
      // Update the input field
      onChangeText(finalAddress);
      
    } catch (err) {
      console.error('Error getting place details:', err);
      setError('Unable to get address details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // If user clears the input or significantly changes it, reset selection state
    if (hasSelectedAddress && (text.length === 0 || Math.abs(text.length - lastSelectedValue.length) > 5)) {
      setHasSelectedAddress(false);
      setLastSelectedValue('');
    }
  };

  const handleFocus = () => {
    // Only show suggestions if user hasn't selected an address or if they've modified it
    if (!hasSelectedAddress && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const renderSuggestion = ({ item, index }: { item: Suggestion; index: number }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        index === suggestions.length - 1 && styles.lastSuggestionItem
      ]}
      onPress={() => handleSuggestionSelect(item)}
    >
      <MapPin color="#6B7280" size={16} style={styles.suggestionIcon} />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionMain}>{item.structured_formatting.main_text}</Text>
        <Text style={styles.suggestionSecondary}>{item.structured_formatting.secondary_text}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <MapPin color="#6B7280" size={20} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleTextChange}
          autoCapitalize="words"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {loading && (
          <ActivityIndicator size="small" color="#6B7280" style={styles.loadingIndicator} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && !hasSelectedAddress && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.place_id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={false}
            scrollEnabled={true}
          />
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1001,
  },
  suggestionsList: {
    borderRadius: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 16,
  },
});