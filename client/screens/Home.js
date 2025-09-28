import React, { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Pressable,
  TextInput,
} from "react-native";
import { ActivityIndicator } from "react-native";
import { API_BASE_URL } from "../services/api";

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("1");
  const [searchText, setSearchText] = useState("");

  const handleSearch = () => {
    console.log("Searching:", searchText);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  useEffect(() => {
    let ignore = false;
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
      return () => { ignore = true; };
  }, []);

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.screenContainer}>
      {/* Logo */}
      <Image
        source={require("../assets/Extreme_fit_new_logo-10.png")}
        style={{
          width: 200,
          height: 200,
          alignSelf: "center",
          marginBottom: -40,
        }}
        resizeMode="contain"
      />

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.category_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={<Text>No categories available</Text>}
          renderItem={({ item }) => {
            const isActive = selected === item.category_id;
            return (
              <Pressable
                onPress={() => setSelected(item.category_id)}
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

      {/* Feature Grid
      <FlatList
        data={categories.find((c) => c.id === selected)?.features || []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.featureCard}>
            <Image source={item.image} style={styles.featureImage} />
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>{item.name}</Text>
              <Ionicons name="chevron-forward" style={styles.featureIcon} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      /> */}
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

  catalogContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  featureCard: {
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

  featureImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },

  featureContent: {
    width: "100%",
    padding: 8,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  featureName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  featureIcon: {
    fontSize: 20,
    color: "#888",
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
});
