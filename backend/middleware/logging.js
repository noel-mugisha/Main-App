const morgan = require('morgan');

morgan.token('user', (req) => {

  if (req.auth && req.auth.sub) {
    return `user:${req.auth.sub} (role:${req.auth.role})`;
  }

  return 'anonymous';
});

const devFormat = ':method :url :status :response-time ms - :user';

const prodFormat = 'combined';

const logFormat = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

const requestLogger = morgan(logFormat, {
  skip: (req, res) => {
    return req.url === '/health' && res.statusCode === 200;
  }
});

module.exports = {
  requestLogger
};