import { Link } from "react-router-dom";

import { useCart } from "../cart/CartContext";
import { formatCurrency } from "../utils/formatCurrency";
import { CreateOrderButton } from "../cart/CreateOrderButton";

export function CartPage() {
  const {
    items,
    totalItems,
    totalAmount,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <main className="dashboard-page">
      <header>
        <div>
          <span className="eyebrow">GIỎ HÀNG</span>
          <h1>Sản phẩm đã chọn</h1>
          <p className="page-description">
            Kiểm tra sản phẩm và số lượng trước khi tạo đơn hàng.
          </p>
        </div>

        <Link className="button-link" to="/products">
          Tiếp tục mua hàng
        </Link>
      </header>

      <section className="payments-panel">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>Giỏ hàng của bạn đang trống.</p>

            <Link to="/products">Chọn sản phẩm</Link>
          </div>
        ) : (
          <>
            <div
              className="table-scroll"
              role="region"
              aria-label="Các sản phẩm trong giỏ hàng"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const subtotal = (
                      BigInt(item.price) * BigInt(item.quantity)
                    ).toString();

                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td>

                        <td>{formatCurrency(item.price)}</td>

                        <td>
                          <div className="cart-quantity">
                            <button
                              type="button"
                              aria-label={`Giảm số lượng ${item.name}`}
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                )
                              }
                            >
                              −
                            </button>

                            <strong>{item.quantity}</strong>

                            <button
                              type="button"
                              aria-label={`Tăng số lượng ${item.name}`}
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td>{formatCurrency(subtotal)}</td>

                        <td>
                          <button
                            type="button"
                            className="cart-remove"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="cart-summary">
              <p>
                Tổng số lượng: <strong>{totalItems}</strong>
              </p>

              <p>
                Tổng tiền dự kiến:
                <strong>{formatCurrency(totalAmount)}</strong>
              </p>
              <CreateOrderButton />
            </div>
          </>
        )}
      </section>
    </main>
  );
}