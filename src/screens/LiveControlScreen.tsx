import { Alert, Linking, NativeEventEmitter, NativeModules, PermissionsAndroid, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import RNFS from 'react-native-fs';
import axios from 'axios'
import BleManager from 'react-native-ble-manager';
import { useSmartGlassesTrigger } from '../ble/TriggerEvents'
import BluetoothSco from '../ble/BluetoothSco'
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'rn-fetch-blob';
import { Buffer } from 'buffer'

const audioRecorderPlayer = AudioRecorderPlayer;

const LiveControlScreen = () => {
  const isFocused = useIsFocused()
  const theme = useTheme()
  const dispatch = useDispatch()
  const voiceToTextEnabled = useAppSelector(state => state.smartFeatureReducer.voiceToTextFeature);
  const autoTranslationEnabled = useAppSelector(state => state.smartFeatureReducer.autoTranslateFeature);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingVideo, setRecodingVideo] = useState(false);
  const [recordingAudio, setRecodingAudio] = useState(false);
  const device = useAppSelector((state) => state.deviceConnectionReducer?.device)
  const { triggerCapture, triggerStartVideo, triggerStopVideo, triggerStartAudio, triggerStopAudio } = useSmartGlassesTrigger(device.id);


  type Transcription = {
    original: string;
    translated: string;
    lang: string;
  };

  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(theme.colors.secondary);
    StatusBar.setBarStyle('light-content');

    BleManager.start({ showAlert: false })
  }, [isFocused])

  const [state, setState] = React.useState('Idle');
  useEffect(() => {
    const sub = BluetoothSco.addListener((s) => {
      console.log('SCO State:', s);
      setState(s);
    });
    return () => sub.remove();
  }, []);

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

  const sendAudioToAPI = async () => {
    try {
      // Path di assets (Android) harus pakai asset://
      const assetPath = 'asset:/jfk.wav';

      // Path tujuan copy ke cache directory supaya bisa diakses sebagai file
      const destPath = `${RNFS.CachesDirectoryPath}/jfk.wav`;

      // Copy file dari asset ke cache (hanya jika belum ada)
      const fileExists = await RNFS.exists(destPath);
      if (!fileExists) {
        await RNFS.copyFileAssets('jfk.wav', destPath);
      }

      const formData = new FormData();
      formData.append('audio_file', {
        uri: `file://${destPath}`,
        name: Platform.OS == 'android' ? 'audio.wav' : 'audio.wav',
        type: 'audio/wav',
      });

      console.log(formData)
      const response = await axios.post(
        'http://172.20.10.2:4053/transcribe_translate/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log(response)
      if (response.data) {
        setTranscriptions((prev) => [
          ...prev,
          {
            original: response.data.original_text,
            translated: response.data.translated_text,
            lang: response.data.detected_lang,
          },
        ]);
      }
    } catch (error) {
      console.log('Send audio error:', error);
    }
  };

  async function requestStoragePermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to save recordings',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permission granted');
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log('User set Never Ask Again');
        return 'never';
      } else {
        console.log('Permission denied');
        return false;
      }
    }
    return true;
  }

  const startRecording = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (hasPermission) {
        BluetoothSco.startSco(); // aktifkan mic Bluetooth

        const dirs = RNFetchBlob.fs.dirs;
        const path = `${dirs.DownloadDir}/recording_${Date.now()}.mp4`;
        const uri = await audioRecorderPlayer.startRecorder(path);
        console.log('Recording at:', uri);
        setRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      console.log('Stopped at:', result);
      BluetoothSco.stopSco(); // matikan SCO
      setRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const recordVideo = async () => {
    if (!recordingVideo) {
      setRecodingVideo(!recordingVideo)
      triggerStartVideo()
    }

    if (recordingVideo) {
      setRecodingVideo(!recordingVideo)
      triggerStopVideo()
    }
  }

  const recordAudio = async () => {
    if (!recordingAudio) {
      setRecodingAudio(!recordingAudio)
      triggerStartAudio()
    }

    if (recordingAudio) {
      setRecodingAudio(!recordingAudio)
      triggerStopAudio()
    }
  }

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
                onPress={triggerCapture}
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
                  recordVideo()
                }}
              >
                <MaterialDesignIcons name='video' size={30} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={{
                textAlign: 'center',
                marginTop: 15,
                color: theme.colors.surface
              }}>{recordingVideo ? 'Stop Recording' : 'Record Video'}</Text>
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
                  backgroundColor: COLORS.darkBlue,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  recordAudio()
                }}
              >
                <MaterialDesignIcons name='microphone-outline' size={30} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={{
                textAlign: 'center',
                marginTop: 15,
                color: theme.colors.surface
              }}>{recordingAudio ? 'Stop Recording' : 'Record Audio'}</Text>
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
                onPress={() => {
                  if (!recording) {
                    setRecording(!recording)
                    startRecording()
                  } else {
                    setRecording(!recording)
                    stopRecording()
                  }
                }}>
                {recording ? 'Stop Listening' : 'Start Listening'}
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