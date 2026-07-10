// QuizEngine.jsx (Fully Redesigned & Enhanced)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const getSubjectSpecificFeedback = (topic) => {
    switch (topic) {
        case 'Java':
            return "Practice explaining core Java concepts (like Garbage Collection, JVM memory model, multi-threading, or OOP design patterns) using standard definitions.";
        case 'Python':
            return "Practice explaining Python concepts (like GIL, list comprehensions, decorators, generator expressions, or memory management) using standard definitions.";
        case 'C/C++':
            return "Practice detailing C/C++ specific concepts (like pointers & memory addresses, RAII, rule of five, manual memory allocation, or virtual tables) using standard definitions.";
        case 'DSA':
            return "Practice explaining core DSA concepts (like Big O notation, balanced trees, graph traversals, or dynamic programming state transitions) using standard definitions.";
        case 'DBMS':
            return "Practice explaining relational database concepts (like ACID properties, index structuring, normalization levels, or transaction isolation) using standard definitions.";
        case 'Operating Systems':
            return "Practice detailing operating system concepts (like processes vs threads, virtual memory, scheduling algorithms, or deadlocks) using standard definitions.";
        case 'Computer Networks':
            return "Practice explaining networking concepts (like TCP/IP handshake, DNS resolution, HTTP/S protocols, or OSI model layers) using standard definitions.";
        case 'OOPs':
            return "Practice explaining object-oriented principles (like inheritance, polymorphism, encapsulation, abstraction, or SOLID principles) using standard definitions.";
        case 'Git':
            return "Practice detailing version control concepts (like rebasing vs merging, cherry-picking, stash mechanics, or branch workflows) using standard definitions.";
        case 'Software Engineering':
            return "Practice explaining software engineering concepts (like CI/CD pipelines, design patterns, testing strategies, or agile methodologies) using standard definitions.";
        case 'Soft Skills':
        case 'Interview Etiquette':
            return "Practice using structured frameworks (like STAR method, active listening, or concise summarizing) to present answers professionally.";
        case 'Aptitude':
            return "Practice quantitative speed tricks (like mental percentages, ratio modeling, or logical syllogisms) to optimize pacing.";
        default:
            return "Practice explaining core domain terminologies and architectural trade-offs using standard industry definitions.";
    }
};

const QuizEngine = ({ theme, onAnswerSelected, onQuizCompleted }) => {
    const [selectedTopic, setSelectedTopic] = useState('');
    const [quizStarted, setQuizStarted] = useState(false);
    const [questions, setQuestions] = useState([]);          // all fetched questions
    const [currentIndex, setCurrentIndex] = useState(0);
    const [difficulty, setDifficulty] = useState('Easy');    // current difficulty level
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [expandedReviewIdx, setExpandedReviewIdx] = useState(null);

    // Track user answers (stores objects representing performance)
    const [userSessions, setUserSessions] = useState([]);

    // Store question texts and types already asked to enforce uniqueness
    const [askedQuestions, setAskedQuestions] = useState([]);
    const [askedTypes, setAskedTypes] = useState([]);

    const topics = [
        'Java', 'Python', 'C/C++', 'Software Engineering', 
        'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude',
        'Computer Networks', 'Git', 'OOPs'
    ];

    // Reset everything when starting a new quiz
    const startQuiz = async () => {
        if (!selectedTopic) return;
        setQuizStarted(true);
        setQuestions([]);
        setCurrentIndex(0);
        setDifficulty('Easy');
        setSelectedAnswer(null);
        setAnswered(false);
        setQuizCompleted(false);
        setError('');
        setCorrectCount(0);
        setFeedback(null);
        setAskedQuestions([]);
        setAskedTypes([]);
        setUserSessions([]);
        setLoading(true);

        try {
            // Fetch first question
            const response = await axios.post(`${API_BASE_URL}/api/dynamic-questions/adaptive-quiz`, {
                topic: selectedTopic,
                difficulty: 'Easy',
                previousQuestions: [],
                previousTypes: []
            });
            if (response.data.success) {
                const q = response.data.question;
                setQuestions([q]);
                setAskedQuestions([q.q]);
                setAskedTypes([q.type]);
            } else {
                throw new Error('No question returned');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to start quiz. Please verify your connection or key quotas and try again.');
            setQuizStarted(false);
        } finally {
            setLoading(false);
        }
    };

    // Handle answer selection
    const handleAnswer = (optionIndex) => {
        if (answered || loading) return;
        const currentQ = questions[currentIndex];
        const isCorrect = optionIndex === currentQ.correct;
        
        setSelectedAnswer(optionIndex);
        setAnswered(true);
        if (onAnswerSelected) {
            onAnswerSelected(isCorrect);
        }

        // Record session history
        const sessionItem = {
            question: currentQ.q,
            options: currentQ.options,
            correctIndex: currentQ.correct,
            userIndex: optionIndex,
            isCorrect: isCorrect,
            expl: currentQ.expl,
            tip: currentQ.tip,
            difficulty: currentQ.difficulty,
            type: currentQ.type
        };
        setUserSessions(prev => [...prev, sessionItem]);

        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
            // Increase difficulty (up one level)
            setDifficulty(prev => {
                if (prev === 'Easy') return 'Medium';
                if (prev === 'Medium') return 'Hard';
                return 'Hard';
            });
        } else {
            // Decrease difficulty (down one level)
            setDifficulty(prev => {
                if (prev === 'Hard') return 'Medium';
                if (prev === 'Medium') return 'Easy';
                return 'Easy';
            });
        }
        
        setFeedback({
            expl: currentQ.expl,
            tip: currentQ.tip,
            isCorrect: isCorrect
        });
    };

    // Load next question
    const loadNextQuestion = async () => {
        if (currentIndex + 1 >= 10) {
            // Quiz complete
            setQuizCompleted(true);
            if (onQuizCompleted) {
                onQuizCompleted();
            }
            return;
        }

        setLoading(true);
        setError('');

        try {
            const nextDiff = userSessions[userSessions.length - 1]?.isCorrect
                ? (questions[currentIndex].difficulty === 'Easy' ? 'Medium' : 'Hard')
                : (questions[currentIndex].difficulty === 'Hard' ? 'Medium' : 'Easy');

            const response = await axios.post(`${API_BASE_URL}/api/dynamic-questions/adaptive-quiz`, {
                topic: selectedTopic,
                difficulty: nextDiff,
                previousQuestions: askedQuestions,
                previousTypes: askedTypes
            });

            if (response.data.success) {
                const newQ = response.data.question;
                setQuestions(prev => [...prev, newQ]);
                setAskedQuestions(prev => [...prev, newQ.q]);
                setAskedTypes(prev => [...prev, newQ.type]);
                
                // Reset answer/feedback states ONLY on successful API response
                setSelectedAnswer(null);
                setAnswered(false);
                setFeedback(null);
                
                setCurrentIndex(prev => prev + 1);
                setDifficulty(newQ.difficulty);
            } else {
                throw new Error('No question returned');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load next question. Please click "Next Question" to retry.');
        } finally {
            setLoading(false);
        }
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setQuizCompleted(false);
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setError('');
        setCorrectCount(0);
        setFeedback(null);
        setAskedQuestions([]);
        setAskedTypes([]);
        setUserSessions([]);
        setExpandedReviewIdx(null);
    };

    // Helper to render formatting code snippets inside questions beautifully
    const renderQuestionText = (text) => {
        if (!text) return null;
        const parts = text.split(/(```[\s\S]*?```)/g);
        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                const match = part.match(/```(\w*)\n([\s\S]*?)```/);
                const lang = match ? match[1] : '';
                const code = match ? match[2].trim() : part.replace(/```/g, '').trim();
                const lines = code.split('\n');
                
                return (
                    <div key={index} className="my-5 rounded-xl overflow-hidden border border-slate-700/50 dark:border-white/10 bg-[#0d1117] font-mono text-[11px] md:text-xs shadow-lg animate-item">
                        <div className="flex justify-between items-center px-4 py-2 bg-[#161b22] border-b border-slate-700/50 dark:border-white/10 text-[10px] text-slate-400">
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                            </div>
                            <span className="uppercase tracking-wider font-bold text-[9px]">{lang || 'CODE'}</span>
                        </div>
                        <div className="flex overflow-x-auto text-left leading-relaxed text-slate-200">
                            <div className="select-none text-right pr-3 pl-2 py-3 bg-[#0a0d14] border-r border-slate-800 text-slate-650 min-w-[2.5rem]">
                                {lines.map((_, i) => (
                                    <div key={i} className="h-5">{i + 1}</div>
                                ))}
                            </div>
                            <pre className="p-3 m-0 flex-1 whitespace-pre">
                                <code>{code}</code>
                            </pre>
                        </div>
                    </div>
                );
            }
            return (
                <p key={index} className="text-base md:text-lg font-bold text-appText leading-relaxed whitespace-pre-line my-4 text-left">
                    {part}
                </p>
            );
        });
    };

    // Render icon based on question type
    const getTypeEmoji = (type) => {
        switch (type) {
            case 'Theory': return '📝';
            case 'Code Debugging': return '🐞';
            case 'Complete Code': return '🔧';
            case 'Logic/Output': return '🧠';
            case 'Architecture/Scenario': return '🏗️';
            default: return '❓';
        }
    };

    const currentQuestion = questions[currentIndex];

    // SVGs or graphics for Results Screen
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (correctCount / 10) * circumference;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Topic Selection Panel */}
            {!quizStarted && (
                <div className="bg-appCard p-8 rounded-2xl border border-appBorder shadow-xl max-w-xl mx-auto transition-all duration-300">
                    <div className="text-center mb-6">
                        <span className="text-5xl animate-pulse inline-block">🚀</span>
                        <h3 className="text-2xl font-black text-appText mt-3 tracking-wide">Adaptive AI Quiz Master</h3>
                        <p className="text-xs text-appText/50 mt-1.5 max-w-md mx-auto leading-relaxed">
                            Generate unique questions on demand via our proprietary AI engine. The quiz adapts to your performance dynamically.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-500 text-xs rounded-xl mb-4 text-center font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-black text-appText/60 uppercase tracking-widest mb-2 font-mono">Select Core Domain</label>
                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                {topics.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTopic(t)}
                                        className={`p-3 text-xs font-bold rounded-xl border text-left transition-all ${
                                            selectedTopic === t
                                                ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-md shadow-[var(--accent-cyan)]/10'
                                                : 'bg-appBg border-appBorder text-appText/70 hover:border-[var(--accent-cyan)]/45'
                                        }`}
                                    >
                                        🔹 {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={startQuiz}
                            disabled={!selectedTopic}
                            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                selectedTopic 
                                    ? 'bg-[var(--accent-cyan)] text-slate-950 hover:bg-opacity-90 shadow-lg shadow-[var(--accent-cyan)]/20 cursor-pointer' 
                                    : 'bg-appBorder text-appText/30 cursor-not-allowed'
                            }`}
                        >
                            Initialize Quiz Node
                        </button>
                    </div>
                </div>
            )}

            {/* Quiz Screen */}
            {quizStarted && !quizCompleted && (
                <div className="bg-appCard p-6 md:p-8 rounded-2xl border border-appBorder shadow-2xl min-h-[420px] transition-all duration-300">
                    
                    {/* Progress Bar Header */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <div className="flex gap-2">
                                <span className="font-bold text-[10px] bg-appBg px-3 py-1 border border-appBorder rounded-full text-appText/80 shadow-sm">
                                    {selectedTopic}
                                </span>
                                <span className={`font-bold text-[10px] px-3 py-1 border rounded-full flex items-center gap-1 ${
                                    difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {difficulty}
                                </span>
                            </div>
                            <span className="font-bold text-appText/50 tracking-wider">
                                QUESTION {currentIndex + 1} OF 10
                            </span>
                        </div>

                        {/* Interactive Bar */}
                        <div className="w-full bg-appBg/50 border border-appBorder h-2 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${((currentIndex + (answered ? 1 : 0)) / 10) * 100}%` }}
                            />
                        </div>
                    </div>

                    {loading && (
                        <div className="flex flex-col justify-center items-center py-28 space-y-4">
                            <div className="w-10 h-10 border-4 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-mono text-appText/50 tracking-widest animate-pulse">GENERATING INTERVIEW DECK...</p>
                        </div>
                    )}

                    {!loading && currentQuestion && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Question Type Header */}
                            <div className="flex justify-start">
                                <span className="text-[10px] font-mono font-black tracking-widest uppercase bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] px-3 py-1 rounded-md border border-[var(--accent-cyan)]/20 flex items-center gap-1.5">
                                    <span>{getTypeEmoji(currentQuestion.type)}</span>
                                    <span>{currentQuestion.type}</span>
                                </span>
                            </div>

                            {/* Rendered Question text (and CodeBlock) */}
                            <div className="text-left font-serif">
                                {renderQuestionText(currentQuestion.q)}
                            </div>

                            {/* Options grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                                {currentQuestion.options.map((opt, idx) => {
                                    const prefixes = ['A', 'B', 'C', 'D'];
                                    let btnClass = "relative text-left p-4 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center gap-3 w-full cursor-pointer ";
                                    let prefixClass = "w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ";

                                    if (answered) {
                                        if (idx === currentQuestion.correct) {
                                            btnClass += "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-bold scale-[1.01]";
                                            prefixClass += "bg-emerald-500 border-emerald-500 text-slate-950 font-black";
                                        } else if (idx === selectedAnswer) {
                                            btnClass += "border-rose-500/50 bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] font-bold";
                                            prefixClass += "bg-rose-500 border-rose-500 text-slate-950 font-black";
                                        } else {
                                            btnClass += "border-appBorder bg-appBg/20 opacity-30 text-appText/40 scale-[0.98]";
                                            prefixClass += "border-appBorder text-appText/30 bg-appBg/40";
                                        }
                                    } else {
                                        btnClass += "border-appBorder bg-appBg hover:border-[var(--accent-cyan)]/70 hover:bg-appBg/80 text-appText hover:shadow-[0_0_12px_rgba(0,245,212,0.1)] hover:scale-[1.005]";
                                        prefixClass += "border-appBorder text-appText/50 bg-appBg/50 group-hover:text-appText group-hover:border-[var(--accent-cyan)]";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !answered && handleAnswer(idx)}
                                            disabled={answered}
                                            className={`${btnClass} group`}
                                        >
                                            <span className={prefixClass}>{prefixes[idx]}</span>
                                            <span className="flex-1 text-left leading-relaxed">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Detailed Feedback Panel */}
                            {answered && feedback && (
                                <div className="mt-6 space-y-3 animate-slideIn">
                                    {/* Evaluation Card Header */}
                                    <div className={`p-3 border rounded-xl flex items-center gap-2 text-xs font-bold ${
                                        feedback.isCorrect 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}>
                                        <span>{feedback.isCorrect ? '✅' : '❌'}</span>
                                        <span>{feedback.isCorrect ? 'CORRECT ASSESSMENT' : 'INCORRECT ASSESSMENT'}</span>
                                    </div>

                                    {/* Split concept and tip cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        {/* Concept Card */}
                                        <div className="md:col-span-3 p-4 bg-appBg/60 border border-appBorder rounded-xl text-left space-y-1.5">
                                            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-wider block font-bold">💡 Core Concept</span>
                                            <p className="text-xs leading-relaxed text-appText/85 font-medium whitespace-pre-line">{feedback.expl}</p>
                                        </div>

                                        {/* Interview Tip Card */}
                                        <div className="md:col-span-2 p-4 bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/20 rounded-xl text-left space-y-1.5">
                                            <span className="text-[10px] font-mono font-black text-[var(--accent-gold)] uppercase tracking-wider block font-bold">🎯 Interview Takeaway</span>
                                            <p className="text-xs leading-relaxed text-appText/85 font-medium whitespace-pre-line">{feedback.tip || 'Practice detailing core trade-offs.'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Navigation */}
                            {answered && (
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={loadNextQuestion}
                                        disabled={loading}
                                        className="px-6 py-3 bg-[var(--accent-cyan)] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-[var(--accent-cyan)]/25 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {currentIndex + 1 === 10 ? 'Deconstruct Deck' : 'Next Question'}
                                        <span>🡢</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Quiz Completed Dashboard */}
            {quizCompleted && (
                <div className="bg-appCard p-6 md:p-8 rounded-2xl border border-appBorder shadow-2xl animate-item">
                    
                    {/* Circle Radial Chart Summary */}
                    <div className="flex flex-col md:flex-row justify-around items-center gap-6 border-b border-appBorder pb-8 mb-6">
                        
                        {/* Circle Score Indicator */}
                        <div className="relative flex items-center justify-center">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle 
                                    cx="64" 
                                    cy="64" 
                                    r={radius} 
                                    stroke="currentColor" 
                                    strokeWidth="6" 
                                    fill="transparent" 
                                    className="text-appBg border-appBorder"
                                    style={{ color: 'var(--border-subtle)' }}
                                />
                                <circle 
                                    cx="64" 
                                    cy="64" 
                                    r={radius} 
                                    stroke="currentColor" 
                                    strokeWidth="6" 
                                    fill="transparent" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="text-[var(--accent-cyan)] transition-all duration-1000 ease-out"
                                    style={{ color: 'var(--accent-cyan)' }}
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-2xl font-black text-appText block leading-none">{correctCount}/10</span>
                                <span className="text-[9px] font-mono font-bold text-appText/40 uppercase tracking-widest block mt-0.5">ACCURACY</span>
                            </div>
                        </div>

                        {/* Metric Blocks */}
                        <div className="text-left space-y-4 flex-1">
                            <div>
                                <h3 className="text-2xl font-black text-appText tracking-wide">Quest Evaluation Complete</h3>
                                <p className="text-xs text-appText/50 mt-0.5 leading-relaxed">
                                    Your response profiles have been deconstructed. Adaptive difficulty settled at <span className="text-[var(--accent-gold)] font-bold">{difficulty}</span>.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-3 bg-appBg/50 border border-appBorder rounded-xl min-w-[5.5rem] text-center">
                                    <span className="text-[9px] font-mono font-black text-appText/40 uppercase tracking-wider block">SCORE</span>
                                    <span className="text-lg font-black text-[var(--accent-cyan)]" style={{ color: 'var(--accent-cyan)' }}>{Math.round((correctCount/10)*100)}%</span>
                                </div>
                                <div className="p-3 bg-appBg/50 border border-appBorder rounded-xl min-w-[5.5rem] text-center">
                                    <span className="text-[9px] font-mono font-black text-appText/40 uppercase tracking-wider block">DIFFICULTY</span>
                                    <span className="text-lg font-black text-[var(--accent-gold)]" style={{ color: 'var(--accent-gold)' }}>{difficulty}</span>
                                </div>
                                <div className="p-3 bg-appBg/50 border border-appBorder rounded-xl min-w-[5.5rem] text-center">
                                    <span className="text-[9px] font-mono font-black text-appText/40 uppercase tracking-wider block">DOMAIN</span>
                                    <span className="text-lg font-black text-appText/80">{selectedTopic}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Performance Review Feedback Card */}
                    <div className="mb-8 p-5 border rounded-2xl bg-gradient-to-tr from-slate-900/60 to-slate-950/60 dark:border-white/5 border-slate-200 text-left space-y-4 shadow-md">
                        <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span>📊</span> Performance & Skills Diagnostic
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Column 1: Technical & Problem Solving */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">💻 Technical & Analytical Depth</span>
                                <div className="p-3 bg-appBg/60 border border-appBorder rounded-xl min-h-[90px]">
                                    <p className="leading-relaxed text-appText/90 font-medium">
                                        {correctCount >= 9 ? (
                                            "Outstanding conceptual accuracy! You exhibit deep domain expertise, exceptional logical deduction skills, and a strong eye for micro-optimization edge cases."
                                        ) : correctCount >= 7 ? (
                                            "Proficient technical knowledge. You demonstrate a solid grasp of core algorithms and architectural concepts, though minor speed-coding or language quirks need polish."
                                        ) : correctCount >= 5 ? (
                                            "Intermediate skills identified. You have a decent foundation, but tend to struggle with complex pointer manipulation, output tracing, or system design trade-offs."
                                        ) : (
                                            "Foundational gaps detected. Focus on reviewing base syntax, standard libraries, and common runtime constraints inside our Study Portal before re-evaluating."
                                        )}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Column 2: Language & Cognitive Speed */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">💬 Communication & Cognitive Pacing</span>
                                <div className="p-3 bg-appBg/60 border border-appBorder rounded-xl min-h-[90px]">
                                    <p className="leading-relaxed text-appText/90 font-medium">
                                        {selectedTopic === 'Soft Skills' || selectedTopic === 'Aptitude' ? (
                                            correctCount >= 8 ? (
                                                "Excellent situational awareness and high corporate vocabulary eloquence. You demonstrate mature leadership traits and logical structuring."
                                            ) : (
                                                "Good communication instincts. Try to utilize more professional structural frameworks (like STAR or pyramid principles) to convey details with maximum clarity."
                                            )
                                        ) : (
                                            correctCount >= 8 ? (
                                                "Precise terminology mapping. Your understanding of technical nomenclature is outstanding, translating directly to confidence in engineering communication."
                                            ) : (
                                                "Conceptual terminology is slightly mixed. " + getSubjectSpecificFeedback(selectedTopic)
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Roadmap Takeaway */}
                        <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                            <span className="text-lg">🎯</span>
                            <div>
                                <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-wider block">Targeted Remediation Recommendation</span>
                                <p className="text-[11px] leading-relaxed text-appText/85 mt-0.5">
                                    {correctCount >= 8 
                                        ? `Maintain this standard! Challenge yourself with 'Hard' topics or try our Vocal AI Arena mock panel to test your verbal defense skills.`
                                        : `Spend 15-20 minutes studying the ${selectedTopic} reference sheets under our Study Portal. Pay close attention to definitions and sample output questions.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Question Accordion Review */}
                    <div className="space-y-3 text-left">
                        <h4 className="text-xs font-mono font-black text-appText/60 uppercase tracking-widest mb-3">Response Breakdown Review</h4>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {userSessions.map((session, idx) => {
                                const isExpanded = expandedReviewIdx === idx;
                                return (
                                    <div key={idx} className="border border-appBorder rounded-xl overflow-hidden transition-all bg-appBg/20 hover:bg-appBg/40">
                                        {/* Header Accordion bar */}
                                        <button
                                            onClick={() => setExpandedReviewIdx(isExpanded ? null : idx)}
                                            className="w-full p-4 flex items-center justify-between gap-4 text-xs font-bold text-left cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${session.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                <span className="font-mono text-[10px] text-appText/40">Q{idx+1}</span>
                                                <p className="truncate text-appText/90 font-bold flex-1">{session.question.replace(/```[\s\S]*?```/g, '[CodeSnippet]')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono bg-appBg/60 px-2 py-0.5 border border-appBorder rounded text-appText/50">
                                                    {session.difficulty}
                                                </span>
                                                <span className="text-appText/40">{isExpanded ? '▲' : '▼'}</span>
                                            </div>
                                        </button>

                                        {/* Expanded review details */}
                                        {isExpanded && (
                                            <div className="p-4 border-t border-appBorder bg-appBg/50 space-y-4 animate-slideIn">
                                                {/* Full Question Text */}
                                                <div>
                                                    <span className="text-[9px] font-mono font-black text-appText/40 uppercase tracking-wider block mb-1">Question</span>
                                                    <div className="text-xs text-appText/90 font-serif leading-relaxed">
                                                        {renderQuestionText(session.question)}
                                                    </div>
                                                </div>

                                                {/* Answers comparison */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                        <span className="text-[9px] font-mono font-black uppercase tracking-wider block opacity-70 mb-0.5">Correct Answer</span>
                                                        <span className="font-bold">{session.options[session.correctIndex]}</span>
                                                    </div>
                                                    <div className={`p-3 rounded-lg border ${
                                                        session.isCorrect 
                                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                    }`}>
                                                        <span className="text-[9px] font-mono font-black uppercase tracking-wider block opacity-70 mb-0.5">Your Response</span>
                                                        <span className="font-bold">{session.options[session.userIndex]}</span>
                                                    </div>
                                                </div>

                                                {/* Concept and tip */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                    <div className="p-3 bg-appBg/80 border border-appBorder rounded-lg">
                                                        <span className="text-[9px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-wider block mb-1" style={{ color: 'var(--accent-cyan)' }}>💡 Concept explanation</span>
                                                        <p className="text-[11px] leading-relaxed text-appText/80 font-medium">{session.expl}</p>
                                                    </div>
                                                    <div className="p-3 bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/10 rounded-lg">
                                                        <span className="text-[9px] font-mono font-black text-[var(--accent-gold)] uppercase tracking-wider block mb-1" style={{ color: 'var(--accent-gold)' }}>🎯 Interview Takeaway</span>
                                                        <p className="text-[11px] leading-relaxed text-appText/80 font-medium">{session.tip || 'Practice detailing core trade-offs.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={resetQuiz}
                            className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer transform active:scale-95"
                        >
                            Start Fresh Evaluation
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default QuizEngine;