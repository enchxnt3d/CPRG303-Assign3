import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FormButton from "../components/FormButton";
import { auth, db } from "../config/firebase";
import { colors } from "../constants/theme";

interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  userId: string;
  userEmail: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

function getFirestoreReadErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "You do not have permission to view these employee records.";
    }

    if (error.code === "unavailable") {
      return "Firestore is currently unavailable. Please try again.";
    }
  }

  return "Employee records could not be loaded. Please try again.";
}

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "No date available";
  }

  return timestamp.toDate().toLocaleString();
}

export default function EmployeesListScreen() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const loadEmployees = useCallback(async (user: User) => {
    setIsLoadingEmployees(true);

    try {
      const employeesQuery = query(
        collection(db, "employees"),
        where("userId", "==", user.uid),
      );

      const snapshot = await getDocs(employeesQuery);

      const employeeList = snapshot.docs.map((employeeDoc) => {
        const data = employeeDoc.data();

        return {
          id: employeeDoc.id,
          firstName: String(data.firstName ?? ""),
          lastName: String(data.lastName ?? ""),
          employeeId: String(data.employeeId ?? ""),
          email: String(data.email ?? ""),
          phone: String(data.phone ?? ""),
          department: String(data.department ?? ""),
          userId: String(data.userId ?? ""),
          userEmail: data.userEmail ? String(data.userEmail) : null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      // Sort newest first without needing an extra Firestore index
      employeeList.sort((a, b) => {
        const firstDate = a.createdAt?.toMillis() ?? 0;
        const secondDate = b.createdAt?.toMillis() ?? 0;

        return secondDate - firstDate;
      });

      setEmployees(employeeList);
    } catch (error) {
      Alert.alert("Load failed", getFirestoreReadErrorMessage(error));
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);

      if (!user) {
        router.replace("/sign-in");
        return;
      }

      await loadEmployees(user);
    });

    return unsubscribe;
  }, [loadEmployees, router]);

  const handleRefresh = async () => {
    if (!currentUser) {
      Alert.alert(
        "Sign in required",
        "Please sign in to view saved employees.",
      );
      router.replace("/sign-in");
      return;
    }

    await loadEmployees(currentUser);
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
    >
      <Text style={styles.title}>Saved Employees</Text>

      {currentUser?.email ? (
        <Text style={styles.signedInText}>
          Signed in as {currentUser.email}
        </Text>
      ) : null}

      <View style={styles.actionsContainer}>
        <FormButton
          title="Back to Form"
          onPress={() => router.push("/employee")}
        />

        <View style={styles.smallSpacing} />

        <FormButton
          title={isLoadingEmployees ? "Loading..." : "Refresh List"}
          onPress={handleRefresh}
          disabled={isLoadingEmployees}
        />
      </View>

      {isLoadingEmployees ? (
        <View style={styles.loadingListContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved employees...</Text>
        </View>
      ) : null}

      {!isLoadingEmployees && employees.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No saved employees yet</Text>
          <Text style={styles.emptyText}>
            Submit the Employee Information Form first, then the saved records
            will appear here.
          </Text>
        </View>
      ) : null}

      {!isLoadingEmployees &&
        employees.map((employee) => (
          <View key={employee.id} style={styles.employeeCard}>
            <Text style={styles.employeeName}>
              {employee.firstName} {employee.lastName}
            </Text>

            <Text style={styles.employeeDetail}>
              Employee ID: {employee.employeeId}
            </Text>

            <Text style={styles.employeeDetail}>
              Department: {employee.department}
            </Text>

            <Text style={styles.employeeDetail}>Email: {employee.email}</Text>

            <Text style={styles.employeeDetail}>Phone: {employee.phone}</Text>

            <Text style={styles.employeeDate}>
              Created: {formatDate(employee.createdAt)}
            </Text>
          </View>
        ))}

      <View style={styles.signOutContainer}>
        <FormButton title="Sign Out" onPress={handleSignOut} />
      </View>
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

  loadingListContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
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
    marginBottom: 20,
  },

  actionsContainer: {
    marginBottom: 20,
  },

  smallSpacing: {
    height: 12,
  },

  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },

  employeeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },

  employeeName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },

  employeeDetail: {
    color: colors.text,
    fontSize: 15,
    marginBottom: 6,
  },

  employeeDate: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
  },

  signOutContainer: {
    marginTop: 16,
  },
});
