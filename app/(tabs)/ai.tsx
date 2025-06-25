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
import { Send, Bot, User, Loader, MapPin } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useUserProfile, useMedications, useSymptoms, useFoodLogs } from '@/stores/useUserStore';
import { getCurrentLocationWithZipCode, showLocationPermissionAlert, LocationData, LocationError } from '@/lib/location';
import { useUserStore } from '@/stores/useUserStore';
//TODO: Use frontend to update the chat message for user. Let the ai have a loading bubbles 
//while waiting for response. 


// Webhook URL for AI communication
const WEBHOOK_URL = 'https://evandickinson.app.n8n.cloud/webhook/326bdedd-f7e9-41c8-a402-ca245cd19d0a';

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

interface DoctorApiResponse {
  result_count: number;
  results: Doctor[];
}

export default function AIScreen() {
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

  const sendMessageToWebhook = async (message: string): Promise<string> => {
    try {
      console.log('Sending message:', message);
      const response = await fetch(`${WEBHOOK_URL}?message=${encodeURIComponent(message)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          timestamp: new Date().toISOString(),
          zipCode: userProfile?.zip_code,
          diseases: userProfile?.autoimmune_diseases,
          //filtered to last 30 entries from separate data structures
          medications: medications,
          symptoms: symptoms,
          //food logs from separate data structure
          food_log: foodLogs,
        }),
      });

      //console.log('Response status:', response.status);
      //console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      // Get the response text first to debug what we're receiving
      console.log(response.json);
      const data = await response.json();
      console.log('Raw response body:', data);

      // Check if the response is empty
      if (!data) {
        throw new Error('Empty response from webhook');
      }
      const dataoutput = data[0].text || data[0].filterResponse
      // Handle the actual format: [{"text": "response"}]
      if (data.length > 0) {
        return dataoutput;
      } 
      else {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from webhook');
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
      const aiResponse = await sendMessageToWebhook(inputText);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      }]);
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
        //const cancelMessage: ChatMessage = {
        //  id: Date.now().toString(),
        //  role: 'assistant',
        //  content: 'Location access is needed to find doctors near you. You can try again anytime or use the zip code from your profile.',
        //  timestamp: new Date(),
        //};
        //setMessages(prev => [...prev, cancelMessage]);
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

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
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
          { backgroundColor: message.isUser ? '#3B82F6' : '#10B981' }
        ]}>
          {message.isUser ? (
            <User color="white" size={16} />
          ) : (
            <Bot color="white" size={16} />
          )}
        </View>
        <Text style={styles.messageTime}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.aiMessageText
      ]}>
        {message.text}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Bot color="white" size={28} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Health Assistant</Text>
              <Text style={styles.headerSubtitle}>Your personal health companion</Text>
            </View>
          </View>
        </LinearGradient>
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
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: 'white',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
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