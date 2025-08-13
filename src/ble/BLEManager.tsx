import { BleManager, Device, BleError } from 'react-native-ble-plx';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';


const manager = new BleManager();

/**
 * Mulai scan BLE untuk device tertentu dan panggil callback ketika terhubung.
 * @param targetName Nama device yang dicari
 * @param onConnected Callback yang dipanggil dengan device yang berhasil terhubung
 */
export async function startScan(
  onConnected: (device: Device) => void
): Promise<void> {
  console.log('kesini')
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error('BLE Scan Error', error);
      return;
    }

    if (device) {
      // Log detail lengkap
      console.log('Device found:', {
        id: device.id,
        name: device.name,
        localName: device.localName,
        manufacturerData: device.manufacturerData,
        serviceUUIDs: device.serviceUUIDs,
      });

      // Coba filter berdasarkan clue (nama mengandung Cyan, Glass, dsb.)
      if (device.name?.includes('Cyan') || device.localName?.includes('Cyan')) {
        console.log('=== Ditemukan device target! ===');
        manager.stopDeviceScan();

        device.connect()
          .then((d) => d.discoverAllServicesAndCharacteristics())
          .then((d) => {
            console.log('Connected to', d.name);
            onConnected(d);
          })
          .catch((err) => console.error('Connection error', err));
      }
    }

    setTimeout(() => {
      console.log('Stop scanning');
      manager.stopDeviceScan();
    }, 20000);
  });
}

export async function scanBluetoothClassic(): Promise<BluetoothDevice[]> {
  try {
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
  } catch (error) {
    console.error('Error scanning Bluetooth Classic:', error);
    return [];
  } finally {
    console.log('=== Selesai scanning ===');
  }
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