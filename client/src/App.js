import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RequestForm from './pages/RequestForm';
import VolunteerRegister from './pages/VolunteerRegister';
import VolunteerLogin from './pages/VolunteerLogin';
import VolunteerDashboard from './pages/VolunteerDashboard';
import RequestStatus from './pages/RequestStatus';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/request" element={<RequestForm />} />
              <Route path="/volunteer/register" element={<VolunteerRegister />} />
              <Route path="/volunteer/login" element={<VolunteerLogin />} />
              <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
              <Route path="/request/:id" element={<RequestStatus />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
  );
}

export default App;
