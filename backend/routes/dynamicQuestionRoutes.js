const Groq = require('groq-sdk');
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Input validation helper
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, 100);
};

const VALID_TOPICS = ['Java', 'Python', 'C/C++', 'Software Engineering', 'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude', 'Computer Networks', 'Git', 'OOPs'];
const VALID_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Apple', 'IBM', 'TCS', 'Infosys', 'Accenture', 'Cognizant', 'Capgemini', 'Wipro', 'Tech Mahindra', 'HCL Technologies', 'Genpact', 'EY', 'Deloitte'];

/**
 * Generate adaptive quiz questions dynamically via Gemini API
 * Ensures infinite variety - no database dependency
 */
router.post('/generate-quiz', async (req, res) => {
    try {
        const { topic } = req.body;
        const cleanTopic = sanitizeInput(topic || '');

        if (!cleanTopic || !VALID_TOPICS.includes(cleanTopic)) {
            return res.status(400).json({ error: "Invalid topic specified." });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("Missing GEMINI_API_KEY");
            return res.status(500).json({ error: "Server configuration error." });
        }

        const model = "gemini-2.5-flash-preview-09-2025";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const systemPrompt = `
You are an elite technical interviewer and adaptive quiz master.
Generate exactly 10 COMPLETELY UNIQUE, HIGH-QUALITY, DIVERSE multiple-choice questions for: "${cleanTopic}".

CRITICAL REQUIREMENT: Each generation must produce COMPLETELY DIFFERENT questions from previous generations.

MANDATORY QUESTION TYPE DISTRIBUTION:
- 2x Core Theory & Foundational Concepts
- 2x Code Debugging (Find the error/bug)
- 2x Complete the Code (Fill blanks/syntax)
- 2x Tricky Logic & Output Prediction
- 2x Real-world Architecture & Scenarios

RULES FOR EACH QUESTION:
- 'q': Detailed question with code blocks if applicable (\`\`\`language code\`\`\`)
- 'options': Exactly 4 DISTINCT plausible answers (no near-duplicates)
- 'correct': 0-based index (0, 1, 2, or 3)
- 'expl': 3-4 sentences explaining correctness, why others are wrong, key insight
- 'difficulty': One of "Easy", "Medium", "Hard"

QUALITY STANDARDS:
- Include edge cases and common misconceptions
- Vary difficulty: 2 Easy, 5 Medium, 3 Hard
- Each question tests different aspect of topic
- No repetition from typical textbooks
- Use realistic, practical scenarios
- Make challenging but fair and solvable
`;

        const payload = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        questions: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    q: { type: "STRING" },
                                    options: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                        minItems: 4,
                                        maxItems: 4
                                    },
                                    correct: { type: "INTEGER" },
                                    expl: { type: "STRING" },
                                    difficulty: { type: "STRING" }
                                },
                                required: ["q", "options", "correct", "expl", "difficulty"]
                            }
                        }
                    },
                    required: ["questions"]
                }
            }
        };

        const response = await axios.post(endpoint, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000
        });

        const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            throw new Error("No response from Gemini API");
        }

        const data = JSON.parse(textResponse);

        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("Invalid schema structure returned from Gemini model.");
        }

        // Filter to exactly 10 questions
        const quizQuestions = data.questions.slice(0, 10);
        
        res.json({
            success: true,
            topic: cleanTopic,
            totalQuestions: quizQuestions.length,
            questions: quizQuestions
        });

    } catch (error) {
        console.error("Quiz generation error:", error.message);
        res.status(500).json({ error: "Failed to generate quiz questions.", details: error.message });
    }
});

/**
 * Generate technical interview questions dynamically
 * Open-ended, in-depth questions for Vocal AI Arena - Technical Mode
 */
router.post('/generate-technical-interview', async (req, res) => {
    try {
        const { topic, company } = req.body;
        const cleanTopic = sanitizeInput(topic || '');
        const cleanCompany = sanitizeInput(company || '');

        if (!cleanTopic || !VALID_TOPICS.includes(cleanTopic)) {
            return res.status(400).json({ error: "Invalid topic specified." });
        }

        if (cleanCompany && !VALID_COMPANIES.includes(cleanCompany)) {
            return res.status(400).json({ error: "Invalid company specified." });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server configuration error." });
        }

        const model = "gemini-2.5-flash-preview-09-2025";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const companyContext = cleanCompany ? `You are interviewing for a position at ${cleanCompany}.` : "You are in a general technical interview.";

        const systemPrompt = `
${companyContext} Generate exactly 5 unique, challenging TECHNICAL INTERVIEW QUESTIONS for topic: "${cleanTopic}".

QUESTION TYPES (Include all types):
1. Deep Concept Explanation - "Explain X in detail, including edge cases and when to use it"
2. System Design & Architecture - "How would you design/build/optimize X for production?"
3. Code Debugging & Problem Solving - "Here's broken code. What's wrong? How would you fix and optimize it?"
4. Real-world Scenario - "In production, you encounter X problem. Walk me through your debugging process."
5. Trade-offs & Optimization - "Compare X vs Y. When use each? What are trade-offs?"

REQUIREMENTS:
- Each question is open-ended (requires 3-5 min thoughtful answer)
- Tests depth of understanding, not memorization
- Include potential follow-up areas to probe deeper
- No simple yes/no answers - require justification
- Use realistic, production-level scenarios

RETURN FORMAT (MUST be valid JSON):
{
    "questions": [
        {
            "q": "Full detailed question text here",
            "type": "Explanation|Design|Debugging|Scenario|TradeOffs",
            "difficulty": "Intermediate|Advanced",
            "followUp": "Suggested follow-up if answer incomplete",
            "expectedDuration": "3-5 minutes"
        }
    ]
}
`;

        const payload = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await axios.post(endpoint, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000
        });

        const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            throw new Error("No response from Gemini API");
        }

        const data = JSON.parse(textResponse);

        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("Invalid schema structure returned from Gemini model.");
        }

        res.json({
            success: true,
            topic: cleanTopic,
            company: cleanCompany,
            totalQuestions: data.questions.length,
            questions: data.questions
        });

    } catch (error) {
        console.error("Technical interview generation error:", error.message);
        res.status(500).json({ error: "Failed to generate technical interview questions.", details: error.message });
    }
});

/**
 * Generate behavioral interview questions dynamically
 * Soft skills, teamwork, communication, growth mindset
 */
router.post('/generate-behavioral-interview', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server configuration error." });
        }

        const model = "gemini-2.5-flash-preview-09-2025";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const systemPrompt = `
You are an expert HR and behavioral interview conductor. Generate exactly 5 unique BEHAVIORAL INTERVIEW QUESTIONS.

QUESTION CATEGORIES (Must include diverse mix):
1. Leadership & Teamwork - "Tell me about a time when you led a team/project..."
2. Conflict Resolution - "Describe a time you disagreed with a colleague/manager..."
3. Problem-Solving & Adaptability - "Share an example of a challenging situation you overcame..."
4. Communication & Presentation - "How do you explain complex technical ideas to..."
5. Personal Growth & Learning - "Tell me about a failure or mistake that taught you..."

BEHAVIORAL QUESTION GUIDELINES:
- Questions require STORY-BASED answers (STAR method: Situation, Task, Action, Result)
- Test soft skills: communication, resilience, creativity, collaboration, learning
- Mix: Situational, Behavioral, Hypothetical approaches
- Each naturally guides toward specific competencies
- No simple yes/no questions
- Open-ended, requiring self-reflection

RETURN FORMAT (MUST be valid JSON):
{
    "questions": [
        {
            "q": "Full behavioral question (open-ended, story-driven)",
            "category": "Category name",
            "keyCompetencies": ["Listed", "Competencies", "Being", "Tested"],
            "whatToLookFor": "What interviewers evaluate in the response (2-3 sentences)",
            "timeAllowed": "2-3 minutes"
        }
    ]
}
`;

        const payload = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await axios.post(endpoint, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000
        });

        const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            throw new Error("No response from Gemini API");
        }

        const data = JSON.parse(textResponse);

        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("Invalid schema structure returned from Gemini model.");
        }

        res.json({
            success: true,
            totalQuestions: data.questions.length,
            questions: data.questions
        });

    } catch (error) {
        console.error("Behavioral interview generation error:", error.message);
        res.status(500).json({ error: "Failed to generate behavioral interview questions.", details: error.message });
    }
});

module.exports = router;

// @route   POST /api/dynamic-questions/adaptive-quiz
// @desc    Generate a single adaptive question using Groq, based on difficulty and previous questions
router.post('/adaptive-quiz', async (req, res) => {
    try {
        const { topic, difficulty, previousQuestions, previousTypes } = req.body;
        const cleanTopic = sanitizeInput(topic || '');
        if (!cleanTopic || !VALID_TOPICS.includes(cleanTopic)) {
            return res.status(400).json({ error: "Invalid topic." });
        }

        const validDifficulties = ['Easy', 'Medium', 'Hard'];
        const currentDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'Medium';

        const prevQuestions = Array.isArray(previousQuestions) ? previousQuestions : [];
        const uniqueConstraint = prevQuestions.length > 0
            ? `CRITICAL: The question MUST be completely different in both concept and wording from the following already asked questions in this session:\n${prevQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}`
            : '';

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "Server configuration error." });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Calculate the least represented question type to balance the quiz types
        const types = ['Theory', 'Code Debugging', 'Complete Code', 'Logic/Output', 'Architecture/Scenario'];
        const prevTypes = Array.isArray(previousTypes) ? previousTypes : [];
        
        const typeCounts = {};
        types.forEach(t => { typeCounts[t] = 0; });
        prevTypes.forEach(t => { if (t in typeCounts) typeCounts[t]++; });
        
        let minCount = Infinity;
        let selectedTypes = [];
        types.forEach(t => {
            if (typeCounts[t] < minCount) {
                minCount = typeCounts[t];
                selectedTypes = [t];
            } else if (typeCounts[t] === minCount) {
                selectedTypes.push(t);
            }
        });
        
        const selectedType = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];

        // Generate a highly specific system prompt based on difficulty and type
        const systemPrompt = `
You are an elite technical interviewer and quiz master.
Generate exactly ONE multiple-choice question for the topic: "${cleanTopic}".
The question should be of type "${selectedType}" and difficulty level "${currentDifficulty}".

${uniqueConstraint}

Operational Guidelines for Difficulty Levels:
- Easy: Focus on basic syntax, core definitions, and foundational concepts of the language/domain. Suitable for beginners.
- Medium: Focus on common applications, debugging standard code blocks, control flow, intermediate concepts, or simple design patterns.
- Hard: Focus on tricky edge cases, deep logical flows, memory optimization, concurrency, system design tradeoffs, or advanced language-specific rules.

Operational Guidelines for Question Types:
- Theory: Focus on core conceptual explanations, definitions, and internal workings (e.g., how JVM heap works, database isolation levels).
- Code Debugging: Provide a well-formatted code snippet that contains a bug. The question must ask the user to identify the bug, the error, or the fix.
- Complete Code: Provide a code snippet with a critical blank (represented by '__' or a clear placeholder comment) or missing syntax. The user must choose the correct option to complete the snippet.
- Logic/Output: Provide a tricky, high-quality code snippet (e.g., with variable shadows, recursion, inheritance, closures). Ask what the code will output or its final state.
- Architecture/Scenario: Describe a real-world scenario (e.g., handling scale, choosing a collection type, structuring a DB schema) and ask for the best architectural approach or design pattern.

MANDATORY RULES:
1. For 'Code Debugging', 'Complete Code', and 'Logic/Output', you MUST include a clean code block using markdown syntax (e.g. \`\`\`java \\n ... \\n \`\`\`).
2. Options must contain exactly 4 distinct, plausible answers. Do not make options too obvious or use duplicates.
3. The explanation ('expl') must be extremely educational (3-5 sentences), teaching the core concept and explaining why other choices are wrong.
4. The interview tip ('tip') must be 1-2 sentences of specific advice on how this concept is tested in technical interviews or how the candidate should describe it to an interviewer.

Return only valid JSON in this format:
{
    "q": "Detailed question text (include markdown code blocks if code is needed)",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct": 0,
    "expl": "Detailed concept explanation.",
    "tip": "High-value interview tip or key takeaway.",
    "type": "${selectedType}",
    "difficulty": "${currentDifficulty}"
}
`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate a ${currentDifficulty} difficulty ${selectedType} question on ${cleanTopic}.` }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        });

        const replyText = completion.choices[0].message.content;
        const questionData = JSON.parse(replyText);

        // Validate structure
        if (!questionData.q || !Array.isArray(questionData.options) || questionData.options.length !== 4 ||
            typeof questionData.correct !== 'number' || !questionData.expl || !questionData.tip) {
            throw new Error('Invalid question format from Groq');
        }

        res.json({
            success: true,
            question: {
                q: questionData.q,
                options: questionData.options,
                correct: questionData.correct,
                expl: questionData.expl,
                tip: questionData.tip,
                type: questionData.type || selectedType,
                difficulty: questionData.difficulty || currentDifficulty
            }
        });

    } catch (error) {
        console.error("Adaptive quiz error:", error.message);
        res.status(500).json({ error: "Failed to generate question.", details: error.message });
    }
});
