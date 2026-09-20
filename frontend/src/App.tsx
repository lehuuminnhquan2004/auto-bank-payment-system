import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { CreatePaymentPage } from './pages/CreatePaymentPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentPage } from './pages/PaymentPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <header className="site-header">
          <Link to="/" className="brand" aria-label="Trang chủ AutoBank">
            <span className="brand-mark" aria-hidden="true">
              A<span>↗</span>
            </span>
            <span>
              Auto<span className="brand-accent">Bank</span>
              <small>THANH TOÁN TRỰC TUYẾN</small>
            </span>
          </Link>
          <span className="header-caption">
            Thanh toán đơn giản, giao dịch dễ dàng.
          </span>
        </header>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />

            <Route path="/payments/new" element={<CreatePaymentPage />} />

            <Route path="/payments/:id" element={<PaymentPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="site-footer">
          <span>AutoBank · Thanh toán qua ngân hàng</span>
          <span>Đơn giản. Minh bạch. Tiện lợi.</span>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
