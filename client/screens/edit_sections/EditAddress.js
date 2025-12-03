import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useAuth } from '@clerk/clerk-expo';
import ApiService, { setGlobalAuthToken } from '../../services/api';
import Colors from "../../colors";

/* ------------------------------ MAIN SCREEN ------------------------------ */

export default function EditAddressSection({ navigation, route }) {
  const { getToken } = useAuth();
  const editing = Boolean(route?.params?.address);
  const original = route?.params?.address ?? {};

  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    country: original.country || '',
    street_address: original.street_address || '',
    city: original.city || '',
    state: original.state || '',
    postal_code: original.postal_code || '',
    is_default: Boolean(original.is_default) || false,
    phone: original.phone || '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  /* ------------------------------ LOAD USER ------------------------------ */

  useEffect(() => {
    const fetchUserAndAddress = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert('Error', 'Not authenticated');
          navigation?.goBack();
          return;
        }

        setGlobalAuthToken(token);
        const user = await ApiService.users.getCurrentUser();

        if (!user?.user_id) {
          Alert.alert('Error', 'User not authenticated');
          navigation?.goBack();
          return;
        }

        setCurrentUser(user);

        // If creating (not editing) and the user has no addresses yet,
        // make the new address default by pre-filling the form flag.
        if (!editing && user && user.user_id) {
          try {
            const addrList = await ApiService.addresses.getByUser(user.user_id);
            const hasAddresses = addrList && addrList.success && Array.isArray(addrList.data) && addrList.data.length > 0;
            if (!hasAddresses) {
              setForm(prev => ({ ...prev, is_default: true }));
            }
          } catch (err) {
            console.error('Error checking existing addresses for default behaviour:', err);
          }
        }

        // If editing, fetch the address details
        if (editing && original.address_id) {
          const result = await ApiService.addresses.getByUser(user.user_id);
          const found = result.success
            ? result.data.find(a => a.address_id === original.address_id)
            : null;

          if (found) {
            setForm({
              country: found.country || '',
              street_address: found.street_address || '',
              city: found.city || '',
              state: found.state || '',
              postal_code: found.postal_code || '',
              is_default: Boolean(found.is_default),
              phone: found.phone || '',
            });
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load user info');
      }
      setLoading(false);
    };

    fetchUserAndAddress();
  }, []);

  /* ------------------------------ VALIDATION ------------------------------ */

  const onChange = (k, v) => {
    // If changing country, reset the state to empty
    if (k === 'country') {
      setForm(prev => ({ ...prev, [k]: v, state: '' }));
    } else {
      setForm(prev => ({ ...prev, [k]: v }));
    }
  };

  const validate = () => {
    const required = ['street_address', 'city', 'state', 'postal_code', 'country'];
    for (const k of required) {
      if (!String(form[k]).trim()) {
        Alert.alert('Missing info', `Please fill the ${k.replace('_', ' ')}`);
        return false;
      }
    }

    if (form.country === 'United States' && !/^\d{5}$/.test(form.postal_code)) {
      Alert.alert('Check ZIP code', 'Use a 5-digit ZIP code.');
      return false;
    }

    return true;
  };

  /* ------------------------------ SAVE ------------------------------ */

  const handleSave = async () => {
    if (!validate() || !currentUser?.user_id) return;

    try {
      setSaving(true);

      const payload = {
        country: form.country,
        street_address: form.street_address.trim(),
        city: form.city.trim(),
        state: form.state,
        postal_code: form.postal_code.trim(),
        is_default: !!form.is_default,
        phone: form.phone?.trim() || null,
      };

      let result;

      if (editing) {
        result = await ApiService.addresses.update(original.address_id, payload);
      } else {
        result = await ApiService.addresses.create(currentUser.user_id, payload);
      }

      // If this address should be the default, use the dedicated endpoint AFTER save
      try {
        const savedId = editing
          ? (result?.data?.address_id || original.address_id || result?.address_id)
          : (result?.data?.address_id || result?.address_id);
        if (payload.is_default && savedId) {
          await ApiService.addresses.setDefault(savedId);
        }
      } catch (e) {
        console.error('Failed to set address as default after save:', e);
      }

      if (result?.success) {
        Alert.alert('Success', editing ? 'Address updated.' : 'Address added.');
        // Let previous screen refresh
        navigation?.goBack();
      } else {
        throw new Error(result?.message || result?.error || 'Failed to save address.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Unable to save address.');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={26} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editing ? 'Edit Address' : 'Add Address'}
            </Text>
            <View style={{ width: 26 }} />
          </View>

          {/* SINGLE SHOPIFY CARD */}
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={styles.card}>

              {/* CONTACT */}
              <SectionTitle title="Contact Information" />

              <FormInput
                label="Phone"
                value={form.phone}
                keyboardType="phone-pad"
                placeholder="+1 787 518 2440"
                onChangeText={t => onChange('phone', t.replace(/[^0-9+ ()\-]/g, ''))}
              />

              <Divider />

              {/* ADDRESS SECTION */}
              <SectionTitle title="Address Details" />

              <FormInput
                label="Street Address"
                value={form.street_address}
                placeholder="Street Address"
                onChangeText={t => onChange('street_address', t)}
              />

              <FormPicker
                label="Country"
                value={form.country}
                placeholder="Select country"
                onPress={() => setShowCountryPicker(true)}
              />

              <FormInput
                label="City"
                value={form.city}
                placeholder="City"
                onChangeText={t => onChange('city', t)}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormPicker
                    label="State"
                    value={form.state}
                    placeholder="State"
                    onPress={() => {
                      if (!form.country) {
                        Alert.alert('Select Country First', 'Please select a country before choosing a state.');
                      } else {
                        setShowStatePicker(true);
                      }
                    }}
                  />
                </View>

                <View style={{ width: 14 }} />

                <View style={{ flex: 1 }}>
                  <FormInput
                    label="ZIP"
                    value={form.postal_code}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholder="02121"
                    onChangeText={t => onChange('postal_code', t.replace(/\D/g, ''))}
                  />
                </View>
              </View>

              <Divider />

              {/* DEFAULT CHECKBOX */}
              <TouchableOpacity
                style={styles.defaultRow}
                onPress={() => onChange('is_default', !form.is_default)}
              >
                <View style={[styles.checkbox, form.is_default && styles.checkboxActive]}>
                  {form.is_default && <Ionicons name="checkmark" size={16} color="#000" />}
                </View>
                <Text style={styles.defaultText}>Set as default</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>

          {/* COUNTRY PICKER */}
          <PickerModal
            visible={showCountryPicker}
            title="Select country"
            data={COUNTRIES}
            selected={form.country}
            onClose={() => setShowCountryPicker(false)}
            onSelect={v => {
              onChange('country', v);
              setShowCountryPicker(false);
            }}
          />

          {/* STATE PICKER */}
          <PickerModal
            visible={showStatePicker}
            title="Select state"
            data={getStatesForCountry(form.country)}
            selected={form.state}
            onClose={() => setShowStatePicker(false)}
            onSelect={v => {
              onChange('state', v);
              setShowStatePicker(false);
            }}
          />

        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/* ------------------------------ COMPONENTS ------------------------------ */

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function FormInput({ label, ...props }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#8E8E8E"
      />
    </View>
  );
}

function FormPicker({ label, value, placeholder, onPress }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.input}>
        <View style={styles.pickerRow}>
          <Text style={[styles.pickerText, !value && { color: '#8E8E8E' }]}>
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9E9E9E" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function PickerModal({ visible, onClose, data, selected, onSelect, title }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 360 }}>
            {data.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                {selected === item && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------ CONSTANTS ------------------------------ */

const COUNTRIES = ['United States', 'Puerto Rico', 'Canada'];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois',
  'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts',
  'Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota',
  'Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington',
  'West Virginia','Wisconsin','Wyoming'
];

const PUERTO_RICO_STATES = ['Puerto Rico'];

const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

// Helper function to get states based on country
const getStatesForCountry = (country) => {
  switch (country) {
    case 'United States':
      return US_STATES;
    case 'Puerto Rico':
      return PUERTO_RICO_STATES;
    case 'Canada':
      return CANADA_PROVINCES;
    default:
      return [];
  }
};

/* ------------------------------ STYLES ------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },

  /* SHOPIFY CARD */
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 22,
    borderRadius: 16,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20,
  },

  /* INPUTS */
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#3A3A3A",
  },

  input: {
    height: 48,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111",
    justifyContent: "center",
  },

  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 16,
    color: "#111",
  },

  row: {
    flexDirection: "row",
  },

  /* DEFAULT CHECKBOX */
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CFCFCF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    borderColor: "#000",
  },
  defaultText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#111",
  },

  /* SAVE BUTTON */
  saveButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 32,
    height: 56,
    backgroundColor: "#000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },

  /* MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 16,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111",
  },
});

