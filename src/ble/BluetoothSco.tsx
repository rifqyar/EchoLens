// import { NativeModules, NativeEventEmitter } from 'react-native';

// type BluetoothScoType = {
//   startSco: () => void;
//   stopSco: () => void;
//   addListener: (cb: (state: string) => void) => { remove: () => void };
// };

// const { BluetoothScoModule } = NativeModules;
// const eventEmitter = new NativeEventEmitter(BluetoothScoModule);

// const BluetoothSco: BluetoothScoType = {
//   startSco: () => BluetoothScoModule.startSco(),
//   stopSco: () => BluetoothScoModule.stopSco(),
//   addListener: (cb) => {
//     const sub = eventEmitter.addListener('BluetoothSco', cb);
//     return { remove: () => sub.remove() };
//   },
// };

// export default BluetoothSco;

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

type BluetoothScoType = {
  startSco: () => void;
  stopSco: () => void;
  addListener: (cb: (state: string) => void) => { remove: () => void };
};

const { BluetoothScoModule } = NativeModules;

if (!BluetoothScoModule) {
  console.warn(`[BluetoothSco] Module not linked. Did you run pod install / rebuild?`);
}

const eventEmitter = BluetoothScoModule ? new NativeEventEmitter(BluetoothScoModule) : null;

const BluetoothSco: BluetoothScoType = {
  startSco: () => BluetoothScoModule?.startSco?.(),
  stopSco: () => BluetoothScoModule?.stopSco?.(),
  addListener: (cb) => {
    if (!eventEmitter) {
      return { remove: () => {} };
    }
    const sub = eventEmitter.addListener('BluetoothSco', cb);
    return { remove: () => sub.remove() };
  },
};

export default BluetoothSco;
