import {
  useState,
  type FormEvent,
} from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../api/error';
import type {
  Payment,
} from '../types/payment';
import { formatCurrency } from '../utils/formatCurrency';

export function CreatePaymentPage() {
  const navigate = useNavigate();

  const [amount, setAmount] =
    useState('');

  const [error, setError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');

    const normalizedAmount =
      amount.trim();

    if (
      !/^\d+$/.test(normalizedAmount)
    ) {
      setError(
        'Vui lòng nhập số tiền là số nguyên lớn hơn 0 và trong giới hạn cho phép.',
      );

      return;
    }

    const amountNumber =
      Number(normalizedAmount);

    if (
      !Number.isSafeInteger(
        amountNumber,
      ) ||
      amountNumber <= 0
    ) {
      setError(
        'Vui lòng nhập số tiền là số nguyên lớn hơn 0 và trong giới hạn cho phép.',
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await apiClient.post<Payment>(
          '/payments',
          {
            amount: amountNumber,
          },
        );

      navigate(
        `/payments/${response.data.id}`,
        {
          replace: true,
        },
      );
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          'Không thể tạo thanh toán. Vui lòng thử lại.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canPreview =
    /^\d+$/.test(amount.trim()) &&
    BigInt(amount.trim() || '0') > 0n;

  return (
    <main className="create-payment-page">
      <span className="eyebrow">THANH TOÁN QUA NGÂN HÀNG</span>
      <h1>Tạo thanh toán</h1>

      <p>
        Nhập số tiền để tạo mã QR chuyển khoản.
      </p>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="amount">
            Số tiền
          </label>

          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value,
              )
            }
            placeholder="100000"
            autoComplete="off"
            required
          />
        </div>

        {canPreview && (
          <p>
            Số tiền:{' '}
            <strong>
              {formatCurrency(
                amount.trim(),
              )}
            </strong>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? 'Đang tạo thanh toán...'
            : 'Tạo thanh toán'}
        </button>
      </form>

      <p>
        <Link to="/">
          Về trang tổng quan
        </Link>
      </p>
    </main>
  );
}
