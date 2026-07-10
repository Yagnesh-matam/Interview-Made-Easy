const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');


const aiRoutes = require('./routes/aiRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dynamicQuestionRoutes = require('./routes/dynamicQuestionRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to whitelist specific origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:5000'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests without origin (like mobile apps or curl requests)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Simple, lightweight, in-memory rate limiter middleware to protect sensitive endpoints
const rateLimitStore = {};
const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitStore[ip]) {
            rateLimitStore[ip] = [];
        }
        
        // Filter out requests older than windowMs
        rateLimitStore[ip] = rateLimitStore[ip].filter(timestamp => now - timestamp < windowMs);
        
        if (rateLimitStore[ip].length >= limit) {
            return res.status(429).json({ 
                error: "Too many requests from this IP. Please try again later." 
            });
        }
        
        rateLimitStore[ip].push(now);
        next();
    };
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mounted Endpoints (Decommitted old HeyGen avatar streaming paths)
app.use('/api/dynamic-questions', dynamicQuestionRoutes);
app.use('/api/ai', rateLimiter(60, 15 * 60 * 1000), aiRoutes); // 60 requests per 15 mins for chat
app.use('/api/resume', rateLimiter(20, 15 * 60 * 1000), resumeRoutes); // 20 resume uploads/parses per 15 mins
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.send('Backend platform services functional.');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.message);
    // Don't expose internal error details
    res.status(err.status || 500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Server executing successfully on port ${PORT}`);
});