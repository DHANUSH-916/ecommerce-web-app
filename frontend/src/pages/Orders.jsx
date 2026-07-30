import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await api.get("/orders");

        setOrders(response.data.orders || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.dispatchEvent(
            new Event("authChanged")
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load orders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Account</p>
        <h1>My Orders</h1>

        <p className="orders-subtitle">
          View your purchases and track their delivery.
        </p>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {!error && orders.length === 0 ? (
        <div className="empty-card">
          <h2>No orders yet</h2>

          <p>
            Your orders will appear here after
            checkout.
          </p>

          <Link
            to="/"
            className="primary-btn"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div
              className="order-card"
              key={order.id}
            >
              <div className="order-top">
                <div>
                  <p className="eyebrow">
                    Order
                  </p>

                  <h2>#{order.id}</h2>
                </div>

                <span
                  className={`status-badge status-${order.status?.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-information">
                <div>
                  <span>Date</span>

                  <strong>
                    {order.created_at
                      ? new Date(
                          order.created_at
                        ).toLocaleString()
                      : "-"}
                  </strong>
                </div>

                <div>
                  <span>Items</span>

                  <strong>
                    {order.items?.reduce(
                      (total, item) =>
                        total +
                        Number(item.quantity),
                      0
                    ) || 0}
                  </strong>
                </div>

                <div>
                  <span>Total</span>

                  <strong>
                    ₹
                    {Number(
                      order.total_price
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>

              {order.items &&
                order.items.length > 0 && (
                  <div className="order-products">
                    {order.items.map((item) => (
                      <div
                        className="order-product"
                        key={item.id}
                      >
                        <div>
                          <strong>
                            {item.product_name}
                          </strong>

                          <p>
                            Quantity:{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <strong>
                          ₹
                          {Number(
                            item.subtotal
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

              <Link
                to={`/orders/${order.id}/track`}
                className="primary-btn order-track-btn"
              >
                Track Order
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;