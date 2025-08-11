
import React, { useEffect } from 'react'
import { Alert, Linking, LogBox, PermissionsAndroid, Platform } from 'react-native';
import { checkVersion } from "react-native-check-version";
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import AppProvider from './src/provider/AppProvider';
import { Provider } from 'react-redux';
import store from './src/redux/store';

function App(): React.JSX.Element {
  const theme = {
    ...MD3LightTheme, // or MD3DarkTheme
    roundness: 2,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#f7503e',
      secondary: '#230634',
      tertiary: '#4602f8',
    },
  };

  useEffect(() => {
    LogBox.ignoreAllLogs();
    // BootSplash.hide({ fade: true });

    checkAppVersion()
    requestMicrophonePermission()
  }, [])

  // Request microphone permission
  async function requestMicrophonePermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for speech recognition',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
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