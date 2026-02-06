const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (volunteerId) => {
  return jwt.sign({ volunteerId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new volunteer
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('profession').trim().notEmpty().withMessage('Profession is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.zipCode').trim().notEmpty().withMessage('Zip code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      profession,
      skills,
      location
    } = req.body;

    // Check if volunteer already exists
    const existingVolunteer = await Volunteer.findOne({ email });
    if (existingVolunteer) {
      return res.status(400).json({ message: 'Volunteer already exists with this email' });
    }

    // Create new volunteer
    const volunteer = new Volunteer({
      firstName,
      lastName,
      email,
      password,
      phone,
      profession,
      skills: skills || [],
      location
    });

    await volunteer.save();

    // Generate token
    const token = generateToken(volunteer._id);

    res.status(201).json({
      message: 'Volunteer registered successfully',
      token,
      volunteer: {
        id: volunteer._id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        profession: volunteer.profession,
        location: volunteer.location,
        availability: volunteer.availability
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login volunteer
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find volunteer
    const volunteer = await Volunteer.findOne({ email }).select('+password');
    if (!volunteer) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if volunteer is active
    if (!volunteer.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await volunteer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(volunteer._id);

    res.json({
      message: 'Login successful',
      token,
      volunteer: {
        id: volunteer._id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        profession: volunteer.profession,
        location: volunteer.location,
        availability: volunteer.availability,
        rating: volunteer.rating,
        totalJobs: volunteer.totalJobs,
        completedJobs: volunteer.completedJobs
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current volunteer
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.volunteerId).select('-password');
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({
      volunteer: {
        id: volunteer._id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        phone: volunteer.phone,
        profession: volunteer.profession,
        skills: volunteer.skills,
        location: volunteer.location,
        availability: volunteer.availability,
        rating: volunteer.rating,
        totalJobs: volunteer.totalJobs,
        completedJobs: volunteer.completedJobs,
        profileImage: volunteer.profileImage,
        isVerified: volunteer.isVerified
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update volunteer profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('profession').optional().trim().notEmpty(),
  body('availability').optional().isIn(['available', 'busy', 'unavailable'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.volunteerId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      volunteer: {
        id: volunteer._id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        phone: volunteer.phone,
        profession: volunteer.profession,
        skills: volunteer.skills,
        location: volunteer.location,
        availability: volunteer.availability,
        rating: volunteer.rating,
        totalJobs: volunteer.totalJobs,
        completedJobs: volunteer.completedJobs,
        profileImage: volunteer.profileImage,
        isVerified: volunteer.isVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
