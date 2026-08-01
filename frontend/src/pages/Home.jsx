import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import productImages from "../utils/productImages";
import hero from "../assets/hero.png";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get("/products");
        console.log(response.data.products); // Temporary debugging
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
        <div className="hero-content">
          <p className="hero-label">Welcome to ShopZone</p>

          <h1>Find products you'll love.</h1>

          <p>
            Browse our latest products and shop from anywhere.
          </p>

          <a href="#products" className="primary-btn">
            Shop Now
          </a>
        </div>

        <div className="hero-image">
          <img src={hero} alt="ShopZone Hero" />
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

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products available.</p>
        )}

        <div className="product-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <img
                src={
                  productImages[product.name] ||
                  "https://via.placeholder.com/400x300?text=No+Image"
                }
                alt={product.name}
                className="product-image"
              />

              <h3>{product.name}</h3>

              <p className="category">
                {product.category || "General"}
              </p>

              <p className="price">
                ₹{Number(product.price).toLocaleString("en-IN")}
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