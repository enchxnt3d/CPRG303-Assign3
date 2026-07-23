import { Link } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Forms App</Text>

      <Text style={styles.subtitle}>
        Signed in as {user?.email ?? "authenticated user"}
      </Text>

      <View style={styles.card}>
        <Link href="/employee" style={styles.link}>
          Employee Information
        </Link>

        <Link href="/employees-list" style={styles.link}>
          View Employee Submissions
        </Link>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed ? styles.buttonPressed : null,
          ]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </Pressable>
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
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
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

  logoutButton: {
    backgroundColor: colors.error,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonPressed: {
    opacity: 0.8,
  },

  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
