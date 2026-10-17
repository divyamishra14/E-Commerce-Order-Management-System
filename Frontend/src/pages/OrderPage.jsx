import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrder, processPayment } from '../api';
import toast from 'react-hot-toast';

const StatusBadge = ({ status, type }) => {
  const cls =
    type === 'payment'
      ? status === 'Paid'
        ? 'badge-paid'
        : status === 'Failed'
        ? 'badge-failed'
        : 'badge-pending'
      : status === 'Confirmed'
      ? 'badge-confirmed'
      : status === 'Cancelled'
      ? 'badge-cancelled'
      : 'badge-pending';

  const icon =
    status === 'Paid' || status === 'Confirmed'
      ? '✅'
      : status === 'Failed' || status === 'Cancelled'
      ? '❌'
      : '⏳';

  return (
    <span className={`badge ${cls}`}>
      {icon} {status}
    </span>
  );
};

const OrderPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await fetchOrder(id);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handlePayment = async (result) => {
    setPaymentLoading(true);
    try {
      const res = await processPayment(id, result);
      setOrder(res.data.data);
      if (result === 'success') {
        toast.success('💳 Payment successful! Order confirmed.');
      } else {
        toast.error('❌ Payment failed. You can try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner-lg" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-page">
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>
            <strong>Order Not Found</strong>
            <p style={{ marginTop: '4px' }}>{error}</p>
          </div>
        </div>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '20px' }}>
          ← Back to Shop
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const isPending = order.orderStatus === 'Pending';
  const isCancelled = order.orderStatus === 'Cancelled';
  const isPaymentPending = order.paymentStatus === 'Pending' || order.paymentStatus === 'Failed';
  const canPay = isPending && isPaymentPending;

  return (
    <div className="order-page">
      {/* Success Header */}
<div className={`order-success-header is-${order.orderStatus.toLowerCase()}`}>
  <span className="order-success-icon">
    {order.orderStatus === 'Confirmed' ? '🎉' : isCancelled ? '❌' : '📦'}
  </span>
  <h1 className="page-title">
    {order.orderStatus === 'Confirmed'
      ? 'Order Confirmed!'
      : isCancelled
      ? 'Order Cancelled'
      : 'Order Placed!'}
  </h1>
  <p className="order-success-subtitle">
    {order.orderStatus === 'Confirmed'
      ? 'Thank you for your purchase. Your payment was successful.'
      : isCancelled
      ? 'This order has been cancelled.'
      : 'Your order is pending payment confirmation.'}
  </p>
</div>

      {/* Order ID */}
      <div className="order-id-box">
        <div className="order-id-label">Order ID</div>
        <div className="order-id-value">{order.orderId}</div>
      </div>

      {/* Possible Duplicate Warning */}
      {order.possibleDuplicate && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <span>⚠️</span>
          <div>
            <strong>Possible Duplicate Order</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              We noticed a similar order was recently placed with the same products. If this was
              intentional, no action is needed. If not, contact support.
            </p>
          </div>
        </div>
      )}

      {/* Order Detail Cards */}
      <div className="order-details-grid">
        <div className="order-detail-card">
          <div className="order-detail-label">Customer</div>
          <div className="order-detail-value">{order.customerName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {order.customerEmail}
          </div>
        </div>
        <div className="order-detail-card">
          <div className="order-detail-label">Order Date</div>
          <div className="order-detail-value">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {new Date(order.createdAt).toLocaleTimeString()}
          </div>
        </div>
        <div className="order-detail-card">
          <div className="order-detail-label">Order Status</div>
          <div className="order-detail-value" style={{ marginTop: '4px' }}>
            <StatusBadge status={order.orderStatus} type="order" />
          </div>
        </div>
        <div className="order-detail-card">
          <div className="order-detail-label">Payment Status</div>
          <div className="order-detail-value" style={{ marginTop: '4px' }}>
            <StatusBadge status={order.paymentStatus} type="payment" />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>🛍️ Items Ordered</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th style={{ textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{item.productName}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  ${item.priceAtOrder.toFixed(2)}
                </td>
                <td>{item.quantity}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-accent)', fontWeight: 700 }}>
                  ${(item.priceAtOrder * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, paddingTop: '12px' }}>
                Total:
              </td>
              <td
                style={{
                  textAlign: 'right',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'var(--text-accent)',
                  paddingTop: '12px',
                }}
              >
                ${order.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Section */}
      {canPay && !isCancelled && (
        <div className="payment-section">
          <h3 className="payment-title">💳 Simulate Payment</h3>
          <p className="payment-subtitle">
            This is a payment simulation. Choose an outcome to test the system's behavior.
            <br />
            <span style={{ color: 'var(--accent-warning)', fontSize: '0.8rem' }}>
              ⚠️ Note: In a real app, payment is verified server-side by the payment provider.
            </span>
          </p>

          <div className="payment-buttons">
            <button
              id="payment-success-btn"
              className="btn btn-success btn-lg"
              disabled={paymentLoading}
              onClick={() => handlePayment('success')}
            >
              {paymentLoading ? <span className="spinner" /> : '✅ Simulate Success'}
            </button>
            <button
              id="payment-failure-btn"
              className="btn btn-danger btn-lg"
              disabled={paymentLoading}
              onClick={() => handlePayment('failure')}
            >
              {paymentLoading ? <span className="spinner" /> : '❌ Simulate Failure'}
            </button>
          </div>
        </div>
      )}

      {/* Payment failed — can retry */}
      {order.paymentStatus === 'Failed' && !isCancelled && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span>❌</span>
          <div>
            <strong>Payment Failed</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Your payment was not processed. You can try again above.
            </p>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="order-actions">
  <button id="refresh-order-btn" className="btn btn-secondary" onClick={loadOrder}>
    🔄 Refresh Status
  </button>
  <Link to="/" className="btn btn-primary">
    🛒 Continue Shopping
  </Link>
</div>
    </div>
  );
};

export default OrderPage;
