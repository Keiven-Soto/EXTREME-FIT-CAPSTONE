// screens/profile_sections/HelpSupportScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../colors';
import CornerLogo from '../../components/CornerLogo';

export default function HelpSupportScreen({ navigation }) {
  const goBack = () => navigation.goBack();

  // Hard-coded FAQ
  const faqList = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to Edit Profile and select "Reset your password". Follow the instructions to reset it.',
    },
    {
      question: 'How do I update my profile?',
      answer: 'Go to Edit Profile and update your name, email, or addresses as needed.',
    },
    {
      question: 'How do I delete an address?',
      answer: 'In Edit Profile, under Addresses, tap the trash icon next to the address you want to delete.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can email us at support@example.com',
    },
  ];

  // State to track which FAQ is expanded
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    if (expandedIndex === index) {
      setExpandedIndex(null); // collapse if same
    } else {
      setExpandedIndex(index); // expand this one
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <CornerLogo></CornerLogo>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Frequently Asked Questions</Text>

        {faqList.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={index} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.questionRow}
                onPress={() => toggleExpand(index)}
              >
                <Text style={styles.question}>{item.question}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={20}
                  color={Colors.mutedText}
                />
              </TouchableOpacity>
              {isExpanded && <Text style={styles.answer}>{item.answer}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111111' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#111111' },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: { fontSize: 16, fontWeight: '600', color: '#111111', marginBottom: 8 },
  answer: { fontSize: 14, color: '#555555', lineHeight: 20, marginTop: 8 },
});
