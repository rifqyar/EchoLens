#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BluetoothScoModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startSco)
RCT_EXTERN_METHOD(stopSco)

@end
