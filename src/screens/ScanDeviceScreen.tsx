/**
 * Sample BLE React Native App
 */

import { NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
  Pressable,
  Image,
  TouchableOpacity,
} from 'react-native';
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  PeripheralInfo,
} from 'react-native-ble-manager';
import { COLORS } from '../assets/theme';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { SectionLayout } from '../components/layout/SectionLayout';
import { Button, Surface, Text } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../redux/store';
import loadingReducer from '../redux/reducers/loadingReducer';
import { loading, notLoading } from '../redux/actions/loadingAction';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import LoadingScreen from '../components/common/LoadingScreen';
import { connectToBluetoothClassic, scanBluetoothClassic } from '../ble/BLEManager';
import { BluetoothDevice } from 'react-native-bluetooth-classic';

const SECONDS_TO_SCAN_FOR = 3;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = false;

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
    isBLE?: boolean;
  }
}
type RootStackParamList = {
  Main: undefined;
};

const ScanDevicesScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const isFocused = useIsFocused()
  const [isScanning, setIsScanning] = useState(false);
  const [peripherals, setPeripherals] = useState(
    new Map<Peripheral['id'], Peripheral>()
  );
  const [targetDevices, setTargetDevices] = useState<BluetoothDevice[]>([]);
  const dispacth = useDispatch()
  const isLoading = useAppSelector(state => state.loading.loading)

  const startScan = () => {
    if (!isScanning) {
      // reset found peripherals before scan
      setPeripherals(new Map<Peripheral['id'], Peripheral>());

      try {
        console.log('[startScan] starting scan...');
        setIsScanning(true);
        BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        })
          .then(() => {
            console.log('[startScan] scan promise returned successfully.');
          })
          .catch((err: any) => {
            console.error('[startScan] ble scan returned in error', err);
          });
      } catch (error) {
        console.error('[startScan] ble scan error thrown', error);
      }
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    console.log('[handleStopScan] scan is stopped.');
  };

  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent
  ) => {
    console.log(
      `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`
    );
    setPeripherals((map) => {
      let p = map.get(event.peripheral);
      if (p) {
        p.connected = false;
        return new Map(map.set(event.peripheral, p));
      }
      return map;
    });
  };

  const handleConnectPeripheral = (event: any) => {
    console.log(`[handleConnectPeripheral][${event.peripheral}] connected.`);
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.log('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }

    // Mac Address 41:42:FF:8E:79:9D
    setPeripherals((map) => {
      console.info('Loop Data Peripheral', peripheral);
      if (
        // peripheral.name?.includes('MO1') ||
        // peripheral.name?.includes('MO1') ||
        peripheral.name?.includes('MO1') || peripheral.id == '41:42:FF:8E:79:9D'
      ) {
        const newMap = new Map(map);
        newMap.set(peripheral.id, peripheral);
        return newMap;
      }
      return map;
    });
  };

  const togglePeripheralConnection = async (peripheral: Peripheral) => {
    if (peripheral && peripheral.connected) {
      try {
        console.log('Disconnect peripheral');
        await BleManager.disconnect(peripheral.id);
        dispacth({
          type: 'DISCONNET_DEVICE',
          payload: {}
        })

      } catch (error) {
        console.error(
          `[togglePeripheralConnection][${peripheral.id}] error when trying to disconnect device.`,
          error
        );
      }
    } else {
      await connectPeripheral(peripheral);
    }
  };

  const connectPeripheral = async (peripheral: Peripheral) => {
    dispacth(loading())
    try {
      if (peripheral) {
        setPeripherals((map) => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        await BleManager.connect(peripheral.id);
        await connectToBluetoothClassic(peripheral.id);
        console.log(`[connectPeripheral][${peripheral.id}] connected.`);

        setPeripherals((map) => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = false;
            p.connected = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        // before retrieving services, it is often a good idea to let bonding & connection finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        const peripheralData = await BleManager.retrieveServices(peripheral.id);
        console.log(
          `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
          peripheralData
        );

        setPeripherals((map) => {
          let p = map.get(peripheral.id);
          if (p) {
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        const rssi = await BleManager.readRSSI(peripheral.id);
        console.log(
          `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`
        );

        if (peripheralData.characteristics) {
          for (const characteristic of peripheralData.characteristics) {
            if (characteristic.descriptors) {
              for (const descriptor of characteristic.descriptors) {
                try {
                  let data = await BleManager.readDescriptor(
                    peripheral.id,
                    characteristic.service,
                    characteristic.characteristic,
                    descriptor.uuid
                  );
                  console.log(
                    `[connectPeripheral][${peripheral.id}] ${characteristic.service} ${characteristic.characteristic} ${descriptor.uuid} descriptor read as:`,
                    data
                  );
                } catch (error) {
                  console.error(
                    `[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`,
                    error
                  );
                }
              }
            }
          }
        }

        setPeripherals((map) => {
          let p = map.get(peripheral.id);
          if (p) {
            p.rssi = rssi;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        dispacth(notLoading())
        let payloadState = peripheral
        payloadState.isBLE = true

        dispacth({
          type: 'CONNECT_DEVICE',
          payload: payloadState
        })
        await AsyncStorage.setItem('deviceConnect', JSON.stringify(peripheral))

        navigation.navigate('Main')
      }
    } catch (error) {
      dispacth(notLoading())
      console.error(
        `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
        error
      );
    }
  };

  function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  useEffect(() => {
    try {
      BleManager.start({ showAlert: false })
        .then(() => console.log('BleManager started.'))
        .catch((error: any) =>
          console.error('BeManager could not be started.', error)
        );
    } catch (error) {
      console.error('unexpected error starting BleManager.', error);
      return;
    }

    const listeners: any[] = [
      BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
      BleManager.onStopScan(handleStopScan),
      BleManager.onConnectPeripheral(handleConnectPeripheral),
      BleManager.onDisconnectPeripheral(handleDisconnectedPeripheral),
    ];

    handleAndroidPermissions();
    setPeripherals(new Map<Peripheral['id'], Peripheral>());
    if (isFocused) {
      console.info('Screen Focused, Started Scanning Devices')
      startScan()
    }

    return () => {
      console.log('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const handleAndroidPermissions = () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]).then((result) => {
        if (result) {
          console.log(
            '[handleAndroidPermissions] User accepts runtime permissions android 12+'
          );
        } else {
          console.error(
            '[handleAndroidPermissions] User refuses runtime permissions android 12+'
          );
        }
      });
    } else if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ).then((checkResult) => {
        if (checkResult) {
          console.log(
            '[handleAndroidPermissions] runtime permission Android <12 already OK'
          );
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ).then((requestResult) => {
            if (requestResult) {
              console.log(
                '[handleAndroidPermissions] User accepts runtime permission android <12'
              );
            } else {
              console.error(
                '[handleAndroidPermissions] User refuses runtime permission android <12'
              );
            }
          });
        }
      });
    }
  };

  const startScanBluetootClassic = async () => {
    setIsScanning(true)
    const result = await scanBluetoothClassic()

    const targets = result.filter((d) => d.name === 'MO1');
    if (targets.length > 0) {
      console.log(`🎯 Ditemukan ${targets.length} device bernama MO1`);
      setTargetDevices(targets); // simpan ke state khusus target device
      setIsScanning(false)
    } else {
      console.log('⚠️ Tidak ada device M01 ditemukan.');
      setIsScanning(false)
      setTargetDevices([]);
    }
  }

  const renderItem = ({ item }: { item: Peripheral }) => {
    return (
      <>
        <SectionLayout edges={['left', 'right']} horizontalPadding={30}>
          <Surface
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
              <Text variant='titleMedium' style={{ marginTop: 10 }}>{item.name} - {item?.advertising?.localName}</Text>
              <Text>{item.id ?? 'testing mac address'}</Text>
            </View>
            <View>
              <Button
                mode='contained'
                onPress={() => togglePeripheralConnection(item)}
              >
                Pair Device
              </Button>
            </View>
          </Surface>
        </SectionLayout>
        {/* <TouchableHighlight
          underlayColor="#0082FC"
          onPress={() => togglePeripheralConnection(item)}
        >
          <View style={[styles.row, { backgroundColor }]}>
            <Text style={styles.peripheralName}>
              {item.name} - {item?.advertising?.localName}
              {item.connecting && ' - Connecting...'}
            </Text>
            <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
            <Text style={styles.peripheralId}>{item.id}</Text>
          </View>
        </TouchableHighlight> */}
      </>

    );
  };

  const renderItemClassic = ({ item }: any) => {
    return (
      <>
        <SectionLayout edges={['left', 'right']} horizontalPadding={30}>
          <Surface
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
              <Text variant='titleMedium' style={{ marginTop: 10 }}>{item.name}</Text>
              <Text>{item.address ?? 'testing mac address'}</Text>
            </View>
            <View>
              <Button
                mode='contained'
                onPress={async () => {
                  await connectToBluetoothClassic(item.address)

                  let devices = {
                    name: item.name,
                    id: item.address,
                    connected: true,
                    isBLE: false
                  }

                  dispacth({
                    type: 'CONNECT_DEVICE',
                    payload: devices
                  })
                  await AsyncStorage.setItem('deviceConnect', JSON.stringify(devices))
                  navigation.navigate('Main')
                }}
              >
                Pair Device
              </Button>
            </View>
          </Surface>
        </SectionLayout>
      </>

    );
  };
  return (
    <>
      <AppHeader withBack title='Device' />
      <ScreenLayout withBackgroundImg style={{
        paddingTop: 0,
      }}>
        {isScanning == true ? (
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
        ) : Array.from(peripherals.values()).length == 0 && targetDevices.length == 0 ? (
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
            <Button mode="contained" onPress={startScan}>
              Retry
            </Button>

            {/* <TouchableOpacity style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20
            }}
              onPress={startScanBluetootClassic}
            >
              <Text style={{ color: COLORS.primary }}>Or Retry it With Bluetooth Classic</Text>
            </TouchableOpacity> */}
          </View>
        ) : Array.from(peripherals.values()).length > 0 ? (
          <FlatList
            data={Array.from(peripherals.values())}
            contentContainerStyle={{ rowGap: 12 }}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        ) : targetDevices.length > 0 ? (
          <>
            <FlatList
              data={targetDevices}
              contentContainerStyle={{ rowGap: 12 }}
              renderItem={renderItemClassic}
              keyExtractor={(item) => item.id}
            />
          </>
        ) : (
          <></>
        )
        }
      </ScreenLayout>
      {isLoading ? <LoadingScreen /> : <></>}
    </>
  );
};

const boxShadow = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const styles = StyleSheet.create({
  engine: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    color: COLORS.black,
  },
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0a398a',
    margin: 10,
    borderRadius: 12,
    flex: 1,
    ...boxShadow,
  },
  scanButtonText: {
    fontSize: 16,
    letterSpacing: 0.25,
    color: COLORS.white,
  },
  body: {
    backgroundColor: '#0082FC',
    flex: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  peripheralName: {
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  rssi: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
  },
  peripheralId: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
    paddingBottom: 20,
  },
  row: {
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 20,
    ...boxShadow,
  },
  noPeripherals: {
    margin: 10,
    textAlign: 'center',
    color: COLORS.white,
  },
});

export default ScanDevicesScreen;