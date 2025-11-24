import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '../colors';

export default function WelcomeScreen({ navigation }) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      navigation.replace('Main');
    }
  }, [isSignedIn]);

  const handleCreateAccount = () => navigation.navigate('CreateAccountPage');
  const handleLogInAccount = () => navigation.navigate('LogInPage');

  return (
    <View style={styles.container}>

      {/* Background image */}
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
            <Text style={styles.tagline}>The best of Extreme Fit, anytime, anywhere.</Text>
          </View>
        </ImageBackground>
      )}

      {/* BUTTON SECTION */}
      <View style={styles.bottomContainer}>

        {/* CREATE ACCOUNT (Primary) */}
        <TouchableOpacity 
          style={styles.createAccountButton}
          onPress={handleCreateAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.createAccountText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>

        {/* LOGIN (Outline) */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogInAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>LOG IN</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

/* ---------------------------  STYLES  --------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },

  imageContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },

  brandingContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  brandText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },

  tagline: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
  },

  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    paddingTop: 30,
    backgroundColor: '#000',
  },

  /* --------------------------- BUTTONS --------------------------- */

  createAccountButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    width: '100%',

    // ⭐ PILL SHAPE (VERY ROUND)
    borderRadius: 50,

    alignItems: 'center',
    marginBottom: 20,

    // Subtle shadow
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  createAccountText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    width: '100%',

    // ⭐ PILL SHAPE (ROUND)
    borderRadius: 50,

    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 20,
  },

  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

