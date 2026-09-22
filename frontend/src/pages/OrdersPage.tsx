import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../api/error";
import type { Order } from "../types/order";
import { formatCurrency } from "../utils/formatCurrency";
import { orderStatusLabels } from "../utils/orderStatus";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await apiClient.get<Order[]>("/orders");

        if (!cancelled) {
          setOrders(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(error, "Không thể tải lịch sử đơn hàng."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="dashboard-page">
      <header>
        <div>
          <span className="eyebrow">ĐƠN HÀNG</span>
          <h1>Lịch sử đơn hàng</h1>
          <p className="page-description">
            Theo dõi trạng thái các đơn hàng đã tạo.
          </p>
        </div>

        <Link className="button-link" to="/products">
          Mua sản phẩm
        </Link>
      </header>

      <section className="payments-panel">
        {loading && <p>Đang tải lịch sử đơn hàng...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <p>Bạn chưa có đơn hàng nào.</p>

            <Link to="/products">Chọn sản phẩm</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div
            className="table-scroll"
            role="region"
            aria-label="Lịch sử đơn hàng"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>

                    <td>
                      {order.items
                        .map((item) => `${item.name} × ${item.quantity}`)
                        .join(", ")}
                    </td>

                    <td>{formatCurrency(order.totalAmount)}</td>

                    <td>
                      <span className="status-badge" data-status={order.status}>
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>

                    <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>

                    <td>
                      <Link to={`/orders/${order.id}`}>Xem chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p>
          <Link to="/">Về trang tổng quan</Link>
        </p>
      </section>
    </main>
  );
}
