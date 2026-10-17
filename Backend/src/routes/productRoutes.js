const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/productController');

// GET /api/products
router.get('/', getProducts);

module.exports = router;
