import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import DailyIframe from '@daily-co/react-native-daily-js';

// Use any for Daily call object to avoid complex typing issues
type DailyCallObject = any;

interface TavusVideoChatProps {
    onClose: () => void;
    conversationalContext?: string;
    customGreeting?: string;
}

const TavusVideoChat: React.FC<TavusVideoChatProps> = ({
  onClose,
  conversationalContext,
  customGreeting
}) => {
  // Hard-coded values
  const apiKey = 'c2744af3a2c248eeac535b51939a04db';
  const personaId = 'p98d888d80a6';
  const replicaId = 'r4c41453d2';
  const [isVisible, setIsVisible] = useState(false);
  const [callFrame, setCallFrame] = useState<DailyCallObject | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string>('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [error, setError] = useState<string>('');

  // Create conversation with Tavus API
  const createConversation = async () => {
    setIsCreatingConversation(true);
    
    try {
      const requestBody: any = {
        persona_id: personaId,
        replica_id: replicaId,
        conversation_name: "Anna Nurse Chat",
        conversational_context: conversationalContext || "You are Anna, a helpful nurse assistant. You provide caring and professional medical guidance.",
        custom_greeting: customGreeting || "Hello! I'm Anna, your nurse assistant. How can I help you today?",
        properties: {
          max_call_duration: 1800, // 30 minutes
          participant_left_timeout: 60,
          participant_absent_timeout: 300,
          enable_recording: false,
          language: "english"
        }
      };

      // Add replica_id if provided
      if (replicaId) {
        requestBody.replica_id = replicaId;
      }

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      const data = await response.json();
      return data.conversation_url;
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
      throw error;
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const startChat = async () => {
    try {
      // Create conversation first
      const url = await createConversation();
      setConversationUrl(url);

      // Create Daily call frame
      const frame = DailyIframe.createCallObject();
      setCallFrame(frame);
      
      // Join the Tavus conversation
      await frame.join({ url });
      setIsVisible(true);
         } catch (error) {
       console.error('Error starting chat:', error);
       setError('Failed to start chat. Please try again.');
       setIsCreatingConversation(false);
     }
  };

  const endChat = () => {
    if (callFrame) {
      callFrame.leave();
      callFrame.destroy();
      setCallFrame(null);
    }
    setIsVisible(false);
    setConversationUrl('');
    onClose && onClose();
  };

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (callFrame) {
        try {
          callFrame.leave();
          callFrame.destroy();
        } catch (err) {
          console.warn('Cleanup error:', err);
        }
      }
    };
  }, []); // Remove dependency to avoid cleanup on every callFrame change

  return (
    <View style={{ flex: 1 }}>
      {!isVisible ? (
        <TouchableOpacity 
          onPress={startChat}
          disabled={isCreatingConversation}
          style={{ 
            padding: 20, 
            backgroundColor: isCreatingConversation ? '#ccc' : '#007AFF',
            borderRadius: 10,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>
            {isCreatingConversation ? 'Starting Chat...' : 'Start Chat with Anna'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Video chat container */}
          <View style={{ flex: 1 }}>
            {/* You'll need to implement the Daily video component here */}
            {/* This depends on your specific Daily React Native setup */}
            <Text>Video chat active - implement Daily video component</Text>
          </View>
          
          {/* Close button */}
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              top: 50, 
              right: 20,
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: 10,
              borderRadius: 20
            }}
            onPress={endChat}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TavusVideoChat;