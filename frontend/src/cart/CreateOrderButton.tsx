import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../api/error";
import type {
  CreateOrderItem,
  CreateOrderRequest,
  Order,
} from "../types/order";
import { useCart } from "./CartContext";

const CHECKOUT_ATTEMPT_KEY = "checkoutAttempt";

type CheckoutAttempt = {
  signature: string;
  checkoutKey: string;
};

function createCartSignature(items: CreateOrderItem[]) {
  const normalizedItems = [...items].sort((first, second) =>
    first.productId.localeCompare(second.productId),
  );

  return JSON.stringify(normalizedItems);
}

function getOrCreateCheckoutKey(items: CreateOrderItem[]) {
  const signature = createCartSignature(items);

  try {
    const storedValue = localStorage.getItem(CHECKOUT_ATTEMPT_KEY);

    if (storedValue) {
      const attempt = JSON.parse(storedValue) as CheckoutAttempt;

      if (
        attempt.signature === signature &&
        typeof attempt.checkoutKey === "string"
      ) {
        return attempt.checkoutKey;
      }
    }
  } catch {
    localStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
  }

  const checkoutKey = crypto.randomUUID();

  localStorage.setItem(
    CHECKOUT_ATTEMPT_KEY,
    JSON.stringify({
      signature,
      checkoutKey,
    }),
  );

  return checkoutKey;
}

export function CreateOrderButton() {
  const navigate = useNavigate();

  const { items, clearCart } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateOrder() {
    if (items.length === 0 || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const orderItems: CreateOrderItem[] = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const request: CreateOrderRequest = {
        checkoutKey: getOrCreateCheckoutKey(orderItems),
        items: orderItems,
      };

      const response = await apiClient.post<Order>("/orders", request);

      localStorage.removeItem(CHECKOUT_ATTEMPT_KEY);

      clearCart();

      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      setError(
        getApiErrorMessage(error, "Không thể tạo đơn hàng. Vui lòng thử lại."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error && <p role="alert">{error}</p>}

      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleCreateOrder()}
      >
        {submitting ? "Đang tạo đơn hàng..." : "Tạo đơn hàng"}
      </button>
    </>
  );
}
