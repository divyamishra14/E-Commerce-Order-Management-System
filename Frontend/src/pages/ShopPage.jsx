import { useState, useEffect } from 'react';
import { fetchProducts } from '../api';
import ProductCard from '../components/ProductCard';
import CartPanel from '../components/CartPanel';
import toast from 'react-hot-toast';

const ShopPage = ({ cartOpen, onCartClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const res = await fetchProducts();
        setProducts(res.data.data);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          'Failed to load products. Is the backend running?';

        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const categories = [
    'All',
    ...new Set(products.map((p) => p.category)),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="shop-layout">
        {/* Main content */}
        <main className="shop-main">
          <div className="page-header">
            <h1 className="page-title">✨ Our Products</h1>

            <p className="page-subtitle">
              Premium Products — fast shipping, great prices
            </p>
          </div>

          {/* Search and category filters */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div
              className="search-input-wrapper"
              style={{ flex: '1', minWidth: '200px' }}
            >
              <span className="search-icon">🔍</span>

              <input
                id="product-search"
                className="form-input search-input"
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`cat-${cat}`}
                  className={`btn btn-sm ${
                    selectedCategory === cat
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-lg" />
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <span>⚠️</span>

              <div>
                <strong>Connection Error</strong>

                <p
                  style={{
                    marginTop: '4px',
                    fontSize: '0.85rem',
                  }}
                >
                  {error}
                </p>

                <p
                  style={{
                    marginTop: '4px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Make sure the backend is running on port 5000.
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="loading-container">
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <p>No products found matching your search.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              ))}
            </div>
          )}
        </main>

        {/* Cart panel and its backdrop are handled by CartPanel */}
        <CartPanel
          isOpen={cartOpen}
          onClose={onCartClose}
        />
      </div>
    </div>
  );
};

export default ShopPage;
