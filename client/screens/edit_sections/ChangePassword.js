import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import Colors from '../../colors';

/**
 * ChangePasswordScreen
 *
 * Allows authenticated users to change their password without signing out.
 * Requires current password for security verification.
 */
export default function ChangePasswordSection({ navigation }) {
  const { user } = useUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    navigation && navigation.goBack();
  };

  const validateForm = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long');
      return false;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!user) {
        Alert.alert('Error', 'You must be signed in to change your password');
        return;
      }

      // Use Clerk's updatePassword method
      await user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been changed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);

      // Handle Clerk API errors with user-friendly messages
      const errorMessage = error?.errors?.[0]?.longMessage ||
                          error?.errors?.[0]?.message ||
                          error?.message ||
                          '';

      // Provide specific guidance for common errors
      let title = 'Password Change Failed';
      let message = errorMessage;

      if (errorMessage.includes('found in an online data breach') ||
          errorMessage.includes('breached password')) {
        title = 'Weak Password Detected';
        message = 'This password has been exposed in a data breach and is not secure.\n\nFor your safety, please choose a different password that:\n• Has not been used on other sites\n• Contains a mix of letters, numbers, and symbols\n• Is at least 8 characters long';
      } else if (errorMessage.includes('incorrect') ||
                 errorMessage.includes('current password') ||
                 errorMessage.includes('wrong password')) {
        title = 'Incorrect Password';
        message = 'The current password you entered is incorrect. Please try again.';
      } else if (errorMessage.includes('too common') ||
                 errorMessage.includes('weak')) {
        title = 'Password Too Common';
        message = 'This password is too common and easy to guess.\n\nPlease use a stronger password with:\n• A mix of uppercase and lowercase letters\n• Numbers and special characters\n• At least 8 characters';
      } else if (!message) {
        message = 'Failed to change password. Please try again.';
      }

      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.staticHeader}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.mainColor} />
        </TouchableOpacity>
        <Text style={styles.staticHeaderTitle}>Change Password</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.infoText}>
              Enter your current password and choose a new password.
            </Text>

            {/* Password Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Password Tips:</Text>
              <Text style={styles.tipItem}>• Use at least 8 characters (longer is better)</Text>
              <Text style={styles.tipItem}>• Mix uppercase, lowercase, numbers & symbols</Text>
              <Text style={styles.tipItem}>• Avoid common words or patterns</Text>
              <Text style={styles.tipItem}>• Don't reuse passwords from other sites</Text>
            </View>

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.mutedText}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.mutedText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.mutedText}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.mutedText}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Must be at least 8 characters</Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={Colors.mutedText}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.mutedText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  staticHeader: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: Colors.lightBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.mainColor,
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    top: 18,
    padding: 4,
    zIndex: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  card: {
    backgroundColor: Colors.whiteBackground,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 16,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.mainColor,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 18,
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 8,
  },
  passwordInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.darkText,
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: Colors.mainColor,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
