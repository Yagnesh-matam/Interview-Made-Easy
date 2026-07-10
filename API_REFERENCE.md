# Dynamic Question Generation - API Reference

## Quick Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/dynamic-questions/generate-quiz` | POST | Generate 10 adaptive quiz questions | None |
| `/api/dynamic-questions/generate-technical-interview` | POST | Generate 5 technical interview questions | None |
| `/api/dynamic-questions/generate-behavioral-interview` | POST | Generate 5 behavioral interview questions | None |

## Endpoint Details

### 1. Generate Adaptive Quiz Questions

**URL**: `/api/dynamic-questions/generate-quiz`  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
    "topic": "Java"
}
```

**Valid Topics**:
- Java, Python, C/C++
- Software Engineering, DSA, DBMS
- Operating Systems, Soft Skills, Aptitude
- Computer Networks, Git, OOPs

**Response** (200 OK):
```json
{
    "success": true,
    "topic": "Java",
    "totalQuestions": 10,
    "questions": [
        {
            "q": "Question text here",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correct": 2,
            "expl": "Explanation of the correct answer",
            "difficulty": "Medium"
        }
    ]
}
```

**Error Responses**:
```json
{
    "error": "Invalid topic specified."
}
```
**Status**: 400

```json
{
    "error": "Server configuration error."
}
```
**Status**: 500

---

### 2. Generate Technical Interview Questions

**URL**: `/api/dynamic-questions/generate-technical-interview`  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{
    "topic": "DSA",
    "company": "Google"
}
```

**Parameters**:
- `topic` (required): Technical topic (validated)
- `company` (optional): Company name for context

**Response** (200 OK):
```json
{
    "success": true,
    "topic": "DSA",
    "company": "Google",
    "totalQuestions": 5,
    "questions": [
        {
            "q": "Question text here",
            "type": "Design",
            "difficulty": "Advanced",
            "followUp": "Suggested follow-up question",
            "expectedDuration": "3-5 minutes"
        }
    ]
}
```

**Error Responses**:
```json
{
    "error": "Invalid topic specified."
}
```

```json
{
    "error": "Invalid company specified."
}
```

---

### 3. Generate Behavioral Interview Questions

**URL**: `/api/dynamic-questions/generate-behavioral-interview`  
**Method**: `POST`  
**Content-Type**: `application/json`

**Request Body**:
```json
{}
```
(No parameters required)

**Response** (200 OK):
```json
{
    "success": true,
    "totalQuestions": 5,
    "questions": [
        {
            "q": "Question text here",
            "category": "Leadership & Teamwork",
            "keyCompetencies": ["Communication", "Leadership", "Teamwork"],
            "whatToLookFor": "How to evaluate the response",
            "timeAllowed": "2-3 minutes"
        }
    ]
}
```

---

## Frontend Integration Examples

### React (Adaptive Quiz)
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const generateQuizQuestions = async (topic) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/dynamic-questions/generate-quiz`,
            { topic }
        );
        return response.data.questions;
    } catch (error) {
        console.error('Failed to generate questions:', error);
        throw error;
    }
};

// Usage
const questions = await generateQuizQuestions('Java');
```

### React (Technical Interview)
```javascript
const generateTechnicalQuestions = async (topic, company) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/dynamic-questions/generate-technical-interview`,
            { topic, company }
        );
        return response.data.questions;
    } catch (error) {
        console.error('Failed to generate questions:', error);
        throw error;
    }
};

// Usage
const questions = await generateTechnicalQuestions('DSA', 'Google');
```

### React (Behavioral Interview)
```javascript
const generateBehavioralQuestions = async () => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/dynamic-questions/generate-behavioral-interview`
        );
        return response.data.questions;
    } catch (error) {
        console.error('Failed to generate questions:', error);
        throw error;
    }
};

// Usage
const questions = await generateBehavioralQuestions();
```

---

## cURL Examples

### Generate Quiz Questions
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"Java"}'
```

### Generate Technical Interview Questions
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-technical-interview \
  -H "Content-Type: application/json" \
  -d '{"topic":"DSA","company":"Google"}'
```

### Generate Behavioral Questions
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-behavioral-interview \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process the questions array |
| 400 | Bad Request | Check topic/company validity |
| 500 | Server Error | Verify backend running, API key set |

---

## Environment Configuration

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/interviewPrep
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Rate Limiting (Future)

Currently: No rate limiting  
Recommended for production: 10 requests per 15 minutes per IP

---

## Troubleshooting

### "Invalid topic specified"
**Cause**: Topic not in whitelist  
**Fix**: Use one of the valid topics listed above

### "Server configuration error"
**Cause**: GEMINI_API_KEY not set  
**Fix**: Add GEMINI_API_KEY to backend/.env

### "Request timeout"
**Cause**: Slow network or Gemini API overloaded  
**Fix**: Retry after 30 seconds or check API status

### "undefined is not a valid topic"
**Cause**: Topic parameter not passed correctly  
**Fix**: Verify request body contains `topic` key

---

## Best Practices

✅ **Do**:
- Validate topic before sending request
- Handle errors gracefully in frontend
- Cache questions for same topic (client-side)
- Use appropriate timeout values (>5 seconds)

❌ **Don't**:
- Expose API keys in client code
- Send sensitive data in topic/company fields
- Make concurrent requests without rate limiting
- Assume questions will be identical on retries
