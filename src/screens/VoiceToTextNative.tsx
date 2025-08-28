import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, PermissionsAndroid, Alert } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import AudioRecorderPlayer, { AudioEncoderAndroidType, AudioSet, AudioSourceAndroidType, AVEncoderAudioQualityIOSType, OutputFormatAndroidType } from 'react-native-audio-recorder-player';

const audioRecorderPlayer = AudioRecorderPlayer;

const VoiceToTextRealtime: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Izin Mikrofon',
          message: 'App membutuhkan akses mikrofon untuk voice-to-text',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Batal',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const setupRecorder = async () => {
    const audioSet: AudioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 1,
      AVFormatIDKeyIOS: 'aac',
    };

    try {
      await audioRecorderPlayer.startRecorder(undefined, audioSet);
      audioRecorderPlayer.addRecordBackListener((e: any) => {
        // Bisa dipakai kalau mau stream data audio mentah ke server STT eksternal
        return;
      });
    } catch (e) {
      console.error('Recorder setup error:', e);
    }
  };

  const startListening = async () => {
    const permission = await requestMicrophonePermission();
    if (!permission) {
      Alert.alert('Permission Denied', 'Tidak bisa mengakses mikrofon');
      return;
    }

    await setupRecorder();

    try {
      setIsListening(true);
      await Voice.start('en-US'); // Bahasa Indonesia
    } catch (e) {
      console.error('Voice start error:', e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsListening(false);
    } catch (e) {
      console.error('Voice stop error:', e);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setText(e.value[0]); // hasil final
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setText(e.value.join(' ')); // hasil parsial → realtime transkrip
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech Error: ', e);
    setIsListening(false);
    Alert.alert('Voice Error', JSON.stringify(e.error));
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        {text || 'Tekan tombol untuk mulai bicara'}
      </Text>
      <Button
        title={isListening ? 'Stop Listening' : 'Start Listening'}
        onPress={isListening ? stopListening : startListening}
      />
    </View>
  );
};

export default VoiceToTextRealtime;
