import { useEffect, useState, type ReactNode } from "react";

import type { Product } from "../types/product";
import { CartContext, type CartItem } from "./CartContext";

const CART_STORAGE_KEY = "cartItems";

type CartProviderProps = {
  children: ReactNode;
};

function readStoredCart(): CartItem[] {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);

    return storedCart ? (JSON.parse(storedCart) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addToCart(product: Product) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (!existingItem) {
        return [...currentItems, { ...product, quantity: 1 }];
      }

      if (existingItem.quantity >= 99) {
        return currentItems;
      }

      return currentItems.map((item) =>
        item.id === product.id
          ? {
              ...product,
              quantity: item.quantity + 1,
            }
          : item,
      );
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (!Number.isFinite(quantity)) {
      return;
    }

    const nextQuantity = Math.min(99, Math.trunc(quantity));

    setItems((currentItems) =>
      nextQuantity <= 0
        ? currentItems.filter((item) => item.id !== productId)
        : currentItems.map((item) =>
            item.id === productId ? { ...item, quantity: nextQuantity } : item,
          ),
    );
  }

  function removeFromCart(productId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const totalAmount = items
    .reduce(
      (total, item) => total + BigInt(item.price) * BigInt(item.quantity),
      0n,
    )
    .toString();

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
