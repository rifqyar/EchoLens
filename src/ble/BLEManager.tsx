// import { BleManager, Device, BleError } from 'react-native-ble-plx';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { PermissionsAndroid, Platform, NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { isClassicDeviceAllowed } from '../config/DeviceWhitelist';

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

// export async function scanBluetoothClassic(): Promise<BluetoothDevice[]> {
//   // Stop discovery kalau masih jalan
//   try {
//     const active = await RNBluetoothClassic.isDiscovering();
//     if (active) {
//       await RNBluetoothClassic.cancelDiscovery();
//     }
//   } catch (e) {
//     console.log('Gagal menghentikan discovery awal:', e);
//   }

//   console.log('=== Mulai discovery perangkat Bluetooth Classic ===');

//   // ⏱️ Batalkan discovery secara otomatis setelah 3 detik agar cepat selesai!
//   const scanTimeout = setTimeout(async () => {
//     try {
//       const active = await RNBluetoothClassic.isDiscovering();
//       if (active) {
//         console.log('⏱️ Discovery sudah berjalan 3 detik, dihentikan agar cepat...');
//         await RNBluetoothClassic.cancelDiscovery();
//       }
//     } catch (e) {
//       console.log('Gagal membatalkan discovery via timeout:', e);
//     }
//   }, 3000);

//   let devices: BluetoothDevice[] = [];
//   try {
//     devices = await RNBluetoothClassic.startDiscovery();
//   } catch (err) {
//     console.error('Error saat startDiscovery:', err);
//   } finally {
//     clearTimeout(scanTimeout);
//   }

//   console.log(`Ditemukan ${devices.length} perangkat:`);
//   devices.forEach((device) => {
//     console.log('---');
//     console.log('Name:', device.name);
//     console.log('Address:', device.address);
//     console.log('Class:', device.deviceClass);
//     console.log('Bonded:', device.bonded);
//   });

//   return devices;
// }

export async function scanBluetoothClassic(): Promise<BluetoothDevice[]> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let devices: BluetoothDevice[] = [];

  // Stop discovery kalau masih jalan
  const isDiscovering = await RNBluetoothClassic.cancelDiscovery();
  if (isDiscovering) {
    console.log('🔹 Discovery masih jalan, menghentikan...');
    await RNBluetoothClassic.cancelDiscovery();
  }

  try {
    // Best effort: stop previous discovery if it exists.
    // Di library ini tidak ada isDiscovering(), jadi kita coba cancel dan abaikan error
    // kalau memang tidak ada discovery yang sedang berjalan.
    try {
      await RNBluetoothClassic.cancelDiscovery();
      console.log('🔹 Discovery sebelumnya dihentikan.');
    } catch {
      // Normal case: tidak sedang discovery.
    }

    const discoveryPromise = RNBluetoothClassic.startDiscovery();

    timeoutId = setTimeout(() => {
      RNBluetoothClassic.cancelDiscovery()
        .then(() => {
          console.log('⏱️ Discovery dihentikan setelah 3 detik.');
        })
        .catch((error) => {
          // Bisa terjadi kalau discovery sudah selesai sebelum timeout.
          console.log('Tidak perlu cancel discovery:', error?.message ?? error);
        });
    }, 3000);

    const discoveredDevices = await discoveryPromise;
    console.log(discoveredDevices)
    devices = hideBleDuplicateDevices(
      discoveredDevices as ExtendedBluetoothDevice[],
    );
  } catch (err) {
    console.error('Error saat startDiscovery:', err);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

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

type ExtendedBluetoothDevice = BluetoothDevice & {
  type?: 'CLASSIC' | 'LE' | 'DUAL' | 'UNKNOWN' | string;
  extra?: {
    rssi?: number;
    [key: string]: unknown;
  };
};

function normalizeName(name?: string): string {
  return name?.trim().toLowerCase() ?? '';
}

function normalizeAddress(address?: string): string {
  return address?.trim().toUpperCase() ?? '';
}

function getAddressPrefix(address?: string, bytes: number = 5): string | undefined {
  const normalized = normalizeAddress(address);
  const parts = normalized.split(':');

  if (parts.length < bytes) return undefined;

  return parts.slice(0, bytes).join(':');
}

function isLikelyBleName(name?: string): boolean {
  const normalized = normalizeName(name);

  if (!normalized) return true;

  return (
    normalized.includes('ble') ||
    normalized.includes('-le') ||
    normalized.includes('_le') ||
    normalized.endsWith(' le') ||
    normalized.includes('bluetrum') ||
    normalized.includes('bt_ble') ||
    normalized.includes('ble_')
  );
}

function isLikelyProductName(name?: string): boolean {
  const normalized = normalizeName(name);

  if (!normalized) return false;

  return !isLikelyBleName(normalized);
}

function getDeviceScore(device: ExtendedBluetoothDevice): number {
  let score = 0;

  const name = normalizeName(device.name);
  const type = device.type?.toUpperCase();
  const majorClass = device.deviceClass?.majorClass;
  const deviceClass = device.deviceClass?.deviceClass;

  // Prefer devices with real names.
  if (name) score += 20;

  // Prefer product-facing names over BLE/chipset names.
  if (isLikelyProductName(name)) score += 50;
  if (isLikelyBleName(name)) score -= 50;

  // Prefer Classic-only when available.
  if (type === 'CLASSIC') score += 80;

  // DUAL is acceptable, but may expose both identities.
  if (type === 'DUAL') score += 20;

  // LE-only should not be shown in a Classic-only list.
  if (type === 'LE') score -= 100;

  // Prefer paired/bonded device, because Classic devices often need pairing.
  if (device.bonded) score += 40;

  // Device class 7936 often appears as uncategorized/vendor-specific in cases like your Bluetrum result.
  // Do not remove it globally, just lower its priority.
  if (majorClass === 7936 || deviceClass === 7936) score -= 25;

  // Device class exists, so it is probably more useful than totally unknown.
  if (majorClass && majorClass !== 7936) score += 10;

  return score;
}

function isSamePhysicalDevice(
  a: ExtendedBluetoothDevice,
  b: ExtendedBluetoothDevice,
): boolean {
  const aAddress = normalizeAddress(a.address);
  const bAddress = normalizeAddress(b.address);

  if (!aAddress || !bAddress) return false;

  if (aAddress === bAddress) return true;

  const aPrefix5 = getAddressPrefix(aAddress, 5);
  const bPrefix5 = getAddressPrefix(bAddress, 5);

  const sameAddressFamily = !!aPrefix5 && aPrefix5 === bPrefix5;

  const aRssi = a.extra?.rssi;
  const bRssi = b.extra?.rssi;

  const similarRssi =
    typeof aRssi === 'number' &&
    typeof bRssi === 'number' &&
    Math.abs(aRssi - bRssi) <= 8;

  const bothDual =
    a.type?.toUpperCase() === 'DUAL' &&
    b.type?.toUpperCase() === 'DUAL';

  const oneLooksBle =
    isLikelyBleName(a.name) ||
    isLikelyBleName(b.name);

  return sameAddressFamily && (similarRssi || bothDual || oneLooksBle);
}

function hideBleDuplicateDevices(
  devices: ExtendedBluetoothDevice[],
): ExtendedBluetoothDevice[] {
  const result: ExtendedBluetoothDevice[] = [];

  for (const device of devices) {
    const type = device.type?.toUpperCase();

    // Directly hide LE-only devices if the library ever returns them.
    if (type === 'LE') {
      continue;
    }

    const existingIndex = result.findIndex((existing) =>
      isSamePhysicalDevice(existing, device),
    );

    if (existingIndex === -1) {
      result.push(device);
      continue;
    }

    const existing = result[existingIndex];

    // Keep whichever looks more like the Classic/product endpoint.
    if (getDeviceScore(device) > getDeviceScore(existing)) {
      result[existingIndex] = device;
    }
  }

  return result;
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

    const availDevice = pairedDevices.filter((d) => isClassicDeviceAllowed(d.name));
    if (availDevice.length > 0) {
      await RNBluetoothClassic.connectToDevice(availDevice[0].address)
    }

    return availDevice
  } catch (error) {
    console.error('Error checking connected Bluetooth Classic devices:', error);
    return [];
  }
};