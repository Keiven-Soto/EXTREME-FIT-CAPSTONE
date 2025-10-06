import { useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import ApiService from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [genders, setGenders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    loadGenders();
  }, []);

  useEffect(() => {
    if (selected) loadCategories(selected);
  }, [selected]);

  const loadGenders = async () => {
    try {
      setLoading(true);
      const result = await ApiService.products.getGenders();

      if (result.success) {
        // // Normalize the capitalization of the gender strings
        // const normalizedGenders = result.data.map((item) => ({
        //   ...item,
        //   gender: item.gender
        //     ? item.gender.charAt(0).toUpperCase() +
        //       item.gender.slice(1).toLowerCase()
        //     : item.gender, // Handle null or undefined gender
        // }));

        setGenders(result.data);

        setSelected(genders.length > 0 ? genders[0].gender : "unisex");

      } else {
        Alert.alert("Error", "Failed to load genders");
      }
    } catch (error) {
      console.error("Error loading genders:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (gender) => {
    try {
      setLoading(true);
      const result = await ApiService.categories.getByGender(
        gender.toLowerCase()
      );

      if (result.success) {
        setCategories(result.data);
      } else {
        Alert.alert("Error", "Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      {/* Logo */}
      <Image
        source={require("../assets/Extreme_fit_new_logo-10.png")}
        style={{
          width: 200,
          height: 200,
          alignSelf: "center",
          marginBottom: -40,
          marginTop: -20,
        }}
        resizeMode="contain"
      />

      {/* Genders */}
      <View style={styles.gendersContainer}>
        <FlatList
          data={genders}
          keyExtractor={(item) => item.gender}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={<Text>No options available</Text>}
          renderItem={({ item }) => {
            const isActive = selected === item.gender;
            return (
              <Pressable
                onPress={() => setSelected(item.gender)}
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
                  {item.gender}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Categories Grid */}
      <View>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.category_id}
          numColumns={2}
          ListEmptyComponent={<Text>No categories available</Text>}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() =>
                navigation.navigate("CategoryProducts", {
                  category_id: item.category_id,
                  category_name: item.name,
                  gender: selected,
                })
              }
            >
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Ionicons name="chevron-forward" style={styles.categoryIcon} />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 16 * 3) / 2;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  gendersContainer: {
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
    textTransform: "capitalize",
  },

  activeCategoryText: {
    color: "#fff",
    fontWeight: "600",
  },

  catalogContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  categoryCard: {
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

  categoryImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },

  categoryContent: {
    width: "100%",
    padding: 8,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  categoryIcon: {
    fontSize: 20,
    color: "#888",
  },
});
