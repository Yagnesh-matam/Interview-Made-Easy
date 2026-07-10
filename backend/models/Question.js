const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    topic: { 
        type: String, 
        required: true, 
        index: true,
        enum: [
            'Java', 'Python', 'C/C++', 'Software Engineering', 
            'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude',
            'Computer Networks', 'Git', 'OOPs'
        ] 
    },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    
    // NEW: Company Isolation Matrix Fields
    isCompanySpecific: { type: Boolean, default: false }, 
    targetCompany: { type: String, default: '' }, // e.g., 'Google', 'TCS', 'Deloitte'
    
    mediaUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);