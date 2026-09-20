import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../api/error';
import type { RegisterResponse } from '../types/auth';

export function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');

      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError('Mật khẩu phải có từ 8 đến 128 ký tự.');

      return;
    }

    setSubmitting(true);

    try {
      await apiClient.post<RegisterResponse>('/auth/register', {
        email: email.trim().toLowerCase(),

        password,
      });

      navigate('/login', {
        replace: true,

        state: {
          registered: true,
        },
      });
    } catch (error) {
      setError(
        getApiErrorMessage(error, 'Không thể tạo tài khoản. Vui lòng thử lại.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <span className="eyebrow">BẮT ĐẦU CÙNG AUTOBANK</span>
      <h1>Tạo tài khoản</h1>
      <p className="page-description">
        Đăng ký để quản lý thanh toán thuận tiện trong một tài khoản.
      </p>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Địa chỉ email</label>

          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={255}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password">Mật khẩu</label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>

      <p>
        Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </main>
  );
}
