const Order = require('../models/Order');
const { sendOrderCancelledEmail } = require('../utils/emailService');

/**
 * GET /api/admin/orders
 * Returns all orders with optional search (orderId or email) and payment status filter.
 */
const getOrders = async (req, res) => {
  const { search, paymentStatus, page = 1, limit = 20 } = req.query;

  const query = {};

  // Search by orderId or customerEmail
  if (search && search.trim()) {
    query.$or = [
      { orderId: { $regex: search.trim(), $options: 'i' } },
      { customerEmail: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  // Filter by payment status
  if (paymentStatus && ['Pending', 'Paid', 'Failed'].includes(paymentStatus)) {
    query.paymentStatus = paymentStatus;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('items.product', 'name price');

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    data: orders,
  });
};

/**
 * PATCH /api/admin/orders/:id/status
 * Updates order status. Enforces state machine rules.
 * - Cannot confirm a cancelled order
 * - Cannot cancel an order that is already cancelled
 */
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be one of: Pending, Confirmed, Cancelled',
    });
  }

  const order = await Order.findOne({ orderId: req.params.id });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // State machine rules
  if (order.orderStatus === 'Cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a cancelled order. Once cancelled, an order cannot be reactivated.',
    });
  }

  if (order.orderStatus === status) {
    return res.status(400).json({
      success: false,
      message: `Order is already in ${status} status`,
    });
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = status;
  await order.save();

  // Send cancellation email if order was just cancelled
  if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
    try {
      await sendOrderCancelledEmail(order);
    } catch (emailError) {
      console.error('[Admin] Cancellation email failed:', emailError.message);
    }
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order,
  });
};

/**
 * GET /api/admin/orders/possible-duplicates
 * Returns orders flagged as possible duplicates.
 */
const getPossibleDuplicates = async (req, res) => {
  const duplicates = await Order.find({ possibleDuplicate: true })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name price');

  res.status(200).json({
    success: true,
    count: duplicates.length,
    data: duplicates,
  });
};

module.exports = { getOrders, updateOrderStatus, getPossibleDuplicates };
