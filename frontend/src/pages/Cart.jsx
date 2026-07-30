import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
    total_items: 0,
    total_price: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkingOut, setCheckingOut] =
    useState(false);

  const loadCart = async () => {
    try {
      setError("");

      const response = await api.get("/cart");

      setCart(response.data);
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
          "Unable to load cart."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (
    cartItemId,
    quantity,
    stock
  ) => {
    setError("");
    setMessage("");

    const newQuantity = Number(quantity);

    if (newQuantity < 1) {
      setError(
        "Quantity must be at least 1."
      );
      return;
    }

    if (newQuantity > stock) {
      setError(
        `Only ${stock} item(s) available.`
      );
      return;
    }

    try {
      await api.put(
        `/cart/${cartItemId}`,
        {
          quantity: newQuantity,
        }
      );

      setMessage(
        "Cart updated successfully."
      );

      await loadCart();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update cart."
      );
    }
  };

  const removeItem = async (cartItemId) => {
    setError("");
    setMessage("");

    try {
      await api.delete(
        `/cart/${cartItemId}`
      );

      setMessage(
        "Product removed from cart."
      );

      await loadCart();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove product."
      );
    }
  };

  const checkout = async () => {
    setError("");
    setMessage("");
    setCheckingOut(true);

    try {
      const response = await api.post(
        "/checkout"
      );

      setMessage(response.data.message);

      await loadCart();

      setTimeout(() => {
        navigate("/orders");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Checkout failed."
      );
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">
          Shopping
        </p>

        <h1>Your Cart</h1>

        <p className="cart-count">
          {cart.total_items} item(s)
        </p>
      </div>

      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {cart.items.length === 0 ? (
        <div className="empty-card">
          <h2>Your cart is empty</h2>

          <p>
            Add some products before
            checking out.
          </p>

          <Link
            to="/"
            className="primary-btn"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div
                className="cart-item"
                key={item.cart_item_id}
              >
                <div className="cart-product-image">
                  {item.product.name}
                </div>

                <div className="cart-product-info">
                  <p className="eyebrow">
                    {item.product.category ||
                      "Product"}
                  </p>

                  <h2>
                    {item.product.name}
                  </h2>

                  <p className="cart-description">
                    {item.product.description}
                  </p>

                  <p className="cart-unit-price">
                    ₹
                    {Number(
                      item.product.price
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p className="cart-stock">
                    Available stock:{" "}
                    {item.product.stock}
                  </p>
                </div>

                <div className="cart-actions">
                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(event) => {
                      const newQuantity =
                        Number(
                          event.target.value
                        );

                      setCart(
                        (currentCart) => ({
                          ...currentCart,

                          items:
                            currentCart.items.map(
                              (
                                cartItem
                              ) =>
                                cartItem.cart_item_id ===
                                item.cart_item_id
                                  ? {
                                      ...cartItem,
                                      quantity:
                                        newQuantity,
                                    }
                                  : cartItem
                            ),
                        })
                      );
                    }}
                  />

                  <button
                    className="secondary-btn cart-update-btn"
                    onClick={() =>
                      updateQuantity(
                        item.cart_item_id,
                        item.quantity,
                        item.product.stock
                      )
                    }
                  >
                    Update
                  </button>

                  <button
                    className="remove-btn"
                    onClick={() =>
                      removeItem(
                        item.cart_item_id
                      )
                    }
                  >
                    Remove
                  </button>

                  <p className="subtotal">
                    Subtotal
                    <strong>
                      ₹
                      {Number(
                        item.subtotal
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Items</span>

              <span>
                {cart.total_items}
              </span>
            </div>

            <div className="summary-row">
              <span>Total</span>

              <strong>
                ₹
                {Number(
                  cart.total_price
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <button
              className="primary-btn full-width"
              onClick={checkout}
              disabled={checkingOut}
            >
              {checkingOut
                ? "Placing Order..."
                : "Checkout"}
            </button>

            <Link
              to="/"
              className="continue-link"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Cart;