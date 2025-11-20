import { ActivityIndicator, Alert, PermissionsAndroid, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { SectionLayout } from '../components/layout/SectionLayout'
import SelectOptions, { Option } from '../components/common/SelectOptions'
import { COLORS, SIZES } from '../assets/theme'
import { Button, Dialog, Portal, Snackbar, Surface, Text } from 'react-native-paper'
import LinearGradient from 'react-native-linear-gradient'
import { useIsFocused } from '@react-navigation/native'
import AudioRecord from 'react-native-audio-record'
import RNFS from 'react-native-fs';
import LoadingScreen from '../components/common/LoadingScreen'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { PickerIOS } from '@react-native-picker/picker'
import { ItemValue } from '@react-native-picker/picker/typings/Picker'
import BluetoothSco from '../ble/BluetoothSco'
import Tts from "react-native-tts";

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

const TTS_LANG_MAP: Record<string, string> = {
  id: "id-ID",
  en: "en-US",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
};

const VoiceToTextScreen = ({ navigation }: any) => {
  const [selectedIn, setSelectedIn] = useState<string>("");
  const [selectedOut, setSelectedOut] = useState<string>("");
  const [partialOriginal, setPartialOriginal] = useState("");
  const [partialTranslated, setPartialTranslated] = useState("");
  const [listening, setListening] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const [notifLang, setNotifLang] = React.useState(false);
  const onDismissSnackBar = () => setNotifLang(false);
  const [notifSaved, setNotifSavedFile] = useState<NotifState>({
    visible: false,
    text: ''
  })

  const [textNotif, setTextNotif] = useState<string>('');
  const [statusVisible, setStatusVisible] = useState<boolean>(false)

  const [carMake, setCarMake] = React.useState<string>('cadillac');
  const [modelIndex, setModelIndex] = React.useState(3);

  const [pickerIOSIn, setPickerIOSIn] = useState(false)
  const [pickerIOSOut, setPickerIOSOut] = useState(false)

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
      }
    };

    checkPermissions();
    return () => {
      ws.current?.close()
    }
  }, [])

  const connectToWs = async (jobId: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      ws.current = new WebSocket(`wss://optilens.rekayasadigital.com/ws/status/${jobId}`);
      // ws.current = new WebSocket(`ws://182.253.172.27:30080/ws/status/${jobId}`);
      // ws.current = new WebSocket(`ws://172.20.10.2:4053/ws/status/${jobId}`);

      ws.current.onopen = () => {
        console.log(`Connected to Python server ✅ (job_id=${jobId})`);
        resolve()
      };

      ws.current.onmessage = async (e) => {
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
            const textPath = await saveTranscriptToFile(jobId, msg.original_text, msg.translated_text)
            if (textPath) {
              setNotifSavedFile({
                visible: true,
                text: "📝 Transcript saved to: " + textPath,
              });
            }
            speakText(msg.translated_text)
            setTextNotif('')
            break;

          default:
            break;
        }
      };

      ws.current.onerror = (e) => {
        console.error("WS Error", e)
        setNotifSavedFile({
          visible: true,
          text: "Failed Connect to Our Service, Please check your connection",
        });
        reject(e);
      };
      ws.current.onclose = () => console.log("WS Closed");
    });
  };

  // ======================
  // Start Recording
  // ====================== 
  const startRecording = async () => {
    const startSco = async () => {
      BluetoothSco.startSco(); // aktifkan mic Bluetooth
    }

    if (selectedIn != '' && selectedOut != '') {
      await startSco()
      setPartialOriginal('')
      setPartialTranslated('')

      console.log('🎙️ Start Recording...');
      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        wavFile: 'temp_record.wav',
      });

      AudioRecord.start();
      setListening(true);
    } else {
      setNotifLang(true)
    }
  };

  const stopRecording = async () => {
    BluetoothSco.stopSco()
    console.log('⏹️ Stop Recording...');
    const filePath = await AudioRecord.stop();

    // === Simpan ke folder Documents/TactID ===
    try {
      const timestamp = Date.now();
      const fileName = `recording-${selectedIn}-${timestamp}.wav`;
      const basePath =
        Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/Documents/TactID`
          : `${RNFS.DocumentDirectoryPath}/TactID`;

      const folderPath = `${basePath}/Audio`;
      const folderText = `${basePath}/Text`;
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
        text: 'Recording Successfully Saved'
      })

      console.log('📂 File moved to:', destPath);
      await connectToWs(timestamp)

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        setStatusVisible(true)
        setTextNotif('Uploading File')

        try {
          // === Upload ke server FastAPI ===
          const formData = new FormData();
          formData.append("input_lang", selectedIn);
          formData.append("output_lang", selectedOut);
          formData.append("file", {
            uri: "file://" + destPath,
            type: "audio/wav",
            name: fileName,
          });
          formData.append("job_id", timestamp);

          // const response = await fetch("http://172.20.10.2:4053/upload", {
          const response = await fetch("https://optilens.rekayasadigital.com/upload", {
            method: "POST",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          });

          const result = await response.json();
          console.log("✅ Upload result:", result);
        } catch (uploadErr) {
          setStatusVisible(false)
          console.error('❌ Upload gagal:', uploadErr);
          setNotifSavedFile({
            visible: true,
            text: 'Failed upload to server, check your connection',
          });
        }
      } else {
        setNotifSavedFile({
          visible: true,
          text: "Gagal terhubung ke Backend API, cek koneksi anda"
        });
      }
    } catch (err) {
      console.error('❌ Gagal simpan file:', err);
    }
    setListening(false);
  };

  const saveTranscriptToFile = async (id: any, original: string, translated: string) => {
    try {
      const langIn = selectedIn
      const langOut = selectedOut

      const basePath =
        Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/Documents/TactID`
          : `${RNFS.DocumentDirectoryPath}/TactID`;
      const folderText = `${basePath}/Text`;
      const fileName = `recording-${selectedIn}-${id}.txt`;
      const destPath = `${folderText}/${fileName}`;

      const now = new Date();
      const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

      const content = `========================================
📂 FILE NAME: ${fileName}.wav
🕒 DATE: ${timestamp}
========================================

🔊 ORIGINAL TEXT
----------------------------------------
${original || "-"}

🌐 TRANSLATED TEXT (${langIn} → ${langOut})
----------------------------------------
${translated || "-"}
`;

      await RNFS.writeFile(destPath, content, "utf8");
      console.log("📝 Transcript saved to:", destPath);

      return destPath;
    } catch (err) {
      console.error("❌ Gagal simpan transcript:", err);
      return undefined;
    }
  };

  const speakText = async (text: string) => {
    try {
      const lang = selectedOut || "en"; // default fallback ke English
      const ttsLang = TTS_LANG_MAP[lang] ?? "en-US";

      // Set bahasa sebelum speak
      await Tts.setDefaultLanguage(ttsLang);
      console.log("🎤 TTS Speaking in:", ttsLang);

      await Tts.stop();
      await Tts.speak(text);
    } catch (err) {
      console.error("TTS Error:", err);
    }
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
        <Text style={{ color: COLORS.secondary }}>History Recording</Text>
        {/* <MaterialDesignIcons name='history' size={24} color={COLORS.lightGrey} /> */}
      </TouchableOpacity>
    )
  }

  return (
    <>
      <AppHeader title='Voice To Text' withBack>
        <HistoryButton />
      </AppHeader>
      <ScreenLayout withBackgroundImg edges={['left', 'right']} style={{ marginHorizontal: 20 }}>
        {/* Header  */}
        <View style={{
          flex: 0.2,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View style={{ flex: 0.6 }}>
            {
              Platform.OS == 'android'
                ?
                <SelectOptions
                  label=""
                  options={optionsIn}
                  backgroundColor={COLORS.tertiary}
                  selectedValue={selectedIn}
                  onValueChange={setSelectedIn}
                />
                :
                <TouchableOpacity style={styles.container} onPress={() => setPickerIOSIn(true)}>
                  <View
                    style={[
                      styles.pickerWrapper,
                      {
                        borderColor: COLORS.lightGrey,
                      },
                    ]}
                  >
                    <Text style={{ color: selectedIn == '' ? COLORS.Grey : COLORS.lightGrey }}>{selectedIn != '' ? (
                      <>
                        {optionsIn.filter((options) => options.value == selectedIn).map((selected) => selected.label)}
                      </>
                    ) : 'Select Input Language'}</Text>
                  </View>
                </TouchableOpacity>
            }
          </View>
          <View style={{ flex: 0.7 }}>
            <TouchableOpacity
              style={[styles.listeningButton, {
                marginTop: 10,
                paddingHorizontal: 20
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
          </View>
        </View>

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
            {
              Platform.OS == 'android'
                ?
                <SelectOptions
                  label=""
                  options={optionsOut}
                  backgroundColor={COLORS.tertiary}
                  selectedValue={selectedOut}
                  onValueChange={setSelectedOut}
                />
                :
                <TouchableOpacity style={styles.container} onPress={() => setPickerIOSOut(true)}>
                  <View
                    style={[
                      styles.pickerWrapper,
                      {
                        borderColor: COLORS.lightGrey,
                      },
                    ]}
                  >
                    <Text style={{ color: selectedOut == '' ? COLORS.Grey : COLORS.lightGrey }}>{selectedOut != '' ? (
                      <>
                        {optionsOut.filter((options) => options.value == selectedOut).map((selected) => selected.label)}
                      </>
                    ) : 'Select Output Language'}</Text>
                  </View>
                </TouchableOpacity>
            }
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

      <Portal>
        <Dialog visible={pickerIOSIn}>
          <Dialog.Title>Select Input Language</Dialog.Title>
          <Dialog.Content>
            <PickerIOS
              selectedValue={selectedIn}
              onValueChange={(itemValue: ItemValue) => {
                if (typeof itemValue === "string") {
                  setSelectedIn(itemValue);
                  setPickerIOSIn(false)
                }
              }}
            >
              {optionsIn.map((option) => (
                <PickerIOS.Item key={option.value} value={option.value} label={option.label} />
              ))}
            </PickerIOS>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPickerIOSIn(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={pickerIOSOut}>
          <Dialog.Title>Select Output Language</Dialog.Title>
          <Dialog.Content>
            <PickerIOS
              selectedValue={selectedOut}
              onValueChange={(itemValue: ItemValue) => {
                if (typeof itemValue === "string") {
                  setSelectedOut(itemValue);
                  setPickerIOSOut(false)
                }
              }}
            >
              {optionsOut.map((option) => (
                <PickerIOS.Item key={option.value} value={option.value} label={option.label} />
              ))}
            </PickerIOS>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPickerIOSOut(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  )
}

export default VoiceToTextScreen

const styles = StyleSheet.create({
  container: {
    height: 30,
  },
  pickerWrapper: {
    height: 42,
    borderWidth: 1, // border 2px
    borderRadius: 12, // rounded corner
    overflow: "hidden",
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tertiary
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
    height: Platform.OS == 'ios' ? 65 : 'auto',
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