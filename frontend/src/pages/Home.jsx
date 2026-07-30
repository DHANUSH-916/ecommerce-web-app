import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data.products);
      } catch (err) {
        console.error(err);
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="hero-label">
            Welcome to ShopZone
          </p>

          <h1>Find products you'll love.</h1>

          <p>
            Browse our latest products and shop from
            anywhere.
          </p>

          <a href="#products" className="primary-btn">
            Shop Now
          </a>
        </div>
      </section>

      <section className="section" id="products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Our Store</p>
            <h2>Featured Products</h2>
          </div>
        </div>

        {loading && <p>Loading products...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products available.</p>
        )}

        <div className="product-grid">
          {products.map((product) => (
            <div
              className="product-card"
              key={product.id}
            >
              <div className="product-placeholder">
                {product.name}
              </div>

              <h3>{product.name}</h3>

              <p className="category">
                {product.category || "General"}
              </p>

              <p className="price">
                ₹
                {Number(product.price).toLocaleString(
                  "en-IN"
                )}
              </p>

              <p>Stock: {product.stock}</p>

              <Link
                to={`/products/${product.id}`}
                className="primary-btn"
              >
                View Product
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;