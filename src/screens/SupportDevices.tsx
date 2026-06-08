import React, { useState, useEffect } from "react";
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
import { getCachedDevices, DeviceConfig } from "../config/DeviceWhitelist";

const SupportDevices: React.FC = () => {
  const theme = useTheme()
  const [devices, setDevices] = useState<DeviceConfig[]>([])

  useEffect(() => {
    setDevices(getCachedDevices())
  }, [])

  return (
    <>
      <ScreenLayout withBackgroundImg>
        <View style={{ flex: 1, padding: 10 }}>
          {/* Connection Status */}
          <SectionLayout>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.surface }}>
              Supported Devices
            </Text>
            {devices.map((device, idx) => (
              <Surface key={idx} style={styles.statusContainer}>
                <View style={styles.glassesContainer}>
                  <Image source={require('../assets/img/logo-alt.png')} style={styles.glassesImage} />
                  <Text style={styles.glassesName}>
                    {device.name}
                  </Text>
                  {device.macs.length > 0 && (
                    <Text style={styles.glassesMac}>
                      {device.macs.join(', ')}
                    </Text>
                  )}
                </View>
              </Surface>
            ))}
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
  glassesMac: { fontSize: 12, color: COLORS.white, opacity: 0.7, marginTop: 4 },
})