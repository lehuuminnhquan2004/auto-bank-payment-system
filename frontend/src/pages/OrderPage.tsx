import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../api/error";
import type { Order, OrderStatus } from "../types/order";
import { formatCurrency } from "../utils/formatCurrency";
import { OrderPaymentActions } from "../orders/OrderPaymentActions";
import { CancelOrderButton } from "../orders/CancelOrderButton";

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  EXPIRED: "Đã hết hạn",
  CANCELLED: "Đã hủy",
};

export function OrderPage() {
  const { id } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!id || !/^[1-9]\d{0,18}$/.test(id)) {
      return;
    }

    async function loadOrder() {
      try {
        const response = await apiClient.get<Order>(`/orders/${id}`);

        if (!cancelled) {
          setOrder(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(error, "Không thể tải thông tin đơn hàng."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id || !/^[1-9]\d{0,18}$/.test(id)) {
    return (
      <main className="dashboard-page">
        <p role="alert">Mã đơn hàng không hợp lệ.</p>
        <Link to="/">Về trang tổng quan</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <p>Đang tải đơn hàng...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <p role="alert">{error}</p>
        <Link to="/">Về trang tổng quan</Link>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="dashboard-page">
      <header>
        <div>
          <span className="eyebrow">ĐƠN HÀNG #{order.id}</span>
          <h1>Chi tiết đơn hàng</h1>
          <p className="page-description">
            Tạo lúc {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        <span className="status-badge" data-status={order.status}>
          {orderStatusLabels[order.status]}
        </span>
      </header>

      <section className="payments-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cart-summary">
          <p>
            Tổng thanh toán:
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </p>
        </div>

        {order.status === "PENDING" && !order.paymentId && (
          <OrderPaymentActions order={order} onOrderUpdated={setOrder} />
        )}

        {order.status === "PENDING" && (
          <CancelOrderButton orderId={order.id} onOrderUpdated={setOrder} />
        )}

        {order.paymentId && (
          <p>
            <Link to={`/payments/${order.paymentId}`}>
              Xem thông tin thanh toán
            </Link>
          </p>
        )}

        <p>
          <Link to="/">Về trang tổng quan</Link>
        </p>
      </section>
    </main>
  );
}
