const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Worker } = require('worker_threads');

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: (req, file, cb) => {
        const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        const isDOCX = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       file.mimetype === 'application/msword' || 
                       file.originalname.toLowerCase().endsWith('.docx');
        if (!isPDF && !isDOCX) {
            return cb(new Error('Only PDF and DOCX files are allowed'));
        }
        cb(null, true);
    }
});

function selectResumeContext(text, maxChars = 15000) {
    if (!text || typeof text !== 'string') return '';
    const clean = text.replace(/\r\n/g, '\n');
    if (clean.length <= maxChars) return clean;
    const sectionRegexes = [
        /(^|\n)\s*(work\s+experience|professional\s+experience|experience|employment|relevant\s+experience)\b/i,
        /(^|\n)\s*(technical\s+skills|skills|key\s+skills|competencies|expertise)\b/i,
        /(^|\n)\s*(projects|selected\s+projects|academic\s+projects|personal\s+projects)\b/i,
        /(^|\n)\s*(education|academic\s+background|qualifications)\b/i,
        /(^|\n)\s*(certifications|certification|awards|achievements)\b/i,
        /(^|\n)\s*(summary|profile|objective|about\s+me)\b/i
    ];
    const matches = [];
    for (let i = 0; i < sectionRegexes.length; i++) {
        const re = sectionRegexes[i];
        const m = clean.match(re);
        if (m && typeof m.index === 'number') {
            matches.push({ index: m.index, priority: i });
        }
    }
    if (matches.length === 0) {
        const head = Math.floor(maxChars * 0.7);
        const tail = maxChars - head;
        return clean.slice(0, head) + '\n\n... [truncated middle] ...\n\n' + clean.slice(Math.max(0, clean.length - tail));
    }
    matches.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.index - b.index;
    });
    const selectedParts = [];
    let used = 0;
    for (let j = 0; j < matches.length && used < maxChars; j++) {
        const start = Math.max(0, matches[j].index - 200);
        const chunkSize = Math.min(6000, maxChars - used);
        const chunk = clean.slice(start, start + chunkSize);
        if (chunk && selectedParts.indexOf(chunk) === -1) {
            selectedParts.push(chunk);
            used += chunk.length;
        }
    }
    let result = selectedParts.join('\n\n---\n\n');
    if (result.length > maxChars) {
        result = result.slice(0, maxChars);
    }
    if (result.length === 0) {
        const head = Math.floor(maxChars * 0.7);
        const tail = maxChars - head;
        return clean.slice(0, head) + '\n\n... [truncated middle] ...\n\n' + clean.slice(Math.max(0, clean.length - tail));
    }
    return result;
}

// @route   POST /api/resume/parse
// @desc    Accepts a PDF or DOCX resume, parses it, and extracts clean text
router.post('/parse', (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) {
            console.error("Multer file upload/filter error:", err.message);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded. Please upload a valid PDF or DOCX resume." });
        }

        const isPDF = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
        const isDOCX = req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       req.file.mimetype === 'application/msword' || 
                       req.originalname?.toLowerCase().endsWith('.docx') || 
                       req.file.originalname.toLowerCase().endsWith('.docx');

        if (!isPDF && !isDOCX) {
            return res.status(400).json({ error: "Invalid file type. Only PDF and DOCX formats are accepted." });
        }

        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: "File size exceeds 5 MB limit." });
        }

        let cleanText = '';
        try {
            const worker = new Worker(path.join(__dirname, '../workers/resumeParserWorker.js'), {
                workerData: {
                    buffer: req.file.buffer,
                    isPDF,
                    isDOCX
                }
            });
            const timeoutMs = 15000;
            const result = await new Promise((resolve, reject) => {
                let settled = false;
                const timeout = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    try { worker.terminate(); } catch (e) {}
                    reject(new Error('PDF_PARSE_TIMEOUT'));
                }, timeoutMs);
                worker.once('message', (msg) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timeout);
                    try { worker.terminate(); } catch (e) {}
                    resolve(msg);
                });
                worker.once('error', (err) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timeout);
                    try { worker.terminate(); } catch (e) {}
                    reject(err);
                });
                worker.once('exit', (code) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timeout);
                    if (code !== 0) {
                        reject(new Error('WORKER_EXIT_NONZERO'));
                    } else {
                        resolve({ success: false, error: 'WORKER_EXIT_NO_MESSAGE' });
                    }
                });
            });
            if (result && result.success && result.text) {
                cleanText = String(result.text).trim();
            } else {
                const errMsg = result && result.error ? result.error : 'PARSE_FAILED';
                if (errMsg === 'PDF_PARSE_TIMEOUT' || errMsg === 'DOCX_PARSE_TIMEOUT') {
                    return res.status(408).json({ error: "Resume parsing timed out. Please try a smaller file or paste the text directly." });
                }
                return res.status(400).json({ error: "Failed to extract text from this document. Please try a different format or paste the text directly." });
            }
        } catch (parseErr) {
            console.error("Resume parsing timeout/error:", parseErr.message);
            if (parseErr.message === 'PDF_PARSE_TIMEOUT' || parseErr.message === 'DOCX_PARSE_TIMEOUT') {
                return res.status(408).json({ error: "Resume parsing timed out. Please try a smaller file or paste the text directly." });
            }
            return res.status(400).json({ error: "Failed to extract text from this document. Please try a different format or paste the text directly." });
        }

        if (!cleanText) {
            return res.status(400).json({ error: "No extractable text content found in this document. Please check if the file is scanned or empty." });
        }

        const selectedText = selectResumeContext(cleanText, 15000);
        return res.json({ 
            message: "Resume parsed successfully!", 
            extractedText: selectedText 
        });

    } catch (error) {
        console.error("File parsing error:", error);
        res.status(500).json({ error: "Failed to process resume document." });
    }
});

module.exports = router;
module.exports.selectResumeContext = selectResumeContext;