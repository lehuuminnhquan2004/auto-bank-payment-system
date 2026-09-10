export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'EXPIRED'
  | 'FAILED';

export type BankInfo = {
  bankId: string;
  accountNo: string;
  accountName: string;
};

export type Payment = {
  id: string;
  paymentCode: string;
  amount: string;
  status: PaymentStatus;

  bank: BankInfo;
  qrUrl: string;

  createdAt: string;
  updatedAt: string;
  expiredAt: string;
  paidAt: string | null;
};