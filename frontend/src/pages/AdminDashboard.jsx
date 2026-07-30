import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const statusOrder = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
];

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [productForm, setProductForm] =
    useState(emptyProduct);

  const [editingProductId, setEditingProductId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    const response = await api.get(
      "/admin/orders"
    );

    setOrders(response.data.orders || []);
  };

  const loadProducts = async () => {
    const response = await api.get(
      "/products"
    );

    setProducts(response.data.products || []);
  };

  const loadDashboard = async () => {
    try {
      setError("");

      await Promise.all([
        loadOrders(),
        loadProducts(),
      ]);
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setError("Admin access required.");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, [navigate]);

  const getNextStatus = (currentStatus) => {
    const index =
      statusOrder.indexOf(currentStatus);

    if (
      index === -1 ||
      index === statusOrder.length - 1
    ) {
      return null;
    }

    return statusOrder[index + 1];
  };

  const updateStatus = async (
    orderId,
    status
  ) => {
    setError("");
    setMessage("");
    setUpdatingId(orderId);

    try {
      const response = await api.put(
        `/admin/orders/${orderId}/status`,
        {
          status,
        }
      );

      setMessage(response.data.message);

      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update order."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;

    setProductForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProduct);
    setEditingProductId(null);
  };

  const handleProductSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setSavingProduct(true);

    const productData = {
      name: productForm.name.trim(),

      description:
        productForm.description.trim(),

      category:
        productForm.category.trim(),

      price: Number(productForm.price),

      stock: Number(productForm.stock),
    };

    try {
      let response;

      if (editingProductId) {
        response = await api.put(
          `/products/${editingProductId}`,
          productData
        );
      } else {
        response = await api.post(
          "/products",
          productData
        );
      }

      setMessage(response.data.message);

      resetProductForm();

      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save product."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditing = (product) => {
    setEditingProductId(product.id);

    setProductForm({
      name: product.name || "",
      description:
        product.description || "",
      category: product.category || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await api.delete(
        `/products/${product.id}`
      );

      setMessage(response.data.message);

      if (
        editingProductId === product.id
      ) {
        resetProductForm();
      }

      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete product."
      );
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">
          Administration
        </p>

        <h1>Admin Dashboard</h1>

        <p className="admin-subtitle">
          Manage products and customer
          orders.
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

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending Orders</span>

          <strong>
            {
              orders.filter(
                (order) =>
                  order.status === "Pending"
              ).length
            }
          </strong>
        </div>
      </div>

      {/* PRODUCT FORM */}

      <section className="admin-section">
        <div className="section-heading">
          <p className="eyebrow">
            Product Management
          </p>

          <h2>
            {editingProductId
              ? "Edit Product"
              : "Add Product"}
          </h2>
        </div>

        <form
          className="admin-product-form"
          onSubmit={handleProductSubmit}
        >
          <div className="admin-form-field">
            <label>Product Name</label>

            <input
              type="text"
              name="name"
              value={productForm.name}
              onChange={handleProductChange}
              placeholder="Example: Smartphone"
              required
            />
          </div>

          <div className="admin-form-field">
            <label>Category</label>

            <input
              type="text"
              name="category"
              value={productForm.category}
              onChange={handleProductChange}
              placeholder="Example: Electronics"
            />
          </div>

          <div className="admin-form-field">
            <label>Price</label>

            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={handleProductChange}
              placeholder="49999"
              required
            />
          </div>

          <div className="admin-form-field">
            <label>Stock</label>

            <input
              type="number"
              name="stock"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={handleProductChange}
              placeholder="10"
              required
            />
          </div>

          <div className="admin-form-field admin-description-field">
            <label>Description</label>

            <textarea
              name="description"
              value={productForm.description}
              onChange={handleProductChange}
              placeholder="Enter product description"
              rows="4"
            />
          </div>

          <div className="admin-form-buttons">
            <button
              type="submit"
              className="primary-btn"
              disabled={savingProduct}
            >
              {savingProduct
                ? "Saving..."
                : editingProductId
                  ? "Update Product"
                  : "Add Product"}
            </button>

            {editingProductId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetProductForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* PRODUCT LIST */}

      <section className="admin-section">
        <div className="section-heading">
          <p className="eyebrow">
            Inventory
          </p>

          <h2>Products</h2>
        </div>

        {products.length === 0 ? (
          <div className="empty-card">
            <h2>No products</h2>

            <p>
              Add your first product using
              the form above.
            </p>
          </div>
        ) : (
          <div className="admin-product-grid">
            {products.map((product) => (
              <div
                className="admin-product-card"
                key={product.id}
              >
                <div className="admin-product-image">
                  {product.name}
                </div>

                <p className="eyebrow">
                  {product.category ||
                    "General"}
                </p>

                <h3>{product.name}</h3>

                <p className="admin-product-description">
                  {product.description ||
                    "No description"}
                </p>

                <div className="admin-product-meta">
                  <strong>
                    ₹
                    {Number(
                      product.price
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <span>
                    Stock: {product.stock}
                  </span>
                </div>

                <div className="admin-product-actions">
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      startEditing(product)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="remove-btn"
                    onClick={() =>
                      deleteProduct(product)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ORDER MANAGEMENT */}

      <section className="admin-section">
        <div className="section-heading">
          <p className="eyebrow">
            Order Management
          </p>

          <h2>Customer Orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="empty-card">
            <h2>No orders</h2>

            <p>
              Customer orders will appear
              here.
            </p>
          </div>
        ) : (
          <div className="admin-orders">
            {orders.map((order) => {
              const nextStatus =
                getNextStatus(order.status);

              return (
                <div
                  className="admin-order-card"
                  key={order.id}
                >
                  <div className="admin-order-header">
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

                  {order.customer && (
                    <div className="admin-customer">
                      <strong>
                        {order.customer.name}
                      </strong>

                      <span>
                        {order.customer.email}
                      </span>
                    </div>
                  )}

                  <div className="order-information">
                    <div>
                      <span>User ID</span>

                      <strong>
                        {order.user_id}
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

                    <div>
                      <span>Created</span>

                      <strong>
                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleString()
                          : "-"}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-order-products">
                    {order.items?.map(
                      (item) => (
                        <div
                          className="order-product"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {
                                item.product_name
                              }
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
                      )
                    )}
                  </div>

                  <div className="admin-order-actions">
                    {nextStatus ? (
                      <button
                        className="primary-btn"
                        disabled={
                          updatingId ===
                          order.id
                        }
                        onClick={() =>
                          updateStatus(
                            order.id,
                            nextStatus
                          )
                        }
                      >
                        {updatingId ===
                        order.id
                          ? "Updating..."
                          : `Mark as ${nextStatus}`}
                      </button>
                    ) : (
                      <span className="delivered-text">
                        ✓ Order Delivered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;