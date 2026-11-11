import { list, post, patch, remove } from "../../api/client.js";

export const getCartItems = (signal) => list("cart/items/", signal);
export const addCartItem = (variant, quantity) =>
  post("cart/items/", { variant, quantity });
export const updateCartItem = (id, quantity) =>
  patch(`cart/items/${id}/`, { quantity });
export const deleteCartItem = (id) => remove(`cart/items/${id}/`);
