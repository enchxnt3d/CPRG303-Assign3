import { Stack } from "expo-router";
import { colors } from "../constants/theme";

export default function RootLayout() {
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
      <Stack.Screen name="index" options={{ title: "Forms App" }} />

      {/* Authentication screens already have their own titles */}
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

      <Stack.Screen
        name="employee"
        options={{ title: "Employee Information" }}
      />
    </Stack>
  );
}
