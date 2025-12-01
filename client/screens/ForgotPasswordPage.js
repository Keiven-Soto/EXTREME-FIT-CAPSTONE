import React, { useState } from 'react';
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
  ScrollView
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../colors';

export default function ForgotPasswordPage({ navigation }) {
  const { signIn, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onRequestReset = async () => {
    if (!isLoaded) return;
    if (!emailAddress.trim()) {
      Alert.alert('OH NO!', 'Please enter your email.');
      return;
    }

    setLoading(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });
      setSuccessfulCreation(true);
      Alert.alert('Success', 'Check your email for a reset code');
    } catch (err) {
      Alert.alert('OH NO!', err.errors?.[0]?.message || 'Failed to send reset code');
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    if (!isLoaded) return;

    if (!code.trim()) {
      Alert.alert('OH NO!', 'Please enter the reset code.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('OH NO!', 'Please enter a new password.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        // Sign out any session that was created during password reset
        await signOut();
        Alert.alert('Success', 'Password reset successfully. Please log in with your new password.');
        // Navigate back to login screen so user can log in with new password
        navigation.replace('LogInPage');
      } else {
        Alert.alert('OH NO!', 'Password reset incomplete. Please try again.');
      }
    } catch (err) {
      Alert.alert('OH NO!', err.errors?.[0]?.message || 'Failed to reset password');
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // ✅ VIEW: AFTER RESET CODE SENT
  if (successfulCreation) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerWrapper}>
            <View style={styles.header}>
              <Text style={styles.title}>RESET PASSWORD</Text>
              <Text style={styles.subtitle}>
                Enter the code sent to{'\n'}{emailAddress}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                value={code}
                placeholder="Reset code"
                placeholderTextColor="#666"
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  placeholder="New password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>RESET PASSWORD</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.navigate('LogInPage')}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ✅ VIEW: REQUEST RESET CODE
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centerWrapper}>
          <View style={styles.header}>
            <Text style={styles.title}>FORGOT PASSWORD</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a reset code
            </Text>
          </View>

          <View style={styles.formContainer}>
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
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>SEND RESET CODE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.darkBackground || '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Safe centering wrapper (no white box on Android)
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 15,
    paddingRight: 45,
    borderRadius: 10,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 5,
  },
});
