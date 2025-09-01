import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
  NativeModules,
  Image,
  StyleSheet,
} from "react-native";
import WifiManager from "react-native-wifi-reborn";
import { AppHeader } from "../components/layout/AppHeader";
import { ScreenLayout } from "../components/layout/ScreenLayout";
import { COLORS } from "../assets/theme";
import { SectionLayout } from "../components/layout/SectionLayout";
import { Surface, useTheme } from "react-native-paper";

const SupportDevices: React.FC = () => {
  const theme = useTheme()

  return (
    <>
      <ScreenLayout withBackgroundImg>
        <View style={{ flex: 1, padding: 20 }}>
          {/* Connection Status */}
          <SectionLayout>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.surface }}>
              Supported Devices
            </Text>
            <Surface style={styles.statusContainer}>
              <View style={styles.glassesContainer}>
                <Image source={require('../assets/img/logo-alt.png')} style={styles.glassesImage} />
                <Text style={styles.glassesName}>
                  MO1
                </Text>
              </View>
            </Surface>
          </SectionLayout>
        </View>
      </ScreenLayout>
    </>
  );
};

export default SupportDevices;

const styles = StyleSheet.create({
  statusContainer: {
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
    backgroundColor: COLORS.tertiary,
    borderRadius: 10,
    borderWidth: 0.55,
    borderColor: COLORS.background,
    gap: 10
  },
  glassesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glassesImage: { width: '70%', height: 100, resizeMode: 'contain' },
  glassesName: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
})