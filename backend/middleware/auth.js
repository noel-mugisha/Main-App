const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');

// JWKS configuration
const jwksClient = jwks({
  jwksUri: process.env.JWKS_URI || 'http://localhost:8080/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

// JWT verification middleware
const verifyJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI || 'http://localhost:8080/.well-known/jwks.json'
  }),
  algorithms: ['RS256'],
  requestProperty: 'auth',
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
});

// Error handling middleware for JWT
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Authentication required'
    });
  }
  next(err);
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.role) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No user information found'
      });
    }

    const userRole = req.auth.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

const requireManagerOrAdmin = requireRole(['MANAGER', 'ADMIN']);

const requireAdmin = requireRole(['ADMIN']);

module.exports = {
  verifyJwt,
  jwtErrorHandler,
  requireRole,
  requireManagerOrAdmin,
  requireAdmin
};

