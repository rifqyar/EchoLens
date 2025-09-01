import React, { useEffect, useState } from 'react';
import { View, Image, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
import { AppHeader } from '../components/layout/AppHeader';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { COLORS } from '../assets/theme';

const AboutScreen = () => {
  const [appVersion, setAppVersion] = useState('');
  const [buildNumber, setBuildNumber] = useState('');

  useEffect(() => {
    const version = DeviceInfo.getVersion();      // e.g. "1.0.0"
    const build = DeviceInfo.getBuildNumber();    // e.g. "1"
    setAppVersion(version);
    setBuildNumber(build);
  }, []);

  const openPrivacyPolicy = () => {
    Linking.openURL('https://kazennex.my.id/privacy.html');
  };

  return (
    <>
      <AppHeader withBack />
      <ScreenLayout withBackgroundImg>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {/* Logo */}
          <Image
            source={require('../assets/img/logo.png')}
            style={{ width: 120, height: 120, marginBottom: 20, resizeMode: 'contain' }}
          />

          {/* Card Info */}
          <Card style={{ width: '100%', borderRadius: 16, padding: 20, backgroundColor: COLORS.background }}>
            <Text variant="titleLarge" style={{ textAlign: 'center', marginBottom: 10, color: COLORS.white }}>
              OptiLens
            </Text>
            <Divider style={{ marginBottom: 10 }} />

            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 5, color: COLORS.white }}>
              Version: {appVersion} (Build {buildNumber})
            </Text>

            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 10, color: COLORS.white }}>
              This application is designed to connect with SmartGlasses,
              providing hands-free notifications, data access, and operational support.
            </Text>

            {/* Privacy Policy Link */}
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text
                variant="bodyMedium"
                style={{ textAlign: 'center', color: COLORS.secondary, marginTop: 10, textDecorationLine: 'underline' }}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 15, color: COLORS.lightGrey }}>
              © {new Date().getFullYear()} OptiLens. All rights reserved.
            </Text>
          </Card>
        </View>
      </ScreenLayout>
    </>
  );
};

export default AboutScreen;
