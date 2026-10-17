const mongoose = require('mongoose');

const idempotencyRecordSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL index: auto-delete records after 24 hours
    expires: 86400,
  },
});

module.exports = mongoose.model('IdempotencyRecord', idempotencyRecordSchema);
