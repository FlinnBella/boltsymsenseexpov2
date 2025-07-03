import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Daily from '@daily-co/react-native-daily-js';

interface VideoChatModalProps {
  apiKey?: string;
  replicaId?: string;
  personaId?: string;
  visible: boolean;
  onClose: () => void;
}

const VideoChatModal = ({
  apiKey = 'c2744af3a2c248eeac535b51939a04db',
  replicaId = 'r4c41453d2',
  personaId = 'pb1b8de56155',
  visible,
  onClose,
}: VideoChatModalProps) => {
  const [callObject, setCallObject] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<any>({});
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);

  // Create Tavus conversation and get Daily.co room URL
  const createTavusConversation = useCallback(async () => {
    try {
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          replica_id: replicaId,
          persona_id: personaId,
          properties: {
            max_call_duration: 3600,
            participant_left_timeout: 60,
            enable_recording: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.conversation_url;
    } catch (error) {
      console.error('Error creating Tavus conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
      return null;
    }
  }, [apiKey, replicaId, personaId]);

  // Initialize Daily call object
  const initializeCall = useCallback(() => {
    if (callObject) return callObject;

    const newCallObject = Daily.createCallObject({
      startVideoOff: true, // Video disabled as requested
      startAudioOff: false, // Audio enabled for microphone
      dailyConfig: {
        userMediaAudioConstraints: {
          
        },
      },
    });

    setCallObject(newCallObject);
    return newCallObject;
  }, [callObject]);

  // Event handlers
  const handleJoinedMeeting = useCallback((event: any) => {
    console.log('Joined meeting:', event);
    setIsConnected(true);
    setIsLoading(false);
  }, []);

  const handleParticipantJoined = useCallback((event: any) => {
    console.log('Participant joined:', event);
    setParticipants((prev: any) => ({
      ...prev,
      [event.participant.session_id]: event.participant,
    }));
  }, []);

  const handleParticipantLeft = useCallback((event: any) => {
    console.log('Participant left:', event);
    setParticipants((prev: any) => {
      const updated = { ...prev };
      delete updated[event.participant.session_id];
      return updated;
    });
  }, []);

  const handleCallEnded = useCallback(() => {
    console.log('Call ended');
    setIsConnected(false);
    setParticipants({});
    onClose();
  }, [onClose]);

  const handleError = useCallback((event: any) => {
    console.error('Daily error:', event);
    setIsLoading(false);
    Alert.alert('Connection Error', 'Unable to connect to the call. Please try again.');
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!callObject) return;

    const eventHandlers = {
      'joined-meeting': handleJoinedMeeting,
      'participant-joined': handleParticipantJoined,
      'participant-left': handleParticipantLeft,
      'left-meeting': handleCallEnded,
      error: handleError,
    };

    // Attach event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      callObject.on(event, handler);
    });

    // Cleanup function
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        callObject.off(event, handler);
      });
    };
  }, [
    callObject,
    handleJoinedMeeting,
    handleParticipantJoined,
    handleParticipantLeft,
    handleCallEnded,
    handleError,
  ]);

  // Join call function
  const joinCall = useCallback(async () => {
    if (isLoading || isConnected) return;

    setIsLoading(true);

    try {
      // Get conversation URL from Tavus
      let roomUrl = conversationUrl;
      if (!roomUrl) {
        roomUrl = await createTavusConversation();
        if (!roomUrl) {
          setIsLoading(false);
          return;
        }
        setConversationUrl(roomUrl);
      }

      // Initialize call object if needed
      const call = initializeCall();

      // Join the call
      await call.join({ url: roomUrl });
    } catch (error) {
      console.error('Error joining call:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to join call. Please try again.');
    }
  }, [
    isLoading,
    isConnected,
    conversationUrl,
    createTavusConversation,
    initializeCall,
  ]);

  // Leave call function
  const leaveCall = useCallback(async () => {
    if (callObject && isConnected) {
      try {
        await callObject.leave();
      } catch (error) {
        console.error('Error leaving call:', error);
      }
    }
    setIsConnected(false);
    setIsLoading(false);
    setParticipants({});
    onClose();
  }, [callObject, isConnected, onClose]);

  // Cleanup on unmount or modal close
  useEffect(() => {
    if (!visible && callObject) {
      leaveCall();
    }
  }, [visible, callObject, leaveCall]);

  // Destroy call object when component unmounts
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.destroy();
      }
    };
  }, [callObject]);

  const participantCount = Object.keys(participants).length;
  const isReplica = participantCount > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={leaveCall}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={leaveCall}
            accessibilityLabel="Close video chat"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isConnected 
              ? isReplica 
                ? 'Chat with AI Assistant' 
                : 'Connecting to Assistant...'
              : 'Video Chat'
            }
          </Text>
        </View>

        {/* Main content area */}
        <View style={styles.content}>
          {!isConnected ? (
            <View style={styles.centerContainer}>
              <Text style={styles.statusText}>
                {isLoading ? 'Connecting...' : 'Ready to start chat'}
              </Text>
              
              {!isLoading && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={joinCall}
                  accessibilityLabel="Start voice chat"
                >
                  <Text style={styles.joinButtonText}>
                    🎤 Start Voice Chat
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.callContainer}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>
                <Text style={styles.avatarLabel}>
                  {isReplica ? 'AI Assistant' : 'Waiting...'}
                </Text>
              </View>

              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator} />
                <Text style={styles.connectionStatus}>
                  Voice chat active
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer controls */}
        {isConnected && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={leaveCall}
              accessibilityLabel="End call"
            >
              <Text style={styles.endCallButtonText}>End Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 48,
  },
  avatarLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    marginRight: 8,
  },
  connectionStatus: {
    color: '#fff',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 20,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  endCallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoChatModal;