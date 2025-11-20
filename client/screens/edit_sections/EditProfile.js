import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import ApiService, { setGlobalAuthToken, API_BASE_URL } from '../../services/api';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../colors';

export default function EditProfileSection({navigation}) {
  const { getToken, isSignedIn } = useAuth();

  const gotoEditAddressSection = (address) => {
    navigation && navigation.navigate('EditAddress', { address });
  };

  // Estado para usuario autenticado, direcciones y loading
  const [currentUser, setCurrentUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchUserAndAddresses = async () => {
      setLoading(true);
      try {
        // Debug: Check auth status
        console.log('🔐 Auth Status:', { isSignedIn });

        // Try to get token
        const token = await getToken();
        console.log('🎫 Token present:', !!token);

        if (!token) {
          console.error('❌ No token available - user not authenticated');
          setLoading(false);
          return;
        }

        // Set token globally for API calls
        setGlobalAuthToken(token);

        // Get authenticated user from database
        console.log('🔍 Full API URL:', `${API_BASE_URL}/api/users/me`);

        const user = await ApiService.users.getCurrentUser();
        console.log('👤 Raw response:', JSON.stringify(user, null, 2));
        console.log('👤 User response:', user);

        if (!user || !user.user_id) {
          console.error('❌ User not authenticated - no user_id in response');
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        // Fetch addresses for the authenticated user
        const result = await ApiService.addresses.getByUser(user.user_id);
        console.log('Direcciones API result:', result);
        if (result.success) {
          setAddresses(result.data);
        } else {
          setAddresses([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setAddresses([]);
      }
      setLoading(false);
    };
    if (isFocused) {
      fetchUserAndAddresses();
    }
  }, [isFocused]);

  // Handlers
  const [editingContact, setEditingContact] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const { user: clerkUser } = useUser();

  const onEditContact = () => {
    if (!currentUser) return;
    setEditFirstName(currentUser.first_name || '');
    setEditLastName(currentUser.last_name || '');
    setEditingContact(true);
  };

  const onCancelEditContact = () => {
    setEditingContact(false);
  };

  const onSaveContact = async () => {
    if (!currentUser?.user_id) return;
    setSavingContact(true);
    try {
      // First, update Clerk profile if available
      if (clerkUser && typeof clerkUser.update === 'function') {
        try {
          await clerkUser.update({ firstName: editFirstName, lastName: editLastName });
          console.log('✅ Clerk profile updated');
        } catch (clerkErr) {
          console.warn('Failed to update Clerk profile:', clerkErr);
          // Don't abort — continue to update backend, but inform user
          Alert.alert('Clerk sync failed', 'Name saved locally but failed to sync with authentication provider.');
        }
      }
      const payload = {
        first_name: editFirstName,
        last_name: editLastName,
      };

      const result = await ApiService.users.update(currentUser.user_id, payload);
      // result may be the updated user object or an API wrapper { success, data }
      let updatedUser = null;
      if (result) {
        if (result.success && result.data) updatedUser = result.data;
        else if (result.user_id) updatedUser = result;
      }

      if (updatedUser) {
        setCurrentUser(updatedUser);
      } else {
        // If API didn't return the updated user, refetch current user
        const refetched = await ApiService.users.getCurrentUser();
        if (refetched && refetched.user_id) setCurrentUser(refetched);
      }

      setEditingContact(false);
    } catch (err) {
      console.error('Error updating contact:', err);
    }
    setSavingContact(false);
  };
  const onResetPassword = () => {
    navigation && navigation.navigate('ChangePassword');
  };
  const onAddAddress = () => {
    navigation && navigation.navigate('EditAddress');
  };
  const onEditAddress = (addr) => {};
  
  const onSetDefault = async (addr) => {
    if (!addr?.address_id || !currentUser?.user_id) return;
    try {
      // Use a dedicated endpoint that sets this address as default without requiring full payload
      const result = await ApiService.addresses.setDefault(addr.address_id);
      console.log('Set default response:', result);
      await sleep(500);
      if (result.success) {
        const updated = await ApiService.addresses.getByUser(currentUser.user_id);
        setAddresses(updated.success ? updated.data : []);
      } else {
        console.log('Error setting default address:', result.message || result);
      }
    } catch (err) {
      console.log('Default address error:', err);
    }
  };

  const goBack = () => {
    navigation && navigation.goBack();
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <SafeAreaView style={styles.container}>
      {/* Static Header */}
      <View style={styles.staticHeader}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.mainColor} />
        </TouchableOpacity>
        <Text style={styles.staticHeaderTitle}>Edit Profile</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* CONTACT DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
          {/* Name Row */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Your Name</Text>
              {!editingContact ? (
                <Text style={styles.fieldValue}>
                  {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
                </Text>
              ) : (
                <View>
                  <TextInput
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="First name"
                    style={styles.input}
                  />
                  <TextInput
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Last name"
                    style={styles.input}
                  />
                </View>
              )}
            </View>
            {!editingContact ? (
              <TouchableOpacity onPress={onEditContact} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="pencil" size={18} color={Colors.mutedText} />
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity style={[styles.saveBtn]} onPress={onSaveContact} disabled={savingContact}>
                  {savingContact ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn]} onPress={onCancelEditContact} disabled={savingContact}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Email Row */}
          <View style={[styles.fieldRow, styles.fieldRowDivider]}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{currentUser?.email || 'Loading...'}</Text>
            </View>
          </View>
          {/* Change Password Link */}
          <TouchableOpacity style={styles.linkRow} onPress={onResetPassword}>
            <Text style={styles.linkText}>Change password</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* ADDRESSES */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>ADDRESSES</Text>
            <TouchableOpacity onPress={onAddAddress}>
              <Text style={styles.addNew}>Add new</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={Colors.mainColor} style={{ marginVertical: 16 }} />
          ) : addresses.length === 0 ? (
            <Text style={{ color: Colors.mutedText, marginVertical: 12 }}>No addresses found.</Text>
          ) : (
            addresses.map((addr, idx) => (
              <View key={addr.address_id} style={[styles.addressCard, idx !== 0 && { marginTop: 14 }]}> 
                <View style={styles.addressHeader}>
                  <Text style={styles.addressName}>{addr.address_type ? addr.address_type.charAt(0).toUpperCase() + addr.address_type.slice(1) : 'Address'}</Text>
                  {addr.is_default ? <Text style={styles.badgeDefault}>Default</Text> : null}
                </View>
                <Text style={styles.addressLine}>{addr.street_address}</Text>
                <Text style={styles.addressLine}>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code}</Text>
                <Text style={styles.addressLine}>{addr.country}</Text>
                {addr.phone ? <Text style={styles.addressLine}>{addr.phone}</Text> : null}
                <View style={styles.addressActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => gotoEditAddressSection(addr)}>
                    <Text>Edit</Text>
                  </TouchableOpacity>
                  {!addr.is_default ? (
                    <TouchableOpacity onPress={() => onSetDefault(addr)}>
                      <Text style={styles.setDefaultText}>Set as default</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Extreme Fit v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  card: {
    backgroundColor: Colors.whiteBackground,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  fieldRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.darkText,
  },
  linkRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 14,
    color: Colors.darkText,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  addNew: {
    fontSize: 14,
    color: Colors.mainColor,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressName: {
    fontSize: 16,
    color: Colors.darkText,
    fontWeight: '700',
    marginRight: 8,
  },
  badgeDefault: {
    fontSize: 12,
    color: Colors.mutedText,
    backgroundColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  addressLine: {
    fontSize: 14,
    color: Colors.mutedText,
    marginTop: 2,
  },
  addressActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  setDefaultText: {
    fontSize: 13,
    color: Colors.mainColor,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    width: 300,
    maxWidth: '80%',
    backgroundColor: Colors.whiteBackground,
    color: Colors.darkText,
  },
  editButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: Colors.mainColor,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: Colors.mutedText,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.mutedText,
  },
});