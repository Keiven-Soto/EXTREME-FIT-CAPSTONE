import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Pressable,
  TextInput,
} from "react-native";

// Dynamic adjusment to device screen width
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [selected, setSelected] = useState("1");
  const [searchText, setSearchText] = useState("");

  const handleSearch = () => {
    console.log("Searching:", searchText);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  const categories = [
    { id: "1", name: "Men" },
    { id: "2", name: "Women" },
  ];

  const features = [
    {
      id: "1",
      title: "T-Shirts",
      image: require("../assets/splash-icon.png"),
    },
    {
      id: "2",
      title: "Sweatshirts",
      image: require("../assets/splash-icon.png"),
    },
    {
      id: "3",
      title: "Pants",
      image: require("../assets/splash-icon.png"),
    },
    {
      id: "4",
      title: "Footwear",
      image: require("../assets/splash-icon.png"),
    },
    {
      id: "5",
      title: "Equipment",
      image: require("../assets/splash-icon.png"),
    },
    {
      id: "6",
      title: "Activewear",
      image: require("../assets/splash-icon.png"),
    },
  ];

  function FeatureCard({ title, image, onPress }) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <Image source={image} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Ionicons name="chevron-forward" style={styles.cardIcon} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screenContainer}>

      {/* Logo */}
      <Image
        source={require("../assets/Extreme_fit_new_logo-10.png")}
        style={{
          width: 200,
          height: 200,
          alignSelf: "center",
          marginTop: 20,
          marginBottom: -40,
        }}
        resizeMode="contain"
      />

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = selected === item.id;
            return (
              <Pressable
                onPress={() => setSelected(item.id)}
                style={({ pressed }) => [
                  styles.category, // Default style
                  isActive && styles.activeCategory, // Active style
                  pressed && styles.pressedCategory, // Pressed style
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.activeCategoryText,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.grayIcon}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.grayIcon}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.grayIcon} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={handleSearch}
          >
            <Ionicons name="options" size={20} color={Colors.mainColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature Grid */}
      <FlatList
        data={features}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => (
          <FeatureCard
            title={item.title}
            subtitle={item.subtitle}
            image={item.image}
            onPress={() => {}}
          />
        )}
      />
    </View>
  );
}

const CARD_WIDTH = (width - 16 * 3) / 2;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  categoriesContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  category: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    marginRight: 8,
  },
  activeCategory: {
    backgroundColor: "#000",
  },
  pressedCategory: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
  activeCategoryText: {
    color: "#fff",
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.whiteBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  cardContent: {
    width: "100%",
    padding: 8,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  cardIcon: {
    fontSize: 20,
    color: "#888",
  },
});
