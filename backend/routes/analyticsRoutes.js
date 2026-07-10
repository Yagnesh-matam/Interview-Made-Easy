const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Input validation helper
const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email.toLowerCase().trim() : '';
};

// @route   GET /api/analytics/:email
// @desc    Calculate real-time portfolio metrics and progression curves for a user
router.get('/:email', async (req, res) => {
    try {
        const email = sanitizeEmail(req.params.email);
        
        if (!email) {
            return res.status(400).json({ error: "Invalid email format." });
        }
        
        // Find the user by their unique email identifier
        const user = await User.findOne({ email: email });
        
        if (!user) {
            // Fallback object with pristine base states if user profile doesn't exist yet
            return res.json({
                avgAccuracy: 0,
                totalQuizzes: 0,
                totalAiSessions: 0,
                progressionLog: [
                    { day: 'Mon', score: 0 },
                    { day: 'Tue', score: 0 },
                    { day: 'Wed', score: 0 },
                    { day: 'Thu', score: 0 },
                    { day: 'Fri', score: 0 }
                ]
            });
        }

        const history = user.quizHistory || [];
        const totalQuizzes = history.length;
        
        // 1. Compute dynamic mathematical average accuracy score
        let totalScorePercentage = 0;
        history.forEach(quiz => {
            if (quiz.score && quiz.totalQuestions) {
                const percentage = (quiz.score / quiz.totalQuestions) * 100;
                totalScorePercentage += percentage;
            }
        });
        const avgAccuracy = totalQuizzes > 0 ? (totalScorePercentage / totalQuizzes).toFixed(1) : 0;

        // 2. Map actual history coordinates to map out the progression curve
        const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const progressionLog = history.slice(-5).map(quiz => {
            const quizDate = new Date(quiz.date);
            const score = quiz.score && quiz.totalQuestions 
                ? Math.round((quiz.score / quiz.totalQuestions) * 100) 
                : 0;
            return {
                day: daysMap[quizDate.getDay()],
                score: Math.max(0, Math.min(100, score)) // Ensure score is between 0-100
            };
        });

        // If history is brief, pad out chart parameters cleanly for the frontend layout
        while (progressionLog.length < 5) {
            progressionLog.unshift({ day: 'Prior', score: 0 });
        }

        res.json({
            avgAccuracy: Math.max(0, Math.min(100, parseFloat(avgAccuracy))), // Ensure valid percentage
            totalQuizzes,
            totalAiSessions: user.totalAiSessions || 0, // Fallback counter tracking AI hits
            progressionLog
        });

    } catch (error) {
        console.error("Analytics query error");
        res.status(500).json({ error: "Failed to retrieve analytics data." });
    }
});

module.exports = router;