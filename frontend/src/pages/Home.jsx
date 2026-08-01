import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import productImages from "../utils/productImages";
import hero from "../assets/hero.png";
import productRatings from "../utils/productRatings";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  

  const handleQuickAddToCart = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      await api.post("/cart", {
        product_id: productId,
        quantity: 1,
      });

      alert("Product added to cart!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to add product."
      );
    }
  };

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
        <div className="categories">
  <div
    className={`category-card ${selectedCategory === "All" ? "active-category" : ""}`}
    onClick={() => setSelectedCategory("All")}
  >
    🛍️
    <span>All</span>
  </div>

  <div
    className={`category-card ${selectedCategory === "Electronics" ? "active-category" : ""}`}
    onClick={() => setSelectedCategory("Electronics")}
  >
    📱
    <span>Electronics</span>
  </div>

  <div
    className={`category-card ${selectedCategory === "Wearables" ? "active-category" : ""}`}
    onClick={() => setSelectedCategory("Wearables")}
  >
    ⌚
    <span>Wearables</span>
  </div>

  <div
    className={`category-card ${selectedCategory === "Accessories" ? "active-category" : ""}`}
    onClick={() => setSelectedCategory("Accessories")}
  >
    🎧
    <span>Accessories</span>
  </div>
</div>

        <div className="search-container">
  <input
    type="text"
    placeholder="Search products..."
    className="search-input"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>

      <div className="sort-container">
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="sort-select"
  >
    <option value="default">Sort By</option>
    <option value="low">Price: Low to High</option>
    <option value="high">Price: High to Low</option>
    <option value="name">Name (A-Z)</option>
  </select>
</div>

        <div className="product-grid">
  {products
    .filter((product) =>
      product.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((product) =>
      selectedCategory === "All"
        ? true
        : product.category === selectedCategory
    )
    .sort((a, b) => {
      if (sortBy === "low") {
        return Number(a.price) - Number(b.price);
      }

      if (sortBy === "high") {
        return Number(b.price) - Number(a.price);
      }

      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      return 0;
    })
    .map((product) => (
            <div className="product-card" key={product.id}>
              <div className="product-image-box">
  <img
    src={
      productImages[product.name] ||
      "https://via.placeholder.com/400x300?text=No+Image"
    }
    alt={product.name}
    className="product-image"
  />
</div>

              <div className="product-badge">
  -{productRatings[product.name]?.discount || 0}%
</div>

<div className="product-rating">
  ⭐⭐⭐⭐⭐
  <span>
    {productRatings[product.name]?.rating || 4.5}
    {" "}
    ({productRatings[product.name]?.reviews || 100} Reviews)
  </span>
</div>

<h3>{product.name}</h3>

              <p className="category">
                {product.category || "General"}
              </p>

              <p className="price">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </p>

              <p>Stock: {product.stock}</p>

              <div className="product-buttons">
  <button
    className="primary-btn"
    onClick={() => handleQuickAddToCart(product.id)}
  >
    🛒 Add to Cart
  </button>

  <Link
    to={`/products/${product.id}`}
    className="secondary-btn"
  >
    View Details
  </Link>
</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;