import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../api/error';
import { useAuth } from '../auth/AuthContext';
import type { Payment } from '../types/payment';
import { formatCurrency } from '../utils/formatCurrency';
import { paymentStatusLabels } from '../utils/paymentStatus';

export function DashboardPage() {
  const navigate = useNavigate();

  const { user, logout, refreshUser } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setError('');

        const response = await apiClient.get<Payment[]>('/payments');

        if (!cancelled) {
          setPayments(response.data);
        }

        await refreshUser();
      } catch (error) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              error,
              'Không thể tải thông tin tài khoản. Vui lòng thử lại.',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  if (!user) {
    return null;
  }

  return (
    <main className="dashboard-page">
      <header>
        <div>
          <span className="eyebrow">QUẢN LÝ TÀI KHOẢN</span>
          <h1>Tổng quan</h1>
          <p className="page-description">
            Theo dõi số dư và quản lý mọi giao dịch thanh toán.
          </p>
        </div>

        <button type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <section className="balance-card">
        <h2>Tài khoản của bạn</h2>

        <p>Email: {user.email}</p>

        <p>
          Số dư hiện tại: <strong>{formatCurrency(user.balance)}</strong>
        </p>
      </section>

      <section className="payments-panel">
        <div className="section-heading">
          <h2>Lịch sử thanh toán</h2>

          <div className="dashboard-actions">
              <Link to="/orders">Đơn hàng của tôi</Link>
              
              <Link className="button-link" to="/products">
                Mua sản phẩm
              </Link>

              <Link className="button-link" to="/payments/new">
                Nạp tiền
              </Link>
          </div>
        </div>

        {loading && <p>Đang tải lịch sử thanh toán...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && payments.length === 0 && (
          <p className="empty-state">
            Bạn chưa có thanh toán nào. Hãy tạo yêu cầu thanh toán đầu tiên.
          </p>
        )}

        {!loading && payments.length > 0 && (
          <div
            className="table-scroll"
            role="region"
            aria-label="Lịch sử thanh toán"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Mã thanh toán</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.paymentCode}</td>

                    <td>{formatCurrency(payment.amount)}</td>

                    <td>
                      <span
                        className="status-badge"
                        data-status={payment.status}
                      >
                        {paymentStatusLabels[payment.status]}
                      </span>
                    </td>

                    <td>
                      {new Date(payment.createdAt).toLocaleString('vi-VN')}
                    </td>

                    <td>
                      <Link to={`/payments/${payment.id}`}>Xem chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
