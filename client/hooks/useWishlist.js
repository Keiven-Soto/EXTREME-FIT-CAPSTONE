import { useEffect, useState } from "react";
import { Alert } from "react-native";
import emitter, { WISHLIST_UPDATED } from "../utils/events";
import ApiService from "../services/api";
import { useCurrentUser } from "./useAuthenticatedApi";

export function useWishlist() {
  const { getCurrentUser } = useCurrentUser();
  const [wishlist, setWishlist] = useState([]);
  const [userId, setUserId] = useState(null);

  // Load user ID
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user?.user_id) setUserId(user.user_id);
    };
    loadUser();
  }, []);

  // Load wishlist
  const loadWishlist = async () => {
    if (!userId) return;
    const res = await ApiService.wishlist.get(userId);
    const ids = res?.data?.map((item) => item.product_id) || [];
    setWishlist(ids);
  };

  // Listen to global update events
  useEffect(() => {
    if (!userId) return;

    // load initially
    loadWishlist();

    const listener = () => loadWishlist();
    emitter.on(WISHLIST_UPDATED, listener);

    return () => emitter.off(WISHLIST_UPDATED, listener);
  }, [userId]);

  // Add item to wishlist
  const add = async (product) => {
    try {
      const wishRes = await ApiService.wishlist.add(userId, product.product_id);

      if (wishRes.success) {
        Alert.alert("Added to Wishlist", `${product.name}`, [{ text: "OK" }]);
        emitter.emit(WISHLIST_UPDATED);
        console.log("[useWishlist] Successfully added to wishlist.");
      } else {
        Alert.alert("Error", wishRes.error || "Could not add to wishlist");
        console.log("[useWishlist] Failed to add to wishlist.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server");
      console.log("[useWishlist] Error connecting to server for wishlist add.");
    }
  };

  // Remove item from wishlist
  const remove = async (product) => {
    try {
      Alert.alert(
        `Remove from Wishlist?`,
        `Are you sure you want to remove "${product.name} from your wishlist?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              const wishRes = await ApiService.wishlist.remove(
                userId,
                product.product_id
              );
              if (wishRes.success) {
                emitter.emit(WISHLIST_UPDATED);
                console.log(
                  "[useWishlist] Successfully removed from wishlist."
                );
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server");
      console.log(
        "[useWishlist] Error connecting to server for wishlist removal."
      );
    }
  };

  return { wishlist, add, remove, userId };
}
