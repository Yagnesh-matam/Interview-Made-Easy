# Quick Start Guide - Dynamic Question Generation

## What's New?

Your interview prep platform now has **infinite AI-generated questions** instead of database-driven questions. Every quiz/interview session produces completely unique questions!

## Quickstart (5 minutes)

### Step 1: Set API Key
```bash
cd backend
# Edit .env file (create if doesn't exist):
GEMINI_API_KEY=<your_google_gemini_api_key>
GROQ_API_KEY=<your_groq_key>
MONGODB_URI=mongodb://127.0.0.1:27017/interviewPrep
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 2: Start Backend
```bash
cd backend
npm install
npm start
# Should output: "Backend platform services functional."
```

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Step 4: Test It!
1. Open http://localhost:5173
2. Go to **Adaptive Quiz Arena**
3. Click any topic (e.g., Java)
4. Watch AI generate 10 unique questions in real-time!

## Testing with cURL

### Test 1: Generate Quiz Questions
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"Java"}'
```

Expected: ✅ 10 questions with options and explanations

### Test 2: Generate Technical Interview
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-technical-interview \
  -H "Content-Type: application/json" \
  -d '{"topic":"DSA","company":"Google"}'
```

Expected: ✅ 5 open-ended technical questions

### Test 3: Generate Behavioral Interview
```bash
curl -X POST http://localhost:5000/api/dynamic-questions/generate-behavioral-interview \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: ✅ 5 behavioral interview questions

## File Structure

```
backend/
├── routes/
│   ├── dynamicQuestionRoutes.js      ← NEW: Question generation endpoints
│   └── aiRoutes.js                   (uses Groq for interview chat)
├── server.js                          (updated with new routes)
├── .env.example                       (updated with GEMINI_API_KEY)

frontend/
├── src/
│   └── App.jsx                        (updated URLs + config)
├── .env.local                         (add: VITE_API_BASE_URL)

Documentation/
├── DYNAMIC_QUESTIONS_GUIDE.md         ← Comprehensive guide
├── API_REFERENCE.md                   ← API endpoints
└── IMPLEMENTATION_SUMMARY.md          ← What changed
```

## How It Works

### Architecture Diagram
```
User Opens Quiz
    ↓
Frontend calls /api/dynamic-questions/generate-quiz
    ↓
Backend validates topic (whitelist check)
    ↓
Backend calls Google Gemini API
    ↓
Gemini generates 10 unique multiple-choice questions
    ↓
Backend returns JSON with questions/options/explanations
    ↓
Frontend displays questions interactively
    ↓
User takes quiz, scores are calculated
```

### For Interviews
```
User starts interview
    ↓
Frontend calls /api/ai/interview-chat
    ↓
Backend calls Groq API with system prompt
    ↓
Groq generates first interview question
    ↓
Backend synthesizes audio (Edge-TTS)
    ↓
Frontend displays + plays question
    ↓
User answers → conversation continues
    ↓
Groq generates next question based on context
```

## Environment Configuration

### Backend (.env)
```ini
# Required
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
MONGODB_URI=mongodb://127.0.0.1:27017/interviewPrep

# Optional
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env.local)
```ini
VITE_API_BASE_URL=http://localhost:5000
```

## Supported Topics (Whitelist)

These are the only valid topics for question generation:
- **Programming**: Java, Python, C/C++
- **Core CS**: DSA, DBMS, Operating Systems, Computer Networks
- **Domains**: Software Engineering, Soft Skills, Aptitude
- **Tools**: Git, OOPs

Use exact capitalization: `"Java"` not `"java"`

## Supported Companies (for Technical Interviews)

- Google, Microsoft, Amazon
- TCS, Infosys, Accenture
- Deloitte, Wipro, Capgemini, Cognizant

## Error Troubleshooting

### Error: "Invalid topic specified"
**Fix**: Check spelling and capitalization (e.g., "Java" not "java")

### Error: "Server configuration error"
**Fix**: Add GEMINI_API_KEY to backend/.env

### Error: "Request timeout"
**Fix**: 
- Check internet connection
- Verify Gemini API quota
- Retry after 30 seconds
- Check API key validity

### Error: "CORS error" (frontend can't reach backend)
**Fix**: Ensure backend runs on port 5000 and is reachable

### Questions are blank or malformed
**Fix**: Check Gemini API key is valid and has quota

## Performance Tips

### Response Times
- Quiz generation: 3-8 seconds (first time)
- Technical interview: 2-5 seconds per question
- Behavioral interview: 2-4 seconds

### Optimization (Future)
- Cache questions for 1 hour
- Batch API calls
- Implement Redis caching
- Add rate limiting

## Production Deployment

### Before deploying to production:

1. **Environment Variables** (use secure secrets manager)
   ```
   VITE_API_BASE_URL=https://api.youromain.com
   GEMINI_API_KEY=<production_key>
   GROQ_API_KEY=<production_key>
   NODE_ENV=production
   ```

2. **Build Frontend**
   ```bash
   npm run build
   # Creates optimized dist/ folder
   ```

3. **Security Checklist**
   - [ ] API keys in secure environment (not in code)
   - [ ] CORS whitelist configured for your domain
   - [ ] HTTPS enabled
   - [ ] Rate limiting enabled (optional but recommended)
   - [ ] Input validation verified
   - [ ] Error messages don't leak sensitive info

4. **Deploy**
   - Backend: Deploy `backend/` to Node.js host
   - Frontend: Deploy `frontend/dist/` to CDN/web server

## Key Changes Summary

| What Changed | Before | After |
|---|---|---|
| Questions | Database queries | AI-generated real-time |
| Variety | Limited (~50 per topic) | Infinite (unique every time) |
| API Calls | Frontend → Gemini | Frontend → Backend → Gemini |
| URLs | Hardcoded localhost | Environment config |
| Question Consistency | Same 10 questions | 10 different each session |

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] cURL POST to /generate-quiz returns 10 questions
- [ ] cURL POST to /generate-technical-interview returns 5 questions
- [ ] cURL POST to /generate-behavioral-interview returns 5 questions
- [ ] Invalid topic returns 400 error
- [ ] Quiz view loads questions without errors
- [ ] Interview view still works with Groq
- [ ] No API keys exposed in frontend
- [ ] Console shows no errors

## Getting Help

### Documentation
- `DYNAMIC_QUESTIONS_GUIDE.md` - Full implementation guide
- `API_REFERENCE.md` - All API endpoints with examples
- `IMPLEMENTATION_SUMMARY.md` - Detailed technical changes

### Common Issues
Check the **Troubleshooting** section above

### Code Changes
See `IMPLEMENTATION_SUMMARY.md` for exact line-by-line changes

## What's NOT Changed

✅ Database still works (can be used for analytics)  
✅ Interview chat still uses Groq (not Gemini)  
✅ Audio synthesis still works (Edge-TTS)  
✅ Authentication not required (can add later)  
✅ UI/UX remains the same  

## Next Steps

1. ✅ Implement dynamic questions (DONE)
2. 📋 Add rate limiting (recommended for production)
3. 📋 Implement question caching (performance improvement)
4. 📋 Add user authentication (security improvement)
5. 📋 Track question analytics (insights)

## Version Info

- Backend: Node.js/Express with Gemini API
- Frontend: React 19.2.6 with Vite
- API: RESTful JSON
- Deployment Ready: Yes (with config)

---

**Status**: ✅ Ready for testing and deployment  
**Test Recommendation**: Test locally first, then staging, then production  
**Support**: Check documentation files for detailed info
