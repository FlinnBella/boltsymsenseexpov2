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
import { Send, Bot, User, Loader, MapPin } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight, FadeOutDown } from 'react-native-reanimated';
import { useUserProfile, useMedications, useSymptoms, useFoodLogs } from '@/stores/useUserStore';
import { getCurrentLocationWithZipCode, showLocationPermissionAlert, LocationData, LocationError } from '@/lib/location';

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
        { backgroundColor: message.isUser ? '#3B82F6' : '#000000' }
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
));

// Initial chat placeholder component
const InitialChatPlaceholder = ({ onFirstMessage }: { onFirstMessage: () => void }) => {
  useEffect(() => {
    // This will be called when the component unmounts (when first message is sent)
    return () => {
      onFirstMessage();
    };
  }, []);

  return (
    <Animated.View 
      entering={FadeInUp.duration(600)}
      exiting={FadeOutDown.duration(300)}
      style={styles.placeholderContainer}
    >
      <View style={styles.placeholderIcon}>
        <Bot color="#10B981" size={48} />
      </View>
      <Text style={styles.placeholderTitle}>Chat with SymSense AI</Text>
      <Text style={styles.placeholderSubtitle}>
        Ask me about your health, medications, symptoms, or get personalized recommendations
      </Text>
    </Animated.View>
  );
};

export default function AIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
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

      const response = await fetch(`${WEBHOOK_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      throw new Error('Unable to connect to AI assistant. Please try again later.');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Hide placeholder on first message
    if (showPlaceholder) {
      setShowPlaceholder(false);
    }

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
      Alert.alert(
        'Connection Error',
        'Unable to reach the AI assistant. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={styles.headerTitle}>SymSense AI</Text>
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
          {showPlaceholder && messages.length === 0 ? (
            <InitialChatPlaceholder onFirstMessage={() => {}} />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {isLoading && (
            <Animated.View
              entering={FadeInRight.delay(100).duration(400)}
              style={[styles.messageBubble, styles.aiMessage]}
            >
              <View style={styles.messageHeader}>
                <View style={[styles.messageIcon, { backgroundColor: '#000000' }]}>
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
    paddingTop: 60,
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'black',
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
    flexGrow: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
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
});