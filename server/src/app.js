const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Import routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const caseStudyRoutes = require('./routes/caseStudyRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const commentRoutes = require('./routes/commentRoutes');
const tagRoutes = require('./routes/tagRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(morgan('dev'));

// Apply rate limiting to all routes
app.use('/api', apiLimiter);
// Apply stricter rate limiting to auth routes
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/forgot-password', authLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/collaborations', collaborationRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Welcome to Project Shelf API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

module.exports = app;