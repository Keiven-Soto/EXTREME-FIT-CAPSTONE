import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Colors from '../colors';
import logo from '../assets/Extreme_fit_new_logo-10.png';
import ApiService, { API_BASE_URL } from '../services/api';

export default function CreateAccountPage({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return false;
    }

    const [first_name = ''] = name.trim().split(' ');
    if (!first_name) {
      Alert.alert('Error', 'Please enter your full name.');
      return false;
    }

    return true;
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    const [first_name = '', ...rest] = name.trim().split(' ');
    const last_name = rest.join(' ');

    setLoading(true);

    try {
      const userData = {
        first_name,
        last_name: last_name || '',
        email: email.trim().toLowerCase(),
        password_hash: password,
        phone: phone.trim(),
      };

      const result = await ApiService.users.create(userData);

      if (result.success) {
        Alert.alert(
          'Account Created Successfully!', 
          `Welcome to Extreme Fit, ${result.data.user.first_name}!`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                clearForm();
                navigation?.navigate('Main');
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Unable to create account. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    
    try {
      const result = await ApiService.testConnection();
      
      if (result.success) {
        Alert.alert(
          'Connection Successful', 
          `Server is running and database is connected.\n\nAPI: ${API_BASE_URL}\nDatabase: ${result.data.database}\nStatus: ${result.data.status}`
        );
      } else {
        Alert.alert(
          'Connection Failed', 
          `Cannot connect to server.\n\nAPI: ${API_BASE_URL}\n\nMake sure:\n• Backend server is running\n• You're on the same WiFi network\n• Server is on port 5001\n\nError: ${result.error}`
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Error', 
        `Failed to reach server at: ${API_BASE_URL}\n\nTroubleshooting:\n• Restart your backend server\n• Restart Expo dev server\n• Check WiFi connection\n\nError: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Extreme Fit and start your fitness journey</Text>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {loading ? 'Testing...' : 'Test Server Connection'}
          </Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.mutedText}
            value={name}
            onChangeText={setName}
            editable={!loading}
            autoCapitalize="words"
            returnKeyType="next"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={Colors.mutedText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="next"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={Colors.mutedText}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
            returnKeyType="next"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password (8+ characters)"
            placeholderTextColor={Colors.mutedText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            returnKeyType="next"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={Colors.mutedText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleCreateAccount}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.buttonDisabled]} 
          onPress={handleCreateAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.whiteText} size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back to Welcome</Text>
        </TouchableOpacity>

        <Text style={styles.apiInfo}>Server: {API_BASE_URL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: '100%',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.mainColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: 'center',
    marginBottom: 25,
  },
  testButton: {
    backgroundColor: Colors.whiteBackground,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.mainColor,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testButtonText: {
    color: Colors.mainColor,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    color: Colors.darkText,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  createButton: {
    backgroundColor: Colors.mainColor,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.mutedText,
    shadowOpacity: 0.1,
  },
  createButtonText: {
    color: Colors.whiteText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButtonText: {
    color: Colors.mainColor,
    fontSize: 16,
    fontWeight: '500',
  },
  apiInfo: {
    fontSize: 10,
    color: Colors.mutedText,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
});