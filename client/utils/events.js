import EventEmitter from "eventemitter3";

// Singleton emitter instance
const emitter = new EventEmitter();

export const WISHLIST_UPDATED = "wishlistUpdated";
export const CART_UPDATED = "cartUpdated";

export default emitter;
