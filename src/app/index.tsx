import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Forms App</Text>
      <Text style={styles.subtitle}>Choose a form to continue.</Text>

      <View style={styles.card}>
        <Link href="/sign-in" style={styles.link}>
          Sign In
        </Link>
        <Link href="/sign-up" style={styles.link}>
          Sign Up
        </Link>
        <Link href="/employee" style={styles.link}>
          Employee Information
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 18,
    gap: 14,
  },
  link: {
    backgroundColor: colors.primary,
    color: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
});
