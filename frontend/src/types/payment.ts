export type PaymentStatus =
  "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "CANCELLED";

export type PaymentMethod = "BANK_TRANSFER" | "BALANCE";

export type BankInfo = {
  bankId: string;
  accountNo: string;
  accountName: string;
};

type PaymentBase = {
  id: string;
  orderId: string | null;
  paymentCode: string;
  amount: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};

export type BankTransferPayment = PaymentBase & {
  method: "BANK_TRANSFER";
  bank: BankInfo;
  qrUrl: string;
  expiredAt: string;
};

export type BalancePayment = PaymentBase & {
  method: "BALANCE";
  bank: null;
  qrUrl: null;
  expiredAt: null;
};

export type Payment = BankTransferPayment | BalancePayment;
