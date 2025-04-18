const rateLimit = require('express-rate-limit');

// Create a limiter for general API requests
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Create a stricter limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after an hour'
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};