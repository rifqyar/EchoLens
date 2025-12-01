import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  TouchableOpacity,
  Platform,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import { IconButton, Snackbar } from 'react-native-paper';
import AudioRecord from 'react-native-audio-record';
import { Buffer } from 'buffer';
import { AppHeader } from '../components/layout/AppHeader';
import RNFS from 'react-native-fs';
import { COLORS } from '../assets/theme';
import BluetoothSco from '../ble/BluetoothSco';

type NotifState = {
  visible: boolean;
  text: string;
};

const SoundRecording: React.FC = ({ navigation }: any) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<string>('00:00');
  const buttonScale = useRef<Animated.Value>(new Animated.Value(1)).current;
  const [notifSaved, setNotifSavedFile] = useState<NotifState>({
    visible: false,
    text: '',
  });

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const onDismissNotifSave = () => setNotifSavedFile({
    visible: false,
    text: ''
  })

  // -------------------------------------------
  // 1) FIX: Pasang NativeEventEmitter sekali saja
  // -------------------------------------------
  const audioEmitter = new NativeEventEmitter(NativeModules.AudioRecord); // <<< FIX
  const chunksRef = useRef<any[]>([]); // optional kalau mau pakai PCM chunks

  useEffect(() => {
    const sub = audioEmitter.addListener('data', onAudioData); // <<< FIX
    return () => sub.remove();
  }, []);

  // -------------------------------------------
  // 2) FIX: Handler event "data"
  // -------------------------------------------
  const onAudioData = (data: any) => {
    if (!data || !data.data) return;

    const buffer = Buffer.from(data.data, 'base64');

    // Amplitudo untuk animasi tombol
    let maxVal = 0;
    for (let i = 0; i < buffer.length; i += 2) {
      const val = buffer.readInt16LE(i);
      maxVal = Math.max(maxVal, Math.abs(val));
    }
    const normalized = Math.min(1, maxVal / 32768);

    Animated.spring(buttonScale, {
      toValue: 1 + normalized * 0.5,
      useNativeDriver: false,
      friction: 3,
    }).start();
  };

  // -------------------------------------------
  // START RECORDING
  // -------------------------------------------
  const startRecording = async () => {
    BluetoothSco.startSco(); // aktifkan mic Bluetooth

    // Reset chunk
    chunksRef.current = [];

    setRecording(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const diff = Date.now() - startTimeRef.current;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRecordTime(
        `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    }, 100) as unknown as number;

    // Init recorder (iOS = 8000Hz wajib)
    AudioRecord.init({
      sampleRate: Platform.OS === 'android' ? 16000 : 8000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: 'temp_record.wav',
    });

    // 🔥 Penting: JS event listener sudah terpasang di useEffect, aman
    AudioRecord.start();

    // Debug output route
    NativeModules.AppDelegateHelper?.logAudioRoute?.();
  };

  // -------------------------------------------
  // STOP RECORDING
  // -------------------------------------------
  const stopRecording = async () => {
    BluetoothSco.stopSco();

    setRecording(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    setRecordTime('00:00');

    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: false,
    }).start();

    let filePath = '';
    try {
      filePath = await AudioRecord.stop(); // path ke temp_record.wav
    } catch (e) {
      console.error('STOP ERROR:', e);
      return;
    }

    // -------------------------------------------
    // SAVE FILE
    // -------------------------------------------
    try {
      const timestamp = Date.now();
      const fileName = `recording-${timestamp}.wav`;
      const basePath =
        Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/Documents/TactID`
          : `${RNFS.DocumentDirectoryPath}/TactID`;

      const folderPath = `${basePath}/Audio`;
      const folderText = `${basePath}/Text`;
      const destPath = `${folderPath}/${fileName}`;

      const exists = await RNFS.exists(folderPath);
      if (!exists) await RNFS.mkdir(folderPath);

      const existsText = await RNFS.exists(folderText);
      if (!existsText) await RNFS.mkdir(folderText);

      await RNFS.moveFile(filePath, destPath);

      setNotifSavedFile({
        visible: true,
        text: '📂 File moved to: ' + destPath,
      });

      console.log('📂 File moved to:', destPath);
    } catch (err) {
      console.error('❌ Save file error:', err);
    }
  };

  const HistoryButton = () => {
    return (
      <TouchableOpacity
        style={{
          marginRight: 10,
          marginLeft: 'auto'
        }}
        onPress={() => {
          navigation.push('HistoryScreen')
        }}
      >
        <Text style={{ color: COLORS.secondary }}>History Recording</Text>
        {/* <MaterialDesignIcons name='history' size={24} color={COLORS.lightGrey} /> */}
      </TouchableOpacity>
    )
  }

  return (
    <>
      <AppHeader withBack title='Recording'>
        <HistoryButton />
      </AppHeader>
      <View style={styles.container}>
        <Text style={styles.timer}>{recordTime}</Text>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <IconButton
            icon={recording ? 'stop' : 'microphone'}
            size={64}
            onPress={recording ? stopRecording : startRecording}
            style={styles.button}
            iconColor="#fff"
          />
        </Animated.View>
      </View>
      <Snackbar
        visible={notifSaved.visible}
        onDismiss={onDismissNotifSave}
        action={{
          label: 'Close',
          onPress: () => {
            setNotifSavedFile({
              visible: false,
              text: ''
            })
          },
        }}>
        {notifSaved.text ?? ''}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    color: '#fff',
    fontSize: 32,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 50,
  },
});

export default SoundRecording;
