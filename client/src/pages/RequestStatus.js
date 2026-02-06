import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const RequestStatus = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [otpStatus, setOtpStatus] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
    fetchOtpStatus();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      const response = await axios.get(`/api/requests/${id}`);
      setRequest(response.data.request);
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtpStatus = async () => {
    try {
      const response = await axios.get(`/api/otp/status/${id}`);
      setOtpStatus(response.data.request.otp);
    } catch (error) {
      console.error('Error fetching OTP status:', error);
    }
  };

  const handleGenerateOtp = async () => {
    try {
      await axios.post('/api/otp/generate', {
        requestId: id,
        customerEmail: request.customerInfo.email
      });
      
      alert('OTP generated and sent to your email!');
      fetchOtpStatus();
    } catch (error) {
      console.error('Error generating OTP:', error);
      alert('Failed to generate OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await axios.post('/api/otp/verify', {
        requestId: id,
        otp: otpCode
      });

      if (response.data.request.verified) {
        alert('Service completed successfully! Thank you for using Help Hub.');
        fetchRequestDetails();
        fetchOtpStatus();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to verify OTP. Please try again.');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Waiting for volunteer assignment';
      case 'assigned': return 'Volunteer assigned - OTP sent to your email';
      case 'in_progress': return 'Volunteer is on their way';
      case 'completed': return 'Service completed successfully';
      case 'cancelled': return 'Request was cancelled';
      default: return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600">The request you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Status</h1>
          <p className="text-gray-600">Track your help request</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Request Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {request.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{getStatusMessage(request.status)}</p>
              
              {/* Progress Steps */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    request.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    ✓
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Request Submitted</p>
                    <p className="text-sm text-gray-600">Your request has been received</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    ['assigned', 'in_progress', 'completed'].includes(request.status) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    ✓
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Volunteer Assigned</p>
                    <p className="text-sm text-gray-600">A volunteer has accepted your request</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    request.status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    ✓
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Service Completed</p>
                    <p className="text-sm text-gray-600">Your task has been completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{request.serviceDetails.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgency:</span>
                  <span className="font-medium capitalize">{request.serviceDetails.urgency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{request.serviceDetails.estimatedDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="font-medium">{new Date(request.scheduledDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-green-600">${request.payment.amount}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                <p className="text-gray-700">{request.serviceDetails.description}</p>
              </div>
            </div>

            {/* Location */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="space-y-2">
                <p className="text-gray-700">{request.location.address}</p>
                <p className="text-gray-700">{request.location.city}, {request.location.state} {request.location.zipCode}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Volunteer Info */}
            {request.assignedVolunteer && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Volunteer</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.assignedVolunteer.firstName} {request.assignedVolunteer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{request.assignedVolunteer.profession}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${
                          i < request.assignedVolunteer.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Phone: {request.assignedVolunteer.phone}
                  </div>
                </div>
              </div>
            )}

            {/* OTP Section */}
            {request.status === 'assigned' && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">OTP Verification</h3>
                
                {otpStatus?.generated ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        An OTP has been sent to your email. Share this OTP with your volunteer to verify service completion.
                      </p>
                      {otpStatus.expired && (
                        <p className="text-sm text-red-600 font-medium">
                          OTP has expired. Please generate a new one.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter OTP from Volunteer:
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        className="input-field text-center text-lg tracking-widest"
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || !otpCode || otpCode.length !== 6}
                      className="w-full btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify Service Completion'}
                    </button>
                    
                    <button
                      onClick={handleGenerateOtp}
                      className="w-full btn-secondary text-sm"
                    >
                      Resend OTP
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Generate an OTP to share with your volunteer for service verification.
                    </p>
                    <button
                      onClick={handleGenerateOtp}
                      className="btn-primary"
                    >
                      Generate OTP
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payment Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    request.payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {request.payment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-green-600">${request.payment.amount}</span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                If you have any questions or issues with your request, please contact our support team.
              </p>
              <button className="btn-secondary text-sm w-full">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestStatus;
