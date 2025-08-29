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
import BluetoothSco from '../ble/BluetoothSco'
import { useAppSelector } from '../redux/store'
import RNFS from 'react-native-fs';
import LoadingScreen from '../components/common/LoadingScreen'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

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

const VoiceToTextRealtime = ({ navigation }: any) => {
  const [selectedIn, setSelectedIn] = useState<string>("");
  const [selectedOut, setSelectedOut] = useState<string>("");
  const [partialOriginal, setPartialOriginal] = useState("");
  const [partialTranslated, setPartialTranslated] = useState("");
  const [listening, setListening] = useState(false);
  const isFocused = useIsFocused()
  const ws = useRef<WebSocket | null>(null);
  const [notifLang, setNotifLang] = React.useState(false);
  const [notifPeripheral, setNotifPeripheral] = React.useState(false);
  const onDismissNotifLang = () => setNotifLang(false);
  const onDismissNotifDevice = () => setNotifPeripheral(false);
  const [state, setState] = React.useState('Idle');
  const device = useAppSelector((state) => state.deviceConnectionReducer?.device)

  const [notifSaved, setNotifSavedFile] = useState<NotifState>({
    visible: false,
    text: ''
  })

  const [textNotif, setTextNotif] = useState<string>('');
  const [statusVisible, setStatusVisible] = useState<boolean>(false)

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

  useEffect(() => {
    const sub = BluetoothSco.addListener((s) => {
      console.log('SCO State:', s);
      setState(s);
    });
    return () => sub.remove();
  }, []);

  const connectToWs = async () => {
    ws.current = new WebSocket("ws://182.253.172.27:30080/ws/status");
    // ws.current = new WebSocket("ws://172.20.10.2:4053/ws/status");

    ws.current.onopen = () => {
      console.log("Connected to Python server ✅ (waiting to start recording)");
    };

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      console.log(msg)

      switch (msg.status) {
        case 'uploading':
          setStatusVisible(true)
          setTextNotif('Uploading File')
          break;

        case 'transcribing':
          setStatusVisible(true)
          setTextNotif('Transcribing File')
          break;

        case 'translating':
          setTextNotif(`Translating from ${selectedIn} to ${selectedOut}`)
          break;

        case 'done':
          setPartialOriginal(msg.original_text)
          setPartialTranslated(msg.translated_text)
          setStatusVisible(false)
          setTextNotif('')
          break;

        default:
          break;
      }
    };

    ws.current.onerror = (e) => console.error("WS Error", e);
    ws.current.onclose = () => console.log("WS Closed");
  };

  // ======================
  // Start Recording
  // ======================
  const startRecording = async () => {
    const startSco = async () => {
      BluetoothSco.startSco(); // aktifkan mic Bluetooth
    }

    const peripheralConnected = await checkConnectedPeripheral() ?? false
    if (peripheralConnected) {
      if (selectedIn != '' && selectedOut != '') {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          await startSco()
          setPartialOriginal('')
          setPartialTranslated('')

          AudioRecord.init({
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            wavFile: 'temp_record.wav',
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
    } else {
      setNotifPeripheral(true)
    }
  };

  const stopRecording = async () => {
    const filePath = await AudioRecord.stop();
    BluetoothSco.stopSco()

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'end' }));
    }

    // === Simpan ke folder Documents/OptiLens ===
    try {
      const timestamp = Date.now();
      const fileName = `recording-${selectedIn}-${timestamp}.wav`;

      const folderPath = `${RNFS.ExternalStorageDirectoryPath}/Documents/OptiLens/Audio`;
      const folderText = `${RNFS.ExternalStorageDirectoryPath}/Documents/OptiLens/Text`;
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

      // === Upload ke server FastAPI ===
      const formData = new FormData();
      formData.append("file", {
        uri: "file://" + destPath,
        type: "audio/wav",
        name: fileName,
      });
      formData.append("input_lang", selectedIn || "auto");
      formData.append("output_lang", selectedOut || "id");

      // const response = await fetch("http://172.20.10.2:4053/upload", {
      const response = await fetch("http://182.253.172.27:30080/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const result = await response.json();
      console.log("✅ Upload result:", result);

      const destPathText = `${folderText}/${fileName}`;
      const txtPath = await saveTranscriptToFile(destPathText);

      if (txtPath) {
        setNotifSavedFile({
          visible: true,
          text: "📝 Transcript saved to: " + txtPath,
        });
      }
    } catch (err) {
      console.error('❌ Gagal simpan file:', err);
    }

    setListening(false);
  };

  const saveTranscriptToFile = async (
    audioPath: string,
  ): Promise<string | undefined> => {
    try {
      const original = partialOriginal
      const translated = partialTranslated
      const langIn = selectedIn
      const langOut = selectedOut

      const folderPath = audioPath.substring(0, audioPath.lastIndexOf("/"));
      const baseName = audioPath.substring(
        audioPath.lastIndexOf("/") + 1,
        audioPath.lastIndexOf(".")
      );
      const txtPath = `${folderPath}/${baseName}.txt`;

      const now = new Date();
      const timestamp = now.toISOString().replace("T", " ").substring(0, 19); // contoh: 2025-08-29 14:23:10

      const content = `========================================
                        📂 FILE NAME: ${baseName}.wav
                        🕒 DATE: ${timestamp}
                        ========================================
  
                        🔊 ORIGINAL TEXT
                        ----------------------------------------
                        ${original || "-"}
  
                        🌐 TRANSLATED TEXT (${langIn} → ${langOut})
                        ----------------------------------------
                        ${translated || "-"}
                        `;

      await RNFS.writeFile(txtPath, content, "utf8");
      console.log("📝 Transcript saved to:", txtPath);

      return txtPath;
    } catch (err) {
      console.error("❌ Gagal simpan transcript:", err);
      return undefined;
    }
  };

  const checkConnectedPeripheral = async () => {
    if (Object.keys(device).length > 0) return true
  }

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

  const HistoryButton = () => {
    return (
      <TouchableOpacity
        style={{
          marginRight: 10,
        }}
        onPress={() => {
          navigation.push('HistoryScreen')
        }}
      >
        <MaterialDesignIcons name='history' size={24} color={COLORS.lightGrey} />
      </TouchableOpacity>
    )
  }

  return (
    <>
      <AppHeader title='Realtime Transcribe' withBack>
        <HistoryButton />
      </AppHeader>
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

      {
        statusVisible && (
          <LoadingScreen withBackground children={<Text style={{ marginTop: 20 }} variant='bodyMedium'>{textNotif}</Text>} />
        )
      }

      <Snackbar
        visible={notifLang}
        onDismiss={onDismissNotifLang}
        action={{
          label: 'Close',
          onPress: () => {
            setNotifLang(false)
          },
        }}>
        Please Select Language Input & Output First
      </Snackbar>

      <Snackbar
        visible={notifPeripheral}
        onDismiss={onDismissNotifDevice}
        action={{
          label: 'Close',
          onPress: () => {
            setNotifPeripheral(false)
          },
        }}>
        Please Connect to Peripheral First
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

export default VoiceToTextRealtime

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