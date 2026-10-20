const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const { requireAuth } = require('./middleware/auth');
const aiRoutes = require('./routes/aiRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const dynamicQuestionRoutes = require('./routes/dynamicQuestionRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// CORS: whitelist origins from env, falling back to common local/dev origins.
const defaultOrigins = [
  'https://interview-made-easy.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : defaultOrigins;

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests without origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS Blocked Origin: ${origin}`);
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

// All AI generation, resume parsing, and question endpoints require a verified
// Supabase session. The verified user identity is attached to req.user; handlers
// must never trust user IDs supplied by the client.
app.use('/api/dynamic-questions', requireAuth, dynamicQuestionRoutes);
app.use('/api/ai', requireAuth, rateLimiter(60, 15 * 60 * 1000), aiRoutes); // 60 requests per 15 mins for chat
app.use('/api/resume', requireAuth, rateLimiter(20, 15 * 60 * 1000), resumeRoutes); // 20 resume uploads/parses per 15 mins

app.get('/', (req, res) => {
    res.send('Backend platform services functional.');
});

// Lightweight liveness probe for orchestration/monitoring (no secrets, no auth needed)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server Error Hook:", err.message);
    // Don't expose internal error details
    res.status(err.status || 500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

// Only bind a port when run directly (node server.js); tests import the app.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server executing successfully on port ${PORT}`);
    });
}

module.exports = app;