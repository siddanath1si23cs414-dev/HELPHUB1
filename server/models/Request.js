const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  customerInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  serviceDetails: {
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    estimatedDuration: {
      type: String,
      required: true
    }
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  payment: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    provider: {
      type: String,
      enum: ['razorpay', 'none'],
      default: 'none'
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    default: null
  },
  otp: {
    code: {
      type: String,
      default: null
    },
    generatedAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  customerRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  customerFeedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Generate OTP method
requestSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp.code = otp;
  this.otp.generatedAt = new Date();
  this.otp.attempts = 0;
  return otp;
};

// Verify OTP method
requestSchema.methods.verifyOTP = function(inputOTP) {
  if (!this.otp.code || !this.otp.generatedAt) {
    return { valid: false, message: 'No OTP generated' };
  }

  // Check if OTP is expired (15 minutes)
  const now = new Date();
  const otpAge = now - this.otp.generatedAt;
  if (otpAge > 15 * 60 * 1000) {
    return { valid: false, message: 'OTP expired' };
  }

  // Check attempts
  if (this.otp.attempts >= 3) {
    return { valid: false, message: 'Too many attempts' };
  }

  this.otp.attempts += 1;

  if (this.otp.code === inputOTP) {
    this.otp.verifiedAt = new Date();
    this.status = 'completed';
    this.completedAt = new Date();
    return { valid: true, message: 'OTP verified successfully' };
  }

  return { valid: false, message: 'Invalid OTP' };
};

module.exports = mongoose.model('Request', requestSchema);
