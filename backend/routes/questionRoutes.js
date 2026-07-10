const express = require('express');
const router = express.Router();
// IMPORTANT: If you have an aiService or controller that calls Gemini/Groq, import it here.
// For now, we will create a clean implementation that directly handles the requests safely.

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, 100);
};

const VALID_TOPICS = ['Java', 'Python', 'C/C++', 'Software Engineering', 'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude', 'Computer Networks', 'Git', 'OOPs'];
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// @route   GET /api/questions/topic/:topicName
// @desc    Get mock questions for a specific topic (Static/Fallback Mode)
router.get('/topic/:topicName', async (req, res) => {
    try {
        const topicName = sanitizeInput(req.params.topicName);
        if (!VALID_TOPICS.includes(topicName)) {
            return res.status(400).json({ error: "Invalid topic specified." });
        }
        
        // Database bypass fallback response array
        res.json([]); 
    } catch (error) {
        console.error("Topic fetch error:", error);
        res.status(500).json({ error: "Failed to fetch questions." });
    }
});

// @route   GET /api/questions/company/:companyName
// @desc    Get all questions historically asked by a specific company
router.get('/company/:companyName', async (req, res) => {
    try {
        res.json([]); 
    } catch (error) {
        console.error("Company filter error:", error);
        res.status(500).json({ error: "Failed to fetch questions." });
    }
});

// @route   GET /api/questions/quiz/:topicName
// @desc    Generate a dynamic customized quiz with randomized topic & difficulty constraints via AI
router.get('/quiz/:topicName', async (req, res) => {
    try {
        const topicName = sanitizeInput(req.params.topicName);
        const difficulty = sanitizeInput(req.query.difficulty || 'Medium');
        
        if (!VALID_TOPICS.includes(topicName)) {
            return res.status(400).json({ error: "Invalid topic specified." });
        }

        console.log(`Routing request to AI Engine for Topic: ${topicName}, Difficulty: ${difficulty}`);

        // --- INTERCEPT POINT FOR AI AGENT GENERATION ---
        // Replace this mock array with your actual live function call like:
        // const questions = await generateAiQuiz(topicName, difficulty);
        
        const mockAiQuestions = [
            {
                id: "ai_1",
                topic: topicName,
                difficulty: difficulty,
                questionText: `Sample AI generated question about ${topicName}.`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: "Option A"
            }
        ];

        res.json(mockAiQuestions);
    } catch (error) {
        console.error("Quiz generation error:", error);
        res.status(500).json({ error: "Failed to generate quiz." });
    }
});

module.exports = router;