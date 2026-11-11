import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { getCartItems } from "./cartApi.js";

const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user } = useAuth();
  const identity = user?.email;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const sequence = useRef(0);
  const [state, setState] = useState({
    items: [],
    status: "loading",
    error: "",
  });
  const reload = useCallback(async () => {
    const ticket = ++sequence.current;
    if (!identity) {
      setState({ items: [], status: "success", error: "" });
      return;
    }
    setState((previous) => ({ ...previous, status: "loading", error: "" }));
    try {
      const items = await getCartItems();
      if (ticket === sequence.current && currentIdentity.current === identity)
        setState({ items, status: "success", error: "" });
    } catch (error) {
      if (ticket === sequence.current && currentIdentity.current === identity)
        setState({ items: [], status: "error", error: error.message });
    }
  }, [identity]);
  useEffect(() => {
    reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  return (
    <CartContext.Provider
      value={{
        ...state,
        reload,
        count: state.items.reduce((total, item) => total + item.quantity, 0),
        total: state.items.reduce(
          (total, item) => total + Number(item.subtotal),
          0,
        ),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
