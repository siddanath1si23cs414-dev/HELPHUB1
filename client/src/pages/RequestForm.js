import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RequestForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    serviceDetails: {
      category: '',
      description: '',
      urgency: 'medium',
      estimatedDuration: ''
    },
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    payment: {
      amount: 0
    },
    scheduledDate: ''
  });

  const serviceCategories = [
    'Home Repairs', 'Cleaning', 'Tech Support', 'Moving Help',
    'Pet Care', 'Tutoring', 'Garden Care', 'Senior Care',
    'Delivery', 'Event Help', 'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait a few days', color: 'text-green-600' },
    { value: 'medium', label: 'Medium - Need within 24-48 hours', color: 'text-yellow-600' },
    { value: 'high', label: 'High - Need today', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent - Need immediately', color: 'text-red-600' }
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const calculateAmount = () => {
    const baseAmount = 25;
    const urgencyMultiplier = {
      'low': 1,
      'medium': 1.2,
      'high': 1.5,
      'urgent': 2
    };
    
    const durationMultiplier = formData.serviceDetails.estimatedDuration === 'More than 4 hours' ? 1.5 : 1;
    
    return Math.round(baseAmount * urgencyMultiplier[formData.serviceDetails.urgency] * durationMultiplier);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = calculateAmount();
      const requestData = {
        ...formData,
        payment: {
          amount: amount,
          currency: 'USD'
        }
      };

      const response = await axios.post('/api/requests', requestData);
      navigate(`/request/${response.data.request.id}`);
    } catch (error) {
      console.error('Request submission error:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            className="input-field"
            value={formData.customerInfo.firstName}
            onChange={(e) => handleInputChange('customerInfo', 'firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            className="input-field"
            value={formData.customerInfo.lastName}
            onChange={(e) => handleInputChange('customerInfo', 'lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            className="input-field"
            value={formData.customerInfo.email}
            onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            className="input-field"
            value={formData.customerInfo.phone}
            onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Service Details</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Service Category *</label>
        <select
          className="input-field"
          value={formData.serviceDetails.category}
          onChange={(e) => handleInputChange('serviceDetails', 'category', e.target.value)}
          required
        >
          <option value="">Select a category</option>
          {serviceCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          className="input-field h-32 resize-none"
          placeholder="Please describe what you need help with in detail..."
          value={formData.serviceDetails.description}
          onChange={(e) => handleInputChange('serviceDetails', 'description', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level *</label>
        <div className="space-y-2">
          {urgencyLevels.map(level => (
            <label key={level.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value={level.value}
                checked={formData.serviceDetails.urgency === level.value}
                onChange={(e) => handleInputChange('serviceDetails', 'urgency', e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className={level.color}>{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration *</label>
        <select
          className="input-field"
          value={formData.serviceDetails.estimatedDuration}
          onChange={(e) => handleInputChange('serviceDetails', 'estimatedDuration', e.target.value)}
          required
        >
          <option value="">Select duration</option>
          <option value="Less than 1 hour">Less than 1 hour</option>
          <option value="1-2 hours">1-2 hours</option>
          <option value="2-4 hours">2-4 hours</option>
          <option value="More than 4 hours">More than 4 hours</option>
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Location & Schedule</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
        <input
          type="text"
          className="input-field"
          placeholder="Street address"
          value={formData.location.address}
          onChange={(e) => handleInputChange('location', 'address', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <input
            type="text"
            className="input-field"
            value={formData.location.city}
            onChange={(e) => handleInputChange('location', 'city', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
          <input
            type="text"
            className="input-field"
            value={formData.location.state}
            onChange={(e) => handleInputChange('location', 'state', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
          <input
            type="text"
            className="input-field"
            value={formData.location.zipCode}
            onChange={(e) => handleInputChange('location', 'zipCode', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date & Time *</label>
        <input
          type="datetime-local"
          className="input-field"
          value={formData.scheduledDate}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
          min={new Date().toISOString().slice(0, 16)}
          required
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Payment Summary</h3>
      
      <div className="card bg-gray-50">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Service Category:</span>
            <span className="font-medium">{formData.serviceDetails.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Urgency:</span>
            <span className="font-medium capitalize">{formData.serviceDetails.urgency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{formData.serviceDetails.estimatedDuration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{formData.location.city}, {formData.location.state}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Scheduled:</span>
            <span className="font-medium">{new Date(formData.scheduledDate).toLocaleString()}</span>
          </div>
          <hr className="border-gray-300" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span className="text-blue-600">${calculateAmount()}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Payment Process:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pay securely with your credit/debit card</li>
          <li>• We'll match you with qualified volunteers</li>
          <li>• Receive an OTP to verify service completion</li>
          <li>• Your payment is only processed after service completion</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Request Help
          </h1>
          <p className="text-xl text-gray-600">
            Fill out the form below and we'll connect you with qualified volunteers
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Personal Info</span>
            <span>Service Details</span>
            <span>Location</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Submit Request & Pay'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;
