const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Configure multer with security limits
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

        // Validate file size (additional check)
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: "File size exceeds 5 MB limit." });
        }

        let cleanText = '';
        try {
            if (isPDF) {
                // Parse PDF content using the highly reliable pdf-parse engine with a timeout guard
                const parsePromise = pdfParse(req.file.buffer);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PDF_PARSE_TIMEOUT')), 15000));
                const data = await Promise.race([parsePromise, timeoutPromise]);
                cleanText = (data && data.text ? data.text : '').trim();
            } else if (isDOCX) {
                // Parse DOCX content using mammoth with a timeout guard
                const parsePromise = mammoth.extractRawText({ buffer: req.file.buffer });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DOCX_PARSE_TIMEOUT')), 15000));
                const result = await Promise.race([parsePromise, timeoutPromise]);
                cleanText = (result && result.value ? result.value : '').trim();
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

        // Return clean extracted text to client (bounded)
        return res.json({ 
            message: "Resume parsed successfully!", 
            extractedText: cleanText.substring(0, 15000) 
        });

    } catch (error) {
        console.error("File parsing error:", error);
        res.status(500).json({ error: "Failed to process resume document." });
    }
});

module.exports = router;