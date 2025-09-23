import React, { useEffect, useState } from 'react';
import ApiService from '../../services/api';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../colors';

export default function EditProfileSection({navigation}) {

  const gotoEditAddressSection= () => {
  // Navegar a la sección de edición de dirección
    navigation && navigation.navigate('EditAddress');
  };

  // Simulación: obtén el userId real de tu auth/contexto
  const userId = '1'; // <-- reemplaza por el id real
  const user = {
    name: 'William Rodríguez',
    email: 'rodriguez.m.warm@gmail.com',
  };

  // Estado para direcciones y loading
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);
      const result = await ApiService.addresses.getByUser(userId);
      console.log('Direcciones API result:', result); // <-- Aquí ves la estructura
      if (result.success) {
        setAddresses(result.data); // Ajusta según tu backend
      } else {
        setAddresses([]);
      }
      setLoading(false);
    };
    fetchAddresses();
  }, [userId]);

  // Handlers (conéctalos a navegación o modales)
  const onEditContact = () => {};
  const onResetPassword = () => {};
  const onAddAddress = () => {};
  const onEditAddress = (addr) => {};
  const onSetDefault = (addr) => {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* CONTACT DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
          {/* Name Row */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Your Name</Text>
              <Text style={styles.fieldValue}>{user.name}</Text>
            </View>
            <TouchableOpacity onPress={onEditContact} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="pencil" size={18} color={Colors.mutedText} />
            </TouchableOpacity>
          </View>
          {/* Email Row */}
          <View style={[styles.fieldRow, styles.fieldRowDivider]}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{user.email}</Text>
            </View>
          </View>
          {/* Reset Password Link */}
          <TouchableOpacity style={styles.linkRow} onPress={onResetPassword}>
            <Text style={styles.linkText}>Reset your password</Text>
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
                <View style={styles.addressActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={gotoEditAddressSection}>
                    <Text>Edit</Text>
                    {/* <Ionicons name="pencil" size={18} color={Colors.mutedText} /> */}
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
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation && navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.mainColor} />
          <Text style={styles.goBackText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
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
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.mutedText,
  },
    goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  goBackText: {
    color: Colors.mainColor,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    alignItems: 'center',
    alignSelf: 'center',
  },
});
