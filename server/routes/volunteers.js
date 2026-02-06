const express = require('express');
const { body, validationResult } = require('express-validator');
const Volunteer = require('../models/Volunteer');
const Request = require('../models/Request');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/volunteers/available
// @desc    Get available volunteers for a specific location and service
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const { city, state, category, limit = 10 } = req.query;

    if (!city || !state || !category) {
      return res.status(400).json({ 
        message: 'City, state, and category are required' 
      });
    }

    const volunteers = await Volunteer.find({
      'location.city': city,
      'location.state': state,
      availability: 'available',
      isActive: true,
      $or: [
        { profession: { $regex: category, $options: 'i' } },
        { skills: { $regex: category, $options: 'i' } }
      ]
    })
    .select('firstName lastName profession skills rating totalJobs completedJobs location')
    .sort({ rating: -1, completedJobs: -1 })
    .limit(parseInt(limit));

    res.json({
      volunteers: volunteers.map(volunteer => ({
        id: volunteer._id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        profession: volunteer.profession,
        skills: volunteer.skills,
        rating: volunteer.rating,
        totalJobs: volunteer.totalJobs,
        completedJobs: volunteer.completedJobs,
        location: volunteer.location
      }))
    });

  } catch (error) {
    console.error('Get available volunteers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/volunteers/:id
// @desc    Get volunteer profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id)
      .select('-password -email -phone');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({
      volunteer: {
        id: volunteer._id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        profession: volunteer.profession,
        skills: volunteer.skills,
        rating: volunteer.rating,
        totalJobs: volunteer.totalJobs,
        completedJobs: volunteer.completedJobs,
        location: volunteer.location,
        profileImage: volunteer.profileImage,
        isVerified: volunteer.isVerified
      }
    });

  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/volunteers/dashboard/requests
// @desc    Get available requests for logged-in volunteer
// @access  Private
router.get('/dashboard/requests', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Find requests in the same city/state that match volunteer's skills
    const requests = await Request.find({
      'location.city': volunteer.location.city,
      'location.state': volunteer.location.state,
      status: 'pending',
      $or: [
        { 'serviceDetails.category': { $regex: volunteer.profession, $options: 'i' } },
        { 'serviceDetails.category': { $in: volunteer.skills.map(skill => new RegExp(skill, 'i')) } }
      ]
    })
    .select('customerInfo serviceDetails location payment scheduledDate createdAt')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      requests: requests.map(request => ({
        id: request._id,
        category: request.serviceDetails.category,
        description: request.serviceDetails.description,
        urgency: request.serviceDetails.urgency,
        estimatedDuration: request.serviceDetails.estimatedDuration,
        location: request.location,
        amount: request.payment.amount,
        scheduledDate: request.scheduledDate,
        createdAt: request.createdAt
      }))
    });

  } catch (error) {
    console.error('Get volunteer requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/volunteers/dashboard/my-jobs
// @desc    Get volunteer's assigned and completed jobs
// @access  Private
router.get('/dashboard/my-jobs', auth, async (req, res) => {
  try {
    const { status = 'all', limit = 10 } = req.query;

    let query = { assignedVolunteer: req.volunteerId };
    
    if (status !== 'all') {
      query.status = status;
    }

    const requests = await Request.find(query)
      .select('customerInfo serviceDetails location payment status scheduledDate completedAt customerRating customerFeedback')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      jobs: requests.map(request => ({
        id: request._id,
        customer: {
          firstName: request.customerInfo.firstName,
          lastName: request.customerInfo.lastName
        },
        service: {
          category: request.serviceDetails.category,
          description: request.serviceDetails.description,
          urgency: request.serviceDetails.urgency
        },
        location: request.location,
        amount: request.payment.amount,
        status: request.status,
        scheduledDate: request.scheduledDate,
        completedAt: request.completedAt,
        customerRating: request.customerRating,
        customerFeedback: request.customerFeedback
      }))
    });

  } catch (error) {
    console.error('Get volunteer jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/volunteers/dashboard/availability
// @desc    Update volunteer availability status
// @access  Private
router.put('/dashboard/availability', auth, [
  body('availability').isIn(['available', 'busy', 'unavailable']).withMessage('Invalid availability status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { availability } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.volunteerId,
      { availability },
      { new: true }
    ).select('-password');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      volunteer: {
        id: volunteer._id,
        availability: volunteer.availability
      }
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/volunteers/dashboard/stats
// @desc    Get volunteer statistics
// @access  Private
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.volunteerId)
      .select('rating totalJobs completedJobs');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Get additional stats
    const assignedJobs = await Request.countDocuments({
      assignedVolunteer: req.volunteerId,
      status: { $in: ['assigned', 'in_progress'] }
    });

    const completedJobs = await Request.countDocuments({
      assignedVolunteer: req.volunteerId,
      status: 'completed'
    });

    const avgRating = await Request.aggregate([
      { $match: { assignedVolunteer: volunteer._id, customerRating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$customerRating' } } }
    ]);

    res.json({
      stats: {
        totalJobs: volunteer.totalJobs,
        completedJobs: volunteer.completedJobs,
        assignedJobs: assignedJobs,
        rating: volunteer.rating,
        averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0,
        completionRate: volunteer.totalJobs > 0 ? Math.round((volunteer.completedJobs / volunteer.totalJobs) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get volunteer stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
