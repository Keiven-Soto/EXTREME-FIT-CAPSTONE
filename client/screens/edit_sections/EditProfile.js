import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import ApiService, { setGlobalAuthToken } from "../../services/api";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../colors";
import CornerLogo from "../../components/CornerLogo";

export default function EditProfileSection({ navigation }) {
  const { getToken, isSignedIn } = useAuth();
  const isFocused = useIsFocused();
  const { user: clerkUser } = useUser();

  const [currentUser, setCurrentUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    const fetchUserAndAddresses = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        setGlobalAuthToken(token);

        const user = await ApiService.users.getCurrentUser();
        if (!user || !user.user_id) return;

        setCurrentUser(user);

        const result = await ApiService.addresses.getByUser(user.user_id);
        if (result.success) setAddresses(result.data);
        else setAddresses([]);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    };
    if (isFocused) fetchUserAndAddresses();
  }, [isFocused]);

  const goBack = () => navigation && navigation.goBack();

  const openEditModal = () => {
    if (!currentUser) return;
    setEditFirstName(currentUser.first_name || "");
    setEditLastName(currentUser.last_name || "");
    setModalVisible(true);
  };

  const saveName = async () => {
    if (!currentUser?.user_id) return;
    setSavingContact(true);

    try {
      if (clerkUser && typeof clerkUser.update === "function") {
        try {
          await clerkUser.update({
            firstName: editFirstName,
            lastName: editLastName,
          });
        } catch {
          Alert.alert(
            "Warning",
            "Clerk failed to sync name, but changes will save locally."
          );
        }
      }

      const payload = { first_name: editFirstName, last_name: editLastName };
      const result = await ApiService.users.update(
        currentUser.user_id,
        payload
      );

      let updatedUser = null;
      if (result?.success && result.data) updatedUser = result.data;
      else if (result.user_id) updatedUser = result;
      else updatedUser = await ApiService.users.getCurrentUser();

      if (updatedUser) setCurrentUser(updatedUser);
      setModalVisible(false);
    } catch (error) {
      console.error(error);
    }

    setSavingContact(false);
  };

  const gotoEditAddressSection = (address) => {
    navigation && navigation.navigate("EditAddress", { address });
  };

  const onSetDefault = async (addr) => {
    if (!addr?.address_id || !currentUser?.user_id) return;
    try {
      // Use a dedicated endpoint that sets this address as default without requiring full payload
      const result = await ApiService.addresses.setDefault(addr.address_id);
      console.log("Set default response:", result);
      await sleep(500);
      if (result.success) {
        const updated = await ApiService.addresses.getByUser(
          currentUser.user_id
        );
        setAddresses(updated.success ? updated.data : []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onResetPassword = () => navigation.navigate("ChangePassword");
  const onAddAddress = () => navigation.navigate("EditAddress");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <CornerLogo />
      </View>

      {/* BODY */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* CONTACT DETAILS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <View style={styles.rowBetween}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your Name</Text>
              <Text style={styles.value}>
                {currentUser
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : "Loading..."}
              </Text>
            </View>

            <TouchableOpacity onPress={openEditModal}>
              <Ionicons name="pencil" size={20} color={Colors.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={[styles.rowBetween, styles.divider]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>{currentUser?.email}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.linkRow} onPress={onResetPassword}>
            <Text style={styles.linkText}>Change password</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.mutedText}
            />
          </TouchableOpacity>
        </View>

        {/* ADDRESSES CARD */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Addresses</Text>
            <TouchableOpacity onPress={onAddAddress}>
              <Text style={styles.addNew}>Add new</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : addresses.length === 0 ? (
            <Text style={styles.noAddress}>No addresses found.</Text>
          ) : (
            addresses.map((addr) => (
              <View key={addr.address_id} style={styles.addressCard}>
                {/* HEADER ROW */}
                <View style={styles.addressHeaderRow}>
                  <Text style={styles.addressName}>Address</Text>
                  {addr.is_default && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}
                </View>

                {/* ADDRESS DETAILS */}
                <Text style={styles.addressLine}>{addr.street_address}</Text>
                <Text style={styles.addressLine}>
                  {addr.city}, {addr.state} {addr.postal_code}
                </Text>
                <Text style={styles.addressLine}>{addr.country}</Text>
                {addr.phone && (
                  <Text style={styles.addressLine}>{addr.phone}</Text>
                )}

                {/* ACTION ROW */}
                <View style={styles.addressActions}>
                  <TouchableOpacity
                    onPress={() => gotoEditAddressSection(addr)}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>

                  {!addr.is_default && (
                    <TouchableOpacity onPress={() => onSetDefault(addr)}>
                      <Text style={styles.setDefault}>Set as default</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* EDIT NAME MODAL (SHOPIFY STYLE) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Name</Text>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalLabel}>First Name</Text>
                <TextInput
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  style={styles.modalInput}
                  placeholder="First name"
                  placeholderTextColor="#999"
                />

                <Text style={[styles.modalLabel, { marginTop: 16 }]}>
                  Last Name
                </Text>
                <TextInput
                  value={editLastName}
                  onChangeText={setEditLastName}
                  style={styles.modalInput}
                  placeholder="Last name"
                  placeholderTextColor="#999"
                />
              </View>

              {/* SAVE BUTTON */}
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingContact && { opacity: 0.7 }]}
                onPress={saveName}
                disabled={savingContact}
              >
                {savingContact ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              {/* CANCEL BUTTON */}
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------------ STYLES ------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  /* CARD STYLE */
  card: {
    backgroundColor: "#FFF",
    margin: 20,
    padding: 22,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111",
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    marginVertical: 20,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  linkText: { fontSize: 15, color: "#111" },

  /* ADDRESSES */
  addNew: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.mainColor,
  },
  noAddress: {
    marginTop: 8,
    color: "#666",
  },
  addressCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginTop: 16,
  },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    justifyContent: "space-between",
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  defaultBadge: {
    backgroundColor: "#EEE",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: "#666",
  },
  addressLine: {
    fontSize: 14,
    color: "#444",
    marginTop: 2,
  },
  addressActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  editText: {
    fontSize: 14,
    color: Colors.mainColor,
    fontWeight: "600",
  },
  setDefault: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: "#111",
  },
  modalSaveBtn: {
    backgroundColor: "#000",
    borderRadius: 24,
    paddingVertical: 14,
    marginTop: 28,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  modalCancelBtn: {
    marginTop: 14,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#666",
    fontSize: 16,
  },

  /* FOOTER */
  footer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#777",
  },
});
