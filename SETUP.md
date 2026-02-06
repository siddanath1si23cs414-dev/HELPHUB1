# Help Hub - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Stripe account for payments
- Gmail account for email notifications

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

### 2. Environment Setup

#### Backend Environment Variables
Create `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/help-hub
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment Variables
Create `client/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Database Setup

Make sure MongoDB is running:
```bash
# Start MongoDB (if installed locally)
mongod
```

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Backend only
npm run server

# Frontend only  
npm run client
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔧 Configuration

### Razorpay Setup
1. Create a Razorpay account and get test keys (`key_id`, `key_secret`).
2. Add them to backend `server/.env` and frontend `client/.env` as above.
3. Use test mode for development. Payments are verified server-side via signature.

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS` environment variable

## 📱 Features Overview

### For Customers (No Login Required)
- **Request Help**: Fill out a form describing the service needed
- **Payment**: Secure payment processing with Stripe
- **Tracking**: Real-time status updates
- **OTP Verification**: Secure verification system

### For Volunteers (Registration Required)
- **Registration**: Detailed profile with skills and location
- **Dashboard**: View available requests and manage jobs
- **Matching**: Automatic matching based on location and skills
- **Earnings**: Track completed jobs and ratings

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Authentication**: JWT-based volunteer authentication
- **Database**: MongoDB with Mongoose ODM
- **Payments**: Stripe integration
- **Real-time**: Socket.io for live updates
- **Email**: Nodemailer for OTP delivery

### Frontend (React)
- **UI Framework**: Tailwind CSS for modern design
- **State Management**: React hooks
- **Routing**: React Router
- **Payments**: Stripe Elements
- **Real-time**: Socket.io client

### Database Models
- **Volunteers**: Profile, skills, location, availability
- **Requests**: Customer info, service details, payment, status
- **OTP System**: Secure verification codes

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Secure authentication
- **OTP Verification**: Time-limited verification codes
- **Payment Security**: Stripe's secure payment processing
- **Input Validation**: Server-side validation for all inputs

## 📊 Key Workflows

### Customer Request Flow
1. Customer fills out request form
2. Payment processed via Stripe
3. System finds matching volunteers
4. First volunteer to accept gets the job
5. OTP generated and sent to customer
6. Volunteer completes service
7. Customer shares OTP with volunteer
8. Service marked as completed

### Volunteer Workflow
1. Volunteer registers with skills and location
2. Receives notifications for matching requests
3. Accepts requests on first-come-first-serve basis
4. Completes service and receives OTP from customer
5. Verifies completion using OTP
6. Receives payment and rating

## 🎨 UI/UX Features

- **Responsive Design**: Works on all devices
- **Modern Interface**: Clean, professional design
- **Progress Tracking**: Visual progress indicators
- **Real-time Updates**: Live status updates
- **Accessibility**: Screen reader friendly

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables
2. Deploy with MongoDB Atlas
3. Configure Stripe webhooks

### Frontend Deployment (Netlify/Vercel)
1. Build the React app
2. Set environment variables
3. Deploy with custom domain

## 🛠️ Development

### Adding New Features
- Backend: Add routes in `server/routes/`
- Frontend: Add components in `client/src/components/`
- Database: Update models in `server/models/`

### Testing
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB is running
4. Check Stripe dashboard for payment issues

## 🔄 Updates

To update the application:
1. Pull latest changes
2. Run `npm run install-all`
3. Update environment variables if needed
4. Restart the application

---

**Happy Helping! 🤝**
