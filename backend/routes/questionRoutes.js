const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Input validation helper
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, 100);
};

const VALID_TOPICS = ['Java', 'Python', 'C/C++', 'Software Engineering', 'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude', 'Computer Networks', 'Git', 'OOPs'];
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// @route   GET /api/questions/topic/:topicName
// @desc    Get all questions for a specific topic (Study Material Mode)
router.get('/topic/:topicName', async (req, res) => {
    try {
        const topicName = sanitizeInput(req.params.topicName);
        
        // Validate topic against whitelist
        if (!VALID_TOPICS.includes(topicName)) {
            return res.status(400).json({ error: "Invalid topic specified." });
        }
        
        const questions = await Question.find({ topic: topicName });
        res.json(questions);
    } catch (error) {
        console.error("Topic fetch error:", error);
        res.status(500).json({ error: "Failed to fetch questions." });
    }
});

// @route   GET /api/questions/company/:companyName
// @desc    Get all questions historically asked by a specific company
router.get('/company/:companyName', async (req, res) => {
    try {
        const companyName = sanitizeInput(req.params.companyName);
        
        // Escape special regex characters to prevent injection
        const escapedCompany = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const questions = await Question.find({ 
            targetCompany: new RegExp(escapedCompany, "i") 
        });
        res.json(questions);
    } catch (error) {
        console.error("Company filter error:", error);
        res.status(500).json({ error: "Failed to fetch questions." });
    }
});

// @route   GET /api/questions/quiz/:topicName
// @desc    Generate a dynamic customized quiz with randomized topic & difficulty constraints
router.get('/quiz/:topicName', async (req, res) => {
    try {
        const topicName = sanitizeInput(req.params.topicName);
        const difficulty = sanitizeInput(req.query.difficulty || '');
        
        // Validate topic
        if (!VALID_TOPICS.includes(topicName)) {
            return res.status(400).json({ error: "Invalid topic specified." });
        }
        
        // Build a dynamic matching filter matrix
        let matchFilter = { topic: topicName };
        if (difficulty) {
            if (!VALID_DIFFICULTIES.includes(difficulty)) {
                return res.status(400).json({ error: "Invalid difficulty specified." });
            }
            matchFilter.difficulty = difficulty;
        }

        const randomQuestions = await Question.aggregate([
            { $match: matchFilter },
            { $sample: { size: 5 } } // Dynamically pulls up to 5 randomized matching questions
        ]);
        
        res.json(randomQuestions);
    } catch (error) {
        console.error("Quiz generation error:", error);
        res.status(500).json({ error: "Failed to generate quiz." });
    }
});

module.exports = router;