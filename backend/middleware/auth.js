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

// Manager or Admin authorization
const requireManagerOrAdmin = requireRole(['MANAGER', 'ADMIN']);

// Admin only authorization
const requireAdmin = requireRole(['ADMIN']);

// Normalize various role claim formats from different IdPs to one of: USER | MANAGER | ADMIN
const normalizeRole = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No user information found'
    });
  }

  const preferredOrder = ['ADMIN', 'MANAGER', 'USER'];

  const toSimpleRole = (raw) => {
    if (!raw) return undefined;
    const mapSingle = (r) => {
      if (typeof r !== 'string') return undefined;
      const value = r.toUpperCase();
      if (value.includes('ADMIN')) return 'ADMIN';
      if (value.includes('MANAGER')) return 'MANAGER';
      if (value.includes('USER')) return 'USER';
      return undefined;
    };

    if (Array.isArray(raw)) {
      for (const r of preferredOrder) {
        if (raw.map(mapSingle).includes(r)) return r;
      }
      return mapSingle(raw[0]);
    }

    if (typeof raw === 'string') {
      // handle space-separated scopes like "SCOPE_ROLE_USER" or "ROLE_USER ROLE_ADMIN"
      const parts = raw.split(/[\s,]+/).filter(Boolean);
      if (parts.length > 1) return toSimpleRole(parts);
      return mapSingle(raw);
    }

    return undefined;
  };

  // Try common claim names from different IdPs
  const normalized =
    toSimpleRole(req.auth.role) ||
    toSimpleRole(req.auth.roles) ||
    toSimpleRole(req.auth.authorities) ||
    toSimpleRole(req.auth.scopes) ||
    toSimpleRole(req.auth.scope);

  if (normalized) {
    req.auth.role = normalized;
  }

  next();
};

module.exports = {
  verifyJwt,
  jwtErrorHandler,
  requireRole,
  requireManagerOrAdmin,
  requireAdmin,
  normalizeRole
};

