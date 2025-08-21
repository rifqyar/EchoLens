import { Image, StatusBar, StyleSheet, Text, View, NativeEventEmitter, NativeModules, DeviceEventEmitter } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native'
import { Badge, Button, Surface, useTheme } from 'react-native-paper'
import { SectionLayout } from '../components/layout/SectionLayout'
import { ScreenLayout } from '../components/layout/ScreenLayout'
import { AppHeader } from '../components/layout/AppHeader'
import { COLORS } from '../assets/theme'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { useAppSelector } from '../redux/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDispatch } from 'react-redux'

import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  PeripheralInfo,
} from 'react-native-ble-manager';
import { loading, notLoading } from '../redux/actions/loadingAction'
import { Buffer } from 'buffer';
import { useBatteryLevel } from '../ble/BatteryLevel'
import RNBluetoothClassic from 'react-native-bluetooth-classic';

type RootStackParamList = {
  LiveControl: undefined;
  PairDeviceOnBoard: undefined;
  // add other routes here if needed
};

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const HomeScreen = () => {
  const isFocused = useIsFocused()
  const theme = useTheme()
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const device = useAppSelector((state) => state.deviceConnectionReducer?.device)
  const [deviceLocalState, setDeviceLocalState] = useState(device)
  const dispacth = useDispatch()
  const batteryLevel = useBatteryLevel(device.id ?? '');
  console.log(batteryLevel)

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor(theme.colors.secondary);
    StatusBar.setBarStyle('light-content');
    if (isFocused) {
      setConnectedDeviceToLocalStorage()
    }
  }, [isFocused])

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
    setDeviceLocalState({})
    await BleManager.disconnect(device.id);
    await RNBluetoothClassic.connectToDevice(device.id);
    dispacth({
      type: 'DISCONNET_DEVICE',
      payload: {}
    })
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

  return (
    <ScreenLayout scrollable={true} style={{
      backgroundColor: COLORS.blackLighten,
      paddingTop: 0,
      paddingBottom: 0,
    }}>
      {/* Connection Status */}
      <SectionLayout>
        <Surface style={{
          marginTop: 20,
          width: '90%',
          alignSelf: 'center',
          padding: 20,
          backgroundColor: COLORS.lightGrey,
          borderRadius: 10,
          gap: 20
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface }}>
            Smart Glasses Status
          </Text>
          {
            Object.keys(deviceLocalState).length > 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={require('../assets/img/logo-alt.png')} style={{ width: '70%', height: 100, resizeMode: 'contain' }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface }}>
                  {device.name}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.onSurface }}>
                  Device Connected
                </Text>
              </View>
            ) : (
              <Text style={{ color: COLORS.accentTeal }}>Device Not Connected</Text>
            )
          }

          <Button
            mode='contained'
            onPress={() => {
              if (Object.keys(deviceLocalState).length > 0) {
                disconnectDevice()
              } else {
                navigation.navigate('PairDeviceOnBoard')
              }
            }}
            style={{ width: '100%' }}
            labelStyle={{ fontSize: 16, color: theme.colors.onPrimary }}
            buttonColor={theme.colors.primary}
          >
            {Object.keys(deviceLocalState).length > 0 ? 'Unpair Device' : 'Pair Device'}
          </Button>
        </Surface>
      </SectionLayout>

      {/* Check if Device is pairing */}

      {/* Main Menu */}
      <SectionLayout style={{ marginTop: 20, alignItems: 'center' }} edges={['left', 'right']} horizontalPadding={19}>
        <View style={{ flexDirection: 'row', width: '100%', gap: 20 }}>
          <Button
            mode="contained"
            onPress={() => {
              navigation.navigate('LiveControl')
            }}
            style={{
              width: '20%', flex: 1, aspectRatio: 1.5,
              justifyContent: 'center',
            }}
            buttonColor={COLORS.accentTeal}
            labelStyle={{ fontSize: 14, color: theme.colors.onPrimary }}
          >
            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
              <MaterialDesignIcons name='play-circle-outline' size={28} color={theme.colors.onPrimary} />
              <Text style={{ marginLeft: 5, color: theme.colors.onPrimary, fontSize: 18 }}>Live Control</Text>
            </View>
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              // Navigate to AI Screen
            }}
            style={{
              width: '20%', flex: 1, aspectRatio: 1.5,
              justifyContent: 'center',
            }}
            buttonColor={COLORS.accentTeal}
            labelStyle={{ fontSize: 14, color: theme.colors.onPrimary }}
          >
            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
              <MaterialDesignIcons name='image' size={28} color={theme.colors.onPrimary} />
              <Text style={{ marginLeft: 5, color: theme.colors.onPrimary, fontSize: 18 }}>Gallery</Text>
            </View>
          </Button>
        </View>
      </SectionLayout>

      {/* Key Device Feature */}
      <SectionLayout>
        <Surface style={{
          marginTop: 20,
          width: '90%',
          alignSelf: 'center',
          padding: 20,
          backgroundColor: COLORS.accentBlackLighten,
          borderRadius: 10,
          gap: 20
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.surface }}>
            Key Device Feature
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialDesignIcons name='microphone-outline' size={24} color={COLORS.lightPurple} />
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
              <MaterialDesignIcons name='translate' size={24} color={COLORS.lightPurple} />
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

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialDesignIcons name='play-circle-outline' size={24} color={COLORS.lightPurple} />
              <Text style={{ color: theme.colors.surface }}>Live Control</Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: COLORS.lightGrey,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}>
              <Text style={{ color: COLORS.lightGrey, fontSize: 10 }}>Device Not Connected</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialDesignIcons name='play-circle-outline' size={24} color={COLORS.lightPurple} />
              <Text style={{ color: theme.colors.surface }}>Stream Video</Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: COLORS.lightGrey,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}>
              <Text style={{ color: COLORS.lightGrey, fontSize: 10 }}>Device Not Connected</Text>
            </View>
          </View>
        </Surface>
      </SectionLayout>
    </ScreenLayout>
  )
}

export default HomeScreen

const styles = StyleSheet.create({

})