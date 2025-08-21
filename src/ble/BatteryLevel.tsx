import { useState, useEffect } from 'react';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export function useBatteryLevel(peripheralId: any) {
  const [batteryLevel, setBatteryLevel] = useState(null);
  console.log('battery level')

  useEffect(() => {
    if (!peripheralId) return;

    const batteryServiceUUID = '180F';
    const batteryLevelUUID = '2A19';
    let subscription: any;

    // fungsi untuk subscribe notification
    const startNotification = async () => {
      try {
        BleManager.read(peripheralId, batteryServiceUUID, batteryLevelUUID)
          .then((data) => {
            // data berupa array of bytes (misalnya [85] artinya 85%)
            const batteryLevel = data[0];
            console.log('Battery level: ', batteryLevel, '%');
          })
          .catch((error) => {
            console.error('Battery read error:', error);
          });
      } catch (error) {
        console.log('Failed to start battery notification:', error);
      }
    };

    startNotification();
  }, [peripheralId]);


  return batteryLevel;
}
