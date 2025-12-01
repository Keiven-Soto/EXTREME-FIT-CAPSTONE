import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";

export default function CreateAccountPage({ navigation }) {
  const { signUp, isLoaded, setActive } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const showAlert = (message) => {
    Alert.alert("OH NO!", message);
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!firstName.trim()) return showAlert("Please enter your first name.");
    if (!lastName.trim()) return showAlert("Please enter your last name.");
    if (!emailAddress.trim()) return showAlert("Please enter your email.");
    if (!password.trim()) return showAlert("Please enter a password.");

    setLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err) {
      showAlert(err.errors?.[0]?.message || "Failed to create account.");
      console.error("Signup Error:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!code.trim()) return showAlert("Enter your verification code.");

    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigation.replace("Main");
      } else {
        showAlert("Verification incomplete. Please try again.");
      }
    } catch (err) {
      showAlert(err.errors?.[0]?.message || "Failed to verify.");
      console.error("Verification Error:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centerWrapper}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Welcome")}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>Join Extreme Fit today</Text>
          </View>

          {!pendingVerification ? (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                autoCapitalize="words"
                value={firstName}
                placeholder="First name"
                placeholderTextColor="#666"
                onChangeText={setFirstName}
                autoComplete="name-given"
              />

              <TextInput
                style={styles.input}
                autoCapitalize="words"
                value={lastName}
                placeholder="Last name"
                placeholderTextColor="#666"
                onChangeText={setLastName}
                autoComplete="name-family"
              />

              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Email address"
                placeholderTextColor="#666"
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoComplete="email"
              />

              <TextInput
                style={styles.input}
                value={password}
                placeholder="Password"
                placeholderTextColor="#666"
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onSignUpPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>SIGN UP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("LogInPage")}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  Already have an account?{" "}
                  <Text style={styles.linkTextBold}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.subtitle}>
                Enter the code sent to your email
              </Text>

              <TextInput
                style={styles.input}
                value={code}
                placeholder="Verification code"
                placeholderTextColor="#666"
                onChangeText={setCode}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onPressVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>VERIFY</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.darkBackground || "#000",
  },

  // ⬇⬇⬇ THIS is the proper centering wrapper ⬇⬇⬇
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // safe vertical center
    paddingBottom: 80,
    paddingTop: 40,
  },

  scrollContent: {
    flexGrow: 1,
  },

  backButton: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 20,
    padding: 10,
  },

  header: {
    marginBottom: 40,
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 20,
  },

  formContainer: {
    width: "85%",
    alignItems: "center",
  },

  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    padding: 15,
    width: "100%",
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#fff",
  },

  button: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    width: "100%",
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  linkButton: {
    alignItems: "center",
    paddingVertical: 10,
  },

  linkText: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },

  linkTextBold: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
