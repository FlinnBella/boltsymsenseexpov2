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
import { useThemeColors } from '@/stores/useThemeStore';

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
  const colors = useThemeColors();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <Animated.View entering={FadeInUp.duration(600)} style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.background }]}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Food Log</Text>
          <View style={styles.placeholder} />
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
            <Apple color={colors.warning} size={24} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Food</Text>
          
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for food (e.g., apple, chicken breast)"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
            {searching && (
              <ActivityIndicator size="small" color={colors.textSecondary} style={styles.searchLoader} />
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>Search Results:</Text>
              {searchResults.map((food) => (
                <TouchableOpacity
                  key={food.fdcId}
                  style={[styles.foodItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleFoodSelect(food)}
                >
                  <View style={styles.foodInfo}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{food.description}</Text>
                    <Text style={[styles.foodCalories, { color: colors.textSecondary }]}>
                      {food.calories ? `${food.calories} cal per 100g` : 'Calories not available'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedFood && (
            <View style={[styles.selectedFoodContainer, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <Text style={[styles.selectedFoodTitle, { color: colors.success }]}>Selected Food:</Text>
              <View style={[styles.selectedFood, { backgroundColor: colors.background }]}>
                <Text style={[styles.selectedFoodName, { color: colors.text }]}>{selectedFood.description}</Text>
                <Text style={[styles.selectedFoodCalories, { color: colors.textSecondary }]}>
                  {selectedFood.calories} calories per 100g
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {selectedFood && (
          <Animated.View entering={FadeInRight.delay(400).duration(600)} style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Log Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Portion Size (servings) *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., 1, 0.5, 2"
                placeholderTextColor={colors.textSecondary}
                value={portion}
                onChangeText={setPortion}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Any additional notes about this meal..."
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {selectedFood.calories && (
              <View style={[styles.caloriesSummary, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                <Text style={[styles.caloriesSummaryText, { color: colors.primary }]}>
                  Total Calories: {Math.round((selectedFood.calories || 0) * parseFloat(portion || '1'))} cal
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        <Animated.View entering={FadeInRight.delay(600).duration(600)} style={[styles.infoSection, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>💡 Food Logging Tips</Text>
          <View style={styles.tipsList}>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Search for specific foods for better accuracy</Text>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Log meals as soon as you eat them</Text>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Include portion sizes for accurate calorie tracking</Text>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Note any reactions or how foods make you feel</Text>
          </View>
        </Animated.View>

        {selectedFood && (
          <Animated.View entering={FadeInRight.delay(800).duration(600)} style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: colors.warning }, loading && styles.logButtonDisabled]}
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
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
    marginBottom: 12,
  },
  foodItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  foodCalories: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  selectedFoodContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedFoodTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  selectedFood: {
    padding: 12,
    borderRadius: 8,
  },
  selectedFoodName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  selectedFoodCalories: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  caloriesSummary: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  caloriesSummaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  infoSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  logButton: {
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