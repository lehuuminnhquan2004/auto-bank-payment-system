import { useState } from "react";

import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../api/error";
import type { Order } from "../types/order";

type CancelOrderButtonProps = {
  orderId: string;
  onOrderUpdated: (order: Order) => void;
};

export function CancelOrderButton({
  orderId,
  onOrderUpdated,
}: CancelOrderButtonProps) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (cancelling) {
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy đơn hàng này không?",
    );

    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setError("");

    try {
      const response = await apiClient.post<Order>(`/orders/${orderId}/cancel`);

      onOrderUpdated(response.data);
    } catch (error) {
      setError(getApiErrorMessage(error, "Không thể hủy đơn hàng."));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="order-cancel-action">
      <button
        type="button"
        className="order-cancel-button"
        disabled={cancelling}
        onClick={() => void handleCancel()}
      >
        {cancelling ? "Đang hủy đơn hàng..." : "Hủy đơn hàng"}
      </button>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
