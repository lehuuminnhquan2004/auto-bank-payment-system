import axios from "axios";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

const errorMessages: Record<string, string> = {
  "Email already exists":
    "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.",
  "Invalid email or password": "Email hoặc mật khẩu không đúng.",
  Unauthorized:
    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
  Forbidden: "Bạn không có quyền thực hiện thao tác này.",
  "Payment not found": "Không tìm thấy yêu cầu thanh toán.",
  "Invalid payment id": "Mã yêu cầu thanh toán không hợp lệ.",
  "Unable to generate unique payment code":
    "Chưa thể tạo mã thanh toán. Vui lòng thử lại.",
  "email must be an email": "Vui lòng nhập địa chỉ email hợp lệ.",
  "email must be shorter than or equal to 255 characters":
    "Email không được vượt quá 255 ký tự.",
  "password must be a string": "Mật khẩu phải là chuỗi ký tự.",
  "password must be longer than or equal to 8 characters":
    "Mật khẩu phải có ít nhất 8 ký tự.",
  "password must be shorter than or equal to 128 characters":
    "Mật khẩu không được vượt quá 128 ký tự.",
  "amount must be an integer number": "Số tiền phải là số nguyên.",
  "amount must be a positive number": "Số tiền phải lớn hơn 0.",

  // Order
  "Order not found": "Không tìm thấy đơn hàng.",
  "Invalid order id": "Mã đơn hàng không hợp lệ.",
  "One or more products are unavailable":
    "Một hoặc nhiều sản phẩm hiện không còn khả dụng.",
  "Product unavailable": "Sản phẩm hiện không còn khả dụng.",
  "Order item total is too large":
    "Thành tiền của một sản phẩm vượt quá giới hạn.",
  "Order total is too large": "Tổng giá trị đơn hàng vượt quá giới hạn.",
  "Invalid order total": "Tổng giá trị đơn hàng không hợp lệ.",
  "Invalid product id": "Mã sản phẩm không hợp lệ.",
  "Duplicate product": "Giỏ hàng chứa sản phẩm bị trùng.",
  "Checkout key already used with a different cart":
    "Giỏ hàng đã thay đổi. Vui lòng tạo lại đơn hàng.",

  // Thanh toán Order
  "Order is not pending": "Đơn hàng không còn ở trạng thái chờ thanh toán.",
  "Order already has a payment": "Đơn hàng này đã có một yêu cầu thanh toán.",
  "Insufficient balance": "Số dư không đủ để thanh toán đơn hàng.",
  "Balance changed, please retry": "Số dư vừa thay đổi. Vui lòng thử lại.",
  "Order is no longer payable": "Đơn hàng không còn có thể thanh toán.",
  "Order payment is already paid": "Đơn hàng này đã được thanh toán.",
  "Payment is no longer cancellable":
    "Yêu cầu thanh toán không còn có thể hủy.",
  "Order is no longer cancellable": "Đơn hàng không còn có thể hủy.",
  "User not found": "Không tìm thấy tài khoản người dùng.",

  // Validate checkoutKey
  "checkoutKey must be a string": "Mã xác nhận tạo đơn hàng không hợp lệ.",
  "checkoutKey must be a UUID": "Mã xác nhận tạo đơn hàng không hợp lệ.",

  // Validate items
  "items must be an array": "Danh sách sản phẩm phải là một mảng.",
  "items must contain at least 1 elements":
    "Giỏ hàng phải có ít nhất một sản phẩm.",
  "items must contain no more than 50 elements":
    "Một đơn hàng chỉ được chứa tối đa 50 sản phẩm.",
  "All items's elements must be unique":
    "Mỗi sản phẩm chỉ được xuất hiện một lần trong giỏ hàng.",
  "each value in nested property items must be either object or array":
    "Dữ liệu sản phẩm trong giỏ hàng không hợp lệ.",

  // Validate từng OrderItem
  "productId must be a string": "Mã sản phẩm phải là chuỗi.",
  "productId must match /^[1-9]\\d*$/ regular expression":
    "Mã sản phẩm phải là số nguyên dương.",
  "productId must be shorter than or equal to 19 characters":
    "Mã sản phẩm vượt quá giới hạn cho phép.",
  "quantity must be an integer number": "Số lượng sản phẩm phải là số nguyên.",
  "quantity must not be less than 1": "Số lượng sản phẩm phải ít nhất là 1.",
  "quantity must not be greater than 99":
    "Mỗi sản phẩm chỉ được mua tối đa 99.",

  // Lỗi dữ liệu nội bộ có thể xuất hiện khi GET Payment/Order
  "Pending payment has no expiration time":
    "Dữ liệu thanh toán không hợp lệ. Vui lòng liên hệ hỗ trợ.",
  "Payment references a missing order":
    "Không tìm thấy đơn hàng của thanh toán này.",
  "Payment order reference changed":
    "Dữ liệu thanh toán không nhất quán. Vui lòng tải lại.",
  "Pending payment belongs to a non-pending order":
    "Trạng thái đơn hàng và thanh toán không nhất quán.",
  "Unable to expire Payment": "Chưa thể cập nhật trạng thái thanh toán.",
  "Unable to expire Order": "Chưa thể cập nhật trạng thái đơn hàng.",
  "Internal server error": "Hệ thống đang gặp lỗi. Vui lòng thử lại sau.",
  "Bad Request": "Dữ liệu gửi lên không hợp lệ.",
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage;
  }

  const message = error.response?.data?.message;

  if (!error.response) {
    return "Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.";
  }

  if (Array.isArray(message)) {
    return [
      ...new Set(
        message.map((item) => translateApiErrorMessage(item, fallbackMessage)),
      ),
    ].join(" ");
  }

  if (typeof message === "string") {
    return translateApiErrorMessage(message, fallbackMessage);
  }

  return fallbackMessage;
}
function translateApiErrorMessage(message: string, fallbackMessage: string) {
  const normalizedMessage = message.replace(/^items\.\d+\./, "");

  if (/^property .+ should not exist$/.test(normalizedMessage)) {
    return "Dữ liệu chứa trường không được phép.";
  }

  return errorMessages[normalizedMessage] ?? fallbackMessage;
}
