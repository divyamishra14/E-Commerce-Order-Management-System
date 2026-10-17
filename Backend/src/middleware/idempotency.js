const IdempotencyRecord = require('../models/IdempotencyRecord');
const Order = require('../models/Order');

/**
 * Idempotency middleware for POST /api/orders
 * Checks if a request with the same Idempotency-Key has already been processed.
 * If yes, returns the existing order instead of creating a new one.
 */
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required',
    });
  }

  try {
    // Check if this key has been used before
    const existingRecord = await IdempotencyRecord.findOne({ key: idempotencyKey });

    if (existingRecord) {
      // Key was used — return the existing order
      const existingOrder = await Order.findOne({ orderId: existingRecord.orderId }).populate(
        'items.product',
        'name price'
      );

      if (existingOrder) {
        console.log(`[Idempotency] Returning existing order for key: ${idempotencyKey}`);
        return res.status(200).json({
          success: true,
          message: 'Order already exists (idempotent response)',
          data: existingOrder,
          isIdempotentResponse: true,
        });
      }
    }

    // Attach the key to the request for the controller to store
    req.idempotencyKey = idempotencyKey;
    next();
  } catch (error) {
    console.error('[Idempotency] Error checking idempotency record:', error);
    next(error);
  }
};

module.exports = idempotencyMiddleware;
