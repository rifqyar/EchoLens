import { NativeModules, NativeEventEmitter } from 'react-native';

type BluetoothScoType = {
  startSco: () => void;
  stopSco: () => void;
  addListener: (cb: (state: string) => void) => { remove: () => void };
};

const { BluetoothScoModule } = NativeModules;
const eventEmitter = new NativeEventEmitter();

const BluetoothSco: BluetoothScoType = {
  startSco: () => BluetoothScoModule.startSco(),
  stopSco: () => BluetoothScoModule.stopSco(),
  addListener: (cb) => {
    const sub = eventEmitter.addListener('BluetoothSco', cb);
    return { remove: () => sub.remove() };
  },
};

export default BluetoothSco;
