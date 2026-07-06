import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors } from "../constants/theme";

type FormInputProps = TextInputProps & {
  label: string;
  error?: string;
  icon?: string;
};

export default function FormInput({
  label,
  error,
  icon,
  ...props
}: FormInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputBox,
          focused && styles.focused,
          error && styles.errorBox,
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  focused: {
    borderColor: colors.primary,
  },
  errorBox: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
});
