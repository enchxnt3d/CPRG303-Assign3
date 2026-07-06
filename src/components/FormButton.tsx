import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../constants/theme";

type FormButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function FormButton({
  title,
  onPress,
  disabled,
  loading,
}: FormButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    backgroundColor: colors.primaryDark,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
