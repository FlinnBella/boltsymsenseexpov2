import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions,
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

const { height: screenHeight } = Dimensions.get('window');

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
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [useModal, setUseModal] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<View>(null);

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
      console.log('🔄 User manually edited address after selection');
      console.log('Previous selected value:', lastSelectedValue);
      console.log('New value:', value);
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
      
      console.log('🔍 Fetching suggestions for input:', input);
      
      const results = await googlePlacesService.getAutocompleteSuggestions(input);
      
      console.log('📍 Received suggestions:', results.length);
      console.log('Suggestions:', results.map(r => r.description));
      
      setSuggestions(results);
      setShowSuggestions(results.length > 0 && !hasSelectedAddress);
    } catch (err) {
      console.error('❌ Error fetching suggestions:', err);
      setError('Unable to fetch address suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: Suggestion) => {
    console.log('🎯 DROPDOWN OPTION SELECTED');
    console.log('==========================================');
    console.log('Selected suggestion:', {
      place_id: suggestion.place_id,
      description: suggestion.description,
      main_text: suggestion.structured_formatting.main_text,
      secondary_text: suggestion.structured_formatting.secondary_text,
    });
    console.log('Timestamp:', new Date().toISOString());
    console.log('==========================================');

    try {
      setLoading(true);
      setShowSuggestions(false);
      
      console.log('🔄 Fetching detailed address information...');
      
      const addressDetails = await googlePlacesService.getPlaceDetails(suggestion.place_id);
      
      console.log('📋 Raw address details from Google Places API:', {
        formatted_address: addressDetails.formattedAddress,
        street_number: addressDetails.streetNumber,
        route: addressDetails.route,
        city: addressDetails.city,
        state: addressDetails.state,
        zip_code: addressDetails.zipCode,
        country: addressDetails.country,
      });
      
      // Improved address parsing logic
      let streetAddress = '';
      
      // Try to construct street address from components
      if (addressDetails.streetNumber && addressDetails.route) {
        streetAddress = `${addressDetails.streetNumber} ${addressDetails.route}`;
        console.log('✅ Street address constructed from number + route:', streetAddress);
      } else if (addressDetails.route) {
        streetAddress = addressDetails.route;
        console.log('⚠️ Street address using route only (no number):', streetAddress);
      } else {
        // Fallback to using the main text from the suggestion
        streetAddress = suggestion.structured_formatting.main_text;
        console.log('🔄 Fallback to suggestion main text:', streetAddress);
      }
      
      // Ensure we have all required components
      const addressData = {
        streetAddress: streetAddress.trim(),
        city: addressDetails.city || '',
        state: addressDetails.state || '',
        zipCode: addressDetails.zipCode || '',
      };
      
      console.log('🏠 Final parsed address data:', addressData);
      
      // Validate that we have the essential components
      if (!addressData.streetAddress) {
        console.error('❌ Validation failed: Missing street address');
        throw new Error('Unable to parse street address');
      }
      
      if (!addressData.city || !addressData.state) {
        console.error('❌ Validation failed: Missing city or state');
        console.log('City:', addressData.city);
        console.log('State:', addressData.state);
        throw new Error('Unable to parse city or state information');
      }
      
      console.log('✅ Address validation passed');
      
      // Mark that user has selected an address
      setHasSelectedAddress(true);
      setLastSelectedValue(addressData.streetAddress);
      
      console.log('🔒 Address selection state updated');
      console.log('hasSelectedAddress: true');
      console.log('lastSelectedValue:', addressData.streetAddress);
      
      // Update the input field
      console.log('📝 Updating input field with:', addressData.streetAddress);
      onChangeText(addressData.streetAddress);
      
      // Call the callback to update form data
      console.log('📤 Calling onAddressSelect callback with address data');
      onAddressSelect(addressData);
      
      console.log('🎉 Address selection completed successfully');
      console.log('==========================================');
      
    } catch (err) {
      console.error('❌ ERROR during address selection:');
      console.error('Error details:', err);
      console.error('Suggestion that caused error:', suggestion);
      console.error('==========================================');
      
      setError('Unable to get complete address details. Please try another address.');
      
      // Reset selection state on error
      setHasSelectedAddress(false);
      setLastSelectedValue('');
      
      console.log('🔄 Reset selection state due to error');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    console.log('⌨️ Text input changed:', text);
    console.log('Previous value:', value);
    console.log('Has selected address:', hasSelectedAddress);
    
    onChangeText(text);
    
    // If user clears the input or significantly changes it, reset selection state
    if (hasSelectedAddress && (text.length === 0 || Math.abs(text.length - lastSelectedValue.length) > 5)) {
      console.log('🔄 Resetting selection state due to significant text change');
      console.log('Text length change:', Math.abs(text.length - lastSelectedValue.length));
      setHasSelectedAddress(false);
      setLastSelectedValue('');
    }
  };

  const handleFocus = () => {
    console.log('👁️ Input focused');
    console.log('Has selected address:', hasSelectedAddress);
    console.log('Suggestions count:', suggestions.length);
    
    // Measure input position for dropdown placement
    if (inputRef.current) {
      inputRef.current.measureInWindow((x, y, width, height) => {
        console.log('📐 Input layout measured:', { x, y, width, height });
        setInputLayout({ x, y, width, height });
        
        // Determine if we should use modal based on available space
        const spaceBelow = screenHeight - (y + height);
        const shouldUseModal = spaceBelow < 250; // Not enough space for dropdown
        
        console.log('📱 Screen height:', screenHeight);
        console.log('📏 Space below input:', spaceBelow);
        console.log('🎭 Use modal:', shouldUseModal);
        
        setUseModal(shouldUseModal);
      });
    }
    
    // Only show suggestions if user hasn't selected an address or if they've modified it
    if (!hasSelectedAddress && suggestions.length > 0) {
      console.log('📋 Showing suggestions on focus');
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    console.log('👁️ Input blurred');
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      console.log('📋 Hiding suggestions after blur delay');
      setShowSuggestions(false);
    }, 200);
  };

  const renderSuggestion = (item: Suggestion, index: number) => (
    <TouchableOpacity
      key={item.place_id}
      style={[
        styles.suggestionItem,
        index === suggestions.length - 1 && styles.lastSuggestionItem
      ]}
      onPress={() => {
        console.log(`🖱️ Suggestion ${index + 1} pressed:`, item.description);
        handleSuggestionSelect(item);
      }}
      activeOpacity={0.7}
    >
      <MapPin color="#6B7280" size={16} style={styles.suggestionIcon} />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionMain}>{item.structured_formatting.main_text}</Text>
        <Text style={styles.suggestionSecondary}>{item.structured_formatting.secondary_text}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestionsList = () => (
    <ScrollView
      style={styles.suggestionsList}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      bounces={false}
    >
      {suggestions.map((item, index) => renderSuggestion(item, index))}
    </ScrollView>
  );

  const renderDropdown = () => {
    if (!showSuggestions || suggestions.length === 0 || hasSelectedAddress) {
      return null;
    }

    if (useModal) {
      // Use modal for better touch handling when space is limited
      return (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuggestions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSuggestions(false)}
          >
            <View
              style={[
                styles.modalSuggestionsContainer,
                {
                  top: inputLayout.y + inputLayout.height + 8,
                  left: inputLayout.x,
                  width: inputLayout.width,
                }
              ]}
            >
              {renderSuggestionsList()}
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }

    // Use absolute positioning for normal dropdown
    return (
      <View style={styles.suggestionsContainer}>
        {renderSuggestionsList()}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View 
        ref={inputRef}
        style={styles.inputContainer}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          console.log('📐 Input container layout:', { x, y, width, height });
        }}
      >
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

      {renderDropdown()}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Debug Panel - Only visible in development */}
      {__DEV__ && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>🐛 Debug Info</Text>
          <Text style={styles.debugText}>Input Value: "{value}"</Text>
          <Text style={styles.debugText}>Has Selected: {hasSelectedAddress ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Last Selected: "{lastSelectedValue}"</Text>
          <Text style={styles.debugText}>Show Suggestions: {showSuggestions ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Suggestions Count: {suggestions.length}</Text>
          <Text style={styles.debugText}>Loading: {loading ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Use Modal: {useModal ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>Error: {error || 'None'}</Text>
        </View>
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1001,
    ...Platform.select({
      android: {
        elevation: 10,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalSuggestionsContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 200,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 1002,
  },
  suggestionsList: {
    borderRadius: 12,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
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
  debugPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});