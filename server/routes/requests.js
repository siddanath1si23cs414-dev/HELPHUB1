const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const Volunteer = require('../models/Volunteer');
// Payments temporarily disabled

const router = express.Router();

// @route   POST /api/requests
// @desc    Create a new help request
// @access  Public
router.post('/', [
  body('customerInfo.firstName').trim().notEmpty().withMessage('First name is required'),
  body('customerInfo.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('customerInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('customerInfo.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('serviceDetails.category').trim().notEmpty().withMessage('Service category is required'),
  body('serviceDetails.description').trim().notEmpty().withMessage('Service description is required'),
  body('serviceDetails.estimatedDuration').trim().notEmpty().withMessage('Estimated duration is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('payment.amount').isNumeric().isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerInfo,
      serviceDetails,
      location,
      payment,
      scheduledDate
    } = req.body;

    // Payment disabled: skip order creation

    // Create new request
    const request = new Request({
      customerInfo,
      serviceDetails,
      location,
      payment: {
        amount: payment.amount,
        currency: payment.currency || 'INR',
        provider: 'none',
        status: 'pending'
      },
      scheduledDate: new Date(scheduledDate)
    });

    await request.save();

    // Find matching volunteers
    const matchingVolunteers = await findMatchingVolunteers(location, serviceDetails.category);

    res.status(201).json({
      message: 'Request created successfully',
      request: {
        id: request._id,
        status: request.status,
        matchingVolunteers: matchingVolunteers.length
      }
    });

    // Notify matching volunteers via socket.io
    if (req.io && matchingVolunteers.length > 0) {
      matchingVolunteers.forEach(volunteer => {
        req.io.to(`volunteer_${volunteer._id}`).emit('new_request', {
          requestId: request._id,
          category: serviceDetails.category,
          description: serviceDetails.description,
          location: location,
          scheduledDate: request.scheduledDate,
          amount: payment.amount
        });
      });
    }

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error creating request' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get request details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('assignedVolunteer', 'firstName lastName email phone profession rating');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/assign
// @desc    Assign volunteer to request
// @access  Public (volunteer accepts via link)
router.put('/:id/assign', [
  body('volunteerId').isMongoId().withMessage('Valid volunteer ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { volunteerId } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer available' });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    if (volunteer.availability !== 'available') {
      return res.status(400).json({ message: 'Volunteer is not available' });
    }

    // Assign volunteer
    request.assignedVolunteer = volunteerId;
    request.status = 'assigned';
    await request.save();

    // Update volunteer availability
    volunteer.availability = 'busy';
    await volunteer.save();

    // Generate OTP
    const otp = request.generateOTP();
    await request.save();

    res.json({
      message: 'Request assigned successfully',
      request: {
        id: request._id,
        status: request.status,
        assignedVolunteer: {
          id: volunteer._id,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          phone: volunteer.phone,
          profession: volunteer.profession
        },
        otp: otp
      }
    });

    // Notify customer via socket.io
    if (req.io) {
      req.io.to(`customer_${request._id}`).emit('request_assigned', {
        requestId: request._id,
        volunteer: {
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          phone: volunteer.phone,
          profession: volunteer.profession
        },
        otp: otp
      });
    }

  } catch (error) {
    console.error('Assign request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to find matching volunteers
async function findMatchingVolunteers(location, category) {
  try {
    // Find volunteers in the same city with matching profession/skills
    const volunteers = await Volunteer.find({
      'location.city': location.city,
      'location.state': location.state,
      availability: 'available',
      isActive: true,
      $or: [
        { profession: { $regex: category, $options: 'i' } },
        { skills: { $regex: category, $options: 'i' } }
      ]
    }).select('firstName lastName profession skills rating location');

    return volunteers;
  } catch (error) {
    console.error('Find matching volunteers error:', error);
    return [];
  }
}

module.exports = router;
