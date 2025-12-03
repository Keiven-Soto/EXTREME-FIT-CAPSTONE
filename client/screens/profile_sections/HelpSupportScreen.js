// screens/profile_sections/HelpSupportScreen.js
import { useState } from "react";
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

export default function HelpSupportScreen({ navigation }) {
  const goBack = () => navigation.goBack();

  // Hard-coded FAQ
  const faqCategories = {
    "Orders & Shipping": [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 3-5 business days. Express shipping is available and takes 1-2 business days. You will receive tracking information once your order ships.",
      },
      {
        q: "How can I track my order?",
        a: "Once your order ships, you will receive a tracking number via email. You can also track your order in the 'My Orders' section of your account.",
      },
      {
        q: "Can I change my shipping address?",
        a: "If you need to modify your shipping address, please contact us within 1 hour of placing your order. Once an order is processed, we cannot make changes to the address.",
      },
      {
        q: "Do you offer international shipping?",
        a: "Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by location. International orders may be subject to customs fees.",
      },
    ],
    "Returns & Refunds": [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Please visit our Returns Center for more details.",
      },
      {
        q: "How do I start a return?",
        a: "Log into your account, go to 'My Orders', select the order you want to return, and click 'Start Return'. Follow the instructions to print your prepaid return label.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5-7 business days after we receive your return. The refund will be issued to your original payment method.",
      },
      {
        q: "Can I exchange an item?",
        a: "We currently don't offer direct exchanges. Please return your item for a refund and place a new order for the item you want.",
      },
    ],
    "Account Settings": [
      {
        q: "How do I create an account?",
        a: "Click on the profile icon in the bottom navigation, then select 'Sign Up'. Enter your email, create a password, and verify your email address.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "On the login screen, click 'Forgot Password'. Enter your email address and we'll send you a link to reset your password.",
      },
      {
        q: "How do I delete an address?",
        a: "In Edit Profile, under Addresses, tap the trash icon next to the address you want to delete.",
      },
      {
        q: "How do I update my account information?",
        a: "Go to Edit Profile to update your name, email, or addresses as needed.",
      },
    ],
    "Payment & Security": [
      {
        q: "What payment methods do you accept?",
        a: "We accept Visa, MasterCard, American Express, Discover, PayPal, and Apple Pay.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, we use industry-standard encryption to protect your payment information. We do not store your credit card details on our servers.",
      },
      {
        q: "How do I apply a promo code?",
        a: "You can enter your promo code at checkout in the 'Promo Code' field. The discount will be applied to your order total.",
      },
      {
        q: "Why was my payment declined?",
        a: "Payments can be declined for various reasons including insufficient funds, incorrect billing information, or bank restrictions. Please contact your bank for more details.",
      },
    ],
  };

  // Flatten the FAQ list
  const faqList = Object.values(faqCategories || {}).flat();

  // State to track expanded categories
  const [expandedCategory, setExpandedCategory] = useState(null);
  const toggleCategory = (category) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  // State for expanded questions within categories
  const [expandedQuestion, setExpandedQuestion] = useState(
    Object.keys(faqCategories).reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {})
  );
  const toggleQuestion = (category, q) => {
    setExpandedQuestion((prev) => ({
      ...prev,
      [category]: prev[category] === q ? null : q,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 26 }} />
        <CornerLogo/>
      </View>

      <ScrollView>
        {/* Section Title */}
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

        {/* Category Card */}
        {Object.entries(faqCategories).map(([category, faqs]) => {
          const isOpen = expandedCategory === category;
          return (
            <View key={category} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryTitleRow}
                onPress={() => toggleCategory(category)}
              >
                <Text style={styles.categoryTitle}>{category}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                  size={20}
                  color={Colors.mutedText}
                />
              </TouchableOpacity>

              {/* Question Card */}
              {isOpen &&
                faqs.map((cat, qIndex) => {
                  const isExpanded = expandedQuestion[category] === qIndex;
                  return (
                    <View key={qIndex} style={styles.questionCard}>
                      <TouchableOpacity
                        style={styles.questionRow}
                        onPress={() => toggleQuestion(category, qIndex)}
                      >
                        <Text style={styles.question}>{cat.q}</Text>
                        <Ionicons
                          name={
                            isExpanded
                              ? "chevron-up-outline"
                              : "chevron-down-outline"
                          }
                          size={20}
                          color={Colors.mutedText}
                        />
                      </TouchableOpacity>
                      {isExpanded && <Text style={styles.answer}>{cat.a}</Text>}
                    </View>
                  );
                })}
            </View>
          );
        })}
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
  faqTitle: {
    padding: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 5,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 20,
  },
  categoryTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTitle: {
    padding: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.darkText,
  },
  questionCard: {
    padding: 16,
    marginLeft: 16,
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
    marginRight: 20,
  },
  answer: { fontSize: 14, color: "#555555", lineHeight: 20, marginTop: 8 },
});
