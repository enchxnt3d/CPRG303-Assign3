import { Link, useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Formik } from "formik";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Yup from "yup";

import { auth } from "../config/firebase";
import { colors, spacing } from "../constants/theme";

interface SignInValues {
  email: string;
  password: string;
}

type FocusedField = "email" | "password" | null;

// Rules for the sign in form
const signInSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

function getFirebaseSignInErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      return "Incorrect email or password.";
    }

    if (error.code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Please wait a bit and try again.";
    }

    if (error.code === "auth/network-request-failed") {
      return "Network error. Check your internet and try again.";
    }
  }

  return "The account could not be signed in. Please try again.";
}

export default function SignInScreen() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const handleSignIn = async (values: SignInValues) => {
    setIsLoading(true);

    try {
      const cleanEmail = values.email.trim();

      await signInWithEmailAndPassword(auth, cleanEmail, values.password);

      Alert.alert("Sign in successful", "Welcome back to Sacbé.");

      // After login, send the user to the protected app area
      router.replace("/");
    } catch (error) {
      Alert.alert("Sign in failed", getFirebaseSignInErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Sacbé</Text>

        <Text style={styles.title}>Welcome back</Text>

        <Text style={styles.subtitle}>
          Sign in to continue your learning path.
        </Text>

        <Formik<SignInValues>
          initialValues={{
            email: "",
            password: "",
          }}
          validationSchema={signInSchema}
          onSubmit={handleSignIn}
          validateOnMount
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isValid,
            dirty,
          }) => {
            const isSubmitDisabled = !isValid || !dirty || isLoading;

            return (
              <View>
                <Text style={styles.label}>Email</Text>

                <TextInput
                  style={[
                    styles.input,
                    focusedField === "email" ? styles.inputFocused : null,
                    touched.email && errors.email ? styles.inputError : null,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={(event) => {
                    setFocusedField(null);
                    handleBlur("email")(event);
                  }}
                />

                {/* Error only shows after touching the input */}
                {touched.email && errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}

                <Text style={styles.label}>Password</Text>

                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === "password" ? styles.inputFocused : null,
                    touched.password && errors.password
                      ? styles.inputError
                      : null,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onFocus={() => setFocusedField("password")}
                    onBlur={(event) => {
                      setFocusedField(null);
                      handleBlur("password")(event);
                    }}
                  />

                  {/* Our password visibility button */}
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={22} color={colors.muted} />
                    ) : (
                      <Eye size={22} color={colors.muted} />
                    )}
                  </Pressable>
                </View>

                {touched.password && errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}

                {/* Disabled until every validation rule passes */}
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && !isSubmitDisabled ? styles.buttonPressed : null,
                    isSubmitDisabled ? styles.buttonDisabled : null,
                  ]}
                  onPress={() => handleSubmit()}
                  disabled={isSubmitDisabled}
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.card} />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </Pressable>

                <Text style={styles.bottomText}>
                  Do not have an account?{" "}
                  <Link href="/sign-up" style={styles.link}>
                    Sign up
                  </Link>
                </Text>
              </View>
            );
          }}
        </Formik>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },

  card: {
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    backgroundColor: colors.card,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },

  passwordContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: spacing.sm,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },

  eyeButton: {
    padding: spacing.sm,
  },

  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },

  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 6,
  },

  button: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },

  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },

  buttonDisabled: {
    backgroundColor: colors.disabled,
  },

  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: "700",
  },

  bottomText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: spacing.md,
    fontSize: 14,
  },

  link: {
    color: colors.primary,
    fontWeight: "700",
  },
});
