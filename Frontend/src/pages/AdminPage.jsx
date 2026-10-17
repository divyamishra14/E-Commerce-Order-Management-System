import { useState, useEffect, useCallback } from 'react';
import { fetchAdminOrders, updateOrderStatus, fetchPossibleDuplicates } from '../api';
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

  return <span className={`badge ${cls}`}>{status}</span>;
};

const OrderDetailModal = ({ order, onClose, onStatusUpdate }) => {
  const [cancelling, setCancelling] = useState(false);

  const canCancel = order.orderStatus !== 'Cancelled';

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order ${order.orderId.slice(0, 8)}...?`)) return;
    setCancelling(true);
    try {
      await updateOrderStatus(order.orderId, 'Cancelled');
      toast.success('Order cancelled successfully');
      onStatusUpdate();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">📦 Order Details</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Order ID */}
          <div className="order-id-box">
            <div className="order-id-label">Order ID</div>
            <div className="order-id-value">{order.orderId}</div>
          </div>

          {/* Duplicate warning */}
          {order.possibleDuplicate && (
            <div className="alert alert-warning">
              <span>⚠️</span>
              <div>
                <strong>Possible Duplicate</strong>
                <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                  Similar order placed by the same customer within 10 minutes. Review before
                  action. Do NOT cancel automatically — it may be intentional.
                </p>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div className="order-detail-card">
              <div className="order-detail-label">Customer</div>
              <div className="order-detail-value" style={{ fontSize: '0.9rem' }}>
                {order.customerName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {order.customerEmail}
              </div>
            </div>
            <div className="order-detail-card">
              <div className="order-detail-label">Order Date</div>
              <div className="order-detail-value" style={{ fontSize: '0.9rem' }}>
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {new Date(order.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <div className="order-detail-card">
              <div className="order-detail-label">Order Status</div>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={order.orderStatus} type="order" />
              </div>
            </div>
            <div className="order-detail-card">
              <div className="order-detail-label">Payment Status</div>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              🛍️ Items
            </h4>
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
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{item.productName}</td>
                    <td>${item.priceAtOrder.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-accent)', fontWeight: 700 }}>
                      ${(item.priceAtOrder * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                    Total:
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      color: 'var(--text-accent)',
                      fontSize: '1.05rem',
                    }}
                  >
                    ${order.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          {canCancel && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                id={`admin-cancel-${order.orderId}`}
                className="btn btn-danger"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? <span className="spinner" /> : '❌ Cancel Order'}
              </button>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Cancellation will notify the customer via email.
              </p>
            </div>
          )}

          {!canCancel && (
            <div className="alert alert-error">
              ⚠️ This order is already cancelled. No further status changes are allowed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (paymentFilter) params.paymentStatus = paymentFilter;

      const res = await fetchAdminOrders(params);
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, paymentFilter]);

  const loadDuplicateCount = useCallback(async () => {
    try {
      const res = await fetchPossibleDuplicates();
      setDuplicateCount(res.data.count);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    loadDuplicateCount();
  }, [loadDuplicateCount]);

  // Stats derived from current loaded orders
  const stats = {
    total,
    confirmed: orders.filter((o) => o.orderStatus === 'Confirmed').length,
    cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
    revenue: orders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((s, o) => s + o.totalAmount, 0),
  };

  return (
    <div className="admin-layout">
      <div className="page-header">
        <h1 className="page-title">🛠️ Admin Dashboard</h1>
        <p className="page-subtitle">Manage orders, track payments, and review duplicates</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📦</div>
          <div>
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-value">{stats.confirmed}</div>
            <div className="stat-label">Confirmed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div>
            <div className="stat-value">{duplicateCount}</div>
            <div className="stat-label">Possible Duplicates</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div>
            <div className="stat-value">${stats.revenue.toFixed(2)}</div>
            <div className="stat-label">Revenue (shown)</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-controls">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="admin-search"
            className="form-input search-input"
            type="text"
            placeholder="Search by Order ID or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="payment-filter"
          className="filter-select"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payments</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Failed">Failed</option>
        </select>

        <button
          id="admin-refresh-btn"
          className="btn btn-secondary"
          onClick={() => {
            loadOrders();
            loadDuplicateCount();
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Email</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner-lg" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-accent)',
                          background: 'rgba(124,58,237,0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {order.orderId.slice(0, 8)}…
                      </code>
                      {order.possibleDuplicate && (
                        <span className="badge badge-duplicate">⚠️ Duplicate?</span>
                      )}
                    </div>
                  </td>
                  <td className="order-email">{order.customerEmail}</td>
                  <td className="order-amount">${order.totalAmount.toFixed(2)}</td>
                  <td>
                    <StatusBadge status={order.paymentStatus} type="payment" />
                  </td>
                  <td>
                    <StatusBadge status={order.orderStatus} type="order" />
                  </td>
                  <td className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                    <br />
                    <span style={{ fontSize: '0.75rem' }}>
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        id={`view-order-${order.orderId}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        👁️ View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing {orders.length} of {total} orders
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={() => {
            loadOrders();
            loadDuplicateCount();
          }}
        />
      )}
    </div>
  );
};

export default AdminPage;
