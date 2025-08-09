
import React, { useEffect } from 'react'
import { Alert, Linking, LogBox, Platform } from 'react-native';
import { checkVersion } from "react-native-check-version";
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import AppProvider from './src/provider/AppProvider';

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
  }, [])

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
    <PaperProvider theme={theme}>
      <AppProvider />
    </PaperProvider>
  )
}

export default App;