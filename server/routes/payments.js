const express = require('express');
// Payments disabled for now
const Request = require('../models/Request');

const router = express.Router();

// No gateway init when disabled

// @route   POST /api/payments/verify
// @desc    Verify Razorpay signature and update request
// @access  Public
router.post('/verify', async (req, res) => {
  return res.status(501).json({ message: 'Payments are disabled in this environment' });
});

// Refunds with Razorpay typically require dashboard or capture-then-refund APIs.
// Implement later if needed.

module.exports = router;
