import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api';
import toast from 'react-hot-toast';

const CartPanel = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount, idempotencyKey } =
    useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Close the cart with the Escape key (cart data is kept in CartContext)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Please fill in your name and email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsPlacingOrder(true); // Disable button immediately (frontend guard)

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
        })),
      };

      const res = await createOrder(orderData, idempotencyKey);
      const order = res.data.data;

      toast.success(
        res.data.isIdempotentResponse
          ? '↩️ Order already placed — showing existing order'
          : '✅ Order placed successfully!'
      );

      clearCart();
      setShowCheckout(false);
      setCustomerName('');
      setCustomerEmail('');
      onClose?.(); // Close the panel before leaving the page
      navigate(`/order/${order.orderId}`);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      {/* Backdrop: only rendered while the cart is open */}
      {isOpen && <div className="cart-backdrop" onClick={onClose} />}

      <aside className={`cart-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title">
            🛒 Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {items.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (window.confirm('Clear all items from cart?')) {
                    clearCart();
                    setShowCheckout(false);
                  }
                }}
              >
                Clear
              </button>
            )}

            <button
              className="cart-close-btn"
              onClick={onClose}
              aria-label="Close cart"
              title="Close cart"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p>Your cart is empty</p>
            <p style={{ fontSize: '0.8rem' }}>Add products to get started</p>
          </div>
        ) : (
          <div className="cart-items">
            {items.map(({ product, quantity }) => (
              <div className="cart-item" key={product._id}>
                <div className="cart-item-info">
                  <div className="cart-item-name">{product.name}</div>
                  <div className="cart-item-price">
                    ${(product.price * quantity).toFixed(2)}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
                      (${product.price.toFixed(2)} ea.)
                    </span>
                  </div>
                </div>
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    id={`qty-dec-${product._id}`}
                    onClick={() => updateQuantity(product._id, quantity - 1, product.stock)}
                  >
                    −
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    className="qty-btn"
                    id={`qty-inc-${product._id}`}
                    onClick={() => updateQuantity(product._id, quantity + 1, product.stock)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                  <button
                    className="qty-btn"
                    id={`remove-${product._id}`}
                    onClick={() => removeFromCart(product._id)}
                    style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">Subtotal ({totalItems} items)</span>
              <span className="cart-total-amount">${totalAmount.toFixed(2)}</span>
            </div>

            {!showCheckout ? (
              <button
                id="checkout-btn"
                className="btn btn-primary btn-full"
                onClick={() => setShowCheckout(true)}
              >
                Proceed to Checkout →
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '0.95rem' }}>Customer Details</h4>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      id="customer-name-input"
                      className="form-input"
                      type="text"
                      placeholder="John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isPlacingOrder}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      id="customer-email-input"
                      className="form-input"
                      type="email"
                      placeholder="john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      disabled={isPlacingOrder}
                    />
                  </div>

                  {error && (
                    <div className="alert alert-error" style={{ marginTop: '10px' }}>
                      ⚠️ {error}
                    </div>
                  )}
                </div>

                <button
                  id="place-order-btn"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                >
                  {isPlacingOrder ? (
                    <>
                      <span className="spinner" />
                      Processing...
                    </>
                  ) : (
                    `🎯 Place Order — $${totalAmount.toFixed(2)}`
                  )}
                </button>

                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => {
                    setShowCheckout(false);
                    setError('');
                  }}
                  disabled={isPlacingOrder}
                >
                  ← Back to Cart
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default CartPanel;
