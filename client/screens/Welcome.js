import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '../colors';

export default function WelcomeScreen({ navigation }) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    // If user is already signed in, redirect to main app
    if (isSignedIn) {
      navigation.replace('Main');
    }
  }, [isSignedIn]);

  const handleCreateAccount = () => {
    navigation.navigate('CreateAccountPage');
  };

  const handleLogInAccount = () => {
    navigation.navigate('LogInPage');
  };

  const handleContinueAsGuest = () => {
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      {/* Background image area */}
      {Platform.OS === 'web' ? (
        <View style={styles.imageContainer}>
          <View style={styles.brandingContainer}>
            <Text style={styles.brandText}>EXTREME FIT</Text>
            <Text style={styles.tagline}>The best of Extreme Fit, anytime, anywhere.</Text>
          </View>
        </View>
      ) : (
        <ImageBackground 
          source={require('../assets/Extreme_fit_new_logo-07.png')}
          style={styles.imageContainer}
          resizeMode="cover"
        >
          <View style={styles.brandingContainer}>
            {/* <Text style={styles.brandText}>EXTREME FIT</Text> */}
            <Text style={styles.tagline}>The best of Extreme Fit, anytime, anywhere.</Text>
          </View>
        </ImageBackground>
      )}

      {/* Bottom section with buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
          <Text style={styles.createAccountText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogInAccount}>
          <Text style={styles.loginText}>LOG IN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestButton} onPress={handleContinueAsGuest}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brandText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagline: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    paddingTop: 20,
    backgroundColor: 'black',
  },
  createAccountButton: {
    backgroundColor: Colors.whiteBackground,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 6,
    borderColor: Colors.grayIcon,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  createAccountText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#fff',
    marginBottom: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});