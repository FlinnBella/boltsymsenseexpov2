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
import { Send, Dog, User, Loader, Plus, Video } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight, FadeOutDown } from 'react-native-reanimated';
import { useUserProfile, useMedications, useSymptoms, useFoodLogs } from '@/stores/useUserStore';
import { useThemeColors } from '@/stores/useThemeStore';
import TavusVideoChat from '@/components/TavisConv';
import PremiumUpgradeModal from '@/components/Modal/PremiumUpgradeModal';

// Webhook URL for AI communication
const WEBHOOK_URL = 'https://evandickinson.app.n8n.cloud/webhook/326bdedd-f7e9-41c8-a402-ca245cd19d0a';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Move MessageBubble outside the main component to prevent re-renders
const MessageBubble = React.memo(({ message, colors }: { message: ChatMessage; colors: any }) => (
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
        { backgroundColor: message.isUser ? colors.primary : colors.text }
      ]}>
        {message.isUser ? (
          <User color="white" size={16} />
        ) : (
          <Dog color="white" size={16} />
        )}
      </View>
      <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
    <Text style={[
      styles.messageText,
      message.isUser ? 
        [styles.userMessageText, { backgroundColor: colors.primary }] : 
        [styles.aiMessageText, { backgroundColor: colors.background, color: colors.text }]
    ]}>
      {message.text}
    </Text>
  </Animated.View>
));

// Initial chat placeholder component
const InitialChatPlaceholder = ({ onFirstMessage, colors, onStartVideoCall }: { 
  onFirstMessage: () => void; 
  colors: any;
  onStartVideoCall: () => void;
}) => {
  useEffect(() => {
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
      <View style={[styles.placeholderIcon, { backgroundColor: colors.primary + '20' }]}>
        <Dog color={colors.primary} size={48} />
      </View>
      <Text style={[styles.placeholderTitle, { color: colors.text }]}>Chat with SymSense AI</Text>
      <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>
        Ask me about your health, medications, symptoms, or get personalized recommendations
      </Text>
      
      {/* Video Call Button */}
      <TouchableOpacity
        style={[styles.videoCallButton, { backgroundColor: colors.primary }]}
        onPress={onStartVideoCall}
      >
        <Video color="white" size={20} />
        <Text style={styles.videoCallButtonText}>Start Video Call with Anna</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showNewChatButton, setShowNewChatButton] = useState(false);
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const userProfile = useUserProfile();
  const medications = useMedications();
  const symptoms = useSymptoms();
  const foodLogs = useFoodLogs();
  const colors = useThemeColors();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowPlaceholder(true);
    setShowNewChatButton(false);
    setInputText('');
  };

  const handleStartVideoCall = () => {
    // For demo purposes, show premium modal
    // In production, you'd check if user has premium access
    setShowPremiumModal(true);
  };

  const handleVideoCallStart = () => {
    setShowVideoChat(true);
    setShowPlaceholder(false);
  };

  const handleVideoCallEnd = () => {
    setShowVideoChat(false);
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

    // Hide placeholder and show new chat button on first message
    if (showPlaceholder) {
      setShowPlaceholder(false);
      setShowNewChatButton(true);
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

  if (showVideoChat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <TavusVideoChat
          onClose={handleVideoCallEnd}
          conversationalContext="You are Anna, a helpful nurse assistant. You provide caring and professional medical guidance."
          customGreeting="Hello! I'm Anna, your nurse assistant. How can I help you today?"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
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
            <InitialChatPlaceholder 
              onFirstMessage={() => {}} 
              colors={colors} 
              onStartVideoCall={handleStartVideoCall}
            />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} colors={colors} />
            ))
          )}
          
          {isLoading && (
            <Animated.View
              entering={FadeInRight.delay(100).duration(400)}
              style={[styles.messageBubble, styles.aiMessage]}
            >
              <View style={styles.messageHeader}>
                <View style={[styles.messageIcon, { backgroundColor: colors.text }]}>
                  <Dog color="white" size={16} />
                </View>
                <Text style={[styles.messageTime, { color: colors.textSecondary }]}>Now</Text>
              </View>
              <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <Loader color={colors.textSecondary} size={16} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>AI is thinking...</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* New Chat Button */}
        {showNewChatButton && (
          <Animated.View 
            entering={FadeInUp.duration(400)}
            style={styles.newChatButtonContainer}
          >
            <TouchableOpacity
              style={[styles.newChatButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleNewChat}
            >
              <Plus color={colors.text} size={16} />
              <Text style={[styles.newChatButtonText, { color: colors.text }]}>New chat</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input - DeepSeek Style */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Message SymSense AI..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: (!inputText.trim() || isLoading) ? colors.textSecondary : colors.primary }
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Send color="white" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Disclaimer */}
      <View style={[styles.disclaimer, { backgroundColor: colors.warning + '20', borderTopColor: colors.warning }]}>
        <Text style={[styles.disclaimerText, { color: colors.warning }]}>
          This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.
        </Text>
      </View>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgradeSuccess={handleVideoCallStart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  videoCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  videoCallButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
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
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    padding: 16,
    borderRadius: 16,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    // Colors will be applied dynamically
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  newChatButtonContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  newChatButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    paddingVertical: 0,
    marginRight: 12,
    lineHeight: 20,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
});