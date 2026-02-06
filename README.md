# Help Hub

A platform connecting people who need help with volunteers in their community.

## Features

- **Customer Request System**: Fill out forms and make payments for help services
- **Volunteer Registration**: Volunteers can register with their profession and location
- **Smart Matching**: Automatic matching based on location and help type
- **OTP Verification**: Secure verification system to ensure work completion
- **Real-time Updates**: Live notifications for volunteers and customers

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Payment**: Stripe integration
- **Authentication**: JWT tokens
- **Real-time**: Socket.io

## Getting Started

1. Install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
```bash
cp server/.env.example server/.env
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
help-hub/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package.json
└── README.md        # This file
```

## Environment Variables

Create a `.env` file in the server directory with:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/help-hub
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
