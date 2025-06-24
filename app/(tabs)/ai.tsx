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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User, Loader } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

import { useUserData } from '@/hooks/useUserData';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIScreen() {
  const { userData } = useUserData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI health assistant. I can help you with health questions, medication reminders, and wellness tips. How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(userMessage.text),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('medication') || input.includes('medicine')) {
      return 'I can help you track your medications. Make sure to take them as prescribed by your doctor. Would you like me to set up medication reminders for you?';
    }
    
    if (input.includes('symptom') || input.includes('pain') || input.includes('feel')) {
      return 'I understand you\'re experiencing symptoms. It\'s important to track how you feel. You can log your symptoms in the app, and I recommend discussing persistent symptoms with your healthcare provider.';
    }
    
    if (input.includes('exercise') || input.includes('workout') || input.includes('fitness')) {
      return 'Regular exercise is great for your health! Based on your activity level, I recommend starting with 30 minutes of moderate exercise daily. Always consult your doctor before starting a new exercise routine.';
    }
    
    if (input.includes('diet') || input.includes('food') || input.includes('nutrition')) {
      return 'A balanced diet is crucial for good health. Focus on whole foods, plenty of vegetables, lean proteins, and stay hydrated. Would you like some specific nutrition tips?';
    }
    
    if (input.includes('sleep') || input.includes('tired') || input.includes('rest')) {
      return 'Good sleep is essential for health. Aim for 7-9 hours per night. Try to maintain a consistent sleep schedule and create a relaxing bedtime routine.';
    }
    
    return 'Thank you for your question. While I can provide general health information, please remember that I\'m not a substitute for professional medical advice. For specific health concerns, always consult with your healthcare provider.';
  };

  const MessageBubble = ({ message }: { message: Message }) => (
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
});