import remoteConfig from '@react-native-firebase/remote-config';

export interface DeviceConfig {
  name: string;
  macs: string[];
}

const DEFAULT_DEVICES: DeviceConfig[] = [
  { name: 'MO1', macs: [] },
  { name: 'M01', macs: [] },
  { name: 'MO2', macs: [] },
  { name: 'M02', macs: [] },
  { name: 'Bluetrum', macs: ['41:42:E7:76:55:7C'] },
  { name: 'Spectra', macs: ['41:42:FF:8E:79:9D'] },
  { name: 'Sentinel', macs: [] },
];

let cachedDevices: DeviceConfig[] | null = null;

export async function initDeviceWhitelist(): Promise<DeviceConfig[]> {
  if (cachedDevices) {
    return cachedDevices;
  }

  try {
    await remoteConfig().setDefaults({
      allowed_devices: JSON.stringify(DEFAULT_DEVICES),
    });

    await remoteConfig().fetchAndActivate();

    const raw = remoteConfig().getValue('allowed_devices').asString();
    const parsed: DeviceConfig[] = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedDevices = parsed;
      console.log('[DeviceWhitelist] loaded from Remote Config:', cachedDevices);
    } else {
      cachedDevices = DEFAULT_DEVICES;
    }
  } catch (error) {
    console.warn('[DeviceWhitelist] failed to fetch, using defaults:', error);
    cachedDevices = DEFAULT_DEVICES;
  }

  return cachedDevices;
}

export function getCachedDevices(): DeviceConfig[] {
  return cachedDevices ?? DEFAULT_DEVICES;
}

export function getAllowedDeviceNames(): string[] {
  return getCachedDevices().map((d) => d.name);
}

export function isBLEDeviceAllowed(name: string | undefined, id: string): boolean {
  const devices = getCachedDevices();

  if (!name) {
    return false;
  }

  return devices.some((device) => {
    if (name.toLowerCase().includes(device.name.toLowerCase())) {
      return true;
    }
    if (device.macs.length > 0 && device.macs.includes(id)) {
      return true;
    }
    return false;
  });
}

export function isClassicDeviceAllowed(name: string | undefined): boolean {
  if (!name) {
    return false;
  }
  const devices = getCachedDevices();
  return devices.some((device) => name.toLowerCase().includes(device.name.toLowerCase()));
}
