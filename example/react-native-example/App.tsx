import { StyleSheet, SafeAreaView } from "react-native";
import ExampleMultiSelect from "./ExampleMultiSelect";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ExampleMultiSelect />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
});
