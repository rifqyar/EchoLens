import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { Button, Surface, Switch, Text, Title, useTheme } from 'react-native-paper'
import { AppHeader } from '../components/layout/AppHeader'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { COLORS } from '../assets/theme'
import { SectionLayout } from '../components/layout/SectionLayout'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { useAppSelector } from '../redux/store'
import { useDispatch } from 'react-redux'
import { setAutoTranslationDisabled, setAutoTranslationEnabled, setVoiceToTextDisabled, setVoiceToTextEnabled } from '../redux/actions/smartFeatureAction'

const LiveControlScreen = () => {
  const isFocused = useIsFocused()
  const theme = useTheme()
  const dispatch = useDispatch()
  const voiceToTextEnabled = useAppSelector(state => state.smartFeatureReducer.voiceToTextFeature);
  const autoTranslationEnabled = useAppSelector(state => state.smartFeatureReducer.autoTranslateFeature);

  const [started, setStarted] = useState(false);
  const [results, setResults] = useState('');
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(theme.colors.secondary);
    StatusBar.setBarStyle('light-content');
  }, [isFocused])

  // useEffect(() => {
  //   // Set up event listeners
  //   const resultsListener = VoiceToText.addEventListener(
  //     VoiceToTextEvents.RESULTS,
  //     (event) => {
  //       setResults(event.value);
  //     }
  //   );

  //   const startListener = VoiceToText.addEventListener(
  //     VoiceToTextEvents.START,
  //     () => setIsListening(true)
  //   );

  //   const endListener = VoiceToText.addEventListener(
  //     VoiceToTextEvents.END,
  //     () => setIsListening(false)
  //   );

  //   // Clean up
  //   return () => {
  //     VoiceToText.destroy();
  //     resultsListener.remove();
  //     startListener.remove();
  //     endListener.remove();
  //   };
  // }, []);

  const handleVoiceToTextToggle = () => {
    if (!voiceToTextEnabled) {
      dispatch(setVoiceToTextEnabled())
    } else {
      dispatch(setVoiceToTextDisabled())
    }
  }

  const handleAutoTranslationToggle = () => {
    if (!autoTranslationEnabled) {
      dispatch(setAutoTranslationEnabled())
    } else {
      dispatch(setAutoTranslationDisabled())
    }
  }

  const toggleListening = async () => {
    try {
      console.log('Toggling listening:', !started);
    } catch (error) {
      console.error(error);
    }
  };

  // const stopRecognizing = async () => {
  //   try {
  //     await VoiceToText.stopListening();
  //     setStarted(false);
  //   } catch (e: any) {
  //     setError(e.message);
  //   }
  // };

  const clear = () => {
    setResults('');
    setError(null);
  };

  return (
    <>
      <AppHeader
        title="Live Control"
        withBack
      />
      <ScreenLayout scrollable={true} style={{
        backgroundColor: COLORS.blackLighten,
        paddingTop: 0,
        paddingBottom: 0,
      }}>
        {/* Live Feed */}
        <SectionLayout>
          <Surface style={{
            marginTop: 20,
            width: '90%',
            alignSelf: 'center',
            padding: 20,
            backgroundColor: COLORS.accentBlackLighten,
            borderRadius: 10,
            gap: 20
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.surface }}>
              Live Feed
            </Text>
            {/* Add live feed component here */}
          </Surface>
        </SectionLayout>

        {/* Trigger Button */}
        <SectionLayout>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 50,
            marginTop: 20,
          }}>
            <View style={{
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  // Handle trigger action
                }}
              >
                <MaterialDesignIcons name='camera' size={30} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={{
                textAlign: 'center',
                marginTop: 15,
                color: theme.colors.surface
              }}>Take Photo</Text>
            </View>
            <View style={{
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.accentTeal,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  // Handle trigger action
                }}
              >
                <MaterialDesignIcons name='video' size={30} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={{
                textAlign: 'center',
                marginTop: 15,
                color: theme.colors.surface
              }}>Record Video</Text>
            </View>
          </View>
        </SectionLayout>

        {/* Smart Feature */}
        <SectionLayout edges={['left', 'right']}>
          <Text variant={'titleMedium'} style={{ color: theme.colors.surface, marginBottom: 10, marginLeft: 20 }}>
            Smart Feature
          </Text>

          <Surface style={{
            marginTop: 20,
            alignSelf: 'center',
            width: '90%',
            padding: 20,
            backgroundColor: COLORS.accentBlackLighten,
            borderRadius: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialDesignIcons name='microphone-outline' size={16} color={theme.colors.onPrimary} />
                <View>
                  <Text style={{ fontSize: 16, color: theme.colors.surface }}>
                    Voice-to-Text
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.Grey }}>
                    Convert voice to text
                  </Text>
                </View>
              </View>
              <Switch value={voiceToTextEnabled} onValueChange={handleVoiceToTextToggle} />;
            </View>
          </Surface>

          <Surface style={{
            marginTop: 20,
            alignSelf: 'center',
            width: '90%',
            padding: 20,
            backgroundColor: COLORS.accentBlackLighten,
            borderRadius: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialDesignIcons name='microphone-outline' size={16} color={theme.colors.onPrimary} />
                <View>
                  <Text style={{ fontSize: 16, color: theme.colors.surface }}>
                    Auto Translation
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.Grey }}>
                    Real-time language translation
                  </Text>
                </View>
              </View>
              <Switch value={autoTranslationEnabled} onValueChange={handleAutoTranslationToggle} />;
            </View>
          </Surface>
        </SectionLayout>

        {/* Voice to Component Action */}
        {
          voiceToTextEnabled && (
            <SectionLayout edges={['left', 'right']} style={{ marginTop: 20 }}>
              <Text variant={'titleMedium'} style={{ color: theme.colors.surface, marginLeft: 20 }}>
                Voice to Text Action
              </Text>
              <Button
                mode="contained"
                style={{
                  marginTop: 20,
                  marginHorizontal: 20,
                  backgroundColor: COLORS.primary,
                }}
                onPress={toggleListening}>
                Start Listening
              </Button>
            </SectionLayout>
          )
        }
      </ScreenLayout >
    </>
  )
}

export default LiveControlScreen

const styles = StyleSheet.create({})