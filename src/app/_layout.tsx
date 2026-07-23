import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen
          name="sign-in"
          options={{
            title: "Sign In",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="sign-up"
          options={{
            title: "Sign Up",
            headerShown: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="index" options={{ title: "Forms App" }} />

        <Stack.Screen
          name="employee"
          options={{ title: "Employee Information" }}
        />

        <Stack.Screen
          name="employees-list"
          options={{ title: "Employee Submissions" }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
