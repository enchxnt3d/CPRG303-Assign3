import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface EmployeeEditValues {
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
}

// Small helpers so the user gets clear Firebase errors
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

function getFirestoreUpdateErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "You do not have permission to update this employee record.";
    }

    if (error.code === "unavailable") {
      return "Firestore is currently unavailable. Please try again.";
    }
  }

  return "The employee record could not be updated. Please try again.";
}

function getFirestoreDeleteErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "You do not have permission to delete this employee record.";
    }

    if (error.code === "unavailable") {
      return "Firestore is currently unavailable. Please try again.";
    }
  }

  return "The employee record could not be deleted. Please try again.";
}

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "No date available";
  }

  return timestamp.toDate().toLocaleString();
}

// This fills the edit form with the selected employee data
function getInitialEditValues(employee: EmployeeRecord): EmployeeEditValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    employeeId: employee.employeeId,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
  };
}

// Simple validation for the edit modal
function validateEmployeeEditValues(values: EmployeeEditValues) {
  if (values.firstName.trim().length < 2) {
    return "First name must be at least 2 characters.";
  }

  if (values.lastName.trim().length < 2) {
    return "Last name must be at least 2 characters.";
  }

  if (values.employeeId.trim().length < 4) {
    return "Employee ID must be at least 4 characters.";
  }

  if (!values.email.trim().includes("@")) {
    return "Please enter a valid email address.";
  }

  if (!/^[0-9]{10}$/.test(values.phone.trim())) {
    return "Phone number must be exactly 10 digits.";
  }

  if (values.department.trim().length === 0) {
    return "Department is required.";
  }

  return null;
}

export default function EmployeesListScreen() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeRecord | null>(null);
  const [editValues, setEditValues] = useState<EmployeeEditValues | null>(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(
    null,
  );

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

      // Sort newest first here so Firebase does not ask for another index
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

  const openEmployeeDetails = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setEditValues(getInitialEditValues(employee));
  };

  const closeEmployeeDetails = () => {
    if (isUpdatingEmployee || deletingEmployeeId) {
      return;
    }

    setSelectedEmployee(null);
    setEditValues(null);
  };

  const updateEditValue = (field: keyof EmployeeEditValues, value: string) => {
    setEditValues((currentValues) => {
      if (!currentValues) {
        return currentValues;
      }

      return {
        ...currentValues,
        [field]: value,
      };
    });
  };

  const handleUpdateEmployee = async () => {
    if (!currentUser || !selectedEmployee || !editValues) {
      Alert.alert(
        "Sign in required",
        "Please sign in before updating records.",
      );
      router.replace("/sign-in");
      return;
    }

    // Extra check before updating, just to keep ownership safe
    if (selectedEmployee.userId !== currentUser.uid) {
      Alert.alert(
        "Update blocked",
        "You can only update employee records connected to your account.",
      );
      return;
    }

    const validationError = validateEmployeeEditValues(editValues);

    if (validationError) {
      Alert.alert("Check the form", validationError);
      return;
    }

    const updatedData = {
      firstName: editValues.firstName.trim(),
      lastName: editValues.lastName.trim(),
      employeeId: editValues.employeeId.trim(),
      email: editValues.email.trim(),
      phone: editValues.phone.trim(),
      department: editValues.department.trim(),

      // Keep the record connected to the logged-in user
      userId: currentUser.uid,
      userEmail: currentUser.email,

      updatedAt: serverTimestamp(),
    };

    try {
      setIsUpdatingEmployee(true);

      await updateDoc(doc(db, "employees", selectedEmployee.id), updatedData);

      const updatedEmployee: EmployeeRecord = {
        ...selectedEmployee,
        ...updatedData,
        updatedAt: Timestamp.now(),
      };

      // Update the screen without needing to reload everything
      setEmployees((currentEmployees) =>
        currentEmployees.map((employee) =>
          employee.id === selectedEmployee.id ? updatedEmployee : employee,
        ),
      );

      setSelectedEmployee(updatedEmployee);
      setEditValues(getInitialEditValues(updatedEmployee));

      Alert.alert("Updated", "Employee record updated successfully.");
    } catch (error) {
      Alert.alert("Update failed", getFirestoreUpdateErrorMessage(error));
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  const deleteEmployee = async (employee: EmployeeRecord) => {
    if (!currentUser) {
      Alert.alert(
        "Sign in required",
        "Please sign in before deleting records.",
      );
      router.replace("/sign-in");
      return;
    }

    // Same idea here, only the owner should delete it
    if (employee.userId !== currentUser.uid) {
      Alert.alert(
        "Delete blocked",
        "You can only delete employee records connected to your account.",
      );
      return;
    }

    try {
      setDeletingEmployeeId(employee.id);

      await deleteDoc(doc(db, "employees", employee.id));

      // Remove the deleted record from the list right away
      setEmployees((currentEmployees) =>
        currentEmployees.filter((item) => item.id !== employee.id),
      );

      if (selectedEmployee?.id === employee.id) {
        setSelectedEmployee(null);
        setEditValues(null);
      }

      Alert.alert("Deleted", "Employee record deleted successfully.");
    } catch (error) {
      Alert.alert("Delete failed", getFirestoreDeleteErrorMessage(error));
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  const confirmDeleteEmployee = (employee: EmployeeRecord) => {
    const employeeName = `${employee.firstName} ${employee.lastName}`.trim();

    // Alert buttons can be weird on Expo Web, so we use browser confirm here
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const shouldDelete = window.confirm(
        `Are you sure you want to delete ${employeeName}?`,
      );

      if (shouldDelete) {
        void deleteEmployee(employee);
      }

      return;
    }

    Alert.alert(
      "Delete employee?",
      `Are you sure you want to delete ${employeeName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteEmployee(employee);
          },
        },
      ],
    );
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
    <>
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
          employees.map((employee) => {
            const isDeletingThisEmployee = deletingEmployeeId === employee.id;

            return (
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

                <Text style={styles.employeeDetail}>
                  Email: {employee.email}
                </Text>

                <Text style={styles.employeeDetail}>
                  Phone: {employee.phone}
                </Text>

                <Text style={styles.employeeDate}>
                  Created: {formatDate(employee.createdAt)}
                </Text>

                <Text style={styles.employeeDate}>
                  Updated: {formatDate(employee.updatedAt)}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.detailsButton,
                    pressed ? styles.detailsButtonPressed : null,
                  ]}
                  onPress={() => openEmployeeDetails(employee)}
                  accessibilityRole="button"
                >
                  <Text style={styles.detailsButtonText}>Details / Edit</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && !isDeletingThisEmployee
                      ? styles.deleteButtonPressed
                      : null,
                    isDeletingThisEmployee ? styles.deleteButtonDisabled : null,
                  ]}
                  onPress={() => confirmDeleteEmployee(employee)}
                  disabled={isDeletingThisEmployee}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteButtonText}>
                    {isDeletingThisEmployee ? "Deleting..." : "Delete"}
                  </Text>
                </Pressable>
              </View>
            );
          })}

        <View style={styles.signOutContainer}>
          <FormButton title="Sign Out" onPress={handleSignOut} />
        </View>
      </ScrollView>

      <Modal
        visible={selectedEmployee !== null && editValues !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEmployeeDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Employee Details</Text>

              {selectedEmployee ? (
                <>
                  <Text style={styles.modalMeta}>
                    Document ID: {selectedEmployee.id}
                  </Text>

                  <Text style={styles.modalMeta}>
                    Owner: {selectedEmployee.userEmail ?? "No email available"}
                  </Text>

                  <Text style={styles.modalMeta}>
                    Created: {formatDate(selectedEmployee.createdAt)}
                  </Text>

                  <Text style={styles.modalMeta}>
                    Updated: {formatDate(selectedEmployee.updatedAt)}
                  </Text>
                </>
              ) : null}

              {editValues ? (
                <>
                  <Text style={styles.editLabel}>First Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValues.firstName}
                    onChangeText={(value) =>
                      updateEditValue("firstName", value)
                    }
                    placeholder="Enter First Name"
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={styles.editLabel}>Last Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValues.lastName}
                    onChangeText={(value) => updateEditValue("lastName", value)}
                    placeholder="Enter Last Name"
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={styles.editLabel}>Employee ID</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValues.employeeId}
                    onChangeText={(value) =>
                      updateEditValue("employeeId", value)
                    }
                    placeholder="EMP001"
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={styles.editLabel}>Email</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValues.email}
                    onChangeText={(value) => updateEditValue("email", value)}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.editLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValues.phone}
                    onChangeText={(value) => updateEditValue("phone", value)}
                    placeholder="4035551234"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                  />

                  <Text style={styles.editLabel}>Department</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValues.department}
                    onChangeText={(value) =>
                      updateEditValue("department", value)
                    }
                    placeholder="IT Department"
                    placeholderTextColor={colors.muted}
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.saveButton,
                      pressed && !isUpdatingEmployee
                        ? styles.saveButtonPressed
                        : null,
                      isUpdatingEmployee ? styles.saveButtonDisabled : null,
                    ]}
                    onPress={handleUpdateEmployee}
                    disabled={isUpdatingEmployee}
                    accessibilityRole="button"
                  >
                    <Text style={styles.saveButtonText}>
                      {isUpdatingEmployee ? "Saving..." : "Save Changes"}
                    </Text>
                  </Pressable>

                  {selectedEmployee ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed ? styles.deleteButtonPressed : null,
                      ]}
                      onPress={() => confirmDeleteEmployee(selectedEmployee)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.deleteButtonText}>
                        Delete This Record
                      </Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed ? styles.closeButtonPressed : null,
                    ]}
                    onPress={closeEmployeeDetails}
                    accessibilityRole="button"
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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

  detailsButton: {
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  detailsButtonPressed: {
    backgroundColor: colors.primaryDark,
  },

  detailsButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: "700",
  },

  deleteButton: {
    minHeight: 44,
    backgroundColor: colors.error,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  deleteButtonPressed: {
    opacity: 0.85,
  },

  deleteButtonDisabled: {
    backgroundColor: colors.disabled,
  },

  deleteButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: "700",
  },

  signOutContainer: {
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 700,
    maxHeight: "90%",
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalContent: {
    padding: 20,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },

  modalMeta: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },

  editLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },

  editInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },

  saveButton: {
    minHeight: 46,
    backgroundColor: colors.success,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  saveButtonPressed: {
    opacity: 0.85,
  },

  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },

  saveButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: "800",
  },

  closeButton: {
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  closeButtonPressed: {
    backgroundColor: colors.primaryDark,
  },

  closeButtonText: {
    color: colors.card,
    fontSize: 15,
    fontWeight: "800",
  },
});
