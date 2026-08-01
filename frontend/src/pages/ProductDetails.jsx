import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../services/api";
import productImages from "../utils/productImages";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (quantity > product.stock) {
      setError(
        `Only ${product.stock} item(s) available.`
      );
      return;
    }

    setAdding(true);

    try {
      const response = await api.post("/cart", {
        product_id: product.id,
        quantity: Number(quantity),
      });

      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add product to cart."
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="page">
        <p className="error-message">{error}</p>

        <Link to="/" className="primary-btn">
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back to Products
      </Link>

      <div className="details-card">
        <div className="details-image">
          <img
            src={
              productImages[product.name] ||
              "https://via.placeholder.com/500x400?text=No+Image"
            }
            alt={product.name}
            className="product-detail-image"
          />
        </div>

        <div className="product-info">
          <p className="eyebrow">
            {product.category || "Product"}
          </p>

          <h1>{product.name}</h1>

          <p className="product-description">
            {product.description ||
              "No description available."}
          </p>

          <p className="details-price">
            ₹
            {Number(product.price).toLocaleString(
              "en-IN"
            )}
          </p>

          <p
            className={
              product.stock > 0
                ? "stock-available"
                : "stock-unavailable"
            }
          >
            {product.stock > 0
              ? `${product.stock} item(s) in stock`
              : "Out of stock"}
          </p>

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

          {product.stock > 0 && (
            <div className="purchase-area">
              <div className="quantity-box">
                <label htmlFor="quantity">
                  Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Number(event.target.value)
                    )
                  }
                />
              </div>

              <button
                className="primary-btn"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding
                  ? "Adding..."
                  : "Add to Cart"}
              </button>
            </div>
          )}

          {message && (
            <button
              className="secondary-btn"
              onClick={() => navigate("/cart")}
            >
              Go to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;