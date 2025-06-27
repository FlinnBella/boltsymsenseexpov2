import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Search, Apple } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';

// USDA FoodData Central API
const USDA_API_KEY = 'DEMO_KEY'; // Replace with actual API key
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

interface FoodSearchResult {
  fdcId: number;
  description: string;
  calories?: number;
}

export default function FoodLoggingScreen() {
  const userProfile = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [portion, setPortion] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchFoods = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${USDA_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data = await response.json();
      
      const results: FoodSearchResult[] = data.foods?.map((food: any) => {
        // Find calories nutrient (nutrient ID 1008)
        const caloriesNutrient = food.foodNutrients?.find(
          (nutrient: any) => nutrient.nutrientId === 1008
        );
        
        return {
          fdcId: food.fdcId,
          description: food.description,
          calories: caloriesNutrient?.value || 0,
        };
      }) || [];

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching foods:', error);
      Alert.alert('Error', 'Failed to search foods. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFoods(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFoodSelect = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setSearchResults([]);
    setSearchQuery(food.description);
  };

  const handleLogFood = async () => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food item');
      return;
    }

    if (!portion.trim()) {
      Alert.alert('Error', 'Please enter portion size');
      return;
    }

    setLoading(true);
    try {
      const portionNum = parseFloat(portion);
      const totalCalories = Math.round((selectedFood.calories || 0) * portionNum);

      const { error } = await supabase
        .from('food_logs_cache')
        .insert({
          user_id: userProfile?.id,
          food_name: selectedFood.description,
          calories: totalCalories,
          portion_size: portion,
          notes: notes.trim() || null,
        });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Food logged successfully', [
        { text: 'OK', onPress: () => {
          setSelectedFood(null);
          setSearchQuery('');
          setPortion('1');
          setNotes('');
        }}
      ]);
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'Failed to log food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="black" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Log</Text>
          <View style={styles.placeholder} />
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={styles.section}>
          <View style={styles.iconContainer}>
            <Apple color="#F59E0B" size={24} />
          </View>
          <Text style={styles.sectionTitle}>Search Food</Text>
          
          <View style={styles.searchContainer}>
            <Search color="#6B7280" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food (e.g., apple, chicken breast)"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
            {searching && (
              <ActivityIndicator size="small" color="#6B7280" style={styles.searchLoader} />
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Search Results:</Text>
              {searchResults.map((food) => (
                <TouchableOpacity
                  key={food.fdcId}
                  style={styles.foodItem}
                  onPress={() => handleFoodSelect(food)}
                >
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.description}</Text>
                    <Text style={styles.foodCalories}>
                      {food.calories ? `${food.calories} cal per 100g` : 'Calories not available'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedFood && (
            <View style={styles.selectedFoodContainer}>
              <Text style={styles.selectedFoodTitle}>Selected Food:</Text>
              <View style={styles.selectedFood}>
                <Text style={styles.selectedFoodName}>{selectedFood.description}</Text>
                <Text style={styles.selectedFoodCalories}>
                  {selectedFood.calories} calories per 100g
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {selectedFood && (
          <Animated.View entering={FadeInRight.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Log Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Portion Size (servings) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 1, 0.5, 2"
                placeholderTextColor="#9CA3AF"
                value={portion}
                onChangeText={setPortion}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Any additional notes about this meal..."
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {selectedFood.calories && (
              <View style={styles.caloriesSummary}>
                <Text style={styles.caloriesSummaryText}>
                  Total Calories: {Math.round((selectedFood.calories || 0) * parseFloat(portion || '1'))} cal
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        <Animated.View entering={FadeInRight.delay(600).duration(600)} style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Food Logging Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Search for specific foods for better accuracy</Text>
            <Text style={styles.tipItem}>• Log meals as soon as you eat them</Text>
            <Text style={styles.tipItem}>• Include portion sizes for accurate calorie tracking</Text>
            <Text style={styles.tipItem}>• Note any reactions or how foods make you feel</Text>
          </View>
        </Animated.View>

        {selectedFood && (
          <Animated.View entering={FadeInRight.delay(800).duration(600)} style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.logButton, loading && styles.logButtonDisabled]}
              onPress={handleLogFood}
              disabled={loading}
            >
              <Save color="white" size={20} />
              <Text style={styles.logButtonText}>
                {loading ? 'Logging...' : 'Log Food'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  searchLoader: {
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  foodItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  foodCalories: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  selectedFoodContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  selectedFoodTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#065F46',
    marginBottom: 8,
  },
  selectedFood: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  selectedFoodName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedFoodCalories: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  caloriesSummary: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  caloriesSummaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  logButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});