import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { IconButton, Snackbar } from 'react-native-paper';
import AudioRecord from 'react-native-audio-record';
import { Buffer } from 'buffer';
import { AppHeader } from '../components/layout/AppHeader';
import RNFS from 'react-native-fs';

type NotifState = {
  visible: boolean,
  text: string
}

const SoundRecording: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<string>('00:00');
  const buttonScale = useRef<Animated.Value>(new Animated.Value(1)).current;
  const [notifSaved, setNotifSavedFile] = useState<NotifState>({
    visible: false,
    text: ''
  })

  const onDismissNotifSave = () => setNotifSavedFile({
    visible: false,
    text: ''
  })

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    setRecording(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const diff = Date.now() - startTimeRef.current;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRecordTime(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 100) as unknown as number;

    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: 'temp_record.wav',
    });
    AudioRecord.start();

    AudioRecord.on('data', (data: string) => {
      const buffer = Buffer.from(data, 'base64');
      let maxVal = 0;
      for (let i = 0; i < buffer.length; i += 2) {
        const val = buffer.readInt16LE(i);
        maxVal = Math.max(maxVal, Math.abs(val));
      }
      const normalized = Math.min(1, maxVal / 32768);

      Animated.spring(buttonScale, {
        toValue: 1 + normalized * 0.5, // tombol membesar sesuai level
        useNativeDriver: false,
        friction: 3,
      }).start();
    });
  };

  const stopRecording = async () => {
    setRecording(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    setRecordTime('00:00');
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
    const filePath = await AudioRecord.stop();

    // === Simpan ke folder Documents/OptiLens ===
    try {
      const timestamp = Date.now();
      const fileName = `recording-${timestamp}.wav`;

      const folderPath = `${RNFS.ExternalStorageDirectoryPath}/Documents/OptiLens/Audio`;
      const folderText = `${RNFS.ExternalStorageDirectoryPath}/Documents/OptiLens/Text`;
      const destPath = `${folderPath}/${fileName}`;

      // pastikan folder ada
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        await RNFS.mkdir(folderPath);
        console.log('📁 Folder created:', folderPath);
      }

      // pastikan folder ada
      const existsText = await RNFS.exists(folderText);
      if (!existsText) {
        await RNFS.mkdir(folderText);
        console.log('📁 Folder created:', folderText);
      }

      await RNFS.moveFile(filePath, destPath);
      setNotifSavedFile({
        visible: true,
        text: '📂 File moved to: ' + destPath
      })

      console.log('📂 File moved to:', destPath);
    } catch (err) {
      console.error('❌ Gagal simpan file:', err);
    }
  };

  return (
    <>
      <AppHeader withBack />
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
