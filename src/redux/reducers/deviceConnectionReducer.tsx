export interface ConnectedDevice {
  name?: string;
  id: string;
  connected: boolean;
  isBLE: boolean;
  rssi?: number;
  // BLE-specific fields (iOS)
  advertising?: any;
  connecting?: boolean;
}

interface DeviceConnectionState {
  device: ConnectedDevice | Record<string, never>;
}

const initialState: DeviceConnectionState = {
  device: {},
}

interface Action {
  type: string;
  payload: any;
}

export default (state = initialState, action: Action): DeviceConnectionState => {
  const { type, payload } = action
  switch (type) {
    case 'CONNECT_DEVICE':
      // Pastikan payload selalu single object, bukan array
      const devicePayload = Array.isArray(payload) ? payload[0] : payload;
      return {
        ...state,
        device: devicePayload ?? {},
      };
    case 'DISCONNET_DEVICE':
      return {
        ...state,
        device: {},
      };
    default:
      return state;
  }
};