import type { PaymentMethod, PaymentStatus } from "./payment";

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export type OrderItem = {
  productId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  paymentId: string | null;
  paymentStatus: PaymentStatus | null;
  paymentMethod: PaymentMethod | null;
  items: OrderItem[];
};

export type CreateOrderItem = {
  productId: string;
  quantity: number;
};

export type CreateOrderRequest = {
  checkoutKey: string;
  items: CreateOrderItem[];
};
