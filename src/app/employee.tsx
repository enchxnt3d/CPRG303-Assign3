import { Formik } from "formik";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import * as Yup from "yup";

import FormButton from "../components/FormButton";
import FormInput from "../components/FormInput";
import { colors } from "../constants/theme";

const EmployeeSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .required("First name is required"),

  lastName: Yup.string()
    .min(2, "Last name must be at least 2 characters")
    .required("Last name is required"),

  employeeId: Yup.string()
    .min(4, "Employee ID must be at least 4 characters")
    .required("Employee ID is required"),

  email: Yup.string().email("Invalid email").required("Email is required"),

  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),

  department: Yup.string().required("Department is required"),
});

export default function Employee() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Employee Information Form</Text>

      <Formik
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
        onSubmit={(values, { resetForm }) => {
          Alert.alert(
            "Success",
            "Employee information submitted successfully!",
          );

          console.log(values);

          resetForm();
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
              title="Submit"
              onPress={() => handleSubmit()}
              disabled={!isValid}
            />
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

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 25,
  },
});
