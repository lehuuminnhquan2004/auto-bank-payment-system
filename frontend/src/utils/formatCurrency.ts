export function formatCurrency(
  amount: string,
) {
  return `${new Intl.NumberFormat(
    'vi-VN',
  ).format(BigInt(amount))} ₫`;
}