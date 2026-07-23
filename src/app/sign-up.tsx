import { Link, useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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

interface SignUpValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FocusedField =
  | "fullName"
  | "email"
  | "password"
  | "confirmPassword"
  | null;

// Rules for creating an account
const signUpSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be 50 characters or less")
    .required("Full name is required"),

  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),

  // Makes sure both passwords are the same
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

function getFirebaseSignUpErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "This email is already connected to an account.";
    }

    if (error.code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }

    if (error.code === "auth/weak-password") {
      return "Password is too weak. Use at least 8 characters.";
    }

    if (error.code === "auth/network-request-failed") {
      return "Network error. Check your internet and try again.";
    }
  }

  return "The account could not be created. Please try again.";
}

export default function SignUpScreen() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const handleSignUp = async (values: SignUpValues) => {
    setIsLoading(true);

    try {
      const cleanFullName = values.fullName.trim();
      const cleanEmail = values.email.trim();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        values.password,
      );

      // Firebase creates the account first, then we save the user's name
      await updateProfile(userCredential.user, {
        displayName: cleanFullName,
      });

      Alert.alert("Account created", `Welcome to Sacbé, ${cleanFullName}`);

      // Send the user to Sign In so we can test the full auth flow
      router.replace("/sign-in");
    } catch (error) {
      Alert.alert("Sign up failed", getFirebaseSignUpErrorMessage(error));
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

        <Text style={styles.title}>Create account</Text>

        <Text style={styles.subtitle}>Start your guided learning roadmap.</Text>

        <Formik<SignUpValues>
          initialValues={{
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={signUpSchema}
          onSubmit={handleSignUp}
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
                <Text style={styles.label}>Full Name</Text>

                <TextInput
                  style={[
                    styles.input,
                    focusedField === "fullName" ? styles.inputFocused : null,
                    touched.fullName && errors.fullName
                      ? styles.inputError
                      : null,
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
                  value={values.fullName}
                  onChangeText={handleChange("fullName")}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={(event) => {
                    setFocusedField(null);
                    handleBlur("fullName")(event);
                  }}
                />

                {/* Error only shows after touching the input */}
                {touched.fullName && errors.fullName ? (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                ) : null}

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
                    placeholder="Create a password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
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

                <Text style={styles.label}>Confirm Password</Text>

                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === "confirmPassword"
                      ? styles.inputFocused
                      : null,
                    touched.confirmPassword && errors.confirmPassword
                      ? styles.inputError
                      : null,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={(event) => {
                      setFocusedField(null);
                      handleBlur("confirmPassword")(event);
                    }}
                  />

                  {/* Separate button for confirm password */}
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={22} color={colors.muted} />
                    ) : (
                      <Eye size={22} color={colors.muted} />
                    )}
                  </Pressable>
                </View>

                {touched.confirmPassword && errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
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
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </Pressable>

                <Text style={styles.bottomText}>
                  Already have an account?{" "}
                  <Link href="/sign-in" style={styles.link}>
                    Sign in
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
    marginTop: 12,
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
