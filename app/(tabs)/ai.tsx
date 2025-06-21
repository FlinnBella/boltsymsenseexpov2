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
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Phone, Mail, MapPin } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useUserData } from '@/hooks/useUserData';

//TODO: Use frontend to update the chat message for user. Let the ai have a loading bubbles 
//while waiting for response. 


// Webhook URL for AI communication
const WEBHOOK_URL = 'https://evandickinson.app.n8n.cloud/webhook/326bdedd-f7e9-41c8-a402-ca245cd19d0a';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DoctorApiResponse {
  result_count: number;
  results: Doctor[];
}

export interface Doctor {
  basic: {
    first_name: string;
    last_name: string;
    name: string;
    credential: string;
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


export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. I can help you with general health questions, symptom tracking, and wellness tips. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [zipCode, setZipCode] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const { userData } = useUserData();

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
          zipCode: userData.zip_code,
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
    if (!inputText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const responseContent = await sendMessageToWebhook(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later or consult with a healthcare professional for urgent medical concerns.',
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
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchAndRenderDoctors = async () => {
    try {
      //In the future get zip code from location services.
      const response = await fetch(`https://apitest-oww0.onrender.com/api/doctors/${userData.zip_code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        //body: JSON.stringify({
          //Later integrate with location services.
          //zipCode: zipCode,
        //}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      
      const data: DoctorApiResponse = await response.json();
      console.log(data);
      
      // Store the doctors in state
      setDoctors(data.results);
      
      // Add a message to show the doctors in the chat
      const doctorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Found ${data.result_count} doctors near you:`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, doctorMessage]);
      renderDoctorList(data.results);
      
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble finding doctors in your area. Please try again later.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
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

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <Animated.View
        key={message.id}
        entering={FadeInRight.delay(index * 100).duration(400)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}>
          {!isUser ? (
            <View style={styles.messageHeader}>
              <Bot color="#3B82F6" size={16} />
              <Text style={styles.messageRole}>AI Assistant</Text>
            </View>
          ) : null}
          
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText,
          ]}>
            {message.content}
          </Text>
          
          <Text style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.assistantMessageTime,
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={styles.title}>AI Health Assistant</Text>
        <Text style={styles.subtitle}>Get personalized health guidance</Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          
          {doctors.length > 0 && renderDoctorList(doctors)}
          
          {loading ? (
            <Animated.View
              entering={FadeInRight.duration(400)}
              style={[styles.messageContainer, styles.assistantMessageContainer]}
            >
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <View style={styles.messageHeader}>
                  <Bot color="#3B82F6" size={16} />
                  <Text style={styles.messageRole}>AI Assistant</Text>
                </View>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
          <View>
            {/*Need to update this to enable button regardless of function return */}
            <TouchableOpacity 
              style={[styles.findDoctorsButton, loading && styles.findDoctorsButtonDisabled]}
              onPress={async () => {
                setLoading(true);
                await fetchAndRenderDoctors();
              }}
              disabled={loading}>
              <MapPin color="#3B82F6" size={16} />
              <Text style={styles.findDoctorsButtonText}>Locate Doctors near you</Text>
            </TouchableOpacity>
          </View>
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Ask about your health..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            keyboardType="default"
            returnKeyType="send"
            enablesReturnKeyAutomatically={true}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) ? styles.sendButtonDisabled : null]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Send color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#3B82F6',
  },
  assistantMessage: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  }, 
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageRole: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantMessageTime: {
    color: '#9CA3AF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  doctorListContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: '95%',
  },
  doctorListTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 16,
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
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  doctorInfo: {
    gap: 8,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    flex: 1,
  },
      findDoctorsButton: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#3B82F6',
      margin: 16,
      gap: 8,
      alignSelf: 'flex-start',
    },
  findDoctorsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  findDoctorsButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
});