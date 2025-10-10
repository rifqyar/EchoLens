import React, { useEffect, useState } from "react";
import { View, FlatList, ScrollView, StyleSheet, Platform } from "react-native";
import RNFS from "react-native-fs";
import Sound from "react-native-sound";
import {
  Card,
  Text,
  Button,
  Portal,
  Modal,
  Provider as PaperProvider,
} from "react-native-paper";

interface RecordingItem {
  audioPath: string;
  txtPath: string;
  fileName: string;
  date: string;
}

const RecordingsList: React.FC = () => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selected, setSelected] = useState<RecordingItem | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const basePath =
        Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/Documents/TactID`
          : `${RNFS.DocumentDirectoryPath}/TactID`;

      const folderPath = `${basePath}/Audio`;
      const textFolder = `${basePath}/Text`;
      const files = await RNFS.readDir(folderPath);

      console.log(files)
      const recs: RecordingItem[] = [];

      for (const f of files) {
        if (f.isFile() && f.name.endsWith(".wav")) {
          const baseName = f.name.replace(".wav", "");
          const txtPath = `${textFolder}/${baseName}.txt`;

          recs.push({
            audioPath: f.path,
            txtPath: txtPath,
            fileName: f.name,
            date: new Date(f.mtime || "").toLocaleString(),
          });
        }
      }

      setRecordings(recs);
    } catch (err) {
      console.error("❌ Gagal load recordings:", err);
    }
  };

  const openDetail = async (item: RecordingItem) => {
    try {
      const txt = await RNFS.readFile(item.txtPath, "utf8");
      setTranscript(txt);
      setSelected(item);
    } catch (err) {
      console.error("❌ Gagal baca transcript:", err);
      setTranscript("Transcript tidak tersedia.");
      setSelected(item);
    }
  };

  const playAudio = (path: string) => {
    console.log(path)
    const sound = new Sound(path, "", (err: any) => {
      if (err) {
        console.error("❌ Gagal play audio:", err);
        return;
      }
      sound.play(() => {
        sound.release();
      });
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.audioPath}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => openDetail(item)}
            mode="outlined"
          >
            <Card.Content>
              <Text style={styles.fileName}>{item.fileName}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </Card.Content>
          </Card>
        )}
      />

      {/* Modal Detail */}
      <Portal>
        <Modal
          visible={!!selected}
          onDismiss={() => setSelected(null)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{selected?.fileName}</Text>
          <Text style={styles.modalDate}>{selected?.date}</Text>

          <ScrollView style={styles.scrollBox}>
            <Text style={styles.text}>{transcript}</Text>
          </ScrollView>

          <Button
            mode="contained"
            style={styles.playButton}
            onPress={() => selected && playAudio(selected.audioPath)}
          >
            ▶️ Play Audio
          </Button>

          <Button
            mode="outlined"
            style={styles.closeButton}
            onPress={() => setSelected(null)}
            textColor="#fff"
          >
            ❌ Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 12,
  },
  card: {
    backgroundColor: "#2b384b",
    borderColor: "#3c4a63",
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 6,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  date: {
    fontSize: 12,
    color: "#bbb",
    marginTop: 4,
  },
  modalContainer: {
    backgroundColor: "#2b384b",
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3c4a63",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  modalDate: { fontSize: 12, color: "#aaa", marginBottom: 10 },
  scrollBox: {
    maxHeight: 300,
    backgroundColor: "#3c4a63",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  text: { fontSize: 14, color: "#fff", lineHeight: 20 },
  playButton: {
    backgroundColor: "#4CAF50",
    marginBottom: 10,
    borderRadius: 8,
  },
  closeButton: {
    borderColor: "#aaa",
    borderRadius: 8,
  },
});

export default RecordingsList;
