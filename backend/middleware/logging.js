const morgan = require('morgan');

// Define a custom token for morgan to extract user information from our JWT payload
morgan.token('user', (req) => {
  // Check if req.auth exists and has the email (subject claim from JWT)
  if (req.auth && req.auth.sub) {
    return `user:${req.auth.sub} (role:${req.auth.role})`;
  }
  // If no auth info, label the request as anonymous
  return 'anonymous';
});

// Define a custom, detailed logging format for development
const devFormat = ':method :url :status :response-time ms - :user';

// Use the predefined 'combined' format for production for more standardized logging
const prodFormat = 'combined';

// Choose the format based on the Node.js environment
const logFormat = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

// Create and export the logging middleware
const requestLogger = morgan(logFormat, {
  // Optional: skip logging for successful health checks to keep logs clean
  skip: (req, res) => {
    return req.url === '/health' && res.statusCode === 200;
  }
});

module.exports = {
  requestLogger
};