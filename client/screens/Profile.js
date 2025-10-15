import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useClerk } from '@clerk/clerk-expo';
import Colors from '../colors';

export default function ProfileScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const profilePic = require('../assets/Extreme_fit_new_logo-01.png');

  const gotoEditProfileSection = () => {
    navigation && navigation.navigate('EditProfile');
  };

  const gotoOrderHistory = () => {
    navigation && navigation.navigate('OrderHistory');
  };

  // DEBUG: Show Clerk ID
  const showClerkId = () => {
    Alert.alert(
      'Your Clerk ID',
      `Clerk ID: ${user?.id}\n\nCopy this and update your database!`,
      [{ text: 'OK' }]
    );
    console.log('=== CLERK USER INFO ===');
    console.log('Clerk ID:', user?.id);
    console.log('Email:', user?.emailAddresses?.[0]?.emailAddress);
    console.log('Name:', user?.firstName, user?.lastName);
  };

  const handleLogOut = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              navigation.replace('Welcome');
            } catch (err) {
              Alert.alert('Error', 'Failed to log out');
              console.error(JSON.stringify(err, null, 2));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Image source={profilePic} style={styles.profileImagePic} />
            </View>
          </View>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.username || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.emailAddresses?.[0]?.emailAddress || 'No email'}
          </Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={gotoEditProfileSection}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color={Colors.mutedText} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={gotoOrderHistory}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="receipt-outline" size={24} color={Colors.mutedText} />
              <Text style={styles.menuItemText}>Order History</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedText} />
          </TouchableOpacity>

          {/* DEBUG BUTTON - Remove after getting clerk_id */}
          <TouchableOpacity style={styles.menuItem} onPress={showClerkId}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="bug-outline" size={24} color="#FF6B00" />
              <Text style={[styles.menuItemText, { color: '#FF6B00' }]}>Show Clerk ID (Debug)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B00" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={24} color={Colors.mutedText} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color={Colors.mutedText} />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color={Colors.mutedText} />
              <Text style={styles.menuItemText}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedText} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogOut}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={24} color={Colors.mainColor} />
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Extreme Fit v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: Colors.whiteBackground,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.mainColor,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImagePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  menuSection: {
    backgroundColor: Colors.whiteBackground,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.darkText,
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: Colors.mainColor,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: Colors.mutedText,
  },
});