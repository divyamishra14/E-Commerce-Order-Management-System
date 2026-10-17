const Product = require('../models/Product');

/**
 * GET /api/products
 * Returns all products with their stock status
 */
const getProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
};

module.exports = { getProducts };
