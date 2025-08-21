import { useEffect, useCallback, useState } from "react";
import {
  Platform,
  PermissionsAndroid,
} from "react-native";
import BleManager, { BleManagerDidUpdateValueForCharacteristicEvent } from "react-native-ble-manager";

const SERVICE_UUID = "de5bf728-d711-4e47-af26-65e3012a5dc7";
const CHAR_UUID_NOTIFICATION = "de5bf729-d711-4e47-af26-65e3012a5dc7"; // NOTIFY
const CHAR_UUID_WRITE = "de5bf72a-d711-4e47-af26-65e3012a5dc7";       // WRITE

const CAPTURE_COMMAND = [0xBC, 0x41, 0x03, 0x00, 0x10, 0x50, 0x02, 0x01, 0x01];
const CAPTURE_VIDEO_COMMAND = [0xBC, 0x41, 0x03, 0x00, 0x50, 0x51, 0x02, 0x01, 0x02];
const STOP_VIDEO_COMMAND = [0xBC, 0x41, 0x03, 0x00, 0x91, 0x91, 0x02, 0x01, 0x03];
const CAPTURE_AUDIO_COMMAND = [0xBC, 0x41, 0x03, 0x00, 0xD0, 0x56, 0x02, 0x01, 0x08];
const STOP_AUDIO_COMMAND = [0xBC, 0x41, 0x03, 0x00, 0xD1, 0x95, 0x02, 0x01, 0x0C];

const normalize = (uuid: string) => uuid.replace(/-/g, "").toLowerCase();

// helper ubah array byte ke hex string
const toHexString = (arr: number[]) =>
  arr.map(b => b.toString(16).padStart(2, "0")).join(" ");

export function useSmartGlassesTrigger(peripheralId: string) {
  const [response, setResponse] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "android" && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }

    try {
      BleManager.start({ showAlert: false })
        .then(() => console.debug("BleManager started."))
        .catch((error: any) =>
          console.error("BleManager could not be started.", error)
        );
    } catch (error) {
      console.error("unexpected error starting BleManager.", error);
      return;
    }

    // pasang listener
    const subscription = BleManager.onDidUpdateValueForCharacteristic(
      handleUpdateValueForCharacteristic
    );

    return () => {
      console.log("[app] unmounting, removing listeners...");
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent
  ) => {
    if (
      normalize(data.characteristic) === normalize(CHAR_UUID_NOTIFICATION) &&
      normalize(data.peripheral) === normalize(peripheralId)
    ) {
      console.log(
        `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`
      );

      const hex = toHexString(data.value);
      setResponse(hex);

      // parsing sederhana berdasarkan byte ke-2
      if (data.value[1] === 0x41) {
        console.log("➡️ ACK: perintah foto diterima");
      } else if (data.value[1] === 0x73) {
        console.log("➡️ STATUS hasil foto:", hex);
      }
    }
  };

  const triggerCapture = useCallback(async () => {
    try {
      await BleManager.startNotification(peripheralId, SERVICE_UUID, CHAR_UUID_NOTIFICATION);
      console.log("✅ Notification enabled");

      await new Promise((r) => setTimeout(r, 1000)); // delay

      await BleManager.write(
        peripheralId,
        SERVICE_UUID,
        CHAR_UUID_WRITE,
        CAPTURE_COMMAND
      );

      console.log("📤 Capture command sent");
    } catch (error) {
      console.error("❌ Error triggerCapture:", error);
    }
  }, [peripheralId]);

  const triggerStartVideo = useCallback(async () => {
    try {
      await BleManager.startNotification(peripheralId, SERVICE_UUID, CHAR_UUID_NOTIFICATION);
      console.log("✅ Notification enabled");

      await new Promise((r) => setTimeout(r, 1000)); // delay

      await BleManager.write(
        peripheralId,
        SERVICE_UUID,
        CHAR_UUID_WRITE,
        CAPTURE_VIDEO_COMMAND
      );

      console.log("📤 Capture Video command sent");
    } catch (error) {
      console.error("❌ Error triggerCapture:", error);
    }
  }, [peripheralId]);

  const triggerStopVideo = useCallback(async () => {
    try {
      await BleManager.startNotification(peripheralId, SERVICE_UUID, CHAR_UUID_NOTIFICATION);
      console.log("✅ Notification enabled");

      await new Promise((r) => setTimeout(r, 1000)); // delay

      await BleManager.write(
        peripheralId,
        SERVICE_UUID,
        CHAR_UUID_WRITE,
        STOP_VIDEO_COMMAND
      );

      console.log("📤 Capture Video command sent");
    } catch (error) {
      console.error("❌ Error triggerCapture:", error);
    }
  }, [peripheralId])

  const triggerStartAudio = useCallback(async () => {
    try {
      await BleManager.startNotification(peripheralId, SERVICE_UUID, CHAR_UUID_NOTIFICATION);
      console.log("✅ Notification enabled");

      await new Promise((r) => setTimeout(r, 1000)); // delay

      await BleManager.write(
        peripheralId,
        SERVICE_UUID,
        CHAR_UUID_WRITE,
        CAPTURE_AUDIO_COMMAND
      );

      console.log("📤 Capture Audio command sent");
    } catch (error) {
      console.error("❌ Error triggerCapture:", error);
    }
  }, [peripheralId]);

  const triggerStopAudio = useCallback(async () => {
    try {
      await BleManager.startNotification(peripheralId, SERVICE_UUID, CHAR_UUID_NOTIFICATION);
      console.log("✅ Notification enabled");

      await new Promise((r) => setTimeout(r, 1000)); // delay

      await BleManager.write(
        peripheralId,
        SERVICE_UUID,
        CHAR_UUID_WRITE,
        STOP_AUDIO_COMMAND
      );

      console.log("📤 Capture Audio command sent");
    } catch (error) {
      console.error("❌ Error triggerCapture:", error);
    }
  }, [peripheralId])

  return { triggerCapture, triggerStartVideo, triggerStopVideo, triggerStartAudio, triggerStopAudio, response };
}
