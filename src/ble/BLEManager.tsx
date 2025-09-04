// import { BleManager, Device, BleError } from 'react-native-ble-plx';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { PermissionsAndroid, Platform, NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

// const manager = new BleManager();

export type Discovered = {
  id: string; // peripheral id (UUID iOS / MAC-like Android)
  name?: string;
  rssi?: number;
  advertising?: any;
};

/**
 * Mulai scan BLE untuk device tertentu dan panggil callback ketika terhubung.
 * @param targetName Nama device yang dicari
 * @param onConnected Callback yang dipanggil dengan device yang berhasil terhubung
 */
// export async function startScan(
//   onConnected: (device: Device) => void
// ): Promise<void> {
//   console.log('kesini')
//   manager.startDeviceScan(null, null, (error, device) => {
//     if (error) {
//       console.error('BLE Scan Error', error);
//       return;
//     }

//     if (device) {
//       // Log detail lengkap
//       console.log('Device found:', {
//         id: device.id,
//         name: device.name,
//         localName: device.localName,
//         manufacturerData: device.manufacturerData,
//         serviceUUIDs: device.serviceUUIDs,
//       });

//       // Coba filter berdasarkan clue (nama mengandung Cyan, Glass, dsb.)
//       if (device.name?.includes('Cyan') || device.localName?.includes('Cyan')) {
//         console.log('=== Ditemukan device target! ===');
//         manager.stopDeviceScan();

//         device.connect()
//           .then((d) => d.discoverAllServicesAndCharacteristics())
//           .then((d) => {
//             console.log('Connected to', d.name);
//             onConnected(d);
//           })
//           .catch((err) => console.error('Connection error', err));
//       }
//     }

//     setTimeout(() => {
//       console.log('Stop scanning');
//       manager.stopDeviceScan();
//     }, 20000);
//   });
// }

export async function scanBluetoothClassic(): Promise<BluetoothDevice[]> {
  // Stop discovery kalau masih jalan
  const isDiscovering = await RNBluetoothClassic.cancelDiscovery();
  if (isDiscovering) {
    console.log('🔹 Discovery masih jalan, menghentikan...');
    await RNBluetoothClassic.cancelDiscovery();
  }

  console.log('=== Mulai discovery perangkat Bluetooth Classic ===');
  const devices: BluetoothDevice[] = await RNBluetoothClassic.startDiscovery();

  console.log(`Ditemukan ${devices.length} perangkat:`);
  devices.forEach((device) => {
    console.log('---');
    console.log('Name:', device.name);
    console.log('Address:', device.address);
    console.log('Class:', device.deviceClass);
    console.log('Bonded:', device.bonded);
  });

  return devices;
}

export async function connectToBluetoothClassic(address: string) {
  try {
    console.log(`🔗 Menghubungkan ke perangkat: ${address}`);
    const connected = await RNBluetoothClassic.connectToDevice(address);
    console.log('✅ Berhasil terhubung:', connected.name);
    return connected;
  } catch (err) {
    console.error('❌ Gagal konek ke perangkat:', err);
    return null;
  }
}

export async function initBle() {
  BleManager.checkState().then((state) =>
    console.log(`current BLE state = '${state}'.`)
  );

  BleManager.start({ showAlert: false }).then(() => {
    // Success code
    console.log("Module initialized");
  });
}

export async function scanOnce(
  seconds = 5,
  serviceUUIDs: string[] = [],
  allowDuplicates = false
): Promise<Discovered[]> {
  const found = new Map<string, Discovered>();
  console.log(found)
  const subDiscover = bleEmitter.addListener('onDiscoverPeripheral', (p: Discovered) => {
    found.set(p.id, p);
  });
  console.log(subDiscover)

  await BleManager.scan(serviceUUIDs, seconds, allowDuplicates);
  await new Promise<void>(resolve => {
    const handler = () => {
      subDiscover.remove();
      subStop.remove();
      resolve();
    };
    const subStop =
      bleEmitter.addListener('onStopScan', handler) ||
      bleEmitter.addListener('BleManagerStopScan', handler); // fallback untuk v11
  });

  // Alternatif tanpa event: panggil getDiscoveredPeripherals() setelah scan berhenti
  // const peripherals = await BleManager.getDiscoveredPeripherals([]);
  return Array.from(found.values());
}

export const checkBondedClassicPeripheral = async (): Promise<BluetoothDevice[]> => {
  try {
    const pairedDevices: BluetoothDevice[] = await RNBluetoothClassic.getBondedDevices();

    const availDevice = pairedDevices.filter((d) => d.name === 'MO1');
    if(availDevice.length > 0){
      await RNBluetoothClassic.connectToDevice(availDevice[0].address)
    }

    return availDevice
  } catch (error) {
    console.error('Error checking connected Bluetooth Classic devices:', error);
    return [];
  }
};