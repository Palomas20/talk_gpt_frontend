import { StyleSheet, Text, View, Button, Pressable } from "react-native";
import { useState } from "react";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { playFromPath } from "./utils/playFromPath";
import { writeAudioToFile } from "./utils/writeAudioToFile";

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});

export default function App() {
  const [borderColor, setBorderColor] = useState<"lightgray" | "lightgreen">(
    "lightgray"
  );

  const [urlPath, setUrlPath] = useState("");
  const { state, startRecognizing, stopRecognizing, destroyRecognizer } =
    useVoiceRecognition();

  const listFiles = async () => {
    try {
      const result = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory!
      );
      if (result.length > 0) {
        const filename = result[0];
        const path = FileSystem.documentDirectory + filename;
        setUrlPath(path);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleSubmit = async () => {
    if (!state.results[0]) return;
    try {
      //fecht the audio blob from the server
      const audioBlob = await fetchAudio(state.results[0]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          // data:audio/mpeg;base64 , ....(actual base64 data)....
          const audioData = e.target.result.split(",")[1];

          // save data
          const path = await writeAudioToFile(audioData);

          // play audio
          setUrlPath(path);
          await playFromPath(path);
          destroyRecognizer();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 30 }}>
        Talk GPT
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: "#333333",
          marginBottom: 5,
          fontSize: 12,
        }}
      >
        Presiona y manten este boton para grabar tu voz. Suelta el botón para
        enviar la grabación, y oirás una respuesta.
      </Text>
      <Text style={{ marginVertical: 10, fontSize: 17 }}>Tu mensaje:</Text>
      <Pressable
        onPressIn={() => {
          setBorderColor("lightgreen");
          startRecognizing();
        }}
        onPressOut={() => {
          setBorderColor("lightgray");
          stopRecognizing();
          handleSubmit();
        }}
        style={{
          width: "90%",
          padding: 30,
          gap: 10,
          borderWidth: 3,
          alignItems: "center",
          borderRadius: 10,
          borderColor: borderColor,
        }}
      >
        <Text>Manten para hablar</Text>
      </Pressable>
      <Text style={{ marginVertical: 10, fontSize: 17 }}>
        {JSON.stringify(state, null, 2)}
      </Text>
      <Button
        title="Reply last message"
        onPress={async () => {
          await playFromPath(urlPath);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
