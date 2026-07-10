const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    totalAiSessions: { type: Number, default: 0 }, // Traces active AI usage loops
    quizHistory: [{
        topic: String,
        score: Number,
        totalQuestions: Number,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);