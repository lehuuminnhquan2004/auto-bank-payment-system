import { createContext, useContext } from "react";

import type { Product } from "../types/product";

export type CartItem = Product & {
  quantity: number;
};

export type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalAmount: string;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
