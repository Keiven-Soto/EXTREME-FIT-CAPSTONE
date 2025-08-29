import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Colors from '../colors';
import logo from '../assets/Extreme_fit_new_logo-10.png';

const API_BASE_URL = 'http://192.168.0.15:5001';

export default function CreateAccountPage({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    // Basic validations
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    // Password validation
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    // Split name into first_name and last_name
    const [first_name = '', ...rest] = name.trim().split(' ');
    const last_name = rest.join(' ');

    if (!first_name) {
      Alert.alert('Error', 'Please enter both first and last name.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          first_name,
          last_name: last_name || '',
          email,
          password_hash: password,
          phone,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'Success!', 
          `Account created successfully for ${data.user.first_name}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setName('');
                setEmail('');
                setPhone('');
                setPassword('');
                setConfirmPassword('');
                // Navigate to main app
                navigation && navigation.navigate('Main');
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', data.error || 'Error creating account');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert(
        'Network Error', 
        'Cannot connect to server. Make sure:\n' +
        '• Your backend server is running\n' +
        '• You are connected to the same WiFi\n' +
        '• The IP address in the code is correct'
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to test API connection
  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test-db`);
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Connection Test', `Connected to ${data.database} successfully!`);
      } else {
        Alert.alert('Connection Failed', data.message || 'Cannot connect to database');
      }
    } catch (error) {
      Alert.alert('Connection Failed', 'Cannot reach server. Check your IP address and make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={logo} style={styles.centerImage} resizeMode='contain' />
        
        <Text style={styles.title}>Create Account</Text>
        
        {/* Test Connection Button */}
        <TouchableOpacity style={styles.testButton} onPress={testConnection}>
          <Text style={styles.testButtonText}>Test API Connection</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleCreateAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.whiteText} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation && navigation.goBack()}>
          <Text style={styles.linkText}>Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.mainColor,
    marginBottom: 24,
    textAlign: 'center',
    width: '100%',
  },
  testButton: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.mainColor,
  },
  testButtonText: {
    color: Colors.mainColor,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: Colors.whiteBackground,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    alignSelf: 'center',
    textAlign: 'left',
  },
  button: {
    backgroundColor: Colors.mainColor,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'center',
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.mutedText,
  },
  buttonText: {
    color: Colors.whiteText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: Colors.mainColor,
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
    width: '100%',
  },
  centerImage: {
    alignSelf: 'center',
    width: 300,
    height: 300,
    marginTop: 10,
  },
});