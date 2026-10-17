const express = require('express');
const router = express.Router();
const idempotencyMiddleware = require('../middleware/idempotency');
const { createOrder, getOrderById, processPayment } = require('../controllers/orderController');

// POST /api/orders - Create order (idempotency-protected)
router.post('/', idempotencyMiddleware, createOrder);

// GET /api/orders/:id - Get order by orderId
router.get('/:id', getOrderById);

// POST /api/orders/:id/payment - Simulate payment
router.post('/:id/payment', processPayment);

module.exports = router;
