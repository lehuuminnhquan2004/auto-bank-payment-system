import type { PaymentStatus } from '../types/payment';

// Nhãn hiển thị; giữ nguyên mã trạng thái dùng để trao đổi với API.
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  EXPIRED: 'Đã hết hạn',
  FAILED: 'Không thành công',
};
