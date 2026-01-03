const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ✅ FIXED PATHS for Vercel structure
const connectDB = require('./backend/utils/database');
const newsRoutes = require('./backend/routes/newsRoutes');
const calendarRoutes = require('./backend/routes/calendarRoutes');
const authRoutes = require('./backend/routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Serve static files from current directory (ROOT)
app.use(express.static(__dirname));

// ✅ VERCEL DEBUG - Log environment variables
console.log('=== VERCEL DEPLOYMENT DEBUG ===');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 5000);
console.log('Current directory:', __dirname);
console.log('===============================');

// Connect to MongoDB with better error handling
connectDB().then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.log('Please check:');
  console.log('1. MONGODB_URI in Vercel Environment Variables');
  console.log('2. MongoDB Atlas IP Whitelist (0.0.0.0/0)');
  console.log('3. MongoDB user password is correct');
});

// ✅ VERCEL DEBUG ENDPOINT
app.get('/api/debug', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'debug',
    mongodb_uri_set: !!process.env.MONGODB_URI,
    jwt_secret_set: !!process.env.JWT_SECRET,
    admin_username_set: !!process.env.ADMIN_USERNAME,
    mongoose_state: mongoose.connection.readyState,
    node_env: process.env.NODE_ENV || 'development',
    vercel: true,
    timestamp: new Date().toISOString(),
    directory: __dirname
  });
});

// API Routes
app.use('/api/news', newsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/auth', authRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/news', (req, res) => {
    res.sendFile(path.join(__dirname, 'news.html'));
});

app.get('/calendar', (req, res) => {
    res.sendFile(path.join(__dirname, 'calendar.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({ 
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        message: 'School Portal API',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test MongoDB connection endpoint
app.get('/api/test-mongodb', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            res.json({ 
                success: true, 
                message: 'MongoDB is connected',
                state: 'connected'
            });
        } else {
            res.json({ 
                success: false, 
                message: 'MongoDB is not connected',
                state: mongoose.connection.readyState
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found' 
    });
});

// ✅ VERCEL FIX: Handle both serverless and local
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Export for Vercel serverless
    module.exports = app;
} else {
    // Local development
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📁 Directory: ${__dirname}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
        console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Increase timeout for Vercel-like environment
    server.setTimeout(30000);
}