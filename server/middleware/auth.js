const jwt = require('jsonwebtoken');
const Volunteer = require('../models/Volunteer');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const dtell me javascript code in this projectecoded = jwt.verify(token, process.env.JWT_SECRET);
    const volunteer = await Volunteer.findById(decoded.volunteerId);
    
    if (!volunteer) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.volunteerId = volunteer._id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
