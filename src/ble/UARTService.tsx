import { useEffect, useCallback, useState } from "react";
import {
  Platform,
  PermissionsAndroid,
  NativeEventEmitter,
  NativeModules,
} from "react-native";
import BleManager, {
  BleManagerDidUpdateValueForCharacteristicEvent,
} from "react-native-ble-manager";

const UART_SERVICE = "6e40fff0-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // Write
const UART_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // Notify

// helper: ubah byte array ke string ASCII
const bytesToString = (arr: number[]) =>
  arr.map((b) => String.fromCharCode(b)).join("");

// helper: ubah string ke byte array
const stringToBytes = (str: string) =>
  str.split("").map((c) => c.charCodeAt(0));

// helper: deteksi JSON
const tryParseJSON = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

export function useSmartGlassesUART(peripheralId: string) {
  const [messages, setMessages] = useState<(string | object)[]>([]);

  useEffect(() => {
    if (Platform.OS === "android" && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }

    BleManager.start({ showAlert: false }).catch((err) =>
      console.error("Error starting BLE:", err)
    );

    const bleEmitter = new NativeEventEmitter(NativeModules.BleManager);

    const subscription = BleManager.onDidUpdateValueForCharacteristic(
      handleUpdateValueForCharacteristic
    );

    return () => {
      console.log("[app] unmounting, removing listeners...");
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peripheralId]);

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent
  ) => {
    if (
      data.peripheral === peripheralId &&
      data.characteristic.toLowerCase() === UART_RX.toLowerCase()
    ) {
      const raw = bytesToString(data.value);
      console.log("📥 UART RX raw:", raw);

      const parsed = tryParseJSON(raw);
      if (parsed) {
        console.log("✅ Parsed JSON:", parsed);
        setMessages((prev) => [...prev, parsed]);
      } else {
        setMessages((prev) => [...prev, raw]);
      }
    }
  };

  const startUart = useCallback(async () => {
    try {
      await BleManager.startNotification(peripheralId, UART_SERVICE, UART_RX);
      console.log("✅ UART RX Notification started");
    } catch (err) {
      console.error("❌ Failed to start UART:", err);
    }
  }, [peripheralId]);

  const sendUart = useCallback(
    async (text: string) => {
      try {
        const data = stringToBytes(text);
        console.log(data)
        await BleManager.writeWithoutResponse(
          peripheralId,
          UART_SERVICE,
          UART_TX,
          data
        );
        console.log("📤 UART TX:", text);
      } catch (err) {
        console.error("❌ UART send failed:", err);
      }
    },
    [peripheralId]
  );

  return { messages, startUart, sendUart };
}
