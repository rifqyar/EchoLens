
import React, { useEffect } from 'react'
import { Alert, Linking, LogBox, PermissionsAndroid, Platform, NativeModules } from 'react-native';
import { checkVersion } from "react-native-check-version";
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import AppProvider from './src/provider/AppProvider';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import { initDeviceWhitelist } from './src/config/DeviceWhitelist';

function App(): React.JSX.Element {
  const theme = {
    ...MD3LightTheme, // or MD3DarkTheme
    roundness: 2,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#EF5350',
      secondary: '#3087d8',
      tertiary: '#2b384b',
      background: '#10182b'
    },
  };

  useEffect(() => {
    LogBox.ignoreAllLogs();
    // BootSplash.hide({ fade: true });

    checkAppVersion()
    const init = async () => {
      await initDeviceWhitelist();
      await requestMicrophonePermission();
      await requestPermissionSpeech();
      await requestPermissionBluetooth();
    };

    init();
  }, [])

  // Request microphone permission
  async function requestMicrophonePermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      console.log(hasPermission)
      if (hasPermission) {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for speech recognition',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        Alert.alert('Permission denied', 'You need to allow microphone access to use this feature');
        return false;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission denied permanently',
          'Please enable microphone permission from settings'
        );
        return false;
      }

      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  async function requestPermissionSpeech() {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('All permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  }

  async function requestPermissionBluetooth() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
        if (!allGranted) {
          console.warn('[Bluetooth] Some permissions not granted, BLE features may not work.');
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[Bluetooth] Error requesting permissions:', err);
        return false;
      }
    }
    return true;
  }

  const checkAppVersion = async () => {
    const version = await checkVersion();
    console.log('Current Version:', version);
    if (version.needsUpdate) {
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Please update to continue.',
        [
          {
            text: 'Update',
            onPress: () => {
              const url =
                Platform.OS === 'ios'
                  ? version.url // App Store URL
                  : version.url; // Play Store URL
              Linking.openURL(url);
            },
          },
        ],
        { cancelable: false }
      );
    }
  }

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppProvider />
      </PaperProvider>
    </Provider>
  )
}

export default App;