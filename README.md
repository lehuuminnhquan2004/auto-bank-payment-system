# AutoBank — Auto Bank Payment System

Ứng dụng web tự động xác nhận thanh toán chuyển khoản ngân hàng, sử dụng VietQR và webhook SePay. Người dùng tạo yêu cầu thanh toán, quét mã QR và theo dõi kết quả; backend đối chiếu giao dịch để cập nhật trạng thái và cộng số dư.

**Demo:** [pm.lehuuminhquan.id.vn](https://pm.lehuuminhquan.id.vn)

**Trạng thái:** Đang phát triển.

## Chức năng

- Đăng ký, đăng nhập bằng JWT; băm mật khẩu bằng Argon2.
- Xem thông tin tài khoản, số dư và lịch sử thanh toán.
- Tạo yêu cầu thanh toán với mã riêng, thời hạn và QR chuyển khoản.
- Hiển thị thông tin ngân hàng, đồng hồ đếm ngược và tự cập nhật trạng thái bằng polling.
- Xác thực webhook SePay bằng HMAC-SHA256 và kiểm tra timestamp.
- Lưu giao dịch ngân hàng và nhật ký webhook để tra cứu, đối soát.
- Xử lý thanh toán trong database transaction, khóa dòng Payment và dùng unique constraint để chống xử lý trùng.
- Giao diện tiếng Việt, hỗ trợ máy tính và điện thoại.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Axios, CSS |
| Backend | NestJS 12, TypeScript, Node.js, ESM |
| Database | MySQL 8.4, Prisma ORM 7, MariaDB adapter |
| Xác thực | JWT, Passport, Argon2 |
| Kiểm tra đầu vào | class-validator, class-transformer, ValidationPipe |
| Thanh toán | VietQR, SePay Webhooks |
| Kiểm thử | Vitest, Supertest, NestJS Testing Module |
| Môi trường dữ liệu local | Docker Compose, MySQL, phpMyAdmin |

## Luồng thanh toán

```text
Người dùng tạo Payment
    → Backend sinh mã thanh toán và URL VietQR
    → Người dùng chuyển khoản
    → SePay gửi webhook đến backend
    → Backend xác thực chữ ký và đối chiếu giao dịch
    → Ghi giao dịch, chuyển Payment sang PAID, cộng số dư
    → Frontend đọc trạng thái mới và hiển thị kết quả
```

### Quy tắc xử lý hiện tại

- Chỉ xử lý thanh toán từ giao dịch tiền vào.
- Mã thanh toán có dạng `PAY` + 12 ký tự hex, được lấy từ `code` hoặc trích xuất từ `content`.
- Payment phải tồn tại, còn trạng thái `PENDING` và chưa quá hạn khi backend xử lý.
- Chấp nhận số tiền thực nhận **lớn hơn hoặc bằng** số tiền Payment.
- Chỉ cộng số dư bằng **số tiền đã tạo trong Payment**. Ví dụ: yêu cầu 100.000 ₫, nhận 150.000 ₫ thì cộng 100.000 ₫; giao dịch ngân hàng vẫn lưu đủ 150.000 ₫. Chưa có chức năng tự xử lý hoặc hoàn phần dư.
- Không cộng gộp nhiều giao dịch chuyển thiếu để thanh toán một Payment.
- Một giao dịch được nhận diện duy nhất bằng `(provider, providerTransactionId)`.
- Khóa dòng Payment bằng `SELECT ... FOR UPDATE` khi đối chiếu; cập nhật Payment và số dư trong cùng transaction.
- Giao dịch không đủ điều kiện có thể vẫn được lưu để đối soát, với webhook log mang trạng thái `IGNORED`.
- Gửi lại một giao dịch đã lưu sẽ được coi là `DUPLICATE`, không tự xử lý lại giao dịch từng bị bỏ qua.

Frontend chỉ hiển thị kết quả; backend là nơi quyết định thanh toán hợp lệ.

## Cấu trúc dự án

```text
auto-bank-payment-system/
├── backend/
│   ├── prisma/             # Schema và migrations
│   ├── src/
│   │   ├── auth/           # Đăng ký, đăng nhập, JWT
│   │   ├── users/          # Truy cập dữ liệu người dùng
│   │   ├── payments/       # Tạo, tra cứu Payment và sinh QR
│   │   ├── webhooks/       # Xác thực và xử lý webhook SePay
│   │   └── prisma/         # Kết nối database
│   ├── test/               # Kiểm thử tích hợp và E2E
│   └── prisma7.config.ts
├── frontend/
│   └── src/
│       ├── api/            # Axios client và thông báo lỗi
│       ├── auth/           # AuthContext và bảo vệ route
│       ├── pages/          # Các màn hình ứng dụng
│       ├── styles/         # CSS dùng chung và theo màn hình
│       ├── types/          # Kiểu dữ liệu TypeScript
│       └── utils/          # Định dạng tiền và nhãn trạng thái
├── docker-compose.yml
├── .env.example
└── README.md
```

## Chạy trên máy cá nhân

### 1. Chuẩn bị

- Node.js 24.x và npm.
- Docker Engine/Docker Desktop có Docker Compose.
- Thông tin tài khoản ngân hàng nhận tiền để tạo QR.
- Cấu hình webhook SePay nếu muốn thử toàn bộ luồng xác nhận thanh toán.

Chạy các lệnh bên dưới từ thư mục dự án. Mỗi phần ghi rõ thư mục làm việc.

### 2. Cấu hình môi trường

Sao chép các file mẫu:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Trên PowerShell, có thể dùng `Copy-Item` thay cho `cp`. Nếu đã có `.env`, chỉnh file hiện có thay vì ghi đè.

| File | Nội dung |
| --- | --- |
| `.env` | `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_PORT` cho Docker Compose |
| `backend/.env` | Kết nối database, JWT, thời hạn Payment, tài khoản nhận tiền và secret webhook |
| `frontend/.env` | `VITE_API_BASE_URL=http://localhost:3000/api` |

Các biến cần điền trong `backend/.env`:

| Biến | Ý nghĩa |
| --- | --- |
| `NODE_ENV`, `PORT` | Môi trường chạy và cổng backend; local dùng `development`, `3000` |
| `DATABASE_HOST`, `DATABASE_PORT` | Địa chỉ MySQL; backend chạy trên máy host dùng `127.0.0.1` và cổng đã publish |
| `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` | Phải khớp cấu hình MySQL trong `.env` gốc |
| `DATABASE_URL` | URL MySQL dành cho Prisma CLI, trỏ cùng database với các biến trên |
| `JWT_SECRET` | Chuỗi bí mật ngẫu nhiên riêng cho môi trường |
| `JWT_EXPIRES_IN` | Thời hạn JWT theo giây, ví dụ `3600` |
| `PAYMENT_EXPIRES_IN_MINUTES` | Thời hạn yêu cầu thanh toán, ví dụ `15` phút |
| `BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` | Ngân hàng, số tài khoản và tên người nhận |
| `VIETQR_TEMPLATE` | Mẫu ảnh QR, ví dụ `compact2` |
| `SEPAY_WEBHOOK_SECRET` | Secret trùng với cấu hình HMAC-SHA256 của webhook SePay |

Không commit `.env` hoặc dùng secret mẫu cho môi trường public. Biến `VITE_*` được đưa vào mã frontend nên không được chứa secret.

### 3. Khởi động database

Tại thư mục gốc:

```bash
docker compose up -d
docker compose ps
```

Chờ MySQL sẵn sàng trước khi chạy migration. phpMyAdmin local: `http://localhost:8080`.

Compose hiện chỉ chạy MySQL và phpMyAdmin; frontend và backend chạy riêng ở các bước sau. Volume `mysql_data` giữ dữ liệu qua các lần khởi động; thay đổi biến mật khẩu không tự đổi mật khẩu trong database đã khởi tạo.

### 4. Cài đặt và chạy backend

```bash
cd backend
npm ci
npx prisma generate --config ./prisma7.config.ts
npx prisma migrate deploy --config ./prisma7.config.ts
npm run start:dev
```

Lệnh migration áp dụng schema đã có trong repository vào database local mới. Backend mặc định chạy tại `http://localhost:3000/api`.

### 5. Cài đặt và chạy frontend

Mở terminal khác tại thư mục gốc:

```bash
cd frontend
npm ci
npm run dev
```

Truy cập `http://localhost:5173`. CORS trong `backend/src/main.ts` hiện cho phép origin này; nếu đổi cổng hoặc tên miền frontend, cập nhật cấu hình tương ứng.

## API chính

| Method | Endpoint | Chức năng | Xác thực |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Tạo tài khoản | Không |
| POST | `/api/auth/login` | Đăng nhập, lấy access token | Không |
| GET | `/api/auth/me` | Lấy thông tin và số dư | Bearer JWT |
| POST | `/api/payments` | Tạo yêu cầu thanh toán | Bearer JWT |
| GET | `/api/payments` | Lịch sử của người dùng hiện tại | Bearer JWT |
| GET | `/api/payments/:id` | Chi tiết Payment của người dùng | Bearer JWT |
| POST | `/api/webhooks/sepay` | Nhận thông báo giao dịch | HMAC-SHA256 |

Ví dụ body tạo Payment:

```json
{
  "amount": 100000
}
```

Người dùng được xác định từ JWT, không truyền `userId` từ frontend. ID và số tiền kiểu `BigInt` được chuyển thành chuỗi trong response JSON.

## Tích hợp SePay

1. Tạo webhook trỏ đến URL public của backend: `https://<ten-mien>/api/webhooks/sepay`.
2. Cấu hình xác thực HMAC-SHA256 và đồng bộ secret với `SEPAY_WEBHOOK_SECRET`.
3. Khi chạy local, dùng HTTPS tunnel trỏ đến cổng backend; SePay không truy cập được `localhost` trên máy bạn.
4. Tạo Payment, dùng đúng mã và số tiền để mô phỏng giao dịch trong môi trường thử nghiệm.
5. Kiểm tra `payments`, `bank_transactions`, `webhook_logs` và số dư người dùng.

Backend hiện kiểm tra `X-SePay-Signature`, `X-SePay-Timestamp` và chữ ký trên `{timestamp}.{rawBody}`, với độ lệch thời gian tối đa 5 phút. Cần giữ `rawBody: true` trong cấu hình NestJS.

URL webhook theo tên miền demo: `https://pm.lehuuminhquan.id.vn/api/webhooks/sepay`.

## Kiểm thử và build

Trong `backend/`:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Chạy riêng kiểm thử xử lý thanh toán:

```bash
npm run test:e2e -- test/payment-processing.e2e-spec.ts
```

Các test tích hợp dùng cấu hình database từ môi trường và có tạo/xóa dữ liệu test. Dùng database kiểm thử riêng; không chạy E2E trên database production. Các lệnh trên là hướng dẫn chạy, không phải cam kết trạng thái tất cả test đang pass.

Trong `frontend/`:

```bash
npm run lint
npm run build
```

## Ghi chú triển khai

- Frontend build ra `frontend/dist`; backend build ra `backend/dist`.
- Với cùng tên miền, đặt `VITE_API_BASE_URL=/api` trong `frontend/.env.production` rồi build lại.
- Nginx phục vụ frontend và proxy `/api/` đến backend. Các route React cần fallback về `index.html` để tải lại trang chi tiết không bị 404.
- Backend phải chạy với working directory là `backend/` để đọc đúng `.env`; có thể khởi động bản build bằng `node dist/main.js`.
- Sau khi sửa backend TypeScript trên VPS: build lại rồi restart tiến trình Node. Thay `.env` cần restart.
- Docker Compose trong repository dành cho development, chưa phải cấu hình triển khai production hoàn chỉnh.

## Hướng phát triển

- Trang quản trị giao dịch, webhook và đối soát.
- Sổ biến động số dư và quy trình xử lý giao dịch bất thường.
- Phân trang, lọc lịch sử và cải thiện khả năng phục hồi khi mất kết nối.
- Đối soát giao dịch định kỳ, giám sát và cảnh báo.
- API cho nhiều cửa hàng, quản lý API key và webhook thông báo kết quả.

Các mục trong phần này là định hướng, chưa phải tính năng đã hoàn thành.
