import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';

import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../api/error';
import { useAuth } from '../auth/AuthContext';
import type {
  Payment,
} from '../types/payment';
import { formatCurrency } from '../utils/formatCurrency';

const POLL_INTERVAL_MS = 2000;

function formatRemainingTime(
  totalSeconds: number,
) {
  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

export function PaymentPage() {
  const { id } = useParams();

  const { refreshUser } = useAuth();

  const [payment, setPayment] =
    useState<Payment | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);

  const balanceRefreshed =
    useRef(false);

  useEffect(() => {
    let cancelled = false;

    let timeoutId:
      | ReturnType<typeof setTimeout>
      | undefined;

    if (
      !id ||
      !/^\d+$/.test(id)
    ) {
      setError(
        'Mã yêu cầu thanh toán không hợp lệ.',
      );

      setLoading(false);

      return;
    }

    balanceRefreshed.current = false;

    async function loadPayment() {
      try {
        const response =
          await apiClient.get<Payment>(
            `/payments/${id}`,
          );

        if (cancelled) {
          return;
        }

        const currentPayment =
          response.data;

        setPayment(
          currentPayment,
        );

        setError('');

        /*
         * Payment processing happens
         * on the backend.
         *
         * Frontend only reacts to
         * the returned status.
         */
        if (
          currentPayment.status ===
            'PAID' &&
          !balanceRefreshed.current
        ) {
          balanceRefreshed.current =
            true;

          try {
            await refreshUser();
          } catch {
            /*
             * Payment is already confirmed.
             * Do not hide the success state
             * just because balance refresh
             * temporarily failed.
             */
          }
        }

        /*
         * Only PENDING payments
         * need polling.
         */
        if (
          currentPayment.status ===
          'PENDING'
        ) {
          timeoutId = setTimeout(
            () => {
              void loadPayment();
            },
            POLL_INTERVAL_MS,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              error,
              'Không thể tải thông tin thanh toán. Vui lòng thử lại.',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPayment();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id, refreshUser]);

  const paymentStatus =
    payment?.status;

  const paymentExpiredAt =
    payment?.expiredAt;

  useEffect(() => {
    if (
      paymentStatus !== 'PENDING' ||
      !paymentExpiredAt
    ) {
      setRemainingSeconds(0);

      return;
    }

     // Tại đây TypeScript biết paymentExpiredAt là string
    const expiredAt =
        new Date(paymentExpiredAt).getTime();
            
    function updateCountdown() {
        const remaining = Math.max(
        0,
        Math.ceil((expiredAt - Date.now()) / 1000),
        );

        setRemainingSeconds(remaining);
    }
    updateCountdown();

    const intervalId =
      setInterval(
        updateCountdown,
        1000,
      );

    return () => {
      clearInterval(intervalId);
    };
  }, [
    paymentStatus,
    paymentExpiredAt,
  ]);

  if (loading) {
    return (
      <main className="payment-page loading-state" role="status">
        <p>
          Đang tải thông tin thanh toán...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="payment-page">
        <h1>Chi tiết thanh toán</h1>

        <p role="alert">
          {error}
        </p>

        <Link to="/">
          Về trang tổng quan
        </Link>
      </main>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <main className="payment-page" data-status={payment.status}>
      <span className="eyebrow">CHUYỂN KHOẢN NGÂN HÀNG</span>
      <h1>Chi tiết thanh toán</h1>

      {payment.status ===
        'PENDING' && (
        <>
          <p>
            Mở ứng dụng ngân hàng và quét mã QR bên dưới để chuyển khoản đúng số tiền, nội dung.
          </p>

          <img
            src={payment.qrUrl}
            alt="Mã QR chuyển khoản thanh toán"
          />

          <section className="transfer-details">
            <h2>
              Thông tin chuyển khoản
            </h2>

            <p>
              Ngân hàng:{' '}
              <strong>
                {
                  payment.bank
                    .bankId
                }
              </strong>
            </p>

            <p>
              Số tài khoản:{' '}
              <strong>
                {
                  payment.bank
                    .accountNo
                }
              </strong>
            </p>

            <p>
              Chủ tài khoản:{' '}
              <strong>
                {
                  payment.bank
                    .accountName
                }
              </strong>
            </p>

            <p>
              Số tiền:{' '}
              <strong>
                {formatCurrency(
                  payment.amount,
                )}
              </strong>
            </p>

            <p>
              Nội dung chuyển khoản:{' '}
              <strong>
                {
                  payment.paymentCode
                }
              </strong>
            </p>
          </section>

          <section className="payment-progress" aria-live="polite">
            <h2>
              Trạng thái thanh toán
            </h2>

            <p>
              Trạng thái:{' '}
              <strong>
                Chờ thanh toán
              </strong>
            </p>

            <p>
              Thời gian còn lại:{' '}
              <strong>
                {formatRemainingTime(
                  remainingSeconds,
                )}
              </strong>
            </p>

            <p>
              Đang chờ xác nhận giao dịch ngân hàng...
            </p>
          </section>
        </>
      )}

      {payment.status ===
        'PAID' && (
        <section className="payment-result" role="status">
          <h2>
            Thanh toán thành công
          </h2>

          <p>
            Thanh toán của bạn đã được xác nhận.
          </p>

          <p>
            Số tiền:{' '}
            <strong>
              {formatCurrency(
                payment.amount,
              )}
            </strong>
          </p>

          <p>
            Mã thanh toán:{' '}
            <strong>
              {
                payment.paymentCode
              }
            </strong>
          </p>

          {payment.paidAt && (
            <p>
              Thời gian thanh toán:{' '}
              {new Date(
                payment.paidAt,
              ).toLocaleString(
                'vi-VN',
              )}
            </p>
          )}
        </section>
      )}

      {payment.status ===
        'EXPIRED' && (
        <section className="payment-result" role="status">
          <h2>
            Thanh toán đã hết hạn
          </h2>

          <p>
            Yêu cầu này đã hết hạn. Vui lòng tạo yêu cầu mới để tiếp tục thanh toán.
          </p>

          <Link to="/payments/new">
            Tạo thanh toán mới
          </Link>
        </section>
      )}

      {payment.status ===
        'FAILED' && (
        <section className="payment-result" role="status">
          <h2>
            Thanh toán không thành công
          </h2>

          <p>
            Không thể hoàn tất thanh toán này. Vui lòng tạo yêu cầu mới để thử lại.
          </p>

          <Link to="/payments/new">
            Tạo thanh toán mới
          </Link>
        </section>
      )}

      <p>
        <Link to="/">
          Về trang tổng quan
        </Link>
      </p>
    </main>
  );
}
