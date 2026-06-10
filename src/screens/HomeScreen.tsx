import { Image, StatusBar, StyleSheet, Text, View, NativeEventEmitter, NativeModules, DeviceEventEmitter, TouchableOpacity, BackHandler, Alert, Platform } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useIsFocused, useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native'
import { Button, Surface, useTheme } from 'react-native-paper'
import { SectionLayout } from '../components/layout/SectionLayout'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { COLORS, FONTS, SIZES } from '../assets/theme'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { useAppSelector } from '../redux/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDispatch } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient';
import BleManager, {
  Peripheral,
} from 'react-native-ble-manager';
import { loading, notLoading } from '../redux/actions/loadingAction'
import { Buffer } from 'buffer';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { checkBondedClassicPeripheral } from '../ble/BLEManager'

type RootStackParamList = {
  LiveControl: undefined;
  PairDeviceOnBoard: undefined;
  VoiceToTextScreen: undefined;
  VoiceToTextRealtime: undefined;
};

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

const HomeScreen = ({ navigation }: any) => {
  const isFocused = useIsFocused()
  const theme = useTheme()
  const device = useAppSelector((state) => state.deviceConnectionReducer?.device)
  const [deviceLocalState, setDeviceLocalState] = useState(device)
  const dispacth = useDispatch()

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(theme.colors.background);
    StatusBar.setBarStyle('light-content');
    if (isFocused) {
      setConnectedDeviceToLocalStorage()
      checkConnectedBLE()
    }
  }, [isFocused])

  const checkConnectedBLE = async () => {
    try {
      const devices = await checkBondedClassicPeripheral()

      if (!devices || devices.length === 0) {
        console.log('[HomeScreen] No bonded Classic devices found')
        return
      }

      let device = {
        name: devices[0].name,
        id: devices[0].address,
        connected: true,
        isBLE: false
      }

      dispacth({
        type: 'CONNECT_DEVICE',
        payload: device
      })
      await AsyncStorage.setItem('deviceConnect', JSON.stringify(device))
    } catch (error) {
      console.error('[HomeScreen] checkConnectedBLE error:', error)
    }
  }

  const setConnectedDeviceToLocalStorage = async () => {
    if (device) {
      await AsyncStorage.setItem('deviceConnect', JSON.stringify(device))
      getBatteryStatus(device)
    }
  }

  const getBatteryStatus = async (peripheral: Peripheral) => {
    if (peripheral && peripheral.connected) {
      console.log(await BleManager.retrieveServices(peripheral.id))
      const { services, characteristics } = await BleManager.retrieveServices(peripheral.id);

      if (
        Array.isArray(services) && services.length > 0 &&
        Array.isArray(characteristics) && characteristics.length > 0
      ) {
        const data = await BleManager.read(peripheral.id, '180F', '2A19');
        console.log(data)
        const batteryLevel = Buffer.from(data).readUInt8(0);
      } else {
        console.warn('No services or characteristics found for peripheral:', peripheral.id);
      }
    }
  }

  const checkIfDeviceStore = async () => {
    let deviceStr = await AsyncStorage.getItem('deviceConnect')
    if (deviceStr) {
      const parsedDevice: Peripheral = JSON.parse(deviceStr)
      if (parsedDevice != null) {
        // connectPeripheral(parsedDevice)
      }
    }
  }

  const disconnectDevice = async () => {
    if (!device.isBLE) {
      await RNBluetoothClassic.disconnectFromDevice(device.id);
      await RNBluetoothClassic.unpairDevice(device.id);
      setDeviceLocalState({})
      dispacth({
        type: 'DISCONNET_DEVICE',
        payload: {}
      })
    } else {
      await BleManager.disconnect(device.id);
      setDeviceLocalState({})
      dispacth({
        type: 'DISCONNET_DEVICE',
        payload: {}
      })
    }
  }

  // const connectPeripheral = async (peripheral: Peripheral) => {
  //   dispacth(loading())
  //   try {
  //     if (peripheral) {

  //       await BleManager.connect(peripheral.id);
  //       console.log(`[connectPeripheral][${peripheral.id}] connected.`);
  //       // before retrieving services, it is often a good idea to let bonding & connection finish properly

  //       /* Test read current RSSI value, retrieve services first */
  //       const peripheralData = await BleManager.retrieveServices(peripheral.id);
  //       console.log(
  //         `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
  //         peripheralData
  //       );

  //       const rssi = await BleManager.readRSSI(peripheral.id);
  //       console.log(
  //         `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`
  //       );

  //       if (peripheralData.characteristics) {
  //         for (const characteristic of peripheralData.characteristics) {
  //           if (characteristic.descriptors) {
  //             for (const descriptor of characteristic.descriptors) {
  //               try {
  //                 let data = await BleManager.readDescriptor(
  //                   peripheral.id,
  //                   characteristic.service,
  //                   characteristic.characteristic,
  //                   descriptor.uuid
  //                 );
  //                 console.log(
  //                   `[connectPeripheral][${peripheral.id}] ${characteristic.service} ${characteristic.characteristic} ${descriptor.uuid} descriptor read as:`,
  //                   data
  //                 );
  //               } catch (error) {
  //                 console.error(
  //                   `[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`,
  //                   error
  //                 );
  //               }
  //             }
  //           }
  //         }
  //       }

  //       dispacth(notLoading())
  //       dispacth({
  //         type: 'CONNECT_DEVICE',
  //         payload: peripheral
  //       })
  //       await AsyncStorage.setItem('deviceConnect', JSON.stringify(peripheral))
  //     }
  //   } catch (error) {
  //     dispacth(notLoading())
  //     console.error(
  //       `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
  //       error
  //     );
  //   }
  // };

  console.log((Object.keys(device).length))
  return (
    <ScreenLayout withBackgroundImg scrollable={true} style={{
      paddingTop: 0,
      paddingBottom: 0,
    }}>
      {/* Connection Status */}
      <SectionLayout>
        <Surface style={styles.statusContainer}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.surface }}>
            Smart Glasses Status
          </Text>
          {
            Object.keys(device).length > 0 ? (
              <View style={styles.glassesContainer}>
                <Image source={require('../assets/img/logo-alt.png')} style={styles.glassesImage} />
                <Text style={styles.glassesName}>
                  {device.name}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.surface, marginTop: 10 }}>
                  Device Connected
                </Text>
              </View>
            ) : (
              <Text style={{ color: COLORS.accentGrey }}>Device Not Connected</Text>
            )
          }

          <TouchableOpacity
            style={[styles.PairingButton, {
              marginTop: 10,
              paddingVertical: 12,
            }]}
            onPress={() => {
              if (Object.keys(device).length > 0) {
                disconnectDevice()
              } else {
                navigation.push('PairDeviceOnBoard')
              }
            }}
          >
            <LinearGradient
              style={[styles.PairingButton, {
                paddingVertical: 12,
              }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={[COLORS.primary, COLORS.accentRed]}
            >
              <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: COLORS.white }}>
                {Object.keys(device).length > 0 ? 'Unpair Device' : 'Pair Device'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Surface>
      </SectionLayout>

      {/* Check if Device is pairing */}

      {/* Main Menu */}
      <SectionLayout style={{ marginTop: 20, alignItems: 'center' }} edges={['left', 'right']}>
        <View style={{ flexDirection: 'row', width: '100%', gap: 20, flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              navigation.push('SoundRecording')
            }}
          >
            <LinearGradient
              style={[styles.actionButton, {
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
              }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={[COLORS.secondary, COLORS.darkBlue]}
            >
              <MaterialDesignIcons name='microphone-variant' size={25} color={theme.colors.onPrimary} />
              <Text style={{ marginLeft: 5, color: theme.colors.onPrimary, fontSize: 12, textAlign: 'center' }}>Record Audio</Text>
            </LinearGradient>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              navigation.push('VoiceToTextScreen')
            }}
          >
            <LinearGradient
              style={[styles.actionButton, {
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
              }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={[COLORS.secondary, COLORS.darkBlue]}
            >
              <MaterialDesignIcons name='microphone-outline' size={25} color={theme.colors.onPrimary} />
              <Text style={{ marginLeft: 5, color: theme.colors.onPrimary, fontSize: 12, textAlign: 'center' }}>Voice-to-Text</Text>
            </LinearGradient>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              navigation.push('VoiceToTextRealtime')
            }}
          >
            <LinearGradient
              style={[styles.actionButton, {
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
              }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={[COLORS.secondary, COLORS.darkBlue]}
            >
              <MaterialDesignIcons name='ear-hearing' size={25} color={theme.colors.onPrimary} />
              <Text style={{ marginLeft: 5, color: theme.colors.onPrimary, fontSize: 12, textAlign: 'center' }}>Live Translation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SectionLayout>

      {/* Key Device Feature */}
      <SectionLayout>
        <Surface style={{
          marginTop: 20,
          width: '100%',
          alignSelf: 'center',
          padding: 20,
          backgroundColor: COLORS.tertiary,
          borderRadius: 10,
          borderWidth: 0.55,
          borderColor: COLORS.background,
          gap: 20
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.surface }}>
            Key Device Feature
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialDesignIcons name='microphone-outline' size={24} color={COLORS.secondary} />
              <Text style={{ color: theme.colors.surface }}>Voice-to-Text</Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: COLORS.lightTeal,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}>
              <Text style={{ color: COLORS.lightTeal, fontSize: 10 }}>Available</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialDesignIcons name='translate' size={24} color={COLORS.secondary} />
              <Text style={{ color: theme.colors.surface }}>Auto Translation</Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: COLORS.lightTeal,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}>
              <Text style={{ color: COLORS.lightTeal, fontSize: 10 }}>Available</Text>
            </View>
          </View>
        </Surface>
      </SectionLayout>
    </ScreenLayout>
  )
}

export default HomeScreen

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
  PairingButton: {
    width: '100%',
    height: Platform.OS == 'ios' ? 65 : 'auto',
    borderRadius: 15,
  },
  actionButton: {
    width: '100%',
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: 15,
    justifyContent: 'center',
  }
})