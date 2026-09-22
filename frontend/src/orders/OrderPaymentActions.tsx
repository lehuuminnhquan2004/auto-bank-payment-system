import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../api/error";
import { useAuth } from "../auth/AuthContext";
import type { Order } from "../types/order";
import type { Payment } from "../types/payment";
import { formatCurrency } from "../utils/formatCurrency";

type ProcessingMethod = "BALANCE" | "BANK_TRANSFER" | null;

type OrderPaymentActionsProps = {
  order: Order;
  onOrderUpdated: (order: Order) => void;
};

export function OrderPaymentActions({
  order,
  onOrderUpdated,
}: OrderPaymentActionsProps) {
  const navigate = useNavigate();

  const { user, refreshUser } = useAuth();

  const [processingMethod, setProcessingMethod] =
    useState<ProcessingMethod>(null);

  const [error, setError] = useState("");

  async function payWithBalance() {
    if (processingMethod) {
      return;
    }

    setProcessingMethod("BALANCE");
    setError("");

    try {
      const response = await apiClient.post<Order>(
        `/orders/${order.id}/pay-with-balance`,
      );

      onOrderUpdated(response.data);

      try {
        await refreshUser();
      } catch {
        // Order đã thanh toán thành công.
        // Không đổi thành lỗi chỉ vì tải lại số dư thất bại.
      }
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Không thể thanh toán bằng số dư.",
        ),
      );
    } finally {
      setProcessingMethod(null);
    }
  }

  async function payWithBankTransfer() {
    if (processingMethod) {
      return;
    }

    setProcessingMethod("BANK_TRANSFER");
    setError("");

    try {
      const response = await apiClient.post<Payment>(
        `/orders/${order.id}/payments`,
      );

      navigate(`/payments/${response.data.id}`);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Không thể tạo thanh toán chuyển khoản.",
        ),
      );

      setProcessingMethod(null);
    }
  }

  return (
    <section className="order-payment-actions">
      <h2>Chọn phương thức thanh toán</h2>

      {user && (
        <p>
          Số dư hiện tại:{" "}
          <strong>{formatCurrency(user.balance)}</strong>
        </p>
      )}

      {processingMethod ? (
        <p role="status">
          {processingMethod === "BALANCE"
            ? "Đang thanh toán bằng số dư..."
            : "Đang tạo mã QR chuyển khoản..."}
        </p>
      ) : (
        <div className="order-payment-buttons">
          <button
            type="button"
            onClick={() => void payWithBalance()}
          >
            Thanh toán bằng số dư
          </button>

          <button
            type="button"
            onClick={() => void payWithBankTransfer()}
          >
            Chuyển khoản ngân hàng
          </button>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  );
}