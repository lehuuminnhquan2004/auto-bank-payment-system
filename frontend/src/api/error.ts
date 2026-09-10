import axios from 'axios';

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

const errorMessages: Record<string, string> = {
  'Email already exists': 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  Unauthorized: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
  Forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  'Payment not found': 'Không tìm thấy yêu cầu thanh toán.',
  'Invalid payment id': 'Mã yêu cầu thanh toán không hợp lệ.',
  'Unable to generate unique payment code': 'Chưa thể tạo mã thanh toán. Vui lòng thử lại.',
  'email must be an email': 'Vui lòng nhập địa chỉ email hợp lệ.',
  'email must be shorter than or equal to 255 characters': 'Email không được vượt quá 255 ký tự.',
  'password must be a string': 'Mật khẩu phải là chuỗi ký tự.',
  'password must be longer than or equal to 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'password must be shorter than or equal to 128 characters': 'Mật khẩu không được vượt quá 128 ký tự.',
  'amount must be an integer number': 'Số tiền phải là số nguyên.',
  'amount must be a positive number': 'Số tiền phải lớn hơn 0.',
};

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (
    !axios.isAxiosError<ApiErrorResponse>(
      error,
    )
  ) {
    return fallbackMessage;
  }

  const message =
    error.response?.data?.message;

  if (!error.response) {
    return 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }

  if (Array.isArray(message)) {
    return [...new Set(message.map((item) => errorMessages[item] ?? fallbackMessage))].join(' ');
  }

  if (typeof message === 'string') {
    return errorMessages[message] ?? fallbackMessage;
  }

  return fallbackMessage;
}
