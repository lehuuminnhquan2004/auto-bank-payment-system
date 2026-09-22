import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import { getApiErrorMessage } from "../api/error";
import { useCart } from "../cart/CartContext";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/formatCurrency";


export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { items, totalItems, addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await apiClient.get<Product[]>("/products");

        if (!cancelled) {
          setProducts(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(error, "Không thể tải danh sách sản phẩm."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="dashboard-page">
      <header>
        <div>
          <span className="eyebrow">CỬA HÀNG</span>
          <h1>Danh sách sản phẩm</h1>
          <p className="page-description">
            Chọn sản phẩm bạn muốn thêm vào giỏ hàng.
          </p>
        </div>

        <div>
          <p>
            Sản phẩm trong giỏ: <strong>{totalItems}</strong>
          </p>

          <p>
            <Link to="/cart">Xem giỏ hàng</Link>
          </p>

          <Link to="/">Về trang tổng quan</Link>
        </div>
      </header>

      <section className="payments-panel">
        {loading && <p>Đang tải sản phẩm...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="empty-state">Hiện chưa có sản phẩm nào.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Trong giỏ</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const cartItem = items.find((item) => item.id === product.id);

                  return (
                    <tr key={product.id}>
                      <td>{product.name}</td>

                      <td>{formatCurrency(product.price)}</td>

                      <td>{cartItem?.quantity ?? 0}</td>

                      <td>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                        >
                          Thêm vào giỏ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
