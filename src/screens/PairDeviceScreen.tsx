import { Image, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import LottieView from 'lottie-react-native';
import { COLORS } from '../assets/theme';
import { SectionLayout } from '../components/layout/SectionLayout';
import { useIsFocused } from '@react-navigation/native';
import { connectToBluetoothClassic, scanBluetoothClassic, startScan } from '../ble/BLEManager';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { Button, Surface, Text } from 'react-native-paper';

const PairDeviceScreen = () => {
  const isFocused = useIsFocused()
  const [scanning, setScanning] = useState(true)
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [targetDevices, setTargetDevices] = useState<BluetoothDevice[]>([]);

  useEffect(() => {
    if (isFocused) {
      initStartScan()
    }
  }, [isFocused])

  const initStartScan = async () => {
    setScanning(true)
    const result = await scanBluetoothClassic()

    setDevices(result);

    // Cari device bernama G300_FD8C
    // Filter semua device yang nama persisnya G300_FD8C
    const targets = result.filter((d) => d.name === 'G300_FD8C');

    if (targets.length > 0) {
      console.log(`🎯 Ditemukan ${targets.length} device bernama G300_FD8C`);
      setTargetDevices(targets); // simpan ke state khusus target device
      setScanning(false)
    } else {
      console.log('⚠️ Tidak ada device G300_FD8C ditemukan.');
      setScanning(false)
      setTargetDevices([]); // reset kalau tidak ada
    }
  }

  return (
    <>
      <AppHeader withBack title='Device' />
      <ScreenLayout scrollable={true} style={{
        paddingTop: 0,
        backgroundColor: COLORS.blackLighten,
      }}>
        {
          scanning ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} >
              <LottieView
                source={require('../assets/loading.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200, alignSelf: 'center' }}
              />
              <SectionLayout style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, color: '#FFF', marginTop: 20 }}>
                  Searching for Devices...
                </Text>
                <Text style={{ color: '#d7d7d7ff', marginTop: 10, textAlign: 'center' }}>
                  Please ensure your device is in pairing mode and your Bluetooth is enabled.
                </Text>
              </SectionLayout>
            </View>
          ) : targetDevices.length == 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* <Image
                source={require('../assets/img/no-device.png')}
                style={{ width: 150, height: 150, marginBottom: 20 }}
                resizeMode='contain'
              /> */}
              <Text style={{ fontSize: 18, color: '#FFF', marginBottom: 10 }}>
                No device found
              </Text>
              <Text style={{ color: '#d7d7d7ff', textAlign: 'center', marginBottom: 20 }}>
                Please make sure your device is on and in pairing mode.
              </Text>
              <Button mode="contained" onPress={initStartScan}>
                Retry
              </Button>
            </View>
          ) : (
            <>
              {targetDevices.map((device, idx) => (
                <SectionLayout edges={['left', 'right']} horizontalPadding={30}>
                  <Surface
                    key={device.address || idx}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      borderRadius: 35,
                      paddingTop: 40,
                      paddingHorizontal: 40,
                      paddingBottom: 25,
                      marginBottom: 20,
                    }}
                  >
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <Image source={require('../assets/img/logo-alt.png')} style={{ width: '80%', height: 100, resizeMode: 'contain' }} />
                      <Text variant='titleMedium' style={{ marginTop: 10 }}>{device.name ?? 'TESTING DEVICE'}</Text>
                      <Text>{device.address ?? 'testing mac address'}</Text>
                    </View>
                    <View>
                      <Button
                        mode='contained'
                        onPress={() => {
                          const connectStatus = connectToBluetoothClassic(device.address)
                          console.log(connectStatus)
                        }}
                      >
                        Pair Device
                      </Button>
                    </View>
                  </Surface>
                </SectionLayout>
              ))}
            </>
          )
        }
      </ScreenLayout>
    </>
  )
}

export default PairDeviceScreen

const styles = StyleSheet.create({})