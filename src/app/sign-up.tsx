import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

export default function SignUp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up Form</Text>
      <Text style={styles.text}>Joaquin will build this screen here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  text: {
    color: colors.muted,
    marginTop: 8,
  },
});
