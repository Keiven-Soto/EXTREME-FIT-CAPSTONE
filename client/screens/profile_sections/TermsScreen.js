// screens/profile_sections/TermsScreen.js
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../colors";
import CornerLogo from "../../components/CornerLogo";

export default function TermsScreen({ navigation }) {
  const goBack = () => navigation.goBack();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <CornerLogo />
      </View>

      {/* Scrollable Terms Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Welcome to Extreme Fit</Text>

        <Text style={styles.paragraph}>
          These Terms and Conditions ("Terms") govern your use of the [Your App
          Name] mobile application (the "App"), operated by [Your Company Name]
          ("we", "our", or "us"). By accessing or using the App, you agree to be
          bound by these Terms. If you do not agree, please discontinue use of
          the App immediately.
        </Text>

        <Text style={styles.sectionTitle}>1. Use of the App</Text>
        <Text style={styles.paragraph}>
          You agree to use the App only for lawful purposes and in accordance
          with these Terms. You must not misuse the App by introducing viruses,
          attempting unauthorized access, or engaging in activities that could
          harm our systems or other users.
        </Text>

        <Text style={styles.sectionTitle}>2. Account Responsibilities</Text>
        <Text style={styles.paragraph}>
          When you create an account, you must provide accurate information and
          keep your login credentials secure. You are responsible for all
          activity that occurs under your account.
        </Text>

        <Text style={styles.sectionTitle}>3. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, features, and functionality in the App—including but not
          limited to text, images, graphics, logos, and code—are owned by [Your
          Company Name] and protected by intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          We are not liable for any damages arising from your use or inability
          to use the App, including but not limited to indirect, incidental, or
          consequential damages.
        </Text>

        <Text style={styles.sectionTitle}>5. Changes to These Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms periodically. Continued use of the App after
          changes are posted means you accept those updates.
        </Text>

        <Text style={styles.sectionTitle}>6. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at:
          {"\n"}Email: support@[yourcompany].com
        </Text>

        <Text style={styles.footer}>Last updated: October 2025</Text>
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
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 12,
    color: "#111111",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    color: "#111111",
  },
  paragraph: { fontSize: 15, lineHeight: 22, color: "#555555" },
  footer: {
    fontSize: 13,
    marginTop: 30,
    color: "#555555",
    textAlign: "center",
  },
});
