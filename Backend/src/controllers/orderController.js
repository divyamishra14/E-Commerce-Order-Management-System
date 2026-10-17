const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Product = require('../models/Product');
const IdempotencyRecord = require('../models/IdempotencyRecord');
const {
  sendOrderCreatedEmail,
  sendPaymentSuccessEmail,
} = require('../utils/emailService');

/**
 * Check if an order is a possible duplicate:
 * Same customer email, same product IDs + quantities, within 10 minutes.
 */
const checkForPossibleDuplicate = async (customerEmail, items, excludeOrderId) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const recentOrders = await Order.find({
    customerEmail,
    createdAt: { $gte: tenMinutesAgo },
    orderId: { $ne: excludeOrderId },
    orderStatus: { $ne: 'Cancelled' },
  });

  for (const recentOrder of recentOrders) {
    if (recentOrder.items.length !== items.length) continue;

    // Sort both item arrays by product ID for comparison
    const sortedNew = [...items].sort((a, b) =>
      a.product.toString().localeCompare(b.product.toString())
    );
    const sortedExisting = [...recentOrder.items].sort((a, b) =>
      a.product.toString().localeCompare(b.product.toString())
    );

    const isDuplicate = sortedNew.every((newItem, i) => {
      return (
        newItem.product.toString() === sortedExisting[i].product.toString() &&
        newItem.quantity === sortedExisting[i].quantity
      );
    });

    if (isDuplicate) return true;
  }

  return false;
};

/**
 * POST /api/orders
 * Creates a new order with stock validation and server-side price calculation.
 * Protected by idempotency middleware.
 */
const createOrder = async (req, res) => {
  const { customerName, customerEmail, items } = req.body;
  const idempotencyKey = req.idempotencyKey;

  // Validate required fields
  if (!customerName || !customerEmail || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'customerName, customerEmail, and items are required',
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  // Fetch all products from DB (never trust frontend prices)
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== productIds.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more products not found',
    });
  }

  // Stock validation and price calculation
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);

    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product with ID ${item.productId} not found`,
      });
    }

    if (item.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: `Quantity for ${product.name} must be at least 1`,
      });
    }

    // Stock check — prevent ordering more than available
    if (item.quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
      });
    }

    orderItems.push({
      product: product._id,
      productName: product.name,
      quantity: item.quantity,
      priceAtOrder: product.price, // ← Always from DB, never from frontend
    });

    totalAmount += product.price * item.quantity;
  }

  // Round to 2 decimal places
  totalAmount = Math.round(totalAmount * 100) / 100;

  const orderId = uuidv4();

  // Check for possible duplicates (informational — do NOT auto-cancel)
  const isPossibleDuplicate = await checkForPossibleDuplicate(
    customerEmail,
    orderItems,
    orderId
  );

  // Create the order
  const order = await Order.create({
    orderId,
    customerName,
    customerEmail,
    items: orderItems,
    totalAmount,
    orderStatus: 'Pending',
    paymentStatus: 'Pending',
    possibleDuplicate: isPossibleDuplicate,
    idempotencyKey,
  });

  // Store idempotency record (TTL: 24h)
  await IdempotencyRecord.create({ key: idempotencyKey, orderId });

  // Order is saved. Send the "order created" email in the background:
  // it never throws, never delays the response, and is sent only once per order.
  sendOrderCreatedEmail(order);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
};

/**
 * GET /api/orders/:id
 * Returns order details by orderId (UUID).
 */
const getOrderById = async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.id }).populate(
    'items.product',
    'name price imageUrl'
  );

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.status(200).json({ success: true, data: order });
};

/**
 * POST /api/orders/:id/payment
 * Simulates payment processing. Backend enforces all state rules.
 */
const processPayment = async (req, res) => {
  const { result } = req.body;

  if (!result || !['success', 'failure'].includes(result)) {
    return res.status(400).json({
      success: false,
      message: 'Payment result must be "success" or "failure"',
    });
  }

  const order = await Order.findOne({ orderId: req.params.id });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Cannot process payment for a cancelled order
  if (order.orderStatus === 'Cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot process payment for a cancelled order',
    });
  }

  // Prevent re-processing an already paid order
  if (order.paymentStatus === 'Paid') {
    return res.status(400).json({
      success: false,
      message: 'Payment has already been processed for this order',
    });
  }

  if (result === 'success') {
    order.paymentStatus = 'Paid';
    order.orderStatus = 'Confirmed';

    // Decrement stock for each item
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    await order.save();

    // Payment saved. Send the confirmation email in the background (once only).
    sendPaymentSuccessEmail(order);

    return res.status(200).json({
      success: true,
      message: 'Payment successful. Order confirmed!',
      data: order,
    });
  } else {
    // Failed payment
    order.paymentStatus = 'Failed';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Payment failed. Order remains pending.',
      data: order,
    });
  }
};

module.exports = { createOrder, getOrderById, processPayment };
