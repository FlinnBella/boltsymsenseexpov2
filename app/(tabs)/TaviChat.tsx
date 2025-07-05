import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { X, Minimize2, Maximize2, Mic, MicOff, Dog, User, Play } from 'lucide-react-native';
import Daily, { DailyMediaView, DailyFactoryOptions } from '@daily-co/react-native-daily-js';
import { useThemeColors } from '@/stores/useThemeStore';

interface TaviChatProps {
  visible: boolean;
  onClose: () => void;
  apiKey?: string;
  replicaId?: string;
  personaId?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TaviChat = ({
  visible,
  onClose,
  apiKey = 'c2744af3a2c248eeac535b51939a04db',
  replicaId = 'r43127e64d25a',
  personaId = 'p58cee6131cc',
}: TaviChatProps) => {
  const colors = useThemeColors();
  const [callObject, setCallObject] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<any>({});
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // Audio track references
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const remoteAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  // Audio permissions state
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  // Picture-in-picture positioning
  const pan = useRef(new Animated.ValueXY()).current;
  const [pipPosition, setPipPosition] = useState({ x: screenWidth - 120, y: 100 });

  // Call duration timer
  const durationInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Request audio permissions
  const requestAudioPermissions = useCallback(async () => {
    try {
      console.log('Requesting audio permissions...');
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for video calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('Android audio permission granted:', hasPermission);
        setHasAudioPermission(hasPermission);
        return hasPermission;
      } else {
        // iOS permissions are handled by the system
        setHasAudioPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setHasAudioPermission(false);
      return false;
    }
  }, []);

  // Initialize permissions on mount
  useEffect(() => {
    requestAudioPermissions();
  }, [requestAudioPermissions]);

  // PanResponder for draggable PiP
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isMinimized,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: 0,
          y: 0,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        // Snap to edges
        const newX = Math.max(0, Math.min(screenWidth - 100, gestureState.moveX - 50));
        const newY = Math.max(50, Math.min(screenHeight - 150, gestureState.moveY - 50));
        
        setPipPosition({ x: newX, y: newY });
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Create Tavus conversation
  const createTavusConversation = useCallback(async () => {
    try {
      console.log('Creating Tavus conversation with API key:', apiKey);
      setConnectionError(null); 
      
      // Updated request body with proper structure
      const requestBody = {
        replica_id: replicaId,
        persona_id: personaId,
        conversation_name: "Anna Nurse Chat",
        conversational_context: "You are Anna, a helpful nurse assistant. You provide caring and professional medical guidance.",
        custom_greeting: "Hello! I'm Anna, your nurse assistant. How can I help you today?",
        properties: {
          max_call_duration: 1800, // 30 minutes
          participant_left_timeout: 60,
          participant_absent_timeout: 300,
          enable_recording: false,
          language: "english"
        }
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://tavusapi.com/v2/conversations', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 503 || response.status === 500) {
          throw new Error('Tavus voice chat unavailable');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Tavus API response status:', response.status);
      const data = await response.json();
      console.log('Tavus conversation created:', data);
      
      if (!data.conversation_url) {
        throw new Error('No conversation URL returned from Tavus API');
      }
      
      return data.conversation_url;
    } catch (error) {
      console.error('Error creating Tavus conversation:', error);
      
      if (error instanceof Error && error.message.includes('unavailable')) {
        setConnectionError('Tavus voice chat unavailable');
        Alert.alert('Service Unavailable', 'Tavus voice chat is currently unavailable. Please try again later.');
      } else {
        setConnectionError('Failed to create conversation');
        Alert.alert('Connection Error', 'Failed to create conversation. Please try again.');
      }
      return null;
    }
  }, [apiKey, replicaId, personaId]);

  // Initialize call
  const initializeCall = useCallback(() => {
    if (callObject && !isDestroyed) return callObject;

    console.log('Initializing new Daily call object');

    const options: DailyFactoryOptions = {
      audioSource: true,
      videoSource: false, // Disable video to focus on audio
      subscribeToTracksAutomatically: true
    };

    try {
      const newCallObject = Daily.createCallObject(options);
      
      // Set audio device
      try {
        newCallObject.setAudioDevice('default');
      } catch (error) {
        console.error('Error setting audio device:', error);
      }
      
      setCallObject(newCallObject);
      setIsDestroyed(false);
      return newCallObject;
    } catch (error) {
      console.error('Error creating Daily call object:', error);
      setConnectionError('Failed to initialize call');
      return null;
    }
  }, [callObject, isDestroyed]);

  // Event handlers
  const handleJoinedMeeting = useCallback((event: any) => {
    console.log('Joined meeting:', event);
    console.log('Local participant:', event?.participants?.local || 'No local participant data');
    
    setIsConnected(true);
    
    // Ensure audio is enabled after joining
    if (callObject && !isDestroyed) {
      try {
        callObject.setLocalAudio(true);
        setAudioEnabled(true);
        console.log('Local audio enabled after joining');
      } catch (error) {
        console.error('Error enabling local audio after joining:', error);
      }
    }
    
    setIsLoading(false);
    setConnectionError(null);
    
    // Start call duration timer
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const handleParticipantJoined = useCallback((event: any) => {
    console.log('Participant joined event:', JSON.stringify(event, null, 2));
    console.log('Participant audio track:', event?.participant?.tracks?.audio || 'No audio track');
    
    // Log detailed audio track information
    if (event?.participant?.tracks?.audio) {
      console.log('Audio track state:', event?.participant?.tracks?.audio?.state);
      console.log('Audio track subscribed:', event?.participant?.tracks?.audio?.subscribed);
      console.log('Audio track enabled:', event?.participant?.tracks?.audio?.track?.enabled);
    }
    
    setParticipants((prev: any) => {
      const updated = {
        ...prev,
        [event?.participant?.session_id]: event?.participant,
      };
      return updated;
    });
    
    // Enable audio for the participant
    if (callObject && !isDestroyed) {
      try {
        // Ensure we're subscribed to the participant's audio
        if (!event.participant.local) {
          callObject.updateParticipant(event.participant.session_id, {
            setSubscribedTracks: {
              audio: true,
              video: false,
            },
          });
          console.log('Subscribed to participant audio:', event.participant.session_id);
        }
      } catch (error) {
        console.error('Error subscribing to participant audio:', error);
      }
    }
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
    setCallDuration(0);
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    onClose();
  }, [onClose]);

  const handleError = useCallback((event: any) => {
    console.error('Daily error:', event);
    setIsLoading(false);
    setConnectionError('Connection failed');
    Alert.alert('Connection Error', 'Unable to connect to the video call. Please try again.');
  }, []);

  // Enhanced track started handler
  const handleTrackStarted = useCallback((event: any) => {
    console.log('Track started:', event);
    
    // Get track info
    const trackInfo = event;
    console.log(`Track started - Type: ${trackInfo.track?.kind}, State: ${trackInfo.track?.readyState}, Enabled: ${trackInfo.track?.enabled}`);
    console.log(`Participant: ${trackInfo.participant?.session_id}, Local: ${trackInfo.participant?.local}`);
    
    if (trackInfo.track?.kind === 'audio') {
      console.log('Audio track details:', {
        id: trackInfo.track.id,
        muted: trackInfo.track.muted,
        enabled: trackInfo.track.enabled,
        readyState: trackInfo.track.readyState,
      });
      
      // Store audio track references
      if (trackInfo.participant.local) {
        audioTrackRef.current = trackInfo.track;
        console.log('Stored local audio track reference');
      } else {
        remoteAudioTrackRef.current = trackInfo.track;
        console.log('Stored remote audio track reference');
      }
    }
    
    const { participant, track } = event;
    
    setParticipants((prev: any) => {
      const participantData = prev[participant.session_id];
      if (!participantData) return prev;
      
      return {
        ...prev,
        [participant.session_id]: {
          ...participantData,
          tracks: {
            ...participantData.tracks,
            [track.kind]: {
              ...participantData.tracks[track.kind],
              state: 'playable',
              track: track,
            },
          },
        },
      };
    });
    
    // If this is an audio track, ensure it's properly configured
    if (track.kind === 'audio') {
      console.log('Audio track started, configuring...');
      
      try {
        // Make sure the track is enabled
        if (!track.enabled) {
          track.enabled = true;
          console.log('Enabled audio track');
        }
        
        // For remote participants, ensure we're subscribed to their audio
        if (!participant.local && callObject && !isDestroyed) {
          try {
            callObject.updateParticipant(participant.session_id, {
              setSubscribedTracks: { audio: true, video: false },
              setAudio: true,
            });
            console.log('Updated remote participant audio subscription');
          } catch (subError) {
            console.error('Error updating participant subscription:', subError);
          }
        }
      } catch (error) {
        console.error('Error configuring audio track:', error);
      }
    }
  }, []);

  // Add track stopped handler
  const handleTrackStopped = useCallback((event: any) => {
    console.log('Track stopped:', event);
    
    const { track, participant } = event;
    
    // Clear track references if they match the stopped track
    if (track.kind === 'audio') {
      if (participant.local && audioTrackRef.current?.id === track.id) {
        console.log('Clearing local audio track reference');
        audioTrackRef.current = null;
      } else if (!participant.local && remoteAudioTrackRef.current?.id === track.id) {
        console.log('Clearing remote audio track reference');
        remoteAudioTrackRef.current = null;
      }
    }
  }, []);

  // Join call function
  const joinCall = useCallback(async () => {
    if (isLoading || isConnected) return;
    
    try {
      // Check audio permissions first
      console.log('Checking audio permissions before joining call');
      if (!hasAudioPermission) {
        const granted = await requestAudioPermissions();
        if (!granted) {
          Alert.alert('Permission Required', 'Microphone permission is required for video calls.');
          return;
        }
      }
  
      setIsLoading(true);
      setConnectionError(null);
  
      // Create Tavus conversation for the AI avatar
      console.log('Creating Tavus conversation...');
      const tavusUrl = await createTavusConversation();
      if (!tavusUrl) {
        setIsLoading(false);
        return;
      }
      setConversationUrl(tavusUrl);

      console.log('Tavus conversation URL:', tavusUrl);
      const call = initializeCall();
      
      if (!call) {
        throw new Error('Failed to initialize call object');
      }
      
      // Configure audio settings before joining
      try {
        console.log('Setting up local audio before joining...');
        await call.setLocalAudio(true);
        await call.setLocalVideo(false);
        setAudioEnabled(true);
        console.log('Local audio enabled before joining');
      } catch (error) {
        console.error('Error setting local media:', error);
        // Continue anyway, as this might not be fatal
        console.log('Continuing despite local media error');
      }
      
      console.log('Joining call with URL:', tavusUrl);
      const joinOptions = { url: tavusUrl };
      await call.join(joinOptions);
      console.log('Join call initiated successfully');
    } catch (error) {
      console.error('Error joining call:', error);
      setIsLoading(false);
      setConnectionError('Failed to join call');
      Alert.alert('Error', 'Failed to join call. Please try again.');
    }
  }, [isLoading, isConnected, createTavusConversation, initializeCall, hasAudioPermission, requestAudioPermissions]);

  // Leave call function
  const leaveCall = useCallback(async () => {
    if (callObject && isConnected && !isDestroyed) {
      console.log('Leaving call and cleaning up...');
      try {
        // Disable audio before leaving
        try {
          await callObject.setLocalAudio(false);
          setAudioEnabled(false);
        } catch (audioError) {
          console.error('Error disabling audio before leaving:', audioError);
        }
        
        await callObject.leave();
        await callObject.destroy();
        setIsDestroyed(true);
        console.log('Call object destroyed successfully');
      } catch (error) {
        console.error('Error leaving call:', error);
      }
    }
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    setIsConnected(false);
    setIsLoading(false);
    setParticipants({});
    setCallDuration(0);
    setIsMinimized(false);
    setCallObject(null);
    onClose();
  }, [callObject, isConnected, isDestroyed, onClose]);

  // Toggle audio
  const toggleMute = useCallback(async () => {
    if (!callObject || isDestroyed) return;

    try {
      console.log('Toggling audio state...');
      const newAudioState = !audioEnabled;
      await callObject.setLocalAudio(newAudioState);
      setAudioEnabled(newAudioState);
      setIsMuted(!newAudioState);
      
      console.log('Audio toggled:', newAudioState ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Error toggling audio:', error);
      Alert.alert('Audio Error', 'Failed to toggle microphone. Please try again.');
    }
  }, [callObject, audioEnabled, isDestroyed]);

  // Setup event listeners
  useEffect(() => {
    if (!callObject || isDestroyed) return;
    
    console.log('Setting up Daily.js event listeners');

    const eventHandlers = {
      'joined-meeting': handleJoinedMeeting,
      'participant-joined': handleParticipantJoined,
      'participant-left': handleParticipantLeft,
      'left-meeting': handleCallEnded,
      'track-started': handleTrackStarted,
      'track-stopped': handleTrackStopped,
      'active-speaker-change': (event: any) => console.log('Active speaker changed:', event),
      error: handleError,
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      callObject.on(event, handler);
    });

    return () => {
      if (!isDestroyed) {
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          callObject.off(event, handler);
        });
      }
    };
  }, [
    callObject,
    isDestroyed,
    handleJoinedMeeting,
    handleParticipantJoined,
    handleParticipantLeft,
    handleCallEnded,
    handleTrackStarted,
    handleTrackStopped,
    handleError,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up resources');
      if (callObject && !isDestroyed) {
        try {
          // First disable audio to prevent any lingering audio issues
          try {
            callObject.setLocalAudio(false);
          } catch (audioError) {
            console.log('Error disabling audio during cleanup:', audioError);
          }
          
          // Then leave and destroy
          callObject.leave().catch((error: Error) => console.log('Error leaving call during cleanup:', error));
          callObject.destroy();
          setIsDestroyed(true);
          console.log('Call object destroyed during cleanup');
        } catch (error) {
          console.error('Error destroying call object:', error);
        }
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [callObject, isDestroyed]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const participantCount = Object.keys(participants).length;
  const hasAvatarParticipant = participantCount > 0;
  
  // Debug logging for participant state
  useEffect(() => {
    console.log('Current participant count:', participantCount);
    console.log('Has avatar participant:', hasAvatarParticipant);
    console.log('Participants keys:', Object.keys(participants));
    
    // Log audio track status
    console.log('Local audio track:', audioTrackRef.current ? 'Available' : 'Not available');
    console.log('Remote audio track:', remoteAudioTrackRef.current ? 'Available' : 'Not available');
  }, [participantCount, hasAvatarParticipant, participants]);

  // Update video rendering
  const renderParticipantVideo = useCallback((participant: any) => {
    console.log(`=== Rendering participant: ${participant.session_id} ===`);
    console.log(`Local: ${participant.local}, Audio track: ${participant.tracks?.audio ? 'Yes' : 'No'}`);
    
    const videoTrack = participant.tracks?.video?.track;
    const audioTrack = participant.tracks?.audio?.track;
    
    if (audioTrack) {
      console.log('Audio track details:', {
        id: audioTrack.id,
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState
      });
    }
    
    const isVideoPlayable = participant.tracks?.video?.state === 'playable';
    const isAudioPlayable = participant.tracks?.audio?.state === 'playable';
    
    console.log(`Video playable: ${isVideoPlayable}, Audio playable: ${isAudioPlayable}`);
    
    // For audio-only calls, we still want to render even without video
    // Render even if only audio is available
    if (!isAudioPlayable && !isVideoPlayable) {
      console.log('No playable tracks for participant:', participant.session_id);
      return null;
    }
    
    console.log('Rendering DailyMediaView for participant:', participant.session_id);
    
    return (
      <DailyMediaView
        key={participant.session_id}
        videoTrack={isVideoPlayable ? videoTrack : undefined}
        audioTrack={audioTrack}
        mirror={participant.local}
        zOrder={participant.local ? 1 : 0}
        style={styles.participantVideo}
        objectFit="cover"
      />
    );
  }, [audioEnabled]);

  // Update audio indicator in UI
  const renderAudioIndicator = useCallback(() => {
    if (!isConnected) return null;

    return (
      <View style={styles.audioIndicator}>
        <View style={styles.audioLevelContainer}>
          <View style={[
            styles.audioLevelBar,
            { 
              height: Math.max(2, audioEnabled ? 30 : 0),
              backgroundColor: audioEnabled ? '#4CAF50' : '#F44336'
            }
          ]} />
        </View>
        <Text style={styles.audioStatus}>
          {audioEnabled ? 'Mic On' : 'Muted'}
        </Text>
      </View>
    );
  }, [isConnected, audioEnabled]);

  // Picture-in-picture view
  if (isMinimized && isConnected) {
    return (
      <Animated.View
        style={[
          styles.pipContainer,
          {
            left: pipPosition.x,
            top: pipPosition.y,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.pipContent, { backgroundColor: colors.primary }]}>
          <View style={styles.pipHeader}>
            <Text style={styles.pipTitle}>Anna</Text>
            <TouchableOpacity onPress={() => setIsMinimized(false)}>
              <Maximize2 color="white" size={16} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pipVideoContainer}>
            <View style={styles.pipAvatar}>
              <Text style={styles.pipAvatarText}>🤖</Text>
            </View>
          </View>
          
          <View style={styles.pipControls}>
            <TouchableOpacity onPress={toggleMute} style={styles.pipControlButton}>
              {audioEnabled ? <Mic color="white" size={14} /> : <MicOff color="white" size={14} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={leaveCall} style={[styles.pipControlButton, styles.pipEndButton]}>
              <X color="white" size={14} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.pipDuration}>{formatDuration(callDuration)}</Text>
        </View>
      </Animated.View>
    );
  }

  // Full screen modal
  return (
    <Modal
      visible={visible && !isMinimized}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={leaveCall}
    >
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Header - Completely transparent background */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setIsMinimized(true)} style={styles.headerButton}>
              <Minimize2 color={colors.text} size={20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 }]}>
              {isConnected 
                ? hasAvatarParticipant 
                  ? 'Anna - AI Assistant' 
                  : 'Connecting to Anna...'
                : 'Video Chat with Anna'
              }
            </Text>
            {isConnected && (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {formatDuration(callDuration)} • {60 - callDuration}s remaining
              </Text>
            )}
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={leaveCall} style={styles.headerButton}>
              <X color={colors.text} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main content area */}
        <View style={styles.content}>
          {connectionError ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorTitle, { color: colors.error }]}>
                Connection Failed
              </Text>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {connectionError}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={joinCall}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : !isConnected ? (
            <View style={styles.centerContainer}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <User color="white" size={50} />
                </View>
                <Text style={[styles.avatarLabel, { color: colors.text }]}>
                  Anna - Nurse Assistant
                </Text>
              </View>
              
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isLoading ? 'Connecting to Anna...' : 'Ready to start video chat'}
              </Text>
              
              {!isLoading && (
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: colors.primary }]}
                  onPress={joinCall}
                >
                  <Text style={styles.joinButtonText}>
                    🎥 Start Video Chat
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.videoContainer}>
              {renderAudioIndicator()}
              {/* Debug info */}
              <Text style={{ color: colors.text, position: 'absolute', top: 10, left: 10, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5 }}>
                Participants: {participantCount} | Connected: {isConnected ? 'Yes' : 'No'} | Audio: {audioEnabled ? 'On' : 'Off'}
              </Text>

              {/* Video participants */}
              {Object.values(participants).map(renderParticipantVideo)}

              {/* Fallback UI when no participants or no playable tracks */}
              {(!participantCount || !Object.values(participants).some((p: any) => p.tracks?.audio?.state === 'playable' || p.tracks?.video?.state === 'playable')) && (
                <View style={[styles.videoBox, { backgroundColor: colors.background }]}>
                  <View style={styles.videoContent}>
                    <View style={[styles.avatarVideo, { backgroundColor: colors.primary }]}>
                      <Dog color="white" size={50} />
                    </View>
                    <Text style={[styles.videoLabel, { color: colors.text }]}>
                      {participantCount ? 'Connecting video...' : 'Waiting for Anna...'}
                    </Text>
                  </View>
                  
                  <View style={styles.statusIndicatorContainer}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.connectionStatus, { color: colors.textSecondary }]}>
                      {participantCount ? 'Establishing connection...' : 'Connecting...'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer controls */}
        {isConnected && (
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <View style={styles.controls}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { backgroundColor: audioEnabled ? colors.background : colors.error }
                ]}
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                {audioEnabled ? <Mic color={colors.text} size={24} /> : <MicOff color="white" size={24} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.endCallButton, { backgroundColor: colors.error }]}
                onPress={leaveCall}
                activeOpacity={0.7}
              >
                <Text style={styles.endCallButtonText}>End Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.background }]}
                onPress={() => setIsMinimized(true)}
                activeOpacity={0.7}
              >
                <Minimize2 color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'transparent', // Completely transparent
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent', // Transparent background
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 20,
    borderRadius: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 48,
  },
  avatarLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 30,
    textAlign: 'center',
  },
  joinButton: {
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
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBox: {
    width: '100%',
    height: '70%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  videoContent: {
    alignItems: 'center',
  },
  avatarVideo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarVideoText: {
    fontSize: 60,
  },
  videoLabel: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  statusIndicatorContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  endCallButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  endCallButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Picture-in-picture styles
  pipContainer: {
    position: 'absolute',
    width: 100,
    height: 140,
    zIndex: 1000,
    elevation: 10,
  },
  pipContent: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pipTitle: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  pipVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipAvatarText: {
    fontSize: 20,
  },
  pipControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pipControlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipEndButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  pipDuration: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  participantVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  audioIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 12,
    zIndex: 100,
  },
  audioLevelContainer: {
    width: 20,
    height: 30,
    justifyContent: 'flex-end',
  },
  audioLevelBar: {
    width: 3,
    marginRight: 8,
  },
  audioStatus: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});

export default TaviChat;