const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const nodemailer = require('nodemailer');

const router = express.Router();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @route   POST /api/otp/generate
// @desc    Generate and send OTP for a request
// @access  Public
router.post('/generate', [
  body('requestId').isMongoId().withMessage('Valid request ID is required'),
  body('customerEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId, customerEmail } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({ message: 'Request is not assigned to a volunteer' });
    }

    // Generate OTP
    const otp = request.generateOTP();
    await request.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: 'Help Hub - Your OTP for Service Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Help Hub Service Verification</h2>
          <p>Hello ${request.customerInfo.firstName},</p>
          <p>Your service request has been assigned to a volunteer. Please share this OTP with your volunteer to verify the service completion:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 15 minutes</li>
            <li>Only share this OTP with your assigned volunteer</li>
            <li>The volunteer will use this OTP to confirm service completion</li>
          </ul>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Help Hub Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'OTP generated and sent successfully',
      request: {
        id: request._id,
        otpGenerated: true,
        validUntil: new Date(request.otp.generatedAt.getTime() + 15 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP for service completion
// @access  Public
router.post('/verify', [
  body('requestId').isMongoId().withMessage('Valid request ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId, otp } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify OTP
    const verification = request.verifyOTP(otp);
    await request.save();

    if (verification.valid) {
      // Update volunteer stats
      if (request.assignedVolunteer) {
        const Volunteer = require('../models/Volunteer');
        await Volunteer.findByIdAndUpdate(request.assignedVolunteer, {
          $inc: { completedJobs: 1 },
          $set: { availability: 'available' }
        });
      }

      res.json({
        message: verification.message,
        request: {
          id: request._id,
          status: request.status,
          completedAt: request.completedAt,
          verified: true
        }
      });

      // Notify customer via socket.io
      if (req.io) {
        req.io.to(`customer_${request._id}`).emit('service_completed', {
          requestId: request._id,
          completedAt: request.completedAt
        });
      }

    } else {
      res.status(400).json({
        message: verification.message,
        attempts: request.otp.attempts,
        request: {
          id: request._id,
          verified: false
        }
      });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// @route   GET /api/otp/status/:requestId
// @desc    Get OTP status for a request
// @access  Public
router.get('/status/:requestId', async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const otpStatus = {
      generated: !!request.otp.code,
      generatedAt: request.otp.generatedAt,
      verified: !!request.otp.verifiedAt,
      verifiedAt: request.otp.verifiedAt,
      attempts: request.otp.attempts,
      expired: false
    };

    // Check if OTP is expired
    if (request.otp.generatedAt) {
      const now = new Date();
      const otpAge = now - request.otp.generatedAt;
      otpStatus.expired = otpAge > 15 * 60 * 1000;
    }

    res.json({
      request: {
        id: request._id,
        status: request.status,
        otp: otpStatus
      }
    });

  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({ message: 'Failed to get OTP status' });
  }
});

// @route   POST /api/otp/resend
// @desc    Resend OTP for a request
// @access  Public
router.post('/resend', [
  body('requestId').isMongoId().withMessage('Valid request ID is required'),
  body('customerEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId, customerEmail } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({ message: 'Request is not assigned to a volunteer' });
    }

    // Check if OTP was generated recently (prevent spam)
    if (request.otp.generatedAt) {
      const now = new Date();
      const timeSinceLastOTP = now - request.otp.generatedAt;
      if (timeSinceLastOTP < 2 * 60 * 1000) { // 2 minutes
        return res.status(400).json({ 
          message: 'Please wait before requesting another OTP',
          waitTime: Math.ceil((2 * 60 * 1000 - timeSinceLastOTP) / 1000)
        });
      }
    }

    // Generate new OTP
    const otp = request.generateOTP();
    await request.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: 'Help Hub - New OTP for Service Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Help Hub Service Verification</h2>
          <p>Hello ${request.customerInfo.firstName},</p>
          <p>Here is your new OTP for service verification:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 15 minutes</li>
            <li>Only share this OTP with your assigned volunteer</li>
            <li>The volunteer will use this OTP to confirm service completion</li>
          </ul>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>Help Hub Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'OTP resent successfully',
      request: {
        id: request._id,
        otpGenerated: true,
        validUntil: new Date(request.otp.generatedAt.getTime() + 15 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

module.exports = router;
