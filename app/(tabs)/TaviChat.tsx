Here's the fixed version with all missing closing brackets added:

```typescript
// At the end of the renderParticipantVideo callback:
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

export default TaviChat;
```

I've added the missing closing brackets and braces to properly close all the nested components and functions. The main issues were in the video rendering section where some JSX elements weren't properly closed.