import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/error';
import { useAuth } from '../auth/AuthContext';

type LoginLocationState = {
  registered?: boolean;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const state = location.state as LoginLocationState | null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);

      navigate('/', {
        replace: true,
      });
    } catch (error) {
      setError(
        getApiErrorMessage(error, 'Không thể đăng nhập. Vui lòng thử lại.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <span className="eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span>
      <h1>Đăng nhập</h1>
      <p className="page-description">
        Đăng nhập để quản lý số dư và theo dõi thanh toán.
      </p>

      {state?.registered && (
        <p className="notice notice-success" role="status">
          Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.
        </p>
      )}

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
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p>
        Bạn chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </main>
  );
}
