import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [volunteer, setVolunteer] = useState(null);
  const [requests, setRequests] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [availability, setAvailability] = useState('available');

  useEffect(() => {
    const token = localStorage.getItem('volunteerToken');
    if (!token) {
      navigate('/volunteer/login');
      return;
    }

    fetchVolunteerData();
    fetchAvailableRequests();
    fetchMyJobs();
    fetchStats();
  }, [navigate]);

  const fetchVolunteerData = async () => {
    try {
      const token = localStorage.getItem('volunteerToken');
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVolunteer(response.data.volunteer);
      setAvailability(response.data.volunteer.availability);
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
      localStorage.removeItem('volunteerToken');
      localStorage.removeItem('volunteer');
      navigate('/volunteer/login');
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      const token = localStorage.getItem('volunteerToken');
      const response = await axios.get('/api/volunteers/dashboard/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const token = localStorage.getItem('volunteerToken');
      const response = await axios.get('/api/volunteers/dashboard/my-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('volunteerToken');
      const response = await axios.get('/api/volunteers/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('volunteerToken');
      await axios.put(`/api/requests/${requestId}/assign`, {
        volunteerId: volunteer.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Request accepted successfully! You will receive an OTP to share with the customer.');
      fetchAvailableRequests();
      fetchMyJobs();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleAvailabilityChange = async (newAvailability) => {
    try {
      const token = localStorage.getItem('volunteerToken');
      await axios.put('/api/volunteers/dashboard/availability', {
        availability: newAvailability
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailability(newAvailability);
      alert('Availability updated successfully!');
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('volunteerToken');
    localStorage.removeItem('volunteer');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {volunteer?.firstName}!
              </h1>
              <p className="text-gray-600">Manage your volunteer activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={availability}
                  onChange={(e) => handleAvailabilityChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-blue-50 border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalJobs}</div>
                <div className="text-blue-800">Total Jobs</div>
              </div>
            </div>
            <div className="card bg-green-50 border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.completedJobs}</div>
                <div className="text-green-800">Completed</div>
              </div>
            </div>
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.assignedJobs}</div>
                <div className="text-yellow-800">In Progress</div>
              </div>
            </div>
            <div className="card bg-purple-50 border-purple-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.averageRating}</div>
                <div className="text-purple-800">Avg Rating</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('my-jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Jobs ({myJobs.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Available Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Requests in {volunteer?.location?.city}
                </h3>
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <p className="text-gray-600">No available requests at the moment</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Check back later or update your skills to see more opportunities
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requests.map((request) => (
                      <div key={request.id} className="card border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{request.category}</h4>
                            <p className="text-sm text-gray-600">{request.urgency} priority</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">${request.amount}</div>
                            <div className="text-sm text-gray-500">{request.estimatedDuration}</div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{request.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📍</span>
                            {request.location.address}, {request.location.city}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📅</span>
                            {new Date(request.scheduledDate).toLocaleString()}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="w-full btn-primary"
                        >
                          Accept Request
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Jobs Tab */}
            {activeTab === 'my-jobs' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Jobs</h3>
                {myJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">💼</div>
                    <p className="text-gray-600">You haven't accepted any jobs yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Check the Available Requests tab to find opportunities
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobs.map((job) => (
                      <div key={job.id} className="card border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{job.service.category}</h4>
                            <p className="text-sm text-gray-600">
                              Customer: {job.customer.firstName} {job.customer.lastName}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">${job.amount}</div>
                            <div className={`text-sm px-2 py-1 rounded-full ${
                              job.status === 'completed' ? 'bg-green-100 text-green-800' :
                              job.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{job.service.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📍</span>
                            {job.location.address}, {job.location.city}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📅</span>
                            {new Date(job.scheduledDate).toLocaleString()}
                          </div>
                          {job.completedAt && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="mr-2">✅</span>
                              Completed: {new Date(job.completedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {job.customerRating && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Customer Rating:</span>
                              <div className="flex ml-2">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-lg ${
                                    i < job.customerRating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}>★</span>
                                ))}
                              </div>
                            </div>
                            {job.customerFeedback && (
                              <p className="text-sm text-gray-600 italic">"{job.customerFeedback}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
