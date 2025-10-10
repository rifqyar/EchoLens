import { PermissionsAndroid, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { SectionLayout } from '../components/layout/SectionLayout'
import SelectOptions, { Option } from '../components/common/SelectOptions'
import { COLORS } from '../assets/theme'
import { Button, Snackbar, Surface, Text } from 'react-native-paper'
import LinearGradient from 'react-native-linear-gradient'
import { useIsFocused } from '@react-navigation/native'
import AudioRecord from 'react-native-audio-record'
import RNFS from 'react-native-fs';

type Transcription = {
  original: string;
  translated: string;
  lang: string;
};

const optionsIn: Option[] = [
  { label: "Select Input Language", value: "" },
  { label: "Indonesian", value: "id" },
  { label: "English", value: "en" },
  { label: "Chinese", value: "zh" },
];

const optionsOut: Option[] = [
  { label: "Select Output Language", value: "" },
  { label: "Indonesian", value: "id" },
  { label: "English", value: "en" },
  { label: "Chinese (Simplified)", value: "zh-CN" },
  { label: "Chinese (Traditional)", value: "zh-TW" },
];

type NotifState = {
  visible: boolean,
  text: string
}

const VoiceToTextScreen = () => {
  const [selectedIn, setSelectedIn] = useState<string>("");
  const [selectedOut, setSelectedOut] = useState<string>("");
  const [partialOriginal, setPartialOriginal] = useState("");
  const [partialTranslated, setPartialTranslated] = useState("");
  const [listening, setListening] = useState(false);
  const isFocused = useIsFocused()
  const ws = useRef<WebSocket | null>(null);
  const [notifLang, setNotifLang] = React.useState(false);
  const onDismissSnackBar = () => setNotifLang(false);
  const [notifSaved, setNotifSavedFile] = useState<NotifState>({
    visible: false,
    text: ''
  })
  const onDismissNotifSave = () => setNotifSavedFile({
    visible: false,
    text: ''
  })

  useEffect(() => {
    const checkPermissions = async () => {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) {
        console.warn("⚠️ Permission belum diberikan, tidak bisa rekam");
      } else {
        console.log("✅ Permission oke, siap rekam");
        connectToWs();
      }
    };

    checkPermissions();
    connectToWs()
    return () => {
      ws.current?.close()
    }
  }, [])

  const connectToWs = async () => {
    ws.current = new WebSocket("ws://182.253.172.27:30080/ws/transcribe");

    ws.current.onopen = () => {
      console.log("Connected to Python server ✅ (waiting to start recording)");
    };

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "partial") {
        setPartialOriginal(prev => (prev + " " + (msg.original_text || "")).trim());
        setPartialTranslated(prev => (prev + " " + (msg.translated_text || "")).trim());
      }

      if (msg.type === "done") {
        console.log("✅ Done received, ready for new session");
      }

      // if (msg.type === "final") {
      //   console.log("🎯 Final:", msg.original_text, "→", msg.translated_text);
      //   setPartialOriginal(msg.accumulated_original || '');
      //   setPartialTranslated(msg.accumulated_translated || '');
      // }
    };

    ws.current.onerror = (e) => console.error("WS Error", e);
    ws.current.onclose = () => console.log("WS Closed");
  };

  // ======================
  // Start Recording
  // ======================
  const startRecording = async () => {
    if (selectedIn != '' && selectedOut != '') {
      console.log(ws.current && ws.current.readyState)
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        setPartialOriginal('')
        setPartialTranslated('')

        console.log('🎙️ Start Recording...');
        ws.current.send(JSON.stringify({
          type: "start",
          input_lang: selectedIn,
          output_lang: selectedOut,
        }));

        AudioRecord.init({
          sampleRate: 16000,
          channels: 1,
          bitsPerSample: 16,
          wavFile: 'temp_record.wav',
        });

        // ambil data PCM dari native modul
        AudioRecord.on('data', (data: string) => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'audio_chunk',
              data: data,
            }));
          }
        });

        AudioRecord.start();
        setListening(true);
      } else {
        await connectToWs()
        startRecording()
      }
    } else {
      setNotifLang(true)
    }
  };

  const stopRecording = async () => {
    console.log('⏹️ Stop Recording...');
    const filePath = await AudioRecord.stop();
    console.log('Saved file:', filePath); 

    // Matikan listener supaya nggak kirim chunk lagi
    AudioRecord.on('data', () => { }); // reset callback jadi kosong

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'end' }));
    }

    // === Simpan ke folder Documents/TactID ===
    try {
      const timestamp = Date.now();
      const fileName = `recording-${selectedIn}-${timestamp}.wav`;

      const folderPath = `${RNFS.ExternalStorageDirectoryPath}/Documents/TactID/Audio`;
      const destPath = `${folderPath}/${fileName}`;

      // pastikan folder ada
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        await RNFS.mkdir(folderPath);
        console.log('📁 Folder created:', folderPath);
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
    setListening(false);
  };

  async function requestAudioPermissions() {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        console.log("Permission result:", granted);

        if (
          granted["android.permission.RECORD_AUDIO"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.WRITE_EXTERNAL_STORAGE"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.READ_EXTERNAL_STORAGE"] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log("✅ Semua permission diberikan");
          return true;
        } else {
          console.log("❌ Ada permission yang ditolak");
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS otomatis handle via Info.plist
  }

  return (
    <>
      <AppHeader title='Voice To Text' withBack />
      <ScreenLayout withBackgroundImg edges={['left', 'right']} style={{ marginHorizontal: 20 }}>
        {/* Header  */}
        <SectionLayout style={styles.headerWrapper}>
          <View style={styles.languageWrapper}>
            <SelectOptions
              label="Select Input Language"
              options={optionsIn}
              backgroundColor={COLORS.tertiary}
              selectedValue={selectedIn}
              onValueChange={setSelectedIn}
            />
          </View>

          <TouchableOpacity
            style={[styles.listeningButton, {
              marginTop: 10
            }]}
            onPress={() => {
              if (!listening) {
                startRecording()
              } else {
                stopRecording()
              }
            }}
          >
            <LinearGradient
              style={[styles.listeningButton, {
                paddingHorizontal: 25,
                paddingVertical: 12
              }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={[COLORS.secondary, COLORS.Indigo]}
            >
              <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: COLORS.white }}>
                {listening ? 'Stop Listening' : 'Start Listening'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SectionLayout>

        {/* Original Text Wrapper */}
        <LinearGradient
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          colors={[COLORS.secondary, COLORS.Indigo, 'transparent', 'transparent']}
          locations={[0, 0.2, 0.9, 1]}
          style={styles.outputOuterWrapper}
        >
          <View style={styles.outputInnerWrapper}>
            <Text variant='bodyMedium' style={{ color: COLORS.white }}>
              {partialOriginal}
            </Text>
          </View>
        </LinearGradient>

        {/* Translated Text Wrapper */}
        <LinearGradient
          start={{ x: 1, y: 1 }}
          end={{ x: 1, y: 0 }}
          colors={[COLORS.primary, COLORS.accentRed, 'transparent', 'transparent']}
          locations={[0, 0.2, 0.9, 1]}
          style={[styles.outputOuterWrapper, { marginBottom: 20 }]}
        >
          <View style={styles.outputInnerWrapper}>
            <Text variant='bodyMedium' style={{ color: COLORS.white }}>
              {partialTranslated}
            </Text>
          </View>
        </LinearGradient>

        {/* Footer */}
        <SectionLayout style={styles.footerWrapper}>
          <View style={styles.languageWrapper}>
            <SelectOptions
              label="Select Input Language"
              options={optionsOut}
              backgroundColor={COLORS.tertiary}
              selectedValue={selectedOut}
              onValueChange={setSelectedOut}
            />
          </View>
        </SectionLayout>
      </ScreenLayout>

      <Snackbar
        visible={notifLang}
        onDismiss={onDismissSnackBar}
        action={{
          label: 'Close',
          onPress: () => {
            setNotifLang(false)
          },
        }}>
        Please Select Language Input & Output First
      </Snackbar>

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
  )
}

export default VoiceToTextScreen

const styles = StyleSheet.create({
  headerWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 30,
    justifyContent: 'center',
  },
  footerWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 30,
    marginBottom: 20
  },
  languageWrapper: {
    width: '50%'
  },
  listeningButton: {
    width: 'auto',
    borderRadius: 15,
  },
  outputOuterWrapper: {
    flex: 1,
    marginTop: 20,
    borderRadius: 30,
    padding: 3
  },
  outputInnerWrapper: {
    flex: 1,
    borderRadius: 30,
    padding: 25,
    backgroundColor: COLORS.background,
  }
})