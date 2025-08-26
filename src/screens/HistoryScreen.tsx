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
} from "react-native";
import WifiManager from "react-native-wifi-reborn";
import { AppHeader } from "../components/layout/AppHeader";
import { ScreenLayout } from "../components/layout/ScreenLayout";
import { COLORS } from "../assets/theme";
const { WifiP2pModule } = NativeModules;

interface WifiNetwork {
  SSID: string;
  BSSID: string;
  level: number; // sinyal strength (dBm)
  frequency: number;
  capabilities: string;
  timestamp: number;
}

interface Device {
  deviceName: string;
  deviceAddress: string;
  status: number;
}

const HistoryScreen: React.FC = () => {
  const [wifiList, setWifiList] = useState<WifiNetwork[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ...(Platform.Version >= 33
          ? [PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES]
          : []),
      ]);
    }
  };

  const scanPeers = async () => {
    try {
      await requestPermissions();
      const result = await WifiP2pModule.discoverPeers();
      const parsed: Device[] = JSON.parse(result);
      setDevices(parsed);
    } catch (err) {
      console.error("Scan failed", err);
    }
  };

  const scanWifi = async () => {
    await requestPermissions();

    try {
      // Sekarang langsung return array WifiEntry[]
      const networks: WifiNetwork[] = await WifiManager.loadWifiList();
      setWifiList(networks);
    } catch (error: any) {
      Alert.alert("Gagal Scan", error.message || "Tidak bisa scan WiFi");
    }
  };

  return (
    <>
      <ScreenLayout withBackgroundImg>
        <View style={{ flex: 1, padding: 20 }}>
          {/* <Button title="Scan WiFi" onPress={scanWifi} />
          <Button title="Scan Peer" onPress={scanPeers} />

          <FlatList
            data={devices}
            keyExtractor={(item) => item.deviceAddress}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderColor: "#ccc",
                }}
              >
                <Text style={{ fontWeight: "bold", color: COLORS.white }}>
                  {item.deviceName || "Unknown"}
                </Text>
                <Text style={{ color: COLORS.white }}>{item.deviceAddress}</Text>
                <Text style={{ color: COLORS.white }}>Status: {item.status}</Text>
              </View>
            )}
          />

          <FlatList
            data={wifiList}
            keyExtractor={(item, index) => item.BSSID + index}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ddd",
                }}
              >
                <Text style={{ fontWeight: "bold", color: COLORS.white }}>
                  {item.SSID || "<Hidden SSID>"}
                </Text>
                <Text style={{ color: COLORS.white }}>BSSID: {item.BSSID}</Text>
                <Text style={{ color: COLORS.white }}>Signal: {item.level} dBm</Text>
                <Text style={{ color: COLORS.white }}>Freq: {item.frequency} MHz</Text>
              </View>
            )}
          /> */}
        </View>
      </ScreenLayout>
    </>
  );
};

export default HistoryScreen;
