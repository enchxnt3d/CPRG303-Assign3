import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Yup from "yup";

import FormButton from "../components/FormButton";
import FormInput from "../components/FormInput";
import { auth, db } from "../config/firebase";
import { colors } from "../constants/theme";

interface EmployeeValues {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
}

const EmployeeSchema = Yup.object().shape({
  firstName: Yup.string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .required("First name is required"),

  lastName: Yup.string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .required("Last name is required"),

  employeeId: Yup.string()
    .trim()
    .min(4, "Employee ID must be at least 4 characters")
    .required("Employee ID is required"),

  email: Yup.string()
    .trim()
    .email("Invalid email")
    .required("Email is required"),

  phone: Yup.string()
    .trim()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),

  department: Yup.string().trim().required("Department is required"),
});

function getFirestoreErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "You do not have permission to save this employee record.";
    }

    if (error.code === "unavailable") {
      return "Firestore is currently unavailable. Please try again.";
    }

    if (error.code === "unauthenticated") {
      return "Please sign in before saving employee information.";
    }
  }

  return "The employee information could not be saved. Please try again.";
}

export default function Employee() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);

      if (!user) {
        router.replace("/sign-in");
      }
    });

    return unsubscribe;
  }, [router]);

  const handleEmployeeSubmit = async (
    values: EmployeeValues,
    resetForm: () => void,
  ) => {
    if (!currentUser) {
      Alert.alert(
        "Sign in required",
        "Please sign in before submitting employee information.",
      );

      router.replace("/sign-in");
      return;
    }

    try {
      await addDoc(collection(db, "employees"), {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        employeeId: values.employeeId.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        department: values.department.trim(),

        // This connects each employee record to the logged-in user
        userId: currentUser.uid,
        userEmail: currentUser.email,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        "Employee information was saved to Firebase successfully!",
      );

      resetForm();
    } catch (error) {
      Alert.alert("Save failed", getFirestoreErrorMessage(error));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/sign-in");
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking your session...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Employee Information Form</Text>

      {currentUser?.email ? (
        <Text style={styles.signedInText}>
          Signed in as {currentUser.email}
        </Text>
      ) : null}

      <Formik<EmployeeValues>
        initialValues={{
          firstName: "",
          lastName: "",
          employeeId: "",
          email: "",
          phone: "",
          department: "",
        }}
        validationSchema={EmployeeSchema}
        validateOnMount
        onSubmit={async (values, { resetForm, setSubmitting }) => {
          await handleEmployeeSubmit(values, resetForm);
          setSubmitting(false);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isValid,
          dirty,
          isSubmitting,
        }) => (
          <>
            <FormInput
              label="First Name"
              placeholder="Enter First Name"
              value={values.firstName}
              onChangeText={handleChange("firstName")}
              onBlur={handleBlur("firstName")}
              error={touched.firstName ? errors.firstName : undefined}
            />

            <FormInput
              label="Last Name"
              placeholder="Enter Last Name"
              value={values.lastName}
              onChangeText={handleChange("lastName")}
              onBlur={handleBlur("lastName")}
              error={touched.lastName ? errors.lastName : undefined}
            />

            <FormInput
              label="Employee ID"
              placeholder="EMP001"
              value={values.employeeId}
              onChangeText={handleChange("employeeId")}
              onBlur={handleBlur("employeeId")}
              error={touched.employeeId ? errors.employeeId : undefined}
            />

            <FormInput
              label="Email"
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={values.email}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              error={touched.email ? errors.email : undefined}
            />

            <FormInput
              label="Phone Number"
              placeholder="4035551234"
              keyboardType="number-pad"
              value={values.phone}
              onChangeText={handleChange("phone")}
              onBlur={handleBlur("phone")}
              error={touched.phone ? errors.phone : undefined}
            />

            <FormInput
              label="Department"
              placeholder="IT Department"
              value={values.department}
              onChangeText={handleChange("department")}
              onBlur={handleBlur("department")}
              error={touched.department ? errors.department : undefined}
            />

            <FormButton
              title={isSubmitting ? "Saving..." : "Submit"}
              onPress={() => handleSubmit()}
              disabled={!isValid || !dirty || isSubmitting}
            />

            <View style={styles.viewListContainer}>
              <FormButton
                title="View Saved Employees"
                onPress={() => router.push("/employees-list" as never)}
              />
            </View>

            <View style={styles.signOutContainer}>
              <FormButton title="Sign Out" onPress={handleSignOut} />
            </View>
          </>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loadingText: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },

  signedInText: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 25,
  },

  viewListContainer: {
    marginTop: 16,
  },

  signOutContainer: {
    marginTop: 16,
  },
});
