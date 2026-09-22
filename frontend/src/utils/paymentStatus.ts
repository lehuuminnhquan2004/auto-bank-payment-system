import type { PaymentStatus } from "../types/payment";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  EXPIRED: "Đã hết hạn",
  FAILED: "Không thành công",
  CANCELLED: "Đã hủy",
};
