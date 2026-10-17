const express = require('express');
const router = express.Router();
const {
  getOrders,
  updateOrderStatus,
  getPossibleDuplicates,
} = require('../controllers/adminController');

// GET /api/admin/orders/possible-duplicates - Must be BEFORE /:id route
router.get('/possible-duplicates', getPossibleDuplicates);

// GET /api/admin/orders - Get all orders with search & filter
router.get('/', getOrders);

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
