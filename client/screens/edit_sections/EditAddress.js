import React, { useEffect, useMemo, useState } from 'react';
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
import Colors from '../../colors';

/**
 * EditAddressScreen
 *
 * A single-page address editor that mirrors the provided mockup.
 * - Works for both Create and Edit flows.
 * - Prefills from route.params.address when provided.
 * - Validates required fields, ZIP (US 5‑digit), and Phone (US 10‑digit).
 * - Supports a simple State and Country picker (US‑centric by default).
 * - "Set as default" toggle.
 */
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
  });

  const [loading, setLoading] = useState(true); // Loading for fetching user + address
  const [saving, setSaving] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);


  // Get authenticated user and address if editing
  useEffect(() => {
    const fetchUserAndAddress = async () => {
      setLoading(true);
      try {
        // Get JWT token and set it globally
        const token = await getToken();
        if (!token) {
          Alert.alert('Error', 'Not authenticated');
          navigation?.goBack();
          return;
        }
        setGlobalAuthToken(token);

        // Get authenticated user from database
        const user = await ApiService.users.getCurrentUser();

        if (!user || !user.user_id) {
          Alert.alert('Error', 'User not authenticated');
          navigation?.goBack();
          return;
        }

        setCurrentUser(user);

        // If editing, fetch the address details
        if (editing && original.address_id) {
          const result = await ApiService.addresses.getByUser(user.user_id);
          const found = result.success
            ? result.data.find(addr => addr.address_id === original.address_id)
            : null;
          if (found) {
            setForm({
              country: found.country || '',
              street_address: found.street_address || '',
              city: found.city || '',
              state: found.state || '',
              postal_code: found.postal_code || '',
              is_default: Boolean(found.is_default) || false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'Failed to load user information');
      }
      setLoading(false);
    };
    fetchUserAndAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, original.address_id]);


  const onChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Basic validators
  const isValidZip = zip => /^\d{5}$/.test(zip);
  const required = ['street_address', 'city', 'state', 'postal_code', 'country'];

  const validate = () => {
    for (const k of required) {
      if (!String(form[k] || '').trim()) {
        Alert.alert('Missing info', `Please fill the ${labelFor(k)} field.`);
        return false;
      }
    }
    if (form.country === 'United States' && !isValidZip(form.postal_code)) {
      Alert.alert('Check ZIP code', 'Use a 5-digit ZIP code (e.g., 02121).');
      return false;
    }
    return true;
  };

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
      };

      console.log('Address payload to send:', payload);

      let result;
      if (editing) {
        // update
        result = await ApiService.addresses.update(original.address_id, payload);
        console.log('PUT response:', result);
      } else {
        // create
        result = await ApiService.addresses.create(currentUser.user_id, payload);
        console.log('POST response:', result);
      }

      if (result?.success) {
        Alert.alert('Done', editing ? 'Address updated.' : 'Address added.');
        // Let previous screen refresh
        navigation?.goBack();
      } else {
        throw new Error(result?.message || result?.error || 'Failed to save address.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Something went wrong.');
      console.log('Address save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={64}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editing ? 'Edit Address' : 'Add Address'}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36 }}
        >
          {/* Address */}
          <FieldLabel>Address</FieldLabel>
          <Input
            value={form.street_address}
            onChangeText={t => onChange('street_address', t)}
            placeholder="Street Address"
          />
          <FieldLabel>Country/Region</FieldLabel>
          <PickerField
            value={form.country}
            placeholder="Select country"
            onPress={() => setShowCountryPicker(true)}
          />

          {/* City */}
          <FieldLabel>City</FieldLabel>
          <Input value={form.city} onChangeText={t => onChange('city', t)} placeholder="City" />

          {/* State + Zip */}
          <Row>
            <Col>
              <FieldLabel>State</FieldLabel>
              <PickerField
                value={form.state || 'Select'}
                placeholder="Select"
                onPress={() => setShowStatePicker(true)}
              />
            </Col>
            <Col>
              <FieldLabel>Zip code</FieldLabel>
              <Input
                keyboardType="number-pad"
                value={form.postal_code}
                onChangeText={t => onChange('postal_code', t.replace(/\D+/g, '').slice(0, 5))}
                placeholder="02121"
                maxLength={5}
              />
            </Col>
          </Row>

          {/* Set default */}
          <TouchableOpacity
            style={styles.defaultRow}
            onPress={() => onChange('is_default', !form.is_default)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, form.is_default && styles.checkboxChecked]}>
              {form.is_default ? (
                <Ionicons name="checkmark" size={16} color="#000" />
              ) : null}
            </View>
            <Text style={styles.defaultText}>Set as default</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Country Picker */}
      <PickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        data={COUNTRIES}
        selected={form.country}
        onSelect={(val) => {
          onChange('country', val);
          setShowCountryPicker(false);
        }}
        title="Select country"
      />

      {/* State Picker */}
      <PickerModal
        visible={showStatePicker}
        onClose={() => setShowStatePicker(false)}
        data={US_STATES}
        selected={form.state}
        onSelect={(val) => {
          onChange('state', val);
          setShowStatePicker(false);
        }}
        title="Select state"
      />
    </SafeAreaView>
  );
}

/* ---------------------------- helpers & UI ---------------------------- */

function labelFor(key) {
  const map = {
    street_address: 'Address',
    city: 'City',
    state: 'State',
    postal_code: 'Zip code',
    country: 'Country',
  };
  return map[key] || key;
}

function FieldLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input(props) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor={Colors.placeholderText || '#9AA0A6'}
    />
  );
}

function PickerField({ value, placeholder, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.pickerField} activeOpacity={0.8}>
      <Text style={[styles.pickerText, !value && { color: Colors.placeholderText }]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={Colors.mutedText} />
    </TouchableOpacity>
  );
}

function Row({ children }) {
  return <View style={styles.row}>{children}</View>;
}

function Col({ children }) {
  return <View style={styles.col}>{children}</View>;
}

function PickerModal({ visible, onClose, data, selected, onSelect, title }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={Colors.darkText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 340 }}>
            {data.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                {selected === item ? (
                  <Ionicons name="checkmark" size={18} color={Colors.mainColor} />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------- data ------------------------------- */

const COUNTRIES = ['United States', 'Puerto Rico', 'Canada']; // extend if needed

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania', 'Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

/* ------------------------------ styles ------------------------------ */

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkText,
  },

  label: {
    fontSize: 13,
    color: Colors.mutedText,
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  input: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    backgroundColor: Colors.whiteBackground,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.darkText,
  },
  pickerField: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    backgroundColor: Colors.whiteBackground,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.darkText,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  col: {
    flex: 1,
  },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteBackground,
  },
  checkboxChecked: {
    backgroundColor: '#fff',
    borderColor: Colors.darkText,
  },
  defaultText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.darkText,
  },

  saveBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    height: 54,
    backgroundColor: Colors.darkText, // visually closer to mockup's solid black button
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.grayBorder,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.darkText,
  },
});
