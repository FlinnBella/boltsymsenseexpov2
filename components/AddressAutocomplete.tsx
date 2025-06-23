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

interface MockSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  mock_details: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Mock data for demonstration (since Google Places API key might not be configured)
const MOCK_SUGGESTIONS: MockSuggestion[] = [
  {
    place_id: '1',
    description: '75 Wolf Branch Rd, Albany, NY 12205, USA',
    structured_formatting: {
      main_text: '75 Wolf Branch Rd',
      secondary_text: 'Albany, NY 12205, USA'
    },
    mock_details: {
      streetAddress: '75 Wolf Branch Rd',
      city: 'Albany',
      state: 'NY',
      zipCode: '12205'
    }
  },
  {
    place_id: '2',
    description: '75 Wolf Branch Dr, Colonie, NY 12205, USA',
    structured_formatting: {
      main_text: '75 Wolf Branch Dr',
      secondary_text: 'Colonie, NY 12205, USA'
    },
    mock_details: {
      streetAddress: '75 Wolf Branch Dr',
      city: 'Colonie',
      state: 'NY',
      zipCode: '12205'
    }
  },
  {
    place_id: '3',
    description: '75 Wolf Branch Ln, Latham, NY 12110, USA',
    structured_formatting: {
      main_text: '75 Wolf Branch Ln',
      secondary_text: 'Latham, NY 12110, USA'
    },
    mock_details: {
      streetAddress: '75 Wolf Branch Ln',
      city: 'Latham',
      state: 'NY',
      zipCode: '12110'
    }
  }
];

export default function AddressAutocomplete({
  value,
  onChangeText,
  onAddressSelect,
  placeholder = "Street Address",
  style,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MockSuggestion[]>([]);
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

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Filter mock suggestions based on input
      const filteredSuggestions = MOCK_SUGGESTIONS.filter(suggestion =>
        suggestion.description.toLowerCase().includes(input.toLowerCase())
      );
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0 && !hasSelectedAddress);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Unable to fetch address suggestions. Please check your internet connection.');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: MockSuggestion) => {
    try {
      setLoading(true);
      setShowSuggestions(false);
      setError(null);
      
      // Use mock details for demonstration
      const addressDetails = suggestion.mock_details;
      
      // Mark that user has selected an address
      setHasSelectedAddress(true);
      setLastSelectedValue(addressDetails.streetAddress);
      
      // Call the parent callback with the address data
      onAddressSelect({
        streetAddress: addressDetails.streetAddress,
        city: addressDetails.city,
        state: addressDetails.state,
        zipCode: addressDetails.zipCode,
      });
      
      // Update the input field
      onChangeText(addressDetails.streetAddress);
      
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

  const renderSuggestion = ({ item, index }: { item: MockSuggestion; index: number }) => (
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