import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../colors";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import ApiService from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCloudinaryImageUrl } from "../utils/cloudinary";
import Carousel, { Pagination } from "react-native-x-carousel";

// dynamic adjustment to device screen width
const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [genders, setGenders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  const BANNERS = [
    {
      id: 1,
      cloudinary_public_id: "banner1",
      title: "Summer Sale",
      subtitle: "Up to 50% Off!",
      description: "Get Ready for Your Fitness Journey",
    },
    {
      id: 2,
      cloudinary_public_id: "banner2",
      title: "New Arrivals",
      subtitle: "Latest Fitness Apparel",
      description: "Upgrade Your Workout Wardrobe",
    },
    {
      id: 3,
      cloudinary_public_id: "banner3",
      title: "Exclusive Deals on Fitness Gear",
      subtitle: "Limited Time Offers",
      description: "Upgrade Your Workout Wardrobe",
    },
  ];

  const DEALS = [
    {
      id: 1,
      name: "Leggings",
      discount: 20,
      price: 30.0,
    },
    {
      id: 2,
      name: "Hoodies",
      discount: 15,
      price: 50.0,
    },
    {
      id: 3,
      name: "Running Shoes",
      discount: 25,
      price: 120.0,
    },
  ];

  useEffect(() => {
    loadGenders();
  }, []);

  useEffect(() => {
    loadCategories(selected);
  }, [selected]);

  const loadGenders = async () => {
    try {
      setLoading(true);
      const result = await ApiService.products.getGenders();

      if (result.success) {
        setGenders(result.data);
        setSelected(result.data.length > 0 ? result.data[0].gender : "unisex");
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

  const renderBanner = (data) => {
    const getImageSource = () => {
      if (data.cloudinary_public_id) {
        const imageUrl = getCloudinaryImageUrl(data.cloudinary_public_id, {
          format: "auto",
        });
        return { uri: imageUrl };
      }
      return null;
    };

    const imageSource = getImageSource();

    return (
      <View id="bannerItem" key={data.id} style={styles.bannerItem}>
        <ImageBackground source={imageSource} style={styles.bannerImage}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{data.title}</Text>
            <Text style={styles.bannerSubtitle}>{data.subtitle}</Text>
            <Text style={styles.bannerDesc}>{data.description}</Text>
          </View>
        </ImageBackground>
      </View>
    );
  };

  const renderCategory = (category) => {
    if (!category) {
      return (
        <View key={category.category_id} style={styles.categoryCard}>
          <Text>Loading category data...</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        id="categoryCard"
        key={category.category_id}
        style={styles.categoryCard}
        onPress={() =>
          navigation.navigate("CategoryProducts", {
            category_id: category.category_id,
            category_name: category.name,
            gender: selected,
          })
        }
      >
        {/* Category Name */}
        <View style={styles.categoryTitle}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Ionicons name="chevron-forward" style={styles.categoryIcon} />
        </View>

        {/* Category Count */}
        <View style={styles.categorySubtitle}>
          <Text style={styles.categoryCount}>
            {category.product_count}+ items
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView showVerticalScrollIndicator={true}>
        {/* Logo */}
        <Image
          id="logoImage"
          source={require("../assets/Extreme_fit_new_logo-10.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Genders */}
        <View id="genderBar" style={styles.gendersContainer}>
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
                    styles.gender, // Default style
                    isActive && styles.activeGender, // Active style
                    pressed && styles.pressedGender, // Pressed style
                  ]}
                >
                  <Text
                    style={[
                      styles.genderText,
                      isActive && styles.activeGenderText,
                    ]}
                  >
                    {item.gender}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Promotional Banner */}
        <View id="promotionalBanner" style={styles.bannerContainer}>
          <Carousel
            testID={"carousel"}
            loop={true}
            width={width}
            data={BANNERS}
            autoplay={true}
            autoplayInterval={4000}
            pagination={Pagination}
            renderItem={renderBanner}
          />
        </View>

        {/* Categories Section Title */}
        <View id="categorySectionTitle" style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>

        {/* Categories Grid */}
        <View id="categoryGrid" style={styles.catalogContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.mainColor} />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : categories.length > 0 ? (
            <View style={styles.categoryGrid}>
              {categories.map(renderCategory)}
            </View>
          ) : (
            <Text style={styles.noResults}>No categories found 😢</Text>
          )}
        </View>

        {/* Deals Section Title */}
        <View id="dealSectionTitle" style={styles.section}>
          <Text style={styles.sectionTitle}>Limited Time Deals</Text>
        </View>

        {/* Deals */}
        <View style={styles.dealContainer}>
          <FlatList
            data={DEALS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={<Text>No running deals</Text>}
            renderItem={({ item }) => {
              const isActive = selected === item.gender;
              return (
                <View style={styles.dealCard}>
                  <ImageBackground
                    id="dealImage"
                    source={require("../assets/adaptive-icon.png")}
                    style={styles.dealImage}
                  >
                    <Text id="dealDiscount" style={styles.dealDiscount}>
                      {item.discount}% OFF
                    </Text>
                  </ImageBackground>
                  <View id="dealCaption" style={styles.dealCaption}>
                    <Text style={styles.dealName}>{item.name}</Text>
                    <View
                      id="priceContainer"
                      style={{ flexDirection: "row", gap: 10, paddingTop: 2 }}
                    >
                      <Text style={styles.dealRealPrice}>${item.price}</Text>
                      <Text style={styles.dealPrice}>
                        ${item.price - (item.discount / 100) * item.price}{" "}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 16 * 3) / 2;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  logoImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: -40,
    marginTop: -20,
  },

  gendersContainer: {
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 50,
    padding: 10,
    margin: 18,
  },

  gender: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },

  genderText: {
    fontSize: 16,
    fontWeight: "2000",
    color: Colors.whiteText,
    textTransform: "capitalize",
  },

  activeGender: {
    backgroundColor: Colors.whiteBackground,
  },

  activeGenderText: {
    color: "#000",
    fontWeight: "600",
  },

  pressedGender: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  bannerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 320,
  },

  bannerItem: {
    flex: 1,
    width: width - 40,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderRadius: 12,
  },

  bannerImage: {
    flex: 1,
    width: "100%",
    resizeMode: "contain",
  },

  bannerText: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "left",
    backgroundColor: "#00000082",
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.whiteText,
    paddingBottom: 4,
  },

  bannerSubtitle: {
    fontSize: 19,
    fontWeight: "semi-bold",
    color: Colors.whiteText,
    paddingBottom: 4,
  },

  bannerDesc: {
    fontSize: 16,
    fontWeight: "thin",
    color: Colors.whiteText,
  },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.darkText,
  },

  catalogContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.whiteBackground,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },

  categoryTitle: {
    width: "100%",
    padding: 10,
    paddingBottom: 0,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categorySubtitle: {
    width: "100%",
    padding: 10,
    paddingTop: 5,
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.darkText,
  },

  categoryCount: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.mutedText,
  },

  categoryIcon: {
    fontSize: 20,
    color: "#888",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },

  dealContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  dealCard: {
    width: width - 180,
    backgroundColor: Colors.whiteBackground,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderRadius: 8,
    elevation: 4,
    marginRight: 15,
  },

  dealImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
  },

  dealCaption: {
    width: "100%",
    padding: 10,
    flex: 1,
  },

  dealName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.darkText,
  },

  dealDiscount: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#000",
    borderRadius: 50,
    padding: 10,
    fontWeight: "2000",
    color: Colors.whiteText,
    textTransform: "capitalize",
  },

  dealPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.mutedText,
  },

  dealRealPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "Colors.darkText",
    textDecorationLine: "line-through",
  },

  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.mutedText,
  },

  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: Colors.mutedText,
    fontStyle: "italic",
    paddingVertical: 20,
  },
});