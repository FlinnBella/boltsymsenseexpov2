import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User, Loader, MapPin, ToggleLeft, Navigation } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useUserProfile, useMedications, useSymptoms, useFoodLogs } from '@/stores/useUserStore';
import { getCurrentLocationWithZipCode, showLocationPermissionAlert, LocationData, LocationError } from '@/lib/location';
import { useUserStore } from '@/stores/useUserStore';
import TavusVideoChat from '@/components/TavisConv';
//TODO: Use frontend to update the chat message for user. Let the ai have a loading bubbles 
//while waiting for response. 


// Webhook URL for AI communication
const WEBHOOK_URL = 'https://evandickinson.app.n8n.cloud/webhook/326bdedd-f7e9-41c8-a402-ca245cd19d0a';
// https://evandickinson.app.n8n.cloud/webhook-test/326bdedd-f7e9-41c8-a402-ca245cd19d0a - test
// https://evandickinson.app.n8n.cloud/webhook/326bdedd-f7e9-41c8-a402-ca245cd19d0a - prod
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Doctor {
  basic: {
    first_name: string;
    last_name: string;
    name: string;
    credential?: string;
  };
  addresses: Array<{
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
  }>;
  practiceLocations: Array<{
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
  }>;
  taxonomies: Array<{
    desc: string;
    primary: boolean;
  }>;
}

interface aiResponse {
  output: string;
  filterResponse: string;
  message: string;
  response: string; 
}

// Move MessageBubble outside the main component to prevent re-renders
const MessageBubble = React.memo(({ message }: { message: ChatMessage }) => (
  <Animated.View
    entering={FadeInRight.delay(100).duration(400)}
    style={[
      styles.messageBubble,
      message.isUser ? styles.userMessage : styles.aiMessage,
    ]}
  >
    <View style={styles.messageHeader}>
      <View style={[
        styles.messageIcon,
        { backgroundColor: message.isUser ? 'null' : '#000000' }
      ]}>
        {message.isUser ? (
          null
        ) : (
          <Bot color="white" size={16} />
        )}
      </View>
    </View>
    <Text style={[
      styles.messageText,
      message.isUser ? styles.userMessageText : styles.aiMessageText
    ]}>
      {message.text}
    </Text>
  </Animated.View>
));

export default function AIScreen() {
  //Get rid of the chat, have the icon centered (like deepseek) until the user sends a chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI health assistant. I can help you with health questions, medication reminders, and wellness tips. How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const userProfile = useUserProfile();
  const medications = useMedications();
  const symptoms = useSymptoms();
  const foodLogs = useFoodLogs();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessageToWebhook = async (message: string) => {
    try {
      console.log('Sending message:', message);
      console.log('User profile data:', {
        zipCode: userProfile?.zip_code,
        diseases: userProfile?.autoimmune_diseases,
        medicationsCount: medications?.length || 0,
        symptomsCount: symptoms?.length || 0,
        foodLogsCount: foodLogs?.length || 0,
      });

      // Create a clean payload without undefined values and sanitized data
      console.log('User profile data:', userProfile?.id);
      const payload = {
        message,
        user_id: userProfile?.id || null,
        zipCode: userProfile?.zip_code || null,
        diseases: userProfile?.autoimmune_diseases || null,
        medications: (medications || []).map(med => ({
          name: med.medication_name,
          dosage: med.dosage,
          taken_at: med.taken_at,
          notes: med.notes
        })),
        symptoms: (symptoms || []).map(symptom => ({
          name: symptom.symptom_name,
          severity: symptom.severity,
          description: symptom.description,
          logged_at: symptom.logged_at
        })),
        food_log: (foodLogs || []).map(food => ({
          name: food.food_name,
          negative_effects: food.negative_effects,
          consumed_at: food.consumed_at
        })),
      };

      // Validate payload before sending
      try {
        const payloadString = JSON.stringify(payload, null, 2);
        console.log('Sending payload:', payloadString);
        
        // Double-check payload can be parsed back
        JSON.parse(payloadString);
      } catch (stringifyError) {
        console.error('Payload serialization error:', stringifyError);
        console.error('Problematic payload:', payload);
        throw new Error('Invalid payload structure - cannot serialize to JSON');
      }

      // Add timeout to the fetch request
      const controller = new AbortController();
      //const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${WEBHOOK_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      //clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      // Get the response data with better error handling
      try {
        const data = await response.json();
        console.log('Raw response body:', data);
        return data;
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        // Try to get text response if JSON parsing fails
        const textResponse = await response.text();
        console.log('Text response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      throw new Error('Unable to connect to AI assistant. Please try again later.');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    try {
      //Need to add new type to handle n8n data.
      const aiResponse = await sendMessageToWebhook(inputText);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.output || 'No response from AI',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again later or consult with a healthcare professional for urgent medical concerns.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Optionally show an alert for connection errors
      Alert.alert(
        'Connection Error',
        'Unable to reach the AI assistant. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchAndRenderDoctors = async () => {
    try {
      // Ask user for location permission first
      const userConsent = await showLocationPermissionAlert();
      if (!userConsent) {
        const cancelMessage: ChatMessage = {
          id: Date.now().toString(),
          isUser: false,
          text: 'Location access is needed to find doctors near you. You can try again anytime or use the zip code from your profile.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, cancelMessage]);
        return;
      }

      // Get current location and zip code
      const locationResult = await getCurrentLocationWithZipCode();
      
      // Check if location fetch failed
      if ('code' in locationResult) {
        const locationError = locationResult as LocationError;
        console.error('Location error:', locationError);
        
        // Fall back to user's saved zip code if available
        const fallbackZipCode = userProfile?.zip_code;
        if (fallbackZipCode) {
          const fallbackMessage: ChatMessage = {
            id: Date.now().toString(),
            isUser: false,
            text: `Unable to get your current location (${locationError.message}). Using your saved zip code: ${fallbackZipCode}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, fallbackMessage]);
        } else {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            isUser: false,
            text: `Unable to find doctors: ${locationError.message}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
      }

      // Use current location zip code or fall back to saved zip code
      const locationData = locationResult as LocationData;
      const zipCodeToUse = ('zipCode' in locationResult) ? locationData.zipCode : userProfile?.zip_code;
      
      if (!zipCodeToUse) {
        const noZipMessage: ChatMessage = {
          id: Date.now().toString(),
          isUser: false,
          text: 'No zip code available. Please update your profile with your zip code or enable location services.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, noZipMessage]);
        return;
      }

      // Fetch doctors using the zip code
      const response = await fetch(`https://apitest-oww0.onrender.com/api/doctors/${zipCodeToUse}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      
      const data = await response.json();
      console.log(data);
      
      // Store the doctors in state
      setDoctors(data.results);
      
      // Add a message to show the doctors in the chat
      const locationText = ('zipCode' in locationResult) ? 
        `your current location (${locationData.zipCode})` : 
        `your saved zip code (${userProfile?.zip_code})`;
      
      const doctorMessage: ChatMessage = {
        id: Date.now().toString(),
        isUser: false,
        text: `Found ${data.result_count} doctors near ${locationText}:`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, doctorMessage]);
      renderDoctorList(data.results);
      
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        isUser: false,
        text: 'Sorry, I had trouble finding doctors in your area. Please try again later.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDoctorList = (doctorList : Doctor[]) => {
    return (
      <Animated.View
        entering={FadeInRight.delay(1000).duration(400)}
        style={[
          styles.messageContainer,
          styles.assistantMessageContainer,
        ]}
      >
        <View style={styles.doctorListContainer}>
          <Text style={styles.doctorListTitle}>Recommended Doctors Near You</Text>
          {doctorList.map((doctor, index) => {
            const doctorName = doctor.basic?.name || 
                             `${doctor.basic?.first_name || ''} ${doctor.basic?.last_name || ''}`.trim() || 'N/A';
            const specialty = doctor.taxonomies?.find(t => t.primary)?.desc || 
                             doctor.taxonomies?.[0]?.desc || 'N/A';
            const address = doctor.addresses?.[0] || doctor.practiceLocations?.[0];
            const addressString = address ? 
              `${address.address_1}${address.address_2 ? ', ' + address.address_2 : ''}, ${address.city}, ${address.state} ${address.postal_code}` : 
              'Address not available';

            return (
              <View key={index} style={styles.doctorCard}>
                <View style={styles.doctorHeader}>
                  <Text style={styles.doctorName}>
                    {doctorName}
                  </Text>
                  <Text style={styles.doctorSpecialty}>
                    {specialty}
                  </Text>
                </View>
                
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorInfoRow}>
                    <MapPin color="#6B7280" size={16} />
                    <Text style={styles.doctorInfoText}>
                      {addressString}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  };


  //Keep track of message count, have a giraffe head in the center with text if no messages.
  return (
    <SafeAreaView style={styles.container}>
      {/*<TavusVideoChat 
        onClose={() => {}}
        conversationalContext="You are Anna, a helpful nurse assistant. You provide caring and professional medical guidance."
        customGreeting="Hello! I'm Anna, your nurse assistant. How can I help you today?"
      />*/}
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        

             {/* <Text style={styles.headerTitle}>New Chat</Text>*/}
 
        
      </Animated.View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <Animated.View
              entering={FadeInRight.delay(100).duration(400)}
              style={[styles.messageBubble, styles.aiMessage]}
            >
              <View style={styles.messageHeader}>
                <View style={[styles.messageIcon, { backgroundColor: '#10B981' }]}>
                  <Bot color="white" size={16} />
                </View>
                <Text style={styles.messageTime}>Now</Text>
              </View>
              <View style={styles.loadingContainer}>
                <Loader color="#6B7280" size={16} />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/*New Chat Button*/}
        {/*<View style={styles.newChatButton}>
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </View>*/}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me about your health..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Send color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Disclaimer */}
      {/*<View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.
        </Text>*/}
      {/*</View>*/}
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
    marginBottom: 16,
  },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    marginBottom: 16,
    maxWidth: '85%',
    flexDirection: 'row',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    padding: 16,
    borderRadius: 16,
  },
  userMessageText: {
    backgroundColor: '#3B82F6',
    color: 'white',
  },
  aiMessageText: {
    backgroundColor: 'white',
    color: '#1F2937',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  inputContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    borderTopWidth: 5,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  disclaimer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#F59E0B',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Doctor-related styles
  messageContainer: {
    marginBottom: 16,
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  doctorListContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  doctorListTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  doctorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  doctorHeader: {
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
    marginBottom: 8,
  },
  doctorInfo: {
    gap: 8,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  doctorInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
});