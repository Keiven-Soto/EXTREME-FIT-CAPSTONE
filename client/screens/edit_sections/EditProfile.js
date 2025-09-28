import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import ApiService from '../../services/api';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../colors';

export default function EditProfileSection({navigation}) {

const gotoEditAddressSection = (address) => {
  navigation && navigation.navigate('EditAddress', { address });
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
  const isFocused = useIsFocused();

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
    if (isFocused) {
      fetchAddresses();
    }
  }, [userId, isFocused]);

  // Handlers (conéctalos a navegación o modales)
  const onEditContact = () => {};
  const onResetPassword = () => {};
  const onAddAddress = () => {
    // Navega a EditAddress, para crear uno nuevo
    navigation && navigation.navigate('EditAddress');
  };
  const onEditAddress = (addr) => {};
const onSetDefault = async (addr) => {
  if (!addr?.address_id) return;
  try {
      // Construye el payload completo de la dirección
      const payload = {
        street_address: addr.street_address,
        city: addr.city,
        state: addr.state,
        postal_code: addr.postal_code,
        country: addr.country,
        address_type: addr.address_type,
        is_default: true
      };
    const result = await ApiService.addresses.update(addr.address_id, payload);
    console.log('Set default response:', result);
    await sleep(500);
    if (result.success) {
      const updated = await ApiService.addresses.getByUser(userId);
      setAddresses(updated.success ? updated.data : []);
    } else {
      console.log('Error setting default address:', result.message || result);
    }
  } catch (err) {
    console.log('Default address error:', err);
  }
  // setLoading(false);
};


  const goBack = () => {
    navigation && navigation.goBack();
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const onDeleteAddress = async (addr) => {
    if (!addr?.address_id) return;
    try {
      setLoading(true);
      const result = await ApiService.addresses.delete(addr.address_id);
      await sleep(500);
      if (result.success) {
        // Refresca la lista de direcciones
        const updated = await ApiService.addresses.getByUser(userId);
        setAddresses(updated.success ? updated.data : []);
      } else {
        // Maneja error si lo deseas
        console.log('Error deleting address:', result.message || result);
      }
    } catch (err) {
      console.log('Delete address error:', err);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Static Header con arrow back alineado a la izquierda */}
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
                  <TouchableOpacity style={styles.iconBtn} onPress={() => gotoEditAddressSection(addr)}>
                    <Text>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.trashBtn} onPress={() => onDeleteAddress(addr)}>
                    <Ionicons name="trash" size={20} color={Colors.darkText } />
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
    backgroundColor: Colors.whiteBackground,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
    zIndex: 10,
  },
  staticHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.mainColor,
    letterSpacing: 0.5,
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
  trashBtn: {
    padding: 6,
    marginLeft: 4,
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
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    top: 18,
    padding: 4,
    zIndex: 20,
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
});
