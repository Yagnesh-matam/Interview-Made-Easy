# Dynamic AI Question Generation - Implementation Guide

## Overview

The Interview Prep Platform now features **infinite, real-time question generation** powered by Google Gemini API. Instead of relying on a static database of questions, the AI generates completely unique questions every time a user starts a quiz or interview session.

## Architecture

### Three Question Generation Modes

#### 1. **Adaptive Quiz Questions** (10 Multiple-Choice)
- **Endpoint**: `POST /api/dynamic-questions/generate-quiz`
- **Input**: Topic name (validated against whitelist)
- **Output**: 10 unique multiple-choice questions with balanced difficulty
- **Distribution**:
  - 2x Core Theory & Foundational Concepts
  - 2x Code Debugging (Find the error/bug)
  - 2x Complete the Code (Fill blanks/syntax)
  - 2x Tricky Logic & Output Prediction
  - 2x Real-world Architecture & Scenarios

**Example Request**:
```javascript
POST http://localhost:5000/api/dynamic-questions/generate-quiz
{
    "topic": "Java"
}
```

**Example Response**:
```json
{
    "success": true,
    "topic": "Java",
    "totalQuestions": 10,
    "questions": [
        {
            "q": "What is the difference between Heap and Stack memory in Java?",
            "options": [
                "Stack stores objects, Heap stores primitives",
                "Heap memory is utilized for temporary local variables; Stack is for dynamic allocation of objects",
                "Stack memory is for temporary variables; Heap is for dynamic object allocation",
                "They are the same thing in modern Java"
            ],
            "correct": 2,
            "expl": "Stack memory stores method call frames and local variables (LIFO), while Heap stores all dynamically allocated objects. This is a fundamental memory management concept every Java developer must understand.",
            "difficulty": "Medium"
        }
    ]
}
```

#### 2. **Technical Interview Questions** (5 Open-Ended)
- **Endpoint**: `POST /api/dynamic-questions/generate-technical-interview`
- **Input**: Topic (required), Company (optional)
- **Output**: 5 unique, challenging open-ended technical questions
- **Coverage Types**:
  - Deep Concept Explanation
  - System Design & Architecture
  - Code Debugging & Problem Solving
  - Real-world Scenario
  - Trade-offs & Optimization

**Example Request**:
```javascript
POST http://localhost:5000/api/dynamic-questions/generate-technical-interview
{
    "topic": "DSA",
    "company": "Google"
}
```

#### 3. **Behavioral Interview Questions** (5 Soft Skills)
- **Endpoint**: `POST /api/dynamic-questions/generate-behavioral-interview`
- **Input**: None required
- **Output**: 5 unique behavioral/HR interview questions
- **Coverage Areas**:
  - Leadership & Teamwork
  - Conflict Resolution
  - Problem-Solving & Adaptability
  - Communication & Presentation
  - Personal Growth & Learning

**Example Request**:
```javascript
POST http://localhost:5000/api/dynamic-questions/generate-behavioral-interview
```

## Frontend Integration

### 1. Quiz View Update
**File**: `frontend/src/App.jsx` (QuizView component)

When user selects a topic, the component now calls:
```javascript
const response = await axios.post(`${API_BASE_URL}/dynamic-questions/generate-quiz`, {
    topic: topicName
});
```

**Benefits**:
- ✅ Questions generated on-demand (no caching/staleness)
- ✅ Infinite variety for repeated attempts
- ✅ Difficulty-balanced questions
- ✅ Real-world scenario coverage

### 2. Interview View Update
**File**: `frontend/src/App.jsx` (AiChatConsoleView component)

The interview chat now uses Groq (via backend) to generate questions dynamically throughout the conversation:
- Technical Mode: AI generates deep technical questions
- Concept Mode: AI generates academic concept questions
- Resume Mode: AI generates targeted portfolio/project questions
- Behavioral Mode: AI generates soft-skill questions

**Flow**:
1. User selects interview mode (technical/concept/resume/behavioral)
2. Frontend calls `${API_BASE_URL}/api/ai/interview-chat` with mode details
3. Backend routes request to Groq LLM
4. Groq generates first question based on system prompt
5. User answers, continues conversation
6. AI generates next question based on context

## Backend Implementation

### New Route File
**File**: `backend/routes/dynamicQuestionRoutes.js`

Features:
- Input validation (sanitization + whitelist checking)
- Rate limiting ready (can add later)
- Structured JSON response with Gemini API
- Comprehensive error handling
- Timeout protection (30 seconds per request)

### Server Integration
**File**: `backend/server.js`

Route mounted at:
```javascript
app.use('/api/dynamic-questions', dynamicQuestionRoutes);
```

### API Key Management

All API calls use environment variables:
- **GEMINI_API_KEY**: For dynamic question generation
- **GROQ_API_KEY**: For interview chat responses

**Setup**:
```bash
# backend/.env
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

## Question Generation Prompts

### Adaptive Quiz Prompt
```
You are an elite technical interviewer and adaptive quiz master.
Generate exactly 10 COMPLETELY UNIQUE, HIGH-QUALITY, DIVERSE multiple-choice questions for: "{topic}".

CRITICAL REQUIREMENT: Each generation must produce COMPLETELY DIFFERENT questions from previous generations.
```

**Key Features**:
- JSON schema enforcement for structured output
- Exactly 4 options per question
- Educational explanations (3-4 sentences)
- Difficulty levels: Easy (2), Medium (5), Hard (3)
- No textbook repetition - practical scenarios

### Technical Interview Prompt
```
You are interviewing for a position at {company}.
Generate exactly 5 unique, challenging TECHNICAL INTERVIEW QUESTIONS for topic: "{topic}".

QUESTION TYPES:
1. Deep Concept Explanation
2. System Design & Architecture
3. Code Debugging & Problem Solving
4. Real-world Scenario
5. Trade-offs & Optimization
```

### Behavioral Interview Prompt
```
Generate exactly 5 unique BEHAVIORAL INTERVIEW QUESTIONS.

QUESTION CATEGORIES:
1. Leadership & Teamwork
2. Conflict Resolution
3. Problem-Solving & Adaptability
4. Communication & Presentation
5. Personal Growth & Learning
```

## Error Handling

### Common Issues & Solutions

**Issue**: `Missing GEMINI_API_KEY`
```
Error: "Server configuration error."
Solution: Ensure GEMINI_API_KEY is set in backend/.env file
```

**Issue**: Invalid Topic
```json
{
    "error": "Invalid topic specified."
}
```
**Solution**: Use one of the whitelisted topics: Java, Python, C/C++, DSA, etc.

**Issue**: Timeout
```json
{
    "error": "Failed to generate quiz questions.",
    "details": "Request timeout after 30 seconds"
}
```
**Solution**: Check internet connection, Gemini API quota, or retry

## Performance Considerations

### Response Times
- **Adaptive Quiz**: ~3-8 seconds (10 questions with explanations)
- **Technical Interview**: ~2-5 seconds (5 open-ended questions)
- **Behavioral Interview**: ~2-4 seconds (5 behavioral questions)

### Rate Limiting Recommendations
Currently implemented: None (use free tier responsibly)

**For production**, add rate limiting:
```javascript
const rateLimit = require('express-rate-limit');

const quizLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 10 requests per windowMs
});

router.post('/generate-quiz', quizLimiter, async (req, res) => {
    // ... implementation
});
```

## Testing

### Manual Testing

**Test 1: Generate Quiz Questions**
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"Java"}'
```

**Test 2: Generate Technical Interview Questions**
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-technical-interview \
  -H "Content-Type: application/json" \
  -d '{"topic":"DSA","company":"Google"}'
```

**Test 3: Generate Behavioral Questions**
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-behavioral-interview \
  -H "Content-Type: application/json"
```

### Quality Checklist
- [ ] Questions are unique across multiple generations
- [ ] Difficulty levels are varied (not all hard or all easy)
- [ ] Explanations are clear and educational
- [ ] No offensive or biased content
- [ ] Code examples are syntactically correct
- [ ] Questions match the topic requested
- [ ] Response time < 10 seconds
- [ ] Error handling for network failures

## Future Enhancements

### Phase 2: Caching & Optimization
- Cache popular topic questions (1-hour TTL)
- Batch API calls for performance
- Implement retry logic with exponential backoff

### Phase 3: Personalization
- Track question history to avoid repetition
- Adaptive difficulty based on user performance
- Industry-specific question variants

### Phase 4: Advanced Features
- Question quality scoring
- User feedback on question relevance
- A/B testing different prompts
- Multi-language support

## Security Notes

✅ **Implemented**:
- Input validation (topic whitelist)
- Input sanitization (substring limits)
- API key protection (backend-only)
- Error filtering (no implementation details to client)
- CORS whitelist protection
- Timeout protection

⚠️ **Recommendations**:
- Implement rate limiting for production
- Add request signing for sensitive endpoints
- Rotate API keys regularly
- Monitor API usage and costs
- Add audit logging for all API calls

## Troubleshooting

### Questions Are Not Generating

**Check 1**: Verify GEMINI_API_KEY is set
```bash
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY%  # Windows
```

**Check 2**: Verify backend is running
```bash
curl http://localhost:5000/
# Should return: "Backend platform services functional."
```

**Check 3**: Check frontend API base URL
```javascript
console.log(API_BASE_URL); // Should log your backend URL
```

### Questions Quality Is Poor

**Solution 1**: Improve the prompt in `dynamicQuestionRoutes.js`
- Add more specific context
- Increase minimum/maximum constraints
- Add examples of good questions

**Solution 2**: Experiment with different Gemini models
```javascript
const model = "gemini-2.0-pro"; // Try different models
```

## Conclusion

The dynamic question generation system transforms the interview prep platform from a static question bank to an **intelligent, adaptive learning experience**. Every session generates unique questions, ensuring users practice with diverse scenarios and avoid memorization.

For questions or issues, refer to the main project README or contact the development team.
