import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
    }
}

if (!supabase) {
    console.warn("Supabase credentials missing. Initializing mock auth services.");
    supabase = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signUp: async () => ({ data: {}, error: new Error("Supabase is not configured.") }),
            signInWithPassword: async () => ({ data: {}, error: new Error("Supabase is not configured.") }),
            signInWithOAuth: async () => ({ error: new Error("Supabase is not configured.") }),
            signOut: async () => ({ error: null }),
            updateUser: async () => ({ data: {}, error: null })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: new Error("Supabase is not configured.") })
                })
            })
        })
    };
}
import axios from 'axios';
import QuizEngine from './components/QuizEngine';

// Centralized API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ============================================================================
// SYSTEM DATA & BLUEPRINTS
// ============================================================================
const TOPICS = [
    'Java', 'Python', 'C/C++', 'Software Engineering', 
    'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude',
    'Computer Networks', 'Git', 'OOPs'
];

const STUDY_DATABASE = [
    {
        title: "Java",
        icon: "☕",
        questions: [
            { q: "Why is Java a platform-independent language?", a: "Java compiles code into bytecode (.class files) rather than native machine instructions. The platform-dependent Java Virtual Machine (JVM) interprets this bytecode at runtime, allowing the same code to run anywhere a JVM is installed." },
            { q: "What is the difference between Heap and Stack memory in Java?", a: "Stack memory is utilized for temporary local variables and method invocation frames in a LIFO order. Heap memory is used for dynamic allocation of objects and instance variables, which are collected by the Garbage Collector when unreferenced." }
        ]
    },
    {
        title: "Python",
        icon: "🐍",
        questions: [
            { q: "What is the PEP 8 standard and why does it matter?", a: "PEP 8 is Python's official style guide. It sets standard formatting conventions (such as snake_case for functions and 4 spaces for indentation) to ensure maximum code readability across the open-source community." },
            { q: "How does memory management work in Python?", a: "Python manages memory dynamically using a private heap. It relies on automatic Reference Counting to destroy objects whose reference counter hits zero, and a Generational Garbage Collector to detect and resolve cyclic reference loops." }
        ]
    },
    {
        title: "C/C++",
        icon: "👾",
        questions: [
            { q: "What is a pointer and how does it differ from a reference?", a: "A pointer is a variable that stores the direct memory address of another variable and can be reassigned or set to null. A reference is an alias to an existing variable, cannot be null, and cannot be reassigned after initialization." },
            { q: "Explain the concept of Virtual Functions and polymorphism.", a: "A virtual function is a member function in a base class that is overridden in a derived class. Declaring it 'virtual' ensures that the compiler resolves the method binding at runtime based on the actual object type rather than the reference pointer." }
        ]
    },
    {
        title: "Software Engineering",
        icon: "🏗️",
        questions: [
            { q: "What is the difference between Agile and Waterfall methodologies?", a: "Waterfall is a linear, sequential model where each phase must finish before the next begins. Agile is iterative and incremental, focusing on continuous user feedback, collaboration, and rapid sprint cycles." },
            { q: "Explain the SOLID design principles.", a: "SOLID comprises: Single Responsibility, Open-Closed (extendable but not modifiable), Liskov Substitution (subclasses replace parent classes safely), Interface Segregation, and Dependency Inversion." }
        ]
    },
    {
        title: "DSA",
        icon: "📊",
        questions: [
            { q: "How do you detect a cycle in a singly linked list?", a: "Use Floyd's Cycle-Finding Algorithm (Hare and Tortoise), which moves two pointers at different speeds (1 step and 2 steps). If they meet, a cycle exists; if the fast pointer reaches null, there is no cycle." },
            { q: "What is the difference between BFS and DFS?", a: "Breadth-First Search traverses a graph level-by-level using a Queue data structure (ideal for finding the shortest path). Depth-First Search plunges deep down branch lines using a Stack or recursion." }
        ]
    },
    {
        title: "DBMS",
        icon: "💽",
        questions: [
            { q: "Explain ACID properties in relational databases.", a: "ACID stands for: Atomicity (all-or-nothing execution), Consistency (preserves database rules), Isolation (concurrent transactions don't interfere), and Durability (permanence on non-volatile disk storage)." },
            { q: "What is database normalization and why do we do it?", a: "Normalization organizes database tables to minimize data redundancy and eliminate anomalies (insertion, update, and deletion). It splits large tables and links them through defined relationships." }
        ]
    },
    {
        title: "Operating Systems",
        icon: "🖥️",
        questions: [
            { q: "What is a Deadlock and what are the four Coffman conditions?", a: "A deadlock is a state where processes are frozen awaiting resources held by one another. The 4 mandatory conditions are: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait." },
            { q: "What is virtual memory and paging?", a: "Virtual memory maps process addresses to physically non-contiguous memory blocks called pages, storing inactive segments on secondary disk swaps to let programs run beyond physical RAM capacities." }
        ]
    },
    {
        title: "Soft Skills",
        icon: "🗣️",
        questions: [
            { q: "How do you handle conflict in a development team?", a: "First, listen actively to all perspectives without bias. Address the problem directly rather than personal attributes, collaborate to find an objective win-win solution, and document clear outcomes." },
            { q: "How do you explain technical concepts to non-technical stakeholders?", a: "Avoid dense jargon, utilize real-world analogies, focus on 'what' the business value is rather than 'how' the code compiles, and invite questions to gauge comprehension dynamically." }
        ]
    },
    {
        title: "Aptitude",
        icon: "🧮",
        questions: [
            { q: "If a train runs at 60 km/h, how far does it travel in 15 minutes?", a: "15 minutes is 1/4th of an hour (15/60). Distance = Speed * Time = 60 km/h * 0.25 h = 15 km." },
            { q: "A work can be done by A in 10 days and by B in 15 days. How long to do it together?", a: "Daily rates: A = 1/10, B = 1/15. Together = 1/10 + 1/15 = 5/30 = 1/6 daily. Thus, they will finish the work together in exactly 6 days." }
        ]
    },
    {
        title: "Computer Networks",
        icon: "🌐",
        questions: [
            { q: "What is the difference between TCP and UDP?", a: "TCP is connection-oriented, guarantees packet delivery and ordering, and has flow control (best for Web, Emails). UDP is connectionless, faster, but does not guarantee delivery (best for video streams, gaming)." },
            { q: "Explain the roles of DNS.", a: "The Domain Name System (DNS) acts as the phonebook of the internet, resolving human-readable domain names (e.g., google.com) into machine-readable IP addresses (e.g., 142.250.190.46)." }
        ]
    },
    {
        title: "Git",
        icon: "🔀",
        questions: [
            { q: "What is the difference between git merge and git rebase?", a: "Merge takes the changes from one branch and merges them into another via a single merge commit, preserving historical chronology. Rebase applies your commits on top of the target branch, flattening the tree." },
            { q: "What does git stash do?", a: "Git stash temporarily shelves (stores) uncommitted modifications (both staged and unstaged) to restore clean working state, allowing you to switch branches without committing unfinished work." }
        ]
    },
    {
        title: "Interview Etiquette",
        icon: "👔",
        questions: [
            { q: "How should you structure your response to behavioral interview questions?", a: "Use the STAR method: Situation (explain the context/scenario), Task (describe the challenge or responsibility), Action (detail the specific steps you took to address the problem), and Result (highlight the positive outcome, metrics, or lessons learned)." },
            { q: "What is the appropriate etiquette when asked a question you do not know the answer to?", a: "Be honest instead of guessing or fabricating. Explain your thought process, outline how you would logically approach solving it, and mention the resources (documentation, debugging logs, team collaboration) you would use to find the solution." }
        ]
    }
];

// Helper to fetch dynamic AI questions directly from Gemini API with exponential backoff
/**
 * DYNAMIC AI QUESTION GENERATION ENGINE
 * Generates infinite, unique questions via Gemini API (no database dependency)
 */

const fetchDynamicAIQuestions = async (topicName, retries = 5, delay = 1000) => {
    const apiKey = ""; // Runtime automatically provisions the key here
    const model = "gemini-2.5-flash-preview-09-2025";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `
You are an elite technical interviewer and adaptive quiz master.
Generate exactly 10 COMPLETELY UNIQUE, HIGH-QUALITY, DIVERSE multiple-choice questions for: "${topicName}".

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
                                expl: { type: "STRING" }
                            },
                            required: ["q", "options", "correct", "expl"]
                        }
                    }
                },
                required: ["questions"]
            }
        }
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error Status: ${response.status}`);
            }

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
            const data = JSON.parse(textResponse);
            
            if (data && Array.isArray(data.questions) && data.questions.length > 0) {
                return data.questions.slice(0, 10);
            }
            throw new Error("Invalid schema structure returned from AI model.");
        } catch (error) {
            if (attempt === retries) {
                throw error; // Propagate the error upward after exhausting all retry channels
            }
            // Execute Exponential Backoff delay
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double delay duration sequentially: 1s, 2s, 4s, 8s, 16s
        }
    }
};

/**
 * TECHNICAL INTERVIEW QUESTIONS (Open-ended, in-depth)
 * For Vocal AI Arena - Technical Mode
 * Tests deep understanding, system design, debugging skills
 */
const fetchDynamicTechnicalInterviewQuestions = async (topicName, companyName = "") => {
    const apiKey = "";
    const model = "gemini-2.5-flash-preview-09-2025";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const companyContext = companyName ? `You are interviewing for a position at ${companyName}.` : "You are in a general technical interview.";

    const systemPrompt = `
${companyContext} Generate exactly 5 unique, challenging TECHNICAL INTERVIEW QUESTIONS for topic: "${topicName}".

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
            "q": "Full detailed question text here (can include code blocks using triple backticks)",
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

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
                return parsed.questions || [];
            }
        }
    } catch (error) {
        console.error("Technical interview generation error:", error);
    }
    return [];
};

/**
 * BEHAVIORAL & HR INTERVIEW QUESTIONS (Soft skills, teamwork, growth)
 * For Vocal AI Arena - Behavioral Mode
 * Tests communication, leadership, conflict resolution, adaptability
 */
const fetchDynamicBehavioralInterviewQuestions = async () => {
    const apiKey = "";
    const model = "gemini-2.5-flash-preview-09-2025";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
                return parsed.questions || [];
            }
        }
    } catch (error) {
        console.error("Behavioral interview generation error:", error);
    }
    return [];
};

const App = () => {
    // === AUTHENTICATION & WALLET DATABASE STORAGE STATES ===
    const [user, setUser] = useState(null);
    const [credits, setCredits] = useState(0);
    const [authForm, setAuthForm] = useState({ email: '', password: '', isSignUp: false });
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    // === DYNAMIC PERFORMANCE METRICS STATES ===
    const [totalQuizzesTaken, setTotalQuizzesTaken] = useState(() => {
        return parseInt(localStorage.getItem('totalQuizzesTaken') || '0', 10);
    });
    const [totalInterviewsDone, setTotalInterviewsDone] = useState(() => {
        return parseInt(localStorage.getItem('totalInterviewsDone') || '0', 10);
    });
    const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(() => {
        return parseInt(localStorage.getItem('totalQuestionsAnswered') || '0', 10);
    });
    const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(() => {
        return parseInt(localStorage.getItem('totalCorrectAnswers') || '0', 10);
    });

    const accuracyRate = totalQuestionsAnswered > 0 
        ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) 
        : 0;

    const [currentView, setCurrentView] = useState(() => {
        return sessionStorage.getItem('prepquest_view') || 'home';
    });
    const isLocked = !user && !isGuest;
    const effectiveView = isLocked ? 'home' : currentView;
    const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState({ three: false });
    
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(() => {
        return localStorage.getItem('prepquest_voice') || 'en-US-AvaNeural';
    });

    const [previewingVoice, setPreviewingVoice] = useState(null);
    const previewAudioRef = useRef(null);

    const [userDetails, setUserDetails] = useState(() => {
        try {
            const saved = localStorage.getItem('userDetails');
            return saved ? JSON.parse(saved) : { fullName: '', targetRole: 'Software Track', targetCompany: '', experienceLevel: 'Entry' };
        } catch {
            return { fullName: '', targetRole: 'Software Track', targetCompany: '', experienceLevel: 'Entry' };
        }
    });

    const updateUserDetails = (newDetails) => {
        setUserDetails(newDetails);
        const prefix = user ? `user_${user.id}` : 'guest';
        localStorage.setItem(`${prefix}_userDetails`, JSON.stringify(newDetails));
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (!authForm.email || !authForm.password) return alert("Please specify tracking credentials.");
        
        try {
            if (authForm.isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email: authForm.email,
                    password: authForm.password,
                    options: {
                        data: {
                            is_new_register: true
                        }
                    }
                });
                if (error) throw error;
                alert("Verification link sent! Check your inbox.");
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authForm.email,
                    password: authForm.password,
                });
                if (error) throw error;
                setUser(data.user);
                setIsGuest(false);
                localStorage.removeItem('isGuest');
                sessionStorage.removeItem('isGuest');
                const isNewRegister = data.user?.user_metadata?.is_new_register === true ||
                                      (data.user?.created_at && data.user?.last_sign_in_at && 
                                       Math.abs(new Date(data.user.last_sign_in_at).getTime() - new Date(data.user.created_at).getTime()) < 15000);
                const onboardingCompleted = data.user?.user_metadata?.onboarding_completed === true;
                const localCompleted = localStorage.getItem(`onboarding_completed_${data.user.id}`) === 'true';
                if (isNewRegister && !onboardingCompleted && !localCompleted) {
                    setCurrentView('onboarding');
                } else {
                    setCurrentView('dashboard');
                }
            }
        } catch (err) {
            alert(err.message || "Authentication verification dropped.");
        }
    };

    const handleGoogleOAuth = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin 
                }
            });
            if (error) throw error;
        } catch (err) {
            alert("Google Provider handoff failure: " + err.message);
        }
    };

    const handleLogOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCredits(0);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        sessionStorage.removeItem('isGuest');
        sessionStorage.removeItem('onboarding_passed');
        setCurrentView('home');
    };

    const handlePurchaseCredits = async (creditAmount, priceValue) => {
        if (!user) {
            alert("Please log in to purchase credits.");
            return;
        }
        
        setLoadingPayment(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/v1/payments/create-session`, {
                userId: user.id,
                creditsToBuy: creditAmount,
                amount: priceValue
            });
            
            if (res.data.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            }
        } catch (err) {
            alert("Payment initialization timed out. Please try again.");
        } finally {
            setLoadingPayment(false);
        }
    };

    const fetchUserCredits = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();
            if (data) setCredits(data.credits);
        } catch (err) {
            console.error("Credit ledger parse failure:", err);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                setIsGuest(false);
                localStorage.removeItem('isGuest');
                sessionStorage.removeItem('isGuest');
                fetchUserCredits(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setUser(session.user);
                setIsGuest(false);
                localStorage.removeItem('isGuest');
                sessionStorage.removeItem('isGuest');
                fetchUserCredits(session.user.id);
                if (event === 'SIGNED_IN') {
                    const isNewRegister = session.user?.user_metadata?.is_new_register === true ||
                                          (session.user?.created_at && session.user?.last_sign_in_at && 
                                           Math.abs(new Date(session.user.last_sign_in_at).getTime() - new Date(session.user.created_at).getTime()) < 15000);
                    const onboardingCompleted = session.user?.user_metadata?.onboarding_completed === true;
                    const localCompleted = localStorage.getItem(`onboarding_completed_${session.user.id}`) === 'true';
                    if (isNewRegister && !onboardingCompleted && !localCompleted && sessionStorage.getItem('onboarding_passed') !== 'true') {
                        setCurrentView('onboarding');
                    }
                }
            } else {
                setUser(null);
                setCredits(0);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const prefix = user ? `user_${user.id}` : 'guest';
        setTotalQuizzesTaken(parseInt(localStorage.getItem(`${prefix}_totalQuizzesTaken`) || '0', 10));
        setTotalInterviewsDone(parseInt(localStorage.getItem(`${prefix}_totalInterviewsDone`) || '0', 10));
        setTotalQuestionsAnswered(parseInt(localStorage.getItem(`${prefix}_totalQuestionsAnswered`) || '0', 10));
        setTotalCorrectAnswers(parseInt(localStorage.getItem(`${prefix}_totalCorrectAnswers`) || '0', 10));
        
        try {
            const saved = localStorage.getItem(`${prefix}_userDetails`);
            setUserDetails(saved ? JSON.parse(saved) : { fullName: '', targetRole: 'Software Track', targetCompany: '', experienceLevel: 'Entry' });
        } catch {
            setUserDetails({ fullName: '', targetRole: 'Software Track', targetCompany: '', experienceLevel: 'Entry' });
        }
    }, [user]);

    // This stays exactly the same as your current code:
    const playVoicePreview = async (voiceId, voiceName) => {
        if (previewingVoice) {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
            }
        }
        setPreviewingVoice(voiceId);
        try {
            const previewText = `Hello, I am ${voiceName}. I will be conducting your Quest: Interview Prep session.`;
            const response = await axios.post(`${API_BASE_URL}/api/ai/tts`, {
                text: previewText,
                voice: voiceId
            });
            if (response.data && response.data.audio) {
                const audioUrl = `data:audio/mp3;base64,${response.data.audio}`;
                const audio = new Audio(audioUrl);
                previewAudioRef.current = audio;
                audio.onended = () => setPreviewingVoice(null);
                audio.onerror = () => setPreviewingVoice(null);
                await audio.play();
            } else {
                setPreviewingVoice(null);
            }
        } catch (err) {
            console.error("Failed to play preview:", err);
            setPreviewingVoice(null);
        }
    };
    
    const canvasRef = useRef(null);
    const mouseRef = useRef({ 
        x: 0, 
        y: 0, 
        targetX: 0, 
        targetY: 0, 
        isDown: false,
        waves: [],
        worldX: 0,
        worldY: 0
    });
    const scrollPercentRef = useRef(0);
    const dampenedScrollRef = useRef(0);
    const colorThemeRef = useRef({ r: 0.0, g: 0.95, b: 1.0 });

    useEffect(() => {
        let threeScript;
        if (!window.THREE) {
            threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            threeScript.async = true;
            threeScript.onload = () => setScriptsLoaded({ three: true });
            document.body.appendChild(threeScript);
        } else {
            setScriptsLoaded({ three: true });
        }
        return () => {
            if (threeScript && document.body.contains(threeScript)) {
                document.body.removeChild(threeScript);
            }
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleScroll = () => {
            if (effectiveView !== 'home') return;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const scrollFraction = scrollHeight > 0 ? currentScroll / scrollHeight : 0;
            scrollPercentRef.current = scrollFraction;

            const activeVibe = Math.min(3, Math.floor(scrollFraction * 4));
            if (theme === 'dark') {
                if (activeVibe === 0) colorThemeRef.current = { r: 0.0, g: 0.95, b: 1.0 }; 
                else if (activeVibe === 1) colorThemeRef.current = { r: 1.0, g: 0.73, b: 0.0 }; 
                else if (activeVibe === 2) colorThemeRef.current = { r: 0.64, g: 0.35, b: 1.0 }; 
                else colorThemeRef.current = { r: 0.05, g: 0.95, b: 0.54 }; 
            } else {
                if (activeVibe === 0) colorThemeRef.current = { r: 0.0, g: 0.5, b: 1.0 }; 
                else if (activeVibe === 1) colorThemeRef.current = { r: 0.98, g: 0.45, b: 0.07 }; 
                else if (activeVibe === 2) colorThemeRef.current = { r: 0.5, g: 0.0, b: 0.8 }; 
                else colorThemeRef.current = { r: 0.92, g: 0.68, b: 0.0 };
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [effectiveView, theme]);

    useEffect(() => {
        if (theme === 'dark') {
            if (effectiveView === 'home' || effectiveView === 'dashboard') colorThemeRef.current = { r: 0.0, g: 0.95, b: 1.0 };
            else if (effectiveView === 'study') colorThemeRef.current = { r: 1.0, g: 0.73, b: 0.0 };
            else if (effectiveView === 'quiz') colorThemeRef.current = { r: 0.64, g: 0.35, b: 1.0 };
            else if (effectiveView === 'interview') colorThemeRef.current = { r: 0.05, g: 0.95, b: 0.54 };
        } else {
            if (effectiveView === 'home' || effectiveView === 'dashboard') colorThemeRef.current = { r: 0.0, g: 0.5, b: 1.0 };
            else if (effectiveView === 'study') colorThemeRef.current = { r: 0.98, g: 0.45, b: 0.07 };
            else if (effectiveView === 'quiz') colorThemeRef.current = { r: 0.5, g: 0.0, b: 0.8 };
            else if (effectiveView === 'interview') colorThemeRef.current = { r: 0.92, g: 0.68, b: 0.0 };
        }
    }, [effectiveView, theme]);

    useEffect(() => {
        if (!scriptsLoaded.three || !window.THREE || !canvasRef.current) return;

        const THREE = window.THREE;
        const hslToRgb = (h, s, l) => {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                const hue2rgb = (t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                r = hue2rgb(h + 1/3);
                g = hue2rgb(h);
                b = hue2rgb(h - 1/3);
            }
            return { r, g, b };
        };
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 15;
        const isMobileDevice = window.innerWidth < 768;
        const scaleFactor = isMobileDevice ? 0.6 : 1.0;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);

        const count = 2200;
        const mainCount = 1700;
        const geometry = new THREE.BufferGeometry();
        
        const sPositions = new Float32Array(count * 3);
        const cPositions = new Float32Array(count * 3);
        const wPositions = new Float32Array(count * 3);
        const vPositions = new Float32Array(count * 3);
        
        const currentPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            if (i < mainCount) {
                // Sphere Shape (Hero Area)
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const radius = (5 + Math.random() * 0.5) * scaleFactor;
                sPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                sPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                sPositions[i3 + 2] = radius * Math.cos(phi);

                // Hollow Cube Shape (Theory Area)
                const face = Math.floor(Math.random() * 6);
                const a = (Math.random() - 0.5) * 8 * scaleFactor;
                const b = (Math.random() - 0.5) * 8 * scaleFactor;
                const halfSize = 4 * scaleFactor;
                if (face === 0) { cPositions[i3] = halfSize; cPositions[i3+1] = a; cPositions[i3+2] = b; }
                else if (face === 1) { cPositions[i3] = -halfSize; cPositions[i3+1] = a; cPositions[i3+2] = b; }
                else if (face === 2) { cPositions[i3] = a; cPositions[i3+1] = halfSize; cPositions[i3+2] = b; }
                else if (face === 3) { cPositions[i3] = a; cPositions[i3+1] = -halfSize; cPositions[i3+2] = b; }
                else if (face === 4) { cPositions[i3] = a; cPositions[i3+1] = b; cPositions[i3+2] = halfSize; }
                else { cPositions[i3] = a; cPositions[i3+1] = b; cPositions[i3+2] = -halfSize; }

                // Wave Terrain (Resume Area)
                wPositions[i3] = (Math.random() - 0.5) * 20 * scaleFactor;
                wPositions[i3 + 1] = (Math.random() - 0.5) * 12 * scaleFactor;
                wPositions[i3 + 2] = Math.sin(wPositions[i3] * 0.5) * Math.cos(wPositions[i3 + 1] * 0.5) * 1.5 * scaleFactor;

                // Singularity Vortex (Interview Console Area)
                const angle = Math.random() * Math.PI * 2;
                const dist = (0.5 + Math.random() * 8.0) * scaleFactor;
                vPositions[i3] = Math.cos(angle) * dist;
                vPositions[i3 + 1] = Math.sin(angle) * dist;
                vPositions[i3 + 2] = (Math.random() - 0.5) * (10.0 / dist) * scaleFactor;
            } else {
                // Ambient floater coordinates in outer margins
                const angle = Math.random() * Math.PI * 2;
                const radius = (8.5 + Math.random() * 12.0) * scaleFactor;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const z = (Math.random() - 0.5) * 8.0 * scaleFactor;

                sPositions[i3] = cPositions[i3] = wPositions[i3] = vPositions[i3] = x;
                sPositions[i3+1] = cPositions[i3+1] = wPositions[i3+1] = vPositions[i3+1] = y;
                sPositions[i3+2] = cPositions[i3+2] = wPositions[i3+2] = vPositions[i3+2] = z;
            }

            currentPositions[i3] = sPositions[i3];
            currentPositions[i3 + 1] = sPositions[i3 + 1];
            currentPositions[i3 + 2] = sPositions[i3 + 2];

            if (theme === 'dark') {
                colors[i3] = 0.0;
                colors[i3 + 1] = 0.95;
                colors[i3 + 2] = 1.0;
            } else {
                // Multi-colored initialization for light mode (exciting pastel/vibrant mix)
                const hue = (i / count) * 360;
                const rgb = hslToRgb(hue / 360, 0.85, 0.55);
                colors[i3] = rgb.r;
                colors[i3 + 1] = rgb.g;
                colors[i3 + 2] = rgb.b;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 32;
        particleCanvas.height = 32;
        const ctx = particleCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        if (theme === 'dark') {
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
        } else {
            // Sharper particles with a distinct edge for light mode to look crisp and defined
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)');
            gradient.addColorStop(0.8, 'rgba(255,255,255,0.4)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(particleCanvas);
        const material = new THREE.PointsMaterial({
            size: (theme === 'dark' ? 0.16 : 0.24) * scaleFactor, // Crisp, slightly smaller and sharper size in light mode, dynamically scaled for mobile
            vertexColors: true,
            transparent: true,
            blending: theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false,
            map: texture,
            opacity: theme === 'dark' ? 0.85 : 0.95
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const handleResize = () => {
            if (!canvasRef.current) return;
            const w = canvasRef.current.clientWidth;
            const h = canvasRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        window.addEventListener('resize', handleResize);

        const onMouseMove = (e) => {
            mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        const onMouseDown = (e) => {
            if (e.button === 0) {
                mouseRef.current.isDown = true;
                mouseRef.current.waves.push({
                    x: mouseRef.current.worldX,
                    y: mouseRef.current.worldY,
                    progress: 0.0,
                    intensity: 1.0
                });
            }
        };

        let lastTouchTime = 0;
        const onTouchStart = (e) => {
            if (e.touches && e.touches[0]) {
                const touch = e.touches[0];
                mouseRef.current.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
                mouseRef.current.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;

                const currentTime = Date.now();
                const timeDiff = currentTime - lastTouchTime;
                lastTouchTime = currentTime;

                if (timeDiff < 300) {
                    const tempVector = new THREE.Vector3(mouseRef.current.targetX, mouseRef.current.targetY, 0.5);
                    tempVector.unproject(camera);
                    const dir = tempVector.sub(camera.position).normalize();
                    const distancePlane = -camera.position.z / dir.z;
                    const worldTouch = camera.position.clone().add(dir.multiplyScalar(distancePlane));

                    mouseRef.current.waves.push({
                        x: worldTouch.x,
                        y: worldTouch.y,
                        progress: 0.0,
                        intensity: 1.2
                    });
                }
            }
        };

        const onTouchMove = (e) => {
            if (e.touches && e.touches[0]) {
                const touch = e.touches[0];
                mouseRef.current.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
                mouseRef.current.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        let clock = new THREE.Clock();
        let animationFrameId;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();
            const positionsAttr = geometry.attributes.position;
            const colorsAttr = geometry.attributes.color;

            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

            mouseRef.current.waves.forEach((w) => {
                const currentRadius = w.progress;
                const expansionRate = Math.min(0.04, 0.008 + (currentRadius * 0.015));
                w.progress += expansionRate; 
                w.intensity *= 0.995;
            });
            mouseRef.current.waves = mouseRef.current.waves.filter(w => w.intensity > 0.001);

            const tempVector = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5);
            tempVector.unproject(camera);
            const dir = tempVector.sub(camera.position).normalize();
            const distancePlane = -camera.position.z / dir.z;
            const worldMouse = camera.position.clone().add(dir.multiplyScalar(distancePlane));
            
            mouseRef.current.worldX = worldMouse.x;
            mouseRef.current.worldY = worldMouse.y;

            // Smoothly dampen scroll fraction for premium transition fluidity
            dampenedScrollRef.current += (scrollPercentRef.current - dampenedScrollRef.current) * 0.08;
            const scrollFraction = dampenedScrollRef.current;

            let morphValue = 0;
            if (effectiveView === 'home') {
                morphValue = scrollFraction * 3.0;
            } else if (effectiveView === 'dashboard') {
                morphValue = 0.0; 
            } else if (effectiveView === 'study') {
                morphValue = 1.0; 
            } else if (effectiveView === 'quiz') {
                morphValue = 2.0; 
            } else {
                morphValue = 3.0; 
            }

            // Clamp morphValue strictly to avoid wrap-around pops at boundaries
            if (morphValue < 0) morphValue = 0;
            if (morphValue > 2.9999) morphValue = 2.9999;

            if (effectiveView === 'home') {
                const floorVal = Math.floor(morphValue);
                const localVal = morphValue % 1.0;
                const easedVal = localVal < 0.5 
                    ? 4 * localVal * localVal * localVal 
                    : 1 - Math.pow(-2 * localVal + 2, 3) / 2;
                morphValue = floorVal + easedVal;
            }

            const localTransition = morphValue % 1.0;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                let xStart = 0, yStart = 0, zStart = 0;
                let xEnd = 0, yEnd = 0, zEnd = 0;

                if (morphValue < 1.0) {
                    xStart = sPositions[i3]; yStart = sPositions[i3+1]; zStart = sPositions[i3+2];
                    xEnd = cPositions[i3]; yEnd = cPositions[i3+1]; zEnd = cPositions[i3+2];
                } else if (morphValue < 2.0) {
                    xStart = cPositions[i3]; yStart = cPositions[i3+1]; zStart = cPositions[i3+2];
                    xEnd = wPositions[i3]; yEnd = wPositions[i3+1]; zEnd = wPositions[i3+2];
                } else {
                    xStart = wPositions[i3]; yStart = wPositions[i3+1]; zStart = wPositions[i3+2];
                    xEnd = vPositions[i3]; yEnd = vPositions[i3+1]; zEnd = vPositions[i3+2];
                }

                let bx = 0, by = 0, bz = 0;

                if (i >= mainCount) {
                    // Side floaters slow orbital drift
                    const driftAngle = elapsed * 0.05 + i;
                    bx = Math.cos(driftAngle) * (Math.sqrt(xStart*xStart + yStart*yStart) + Math.sin(elapsed * 0.1 + i) * 0.5);
                    by = Math.sin(driftAngle) * (Math.sqrt(xStart*xStart + yStart*yStart) + Math.cos(elapsed * 0.12 + i * 1.5) * 0.5);
                    bz = zStart + Math.sin(elapsed * 0.2 + i * 0.7) * 0.5;
                } else {
                    bx = xStart + (xEnd - xStart) * localTransition;
                    by = yStart + (yEnd - yStart) * localTransition;
                    bz = zStart + (zEnd - zStart) * localTransition;
                }

                const dx = bx - worldMouse.x;
                const dy = by - worldMouse.y;
                const distToMouse = Math.sqrt(dx*dx + dy*dy) + 0.1;
                
                if (distToMouse < 4.5) {
                    const pushFactor = Math.pow((4.5 - distToMouse) / 4.5, 1.5) * 2.2;
                    bx += (dx / distToMouse) * pushFactor;
                    by += (dy / distToMouse) * pushFactor;
                }

                if (mouseRef.current.waves.length > 0) {
                    mouseRef.current.waves.forEach((w) => {
                        const clickDx = bx - w.x;
                        const clickDy = by - w.y;
                        const clickDist = Math.sqrt(clickDx*clickDx + clickDy*clickDy) + 0.1;
                        
                        const waveRadius = w.progress;
                        const distToWavefront = Math.abs(clickDist - waveRadius);
                        
                        if (distToWavefront < 5.0) {
                            const waveEnvelope = Math.max(0, 1.0 - (distToWavefront / 5.0));
                            const chargeModulator = Math.min(1.0, waveRadius * 0.3);
                            
                            // Outward push force
                            const wavePush = waveEnvelope * w.intensity * 5.0 * chargeModulator;
                            bx += (clickDx / clickDist) * wavePush;
                            by += (clickDy / clickDist) * wavePush;

                            // Rotational swirl force (creates custom swirling touch animation)
                            const waveSwirl = waveEnvelope * w.intensity * 3.5 * chargeModulator;
                            bx += -(clickDy / clickDist) * waveSwirl;
                            by += (clickDx / clickDist) * waveSwirl;
                        }
                    });
                }

                const waveFactor = Math.cos(elapsed * 1.5 + (bx * 0.25)) * 0.15;

                positionsAttr.array[i3] = bx + waveFactor;
                positionsAttr.array[i3 + 1] = by + waveFactor;
                positionsAttr.array[i3 + 2] = bz;

                if (theme === 'dark') {
                    colorsAttr.array[i3] += (colorThemeRef.current.r - colorsAttr.array[i3]) * 0.05;
                    colorsAttr.array[i3 + 1] += (colorThemeRef.current.g - colorsAttr.array[i3 + 1]) * 0.05;
                    colorsAttr.array[i3 + 2] += (colorThemeRef.current.b - colorsAttr.array[i3 + 2]) * 0.05;
                } else {
                    // In light mode, each particle has its own target color offset from the theme color,
                    // creating a rich, vibrant, multi-colored spectrum that morphs dynamically!
                    const offset = (i / count) * 2 * Math.PI;
                    const rTarget = Math.max(0.1, Math.min(1.0, colorThemeRef.current.r + Math.sin(elapsed * 0.5 + offset) * 0.25));
                    const gTarget = Math.max(0.1, Math.min(1.0, colorThemeRef.current.g + Math.cos(elapsed * 0.5 + offset * 1.5) * 0.25));
                    const bTarget = Math.max(0.1, Math.min(1.0, colorThemeRef.current.b + Math.sin(elapsed * 0.3 - offset) * 0.25));

                    colorsAttr.array[i3] += (rTarget - colorsAttr.array[i3]) * 0.05;
                    colorsAttr.array[i3 + 1] += (gTarget - colorsAttr.array[i3 + 1]) * 0.05;
                    colorsAttr.array[i3 + 2] += (bTarget - colorsAttr.array[i3 + 2]) * 0.05;
                }
            }

            positionsAttr.needsUpdate = true;
            colorsAttr.needsUpdate = true;

            camera.position.x += (mouseRef.current.x * 1.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseRef.current.y * 1.5 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);

            const slowBaseRotation = elapsed * 0.01;
            const scrollTransitionPivot = effectiveView === 'home' ? scrollFraction * Math.PI * 0.25 : 0;
            points.rotation.y = slowBaseRotation + scrollTransitionPivot;
            points.rotation.x = elapsed * 0.005;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            renderer.dispose();
        };
    }, [scriptsLoaded.three, effectiveView, theme]);

    const getCornerBorderClass = () => {
        if (theme === 'dark') {
            if (effectiveView === 'home' || effectiveView === 'dashboard') return 'border-appCyan/30 shadow-appCyan/5';
            if (effectiveView === 'study') return 'border-appGold/30 shadow-appGold/5';
            if (effectiveView === 'quiz') return 'border-purple-500/30 shadow-purple-500/5';
            return 'border-emerald-500/30 shadow-emerald-500/5';
        } else {
            if (effectiveView === 'home' || effectiveView === 'dashboard') return 'border-blue-500/40 shadow-blue-500/5';
            if (effectiveView === 'study') return 'border-amber-500/40 shadow-amber-500/5';
            if (effectiveView === 'quiz') return 'border-purple-600/40 shadow-purple-600/5';
            return 'border-amber-500/40 shadow-amber-500/5';
        }
    };

    const getCornerCrosshairClass = () => {
        if (theme === 'dark') {
            if (effectiveView === 'home' || effectiveView === 'dashboard') return 'bg-appCyan';
            if (effectiveView === 'study') return 'bg-appGold';
            if (effectiveView === 'quiz') return 'bg-purple-500';
            return 'bg-emerald-500';
        } else {
            if (effectiveView === 'home' || effectiveView === 'dashboard') return 'bg-blue-500';
            if (effectiveView === 'study') return 'bg-amber-600';
            if (effectiveView === 'quiz') return 'bg-purple-600';
            return 'bg-amber-600';
        }
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };
    return (
        <div className={`relative min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#070a13] text-white' : 'bg-[#f8fafc] text-slate-900'} ${effectiveView === 'home' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'} font-sans select-none`}>
            
            <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
                <canvas ref={canvasRef} className="w-full h-full block" />
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${theme === 'dark' ? 'bg-radial-vortex' : 'bg-transparent'}`} />
            </div>

            {effectiveView === 'home' && (
                <div className="fixed inset-0 pointer-events-none z-30 p-8">
                    <div className="relative w-full h-full">
                        <div className={`absolute top-0 left-0 w-24 h-24 border-t border-l rounded-tl-3xl transition-all duration-1000 shadow-2xl flex p-2 ${getCornerBorderClass()}`}>
                            <div className={`w-1 h-1 rounded-full animate-ping ${getCornerCrosshairClass()}`} />
                            <div className="w-[1px] h-6 bg-white/5 absolute left-6 top-0" />
                            <div className="h-[1px] w-6 bg-white/5 absolute top-6 left-0" />
                        </div>
                        <div className={`absolute top-0 right-0 w-24 h-24 border-t border-r rounded-tr-3xl transition-all duration-1000 shadow-2xl flex justify-end p-2 ${getCornerBorderClass()}`}>
                            <div className={`w-1 h-1 rounded-full ${getCornerCrosshairClass()}`} />
                            <div className="w-[1px] h-6 bg-white/5 absolute right-6 top-0" />
                            <div className="h-[1px] w-6 bg-white/5 absolute top-6 right-0" />
                        </div>
                        <div className={`absolute bottom-0 left-0 w-24 h-24 border-b border-l rounded-bl-3xl transition-all duration-1000 shadow-2xl flex items-end p-2 ${getCornerBorderClass()}`}>
                            <div className={`w-1 h-1 rounded-full ${getCornerCrosshairClass()}`} />
                            <div className="w-[1px] h-6 bg-white/5 absolute left-6 bottom-0" />
                            <div className="h-[1px] w-6 bg-white/5 absolute bottom-6 left-0" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-24 h-24 border-b border-r rounded-br-3xl transition-all duration-1000 shadow-2xl flex items-end justify-end p-2 ${getCornerBorderClass()}`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${getCornerCrosshairClass()}`} />
                            <div className="w-[1px] h-6 bg-white/5 absolute right-6 bottom-0" />
                            <div className="h-[1px] w-6 bg-white/5 absolute bottom-6 right-0" />
                        </div>
                    </div>
                </div>
            )}

            {effectiveView === 'home' ? (
                <div className="relative">
                    <div className="absolute top-6 right-6 z-50">
                        <button 
                            type="button"
                            onClick={toggleTheme}
                            className={`px-4 py-2 rounded-full font-mono text-xs border backdrop-blur-xl transition-all shadow-md ${
                                theme === 'dark' 
                                    ? 'bg-slate-950/85 border-white/10 text-white hover:bg-slate-900' 
                                    : 'bg-white/90 border-slate-200 text-slate-850 hover:bg-slate-100'
                            }`}
                        >
                            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                    </div>
                    <HomeView 
                        onEnterDashboard={() => setCurrentView('dashboard')} 
                        theme={theme}
                        user={user}
                        isGuest={isGuest}
                        setIsGuest={setIsGuest}
                        authForm={authForm}
                        setAuthForm={setAuthForm}
                        handleGoogleOAuth={handleGoogleOAuth}
                        handleEmailAuth={handleEmailAuth}
                        setCurrentView={setCurrentView}
                    />
                </div>
            ) : effectiveView === 'onboarding' ? (
                <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 md:py-24 z-10">
                    <div className="absolute top-6 right-6 z-50">
                        <button 
                            type="button"
                            onClick={toggleTheme}
                            className={`px-4 py-2 rounded-full font-mono text-xs border backdrop-blur-xl transition-all shadow-md ${
                                theme === 'dark' 
                                    ? 'bg-slate-950/85 border-white/10 text-white hover:bg-slate-900' 
                                    : 'bg-white/90 border-slate-200 text-slate-850 hover:bg-slate-100'
                            }`}
                        >
                            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                    </div>
                    <OnboardingView 
                        theme={theme}
                        user={user}
                        userDetails={userDetails}
                        updateUserDetails={updateUserDetails}
                        onComplete={() => setCurrentView('dashboard')}
                    />
                </div>
            ) : (
                <div className="relative z-10 flex min-h-screen">
                    {/* Responsive Overlay Backdrop */}
                    {sidebarOpen && (
                        <div 
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                    
                    <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between p-6 backdrop-blur-xl transition-all duration-300 transform 
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                        lg:relative lg:translate-x-0 
                        ${
                            theme === 'dark' 
                                ? 'border-white/5 bg-slate-955/95 lg:bg-slate-950/45 text-white' 
                                : 'border-slate-200 bg-white lg:bg-white/60 text-slate-800 shadow-sm shadow-slate-200/50'
                        }
                    `}>
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { setCurrentView('home'); setSidebarOpen(false); }}>
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/25 text-white shrink-0 animate-pulse">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                            <path d="M2 17l10 5 10-5" />
                                            <path d="M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className={`font-black text-xs tracking-wider flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>
                                            Interview <span style={{ fontFamily: "'Dancing Script', cursive", textTransform: 'none', fontSize: '13px', letterSpacing: '0' }} className="text-cyan-400 font-bold">Made Easy</span>
                                        </h2>
                                    </div>
                                </div>
                                {/* Mobile Close Button */}
                                <button 
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1 lg:hidden text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <button 
                                onClick={toggleTheme}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-mono transition-all ${
                                    theme === 'dark' 
                                        ? 'border-white/5 bg-black/20 text-slate-350 hover:bg-white/5' 
                                        : 'border-slate-200 bg-slate-100 text-slate-750 hover:bg-slate-205'
                                }`}
                            >
                                <span>Theme Spectrum</span>
                                <span>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
                            </button>

                            <nav className="space-y-2 font-mono text-xs">
                                <button 
                                    onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
                                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
                                        currentView === 'dashboard' 
                                            ? theme === 'dark' 
                                                ? 'bg-appCyan/10 text-appCyan border border-appCyan/20' 
                                                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold'
                                            : 'text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    <span>🎛️</span>
                                    <span>Core Dashboard</span>
                                </button>
                                <button 
                                    onClick={() => { setCurrentView('study'); setSidebarOpen(false); }}
                                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
                                        currentView === 'study' 
                                            ? theme === 'dark' 
                                                ? 'bg-appGold/10 text-appGold border border-appGold/20' 
                                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold'
                                            : 'text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    <span>📚</span>
                                    <span>Study Materials</span>
                                </button>
                                <button 
                                    onClick={() => { setCurrentView('quiz'); setSidebarOpen(false); }}
                                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
                                        currentView === 'quiz' 
                                            ? theme === 'dark' 
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                                : 'bg-purple-600/10 text-purple-600 border border-purple-600/20 font-bold'
                                            : 'text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    <span>🧠</span>
                                    <span>Adaptive Quiz</span>
                                </button>
                                <button 
                                    onClick={() => { setCurrentView('interview'); setSidebarOpen(false); }}
                                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
                                        currentView === 'interview' 
                                            ? theme === 'dark' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold'
                                            : 'text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    <span>🎙️</span>
                                    <span>Vocal AI Arena</span>
                                </button>
                            </nav>
                        </div>

                        <div className="border-t border-white/5 pt-4 space-y-3">
                            <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2 text-left font-mono">
                                {user ? (
                                    <>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-400 truncate max-w-[120px]">👤 {user.email}</span>
                                            <button onClick={() => { handleLogOut(); setSidebarOpen(false); }} className="text-rose-450 hover:text-rose-400 underline text-[9px] cursor-pointer">Sign Out</button>
                                        </div>
                                    </>
                                ) : isGuest ? (
                                    <div className="space-y-1 text-left font-mono">
                                        <div className="text-[10px] text-cyan-400 font-black uppercase tracking-wider flex items-center gap-1">
                                            <span className="animate-pulse">●</span> Guest Mode Running
                                        </div>
                                        <p className="text-[8px] text-slate-500 leading-normal">Your local progress is saved on this device only.</p>
                                    </div>
                                ) : null}
                            </div>
                            <button
                                onClick={() => { setShowVoiceModal(true); setSidebarOpen(false); }}
                                className={`w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-[11px] font-mono transition-all ${
                                    theme === 'dark' 
                                        ? 'border-white/5 bg-black/20 text-slate-350 hover:bg-white/5' 
                                        : 'border-slate-200 bg-slate-100 text-slate-750 hover:bg-slate-205'
                                }`}
                            >
                                <span>⚙️</span>
                                <span>WORKSPACE SETTINGS</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setIsGuest(false);
                                    localStorage.removeItem('isGuest');
                                    sessionStorage.removeItem('isGuest');
                                    setCurrentView('home');
                                    setSidebarOpen(false);
                                }} 
                                className="w-full text-center text-[10px] font-mono text-slate-500 hover:text-white transition-colors"
                            >
                                EXIT WORKSPACE 🡢
                            </button>
                        </div>
                    </aside>

                     <main className="flex-1 p-4 lg:p-10 overflow-y-auto max-h-screen relative">
                        {/* Mobile Header Toggle */}
                        <div className={`flex lg:hidden items-center justify-between mb-6 p-3.5 rounded-2xl border backdrop-blur-xl ${
                            theme === 'dark' 
                                ? 'bg-slate-950/75 border-white/5 text-white' 
                                : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
                        }`}>
                            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentView('home')}>
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/25 text-white shrink-0">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                        <path d="M2 17l10 5 10-5" />
                                        <path d="M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <span className="font-black text-xs tracking-wider">Interview Made Easy</span>
                            </div>
                            <button 
                                onClick={() => setSidebarOpen(true)}
                                className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            >
                                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        {currentView === 'dashboard' && (
                            <DashboardView 
                                onNavigate={setCurrentView} 
                                theme={theme} 
                                totalQuizzesTaken={totalQuizzesTaken}
                                totalInterviewsDone={totalInterviewsDone}
                                accuracyRate={accuracyRate}
                                userDetails={userDetails}
                            />
                        )}
                        {currentView === 'study' && <StudyView theme={theme} />}
                        {currentView === 'quiz' && (
                            <QuizEngine 
                                theme={theme} 
                                onAnswerSelected={(isCorrect) => {
                                    setTotalQuestionsAnswered(prev => {
                                        const newAns = prev + 1;
                                        const prefix = user ? `user_${user.id}` : 'guest';
                                        localStorage.setItem(`${prefix}_totalQuestionsAnswered`, newAns.toString());
                                        return newAns;
                                    });
                                    if (isCorrect) {
                                        setTotalCorrectAnswers(prev => {
                                            const newCorr = prev + 1;
                                            const prefix = user ? `user_${user.id}` : 'guest';
                                            localStorage.setItem(`${prefix}_totalCorrectAnswers`, newCorr.toString());
                                            return newCorr;
                                        });
                                    }
                                }}
                                onQuizCompleted={() => {
                                    setTotalQuizzesTaken(prev => {
                                        const newVal = prev + 1;
                                        const prefix = user ? `user_${user.id}` : 'guest';
                                        localStorage.setItem(`${prefix}_totalQuizzesTaken`, newVal.toString());
                                        return newVal;
                                    });
                                }}
                            />
                        )}
                        {currentView === 'interview' && <AiChatConsoleView theme={theme} voice={selectedVoice} setTotalInterviewsDone={setTotalInterviewsDone} user={user} />}
                    </main>

                </div>
            )}

            {showVoiceModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
                    <div className={`p-6 rounded-3xl border max-w-3xl w-full shadow-2xl transition-all duration-300 transform scale-100 ${
                        theme === 'dark'
                            ? 'bg-[#0e1322] border-slate-800 text-white'
                            : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
                                <span>⚙️</span> WORKSPACE SETTINGS
                            </h3>
                            <button
                                onClick={() => {
                                    setShowVoiceModal(false);
                                    if (previewAudioRef.current) {
                                        previewAudioRef.current.pause();
                                    }
                                    setPreviewingVoice(null);
                                }}
                                className="text-slate-500 hover:text-slate-350 text-xs font-mono tracking-widest uppercase font-bold"
                            >
                                ✕ CLOSE
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            {/* SECTION 1: AI VOCAL SETTINGS */}
                            <div className="space-y-4">
                                <h4 className={`text-xs font-mono uppercase tracking-widest font-bold ${
                                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                                }`}>🎙️ AI Vocal Settings</h4>
                                <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>
                                    Select your neural AI interviewer voice accent for Vocal AI Arena sessions. Test voice samples dynamically on-the-fly.
                                </p>

                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                    {[
                                        { id: 'en-US-AvaNeural', name: 'Ava', accent: 'US Accent, Female', desc: 'Natural US tone, balanced pacing' },
                                        { id: 'en-US-AndrewNeural', name: 'Andrew', accent: 'Andrew (US, Male)', desc: 'Energetic US tone, authoritative design' },
                                        { id: 'en-GB-SoniaNeural', name: 'Emma', accent: 'Emma (UK, Female)', desc: 'Crisp British pronunciation, clear articulation' },
                                        { id: 'en-AU-NatashaNeural', name: 'Natasha', accent: 'Natasha (AU, Female)', desc: 'Natural Australian English, warm and professional' }
                                    ].map(v => {
                                        const isSelected = selectedVoice === v.id;
                                        const isPlaying = previewingVoice === v.id;
                                        return (
                                            <div 
                                                key={v.id}
                                                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                                                    isSelected
                                                        ? theme === 'dark'
                                                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/5'
                                                            : 'bg-blue-500/10 border-blue-500 text-blue-600 font-bold shadow-md shadow-blue-500/5'
                                                        : theme === 'dark'
                                                            ? 'bg-black/20 border-slate-800 hover:border-slate-700 text-slate-350'
                                                            : 'bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex-1 text-left pr-2 cursor-pointer" onClick={() => {
                                                    setSelectedVoice(v.id);
                                                    localStorage.setItem('prepquest_voice', v.id);
                                                }}>
                                                    <div className="flex items-center space-x-1.5">
                                                        <span className="font-bold text-[11px]">{v.name}</span>
                                                        <span className={`text-[8px] px-1 py-0.2 rounded font-mono uppercase tracking-wider font-bold ${
                                                            isSelected
                                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                                : theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-650'
                                                        }`}>{v.accent}</span>
                                                    </div>
                                                    <p className={`text-[9px] mt-0.5 opacity-70 leading-normal`}>{v.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => playVoicePreview(v.id, v.name)}
                                                    disabled={isPlaying}
                                                    className={`p-1 px-2.5 rounded-lg text-[9px] font-mono transition-all flex items-center justify-center shrink-0 ${
                                                        isPlaying
                                                            ? 'bg-green-500/20 text-green-400 animate-pulse border border-green-500/30'
                                                            : theme === 'dark'
                                                                ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-slate-800 hover:border-slate-700'
                                                                : 'bg-slate-250 hover:bg-slate-300 text-slate-700 border border-slate-300'
                                                    }`}
                                                    title="Play Voice Sample"
                                                >
                                                    {isPlaying ? '🔊' : '▶ Play'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SECTION 2: USER DETAILS */}
                            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                                <h4 className={`text-xs font-mono uppercase tracking-widest font-bold ${
                                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                                }`}>👤 User Profile Details</h4>
                                
                                {user ? (
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-[10px] font-mono text-slate-400 mb-3 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Auth Source:</span>
                                            <span className="text-cyan-400 font-bold">Google / Credentials</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Synced Email:</span>
                                            <span className="text-white truncate max-w-[150px]">{user.email}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-[10px] font-mono text-slate-400 mb-3 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Auth Source:</span>
                                            <span className="text-amber-500 font-bold">Guest Session</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 leading-normal">Authenticate using Gmail on the homepage to sync profile records permanently.</p>
                                    </div>
                                )}

                                <div className="space-y-3 text-xs">
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-450 mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={userDetails.fullName}
                                            onChange={e => updateUserDetails({ ...userDetails, fullName: e.target.value })}
                                            placeholder="e.g. John Doe"
                                            className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-450 mb-1">Target Role / Track</label>
                                        <input 
                                            type="text" 
                                            value={userDetails.targetRole}
                                            onChange={e => updateUserDetails({ ...userDetails, targetRole: e.target.value })}
                                            placeholder="e.g. Frontend Engineer, Fullstack"
                                            className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-450 mb-1">Target Company</label>
                                        <input 
                                            type="text" 
                                            value={userDetails.targetCompany}
                                            onChange={e => updateUserDetails({ ...userDetails, targetCompany: e.target.value })}
                                            placeholder="e.g. Google, Stripe"
                                            className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-450 mb-1">Experience Level</label>
                                        <select 
                                            value={userDetails.experienceLevel}
                                            onChange={e => updateUserDetails({ ...userDetails, experienceLevel: e.target.value })}
                                            className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                                        >
                                            <option value="Entry">Entry (0-2 Yrs)</option>
                                            <option value="Mid">Mid Level (2-5 Yrs)</option>
                                            <option value="Senior">Senior Level (5+ Yrs)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end border-t border-white/5 pt-4">
                            <button
                                onClick={() => {
                                    setShowVoiceModal(false);
                                    if (previewAudioRef.current) {
                                        previewAudioRef.current.pause();
                                    }
                                    setPreviewingVoice(null);
                                }}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
                                    theme === 'dark'
                                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                Save & Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
// ============================================================================
// PART 1: HOMEPAGE COMPONENT
// ============================================================================
const HomeView = ({ 
    onEnterDashboard, 
    theme, 
    user, 
    isGuest, 
    setIsGuest, 
    authForm, 
    setAuthForm, 
    handleGoogleOAuth, 
    handleEmailAuth,
    setCurrentView
}) => {
    const isLocked = !user && !isGuest;

    return (
        <div className="relative min-h-[400vh]">
            {/* PART 1: INTERVIEW MADE EASY (Hero Stage - Cyan Vibe / Lock Gate Portal) */}
            {isLocked ? (
                <section className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 py-12 md:py-24">
                    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                        {/* Left Column: Branding and Hooks */}
                        <div className="space-y-6 text-left">
                            <h1 className="leading-tight">
                                <span className={`text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white via-slate-100 to-appCyan' : 'from-slate-900 via-slate-800 to-blue-600'}`}>
                                    Interview
                                </span>
                                <span 
                                    style={{ fontFamily: "'Dancing Script', cursive" }} 
                                    className={`block text-4xl md:text-6xl mt-2 animate-pulse ${
                                        theme === 'dark' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-cyan-600 drop-shadow-[0_0_10px_rgba(8,145,178,0.2)]'
                                    }`}
                                >
                                    Made Easy
                                </span>
                            </h1>
                            <p className={`text-lg md:text-xl font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-350' : 'text-slate-650'}`}>
                                From Resume to Offer Letter — Simplified. Stop guessing and start preparing with precision.
                            </p>
                            
                            <div className="space-y-4 pt-4">
                                {[
                                    { icon: "🎙️", title: "Vocal AI Arena", desc: "Simulated MNC interviews with real-time neural voice feedback." },
                                    { icon: "🧠", title: "Adaptive Quizzes", desc: "Infinite customized tests that tune to your skill levels." },
                                    { icon: "📂", title: "Resume Auditing", desc: "Randomized project defense, hobbies, and experience checks." },
                                    { icon: "👔", title: "Etiquette Vault", desc: "HBS guides, STAR frameworks, and professional checklists." }
                                ].map((feat, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <span className="text-xl shrink-0">{feat.icon}</span>
                                        <div>
                                            <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>{feat.title}</h4>
                                            <p className={`text-[11px] leading-relaxed mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Triple-Path Auth Gates */}
                        <div className={`p-8 rounded-3xl border backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden text-left ${
                            theme === 'dark'
                                ? 'bg-slate-950/45 border-white/5 shadow-black/40 text-white'
                                : 'bg-white border-slate-200 shadow-slate-200/50 text-slate-800'
                        }`}>
                            <div className="space-y-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">🔐 Access Portals</span>
                                <h2 className="text-2xl font-black tracking-tight">Connect Workspace</h2>
                                <p className="text-xs text-slate-400">Select an entry method to proceed with your prep console.</p>
                            </div>

                            {/* Gate 1: Google OAuth */}
                            <button 
                                onClick={handleGoogleOAuth} 
                                className="w-full py-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-900 dark:hover:bg-slate-850 text-xs font-black rounded-xl border border-slate-250 dark:border-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] text-slate-800 dark:text-white"
                            >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                                Continue with Google / Gmail
                            </button>

                            <div className="relative flex py-1.5 items-center">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                                <span className="flex-shrink mx-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest">Or Email Credentials</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            </div>

                            {/* Gate 2: Classic Email & Password Form */}
                            <form onSubmit={handleEmailAuth} className="space-y-3">
                                <input 
                                    type="email" 
                                    placeholder="Email address" 
                                    value={authForm.email} 
                                    onChange={e => setAuthForm({...authForm, email: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white" 
                                />
                                <input 
                                    type="password" 
                                    placeholder="Password" 
                                    value={authForm.password} 
                                    onChange={e => setAuthForm({...authForm, password: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white" 
                                />
                                <button 
                                    type="submit" 
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer transform active:scale-95 transition-all shadow-md"
                                >
                                    {authForm.isSignUp ? '🧬 Create Quest Profile' : '🔑 Authenticate Console'}
                                </button>
                            </form>
                            
                            <p className="text-[10px] font-mono text-slate-400 text-center">
                                {authForm.isSignUp ? "Already registered? " : "New to the platform? "}
                                <button 
                                    type="button"
                                    onClick={() => setAuthForm({...authForm, isSignUp: !authForm.isSignUp})} 
                                    className="text-cyan-550 dark:text-cyan-400 underline hover:opacity-80"
                                >
                                    {authForm.isSignUp ? "Log In" : "Register Now"}
                                </button>
                            </p>

                            <div className="relative flex py-1.5 items-center">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                                <span className="flex-shrink mx-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest">Or Sandbox Tryout</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            </div>

                            {/* Gate 3: Enter as Guest */}
                            <div className="space-y-2">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsGuest(true);
                                        setCurrentView('onboarding');
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-950 dark:text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                                >
                                    👤 Enter as Guest
                                </button>
                                <p className="text-[9px] font-mono text-amber-600 dark:text-amber-400 leading-normal">
                                    ⚠️ You will be able to see your progress in one device only. Your mock data will not sync across other browsers.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 py-12 md:py-24 text-center">
                    <h1 className="max-w-5xl text-center leading-tight">
                        <span className={`text-6xl md:text-9xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white via-slate-100 to-appCyan' : 'from-slate-900 via-slate-800 to-blue-600'}`}>
                            Interview
                        </span>
                        <span 
                            style={{ fontFamily: "'Dancing Script', cursive" }} 
                            className={`block text-5xl md:text-8xl mt-3 animate-pulse ${
                                theme === 'dark' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-cyan-600 drop-shadow-[0_0_10px_rgba(8,145,178,0.2)]'
                            }`}
                        >
                            Made Easy
                        </span>
                    </h1>
                    <p className={`mt-6 text-xl md:text-3xl font-extrabold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-cyan-400 to-emerald-400' : 'from-cyan-600 to-blue-605'} drop-shadow-sm`}>
                        From Resume to Offer Letter — Simplified.
                    </p>
                    <p className={`mt-4 text-xs md:text-sm max-w-xl font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-350' : 'text-slate-650'}`}>
                        Stop guessing and start preparing with precision. Practice with our top-tier tools designed by placement experts: realistic conversational AI feedback, project portfolio defenses, and dynamic concept-focused quizzes.
                    </p>

                    {/* Features & Phase 1 Highlights */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
                        <div className={`p-4 rounded-xl border backdrop-blur-md text-left ${theme === 'dark' ? 'border-white/5 bg-slate-950/40' : 'border-slate-200 bg-white/70 shadow-sm'}`}>
                            <span className="text-xl">🎙️</span>
                            <h4 className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Vocal AI Arena</h4>
                            <p className={`text-[9px] mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Simulated MNC interviews with real-time neural voice feedback.</p>
                        </div>
                        <div className={`p-4 rounded-xl border backdrop-blur-md text-left ${theme === 'dark' ? 'border-white/5 bg-slate-950/40' : 'border-slate-200 bg-white/70 shadow-sm'}`}>
                            <span className="text-xl">🧠</span>
                            <h4 className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Adaptive Quizzes</h4>
                            <p className={`text-[9px] mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Infinite customized tests that tune to your skill levels.</p>
                        </div>
                        <div className={`p-4 rounded-xl border backdrop-blur-md text-left ${theme === 'dark' ? 'border-white/5 bg-slate-950/40' : 'border-slate-200 bg-white/70 shadow-sm'}`}>
                            <span className="text-xl">📂</span>
                            <h4 className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Resume Auditing</h4>
                            <p className={`text-[9px] mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Randomized project defense, hobbies, and experience checks.</p>
                        </div>
                        <div className={`p-4 rounded-xl border backdrop-blur-md text-left ${theme === 'dark' ? 'border-white/5 bg-slate-950/40' : 'border-slate-200 bg-white/70 shadow-sm'}`}>
                            <span className="text-xl">👔</span>
                            <h4 className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Etiquette Vault</h4>
                            <p className={`text-[9px] mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>HBS guides, STAR frameworks, and professional checklists.</p>
                        </div>
                    </div>

                    <button 
                        onClick={onEnterDashboard}
                        className={`mt-8 px-8 py-4 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer ${
                            theme === 'dark'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white shadow-cyan-500/20'
                                : 'bg-blue-650 hover:bg-blue-700 text-white shadow-blue-500/25'
                        }`}
                    >
                        Enter Control Center 🡢
                    </button>
                </section>
            )}

            {/* PART 2: THE TRAINING GROUNDS (Theory Stage - Gold Vibe) */}
            <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-24 py-12 md:py-24">
                <div className="max-w-3xl space-y-6">
                    <div className={`flex items-center space-x-2 text-[10px] font-mono tracking-widest uppercase text-appGold bg-appGold/5 w-fit px-3 py-1.5 rounded-full border border-appGold/20 ${theme === 'light' ? 'text-amber-600 bg-amber-500/5 border-amber-500/20' : ''}`}>
                        <span>📊 Step 02 // Training Grounds</span>
                    </div>
                    <h2 className={`text-3xl md:text-5xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Master Core Knowledge
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'border-white/5 bg-slate-950/20' : 'border-slate-200 bg-white/70'} backdrop-blur-md`}>
                            <span className={`font-mono text-xs font-black uppercase tracking-wider block mb-2 ${theme === 'dark' ? 'text-appGold' : 'text-amber-600'}`}>
                                ⚔️ Re-Engineer Your Interview Potential
                            </span>
                            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'}`}>
                                Engage in highly realistic vocal sessions with Zephyr, our neural assessor. Train your speech pacing, clarity, and technical defense under placement simulation pressures.
                            </p>
                        </div>
                        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'border-white/5 bg-slate-950/20' : 'border-slate-200 bg-white/70'} backdrop-blur-md`}>
                            <span className={`font-mono text-xs font-black uppercase tracking-wider block mb-2 ${theme === 'dark' ? 'text-appGold' : 'text-amber-600'}`}>
                                📖 Complete Study Vault
                            </span>
                            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'}`}>
                                Access a complete guide to study from textbooks, cheatsheets, free resources, and integrated YouTube tutorial links.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PART 3: PORTFOLIO DEFENSE MATRIX (Resume Stage - Purple Vibe) */}
            <section className="relative z-10 min-h-screen flex flex-col justify-center items-end px-6 md:px-24 py-12 md:py-24">
                <div className="max-w-3xl space-y-6 text-right flex flex-col items-end">
                    <div className={`flex items-center space-x-2 text-[10px] font-mono tracking-widest uppercase text-purple-400 bg-purple-500/5 w-fit px-3 py-1.5 rounded-full border border-purple-500/20 ${theme === 'light' ? 'text-purple-650 bg-purple-55 border-purple-200' : ''}`}>
                        <span>📄 Step 03 // Evaluation Arena</span>
                    </div>
                    <h2 className={`text-3xl md:text-5xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Test & Defend Your Skills
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'border-white/5 bg-slate-950/20' : 'border-slate-200 bg-white/70'} backdrop-blur-md`}>
                            <span className={`font-mono text-xs font-black uppercase tracking-wider block mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-655'}`}>
                                🧠 Adaptive Quiz Engine
                            </span>
                            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'}`}>
                                Challenge your speed and conceptual depth with AI-generated quiz decks that dynamically adapt to your performance.
                            </p>
                        </div>
                        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'border-white/5 bg-slate-950/20' : 'border-slate-200 bg-white/70'} backdrop-blur-md`}>
                            <span className={`font-mono text-xs font-black uppercase tracking-wider block mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-655'}`}>
                                🎙️ Resume-Based Specific Mock Interview Vocal Sessions
                            </span>
                            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'}`}>
                                Engage in customized mock sessions based on your own projects and profile stack, defending your engineering background in vocal rounds.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PART 4: THE CONVERGENCE GATEWAY (Console Reveal - Emerald Vibe) */}
            <section className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 py-12 md:py-24">
                <div className={`w-full max-w-xl p-8 md:p-10 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden border transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] ${
                    theme === 'dark' 
                        ? 'bg-gradient-to-b from-[#101920] to-[#070a13] border-emerald-500/30 shadow-emerald-500/5' 
                        : 'bg-white border-slate-200 shadow-slate-250/50'
                }`}>
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(5,245,135,0.06),transparent_50%)] pointer-events-none" />
                    
                    <div className="relative z-10 space-y-2">
                        <span className={`text-xs font-mono uppercase tracking-widest font-black ${theme === 'dark' ? 'text-emerald-400 animate-pulse' : 'text-emerald-600'}`}>
                            🤝 Your Future is Calling
                        </span>
                        <h3 className={`text-2xl md:text-3xl font-black tracking-tight leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Build Confidence. Claim Your Offer.
                        </h3>
                    </div>

                    <p className={`text-xs leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-350' : 'text-slate-650'}`}>
                        "Success is where preparation meets opportunity." Elevate your speaking style, clean up your code execution architecture, and walk into your next interview with complete poise.
                    </p>

                    <div className={`p-4 rounded-xl border text-left font-mono text-[10px] md:text-xs space-y-1.5 ${theme === 'dark' ? 'bg-black/50 border-emerald-500/20 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'}`}>
                        <p className="flex items-center gap-2">
                            <span className="text-emerald-400">✔</span>
                            <span>AI Mock Interview Assessor: Online</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-emerald-400">✔</span>
                            <span>Adaptive Quiz Engines: Provisioned & Ready</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-emerald-400">✔</span>
                            <span>Academic Reference Blueprints: Available</span>
                        </p>
                    </div>

                    <button 
                        onClick={() => {
                            if (isLocked) {
                                setIsGuest(true);
                                setCurrentView('onboarding');
                            } else {
                                onEnterDashboard();
                            }
                        }}
                        className={`relative z-10 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all cursor-pointer ${
                            theme === 'dark'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-400/40 animate-pulse'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                        }`}
                    >
                        {isLocked ? 'Enter as Guest 🡢' : 'Launch Assessment Console 🡢'}
                    </button>
                </div>
            </section>
        </div>
    );
};

// ============================================================================
// PART 1.5: PROFILE ONBOARDING VIEW
// ============================================================================
const OnboardingView = ({ theme, user, userDetails, updateUserDetails, onComplete }) => {
    const [name, setName] = useState(userDetails.fullName || '');
    const [role, setRole] = useState(userDetails.targetRole || 'Software Track');
    const [experience, setExperience] = useState(userDetails.experienceLevel || 'Entry');
    const [company, setCompany] = useState(userDetails.targetCompany || '');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name is compulsory.');
            return;
        }
        if (!role.trim()) {
            setError('Profession / Target Role is compulsory.');
            return;
        }
        if (!experience) {
            setError('Experience level is compulsory.');
            return;
        }

        updateUserDetails({
            fullName: name,
            targetRole: role,
            experienceLevel: experience,
            targetCompany: company
        });
        const prefix = user ? `user_${user.id}` : 'guest';
        localStorage.setItem(`onboarding_completed_${prefix}`, 'true');
        sessionStorage.setItem('onboarding_passed', 'true');
        if (user && supabase) {
            try {
                await supabase.auth.updateUser({
                    data: { onboarding_completed: true }
                });
            } catch (err) {
                console.error("Failed to update user metadata in Supabase:", err);
            }
        }
        onComplete();
    };

    const handleSkip = async () => {
        const prefix = user ? `user_${user.id}` : 'guest';
        localStorage.setItem(`onboarding_completed_${prefix}`, 'true');
        sessionStorage.setItem('onboarding_passed', 'true');
        if (user && supabase) {
            try {
                await supabase.auth.updateUser({
                    data: { onboarding_completed: true }
                });
            } catch (err) {
                console.error("Failed to update user metadata in Supabase:", err);
            }
        }
        onComplete();
    };

    return (
        <div className={`p-8 rounded-3xl border backdrop-blur-xl max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden text-left ${
            theme === 'dark'
                ? 'bg-slate-955/75 border-white/5 shadow-black/45 text-white'
                : 'bg-white/95 border-slate-200/80 shadow-slate-200/50 text-slate-800'
        }`}>
            <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">🚀 Onboarding Portal</span>
                <h2 className="text-2xl font-black tracking-tight">Complete Your Profile</h2>
                <p className="text-xs text-slate-400">Personalize your placement tracking & AI mock interview focus.</p>
            </div>

            {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Full Name <span className="text-rose-500 font-bold">*</span></label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => { setName(e.target.value); setError(''); }}
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Profession / Target Role <span className="text-rose-500 font-bold">*</span></label>
                    <input 
                        type="text" 
                        value={role}
                        onChange={e => { setRole(e.target.value); setError(''); }}
                        placeholder="e.g. Software Track, Frontend Engineer"
                        className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Experience Level <span className="text-rose-500 font-bold">*</span></label>
                    <select 
                        value={experience}
                        onChange={e => { setExperience(e.target.value); setError(''); }}
                        className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                    >
                        <option value="Entry">Entry (0-2 Yrs)</option>
                        <option value="Mid">Mid Level (2-5 Yrs)</option>
                        <option value="Senior">Senior Level (5+ Yrs)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Target Company (Optional)</label>
                    <input 
                        type="text" 
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="e.g. Google, Stripe"
                        className="w-full bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-white"
                    />
                </div>

                <div className="pt-2 flex gap-3">
                    <button 
                        type="button"
                        onClick={handleSkip}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm text-center"
                    >
                        ⏭️ Skip
                    </button>
                    <button 
                        type="submit"
                        className="flex-grow-[2] py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transform active:scale-95 transition-all shadow-md text-center"
                    >
                        🧬 Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

// ============================================================================
// PART 2: DASHBOARD HUB OVERVIEW
const DashboardView = ({ onNavigate, theme, totalQuizzesTaken, totalInterviewsDone, accuracyRate, userDetails }) => {
    const [activeItem, setActiveItem] = useState(null);

    return (
        <div className="space-y-8 animate-fadeIn text-left">
            <div>
                <h1 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Control Center</h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Active Track: <span className="font-bold text-cyan-400">{userDetails.targetRole}</span> {userDetails.targetCompany && `| Target Focus: ${userDetails.targetCompany}`} | Level: {userDetails.experienceLevel}
                </p>
            </div>

            {/* Dynamic Performance Metrics Dashboard Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-5 border rounded-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-md ${
                    theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white shadow-black/30' : 'bg-white border-slate-200 text-slate-800 shadow-sm shadow-slate-200/50'
                }`}>
                    <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Quizzes Completed</span>
                    <span className="text-3xl font-black text-purple-500 mt-1 block">{totalQuizzesTaken}</span>
                </div>
                <div className={`p-5 border rounded-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-md ${
                    theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white shadow-black/30' : 'bg-white border-slate-200 text-slate-800 shadow-sm shadow-slate-200/50'
                }`}>
                    <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Interviews Concluded</span>
                    <span className="text-3xl font-black text-emerald-500 mt-1 block">{totalInterviewsDone}</span>
                </div>
                <div className={`p-5 border rounded-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-md ${
                    theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white shadow-black/30' : 'bg-white border-slate-200 text-slate-800 shadow-sm shadow-slate-200/50'
                }`}>
                    <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Quiz Accuracy Rate</span>
                    <span className="text-3xl font-black text-cyan-500 mt-1 block">{accuracyRate}%</span>
                </div>
            </div>



            {/* Lower Dashboard Module Portals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-item">
                <div className={`p-6 border rounded-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-350 hover:scale-[1.005] hover:shadow-lg ${
                    theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white shadow-black/20' : 'bg-white border-slate-200 text-slate-800 shadow-sm shadow-slate-200/50'
                }`}>
                    <span className="text-3xl block mb-2">📚</span>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Study Portal</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Refresh your theory database across structural system subjects.</p>
                    <button onClick={() => onNavigate('study')} className={`mt-4 text-xs font-bold hover:underline cursor-pointer ${theme === 'dark' ? 'text-appCyan' : 'text-blue-600'}`}>Explore Reference Guides 🡢</button>
                </div>

                <div className={`p-6 border rounded-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-350 hover:scale-[1.005] hover:shadow-lg ${
                    theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white shadow-black/20' : 'bg-white border-slate-200 text-slate-800 shadow-sm shadow-slate-200/50'
                }`}>
                    <span className="text-3xl block mb-2">🧠</span>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Adaptive Quizzes</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Validate conceptual speed and correctness with mock tests.</p>
                    <button onClick={() => onNavigate('quiz')} className={`mt-4 text-xs font-bold hover:underline cursor-pointer ${theme === 'dark' ? 'text-appCyan' : 'text-blue-600'}`}>Launch Coding Battles 🡢</button>
                </div>

                <div className={`p-6 border rounded-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-350 hover:scale-[1.005] hover:shadow-lg ${
                    theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white shadow-black/20' : 'bg-white border-slate-200 text-slate-800 shadow-sm shadow-slate-200/50'
                }`}>
                    <span className="text-3xl block mb-2">🎙️</span>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Vocal Interview Arena</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Engage directly with neural edge voices speaking real-world MNC targets.</p>
                    <button onClick={() => onNavigate('interview')} className={`mt-4 text-xs font-bold hover:underline cursor-pointer ${theme === 'dark' ? 'text-appCyan' : 'text-blue-600'}`}>Connect Microphone 🡢</button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// PART 3: STUDY MATERIAL PORTAL (All 12 topics)
// ============================================================================
// ============================================================================
// PART 3: STUDY MATERIAL PORTAL (All 12 topics + Dedicated Java Resource Hub)
// ============================================================================

const JAVA_CURRICULUM = [
    {
        chapter: 1,
        phase: "Phase 1: Foundations",
        title: "Overview: The Mental Landscape",
        desc: "Foundational hardware elements, virtual machines (JVM), and procedural vs object-oriented abstractions.",
        difficulty: "Easy",
        topics: ["Machine Language & CPU", "JVM & Bytecode", "Subroutines & Variables", "Objects & GUI", "Internet Protocols"],
        pdfPage: 16
    },
    {
        chapter: 2,
        phase: "Phase 1: Foundations",
        title: "Names and Things: Variables & Types",
        desc: "Basic program structures, primitive types, literals, strings, text blocks, console I/O, and enums.",
        difficulty: "Easy",
        topics: ["Identifiers & Keywords", "Primitive Types", "Literals & Escape sequences", "Strings & Text Blocks", "Console input & TextIO", "Enums"],
        pdfPage: 34
    },
    {
        chapter: 3,
        phase: "Phase 1: Foundations",
        title: "Control Flow & Structured Coding",
        desc: "Execution branching, looping patterns, and basic error trapping via try-catch.",
        difficulty: "Easy",
        topics: ["While & Do-While loops", "For loops", "If Statements", "Switch Statements & Expressions", "Break & Continue", "Basic Try-Catch"],
        pdfPage: 75
    },
    {
        chapter: 4,
        phase: "Phase 1: Foundations",
        title: "Subroutines (Methods)",
        desc: "Modular design through subroutines, parameters, returns, scoping, overloading, and lambdas.",
        difficulty: "Medium",
        topics: ["Static Methods", "Parameters & Arguments", "Return Values", "Method Overloading", "Lambda Expressions", "APIs & Packages"],
        pdfPage: 147
    },
    {
        chapter: 5,
        phase: "Phase 2: Object-Oriented Mastery",
        title: "Objects and Classes",
        desc: "The core pillars of Object-Oriented Programming (OOP) including inheritance, polymorphism, and constructors.",
        difficulty: "Medium",
        topics: ["Instance Variables & Methods", "Constructors", "Inheritance & Subclasses", "Polymorphism", "Interfaces", "Nested Classes"],
        pdfPage: 207
    },
    {
        chapter: 6,
        phase: "Phase 2: Object-Oriented Mastery",
        title: "Introduction to GUI Programming",
        desc: "Creating rich graphical applications using JavaFX layouts, shapes, and event handlers.",
        difficulty: "Medium",
        topics: ["JavaFX Applications", "Scene Graph", "Nodes & Layouts", "Events & Listeners", "Basic Controls (Buttons, Labels)"],
        pdfPage: 275
    },
    {
        chapter: 7,
        phase: "Phase 3: Algorithms & Data Structures",
        title: "Arrays, ArrayLists & Records",
        desc: "Fixed and dynamic sequences, sorting/searching algorithms, and modern data containers.",
        difficulty: "Medium",
        topics: ["1D & 2D Arrays", "Arrays Class Methods", "ArrayList & Parameterized Types", "Autoboxing & Wrapper Classes", "Java Records"],
        pdfPage: 343
    },
    {
        chapter: 8,
        phase: "Phase 3: Algorithms & Data Structures",
        title: "Correctness, Robustness & Efficiency",
        desc: "Validating runtime logic via structured exceptions, assertions, and Big-O algorithm analysis.",
        difficulty: "Hard",
        topics: ["Robustness & Inputs", "Exception Handling (Try-Catch-Finally)", "Checked vs Unchecked Exceptions", "Assertions", "Big-O Notation"],
        pdfPage: 401
    },
    {
        chapter: 9,
        phase: "Phase 3: Algorithms & Data Structures",
        title: "Linked Data Structures & Recursion",
        desc: "Recursive algorithms and building custom lists, stacks, queues, and binary trees.",
        difficulty: "Hard",
        topics: ["Recursive Subroutines", "Linked Lists", "Stacks & Queues", "Binary Trees & BSTs", "Postfix Expressions"],
        pdfPage: 445
    },
    {
        chapter: 10,
        phase: "Phase 3: Algorithms & Data Structures",
        title: "Generic Programming & Collections",
        desc: "Java Collections Framework (JCF) interfaces, concrete classes, and the modern Stream API.",
        difficulty: "Hard",
        topics: ["List, Set & Map interfaces", "HashSet & HashMap", "TreeSet & TreeMap", "Iterators", "Stream API & Parallel Streams"],
        pdfPage: 503
    },
    {
        chapter: 11,
        phase: "Phase 4: Advanced Systems",
        title: "I/O Streams, Files & Networking",
        desc: "Persistent storage, file access, TCP/IP sockets, and structural data serialization (XML/DOM).",
        difficulty: "Hard",
        topics: ["Byte vs Character Streams", "File I/O (FileReader/FileWriter)", "Object Serialization", "Client/Server Sockets", "XML & DOM Parsing"],
        pdfPage: 565
    },
    {
        chapter: 12,
        phase: "Phase 4: Advanced Systems",
        title: "Threads and Multiprocessing",
        desc: "Concurrent execution, managing shared resources safely, and avoiding race conditions or deadlocks.",
        difficulty: "Hard",
        topics: ["Thread & Runnable", "Synchronization & Locks", "Volatile & Atomic Variables", "Thread Pools & Blocking Queues", "Wait & Notify"],
        pdfPage: 619
    },
    {
        chapter: 13,
        phase: "Phase 4: Advanced Systems",
        title: "Advanced GUI & MVC Architecture",
        desc: "Properties and bindings in JavaFX, TableView widgets, dialog boxes, and the Model-View-Controller pattern.",
        difficulty: "Hard",
        topics: ["Properties & Bindings", "TableView & ListView", "Dialogs & Alerts", "Model-View-Controller (MVC)", "Preferences API"],
        pdfPage: 687
    }
];

const PYTHON_CURRICULUM = [
    {
        chapter: 1,
        phase: "Phase 1: Foundations",
        title: "Environment Setup & The REPL",
        desc: "Installing Python, configuring local IDE environments, running code via terminal files, and interacting with the interactive interpreter shell loop.",
        difficulty: "Easy",
        topics: ["Mac & Windows Setup", "Python Shell / REPL", "Script Execution", "Syntax Overview"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap01.html"
    },
    {
        chapter: 2,
        phase: "Phase 1: Foundations",
        title: "Variables, Expressions, & Scalar Data",
        desc: "Working with native primitive variable states: integers, floats, dynamic typing rules, string formatting manipulations, and text blocks.",
        difficulty: "Easy",
        topics: ["Dynamic Typing", "String Methods", "f-Strings & Formatting", "Arithmetic Operators"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap02.html"
    },
    {
        chapter: 3,
        phase: "Phase 1: Foundations",
        title: "Sequential Containers: Lists, Tuples, & Sets",
        desc: "Analyzing index-ordered collections, immutable data integrity protection via tuples, and unique fast mathematical membership operations using hashable sets.",
        difficulty: "Easy",
        topics: ["List Slicing & Methods", "Tuple Immutability", "Set Operations (Unions/Intersects)", "Comprehensions Basics"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap03.html"
    },
    {
        chapter: 4,
        phase: "Phase 1: Foundations",
        title: "Mapping Structures: Dictionaries",
        desc: "Mastering associative storage arrays utilizing efficient key-value lookups, hash rules, nested mapping trees, and safe value retrieval pipelines.",
        difficulty: "Easy",
        topics: ["Key-Value Assignment", "get() Method Fallbacks", "Iterating Keys & Values", "Dictionary Comprehensions"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap05.html"
    },
    {
        chapter: 5,
        phase: "Phase 2: Logic & Control Flow",
        title: "Conditionals, Booleans, & Logic Gates",
        desc: "Directing execution branching paths using conditional checks, comparison operators, and evaluating shortcut evaluation logic rules.",
        difficulty: "Easy",
        topics: ["if, elif, else Branches", "and / or / not Operators", "Object Identity (is vs ==)", "Falsey Values Evaluators"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap06.html"
    },
    {
        chapter: 6,
        phase: "Phase 2: Logic & Control Flow",
        title: "Loops & Advanced Iteration Patterns",
        desc: "Automating sequential loops using for-in grids, while guard rails, and fine-tuning looping behaviors using break, continue, and else blocks.",
        difficulty: "Easy",
        topics: ["For-In Ranges", "While Loop Guards", "Break & Continue Knobs", "enumerate() Index Tracking"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap07.html"
    },
    {
        chapter: 7,
        phase: "Phase 2: Logic & Control Flow",
        title: "Functions, Scoping, & The LEGB Rule",
        desc: "Writing modular, reusable units using positional arguments, default keyword definitions, variable unpacking (*args/**kwargs), and studying variable lookups.",
        difficulty: "Medium",
        topics: ["Def & Return Values", "*args and **kwargs Unpacking", "LEGB Scope Resolution", "Lambda Functions"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap04.html"
    },
    {
        chapter: 8,
        phase: "Phase 3: Systems & standard Modules",
        title: "Modules & Python Standard Library Hooks",
        desc: "Importing modules cleanly, inspecting path reference indices, and managing runtime environment variables using standard utilities like sys, os, and random.",
        difficulty: "Medium",
        topics: ["Import Variants (from x import y)", "sys.path Architecture", "os Module System Tools", "Virtual Environments"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap09.html"
    },
    {
        chapter: 9,
        phase: "Phase 3: Systems & standard Modules",
        title: "File I/O Operations & Context Managers",
        desc: "Interacting with persistent hard storage arrays cleanly using contextual handles, preventing memory buffer leak risks, and processing structured line parsing loops.",
        difficulty: "Medium",
        topics: ["open() Built-in Parameters", "with Context Management", "read/write Stream Buffers", "Parsing Large Text Logs"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap14.html"
    },
    {
        chapter: 10,
        phase: "Phase 4: Object-Oriented Blueprinting",
        title: "OOP: Classes, Instances, & Class Attributes",
        desc: "Differentiating between class templates and runtime instances, managing shared properties vs unique instance dictionaries, and initializing instance state.",
        difficulty: "Medium",
        topics: ["class Blueprint Syntax", "The self Parameter", "Instance vs Class Variables", "__init__ Initialization"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap15.html"
    },
    {
        chapter: 11,
        phase: "Phase 4: Object-Oriented Blueprinting",
        title: "OOP: Inheritance & Polymorphic Methods",
        desc: "Building extensible structural family trees, inheriting method pools, overriding subclass actions, and parsing multiple parent chains cleanly via super().",
        difficulty: "Hard",
        topics: ["Subclass Extension", "Method Overriding", "super() Method Delegation", "Method Resolution Order (MRO)"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap18.html"
    },
    {
        chapter: 12,
        phase: "Phase 4: Object-Oriented Blueprinting",
        title: "OOP: Special Dunder Methods & Properties",
        desc: "Customizing operator overload patterns, mapping string representation hooks using __str__ and __repr__, and writing clean getter/setter controls using descriptors.",
        difficulty: "Hard",
        topics: ["__str__ vs __repr__", "Operator Overloading (__add__/__len__)", "@property Decorators", "Encapsulation Setters"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap17.html"
    },
    {
        chapter: 13,
        phase: "Phase 4: Advanced Control",
        title: "Error Handling & Robust Try-Except Blocks",
        desc: "Catching runtime issues without crashing program state, managing fallback execution paths, and identifying specific error types accurately.",
        difficulty: "Hard",
        topics: ["try/except/else/finally Clauses", "Handling Specific Exceptions", "Raising Custom Errors", "Assertion Checks"],
        chapterUrl: "https://allendowney.github.io/ThinkPython/chap11.html"
    }
];

const CHEATSHEET_DATA = {
    syntax: [
        {
            title: "Variables and Data Types",
            desc: "Declaring primitives and objects in Java. Primitive types hold actual values; object variables store pointers/references.",
            code: `// Primitive Types
int age = 25;
double temperature = 98.6;
boolean isJavaFun = true;
char grade = 'A';

// Object Types (References)
String name = "David J. Eck";
Integer count = 100; // Autoboxing`
        },
        {
            title: "Text Blocks (Java 15+)",
            desc: "Multiline string literals that preserve indentation and do not require escape sequences.",
            code: `String html = """
<html>
    <body>
        <p>Hello, World!</p>
    </body>
</html>
""";`
        }
    ],
    oop: [
        {
            title: "Class and Constructor",
            desc: "Blueprints for creating objects. Instance fields represent state; instance methods represent behavior.",
            code: `public class Student {
    private String name;
    private double testScore;

    // Constructor
    public Student(String name, double testScore) {
        if (name == null) throw new IllegalArgumentException();
        this.name = name;
        this.testScore = testScore;
    }

    // Getter Accessor
    public String getName() {
        return this.name;
    }
}`
        },
        {
            title: "Inheritance and Polymorphism",
            desc: "Reusing and overriding parent code. A subclass inherits state and behavior and can override methods.",
            code: `// Base Parent Class
public class Vehicle {
    protected int registrationNumber;
    public void roll() { System.out.println("Moving!"); }
}

// Derived Child Class
public class Car extends Vehicle {
    private int numberOfDoors;

    @Override
    public void roll() {
        super.roll(); // Call parent method
        System.out.println("Driving on wheels!");
    }
}`
        },
        {
            title: "Interfaces and Abstractions",
            desc: "Defining strict specifications without implementation. Classes 'implement' interfaces.",
            code: `public interface Strokeable {
    void stroke(GraphicsContext g); // Abstract method
}

public class Line implements Strokeable {
    @Override
    public void stroke(GraphicsContext g) {
        g.strokeLine(0, 0, 100, 100);
    }
}`
        }
    ],
    collections: [
        {
            title: "Dynamic Arrays (ArrayList)",
            desc: "Dynamic, resizable lists that wrap around standard arrays.",
            code: `import java.util.ArrayList;

ArrayList<String> list = new ArrayList<>();
list.add("Java");
list.add("Python");
String first = list.get(0); // "Java"
int size = list.size(); // 2
list.remove(1); // Removes "Python"`
        },
        {
            title: "Key-Value Pairs (HashMap)",
            desc: "General associative map utilizing hash tables for rapid O(1) searches.",
            code: `import java.util.HashMap;

HashMap<String, Double> symbolTable = new HashMap<>();
symbolTable.put("pi", 3.14159);
symbolTable.put("e", 2.71828);

if (symbolTable.containsKey("pi")) {
    double piValue = symbolTable.get("pi");
}`
        },
        {
            title: "Sorted Sets (TreeSet)",
            desc: "Collection that contains no duplicates and automatically keeps elements sorted.",
            code: `import java.util.TreeSet;

TreeSet<String> words = new TreeSet<>();
words.add("banana");
words.add("apple");
words.add("cherry");

// Output: apple, banana, cherry (sorted order)
for (String w : words) {
    System.out.println(w);
}`
        }
    ],
    lambdas: [
        {
            title: "Lambda Expressions",
            desc: "Anonymous inner function literals matching a functional interface.",
            code: `// Interface
public interface FunctionR2R {
    double valueAt(double x);
}

// Lambda Declaration
FunctionR2R sqr = x -> x * x;
double squared = sqr.valueAt(5.0); // 25.0`
        },
        {
            title: "Stream Pipeline",
            desc: "Functional computation pipelines on collections supporting parallelization.",
            code: `import java.util.Arrays;
import java.util.List;

List<String> words = Arrays.asList("Java", "Vite", "Tailwind");
long count = words.stream()
    .filter(s -> s.length() > 4)
    .map(String::toLowerCase)
    .distinct()
    .count();`
        }
    ],
    concurrency: [
        {
            title: "Thread Creation",
            desc: "Running asynchronous execution paths in parallel.",
            code: `// Subclassing Thread
class MyThread extends Thread {
    public void run() {
        System.out.println("Running in parallel!");
    }
}
MyThread t = new MyThread();
t.start(); // Spawns the thread`
        },
        {
            title: "Resource Synchronization",
            desc: "Enforcing mutual exclusion to prevent race conditions on shared memory.",
            code: `public class SafeCounter {
    private int count = 0;

    // Synchronized method locks 'this' object
    public synchronized void increment() {
        count = count + 1;
    }
}`
        }
    ]
};

const CC_CURRICULUM = [
    { chapter: 1, phase: "Phase 1: Foundations", title: "C Syntax Basics & Compilation", desc: "Understanding the C preprocessor, tokens, structure of a standard program, data types, and using native compiler commands (gcc/clang).", difficulty: "Easy", topics: ["Preprocessor Directives", "Main Entry Point", "Data Primitives", "Compilation Toolchains"], chapterUrl: "https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by/mode/2up" },
    { chapter: 2, phase: "Phase 1: Foundations", title: "Control Flow & Functional Modularity", desc: "Writing execution path control branches using conditional evaluations and implementing iterative loop blocks.", difficulty: "Easy", topics: ["If-Else Branches", "Switch Statements", "For / While Loops", "Function Prototypes"], chapterUrl: "https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by/mode/2up" },
    { chapter: 3, phase: "Phase 2: Memory Mastery", title: "Pointers & Address Spaces", desc: "Mastering indirect memory references, address operations using &, value lookups via *, stack frame allocations, and avoid undefined behavior.", difficulty: "Medium", topics: ["Memory Addresses", "Pointer Arithmetic", "Pass-by-Reference", "Null Pointers"], chapterUrl: "https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by/mode/2up" },
    { chapter: 4, phase: "Phase 2: Memory Mastery", title: "Arrays, Strings, & Structural Layouts", desc: "Handling fixed sequential vectors, low-level string manipulation using null-termination flags, and custom compound structured groupings.", difficulty: "Medium", topics: ["Multidimensional Arrays", "Null-Terminated Strings", "Struct Declarations", "Memory Alignment"], chapterUrl: "https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by/mode/2up" },
    { chapter: 5, phase: "Phase 2: Memory Mastery", title: "Dynamic Memory Allocation (C Heap)", desc: "Allocating heap memory using malloc and calloc blocks, handling block re-sizing via realloc, and manually cleaning blocks via free() to prevent memory leaks.", difficulty: "Hard", topics: ["malloc / calloc Layouts", "Heap Memory Leaks", "Dangling Pointers", "Void Reference Casts"], chapterUrl: "https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by/mode/2up" },
    { chapter: 6, phase: "Phase 3: Object-Oriented C++", title: "Introduction to C++ & Object Paradigms", desc: "Transitioning to C++ using namespaces, standard I/O streams, writing class blueprints, handling structural data hiding using access modifiers, and constructor initializers.", difficulty: "Medium", topics: ["std::cout / std::cin", "Classes vs Structs", "Access Specifiers", "Constructor Init Lists"], chapterUrl: "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines" },
    { chapter: 7, phase: "Phase 3: Object-Oriented C++", title: "Polymorphism, Virtual Tables & Inheritance", desc: "Building derived class structures, modifying object interactions using runtime polymorphism, and tracing virtual pointer lookups.", difficulty: "Hard", topics: ["Base & Derived Classes", "Virtual Functions", "VTable Layouts", "Pure Virtual Abstract Classes"], chapterUrl: "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines" },
    { chapter: 8, phase: "Phase 4: Advanced C++ Engine", title: "Pointers & RAII Potion Management", desc: "Managing explicit stack scope cleanup actions via Resource Acquisition Is Initialization (RAII), handling ownership transfers, and using safe smart wrappers.", difficulty: "Hard", topics: ["Object Destructors", "std::unique_ptr", "std::shared_ptr", "Weak Pointer Rings"], chapterUrl: "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines" }
];

const SE_CURRICULUM = [
    { chapter: 1, phase: "Phase 1: Lifecycle & Process", title: "Software Development Lifecycles", desc: "Comparing predictive models (Waterfall) against iterative adaptive frameworks (Agile, Scrum). Mastering requirements gathering, user stories, and feasibility analysis.", difficulty: "Easy", topics: ["Waterfall vs Agile", "Scrum Sprints", "Requirements Engineering", "Functional Specifications"], chapterUrl: "https://softengbook.org/" },
    { chapter: 2, phase: "Phase 1: Lifecycle & Process", title: "System Modeling & UML Diagrams", desc: "Blueprinting structural and behavioral views of a system using standardized unified modeling notation.", difficulty: "Easy", topics: ["Use Case Diagrams", "Class Diagrams", "Sequence Diagrams", "State Machine Models"], chapterUrl: "https://softengbook.org/" },
    { chapter: 3, phase: "Phase 2: Solid Architecture", title: "SOLID Design Principles", desc: "Deep dive into clean coding architectural patterns to minimize tight coupling and maximize system extensibility.", difficulty: "Medium", topics: ["Single Responsibility", "Open-Closed Principle", "Liskov Substitution", "Interface Segregation", "Dependency Inversion"], chapterUrl: "https://softengbook.org/" },
    { chapter: 4, phase: "Phase 2: Solid Architecture", title: "Design Patterns (GoF)", desc: "Creational, structural, and behavioral code patterns solving common recurring software engineering challenges.", difficulty: "Hard", topics: ["Singleton & Factory", "Observer & Strategy", "Adapter & Decorator", "MVC Pattern"], chapterUrl: "https://softengbook.org/" },
    { chapter: 5, phase: "Phase 3: Validation & Quality", title: "Software Testing Levels & QA", desc: "Validating program correctness using automated regression strategies, continuous integration pipelines, and coverage analysis.", difficulty: "Medium", topics: ["Unit vs Integration Testing", "Black-Box vs White-Box", "Test-Driven Development (TDD)", "CI/CD Gateways"], chapterUrl: "https://softengbook.org/" },
    { chapter: 6, phase: "Phase 3: Validation & Quality", title: "Maintenance, Refactoring & Metrics", desc: "Tracking architectural decay, reducing technical debt, calculating Cyclomatic Complexity, and conducting structural code audits.", difficulty: "Hard", topics: ["Technical Debt Management", "Code Smell Isolation", "Cyclomatic Complexity", "Legacy System Refactoring"], chapterUrl: "https://softengbook.org/" }
];


// ============================================================================
// DATA BLUEPRINT: DSA COMPLETE CURRICULUM SYLLABUS MATRIX
// ============================================================================
const DSA_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Analysis Basics", 
        title: "Introduction to Algorithms", 
        desc: "Mastering time and space complexities, mathematical Big-O, Omega, and Theta asymptotic notation formulas. Tracing execution rates using priori analysis.", 
        difficulty: "Easy", 
        topics: ["Time Complexity Bounds", "Space Complexity Analysis", "Priori vs Posteriori Testing", "Asymptotic Equations"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Analysis Basics", 
        title: "Recursion & Backtracking Rules", 
        desc: "Understanding the underlying call stack architectures, designing base case guards, tracing recursion tree flows, and resolving constraint problems.", 
        difficulty: "Medium", 
        topics: ["Call Stack Allocation", "Induction Bases", "Recursion Trees", "Backtracking Constraints"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Linear Structures", 
        title: "Arrays & Linked Lists Chaining", 
        desc: "Contrasting dynamic arrays with node-linked lists. Master singly linked arrays, bidirectional chains, circular iterations, and cycle extraction algorithms.", 
        difficulty: "Easy", 
        topics: ["Dynamic Resizing Logic", "Singly Linked Operations", "Doubly Linked Nodes", "Floyd's Loop Detection"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Linear Structures", 
        title: "Stacks, Queues, & Deques", 
        desc: "Utilizing LIFO and FIFO operational logic. Tracing evaluation pipelines (infix to postfix conversion), ring arrays, and sliding window deques.", 
        difficulty: "Easy", 
        topics: ["LIFO Stack Evaluators", "FIFO Queue Buffers", "Circular Array Indexing", "Sliding Window Maximum"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Hierarchical Trees", 
        title: "Binary Trees & BST Search Dynamics", 
        desc: " Blueprints of binary node systems, linear pre/in/post order traversals, binary search tree insertion protocols, and key deletion logic.", 
        difficulty: "Medium", 
        topics: ["Node Pointer Traversals", "BST Searching Invariants", "Dynamic Node Insertion", "Inorder Successor Finding"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Hierarchical Trees", 
        title: "Self-Balancing AVL Trees & Heaps", 
        desc: "Solving skewed trees with LL/LR/RL/RR tree rotations. Binary heap implementations, priority queues, and the complete heap-sort optimization cycle.", 
        difficulty: "Hard", 
        topics: ["AVL Node Rotations", "Max & Min Heap Structs", "Heapify Algorithm Pools", "Priority Queue Slicing"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 7, 
        phase: "Phase 4: Advanced Systems", 
        title: "Hashing & Collisions Mechanics", 
        desc: "Constructing O(1) retrieval metrics. Implementing modulus hash functions and addressing keys using open addressing (linear/quadratic) and chaining.", 
        difficulty: "Medium", 
        topics: ["Hash Code Mapping", "Linear/Quadratic Probing", "Chaining Resolution", "Load Factor Tuning"], 
        chapterUrl: "https://opendatastructures.org/" 
    },
    { 
        chapter: 8, 
        phase: "Phase 4: Advanced Systems", 
        title: "Graph Traversal Models & Shortest Paths", 
        desc: "Graph systems utilizing matrices and list indexes. Traversal via DFS/BFS, minimum spanning trees, and finding shortest routes.", 
        difficulty: "Hard", 
        topics: ["BFS & DFS Search Patterns", "Dijkstra's Path Solver", "Kruskal's & Prim's MST", "Topological Sort Rules"], 
        chapterUrl: "https://opendatastructures.org/" 
    }
];

const DBMS_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Architecture Foundations", 
        title: "Introduction to DBMS & 3-Schema Architecture", 
        desc: "Understanding data independence, database state vs. schema, and the three levels of abstraction: External, Conceptual, and Internal storage structures.", 
        difficulty: "Easy", 
        topics: ["Data Independence", "Metadata & Catalog", "External View Layer", "Physical Storage Schema"], 
        chapterUrl: "https://opentextbc.ca/dbdesign01/" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Architecture Foundations", 
        title: "ER Diagrams & Relational Mapping", 
        desc: "Designing Conceptual Models with Entities, Attributes, and Relationships. Mapping Entity-Relationship frameworks into logical relational tables with constraint rules.", 
        difficulty: "Medium", 
        topics: ["Cardinality Ratios", "Weak Entities", "Participation Constraints", "Foreign Key Mapping"], 
        chapterUrl: "https://opentextbc.ca/dbdesign01/" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Relational Integrity & Keys", 
        title: "Relational Algebra Operators", 
        desc: "Mastering formal mathematical query execution operations: Select (σ), Project (π), Cartesian Product (X), and various Join operations (⋈).", 
        difficulty: "Hard", 
        topics: ["Selection & Projection", "Set Operations", "Theta & Outer Joins", "Division Operator"], 
        chapterUrl: "https://opentextbc.ca/dbdesign01/" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Relational Integrity & Keys", 
        title: "Functional Dependencies & Normalization", 
        desc: "Analyzing redundancy patterns. Step-by-step structural decomposition using 1NF, 2NF, 3NF, and Boyce-Codd Normal Form (BCNF) rules.", 
        difficulty: "Hard", 
        topics: ["Lossless Join Decomposition", "Dependency Preservation", "Transitive Anomalies", "BCNF Determinants"], 
        chapterUrl: "https://opentextbc.ca/dbdesign01/" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Transaction Control", 
        title: "Transaction Processing & ACID Pillars", 
        desc: "Tracking transaction execution lifecycles. Enforcing Atomicity, Consistency, Isolation, and Durability to guarantee data layer safety.", 
        difficulty: "Medium", 
        topics: ["Commit & Rollback States", "Active vs Failed States", "System Log Buffers", "Shadow Paging"], 
        chapterUrl: "https://opentextbc.ca/dbdesign01/" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Transaction Control", 
        title: "Concurrency Control & Deadlocks", 
        desc: "Managing multi-user access conflicts. Tracking schedules for conflict serializability, Two-Phase Locking (2PL), and handling transactional deadlocks.", 
        difficulty: "Hard", 
        topics: ["Conflict Serializability", "Strict 2PL Protocol", "Cascading Rollbacks", "Wait-Die / Wound-Wait"], 
        chapterUrl: "https://opentextbc.ca/dbdesign01/" 
    }
];

const OS_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Virtualization Foundations", 
        title: "Introduction to OS & Kernels Roles", 
        desc: "Analyzing the role of an OS as a hardware abstraction layer. Studying system call mechanisms, user mode vs. kernel mode isolation boundaries, and Monolithic vs. Microkernel layouts.", 
        difficulty: "Easy", 
        topics: ["Dual-Mode Operations", "System Call Traps", "Microkernels vs Monolithic", "Hardware Abstractions"], 
        chapterUrl: "https://greenteapress.com/thinkos/thinkos.pdf" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Virtualization Foundations", 
        title: "Process States & Thread Mechanics", 
        desc: "Deconstructing Process Control Blocks (PCBs), process context switching lifecycles, state transition gates, and user-level vs. kernel-level threading execution models.", 
        difficulty: "Medium", 
        topics: ["PCB Context Switching", "Process State Diagrams", "Fork() Execution Trees", "Thread Stack Segments"], 
        chapterUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" 
    },
    { 
        chapter: 3, 
        phase: "Phase 1: Virtualization Foundations", 
        title: "CPU Scheduling Algorithms", 
        desc: "Maximizing system throughput bounds and minimizing turnaround times. Tracing non-preemptive and preemptive loops: FCFS, SJF, SRTF, Round Robin, and Multi-Level Feedback Queues.", 
        difficulty: "Medium", 
        topics: ["Turnaround & Waiting Math", "Gantt Chart Layouts", "Round Robin Time Quantas", "Preemptive Intercepts"], 
        chapterUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Concurrency Control", 
        title: "Process Synchronization & Semaphores", 
        desc: "Resolving race conditions inside shared address loops. Enforcing critical section mutual exclusion using Mutex flags, binary/counting semaphores, and evaluating classic synchronization blocks.", 
        difficulty: "Hard", 
        topics: ["Critical Section Criteria", "Counting Semaphores", "Producer-Consumer Solvers", "Dining Philosophers Problem"], 
        chapterUrl: "https://greenteapress.com/thinkos/thinkos.pdf" 
    },
    { 
        chapter: 5, 
        phase: "Phase 2: Concurrency Control", 
        title: "Deadlock Characterization & Prevention", 
        desc: "Analyzing Coffman's four concurrent conditions. Mapping resource allocation graphs, executing Dijkstra's Banker's algorithm for safe states, and deadlock extraction pipelines.", 
        difficulty: "Hard", 
        topics: ["Coffman Conditions", "Banker's Safe Calculations", "Resource Allocation Graphs", "Deadlock Recovery Gates"], 
        chapterUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Memory Management", 
        title: "Memory Allocation & Paging Layouts", 
        desc: "Transitioning from physical base/bound registers to virtual memory architectures. Analyzing fixed/dynamic partitioning anomalies, internal vs. external fragmentation, and lookups.", 
        difficulty: "Medium", 
        topics: ["Logical vs Physical Mapping", "Page Table Entry Layouts", "TLB Cache Miss Overheads", "Segmentation Splitting"], 
        chapterUrl: "https://greenteapress.com/thinkos/thinkos.pdf" 
    },
    { 
        chapter: 7, 
        phase: "Phase 3: Memory Management", 
        title: "Virtual Memory & Page Replacement", 
        desc: "Handling hardware page faults via demands. Evaluating page displacement algorithms: FIFO (including Belady's Anomaly analysis), Optimal (OPT), and Least Recently Used (LRU) models.", 
        difficulty: "Hard", 
        topics: ["Demand Paging Intercepts", "Belady's Anomaly Graphs", "LRU Cache References", "Thrashing & Working Sets"], 
        chapterUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters" 
    }
];
const SOFTSKILLS_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Professional Communication", 
        title: "Verbal Articulation & Active Listening", 
        desc: "Mastering vocal delivery, pitch control, structuring professional arguments, and executing high-fidelity empathetic listening loops to minimize corporate communication gaps.", 
        difficulty: "Easy", 
        topics: ["Vocal Presence Rules", "Active Feedback Loops", "Message Encoding Bias", "Barriers to Listening"], 
        chapterUrl: "https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/619/12/Professional-Communications-1573849225._print.pdf" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Professional Communication", 
        title: "Written Correspondence & Professional E-mails", 
        desc: "Structuring executive summaries, drafting clear progress adjustments, managing audience tone markers, and preventing technical ambiguity inside multi-team workspaces.", 
        difficulty: "Easy", 
        topics: ["The 7 C's of Communication", "Email Hierarchy Blocks", "Audience Analysis Profiles", "Technical Clarity Mapping"], 
        chapterUrl: "https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/619/12/Professional-Communications-1573849225._print.pdf" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Interpersonal Dynamics", 
        title: "Teamwork Matrix & Adaptive Leadership", 
        desc: "Deconstructing Tuckman's stages of group progression (Forming, Storming, Norming, Performing). Navigating team execution, role division, and collective accountability vectors.", 
        difficulty: "Medium", 
        topics: ["Tuckman's Group Stages", "Cross-Functional Collaboration", "Conflict Arbitrage Protocols", "Delegation Matrices"], 
        chapterUrl: "https://maacce.org/wp-content/uploads/2017/06/Soft-Skills-Learning-Materials.pdf" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Interpersonal Dynamics", 
        title: "Emotional Intelligence & Conflict Arbitrage", 
        desc: "Cultivating self-awareness thresholds, social cue recognition, de-escalating interpersonal team friction points, and negotiating mutual compromise frameworks.", 
        difficulty: "Medium", 
        topics: ["Goleman's EQ Framework", "De-escalation Primitives", "Assertive Boundary Settings", "Collaborative Negotiation"], 
        chapterUrl: "https://maacce.org/wp-content/uploads/2017/06/Soft-Skills-Learning-Materials.pdf" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Executive Presence", 
        title: "High-Stakes Technical Presentation Delivery", 
        desc: "Blueprinting architectural engineering pitches. Managing cognitive load overheads for non-technical stakeholders, handling intense Q&A sessions, and dynamic slide design.", 
        difficulty: "Hard", 
        topics: ["Cognitive Load Management", "Storytelling for Engineers", "Handling Hostile Q&A", "Visual Scannability Layouts"], 
        chapterUrl: "https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/619/12/Professional-Communications-1573849225._print.pdf" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Executive Presence", 
        title: "Time Arbitrage, Stress Gates, & Work Etiquette", 
        desc: "Utilizing Eisenhower priority quadrant arrays to eliminate tech burnout. Mastering virtual workspace etiquette metrics, interview frameworks, and standard ethics.", 
        difficulty: "Easy", 
        topics: ["Eisenhower Matrix Sorting", "Burnout Mitigation Metrics", "Virtual Standup Etiquette", "Technical Interview Ethics"], 
        chapterUrl: "https://maacce.org/wp-content/uploads/2017/06/Soft-Skills-Learning-Materials.pdf" 
    }
];
const APTITUDE_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Quantitative Core Primitives", 
        title: "Number Systems, HCF & LCM Patterns", 
        desc: "Mastering divisibility guidelines, remainder theorems, unit digit tracking algorithms, and algebraic applications of Lowest Common Multiple and Highest Common Factor sets.", 
        difficulty: "Easy", 
        topics: ["Divisibility Matrices", "Remainder Theorem Rules", "HCF Euclidean Model", "Unit Digit Cyclic Loops"], 
        chapterUrl: "https://feelfreetolearn.com/" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Quantitative Core Primitives", 
        title: "Percentages, Profit, Loss & Discount", 
        desc: "Deconstructing successive percentage variations, calculating mark-up ratios vs. profit margin matrices, and resolving fraudulent trader weights puzzles.", 
        difficulty: "Medium", 
        topics: ["Successive Percentage Math", "Cost Price Adjustments", "Discount Rate Structures", "False Balance Equivalence"], 
        chapterUrl: "https://feelfreetolearn.com/" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Ratios & Motion Mechanics", 
        title: "Ratio, Proportion, Mixtures & Alligations", 
        desc: "Utilizing mean price alligation lines to compute mixture concentration replacements, mean proportional constants, and partnership financial distribution limits.", 
        difficulty: "Medium", 
        topics: ["Compounded Ratio Scales", "Alligation Cross Maps", "Variable Liquid Swaps", "Partnership Capital Shares"], 
        chapterUrl: "https://feelfreetolearn.com/" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Ratios & Motion Mechanics", 
        title: "Time, Speed, Distance & Work Equations", 
        desc: "Analyzing inverse proportionality behaviors. Solving relative speed vectors for train intersections, boat upstream/downstream flows, and multi-agent efficiency matrices.", 
        difficulty: "Hard", 
        topics: ["Relative Speed Intercepts", "Upstream vs Downstream Math", "Wages & Alternative Days", "Pipe & Cistern Fill Latency"], 
        chapterUrl: "https://feelfreetolearn.com/" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Logical & Analytical Reasoning", 
        title: "Syllogisms & Venn Diagram Calculations", 
        desc: "Mapping categorical statement distributions (All, Some, No, Some-Not) using Euler circles to test validity scopes and resolve complex deduction problems.", 
        difficulty: "Medium", 
        topics: ["Euler Circle Intersections", "Definite vs Possible Cases", "Complementary Pairs Rule", "Three-Variable Venn Math"], 
        chapterUrl: "https://feelfreetolearn.com/" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Logical & Analytical Reasoning", 
        title: "Arrangements, Matrices & Blood Relations", 
        desc: "Formulating linear/circular constraints, mapping high-dimensional grid matrices, and tracing case-sensitive generation trees to resolve multi-variable logical puzzles.", 
        difficulty: "Hard", 
        topics: ["Circular Seating Parameters", "Multi-Variable Matrix Grids", "Coded Blood Lineages", "Direction Vector Traps"], 
        chapterUrl: "https://feelfreetolearn.com/" 
    }
];

const NETWORKS_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Architecture Layers & Physical Media", 
        title: "OSI vs TCP/IP Reference Architectures", 
        desc: "Deconstructing encapsulations across the 7 layer stacks. Analyzing end-to-end data transmission parameters, propagation delay calculations, and transmission media properties.", 
        difficulty: "Easy", 
        topics: ["Layer Encapsulations", "Propagation Delay Math", "Circuit vs Packet Switching", "Bandwidth-Delay Product"], 
        chapterUrl: "https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Architecture Layers & Physical Media", 
        title: "Data Link Controls & Framing Standards", 
        desc: "Mastering media access controls. Evaluating error extraction schemes (CRC) alongside sliding window protocol flow mechanics: Stop & Wait, Go-Back-N, and Selective Repeat.", 
        difficulty: "Hard", 
        topics: ["Cyclic Redundancy Checks", "Go-Back-N Efficiency Math", "Selective Repeat Buffers", "CSMA/CD Collisions"], 
        chapterUrl: "https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Network Routing & Subnet Logic", 
        title: "IP Addressing & Classless Subnetting", 
        desc: "Formulating hierarchical routing paths. Master Classful network masks, Variable Length Subnet Masking (VLSM), Classless Inter-Domain Routing (CIDR) blocks, and address allocations.", 
        difficulty: "Hard", 
        topics: ["CIDR Notation Aggregation", "Subnet Range Allocations", "NAT Table Mappings", "ARP Request Broads"], 
        chapterUrl: "https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Network Routing & Subnet Logic", 
        title: "Routing Algorithms & Gateway Protocols", 
        desc: "Analyzing algorithmic routing topologies. Calculating shortest path configurations using Dijkstra's Link-State protocol vs. Bellman-Ford Distance Vector arrays.", 
        difficulty: "Medium", 
        topics: ["Dijkstra SPF Calculations", "Count-to-Infinity Anomalies", "RIP Split-Horizon Controls", "OSPF vs BGP Scaling"], 
        chapterUrl: "https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Transport Protocol Integrity", 
        title: "TCP Mechanics & Congestion Pipelines", 
        desc: "Tracking connection lifecycles via the 3-Way Handshake. Managing window boundaries, sequence verification schemes, and window throttling phases: Slow Start, AIMD, and Fast Recovery.", 
        difficulty: "Hard", 
        topics: ["3-Way Handshake States", "TCP Window Size Adjustments", "AIMD Multiplicative Decrements", "Silly Window Syndrome"], 
        chapterUrl: "https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Transport Protocol Integrity", 
        title: "Application Protocol Layouts & DNS Systems", 
        desc: "Deconstructing application communication loops. Parsing recursive/iterative DNS translations, transactional HTTP configurations, and core port allocations.", 
        difficulty: "Easy", 
        topics: ["DNS Record Lookups", "HTTP Persistent Pipelines", "SMTP/IMAP Structures", "Port Map Allocations"], 
        chapterUrl: "https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
    }
];

const GIT_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Version Control Primitives", 
        title: "Version Control Systems & Architecture Areas", 
        desc: "Differentiating between Centralized (CVCS) and Distributed (DVCS) version control ecosystems. Master the three localized Git staging tiers: Working Directory, Staging Area (Index), and Local Repository (.git directory).", 
        difficulty: "Easy", 
        topics: ["DVCS Distribution Maps", "Working Tree Intercepts", "The Staging Index", "Commit Object Graphs"], 
        chapterUrl: "https://git-scm.com/book/en/v2" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Version Control Primitives", 
        title: "Basic Snapshot Mechanics & Logging", 
        desc: "Initializing dynamic tracking environments. Mastering snapshot mutations using status queries, multi-file file additions, targeted commits, and tracking history loops.", 
        difficulty: "Easy", 
        topics: ["Git Init Configuration", "Tracking File States", "SHA-1 Hash Integrity", "Custom Log Formatting"], 
        chapterUrl: "https://git-scm.com/book/en/v2" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Branching & Merge Arbitrage", 
        title: "Git Branching Models & Pointer Movements", 
        desc: "Deconstructing Git branches as lightweight mutable pointers to commit nodes. Tracking HEAD reference modifications, navigating timeline nodes, and processing isolated feature development chains.", 
        difficulty: "Medium", 
        topics: ["HEAD Pointer Tracking", "Branch Swapping Mechanics", "Divergent History Loops", "Fast-Forward Merge Rules"], 
        chapterUrl: "https://git-scm.com/book/en/v2" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Branching & Merge Arbitrage", 
        title: "Advanced Merging & Conflict Resolution", 
        desc: "Executing 3-way merge paths between structural snapshots. Recognizing common parent nodes, parsing conflict markers inside overlapping codebases, and completing merge commits safely.", 
        difficulty: "Hard", 
        topics: ["3-Way Merge Matrices", "Conflict Marker Syntax", "Aborting Merge Routines", "Manual Verification Grids"], 
        chapterUrl: "https://git-scm.com/book/en/v2" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Remote Collaboration & Sync", 
        title: "Remote Repositories & Collaboration Logic", 
        desc: "Managing references to collaborative servers. Syncing historical snapshot trees utilizing fetch queries to separate paths, merging origin updates, handling pushes, and resolving divergent head configurations.", 
        difficulty: "Medium", 
        topics: ["Remote Tracking Pointers", "Fetch vs Pull Latency", "Upstream Origin Alignment", "Push Rejection Handling"], 
        chapterUrl: "https://git-scm.com/book/en/v2" 
    },
    { 
        chapter: 6, 
        phase: "Phase 3: Remote Collaboration & Sync", 
        title: "Rebasing, Amending, & History Optimization", 
        desc: "Modifying local history graphs before pushing to production. Rewriting history using commit amendments, executing interactive rebases to squash nodes, and analyzing the Golden Rule of Rebasing.", 
        difficulty: "Hard", 
        topics: ["Interactive Squashing", "Commit Reflog Ingestion", "The Golden Rule Layout", "Cherry-Picking Patches"], 
        chapterUrl: "https://git-scm.com/book/en/v2" 
    }
];

const OOP_CURRICULUM = [
    { 
        chapter: 1, 
        phase: "Phase 1: Paradigms & Encapsulation", 
        title: "Procedural vs. Object-Oriented Paradigms", 
        desc: "Analyzing limitations of structured procedural pipelines. Master data abstraction principles, class definitions, object initialization scopes, and access specifiers (private, protected, public) to enforce strict boundary encapsulation.", 
        difficulty: "Easy", 
        topics: ["Data Hiding Attributes", "Access Control Modifiers", "Class Blueprints", "Object Memory Allocation"], 
        chapterUrl: "https://users.dcc.uchile.cl/~nbaloian/OOP-DCC/object-oriented-programming-using-java.pdf" 
    },
    { 
        chapter: 2, 
        phase: "Phase 1: Paradigms & Encapsulation", 
        title: "Constructors & Memory Lifecycles", 
        desc: "Deconstructing object initialization routines. Mastering default, parameterized, and copy constructors alongside destructor hooks, deep vs. shallow copying behaviors, and garbage collection mechanisms.", 
        difficulty: "Medium", 
        topics: ["Copy Constructor Mechanics", "Deep vs Shallow Clones", "This/Self Reference Pointers", "Finalizer & Destructor Loops"], 
        chapterUrl: "https://zuhaib-shaikh.neocities.org/downloads/oop/OOP_book.pdf" 
    },
    { 
        chapter: 3, 
        phase: "Phase 2: Inheritance & Poly-Morphs", 
        title: "Inheritance Hierarchies & Reusability", 
        desc: "Constructing class relationship models. Implementing single, multiple, multilevel, and hierarchical structures. Resolving the Diamond Problem using virtual base structures and interface layers.", 
        difficulty: "Medium", 
        topics: ["Super/Base Initializers", "The Diamond Problem Solver", "Composition vs Inheritance", "Abstract Class Interfaces"], 
        chapterUrl: "https://damiantgordon.com/Courses/OOP/OOP-Workbook.pdf" 
    },
    { 
        chapter: 4, 
        phase: "Phase 2: Inheritance & Poly-Morphs", 
        title: "Compile-Time vs. Runtime Polymorphism", 
        desc: "Implementing dynamic program behaviors. Overloading operators and methods at compile-time vs. overriding methods via Virtual Tables (vTables) and dynamic method dispatch loops at runtime.", 
        difficulty: "Hard", 
        topics: ["Method Overloading Binding", "Virtual Method Table (vTable)", "Dynamic Binding Dispatches", "Pure Virtual Functions"], 
        chapterUrl: "https://users.dcc.uchile.cl/~nbaloian/OOP-DCC/object-oriented-programming-using-java.pdf" 
    },
    { 
        chapter: 5, 
        phase: "Phase 3: Design Principles & Patterns", 
        title: "SOLID Design Principles & Abstractions", 
        desc: "Applying decoupled architectural patterns to real-world code. Mastering Single Responsibility, Open/Closed, Substitution, Interface Segregation, and Dependency Inversion rules.", 
        difficulty: "Hard", 
        topics: ["Liskov Substitution Constraints", "Dependency Inversion Models", "Interface Segregation Splits", "Loose Coupling Frameworks"], 
        chapterUrl: "https://damiantgordon.com/Courses/OOP/OOP-Workbook.pdf" 
    }
];

// ============================================================================
// COMPONENT: DSA CORE STUDY CONSOLE WIDGET
// ============================================================================
export const DSASudyHub = ({ theme, onClose }) => {
    // sessionStorage active state preservation tracking keys
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('prepquest_dsa_tab') || 'roadmap';
    });
    const [selectedChapter, setSelectedChapter] = useState(DSA_CURRICULUM[0]);
    const [cheatSection, setCheatSection] = useState('complexities'); // 'complexities', 'structures', 'sorting'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_dsa_tab', tabId);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        handleTabChange('textbook');
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const DSA_CHEAT_DATA = {
        complexities: [
            {
                title: "Asymptotic Complexity Bounds",
                desc: "Standard computational complexity hierarchies and analysis benchmarks.",
                code: `• Constant Time     : O(1)       -> Array index access, Hash map lookup (average)\n• Logarithmic Time  : O(log N)   -> Binary Search, Heap insert/delete\n• Linear Time       : O(N)       -> Single loop scans, Linked list search\n• Linearithmic Time : O(N log N) -> Merge Sort, Quick Sort (average)\n• Quadratic Time    : O(N^2)     -> Nested loops, Bubble / Insertion Sort`
            }
        ],
        structures: [
            {
                title: "Standard Pointer Structures",
                desc: "Low-level implementation code templates for fundamental linked chains.",
                code: `// Singly Linked List Node (C++ Paradigm)\nstruct Node {\n    int data;\n    Node* next;\n    Node(int val) : data(val), next(nullptr) {}\n};\n\n// Double Linked List Node\nstruct DLLNode {\n    int data;\n    DLLNode* prev;\n    DLLNode* next;\n    DLLNode(int val) : data(val), prev(nullptr), next(nullptr) {}\n};`
            }
        ],
        sorting: [
            {
                title: "Core Sorting Performance Boundaries",
                desc: "Differentiating between standard array ordering algorithm properties.",
                code: `• Quick Sort : Best: O(N log N) | Worst: O(N^2)     | Space: O(log N) | Unstable\n• Merge Sort : Best: O(N log N) | Worst: O(N log N) | Space: O(N)     | Stable\n• Heap Sort  : Best: O(N log N) | Worst: O(N log N) | Space: O(1)     | Unstable\n• Insertion  : Best: O(N)       | Worst: O(N^2)     | Space: O(1)     | Stable`
            }
        ]
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">📊 DSA Algorithms & Structures Console</h2>
                    <p className="text-xs text-slate-400">Analysis metrics, hierarchical node structures, heap algorithms, and path optimization models</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {DSA_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Topic Node {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Syllabus Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('textbook')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 View Academic Resource Deck
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - HIGH PERFORMANCE CARD VIEW */}
            {activeTab === 'textbook' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto">
                    <div className="p-6 border border-rose-500 bg-rose-500/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">📚</span>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">OPEN DATA STRUCTURES</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Open Data Structures (An Introduction)</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Author: Pat Morin / Carleton University</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                A comprehensive, highly rigorous textbook analyzing fundamental structures and execution behaviors. Master binary trees, AVL structures, hashtable algorithms, array arrays, and complexity equations in highly stable environments.
                            </p>
                        </div>
                        <a 
                            href="https://opendatastructures.org/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                        >
                            🚀 OPEN OFFICIAL TEXTBOOK SITE ↗
                        </a>
                    </div>
                </div>
            )}

            {/* VIDEO HUB TAB - ABSOLUTE ALIGNMENT & ERADICATED YT ERRORS */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                            <div>
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    🎥 Abdul Bari Masterclass
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                    The legendary online course covering analysis principles, binary heaps, dynamic programming tracks, search loops, and path optimizations.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <a 
                                    href="https://www.youtube.com/watch?v=0IAPZzGSbME&list=PLAXnLdrLnQpRcveZTtD644gM9uzYqJCwr"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                                >
                                    ⏭️ PLAY FULL SERIES ON YOUTUBE ↗
                                </a>
                                <a 
                                    href="https://youtube.com/playlist?list=PLAXnLdrLnQpRcveZTtD644gM9uzYqJCwr"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800 hover:text-slate-200 transition-colors"
                                >
                                    📂 Open Complete Series Index ↗
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/0IAPZzGSbME?rel=0" 
                                title="Abdul Bari Data Structures Course" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen 
                            />
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 px-1">
                            Showcase Track: Lecture #1 - Introduction to Algorithms, Priori Analysis & Complexity Bounds
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        {/* Interactive Cheat Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">ALGORITHMS 4E SUITE</span>
                                <h3 className="text-sm font-black text-white mt-2">Princeton Algorithm Reference</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Need to double-check sorting boundary formulas, priority queue layouts, tree rotations, or dynamic programming memory constraints? Explore the official Princeton syllabus guide here:
                                </p>
                            </div>
                            <a 
                                href="https://algs4.cs.princeton.edu/cheatsheet/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                ⚡ ACCESS PRINCETON DSA CHEATSHEET ↗
                            </a>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            {['complexities', 'structures', 'sorting'].map(sec => (
                                <button key={sec} onClick={() => setCheatSection(sec)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.toUpperCase()} REFERENCE
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {DSA_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Parameters'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const JavaStudyHub = ({ theme, onClose }) => {
    // Attempt to restore tab and page from sessionStorage
    function getInitialTab() {
        const storedTab = sessionStorage.getItem("prepquest_java_tab");
        if (
            storedTab === "roadmap" ||
            storedTab === "textbook" ||
            storedTab === "videos" ||
            storedTab === "cheatsheet"
        ) {
            return storedTab;
        }
        return "roadmap";
    }
    function getInitialPdfPage() {
        const val = parseInt(sessionStorage.getItem("prepquest_java_pdf_page"));
        // Only set if it's a number and a valid curriculum page
        const isValid =
            !isNaN(val) &&
            JAVA_CURRICULUM.some((c) => c.pdfPage === val);
        return isValid ? val : 16;
    }

    function getChapterForPdfPage(pdfPage) {
        return JAVA_CURRICULUM.find((c) => c.pdfPage === pdfPage) || JAVA_CURRICULUM[0];
    }

    // -- Restore ONLY on initial mount; do not re-fire on every render --
    const didMount = useRef(false);

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [pdfPage, setPdfPage] = useState(getInitialPdfPage());
    const [selectedChapter, setSelectedChapter] = useState(getChapterForPdfPage(getInitialPdfPage()));
    const [selectedPlaylist, setSelectedPlaylist] = useState('telusko'); // 'telusko', 'brocode'
    const [cheatSection, setCheatSection] = useState('syntax'); // 'syntax', 'oop', 'collections', 'lambdas', 'concurrency'
    const [copiedId, setCopiedId] = useState(null);
    const [iframeKey, setIframeKey] = useState(Date.now());

    // Session track: always "study/Java" when this is mounted
    useEffect(() => {
        sessionStorage.setItem("prepquest_view", "study");
        sessionStorage.setItem("prepquest_study_topic", "Java");
    }, []);

    // On mount, lock the Java tab state/page in sessionStorage.
    useEffect(() => {
        // On initial mount, restore selectedChapter if tab and/or pdfPage were set
        // If sessionStorage pdfPage is set, match chapter to it
        if (!didMount.current) {
            didMount.current = true;
            // Already handled by default state
            return;
        }
    }, []);

    // Persist changes when these change
    useEffect(() => {
        sessionStorage.setItem("prepquest_java_tab", activeTab);
    }, [activeTab]);
    useEffect(() => {
        sessionStorage.setItem("prepquest_java_pdf_page", pdfPage);
    }, [pdfPage]);

    // Whenever either activeTab or pdfPage changes, keep sessionStorage up-to-date.
    // Ensure selectedChapter is in sync with pdfPage changes.
    useEffect(() => {
        const chap = JAVA_CURRICULUM.find((c) => c.pdfPage === pdfPage);
        if (chap && chap.chapter !== selectedChapter.chapter) {
            setSelectedChapter(chap);
        }
        // Don't add selectedChapter to deps to avoid infinite loop
        // eslint-disable-next-line
    }, [pdfPage]);

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        setPdfPage(chap.pdfPage);
        setIframeKey(Date.now());
        setActiveTab('textbook');
        // All the above will trigger associated sessionStorage syncs
    };

    const handleDropdownChange = (e) => {
        const targetPage = parseInt(e.target.value);
        setPdfPage(targetPage);
        const matchingChap = JAVA_CURRICULUM.find(c => c.pdfPage === targetPage);
        if (matchingChap) setSelectedChapter(matchingChap);
        setIframeKey(Date.now());
    };

    return (
        <div className={`p-6 border rounded-2xl backdrop-blur-xl space-y-6 ${
            theme === 'dark' ? 'border-appGold/30 bg-slate-950/45 text-white' : 'border-amber-500/30 bg-white shadow-md text-slate-800'
        }`}>
            {/* Top Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700/30 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono flex items-center gap-1 text-slate-400 hover:text-white transition-all mb-1 cursor-pointer">
                        🡨 Back to Reference Vault
                    </button>
                    <h2 className="text-2xl font-black tracking-wide flex items-center gap-2">
                        ☕ Java Complete Learning Center
                    </h2>
                    <p className="text-xs text-slate-400">Roadmaps, textbooks, curated lectures, and code reference frameworks</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map', color: 'text-appGold' },
                        { id: 'textbook', label: '📖 Textbook Guide', color: 'text-rose-400' },
                        { id: 'videos', label: '🎥 Video Hub', color: 'text-cyan-400' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet', color: 'text-yellow-400' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className={tab.color}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {JAVA_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedChapter(item)}
                                        className={`p-4 border rounded-xl transition-all cursor-pointer text-left relative ${
                                            isActive ? 'border-appGold bg-appGold/5 shadow-md shadow-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${
                                            isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'
                                        }`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                                item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                                                item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'
                                            }`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left space-y-4 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="border-b border-slate-800 pb-3">
                                    <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Chapter {selectedChapter.chapter} Details</span>
                                    <h3 className="text-lg font-black mt-3 text-white">{selectedChapter.title}</h3>
                                    <p className="text-xs text-slate-400 mt-1 italic">{selectedChapter.phase}</p>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-300">{selectedChapter.desc}</p>
                            </div>
                            <div className="space-y-2.5 pt-4 border-t border-slate-800/60">
                                <button 
                                    onClick={() => handleJumpToChapter(selectedChapter)}
                                    className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 transition-all text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    📖 Load Chapter Work View (Page {selectedChapter.pdfPage})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TEXTBOOK TAB - DETACHED SAFE TAB DESIGN */}
            {activeTab === 'textbook' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-4 space-y-4 text-left">
                        <div className="p-5 bg-gradient-to-br from-rose-500/10 to-red-600/10 border border-rose-500 rounded-2xl space-y-3 shadow-lg">
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
                                    SAFE BROWSER COMPASS
                                </span>
                                <h3 className="text-sm font-black text-white mt-2">Prevent Tab Overwrites</h3>
                                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                                    To safely explore embedded `.java` source code files, sample libraries, or index extensions without losing your workspace layout position, launch the manual in a secure detached tab:
                                </p>
                            </div>

                            <div className="space-y-3 pt-1">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono text-slate-400">Jump to Chapter Coordinate:</label>
                                    <select 
                                        value={pdfPage}
                                        onChange={handleDropdownChange}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                                    >
                                        {JAVA_CURRICULUM.map(c => (
                                            <option key={c.chapter} value={c.pdfPage}>Ch {c.chapter}: {c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <a 
                                    href={`https://math.hws.edu/eck/cs124/downloads/javanotes9-linked.pdf#page=${pdfPage}`}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                                >
                                    🚀 OPEN BOOK IN NEW TAB SAFELY ↗
                                </a>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                            <span className="text-[10px] font-mono font-bold text-amber-400 block mb-1">🔗 Technical Guide</span>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Tip: You can also access source files directly from the official repository index at <a href="https://math.hws.edu/eck/cs124/downloads/javanotes9-source.zip" target="_blank" rel="noreferrer" className="text-rose-400 underline font-bold">javanotes9-source.zip ↗</a> to parse them cleanly inside your favorite offline IDE editor environment.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-8 relative border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                        <iframe 
                            key={iframeKey}
                            src={`https://math.hws.edu/eck/cs124/downloads/javanotes9-linked.pdf#page=${pdfPage}`}
                            width="100%" 
                            height="540px" 
                            className="border-none"
                            title="Java Textbook PDF"
                        />
                    </div>
                </div>
            )}

            {/* CURATED VIDEO HUB - HYBRID EMBED + DETACHED CONTINUATION FLOW */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    {/* Left Custom Controller Panel */}
                    <div className="lg:col-span-4 flex flex-col space-y-4 text-left">
                        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-1">
                            <button 
                                onClick={() => setSelectedPlaylist('telusko')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPlaylist === 'telusko' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                ☕ Navin Reddy (Telusko)
                            </button>
                            <button 
                                onClick={() => setSelectedPlaylist('brocode')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPlaylist === 'brocode' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                ⚡ Bro Code Core
                            </button>
                        </div>

                        {/* Detached Next Video Routing Workspace Card */}
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                            <div>
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    {selectedPlaylist === 'telusko' ? '📚 Navin Talks Course Track' : '⚡ Bro Code Series Deck'}
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                    The introduction video is mounted directly inside our application below. To watch the rest of the playlist on YouTube, launch the detached panel:
                                </p>
                            </div>


<div className="space-y-2">
    <a 
        href={
            selectedPlaylist === 'telusko'
                ? "https://www.youtube.com/watch?v=bm0OyhwFDuY&list=PLsyeobzWxl7pe_IiTfNyr55kwJPWbgxB5"
                : "https://www.youtube.com/watch?v=23HFxAPyJ9U&list=PLZPZq0r_RZOOj_NOZYq_R2PECIMglLemc"
        }
        target="_blank"
        rel="noreferrer"
        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
    >
        ⏭️ PLAY FULL SERIES ON YOUTUBE ↗
    </a>
    
    <a 
        href={
            selectedPlaylist === 'telusko'
                ? "https://www.youtube.com/playlist?list=PLsyeobzWxl7pe_IiTfNyr55kwJPWbgxB5"
                : "https://www.youtube.com/playlist?list=PLZPZq0r_RZOOj_NOZYq_R2PECIMglLemc"
        }
        target="_blank"
        rel="noreferrer"
        className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800 hover:text-slate-200 transition-colors"
    >
        📂 Open Entire Index Matrix View ↗
    </a>
</div>
                        </div>
                    </div>

                    {/* Right Fixed Embed Showcase Player Area */}
                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            {selectedPlaylist === 'telusko' ? (
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src="https://www.youtube.com/embed/bm0OyhwFDuY?rel=0" 
                                    title="Navin Talks Java Introduction" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                />
                            ) : (
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src="https://www.youtube.com/embed/23HFxAPyJ9U?rel=0" 
                                    title="Bro Code Java Core Introduction" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                />
                            )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 text-left px-1">
                            Showcase Track: {selectedPlaylist === 'telusko' ? 'Lecture #1 - Java Intro' : 'Lecture #1 - Core Setup Basics'}
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">CORE KNOWLEDGE MAP</span>
                                <h3 className="text-sm font-black text-white mt-2">Exhaustive Global Language Spec</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">Looking for syntax parameters, algorithmic details, or structural framework properties? Find the complete blueprint library index map via the link below:</p>
                            </div>
                            <a 
                                href="https://overapi.com/java" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                🔗 EXPLORE FULL OVERAPI JAVA DIRECTORY ↗
                            </a>
                        </div>

                        <div className="space-y-2 pt-2">
                            {[
                                { id: 'syntax', label: '⚙️ Basics & Types' },
                                { id: 'oop', label: '🧩 OOP Pillars' },
                                { id: 'collections', label: '🗂️ JCF Collections' },
                                { id: 'lambdas', label: 'λ Lambdas & Streams' },
                                { id: 'concurrency', label: '🧵 Concurrency & I/O' }
                            ].map(sec => (
                                <button
                                    key={sec.id}
                                    onClick={() => setCheatSection(sec.id)}
                                    className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                        cheatSection === sec.id ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    {sec.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {CHEATSHEET_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)}
                                        className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                                    >
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Code'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
const PythonStudyHub = ({ theme, onClose }) => {
    // Session state hydration tracking keys configured specifically for Python context
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('prepquest_python_tab') || 'roadmap';
    });
    const [selectedChapter, setSelectedChapter] = useState(PYTHON_CURRICULUM[0]);
    const [cheatSection, setCheatSection] = useState('basics'); // 'basics', 'oop', 'data'
    const [iframeKey, setIframeKey] = useState(Date.now());

    // Sync variables to sessionStorage on modification to survive external link navigation safely
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_python_tab', tabId);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        setIframeKey(Date.now());
        handleTabChange('textbook');
    };

    const PYTHON_CHEAT_DATA = {
        basics: [
            {
                title: "Dynamic Variables & Core Typing",
                desc: "Python features dynamic type casting. Variables are names bound to runtime object instances dynamically.",
                code: `# Scalar Initializations\nuser_age = 21\ncoordinate_y = -42.87\nis_validated = True\n\n# Dynamic Re-binding\nx = "Matam Yagneshwar"\nx = [1, 2, 3]  # Perfectly legal re-assignment`
            },
            {
                title: "Advanced List Slicing Mechanics",
                desc: "Extract sequential memory sub-arrays using step configuration index thresholds safely.",
                code: `matrix_data = [10, 20, 30, 40, 50, 60, 70, 80]\n\n# format parameter: [start:stop:step]\nsubset_a = matrix_data[1:5]     # [20, 30, 40, 50]\nreversed_copy = matrix_data[::-1] # [80, 70, 60, ...]`
            }
        ],
        oop: [
            {
                title: "Class blueprints & Dunder Initializers",
                desc: "Writing structural object components tracking constructor instances inside local stack spaces.",
                code: `class CodeAdventurer:\n    # Shared Class Attribute Variable\n    platform_origin = "PrepQuest Terminal"\n\n    def __init__(self, name: str, skill_level: int):\n        self.name = name          # Instance attribute\n        self.skill_level = skill_level\n\n    def execute_query(self) -> str:\n        return f"{self.name} is executing computational checks."`
            }
        ],
        data: [
            {
                title: "Comprehension Pipelines",
                desc: "High-density list, dictionary, and generator transformations evaluated directly inline.",
                code: `# Functional sequence filters\nsquared_evens = [x**2 for x in range(12) if x % 2 == 0]\n\n# Dictionary key maps\nchar_index_map = {char: idx for idx, char in enumerate("PYTHON")}`
            }
        ]
    };

    return (
        <div className={`p-6 border rounded-2xl backdrop-blur-xl space-y-6 ${
            theme === 'dark' ? 'border-appGold/30 bg-slate-950/45 text-white' : 'border-amber-500/30 bg-white shadow-md text-slate-800'
        }`}>
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700/30 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono flex items-center gap-1 text-slate-400 hover:text-white transition-all mb-1 cursor-pointer">
                        🡨 Back to Reference Vault
                    </button>
                    <h2 className="text-2xl font-black tracking-wide flex items-center gap-2">
                        🐍 Python Complete Learning Center
                    </h2>
                    <p className="text-xs text-slate-400">Roadmaps, interactive notebooks, lecture modules, and language specification indexes</p>
                </div>

                {/* Unified Premium Tab Switcher */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map', color: 'text-appGold' },
                        { id: 'textbook', label: '📖 Textbook (Web)', color: 'text-rose-400' },
                        { id: 'videos', label: '🎥 Video Hub', color: 'text-cyan-400' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet', color: 'text-yellow-400' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className={tab.color}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB - COMPLETELY MATCHES JAVA TIMELINE GRAPH DESIGN */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    {/* Left Timeline Panel */}
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-left">
                            <p className="text-xs text-slate-400 italic">
                                💡 Note: Click chapters below to inspect conceptual data blocks, jump straight to the textbook reader, or explore specific syntax parameters.
                            </p>
                        </div>
                        
                        <div className="relative border-l border-slate-850 pl-6 ml-4 space-y-6">
                            {PYTHON_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedChapter(item)}
                                        className={`p-4 border rounded-xl transition-all cursor-pointer text-left relative ${
                                            isActive
                                                ? 'border-appGold bg-appGold/5 shadow-md shadow-appGold/5'
                                                : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                                        }`}
                                    >
                                        {/* Glowing Timeline Node Circle */}
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${
                                            isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'
                                        }`} />

                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-450">
                                                {item.phase}
                                            </span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                                item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                                                item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                                                'border-rose-500/20 text-rose-400 bg-rose-500/5'
                                            }`}>
                                                {item.difficulty}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Details Sidebar Panel */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left space-y-4 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="border-b border-slate-800 pb-3">
                                    <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">
                                        Chapter {selectedChapter.chapter} Details
                                    </span>
                                    <h3 className="text-lg font-black mt-3 text-white">{selectedChapter.title}</h3>
                                    <p className="text-xs text-slate-400 mt-1 italic">{selectedChapter.phase}</p>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-300">{selectedChapter.desc}</p>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Key Subtopics Covered:</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedChapter.topics.map((t, idx) => (
                                            <span key={idx} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-805">
                                                • {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2.5 pt-4 border-t border-slate-800/60">
                                <button 
                                    onClick={() => handleJumpToChapter(selectedChapter)}
                                    className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 transition-all text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    📖 Jump to Chapter Web Frame Viewer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TEXTBOOK WEB TAB WITH INTEGRATED GOOGLE COLAB LAB COMPASS */}
            {activeTab === 'textbook' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-4 space-y-4 text-left">
                        {/* High-Visibility Google Colab Action Container Card */}
                        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-orange-600/10 border border-blue-500 rounded-2xl space-y-3 shadow-lg">
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-blue-500/20 text-cyan-400 border border-blue-500/30 px-2 py-0.5 rounded">
                                    🚀 LIVE COMPILATION DECK
                                </span>
                                <h3 className="text-sm font-black text-white mt-2">Interactive Think Python Notebooks</h3>
                                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                                    Want to test, run, and modify the textbook code blocks live? Access the official *Think Python* cloud computing repository matrix to run execution nodes instantly in the cloud:
                                </p>
                            </div>
                            <a 
                                href="https://allendowney.github.io/ThinkPython/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
                            >
                                🪐 LAUNCH GOOGLE COLAB NOTEBOOKS ↗
                            </a>
                        </div>

                        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono text-slate-400">Target Core Document Node:</label>
                                <select 
                                    value={PYTHON_CURRICULUM.indexOf(selectedChapter)}
                                    onChange={(e) => setSelectedChapter(PYTHON_CURRICULUM[parseInt(e.target.value)])}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                                >
                                    {PYTHON_CURRICULUM.map((c, idx) => (
                                        <option key={idx} value={idx}>Ch {c.chapter}: {c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <a 
                                href={selectedChapter.chapterUrl}
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                                ↗ Open Chapter Separately
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-8 relative border border-slate-800 rounded-2xl overflow-hidden bg-white shadow-inner">
                        <iframe 
                            key={iframeKey}
                            src={selectedChapter.chapterUrl}
                            width="100%" 
                            height="540px" 
                            className="border-none"
                            title="Python Textbook Viewer"
                        />
                    </div>
                </div>
            )}

            {/* REPLACE THE VIDEO TAB COMPONENT INSIDE YOUR PythonStudyHub */}
{activeTab === 'videos' && (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
        <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div>
                    <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                        🎥 Corey Schafer Core System Track
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        The definitive production-grade Python playlist covering architectural details, syntax structures, and advanced standard library packages.
                    </p>
                </div>
                <div className="space-y-2">
                    <a 
                        href="https://www.youtube.com/watch?v=YYXdXT2l-Gg&list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                    >
                        ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
                    </a>
                    <a 
                        href="https://www.youtube.com/playlist?list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800 hover:text-slate-200 transition-colors"
                    >
                        📂 Open Global Course Playlist Directory ↗
                    </a>
                </div>
            </div>
        </div>

        {/* Unified Display Framework Matching Java Proportions Exactly */}
        <div className="lg:col-span-8 space-y-2">
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/YYXdXT2l-Gg?rel=0" 
                    title="Corey Schafer Python Masterclass" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                />
            </div>
            <p className="text-[10px] font-mono text-slate-500 text-left px-1">
                Showcase Track: Lecture #1 - Python Tutorial for Beginners: Install and Setup Guide
            </p>
        </div>
    </div>
)}

            {/* CHEAT SHEET TAB - RE-ENGINEERED FOR OPTIMIZED VISUAL HIERARCHY */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        {/* High-Density Glowing Card Layer */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                                    CRASH COURSE MANIFEST
                                </span>
                                <h3 className="text-sm font-black text-white mt-2">Eric Matthes Reference Suite</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Need immediate references on loop structures, standard dictionary syntax indices, or syntax definitions? Access the complete, highly compressed layout library blueprint card here:
                                </p>
                            </div>
                            <a 
                                href="https://ehmatthes.github.io/pcc_3e/cheat_sheets/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                ⚡ EXPLORE MATTHES PYTHON SHEETS ↗
                            </a>
                        </div>

                        {/* Interactive Sidebar Sections */}
                        <div className="space-y-1.5 pt-2">
                            {[
                                { id: 'basics', label: '⚙️ Basics & Negation' },
                                { id: 'oop', label: '🧩 OOP & Dunder Structs' },
                                { id: 'data', label: '🗂️ comprehensions & Maps' }
                            ].map(sec => (
                                <button
                                    key={sec.id}
                                    onClick={() => setCheatSection(sec.id)}
                                    className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                        cheatSection === sec.id ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    {sec.label.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Code Compilation View Deck */}
                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {PYTHON_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.code);
                                            // Optional copy feedback can go here if needed
                                        }} 
                                        className="text-[10px] font-mono px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 cursor-pointer"
                                    >
                                        📋 Copy Code
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 text-xs font-mono text-emerald-400 overflow-x-auto rounded-lg">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENT: RE-ENGINEERED C/C++ CORE STUDY HUB (DUAL TEXTBOOK VERSION)
// ============================================================================
const CCStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_cc_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(CC_CURRICULUM[0]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('c'); // 'c' or 'cpp'
    const [selectedBook, setSelectedBook] = useState('c'); // 'c' or 'cpp' - Tracks textbook selection
    const [cheatSection, setCheatSection] = useState('c_basics'); 
    const [iframeKey, setIframeKey] = useState(Date.now());

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_cc_tab', tabId);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        // Automatically switch the textbook tab's view to match the chapter's language paradigm
        if (chap.chapterUrl.includes('archive.org')) {
            setSelectedBook('c');
        } else {
            setSelectedBook('cpp');
        }
        setIframeKey(Date.now());
        handleTabChange('textbook');
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">👾 C / C++ Systems Mastery Center</h2>
                    <p className="text-xs text-slate-400">Low-level memory optimization models, standard reference directories, and compiler mechanics</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {CC_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Node {selectedChapter.chapter} Focus</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Syllabus Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleJumpToChapter(selectedChapter)} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 Load Textbook Reference Window
                        </button>
                    </div>
                </div>
            )}

            {/* REPLACE THE TEXTBOOK TAB PANEL ENTIRELY INSIDE CCStudyHub */}
{activeTab === 'textbook' && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn text-left">
        {/* Card 1: C Programming Manual */}
        <div className={`p-6 border rounded-2xl flex flex-col justify-between space-y-4 transition-all ${
            selectedBook === 'c' 
                ? 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/5' 
                : 'border-slate-800 bg-slate-900/20'
        }`}>
            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <span className="text-[2xl]">📘</span>
                    <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">C CORE STANDARD</span>
                </div>
                <div>
                    <h3 className="text-base font-black text-white">C Programming: A Modern Approach</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Author: K. N. King (2nd Edition)</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                    The gold standard manual for C89/C99 compilation standards. Master explicit pointer arithmetic, low-level bitwise manipulation, arrays, structures, and direct manual memory allocations via toolchains.
                </p>
                <div className="pt-2">
                    <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-wider block mb-1">Recommended Reading:</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">• Chapter 11: Pointers</span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">• Chapter 12: Arrays & Pointers</span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">• Chapter 17: Dynamic Storage</span>
                    </div>
                </div>
            </div>
            <a 
                href="https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by/mode/2up" 
                target="_blank" 
                rel="noreferrer" 
                onClick={() => setSelectedBook('c')}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
            >
                🚀 OPEN C MANUAL IN NEW TAB ↗
            </a>
        </div>

        {/* Card 2: ISO C++ Core Guidelines */}
        <div className={`p-6 border rounded-2xl flex flex-col justify-between space-y-4 transition-all ${
            selectedBook === 'cpp' 
                ? 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/5' 
                : 'border-slate-800 bg-slate-900/20'
        }`}>
            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <span className="text-[2xl]">🚀</span>
                    <span className="text-[9px] font-mono tracking-widest bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-bold">C++ ISO STANDARD</span>
                </div>
                <div>
                    <h3 className="text-base font-black text-white">ISO C++ Core Guidelines</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Editors: Bjarne Stroustrup & Herb Sutter</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                    The collaborative manual of rules and best practices maintained directly by the creators of C++. Built explicitly to ensure modern, memory-safe code using RAII patterns, smart pointer tracking, and move semantics.
                </p>
                <div className="pt-2">
                    <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider block mb-1">Recommended Reading:</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">• P: Philosophy</span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">• I: Interfaces</span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">• R: Resource Mgmt (RAII)</span>
                    </div>
                </div>
            </div>
            <a 
                href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines" 
                target="_blank" 
                rel="noreferrer" 
                onClick={() => setSelectedBook('cpp')}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
            >
                🚀 OPEN C++ GUIDELINES IN NEW TAB ↗
            </a>
        </div>
    </div>
)}

            {/* VIDEO HUB TAB */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-1">
                            <button onClick={() => setSelectedPlaylist('c')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${selectedPlaylist === 'c' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>👾 Bro Code (C)</button>
                            <button onClick={() => setSelectedPlaylist('cpp')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${selectedPlaylist === 'cpp' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>🧩 TheCherno (C++)</button>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                            <p className="text-[11px] text-slate-400 leading-relaxed">Lecture #1 is mounted directly below as an embedded preview player workspace. To continue tracking sequentially, open the remaining course segments on YouTube:</p>
                            <a href={selectedPlaylist === 'c' ? "https://www.youtube.com/watch?v=87SH2Cn0s9A&list=PLZPZq0r_RZOOj_vR4zJM32SqsSInGMwe" : "https://www.youtube.com/watch?v=18c3MTX0PK0&list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb"} target="_blank" rel="noreferrer" className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black rounded-xl text-xs text-center flex items-center justify-center cursor-pointer shadow-md">
                                ⏭️ PLAY FULL SERIES ON YOUTUBE ↗
                            </a>
                            <a href={selectedPlaylist === 'c' ? "https://youtube.com/playlist?list=PLZPZq0r_RZOOj_vR4zJM32SqsSInGMwe" : "https://youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb"} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800">
                                📂 Open Full Playlist Directory Collection ↗
                            </a>
                        </div>
                    </div>
                    <div className="lg:col-span-8 bg-black border border-slate-800 rounded-2xl aspect-video overflow-hidden shadow-2xl">
                        <iframe width="100%" height="100%" src={selectedPlaylist === 'c' ? "https://www.youtube.com/embed/87SH2Cn0s9A?rel=0" : "https://www.youtube.com/embed/18c3MTX0PK0?rel=0"} title="CC Stream Vector" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">SYSTEM COMPASS MAP</span>
                                <h3 className="text-sm font-black text-white mt-2">cppreference Core Directory</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">Need compiler token specs, Standard Template Library (STL) vector container details, or ISO standards? Access the complete global database guide matrices directly:</p>
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <a href="https://cppreference.com/" target="_blank" rel="noreferrer" className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 text-center flex items-center justify-center gap-1 cursor-pointer font-mono" >
                                    🔗 EXPLORE FULL CPPREFERENCE API ↗
                                </a>
                                <a href="https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines" target="_blank" rel="noreferrer" className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-400 font-mono text-center flex items-center justify-center gap-1 cursor-pointer" >
                                    🛡️ ISO C++ Core Style Guidelines ↗
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 px-4">
                        <span className="text-3xl block">📋</span>
                        <h4 className="text-xs font-bold text-slate-300 mt-2">Local Reference Arrays Synced</h4>
                        <p className="text-[11px] max-w-xs mx-auto text-slate-500 mt-1 leading-normal">Use the amber dashboard widget to explore standard language specifications across hundreds of library interfaces directly in safe new windows.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENT: SOFTWARE ENGINEERING LEARNING CONSOLE 
// ============================================================================
const SESHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_se_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(SE_CURRICULUM[0]);
    const [cheatSection, setCheatSection] = useState('principles'); // 'principles', 'agile', 'testing'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_se_tab', tabId);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        handleTabChange('textbook');
    };

    const SE_CHEAT_DATA = {
        principles: [
            {
                title: "SOLID Architecture Cheat Framework",
                desc: "Quick structural rules of thumb to guarantee highly decoupled, extendable class instances.",
                code: `[S] Single Responsibility -> A class should have exactly one reason to change.\n[O] Open-Closed        -> Open for abstraction extension, closed for modification.\n[L] Liskov Substitution-> Subtypes must be perfectly substitutable for base types.\n[I] Interface Segreg.  -> Favor thin, client-specific interfaces over massive ones.\n[D] Dependency Invers. -> Depend on abstractions, never on concrete implementations.`
            }
        ],
        agile: [
            {
                title: "Scrum & Sprint Execution Matrix",
                desc: "Standard metrics and lifecycle loops governing agile product delivery pipelines.",
                code: `• Sprint Duration  : 1 to 4 Weeks (Typically locked at 2 weeks).\n• Daily Standup    : 15 minutes strict timebox tracking blockers.\n• Velocity Calculation : Sum of story points completed during a sprint.\n• Core Roles       : Product Owner (What), Scrum Master (Process), Dev Team (How).`
            }
        ],
        testing: [
            {
                title: "Automated Verification Strategies",
                desc: "Differentiating between functional testing layers during integration gates.",
                code: `# TDD Cycle Pattern\n1. Write a failing structural unit test.\n2. Write minimal source logic to pass the target test frame.\n3. Refactor syntax while keeping all test bars strictly green.`
            }
        ]
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">🏗️ Software Engineering Design Console</h2>
                    <p className="text-xs text-slate-400">System architecture paradigms, agile development loops, patterns, and quality gates</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {SE_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Lifecycle Coordinate {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Design Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('textbook')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 View Academic Resource Deck
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - HIGH PERFORMANCE PROFILE VIEW */}
            {activeTab === 'textbook' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto">
                    <div className="p-6 border border-rose-500 bg-rose-500/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">📚</span>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">SE BOOK PROJECT</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Software Engineering (Online Edition)</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Author: Ivan Marsic / Rutgers University</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                An exhaustive architectural handbook analyzing real-world software engineering processes. Master requirements mapping engineering matrices, interface abstractions, object design structures, and regression validation pipelines safely.
                            </p>
                        </div>
                        <a 
                            href="https://softengbook.org/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                        >
                            🚀 OPEN OFFICIAL TEXTBOOK SITE ↗
                        </a>
                    </div>
                </div>
            )}

{/* REPLACE THE VIDEOS TAB COMPONENT BLOCKS ENTIRELY INSIDE YOUR SESHub Component */}
{activeTab === 'videos' && (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
        <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div>
                    <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                        🎥 Gate Smashers SE Track
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        Comprehensive lecture tracks covering software engineering lifecycle requirements, structural testing models, metrics, and quality gates.
                    </p>
                </div>
                {/* UPDATE ONLY THE BUTTON CONTAINER INSIDE YOUR SESHub VIDEOS TAB */}
<div className="space-y-2">
    <a 
    href="https://www.youtube.com/watch?v=kcvEiMFOcoE&list=PLxCzCOWd7aiEed7SKZBnC6ypFDWYLRvB2"
    target="_blank"
    rel="noreferrer"
    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
>
    ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
</a>
    <a 
        href="https://www.youtube.com/playlist?list=PLxCzCOWd7aiEed7SKZBnC6ypFDWYLRvB2"
        target="_blank"
        rel="noreferrer"
        className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800 hover:text-slate-200 transition-colors"
    >
        📂 Open Complete Syllabus Queue ↗
    </a>
</div>
            </div>
        </div>

        {/* Unified High-Performance Embed View Container */}
        <div className="lg:col-span-8 space-y-2">
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/videoseries?list=PLxCzCOWd7aiEed7SKZBnC6ypFDWYLRvB2" 
                    title="Gate Smashers Software Engineering Masterclass" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                />
            </div>
            <p className="text-[10px] font-mono text-slate-500 px-1">
                Showcase Track: Lecture #1 - Core Roadmap Syllabus & Structural Software Engineering Overview
            </p>
        </div>
    </div>
)}

            {/* CHEAT SHEET TAB - VISUALLY PROMINENT GLOWING MATRIX */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">GIST BLUEPRINT REPOSITORY</span>
                                <h3 className="text-sm font-black text-white mt-2">Complete System Design Cheatsheet</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Need quick references on architectural design patterns, software methodologies, UML notation indexes, or system modeling properties? Explore the global developer gist guide here:
                                </p>
                            </div>
                            <a 
                                href="https://gist.github.com/vasanthk/485d1c25737e8e72759f" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                ⚡ ACCESS SYSTEM ARCHITECTURE CHEATSHEET ↗
                            </a>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            {['principles', 'agile', 'testing'].map(sec => (
                                <button key={sec} onClick={() => setCheatSection(sec)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.toUpperCase()} REFERENCE
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {SE_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Parameters'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENT: DBMS MASTER LEARNING ENGINE
// ============================================================================
const DBMSStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_dbms_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(DBMS_CURRICULUM[0]);
    const [cheatSection, setCheatSection] = useState('dml'); // 'dml', 'joins', 'acid'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_dbms_tab', tabId);
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const DBMS_CHEAT_DATA = {
        dml: [
            {
                title: "Core Data Manipulation Queries",
                desc: "Standard transactional statements for updating and filtering table structures.",
                code: `-- Aggregated conditional querying\nSELECT department_id, COUNT(*), AVG(salary)\nFROM team_members\nWHERE status = 'Active'\nGROUP BY department_id\nHAVING AVG(salary) > 65000;\n\n-- Safe multi-row modifications\nUPDATE operational_ledger\nSET classification_tier = 'Premium'\nWHERE cumulative_points >= 5000;`
            }
        ],
        joins: [
            {
                title: "Relational Set Joins",
                desc: "Combining relational schemas across key constraints.",
                code: `-- Standard Inner Join intersection mapping\nSELECT users.username, profiles.avatar_url\nFROM users\nINNER JOIN profiles ON users.id = profiles.user_id;\n\n-- Comprehensive Left Outer Join tracking non-matches\nSELECT store_nodes.name, orders.invoice_id\nFROM store_nodes\nLEFT JOIN orders ON store_nodes.id = orders.node_id\nWHERE orders.invoice_id IS NULL;`
            }
        ],
        acid: [
            {
                title: "Transactional Boundaries & Integrity",
                desc: "Enforcing execution scopes to maintain consistency constraints.",
                code: `START TRANSACTION;\n\nUPDATE accounts SET balance = balance - 2500 WHERE account_id = 101;\nUPDATE accounts SET balance = balance + 2500 WHERE account_id = 202;\n\n-- Safety conditional evaluate checkpoint\n-- If fault occurs: ROLLBACK;\nCOMMIT;`
            }
        ]
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">🗄️ DBMS Relational Design Console</h2>
                    <p className="text-xs text-slate-400">Normalization schemas, transactional concurrency pipelines, and relational algebra engines</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {DBMS_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Coordinate Layer {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Syllabus Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('textbook')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 Load Reference Design Guidelines
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - HIGH PERFORMANCE PROFILE DECK */}
            {activeTab === 'textbook' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto">
                    <div className="p-6 border border-rose-500 bg-rose-500/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">📚</span>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">DATABASE DESIGN SUITE</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Database Design (2nd Edition)</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Author: Adrienne Watt / BCcampus Open Education</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                An exhaustive structural reference manual analyzing data modeling lifecycles. Master entity integrity matrices, relational modeling maps, dependencies, normalization decomposition, and access protection guidelines safely.
                            </p>
                        </div>
                        <a 
                            href="https://opentextbc.ca/dbdesign01/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                        >
                            🚀 OPEN OFFICIAL OPEN-TEXTBOOK SITE ↗
                        </a>
                    </div>
                </div>
            )}

            {/* UPDATE ONLY THE VIDEOS TAB COMPONENT BLOCK INSIDE YOUR DBMSStudyHub */}
{activeTab === 'videos' && (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
        <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div>
                    <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                        🎥 Gate Smashers DBMS Playlist
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        The definitive core tutorial tracking file management limitations, normalization forms, transaction concurrency schedules, and relational parameters.
                    </p>
                </div>
                <div className="space-y-2">
                    <a 
                        href="https://www.youtube.com/watch?v=kBdlM6hNDAE&list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                    >
                        ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
                    </a>
                    <a 
                        href="https://youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800 hover:text-slate-200 transition-colors"
                    >
                        📂 Open Global Course Directory ↗
                    </a>
                </div>
            </div>
        </div>

        <div className="lg:col-span-8 space-y-2">
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/kBdlM6hNDAE?rel=0" 
                    title="Gate Smashers DBMS Course" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen 
                />
            </div>
            <p className="text-[10px] font-mono text-slate-500 px-1">
                Showcase Track: Lecture #1 - Core DBMS Concept Rules & Architectural Target Overviews
            </p>
        </div>
    </div>
)}

            {/* CHEAT SHEET TAB */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        {/* Interactive Cheat Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">DATAQUEST SQL REPOSITORY</span>
                                <h3 className="text-sm font-black text-white mt-2">SQL Language Syntax Manifesto</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Need quick reference blueprints for set joins, grouping operators, view templates, subquery expressions, or indexing constraints? Explore the Dataquest guide layout card here:
                                </p>
                            </div>
                            <a 
                                href="https://www.dataquest.io/cheat-sheet/sql-cheat-sheet/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                ⚡ ACCESS DATAQUEST SQL CHEATSHEET ↗
                            </a>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            {['dml', 'joins', 'acid'].map(sec => (
                                <button key={sec} onClick={() => setCheatSection(sec)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.toUpperCase()} REFERENCE
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {DBMS_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Parameters'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENT: OPERATING SYSTEMS COMPLETE LEARNING CENTER
// ============================================================================
const OSStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_os_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(OS_CURRICULUM[0]);
    const [selectedBook, setSelectedBook] = useState('thinkos'); // 'thinkos' or 'ostep' - Dual textbook tracker
    const [cheatSection, setCheatSection] = useState('processes'); // 'processes', 'scheduling', 'memory'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_os_tab', tabId);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        // Automatically direct textbook tab to the appropriate book index on layout split jump
        if (chap.chapterUrl.includes('thinkos')) {
            setSelectedBook('thinkos');
        } else {
            setSelectedBook('ostep');
        }
        handleTabChange('textbook');
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const OS_CHEAT_DATA = {
        processes: [
            {
                title: "Process Control & Context Boundaries",
                desc: "Standard structural system components and thread isolation metrics.",
                code: `• PCB Context State Pool: [Process ID | Program Counter | Registers | Memory Allocation Info | Open File Handles]\n• Thread Shared Segments: Code block segments, global data definitions, and heap file descriptors.\n• Thread Private Elements: Isolated stack frames, local variables pool, and dedicated program counters.`
            }
        ],
        scheduling: [
            {
                title: "CPU Scheduling Performance Boundary Math",
                desc: "Essential turnaround and waiting time evaluation metrics for core placement tests.",
                code: `• Turnaround Time (TAT) = Completion Time (CT) - Arrival Time (AT)\n• Waiting Time (WT)      = Turnaround Time (TAT) - Burst Time (BT)\n• Response Time (RT)     = First CPU Allocation Time - Arrival Time (AT)`
            }
        ],
        memory: [
            {
                title: "Memory Translation Execution Logic",
                desc: "Tracking physical allocation frames from virtual memory indexes.",
                code: `• Virtual Address Vector  : [ Page Number (p) | Displacement Offset (d) ]\n• Physical Address Vector : [ Frame Number (f) | Displacement Offset (d) ]\n• Page Fault Intercept Loop: Trap to kernel -> Allocate free frame descriptor -> Stream block from disk disk -> Update page table bit mapping -> Retry instruction.`
            }
        ]
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">💻 Operating Systems Kernel Console</h2>
                    <p className="text-xs text-slate-400">Concurrency primitives, process threads context layers, page tables translation, and scheduling arrays</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {OS_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Kernel Thread Node {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Design Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleJumpToChapter(selectedChapter)} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 View Academic Resource Deck
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - DUAL BOOK WORKSPACE PLATFORM */}
            {activeTab === 'textbook' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto flex flex-col space-y-4">
                    {/* Tab Sub-Switcher Toggle Ribbon */}
                    <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-1">
                        <button 
                            type="button"
                            onClick={() => setSelectedBook('thinkos')} 
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedBook === 'thinkos' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            📘 Think OS (Allen Downey)
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedBook('ostep')} 
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedBook === 'ostep' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            🚀 OSTEP (Arpaci-Dusseau)
                        </button>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-rose-500/10 to-red-600/10 border border-rose-500 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between">
                        <div>
                            <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">DETACHED STACK NODE</span>
                            <h3 className="text-sm font-black text-white mt-2">
                                {selectedBook === 'thinkos' ? 'Think OS: A Programmer\'s Introduction' : 'Operating Systems: Three Easy Pieces'}
                            </h3>
                            <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                {selectedBook === 'thinkos' 
                                    ? 'Tracing dynamic memory mapping allocation frameworks, hardware registers, compilation toolchains or bit operations? Launch Allen Downey\'s specialized system architecture guide in an external tab:' 
                                    : 'Mastering the three foundational pillars of engineering: Virtualization, Concurrency, and Persistence? Open the highly rigorous Wisconsin-Madison University manual matrix in a new window:'}
                            </p>
                        </div>
                        <div className="pt-4">
                            <a 
                                href={selectedBook === 'thinkos' ? "https://greenteapress.com/thinkos/thinkos.pdf" : "https://pages.cs.wisc.edu/~remzi/OSTEP/#book-chapters"} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all transform active:scale-95 text-center"
                            >
                                🚀 DETACH MANUAL TO SEPARATE WINDOW ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* VIDEO HUB TAB - ABSOLUTE SYNC WITH NO INDEX DELAYS */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
                            <div>
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    🎥 Gate Smashers OS Playlist
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                    The complete computer science preparation series covering system call logic boundaries, multi-level queue processing, deadlocks prevention, and paging frame maps.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <a 
                                    href="https://www.youtube.com/watch?v=WJ-UaAaumNA&list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                                >
                                    ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
                                </a>
                                <a 
                                    href="https://youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-[10px] text-center flex items-center justify-center cursor-pointer border border-slate-800 hover:text-slate-200 transition-colors"
                                >
                                    📂 Open Complete Syllabus Queue ↗
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/WJ-UaAaumNA?rel=0" 
                                title="Gate Smashers Operating System Track" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen 
                            />
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 px-1">
                            Showcase Track: Lecture #1 - Introduction to Operating Systems Architecture & Core Functionalities
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB - GEEKSFORGEEKS LAST MINUTE HIGHLIGHT MATRIX */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        {/* Interactive Cheat Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-center justify-center font-bold text-amber-400 text-sm animate-pulse">★</div>
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">GFG REPOSITORY INDEX</span>
                                <h3 className="text-sm font-black text-white mt-2">Last Minute Revision Manual</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Need quick reference lookups regarding Belady\'s Anomaly boundaries, critical section synchronization conditions, disk scheduling headers or thrashing indexes? Access the official GeeksforGeeks portal here:
                                </p>
                            </div>
                            <a 
                                href="https://www.geeksforgeeks.org/operating-systems/last-minute-notes-operating-systems/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                ⚡ EXPLORE GFG LAST MINUTE NOTES ↗
                            </a>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            {['processes', 'scheduling', 'memory'].map(sec => (
                                <button key={sec} onClick={() => setCheatSection(sec)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.toUpperCase()} PARAMETERS
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {OS_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Parameters'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENT: SOFT SKILLS & PROFESSIONAL COMMUNICATIONS CONSOLE
// ============================================================================
const SoftSkillsStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_soft_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(SOFTSKILLS_CURRICULUM[0]);
    const [selectedBook, setSelectedBook] = useState('comms'); // 'comms' or 'materials' - Dual Textbook tracker
    const [selectedPlaylist, setSelectedPlaylist] = useState('placement'); // 'placement' or 'workshop' - Dual Video tracker

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_soft_tab', tabId);
    };

    const handleJumpToChapter = (chap) => {
        setSelectedChapter(chap);
        // Sync sub-switcher tracking flags based on curriculum schema targets
        if (chap.chapterUrl.includes('Professional-Communications')) {
            setSelectedBook('comms');
        } else {
            setSelectedBook('materials');
        }
        handleTabChange('textbook');
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">🗣️ Soft Skills & Executive Presence Console</h2>
                    <p className="text-xs text-slate-400">Professional correspondence, interpersonal dynamics, leadership structures, and conflict arbitrage frameworks</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {SOFTSKILLS_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Node {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Presence Vector {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Development Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleJumpToChapter(selectedChapter)} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            Purchase Academic Reference Guide
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - DUAL WORKSPACE DESIGN */}
            {activeTab === 'textbook' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        {/* Sub-tab Switches */}
                        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-1">
                            <button 
                                onClick={() => setSelectedBook('comms')} 
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedBook === 'comms' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                📘 Professional Comms
                            </button>
                            <button 
                                onClick={() => setSelectedBook('materials')} 
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedBook === 'materials' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                🚀 Soft Skills Learning
                            </button>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-rose-500/10 to-red-600/10 border border-rose-500 rounded-2xl space-y-3 shadow-lg flex-1 flex flex-col justify-between">
                            <div>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">DETACHED STACK NODE</span>
                                <h3 className="text-sm font-black text-white mt-2">
                                    {selectedBook === 'comms' ? 'Professional Communications Handbook' : 'Soft Skills Practical Training Framework'}
                                </h3>
                                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                                    {selectedBook === 'comms' 
                                        ? 'Reviewing corporate text formulation methodologies, presentation graphics frameworks, technical document encoding, or active auditory loops? Open eCampusOntario\'s manual compilation in a standalone viewport:' 
                                        : 'Mastering dynamic interpersonal conflict matrix arbitrations, project team collaboration configurations, or professional workspace group ethics parameters? Load the comprehensive training guide safely:'}
                                </p>
                            </div>
                            <div className="pt-4">
                                <a 
                                    href={selectedBook === 'comms' ? "https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/619/12/Professional-Communications-1573849225._print.pdf" : "https://maacce.org/wp-content/uploads/2017/06/Soft-Skills-Learning-Materials.pdf"} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all transform active:scale-95 text-center"
                                >
                                    🚀 OPEN RESOURCE IN NEW TAB ↗
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 p-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl flex flex-col justify-center text-center px-6">
                        <span className="text-3xl block">🔒</span>
                        <h4 className="text-xs font-bold text-slate-300 mt-2">Zero-Lag Document Safety Intercept</h4>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                            To protect your interface execution buffers from parsing deep PDF document trees on the main thread, data channels are routed to dedicated standalone browser viewports. This keeps your background particles running seamlessly.
                        </p>
                    </div>
                </div>
            )}

{/* RESTORED NATIVE INTERACTIVE YOUTUBE INTERFACE WITH CSS TAB MEMORY LAYER */}
{activeTab === 'videos' && (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
        <div className="lg:col-span-4 flex flex-col space-y-4">
            {/* Sub-tab Switcher Ribbon */}
            <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-1">
                <button 
                    onClick={() => setSelectedPlaylist('placement')} 
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${selectedPlaylist === 'placement' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    🎓 Placement Course
                </button>
                <button 
                    onClick={() => setSelectedPlaylist('workshop')} 
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${selectedPlaylist === 'workshop' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    🎯 Master Workshop
                </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                        {selectedPlaylist === 'placement' ? '🎥 Personal Development System' : '🎬 Executive Behavior Analysis'}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        {selectedPlaylist === 'placement' 
                            ? 'Detailed series covering structural job interview protocols, confidence optimization loops, corporate group discussion dynamics, and language presentation cues.' 
                            : 'A comprehensive, high-stakes operational masterclass blueprinting real-world behavioral communication practices, listening patterns, and professional workplace dynamics.'}
                    </p>
                </div>
                <div className="space-y-2 pt-4">
                    <a 
                        href={
                            selectedPlaylist === 'placement' 
                                ? "https://www.youtube.com/playlist?list=PLiObSxAItudLl5_Wf8qW_zlw071C2QaVS" 
                                : "https://www.youtube.com/watch?v=HAnw168huqA"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                    >
                        ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
                    </a>
                </div>
            </div>
        </div>

        {/* Persistent Iframe Frame Stack - Eradicates lag and handles embeds natively */}
        <div className="lg:col-span-8 space-y-2">
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                
                {/* Placement Course View */}
                <div className={`w-full h-full ${selectedPlaylist === 'placement' ? 'block' : 'hidden'}`}>
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/HAnw168huqA?list=PLiObSxAItudLl5_Wf8qW_zlw071C2QaVS" 
                        title="Placement Course Framework" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen 
                    />
                </div>

                {/* Master Workshop View */}
                <div className={`w-full h-full ${selectedPlaylist === 'workshop' ? 'block' : 'hidden'}`}>
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/HAnw168huqA?rel=0" 
                        title="Master Workshop Panel" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen 
                    />
                </div>

            </div>
            <p className="text-[10px] font-mono text-slate-500 px-1">
                {selectedPlaylist === 'placement' 
                    ? 'Showcase Track: Live Playlist Compilation Index - Corporate Soft Skills & Group Discussion Dynamics' 
                    : 'Showcase Track: Standalone Panel - Think Fast, Talk Smart: High-Impact Leadership & Spontaneous Communication'}
            </p>
        </div>
    </div>
)}
        </div>
    );
};

// ============================================================================
// COMPONENT: QUANTITATIVE APTITUDE & REASONING LEARNING CONSOLE
// ============================================================================
const AptitudeStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_apt_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(APTITUDE_CURRICULUM[0]);
    const [cheatSection, setCheatSection] = useState('tricks'); // 'tricks', 'formulas', 'nmat'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_apt_tab', tabId);
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const APT_CHEAT_DATA = {
        tricks: [
            {
                title: "Speed Math & Arithmetic Shortcuts (UGC Portal)",
                desc: "Optimized operational tricks to slash computation times during online tests.",
                code: `• Fast Squares (Ending in 5): (N5)² = [ N * (N + 1) ] consecutive with [ 25 ]\n  Example: 65² = [ 6 * 7 ] [ 25 ] = 4225\n\n• Unit Digit Periodicity / Cyclicity Engine:\n  - [2, 3, 7, 8] replicate in patterns of 4 indices (Divide power by 4, track remainder).\n  - [0, 1, 5, 6] replicate natively on every exponent layer (Cyclicity = 1).\n  - [4, 9] alternate across odd/even exponents (Cyclicity = 2).`
            }
        ],
        formulas: [
            {
                title: "Core Quantitative Framework Relationships (BankExamsToday)",
                desc: "Standard formulas mapping motion mechanics, mixtures, and margins.",
                code: `• Motion Inverse Rule: Speed ratio A:B values imply time duration ratios of B:A.\n• Average Speed Loop: 2xy / (x + y) [When identical forward and backward distance vectors apply].\n• Alligation Balance Equation:\n  (Quantity of Cheaper / Quantity of Dearer) = (Dearer Price - Mean Price) / (Mean Price - Cheaper Price)\n• Compound Interest Value: Amount = Principal * (1 + r/100)^n`
            }
        ],
        nmat: [
            {
                title: "Advanced Permutations & Algebra Matrices (Cracku)",
                desc: "Formulas mapping modern mathematical counting spaces and set boundaries.",
                code: `• Circular Permutations Counting Pattern: Arrangements = (n - 1)!\n• Handshake / Network Edge Formulation: Pairs Count = [ n * (n - 1) ] / 2\n• Set Abstraction Equations:\n  n(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(A ∩ C) + n(A ∩ B ∩ C)`
            }
        ]
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">🧮 Aptitude & Logic Processing Hub</h2>
                    <p className="text Red xs text-slate-400">Quantitative speed mechanics, relational matrices, motion vectors, and multi-variable logical solver engines</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheets' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {APTITUDE_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : item.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Module {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Evaluation Node {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Performance Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('textbook')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 Load Computational Workbook
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - FEEL FREE TO LEARN EXTERNAL HUB */}
            {activeTab === 'textbook' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto">
                    <div className="p-6 border border-rose-500 bg-rose-500/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">📚</span>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">FEEL FREE TO LEARN WORKBOOKS</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Quantitative Aptitude & Reasoning Portals</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Reference Source: FeelFreeToLearn Suite</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Explore hundreds of targeted sample question configurations, interactive testing guidelines, time management strategies, and practice problems designed to master speed math constraints.
                            </p>
                        </div>
                        <a 
                            href="https://feelfreetolearn.com/" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                        >
                            🚀 OPEN FEEL FREE TO LEARN PORTAL ↗
                        </a>
                    </div>
                </div>
            )}

            {/* VIDEO HUB TAB - STABLE NO-DELAY COUPLING SWITCH */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    🎥 FeelFreeToLearn Playlist
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    The definitive quantitative preparation series mapping ages calculations, time speed motion curves, profit metrics, and advanced permutation matrices.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <a 
    href="https://www.youtube.com/playlist?list=PLpyc33gOcbVA4qXMoQ5vmhefTruk5t9lt"
    target="_blank"
    rel="noreferrer"
    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
>
    ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
</a>
                            </div>
                        </div>
                    </div>

                    {/* Embed Frame Block */}
                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/9_k7vS6o8dM?list=PLpyc33gOcbVA4qXMoQ5vmhefTruk5t9lt" 
                                title="Aptitude Preparation Track" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen 
                            />
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 px-1">
                            Showcase Track: Live Playlist Compilation Index - Advanced Quantitative Aptitude Methods
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB - TRIPLE DECK PDF INGESTION POOL */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 space-y-4">
                        {/* Interactive Cheat Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 flex flex-col justify-between">
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">FORMULA MATRIX POOL</span>
                                <h3 className="text-sm font-black text-white mt-2">Comprehensive Mathematical Frameworks</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Direct link channels targeting the raw textbook PDF reference guidelines for quick lookup across any equation family:
                                </p>
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <a href="https://ugcportal.com/raman-files/QT-TRICKS.pdf" target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg flex items-center justify-center font-mono hover:border-slate-700 transition-colors cursor-pointer">
                                    📄 Raman QT Tricks PDF ↗
                                </a>
                                <a href="https://pdf.bankexamstoday.com/raman_files/Quant%20Formula.pdf" target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg flex items-center justify-center font-mono hover:border-slate-700 transition-colors cursor-pointer">
                                    📄 BankExams Quant Formula PDF ↗
                                </a>
                                <a href="https://cracku.in/nmat-formulas-pdf/" target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg flex items-center justify-center font-mono hover:border-slate-700 transition-colors cursor-pointer">
                                    📄 Cracku NMAT Formulas Guide ↗
                                </a>
                            </div>
                        </div>

                        {/* Interactive Switchers */}
                        <div className="space-y-1.5">
                            {[
                                { id: 'tricks', label: '⚡ SHORTCUT TRICKS' },
                                { id: 'formulas', label: '📊 CORE QUANT FORMULAS' },
                                { id: 'nmat', label: '📐 ADVANCED ALGEBRA & SETS' }
                            ].map(sec => (
                                <button key={sec.id} onClick={() => setCheatSection(sec.id)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec.id ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {APT_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Formula Block'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};  

// ============================================================================
// COMPONENT: COMPUTER NETWORKS DESIGN CONSOLE
// ============================================================================
const CNStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_cn_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(NETWORKS_CURRICULUM[0]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('smashers'); // 'smashers' or 'neso' - Dual Video channel tracker
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_cn_tab', tabId);
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const CN_CHEAT_DATA = [
        {
            title: "Transmission Delay & Window Performance Matrices",
            desc: "Essential delay vector models and protocol efficiency relationships.",
            code: `• Transmission Delay (Tt) = Packet Size (L) / Bandwidth (B)\n• Propagation Delay (Tp)  = Distance (d) / Propagation Speed (v)\n• Total Latency Interval   = Tt + 2 * Tp + Queue Delay + Processing Overhead\n• Stop-and-Wait Efficiency = 1 / (1 + 2a) where a = Tp / Tt\n• Sliding Window Bounds   = Max Window Size (Wn) >= 1 + 2a`
        },
        {
            title: "Subnet Segmentation & Classless Inter-Domain Parameters",
            desc: "Quick lookup parameters for Classless network masking mask ranges.",
            code: `• Total Usable Hosts Count = 2^(32 - Subnet Mask Bits) - 2\n• Mask Reference Lookups:\n  - /24 Network Block Mapping = 255.255.255.0  [256 Addresses | 254 Hosts]\n  - /26 Network Block Mapping = 255.255.255.192 [64 Addresses  | 62 Hosts]\n  - /28 Network Block Mapping = 255.255.255.240 [16 Addresses  | 14 Hosts]`
        }
    ];

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">🌐 Computer Networks Protocol Console</h2>
                    <p className="text-xs text-slate-400">Packet switching topologies, subnet masking limits, sliding window flows, and socket connection vectors</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheet' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {NETWORKS_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Ch {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">Routing Node Layer {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Syllabus Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('textbook')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 View Academic Resource Deck
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - SEPARATED WORKSPACE PROCESS COUPLING */}
            {activeTab === 'textbook' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn text-left">
                    <div className="p-6 border border-rose-500 bg-rose-500/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">📚</span>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">VSSUT UNIVERSITY REPOSITORY</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Computer Networks Lecture Manual</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Author: Veer Surendra Sai University Technical Matrix</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                An exhaustive architectural system blueprint exploring signal switching layers, packet collision boundaries, subnet distribution formulas, TCP tracking loops, and network security policies.
                            </p>
                        </div>
                        <a 
                            href="https://www.vssut.ac.in/lecture_notes/lecture1423905560.pdf" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                        >
                            🚀 OPEN UNIVERSITY PORTAL HANDBOOK ↗
                        </a>
                    </div>

                    <div className="p-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl flex flex-col justify-center text-center px-6">
                        <span className="text-3xl block">🔒</span>
                        <h4 className="text-xs font-bold text-slate-300 mt-2">Preventing Core Thread Freezes</h4>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                            To ensure optimal rendering speeds and protect active data buffers from dropping out, deep client-side document hierarchies are isolated straight to native browser windows.
                        </p>
                    </div>
                </div>
            )}

            {/* VIDEO HUB TAB - SEPARATED STACK PATH ROUTING */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        {/* Sub-tab Switches */}
                        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-1">
                            <button 
                                onClick={() => setSelectedPlaylist('smashers')} 
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${selectedPlaylist === 'smashers' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                🎓 Gate Smashers
                            </button>
                            <button 
                                onClick={() => setSelectedPlaylist('neso')} 
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${selectedPlaylist === 'neso' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                🎯 Neso Academy
                            </button>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    {selectedPlaylist === 'smashers' ? '🎥 Gate Smashers Track' : '🎬 Neso Academy Course'}
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {selectedPlaylist === 'smashers' 
                                        ? 'Rigorous exam preparation playlist tracking frame windows, classless IP subnet division lines, Dijkstra routers, and TCP packet windows.' 
                                        : 'In-depth academic breakdown exploring foundational layering laws, network topologies, sliding check protocols, and data link controls.'}
                                </p>
                            </div>
                            <div className="space-y-2 pt-4">
                                <a 
                                    href={selectedPlaylist === 'smashers' ? "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_" : "https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                                >
                                    ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Active Dual Iframe Array */}
                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            
                            {/* Gate Smashers View */}
                            <div className={`w-full h-full ${selectedPlaylist === 'smashers' ? 'block' : 'hidden'}`}>
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src="https://www.youtube.com/embed/videoseries?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_" 
                                    title="Gate Smashers CN Playlist" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen 
                                />
                            </div>

                            {/* Neso Academy View */}
                            <div className={`w-full h-full ${selectedPlaylist === 'neso' ? 'block' : 'hidden'}`}>
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src="https://www.youtube.com/embed/videoseries?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx" 
                                    title="Neso Academy CN Playlist" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen 
                                />
                            </div>

                        </div>
                        <p className="text-[10px] font-mono text-slate-500 px-1">
                            {selectedPlaylist === 'smashers' 
                                ? 'Showcase Track: Complete Series Index - Gate Smashers Computer Networks Sequence' 
                                : 'Showcase Track: Complete Series Index - Neso Academy Computer Networks Engineering'}
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col justify-between">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3">
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">CODING SHUTTLE PIPELINE</span>
                                <h3 className="text-sm font-black text-white mt-2">Ultimate One-Shot Network Manual</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Need core visual graphics tracking packet layers, socket flags mapping tables, connection parameters or subnet splits? Launch Coding Shuttle's breakdown resource deck:
                                </p>
                            </div>
                            <a 
                                href="https://www.codingshuttle.com/blogs/computer-networks-in-one-shot-the-ultimate-cheat-sheet/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 rounded-xl text-xs font-black text-slate-950 tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer font-mono"
                            >
                                ⚡ EXPLORE CODING SHUTTLE CHEATSHEET ↗
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {CN_CHEAT_DATA.map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `cn-cheat-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `cn-cheat-${idx}` ? '✅ Copied!' : '📋 Copy Parameters'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};  

// ============================================================================
// COMPONENT: GIT VERSION CONTROL LEARNING CONSOLE
// ============================================================================
const GitStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_git_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState(GIT_CURRICULUM[0]);
    const [cheatSection, setCheatSection] = useState('local'); // 'local', 'branches', 'remotes'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_git_tab', tabId);
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const GIT_CHEAT_DATA = {
        local: [
            {
                title: "Localized Configuration & File Tracking Snapshots",
                desc: "Initializing local states and moving file entities across indices.",
                code: `# Global configuration setup\ngit config --global user.name "Yagnesh Matam"\ngit config --global user.email "yagnesh@university.edu"\n\n# Snapshot life tracking cycle\ngit init\ngit status\ngit add .\ngit commit -m "feat: integrate foundational core routing architecture"`
            }
        ],
        branches: [
            {
                title: "Branch Divergence & Conflict Resolution Management",
                desc: "Creating isolated pointers and integrating histories.",
                code: `# Creating and shifting branch targets\ngit branch feature-dsa-module\ngit checkout feature-dsa-module\n\n# Shortcut switch and merge execution\ngit checkout -b feature-dbms-layer\ngit checkout main\ngit merge feature-dbms-layer`
            }
        ],
        remotes: [
            {
                title: "Remote Synchronization Pipelines",
                desc: "Linking local historical tracking graphs to remote platforms like GitHub.",
                code: `# Binding remote origin targets\ngit remote add origin https://github.com/yagnesh/prepquest-platform.git\n\n# Synchronizing tracking pointer sets\ngit fetch origin\ngit pull origin main\ngit push -u origin main`
            }
        ]
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">🔧 Git Version Control Console</h2>
                    <p className="text-xs text-slate-400">Distributed snapshots graph management, tree merge parameters, HEAD pointer context tracking, and history amendments</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Mind Map' },
                        { id: 'textbook', label: '📖 Textbook Guide' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Cheat Sheets' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / MIND MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {GIT_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Module {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">VCS Workspace State {selectedChapter.chapter}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Command Focus Nodes:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('textbook')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 View Pro Git Reference Deck
                        </button>
                    </div>
                </div>
            )}

            {/* TEXTBOOK GUIDE TAB - HIGH PERFORMANCE DATA WORKSPACE */}
            {activeTab === 'textbook' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto">
                    <div className="p-6 border border-rose-500 bg-rose-500/5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl">📚</span>
                                <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">THE PRO GIT MANUAL</span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Pro Git (Official 2nd Edition)</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Author: Scott Chacon & Ben Straub / Open Source Manifesto</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                The authoritative, complete training manual mapping internal object structures, packfiles, SHA-1 checksum computations, interactive tree rebasing operations, and global project staging rules.
                            </p>
                        </div>
                        <a 
                            href="https://git-scm.com/book/en/v2" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
                        >
                            🚀 OPEN OFFICIAL PRO GIT MANUAL SITE ↗
                        </a>
                    </div>
                </div>
            )}

            {/* VIDEO HUB TAB - FIXED DIRECT SEARCH TARGETS TO AVOID 5S DELAYS */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    🎥 Amigoscode Masterclass
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    The core version control tutorial tracking tree configuration primitives, commit object histories, push routines, pull requests, and multi-user merge resolutions.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <a 
                                    href="https://www.youtube.com/watch?v=3fUbBnN_H2c"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                                >
                                    ⏭️ LAUNCH FULL COURSE ON YOUTUBE ↗
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Active Embed Block Frame */}
                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/3fUbBnN_H2c?rel=0" 
                                title="Amigoscode Git Course Master" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen 
                            />
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 px-1">
                            Showcase Track: Complete Essentials Tutorial - Distributed Version Control & Core GitHub Dynamics
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB - DUAL OFFICIAL PDF INGESTION PANEL */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3">
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">PDF CODE MANUALS</span>
                                <h3 className="text-sm font-black text-white mt-2">Official Reference Repositories</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Direct access tunnels to download and view the official Git-SCM and GitHub Education syntax layout cards inside a clean view window:
                                </p>
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <a href="https://git-scm.com/cheat-sheet.pdf" target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg flex items-center justify-center font-mono hover:border-slate-700 transition-colors cursor-pointer">
                                    📄 Official Git-SCM PDF Manual ↗
                                </a>
                                <a href="https://education.github.com/git-cheat-sheet-education.pdf" target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg flex items-center justify-center font-mono hover:border-slate-700 transition-colors cursor-pointer">
                                    📄 GitHub Education System PDF ↗
                                </a>
                            </div>
                        </div>

                        {/* Interactive Switchers */}
                        <div className="space-y-1.5 flex-1 justify-end flex flex-col">
                            {[
                                { id: 'local', label: '🔧 LOCAL REPO BASICS' },
                                { id: 'branches', label: '🌿 BRANCHING & MERGES' },
                                { id: 'remotes', label: '🚀 REMOTE WORKSPACES' }
                            ].map(sec => (
                                <button key={sec.id} onClick={() => setCheatSection(sec.id)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec.id ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {GIT_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `${cheatSection}-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `${cheatSection}-${idx}` ? '✅ Copied!' : '📋 Copy Parameters'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENT: INTERVIEW ETIQUETTE MASTER LEARNING MODULE
// ============================================================================
const InterviewEtiquetteStudyHub = ({ theme, onClose }) => {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('prepquest_etiquette_tab') || 'roadmap');
    const [selectedChapter, setSelectedChapter] = useState({ 
        chapter: 1, 
        phase: "Phase 1: Pre-Interview", 
        title: "Tech Setup & Company Research", 
        desc: "Optimizing your environment and understanding your target. Test camera and mic hardware, ensure high-bandwidth network connectivity, study the company's core products, values, and engineering culture, and align your resume highlights accordingly.", 
        difficulty: "Easy", 
        topics: ["Hardware Diagnostics", "Lighting & Framing", "Mission & Values Research", "Resume Mapping"] 
    });
    const [cheatSection, setCheatSection] = useState('dos-donts'); // 'dos-donts' or 'star-framework'
    const [copiedId, setCopiedId] = useState(null);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('prepquest_etiquette_tab', tabId);
    };

    const copyCode = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const ETIQUETTE_CURRICULUM = [
        { chapter: 1, phase: "Phase 1: Pre-Interview", title: "Tech Setup & Company Research", desc: "Optimizing your environment and understanding your target. Test camera and mic hardware, ensure high-bandwidth network connectivity, study the company's core products, values, and engineering culture, and align your resume highlights accordingly.", difficulty: "Easy", topics: ["Hardware Diagnostics", "Lighting & Framing", "Mission & Values Research", "Resume Mapping"] },
        { chapter: 2, phase: "Phase 2: First Impressions", title: "The Initial Handshake & Professional Greeting", desc: "Setting a warm, confident, and professional tone in the first 2 minutes. Focus on clear verbal greetings, upright posture, eye contact (looking directly at the camera), and active, positive listening queues.", difficulty: "Easy", topics: ["Introductory pitch", "Acoustics & Pacing", "Camera Eye Contact", "Active Nodding cues"] },
        { chapter: 3, phase: "Phase 3: Core Interview", title: "The STAR Response Methodology", desc: "Structuring high-impact answers for behavioral and situational questions. Breakdown answers into Situation (context), Task (challenge), Action (your specific contribution), and Result (quantified metrics or key learnings).", difficulty: "Medium", topics: ["Context framing", "Action delineation", "Metrics quantification", "Lessons learned"] },
        { chapter: 4, phase: "Phase 3: Core Interview", title: "Navigating Unknowns & Technical Gaps", desc: "Handling difficult questions gracefully. Do not fabricate answers. Walk the interviewer through your logical thinking, explain what you do know, ask clarifying questions, and highlight your willingness to learn.", difficulty: "Hard", topics: ["Thinking out loud", "Clarifying constraints", "Constructive admission", "Resource references"] },
        { chapter: 5, phase: "Phase 4: Closing", title: "Reverse Interviewing & Follow-up", desc: "Wrapping up the session and showing genuine interest. Ask thoughtful, business-aligned questions at the end, thank the interviewer for their time, and send a concise, personalized thank-you email within 24 hours.", difficulty: "Medium", topics: ["Reverse engineering queries", "Closing statements", "Thank-you protocols", "Feedback resilience"] }
    ];

    const ETIQUETTE_CHEAT_DATA = {
        'dos-donts': [
            { 
                title: "Interview Etiquette: Critical Do's & Don'ts", 
                desc: "High-level rules of engagement during corporate placement rounds.", 
                code: `• DO: Think aloud. Talk through your design process, data structures, and assumptions.\n• DO: Ask clarifying questions about constraints before writing code or proposing solutions.\n• DO: Quantify your results (e.g., 'improved page load by 24%') during project descriptions.\n\n• DON'T: Memorize or recite pre-scripted answers or key terms blindly without understanding.\n• DON'T: Guess or make up technical facts when you don't know the answer.\n• DON'T: Interrupt the interviewer while they are presenting a scenario or giving feedback.` 
            }
        ],
        'star-framework': [
            { 
                title: "The STAR Behavioral Response Template", 
                desc: "A systematic method for answering situational and project-defense queries.", 
                code: `• S - Situation : Set the scene. Give brief context about the project, company, or task.\n• T - Task      : Describe the challenge. What problem needed solving or what was the goal?\n• A - Action    : Detail what YOU did. Focus on your code, design, and decisions, not just the team.\n• R - Result    : Share the outcome. What happened? What did you achieve or learn? Use numbers if possible.` 
            }
        ]
    };

    return (
        <div className="p-6 border border-appGold/30 bg-slate-950/45 text-white rounded-2xl space-y-6">
            {/* Top Bar Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 text-left">
                <div>
                    <button onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer">🡨 Back to Reference Vault</button>
                    <h2 className="text-2xl font-black tracking-wide mt-1">👔 Interview Etiquette Console</h2>
                    <p className="text-xs text-slate-400">Master professional presence, the STAR response framework, handling technical gaps, and reverse interviewing</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {[
                        { id: 'roadmap', label: '🗺️ Stages Map' },
                        { id: 'guides', label: '📖 Etiquette Guides' },
                        { id: 'videos', label: '🎥 Video Hub' },
                        { id: 'cheatsheet', label: '⚡ Quick Reference' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROADMAP / STAGES MAP TAB */}
            {activeTab === 'roadmap' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
                            {ETIQUETTE_CURRICULUM.map((item, idx) => {
                                const isActive = selectedChapter.chapter === item.chapter;
                                return (
                                    <div key={idx} onClick={() => setSelectedChapter(item)} className={`p-4 border rounded-xl text-left cursor-pointer transition-all ${isActive ? 'border-appGold bg-appGold/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}>
                                        <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border transition-all ${isActive ? 'bg-appGold border-appGold shadow-[0_0_10px_#CA8A04]' : 'bg-slate-950 border-slate-800'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">{item.phase}</span>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>{item.difficulty}</span>
                                        </div>
                                        <h4 className="font-bold text-sm mt-1">Stage {item.chapter}: {item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:col-span-5 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-left flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-mono px-2 py-1 bg-appGold/10 border border-appGold/30 text-appGold rounded-md">{selectedChapter.phase}</span>
                            <h3 className="text-lg font-black text-white mt-3">{selectedChapter.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedChapter.desc}</p>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Core Etiquette Focus Areas:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedChapter.topics.map((t, i) => <span key={i} className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">• {t}</span>)}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleTabChange('guides')} className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-xs mt-6 cursor-pointer">
                            📖 Open Technical Academic Workbook
                        </button>
                    </div>
                </div>
            )}

            {/* GUIDES TAB - VERIFIED ACCESSIBLE CAREER RESOURCING */}
            {activeTab === 'guides' && (
                <div className="animate-fadeIn text-left max-w-2xl mx-auto">
                    <div className="p-6 bg-gradient-to-br from-rose-500/10 to-red-600/10 border border-rose-500 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between">
                        <div>
                            <span className="text-[9px] font-mono tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">COMMUNICATION HANDBOOK</span>
                            <h3 className="text-base font-black text-white mt-2">
                                Digital & Behavioral Interviewing Manual
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed mt-2">
                                Reviewing structural conversation models, body language indicators, professional framing, or structured response frameworks? Open the dedicated open-access career guidebook:
                            </p>
                        </div>
                        <div className="pt-4">
                            <a 
                                href="https://www.mcgill.ca/arts-internships/files/arts-internships/summer_2020_workshop_series_1_-_how_to_ace_a_video_interview.pdf" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all transform active:scale-95 text-center"
                            >
                                🚀 DETACH MANUAL TO SEPARATE WINDOW ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* VIDEO HUB TAB - CORRECTED PLACEMENT PLAYLIST BINDING */}
            {activeTab === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider">
                                    🎥 Professional Placement Suite
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    The definitive structural behavioral interview masterclass detailing communication rules, soft skills, structured answering, and engineering confidence.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <a 
                                    href="https://www.youtube.com/playlist?list=PLiObSxAItudLl5_Wf8qW_zlw071C2QaVS" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 transition-all shadow-md"
                                >
                                    ⏭️ LAUNCH FULL SERIES ON YOUTUBE ↗
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-8 space-y-2">
                        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src="https://www.youtube.com/embed/videoseries?list=PLiObSxAItudLl5_Wf8qW_zlw071C2QaVS" 
                                title="Career Prep Course" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen 
                            />
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 px-1">
                            Showcase Track: Live Playlist Compilation Index - Corporate Communication & Behavioral Preparation
                        </p>
                    </div>
                </div>
            )}

            {/* CHEAT SHEET TAB - VERIFIED ACTIVE REPOSITORY ASSETS */}
            {activeTab === 'cheatsheet' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3">
                            <div>
                                <span className="text-[9px] font-mono font-black tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">ARCHITECTURAL DESIGN GUIDES</span>
                                <h3 className="text-sm font-black text-white mt-2">Official Reference Manuals</h3>
                                <p className="text-[11px] text-slate-350 leading-relaxed mt-1">
                                    Direct access tunnels to inspect the raw textbook reference blueprints for behavioral structures and communication templates safely:
                                </p>
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <a 
                                    href="https://cdn.uconnectlabs.com/wp-content/uploads/sites/312/2024/05/STARMethodCheatSheet.pdf" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-full py-2 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg flex items-center justify-center font-mono hover:border-slate-700 transition-colors cursor-pointer"
                                >
                                    📄 Behavioral STAR Guide PDF ↗
                                </a>
                            </div>
                        </div>
                        {/* Switcher ribbon toggles */}
                        <div className="space-y-1.5">
                            {[
                                { id: 'dos-donts', label: '🧩 DO\'S AND DON\'TS MODEL' },
                                { id: 'star-framework', label: '⚡ STAR BEHAVIORAL METHOD' }
                            ].map(sec => (
                                <button key={sec.id} onClick={() => setCheatSection(sec.id)} className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${cheatSection === sec.id ? 'bg-slate-800 border-appGold text-appGold font-black shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                    {sec.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {ETIQUETTE_CHEAT_DATA[cheatSection].map((item, idx) => (
                            <div key={idx} className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-3 relative">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <button onClick={() => copyCode(item.code, `etiquette-cheat-${idx}`)} className="text-[10px] font-mono px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all flex items-center gap-1 border border-slate-700 cursor-pointer">
                                        {copiedId === `etiquette-cheat-${idx}` ? '✅ Copied!' : '📋 Copy Parameter Matrix'}
                                    </button>
                                </div>
                                <pre className="p-4 bg-black/50 border border-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                                    <code>{item.code}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const StudyView = ({ theme }) => {
    const [selectedTopic, setSelectedTopic] = useState(null);

    return (
        <div className="space-y-8 animate-fadeIn text-left">
            <div>
                <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>Study Reference Vault</h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Review structural concepts and coding interview question blueprints across all 12 domains.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STUDY_DATABASE.map((topic, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setSelectedTopic(topic)}
                        className={`p-5 border transition-all rounded-2xl cursor-pointer ${
                            selectedTopic?.title === topic.title
                                ? theme === 'dark'
                                    ? 'border-appGold bg-appGold/10'
                                    : 'border-amber-500 bg-amber-500/10'
                                : theme === 'dark'
                                    ? 'border-white/5 bg-slate-950/45 hover:border-appGold/40 text-white'
                                    : 'border-slate-200 bg-white hover:border-amber-500 text-slate-800'
                        }`}
                    >
                        <span className="text-3xl">{topic.icon}</span>
                        <h3 className={`font-bold text-sm mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{topic.title}</h3>
                        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>Review reference guides</p>
                    </div>
                ))}
            </div>

{/* PLACE THIS CONDITIONAL ROUTE LINK INSIDE YOUR StudyView INTERFACE SWITCHER */}
{selectedTopic && selectedTopic.title === 'Java' ? (
    <JavaStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Python' ? (
    <PythonStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'C/C++' ? (
    <CCStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Software Engineering' ? (
    <SESHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'DSA' ? (
    <DSASudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'DBMS' ? (
    <DBMSStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Operating Systems' ? (
    <OSStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Soft Skills' ? (
    <SoftSkillsStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Aptitude' ? (
    <AptitudeStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Computer Networks' ? (
    <CNStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Git' ? (
    <GitStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && selectedTopic.title === 'Interview Etiquette' ? (
    <InterviewEtiquetteStudyHub theme={theme} onClose={() => handleTopicChange('')} />
) : selectedTopic && (
    
    <div className={`p-6 border rounded-2xl backdrop-blur-xl space-y-4 ${
        theme === 'dark' ? 'border-appGold/30 bg-slate-950/45' : 'border-amber-500/30 bg-white shadow-sm'
    }`}>
        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-appGold' : 'text-amber-600'}`}>{selectedTopic.title} Blueprint</h3>
        <div className="space-y-4">
            {selectedTopic.questions.map((item, qIdx) => (
                <div key={qIdx} className={`p-4 rounded-xl border space-y-2 ${
                    theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-100'
                }`}>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>Q: {item.q}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-650'}`}>{item.a}</p>
                </div>
            ))}
        </div>
    </div>
)}
        </div>
    );
};

// ============================================================================
// PART 4: ADAPTIVE QUIZ CONSOLE (Topic Selection & Real-Time Dynamic AI Generation)
// ============================================================================
const QuizView = ({ theme }) => {
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [quizComplete, setQuizComplete] = useState(false);
    const [loadingAIQuestions, setLoadingAIQuestions] = useState(false);
    const [aiQuestionsError, setAiQuestionsError] = useState('');

    const handleSelectTopic = async (topicName) => {
        setSelectedTopic(topicName);
        setQuizQuestions([]);
        setCurrentIdx(0);
        setScore(0);
        setStreak(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setQuizComplete(false);
        setAiQuestionsError('');
        setLoadingAIQuestions(true);

        try {
            // Call backend endpoint to generate 10 unique quiz questions via Gemini API
            const response = await axios.post(`${API_BASE_URL}/api/dynamic-questions/generate-quiz`, {
                topic: topicName
            });
            
            if (response.data.success && response.data.questions) {
                setQuizQuestions(response.data.questions);
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            console.error("Failed to dynamically build evaluation deck:", error);
            setAiQuestionsError("Quest Node is temporarily congested. Please verify your connection or retry to instantiate a fresh session.");
        } finally {
            setLoadingAIQuestions(false);
        }
    };

    const handleAnswerSelection = (optIdx) => {
        if (answered) return;
        setSelectedAnswer(optIdx);
        setAnswered(true);
        const isCorrect = optIdx === quizQuestions[currentIdx].correct;
        if (isCorrect) {
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }

        setTotalQuestionsAnswered(prev => {
            const newAns = prev + 1;
            const prefix = user ? `user_${user.id}` : 'guest';
            localStorage.setItem(`${prefix}_totalQuestionsAnswered`, newAns.toString());
            return newAns;
        });

        if (isCorrect) {
            setTotalCorrectAnswers(prev => {
                const newCorr = prev + 1;
                const prefix = user ? `user_${user.id}` : 'guest';
                localStorage.setItem(`${prefix}_totalCorrectAnswers`, newCorr.toString());
                return newCorr;
            });
        }
    };

    const handleNext = () => {
        if (currentIdx + 1 < 10) {
            setAnswered(false);
            setSelectedAnswer(null);
            setCurrentIdx(prev => prev + 1);
        } else {
            setQuizComplete(true);
            setTotalQuizzesTaken(prev => {
                const newVal = prev + 1;
                const prefix = user ? `user_${user.id}` : 'guest';
                localStorage.setItem(`${prefix}_totalQuizzesTaken`, newVal.toString());
                return newVal;
            });
        }
    };

    const handleReset = () => {
        setSelectedTopic(null);
        setQuizQuestions([]);
        setQuizComplete(false);
        setAiQuestionsError('');
    };

    if (!selectedTopic) {
        return (
            <div className="space-y-8 animate-fadeIn text-left">
                <div>
                    <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>Adaptive Quiz Arena</h1>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Choose one of the 12 placement categories below. The AI will generate a unique 10-Question coding evaluation in real-time.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STUDY_DATABASE.map((topic, idx) => (
                        <div 
                            key={idx}
                            onClick={() => handleSelectTopic(topic.title)}
                            className={`p-6 border transition-all rounded-2xl cursor-pointer text-center space-y-2 ${
                                theme === 'dark'
                                    ? 'bg-slate-950/45 border-white/5 hover:border-purple-500'
                                    : 'bg-white border-slate-200 hover:border-purple-600 shadow-sm'
                            }`}
                        >
                            <span className="text-4xl block">{topic.icon}</span>
                            <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{topic.title} Quiz</h3>
                            <button className={`text-xs font-mono font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                Start Dynamic Battle 🚀
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const activeQuestion = quizQuestions[currentIdx];

    return (
        <div className="space-y-8 animate-fadeIn max-w-xl mx-auto text-left">
            <div className={`flex justify-between items-center p-4 border rounded-2xl ${theme === 'dark' ? 'bg-slate-950/45 border-white/5 text-white' : 'bg-white border-slate-250 text-slate-800'}`}>
                <div>
                    <button onClick={handleReset} className={`text-xs font-mono flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-850'}`}>
                        🡨 Exit Topic
                    </button>
                    <p className="text-sm font-bold text-purple-500 mt-1 uppercase tracking-wider">{selectedTopic} Quiz</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <h3 className="text-[10px] text-slate-400 font-mono">Streak</h3>
                        <p className="text-xs font-black text-purple-500">🔥 {streak}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-[10px] text-slate-400 font-mono">Score</h3>
                        <p className="text-xs font-black text-purple-500">{score} PTS</p>
                    </div>
                </div>
            </div>

            {loadingAIQuestions && (
                <div className={`p-12 border rounded-3xl text-center space-y-4 backdrop-blur-xl ${
                    theme === 'dark' ? 'border-purple-500/20 bg-slate-950/45' : 'border-purple-600/20 bg-white'
                }`}>
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-mono text-purple-400 animate-pulse uppercase tracking-widest">
                        [QUEST CONSTRUCTING COGNITIVE BATTLE DECK...]
                    </p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                        We are consulting our global data matrices to generate 10 unique coding and diagnostic logic puzzles on-the-fly.
                    </p>
                </div>
            )}

            {aiQuestionsError && (
                <div className="p-8 border border-rose-500/20 bg-rose-500/5 rounded-3xl text-center space-y-4">
                    <p className="text-sm font-semibold text-rose-450">{aiQuestionsError}</p>
                    <button 
                        onClick={() => handleSelectTopic(selectedTopic)} 
                        className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold"
                    >
                        Retry Connection Sequence
                    </button>
                </div>
            )}

            {!loadingAIQuestions && !aiQuestionsError && quizQuestions.length > 0 && (
                <div className="space-y-6">
                    {!quizComplete ? (
                        <div className={`p-8 border rounded-3xl backdrop-blur-xl space-y-6 ${
                            theme === 'dark' ? 'border-purple-500/30 bg-slate-950/45' : 'border-purple-600/30 bg-white shadow-sm'
                        }`}>
                            <div>
                                <div className="flex justify-between items-center text-[10px] font-mono text-purple-500 uppercase">
                                    <span>Question {currentIdx + 1} / 10</span>
                                    <span>Progress: {Math.round(((currentIdx + 1) / 10) * 100)}%</span>
                                </div>
                                <h2 className={`text-base font-bold mt-3 leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                    {activeQuestion?.q}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {activeQuestion?.options.map((opt, oIdx) => {
                                    let btnStyle = theme === 'dark' 
                                        ? "border-white/5 bg-black/20 hover:border-purple-400/50 text-slate-350" 
                                        : "border-slate-250 bg-slate-50 hover:border-purple-600/50 text-slate-700";
                                    
                                    if (answered) {
                                        if (oIdx === activeQuestion.correct) {
                                            btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-bold";
                                        } else if (oIdx === selectedAnswer) {
                                            btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-500 font-bold";
                                        } else {
                                            btnStyle = theme === 'dark' ? "border-white/5 bg-black/40 opacity-40 text-slate-500" : "border-slate-100 bg-slate-100 opacity-40 text-slate-400";
                                        }
                                    }
                                    return (
                                        <button 
                                            key={oIdx}
                                            onClick={() => handleAnswerSelection(oIdx)}
                                            disabled={answered}
                                            className={`w-full text-left p-4 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                        >
                                            <span>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {answered && (
                                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
                                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-650'}`}>{activeQuestion?.expl}</p>
                                    <button 
                                        onClick={handleNext}
                                        className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-xs"
                                    >
                                        {currentIdx + 1 === 10 ? "Finish Evaluation" : "Next Challenge"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`p-8 border rounded-3xl text-center space-y-6 ${
                            theme === 'dark' ? 'border-emerald-500/30 bg-slate-950/45' : 'border-emerald-600/30 bg-white shadow-sm'
                        }`}>
                            <div>
                                <span className="text-5xl">🏆</span>
                                <h2 className={`text-2xl font-black mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>Evaluation Complete!</h2>
                                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>You've successfully completed the 10-Question {selectedTopic} assessment.</p>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 p-4 rounded-2xl ${theme === 'dark' ? 'bg-black/30' : 'bg-slate-100'}`}>
                                <div>
                                    <p className="text-xs text-slate-450">Total Score</p>
                                    <p className="text-lg font-black text-emerald-500">{score} / 100 PTS</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-450">Accuracy Rate</p>
                                    <p className="text-lg font-black text-emerald-500">{Math.round((score / 100) * 100)}%</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleReset}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest"
                            >
                                Retake Another Topic Quiz
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// PART 5: AI CHAT CONSOLE VIEW
// ============================================================================
const AiChatConsoleView = ({ theme, voice, setTotalInterviewsDone, user }) => {
    const [mode, setMode] = useState(''); // 'company', 'resume'
    const [company, setCompany] = useState('');
    const [topic, setTopic] = useState('');
    const [resumeFocusType, setResumeFocusType] = useState('project');
    const [resumeProjectIndex, setResumeProjectIndex] = useState('random');
    const [resumeText, setResumeText] = useState('');
    const [resumeFileName, setResumeFileName] = useState('');
    const [interviewComponent, setInterviewComponent] = useState('technical');
    const [chatHistory, setChatHistory] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [currentlyTypingIndex, setCurrentlyTypingIndex] = useState(-1);
    const [typedText, setTypedText] = useState('');

    const [showReport, setShowReport] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

    const [loadingTextIndex, setLoadingTextIndex] = useState(0);

    const LOADING_SENTENCES = [
        "[Zephyr is analyzing speech acoustics...]",
        "[Deconstructing syntactic patterns...]",
        "[Evaluating structural complexity...]",
        "[Synthesizing neural vocal response...]",
        "[Cross-referencing technical schema...]",
        "[Formulating adaptive follow-up...]"
    ];

    useEffect(() => {
        let interval;
        if (loading) {
            setLoadingTextIndex(0);
            interval = setInterval(() => {
                setLoadingTextIndex(prev => (prev + 1) % LOADING_SENTENCES.length);
            }, 2000);
        } else {
            setLoadingTextIndex(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);
    
    const [attachedCodeFiles, setAttachedCodeFiles] = useState([]);
    const [codeUploadError, setCodeUploadError] = useState('');
    const [showPasteArea, setShowPasteArea] = useState(false);
    const [pasteFilename, setPasteFilename] = useState('');
    const [pasteCodeContent, setPasteCodeContent] = useState('');
    const [codeDragActive, setCodeDragActive] = useState(false);

    // GitHub link states
    const [githubUrlInput, setGithubUrlInput] = useState('');
    const [showGithubInput, setShowGithubInput] = useState(false);



    const handleLinkGithubRepo = (e) => {
        if (e) e.preventDefault();
        const url = githubUrlInput.trim();
        if (!url) return;
        
        let repoName = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
        repoName = repoName.replace(/\/$/, ''); // strip trailing slash
        
        if (attachedCodeFiles.length >= 5) {
            setCodeUploadError("Limit of 5 file/repo attachments exceeded.");
            return;
        }
        
        const newFile = {
            name: `github:${repoName}`,
            path: url,
            content: `[Linked GitHub Repository: ${url}. Fully parsed codebase architecture.]`
        };
        
        setAttachedCodeFiles(prev => [...prev, newFile]);
        setGithubUrlInput('');
        setShowGithubInput(false);
        setCodeUploadError('');
    };

    const handleCodeDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setCodeDragActive(true);
        } else if (e.type === "dragleave") {
            setCodeDragActive(false);
        }
    };

    const handleCodeDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCodeDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (e.dataTransfer.files.length + attachedCodeFiles.length > 5) {
                setCodeUploadError("Limit of 5 files exceeded when attaching separately.");
                return;
            }
            processUploadedFilesList(e.dataTransfer.files);
        }
    };

    const handleAddPastedCode = () => {
        if (!pasteCodeContent.trim()) {
            setCodeUploadError("Please paste some code first.");
            return;
        }
        const name = pasteFilename.trim() || `pasted_code_${attachedCodeFiles.length + 1}.txt`;
        const newFile = {
            name: name,
            path: name,
            content: pasteCodeContent.trim().substring(0, 8000)
        };
        if (attachedCodeFiles.length >= 5) {
            setCodeUploadError("Limit of 5 files exceeded.");
            return;
        }
        setAttachedCodeFiles(prev => [...prev, newFile]);
        setPasteFilename('');
        setPasteCodeContent('');
        setShowPasteArea(false);
        setCodeUploadError('');
    };

    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio()); 
    const chatEndRef = useRef(null);
    
    const resumeInputRef = useRef(null);
    const codeFilesInputRef = useRef(null);
    const codeFolderInputRef = useRef(null);

    const executeTransmissionRef = useRef(null);
    const typingAnimFrameRef = useRef(null);
    const typingIntervalRef = useRef(null);
    const shouldListenRef = useRef(false);

    const COMPANIES_DATA = [
        // Big Tech
        { name: 'Google', category: 'Big Tech', glowColor: 'rgba(66, 133, 244, 0.4)', bgGrad: 'from-blue-500/5 to-red-500/5' },
        { name: 'Microsoft', category: 'Big Tech', glowColor: 'rgba(0, 164, 239, 0.4)', bgGrad: 'from-sky-500/5 to-green-500/5' },
        { name: 'Amazon', category: 'Big Tech', glowColor: 'rgba(255, 153, 0, 0.4)', bgGrad: 'from-amber-500/5 to-orange-500/5' },
        { name: 'Apple', category: 'Big Tech', glowColor: 'rgba(136, 136, 136, 0.4)', bgGrad: 'from-slate-500/5 to-zinc-500/5' },
        { name: 'IBM', category: 'Big Tech', glowColor: 'rgba(5, 74, 218, 0.4)', bgGrad: 'from-blue-650/5 to-indigo-650/5' },
        // Consulting & Services
        { name: 'TCS', category: 'Consulting & Services', glowColor: 'rgba(27, 54, 93, 0.4)', bgGrad: 'from-blue-800/5 to-indigo-800/5' },
        { name: 'Infosys', category: 'Consulting & Services', glowColor: 'rgba(0, 124, 195, 0.4)', bgGrad: 'from-blue-500/5 to-sky-500/5' },
        { name: 'Accenture', category: 'Consulting & Services', glowColor: 'rgba(161, 0, 255, 0.4)', bgGrad: 'from-purple-500/5 to-pink-500/5' },
        { name: 'Cognizant', category: 'Consulting & Services', glowColor: 'rgba(0, 51, 160, 0.4)', bgGrad: 'from-teal-500/5 to-blue-500/5' },
        { name: 'Capgemini', category: 'Consulting & Services', glowColor: 'rgba(0, 112, 173, 0.4)', bgGrad: 'from-blue-600/5 to-cyan-600/5' },
        { name: 'Wipro', category: 'Consulting & Services', glowColor: 'rgba(236, 72, 153, 0.4)', bgGrad: 'from-pink-500/5 via-red-500/5 to-blue-500/5' },
        { name: 'Tech Mahindra', category: 'Consulting & Services', glowColor: 'rgba(226, 24, 54, 0.4)', bgGrad: 'from-red-600/5 to-orange-600/5' },
        { name: 'HCL Technologies', category: 'Consulting & Services', glowColor: 'rgba(0, 86, 150, 0.4)', bgGrad: 'from-blue-500/5 to-sky-500/5' },
        { name: 'Genpact', category: 'Consulting & Services', glowColor: 'rgba(0, 82, 155, 0.4)', bgGrad: 'from-emerald-500/5 to-teal-500/5' },
        { name: 'EY', category: 'Consulting & Services', glowColor: 'rgba(255, 230, 0, 0.4)', bgGrad: 'from-yellow-500/5 to-amber-500/5' },
        { name: 'Deloitte', category: 'Consulting & Services', glowColor: 'rgba(134, 188, 37, 0.4)', bgGrad: 'from-green-500/5 to-emerald-500/5' }
    ];

    const CONCEPTS_DATA = [
        { name: 'Java', emoji: '☕', glowColor: 'rgba(235, 126, 36, 0.4)', bgGrad: 'from-orange-500/5 to-amber-500/5' },
        { name: 'Python', emoji: '🐍', glowColor: 'rgba(53, 114, 165, 0.4)', bgGrad: 'from-blue-500/5 to-yellow-500/5' },
        { name: 'C/C++', emoji: '👾', glowColor: 'rgba(0, 89, 156, 0.4)', bgGrad: 'from-blue-600/5 to-sky-500/5' },
        { name: 'Software Engineering', emoji: '🏗️', glowColor: 'rgba(122, 82, 195, 0.4)', bgGrad: 'from-purple-500/5 to-pink-500/5' },
        { name: 'DSA', emoji: '📊', glowColor: 'rgba(30, 190, 160, 0.4)', bgGrad: 'from-teal-500/5 to-emerald-500/5' },
        { name: 'DBMS', emoji: '💽', glowColor: 'rgba(0, 120, 215, 0.4)', bgGrad: 'from-blue-500/5 to-cyan-500/5' },
        { name: 'Operating Systems', emoji: '🖥️', glowColor: 'rgba(161, 0, 255, 0.4)', bgGrad: 'from-purple-650/5 to-indigo-650/5' },
        { name: 'Soft Skills', emoji: '🗣️', glowColor: 'rgba(236, 72, 153, 0.4)', bgGrad: 'from-pink-500/5 to-rose-500/5' },
        { name: 'Aptitude', emoji: '🧮', glowColor: 'rgba(255, 153, 0, 0.4)', bgGrad: 'from-amber-500/5 to-orange-500/5' },
        { name: 'Computer Networks', emoji: '🌐', glowColor: 'rgba(66, 133, 244, 0.4)', bgGrad: 'from-blue-500/5 to-indigo-500/5' },
        { name: 'Git', emoji: '🔀', glowColor: 'rgba(240, 80, 50, 0.4)', bgGrad: 'from-red-500/5 to-orange-500/5' },
        { name: 'OOPs', emoji: '🧩', glowColor: 'rgba(16, 185, 129, 0.4)', bgGrad: 'from-emerald-500/5 to-teal-500/5' }
    ];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, loading]);

    useEffect(() => {
        executeTransmissionRef.current = executeTransmission;
    });

    // Audio playing state synchronization
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handlePlay = () => setIsPlayingAudio(true);
            const handlePause = () => setIsPlayingAudio(false);
            const handleEnded = () => setIsPlayingAudio(false);

            audio.addEventListener('play', handlePlay);
            audio.addEventListener('pause', handlePause);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('play', handlePlay);
                audio.removeEventListener('pause', handlePause);
                audio.removeEventListener('ended', handleEnded);
            };
        }
    }, []);

    // 100% UNINTERRUPTED SPEECH ENGINE SETUP (Ensures single listener instance binds cleanly)
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            let finalTranscript = '';

            rec.onstart = () => {
                setIsListening(true);
                finalTranscript = '';
            };
            rec.onend = () => {
                setIsListening(false);
                if (shouldListenRef.current) {
                    try {
                        rec.start();
                    } catch (e) {
                        console.error("Auto-restart mic failed:", e);
                    }
                }
            };
            rec.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                const currentText = (finalTranscript + interimTranscript).trim();
                setUserInput(currentText);
            };
            recognitionRef.current = rec;
        }

        return () => {
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                } catch(err) {}
            }
        };
    }, []);

    const primeAudio = () => {
        try {
            audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            audioRef.current.play().catch(() => {});
        } catch (e) {
            console.error("Audio priming exception:", e);
        }
    };

    const startTypewriterFallback = (text, index) => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        setCurrentlyTypingIndex(index);
        setTypedText("");

        const words = text.split(" ");
        let currentCount = 0;
        typingIntervalRef.current = setInterval(() => {
            currentCount += 1;
            if (currentCount >= words.length) {
                setTypedText(text);
                setCurrentlyTypingIndex(-1);
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
            } else {
                setTypedText(words.slice(0, currentCount).join(" "));
            }
        }, 150);
    };

    const skipVoiceAndTyping = () => {
        // Clear listeners first to prevent async onerror/onended triggers
        if (audioRef.current) {
            try {
                audioRef.current.onloadedmetadata = null;
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
                audioRef.current.pause();
                audioRef.current.src = "";
            } catch (e) {}
        }
        setIsPlayingAudio(false);

        // Cancel animations
        if (typingAnimFrameRef.current) {
            cancelAnimationFrame(typingAnimFrameRef.current);
            typingAnimFrameRef.current = null;
        }
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }

        // Set typing index to -1 to show full message immediately
        setCurrentlyTypingIndex(-1);
    };

    const startTypingEffect = (index, text, audioBase64) => {
        if (typingAnimFrameRef.current) {
            cancelAnimationFrame(typingAnimFrameRef.current);
            typingAnimFrameRef.current = null;
        }
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }

        // Interrupt any current audio playback immediately and clear previous listeners
        const audio = audioRef.current;
        if (audio) {
            try {
                audio.pause();
            } catch (e) {}
            audio.onloadedmetadata = null;
            audio.onended = null;
            audio.onerror = null;
        }

        setCurrentlyTypingIndex(index);
        setTypedText("");

        if (audioBase64) {
            const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;

            // Register new listeners BEFORE setting src to avoid missing metadata load event
            audio.onloadedmetadata = () => {
                const words = text.split(" ");
                
                audio.play().catch(e => {
                    console.error("Audio playback error, falling back to typewriter:", e);
                    if (typingAnimFrameRef.current) {
                        cancelAnimationFrame(typingAnimFrameRef.current);
                        typingAnimFrameRef.current = null;
                    }
                    startTypewriterFallback(text, index);
                });

                const syncTyping = () => {
                    const activeAudio = audioRef.current;
                    if (activeAudio && !activeAudio.paused && !activeAudio.ended && activeAudio.src) {
                        const progress = activeAudio.currentTime / activeAudio.duration;
                        const count = Math.ceil(words.length * progress);
                        setTypedText(words.slice(0, count).join(" "));
                        typingAnimFrameRef.current = requestAnimationFrame(syncTyping);
                    } else if (activeAudio && (activeAudio.ended || !activeAudio.src || activeAudio.paused)) {
                        setTypedText(text);
                        setCurrentlyTypingIndex(-1);
                        typingAnimFrameRef.current = null;
                    }
                };
                typingAnimFrameRef.current = requestAnimationFrame(syncTyping);

                audio.onended = () => {
                    if (typingAnimFrameRef.current) {
                        cancelAnimationFrame(typingAnimFrameRef.current);
                        typingAnimFrameRef.current = null;
                    }
                    setTypedText(text);
                    setCurrentlyTypingIndex(-1);
                };
            };

            audio.onerror = () => {
                console.error("Audio load error, falling back to typewriter");
                startTypewriterFallback(text, index);
            };

            audio.src = audioDataUrl;
        } else {
            startTypewriterFallback(text, index);
        }
    };

    const handleResumeFile = async (file) => {
        if (!file) return;

        setResumeFileName(file.name);
        setCodeUploadError('');
        
        if (file.type === "text/plain" || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setResumeText(event.target.result.substring(0, 15000));
            };
            reader.readAsText(file);
        } else {
            const formData = new FormData();
            formData.append('resume', file);
            try {
                setLoading(true);
                const response = await axios.post(`${API_BASE_URL}/api/resume/parse`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (response.data && response.data.extractedText) {
                    setResumeText(response.data.extractedText.substring(0, 15000));
                    setCodeUploadError('');
                } else {
                    setResumeText("");
                    setCodeUploadError("Unable to extract text from this document. Please use a .txt file or paste your resume text directly below.");
                }
            } catch (err) {
                console.error("Express Resume Parser error:", err);
                setResumeText(""); 
                const backendError = err.response?.data?.error;
                setCodeUploadError(backendError || "Backend PDF parser error. Please start your backend server, upload a .txt file, or paste your resume text directly below.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResumeUpload = (e) => {
        const file = e.target.files[0];
        handleResumeFile(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            handleResumeFile(file);
        }
    };

    const loadMockResume = () => {
        setCodeUploadError('');
        setResumeFileName("mock_engineering_portfolio.pdf");
        setResumeText(`
NAME: Aarav Sharma
ROLE: Senior Full Stack Developer & Open Source Contributor
TECHNOLOGIES: React, TypeScript, Node.js, Python, MongoDB, WebGL, Docker, AWS.
HOBBIES: Chess, Procedural Graphics, High-Performance Computing, Classical Piano.
LEARNING JOURNEY: Self-taught WebGL rendering matrices to build dynamic constellation backdrops; learned Go to write concurrent data pipelines.
COMPETITIONS & MAJOR EVENTS: 
- 1st Place at Smart City Hackathon 2025 (Automated Traffic Mesh Node controller built using React/Python)
- Core Contributor to Rust-based WebAssembly canvas wrappers.
PROJECTS:
1. Cybernetic Particle Morphing Canvas (WebGL/React) - High-fidelity interactive layout transition interface. Started in Jan 2025 to prove S-curve S-damping and physics simulation speeds on mobile browsers.
2. Distributed WebRTC Voice Node (Node.js/Socket.io) - Multi-room bidirectional voice channel pipeline with synchronous audio stream buffers.
        `);
    };

    const processUploadedFilesList = async (filesList) => {
        const filesArray = Array.from(filesList);
        const allowedExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'md', 'txt', 'sql', 'sh', 'ipynb', 'pdf', 'docx'];
        
        const textFiles = filesArray.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return allowedExtensions.includes(ext);
        });

        if (textFiles.length === 0) {
            setCodeUploadError("No supported text, code, or resume files found in selection.");
            return;
        }

        const resolvedFiles = [];
        for (const file of textFiles) {
            const ext = file.name.split('.').pop().toLowerCase();
            let content = "";

            if (ext === 'pdf' || ext === 'docx') {
                const formData = new FormData();
                formData.append('resume', file);
                try {
                    setLoading(true);
                    const response = await axios.post(`${API_BASE_URL}/api/resume/parse`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (response.data && response.data.extractedText) {
                        content = response.data.extractedText;
                    } else {
                        content = `[Empty or unparseable ${ext.toUpperCase()} file: ${file.name}]`;
                    }
                } catch (err) {
                    console.error("PDF/DOCX parser offline:", err);
                    content = `[Parser error reading ${file.name}]`;
                } finally {
                    setLoading(false);
                }
            } else {
                const fileText = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsText(file);
                });

                content = fileText;

                if (ext === 'ipynb') {
                    try {
                        const notebook = JSON.parse(fileText);
                        if (notebook && notebook.cells) {
                            content = notebook.cells
                                .map((cell, cIdx) => {
                                    const type = cell.cell_type;
                                    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
                                    return `[Cell #${cIdx + 1} - ${type.toUpperCase()}]\n${source}`;
                                })
                                .join('\n\n');
                        }
                    } catch (parseErr) {
                        console.warn(`Jupyter Notebook JSON parse failed for ${file.name}.`, parseErr);
                    }
                }
            }

            resolvedFiles.push({
                name: file.name,
                path: file.webkitRelativePath || file.name,
                content: content.substring(0, 8000)
            });
        }

        setAttachedCodeFiles(prev => {
            const combined = [...prev, ...resolvedFiles];
            return combined.slice(0, 10);
        });
        setCodeUploadError('');
    };

    const handleCodeFilesSelected = (e) => {
        const selected = e.target.files;
        if (selected.length + attachedCodeFiles.length > 5) {
            setCodeUploadError("Limit of 5 files exceeded when attaching separately.");
            return;
        }
        processUploadedFilesList(selected);
    };

    const handleCodeFolderSelected = (e) => {
        const selected = e.target.files;
        processUploadedFilesList(selected);
    };

    const removeAttachedCodeFile = (idx) => {
        setAttachedCodeFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleStart = async () => {
        shouldListenRef.current = false;
        if (isListening && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
        }
        primeAudio();
        setLoading(true);
        
        if (mode === 'company') {
            const kickstartText = `Welcome to the Vocal AI Arena. I am Zephyr, your interactive AI interviewer. I see the company you've selected from our platform. To help me tailor this session perfectly to your goals, please tell me: What role are you pursuing, and what is your primary programming language or tech stack? (Feel free to paste your resume or highlight a few key projects as well!)`;
            
            setTypedText("");
            setCurrentlyTypingIndex(0);
            setChatHistory([{ role: 'assistant', content: kickstartText }]);
            
            try {
                const ttsRes = await axios.post(`${API_BASE_URL}/api/ai/tts`, { text: kickstartText, voice: voice });
                startTypingEffect(0, kickstartText, ttsRes.data.audio);
            } catch (err) {
                console.error("Kickstart voice synthesis failed:", err);
                startTypingEffect(0, kickstartText, null);
            } finally {
                setLoading(false);
            }
        } else if (mode === 'concept') {
            const kickstartText = `Welcome to the Vocal AI Arena. I am Zephyr, your technical assessor for the Concept Mastery Round. I see you have selected the topic: "${topic}". We will explore conceptual depth, tricky logical details, code snippets, outputs, filling, and performance optimizations. To get started, please tell me the specific sub-areas you want to test, or just tell me 'Ready' to launch!`;

            setTypedText("");
            setCurrentlyTypingIndex(0);
            setChatHistory([{ role: 'assistant', content: kickstartText }]);

            try {
                const ttsRes = await axios.post(`${API_BASE_URL}/api/ai/tts`, { text: kickstartText, voice: voice });
                startTypingEffect(0, kickstartText, ttsRes.data.audio);
            } catch (err) {
                console.error("Kickstart voice synthesis failed:", err);
                startTypingEffect(0, kickstartText, null);
            } finally {
                setLoading(false);
            }
        } else {
            // Prioritize projects: 70% project, 10% hobby, 10% experience, 10% something_learned
            const dice = Math.random();
            let focus = 'project';
            if (dice < 0.10) {
                focus = 'hobby';
            } else if (dice < 0.20) {
                focus = 'experience';
            } else if (dice < 0.30) {
                focus = 'something_learned';
            }
            
            const indices = ['first', 'second', 'third', 'last', 'random'];
            const idx = indices[Math.floor(Math.random() * indices.length)];

            setResumeFocusType(focus);
            setResumeProjectIndex(idx);

            let dynamicContext = `
The user has initialized a Portfolio Defense interview session.
Parsed Resume details:
"${resumeText}"
 
Core Directives for the AI Interviewer:
1. Conduct yourself as an elite engineering manager.
2. Ask exactly ONE question at a time. Keep responses clear and conversational.
3. **IMPORTANT FLOW**:
   - Immediately ask about a specific project from the candidate's resume (or their hobby/experience/learning path if that focus was randomly selected).
   - If focus is a project, ask the candidate to explain this project and explicitly ask if they can upload the project folder/files or provide a GitHub repository link (mention that this is optional but highly recommended so you can run a deep architectural and code-level audit).
   - Once project files or repos are uploaded/linked, ask detailed questions (how they did specific parts of it, why they used certain logic/technologies/patterns).
   - If you spot any vulnerabilities, bugs, or problems in their code/design, ask indirect questions pointing to those issues so the candidate is guided to understand the problems.
   - At the end of the session, provide a structured feedback report spotting vulnerabilities, bugs, problems, and actionable areas of improvement.
            `;

            const initialPrompt = [{ role: 'user', content: `Hello, I am ready to start my mock interview session. Let's begin.` }];
            setChatHistory(initialPrompt);

            try {
                const res = await axios.post(`${API_BASE_URL}/api/ai/interview-chat`, {
                    company: '',
                    topic: resumeText + "\n" + dynamicContext,
                    chatHistory: initialPrompt,
                    component: interviewComponent,
                    isCompanyMode: false,
                    isConceptMode: false,
                    isResumeMode: true,
                    resumeFocusType: focus,
                    resumeProjectIndex: idx,
                    voice: voice
                });

                const newHistory = [...initialPrompt, { role: 'assistant', content: res.data.reply }];
                setTypedText("");
                setCurrentlyTypingIndex(newHistory.length - 1);
                setChatHistory(newHistory);
                startTypingEffect(newHistory.length - 1, res.data.reply, res.data.audio);
            } catch (err) {
                console.error("Session initialize failed:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const executeTransmission = async (text) => {
        if (loading) return;
        
        // Interrupt ongoing voice/typing
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.src = "";
            } catch(e) {}
        }
        if (typingAnimFrameRef.current) {
            cancelAnimationFrame(typingAnimFrameRef.current);
            typingAnimFrameRef.current = null;
        }
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        setCurrentlyTypingIndex(-1);

        // Stop microphone recording upon transmission
        shouldListenRef.current = false;
        if (isListening && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
        }

        primeAudio();
        setLoading(true);

        let userMessagePayload = text;
        
        if (attachedCodeFiles.length > 0) {
            const filesContext = attachedCodeFiles.map(file => `
=== FILE: ${file.name} (Path: ${file.path}) ===
\`\`\`
${file.content}
\`\`\`
            `).join('\n\n');

            userMessagePayload += `\n\n[SYSTEM ENHANCEMENT: User has attached files for review:\n${filesContext}\nAnalyze these files in detail and ask highly specific questions about them (whether code files, documents, or resumes)!]`;
            setAttachedCodeFiles([]);
        }

        const updatedHistory = [...chatHistory, { role: 'user', content: userMessagePayload }];
        const uiHistory = [...chatHistory, { role: 'user', content: text }];
        setChatHistory(uiHistory);
        setUserInput('');

        try {
            const res = await axios.post(`${API_BASE_URL}/api/ai/interview-chat`, {
                company: mode === 'company' ? company : '',
                topic: mode === 'resume' ? resumeText : topic,
                chatHistory: updatedHistory,
                component: interviewComponent,
                isCompanyMode: mode === 'company',
                isConceptMode: mode === 'concept',
                isResumeMode: mode === 'resume',
                resumeFocusType: mode === 'resume' ? resumeFocusType : '',
                resumeProjectIndex: mode === 'resume' ? resumeProjectIndex : '',
                voice: voice
            });

            const newHistory = [...uiHistory, { role: 'assistant', content: res.data.reply }];
            setTypedText("");
            setCurrentlyTypingIndex(newHistory.length - 1);
            setChatHistory(newHistory);
            startTypingEffect(newHistory.length - 1, res.data.reply, res.data.audio);
        } catch (err) {
            console.error("Transmission failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const concludeSessionAndEvaluate = async () => {
        // Stop audio & typing
        skipVoiceAndTyping();

        // Increment interviews count
        setTotalInterviewsDone(prev => {
            const newVal = prev + 1;
            const prefix = user ? `user_${user.id}` : 'guest';
            localStorage.setItem(`${prefix}_totalInterviewsDone`, newVal.toString());
            return newVal;
        });

        setGeneratingReport(true);
        setShowReport(true);

        try {
            // Append system message to chat history to force immediate evaluation
            const finalSystemMessage = { 
                role: 'user', 
                content: "[SYSTEM: Candidate requested to conclude the interview. Please generate the structured feedback report immediately.]" 
            };
            const updatedHistory = [...chatHistory, finalSystemMessage];

            const res = await axios.post(`${API_BASE_URL}/api/ai/interview-chat`, {
                company: mode === 'company' ? company : '',
                topic: mode === 'resume' ? resumeText : topic,
                chatHistory: updatedHistory,
                component: interviewComponent,
                isCompanyMode: mode === 'company',
                isConceptMode: mode === 'concept',
                isResumeMode: mode === 'resume',
                resumeFocusType: mode === 'resume' ? resumeFocusType : '',
                resumeProjectIndex: mode === 'resume' ? resumeProjectIndex : '',
                voice: voice
            });

            if (res.data && res.data.reply) {
                setReportContent(res.data.reply);
            } else {
                throw new Error("Invalid reply format");
            }
        } catch (err) {
            console.error("Failed to generate audit report:", err);
            // Local fallback feedback generator if backend call fails or timeout occurs
            const wordCount = chatHistory.filter(m => m.role === 'user').reduce((acc, m) => acc + m.content.split(" ").length, 0);
            const turns = chatHistory.filter(m => m.role === 'user').length;
            const avgLen = turns > 0 ? Math.round(wordCount / turns) : 0;
            
            let confidenceFeedback = "Moderate response length. Try to expand answers using technical examples.";
            if (avgLen > 30) confidenceFeedback = "Excellent elaboration! You express concepts confidently with sufficient detail.";
            else if (avgLen < 12) confidenceFeedback = "Response length is brief. Aim to detail your responses to demonstrate deep knowledge.";

            let skillFeedback = "Technical accuracy shows promise. Ensure you detail edge cases and system design trade-offs.";
            if (turns >= 3) skillFeedback = "Strong technical coverage. You successfully navigated intermediate follow-up questions.";

            setReportContent(`
# INTERVIEW FEEDBACK & DIAGNOSTIC REPORT

### 📊 Performance Summary
* **Vocal Communication & Confidence**: ${confidenceFeedback}
* **Technical & Coding Depth**: ${skillFeedback}
* **Cognitive Pacing**: Average response length is ${avgLen} words over ${turns} conversational turns.

### 💡 Preparation Recommendations
1. **STAR Method**: Ensure every behavioral response contains a clear Situation, Task, Action, and Result.
2. **System Design**: Practice detailing architectural tradeoffs (e.g. read/write speeds, memory consumption).
3. **Study Materials**: Review the relevant study guides in the **Study Portal** for technical core topics.
            `);
        } finally {
            setGeneratingReport(false);
        }
    };

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        primeAudio();
        if (isListening) {
            shouldListenRef.current = false;
            recognitionRef.current.stop();
        } else {
            shouldListenRef.current = true;
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Mic start error:", e);
            }
        }
    };

    const renderCompanyLogo = (name) => {
        switch (name) {
            case 'Google':
                return (
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                );
            case 'Microsoft':
                return (
                    <svg viewBox="0 0 23 23" className="w-6 h-6">
                        <rect x="0" y="0" width="11" height="11" fill="#F25022"/>
                        <rect x="12" y="0" width="11" height="11" fill="#7FBA00"/>
                        <rect x="0" y="12" width="11" height="11" fill="#00A4EF"/>
                        <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
                    </svg>
                );
            case 'Amazon':
                return (
                    <div className="flex flex-col items-center">
                        <span className="font-sans font-black text-sm text-slate-800 dark:text-slate-200 leading-none">amazon</span>
                        <svg viewBox="0 0 40 10" className="w-10 h-3">
                            <path d="M2 2c8 5 28 5 36 0" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" fill="none"/>
                            <path d="M35 1l3 1-1 3" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                    </div>
                );
            case 'Apple':
                return (
                    <svg viewBox="0 0 170 170" className="w-7 h-7" fill="currentColor">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.04-1.88-14.12-6.02-3.69-3.03-7.53-7.71-11.53-14.03-8.5-13.62-14.74-29.39-18.72-47.32-4.04-18.23-2.02-33.8 6.07-46.73 4.21-6.72 9.77-12.01 16.66-15.86 6.9-3.87 14.17-5.87 21.84-6.02 4.41 0 9.29 1.21 14.65 3.63 5.35 2.42 9.04 3.62 11.06 3.62 1.76 0 5.25-1.16 10.45-3.48 5.2-2.33 9.94-3.41 14.22-3.23 15.42.75 27.23 6.44 35.43 17.07-12.7 7.7-18.9 18.06-18.6 31.06.3 10.19 4.14 18.73 11.53 25.62 7.39 6.89 16.03 10.6 25.92 11.13-2.01 5.9-4.8 11.75-8.37 17.56zM120.19 14.14c0-7.85 2.82-15.04 8.46-21.57A33.15 33.15 0 0 1 152 2.1c.14.9.21 1.7.21 2.42 0 7.64-2.89 14.79-8.68 21.43-5.78 6.64-13.06 10.87-21.84 10.32a32 32 0 0 1-1.5-12.13z" />
                    </svg>
                );
            case 'IBM':
                return (
                    <svg viewBox="0 0 24 12" className="w-10 h-5">
                        <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fontWeight="950" letterSpacing="-0.5" fill="#006699" fontFamily="monospace">IBM</text>
                        <line x1="0" y1="1" x2="24" y2="1" stroke={theme === 'dark' ? '#0b0f19' : '#ffffff'} strokeWidth="0.5" />
                        <line x1="0" y1="3" x2="24" y2="3" stroke={theme === 'dark' ? '#0b0f19' : '#ffffff'} strokeWidth="0.5" />
                        <line x1="0" y1="5" x2="24" y2="5" stroke={theme === 'dark' ? '#0b0f19' : '#ffffff'} strokeWidth="0.5" />
                        <line x1="0" y1="7" x2="24" y2="7" stroke={theme === 'dark' ? '#0b0f19' : '#ffffff'} strokeWidth="0.5" />
                        <line x1="0" y1="9" x2="24" y2="9" stroke={theme === 'dark' ? '#0b0f19' : '#ffffff'} strokeWidth="0.5" />
                        <line x1="0" y1="11" x2="24" y2="11" stroke={theme === 'dark' ? '#0b0f19' : '#ffffff'} strokeWidth="0.5" />
                    </svg>
                );
            case 'TCS':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-405 font-bold text-xs tracking-tighter">
                        TCS
                    </div>
                );
            case 'Infosys':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-900/40 border border-sky-500/30 text-sky-404 font-bold text-xs">
                        Infy
                    </div>
                );
            case 'Accenture':
                return (
                    <div className="flex items-center gap-0.5">
                        <span className="font-sans font-black text-sm text-slate-800 dark:text-slate-200">accenture</span>
                        <span className="text-purple-500 font-bold text-sm">{`>`}</span>
                    </div>
                );
            case 'Cognizant':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-900/40 border border-teal-500/30 text-teal-404 font-bold text-xs">
                        CTS
                    </div>
                );
            case 'Capgemini':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-950/60 border border-blue-600/30 text-blue-404 font-bold text-xs">
                        CAP
                    </div>
                );
            case 'Wipro':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-500/30 text-pink-404 font-bold text-xs">
                        WIT
                    </div>
                );
            case 'Tech Mahindra':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-900/40 border border-red-500/30 text-red-404 font-bold text-[10px]">
                        TECHM
                    </div>
                );
            case 'HCL Technologies':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-900/40 border border-sky-500/30 text-sky-404 font-bold text-xs">
                        HCL
                    </div>
                );
            case 'Genpact':
                return (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-404 font-bold text-xs">
                        GEN
                    </div>
                );
            case 'EY':
                return (
                    <div className="flex items-center gap-0.5">
                        <span className="font-sans font-black text-sm text-slate-800 dark:text-slate-200">EY</span>
                        <span className="text-[#FFE600] font-black text-xs">🡥</span>
                    </div>
                );
            case 'Deloitte':
                return (
                    <div className="flex items-end gap-0.5">
                        <span className="font-sans font-black text-sm text-slate-800 dark:text-slate-200 tracking-tight leading-none">Deloitte</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#86BC25] mb-0.5"></span>
                    </div>
                );
            default:
                const abbr = name.length > 5 ? name.substring(0, 3).toUpperCase() : name.toUpperCase();
                return (
                    <div className="font-black text-xs font-mono tracking-wider opacity-90">
                        {abbr}
                    </div>
                );
        }
    };

    const renderMessageContent = (content) => {
        if (!content) return null;
        
        const cleanContent = content.includes('[SYSTEM ENHANCEMENT:') 
            ? content.split('[SYSTEM ENHANCEMENT:')[0] 
            : content;

        const parts = cleanContent.split(/(```[\s\S]*?```)/g);
        
        return parts.map((part, pIdx) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const rawBlock = part.slice(3, -3).trim();
                const firstLineBreak = rawBlock.indexOf('\n');
                let language = '';
                let code = rawBlock;
                
                if (firstLineBreak !== -1) {
                    language = rawBlock.substring(0, firstLineBreak).trim().toLowerCase();
                    code = rawBlock.substring(firstLineBreak + 1);
                }
                
                if ((language === 'xml' || language === 'svg' || language === 'html') && code.trim().startsWith('<svg')) {
                    return (
                        <div 
                            key={pIdx} 
                            className="my-3 p-2 bg-white rounded-xl border border-slate-200 overflow-x-auto flex justify-center shadow-inner" 
                            dangerouslySetInnerHTML={{ __html: code }} 
                        />
                    );
                }
                
                return (
                    <pre key={pIdx} className={`font-mono text-[10px] my-2.5 p-3 rounded-xl overflow-x-auto border whitespace-pre scrollbar-thin ${
                        theme === 'dark' 
                            ? 'bg-black/40 border-white/5 text-cyan-350' 
                            : 'bg-slate-900 text-slate-100 border-slate-800'
                    }`}>
                        <code>{code}</code>
                    </pre>
                );
            }
            
            return (
                <span key={pIdx} className="whitespace-pre-line">
                    {part}
                </span>
            );
        });
    };

    const isWaveActive = loading || isListening || isPlayingAudio;

    const renderChatPanel = (panelHeightClass = "h-[560px]") => {
        return (
            <div className={`flex flex-col ${panelHeightClass} justify-between w-full`}>
                {/* Header bar during active sessions with Pulsing Wave Visualizer */}
                <div className={`flex justify-between items-center pb-4 mb-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full bg-cyan-500 ${loading ? 'animate-ping' : 'animate-pulse'}`} />
                        <div>
                            <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {mode === 'company' ? `${company} Placement` : mode === 'concept' ? `${topic} Mastery` : 'Portfolio Defense'}
                            </h3>
                            <p className="text-[9px] font-mono text-slate-550">INTERVIEWER: ZEPHYR AI</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (window.confirm("Conclude this mock interview session and save progress?")) {
                                    concludeSessionAndEvaluate();
                                }
                            }}
                            className={`px-3 py-1 text-[10px] font-mono rounded-lg border uppercase tracking-wider font-bold transition-all cursor-pointer ${
                                theme === 'dark'
                                    ? 'bg-[#1a0f12] border-rose-500/30 text-rose-455 hover:bg-rose-900/30'
                                    : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            }`}
                        >
                            🏁 End Session
                        </button>
                        
                        <div className="flex items-end gap-[3px] h-6 px-2">
                            <span className={`w-[3px] bg-cyan-500 rounded-full transition-all duration-300 ${isWaveActive ? 'audio-bar-pulse-1' : 'h-1.5'}`} />
                            <span className={`w-[3px] bg-cyan-500 rounded-full transition-all duration-300 ${isWaveActive ? 'audio-bar-pulse-2' : 'h-2.5'}`} />
                            <span className={`w-[3px] bg-cyan-500 rounded-full transition-all duration-300 ${isWaveActive ? 'audio-bar-pulse-3' : 'h-1.5'}`} />
                            <span className={`w-[3px] bg-cyan-500 rounded-full transition-all duration-300 ${isWaveActive ? 'audio-bar-pulse-4' : 'h-2'}`} />
                            <span className={`w-[3px] bg-cyan-500 rounded-full transition-all duration-300 ${isWaveActive ? 'audio-bar-pulse-5' : 'h-1.5'}`} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                    {chatHistory.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        const cleanContent = msg.content.includes('[SYSTEM ENHANCEMENT:') 
                            ? msg.content.split('[SYSTEM ENHANCEMENT:')[0] 
                            : msg.content;
                            
                        return (
                            <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-550 px-1">
                                    {isUser ? 'Candidate' : (mode === 'company' ? 'Zephyr (Assessor)' : mode === 'concept' ? 'Zephyr (Prof)' : 'Interviewer')}
                                </span>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed border transition-all ${
                                    isUser 
                                        ? theme === 'dark'
                                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.03)]' 
                                            : 'bg-cyan-55 border-cyan-200 text-cyan-900 shadow-sm'
                                        : theme === 'dark'
                                            ? 'bg-slate-900/60 border-slate-850 text-slate-200 shadow-sm'
                                            : 'bg-slate-100/80 border-slate-250 text-slate-800 shadow-sm'
                                }`}>
                                    <div className="text-left whitespace-pre-line">
                                        {idx === currentlyTypingIndex 
                                            ? typedText 
                                            : renderMessageContent(msg.content)}
                                        {idx === currentlyTypingIndex && typedText.length < cleanContent.length && (
                                            <>
                                                <span className="inline-block w-[3px] h-[13px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />
                                                <div className="mt-2 pt-1.5 border-t border-cyan-500/10 flex justify-start">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            skipVoiceAndTyping();
                                                        }}
                                                        className="px-2 py-0.5 text-[8px] font-mono rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 tracking-wider uppercase font-black transition-all cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span>⏭️</span> Skip Voice & Typing
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {loading && <p className="text-[10px] font-mono text-cyan-400 animate-pulse">{LOADING_SENTENCES[loadingTextIndex]}</p>}
                    <div ref={chatEndRef} />
                </div>

                {(mode === 'resume' || mode === 'company') && (
                    <div 
                        onDragEnter={handleCodeDrag}
                        onDragOver={handleCodeDrag}
                        onDragLeave={handleCodeDrag}
                        onDrop={handleCodeDrop}
                        className={`p-4 border-t border-b mb-3 mt-3 rounded-xl space-y-3 transition-all ${
                            codeDragActive
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-cyan-500">
                                    {mode === 'resume' ? 'Attach Project Code Files, Folder, or Repos (Optional)' : 'Attach Code or Files (Optional)'}
                                </h4>
                                <p className="text-[8px] text-slate-500 font-mono">
                                    {mode === 'resume' ? 'Provide project files, folders, code context or GitHub link to guide evaluation.' : 'Provide files or folder context to guide the evaluation.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <button 
                                    type="button"
                                    onClick={() => codeFilesInputRef.current.click()}
                                    className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono tracking-widest text-slate-350 transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>📁</span> Files
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => codeFolderInputRef.current.click()}
                                    className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono tracking-widest text-slate-350 transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>📂</span> Folder
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => { setShowPasteArea(prev => !prev); setShowGithubInput(false); }}
                                    className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono tracking-widest text-slate-350 transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>📋</span> Paste Code
                                </button>
                                {mode === 'resume' && (
                                    <button 
                                        type="button"
                                        onClick={() => { setShowGithubInput(prev => !prev); setShowPasteArea(false); }}
                                        className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono tracking-widest text-slate-350 transition-all cursor-pointer flex items-center gap-1 animate-pulse"
                                    >
                                        <span>🔗</span> GitHub
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={codeFilesInputRef}
                                onChange={handleCodeFilesSelected}
                                className="hidden" 
                                multiple
                                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.sql,.ipynb,.pdf,.docx,.txt"
                            />
                            <input 
                                type="file" 
                                ref={codeFolderInputRef}
                                onChange={handleCodeFolderSelected}
                                className="hidden" 
                                directory=""
                                webkitdirectory=""
                            />
                        </div>

                        {showGithubInput && (
                            <div className="flex gap-2 animate-fadeIn">
                                <input 
                                    type="text" 
                                    placeholder="https://github.com/username/project"
                                    value={githubUrlInput}
                                    onChange={(e) => setGithubUrlInput(e.target.value)}
                                    className={`flex-1 p-2 text-[9px] rounded-lg border outline-none font-mono ${theme === 'dark' ? 'bg-black/30 border-white/10 text-slate-200' : 'bg-white border-slate-250 text-slate-800'}`}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleLinkGithubRepo}
                                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-[9px] font-mono cursor-pointer"
                                >
                                    Link
                                </button>
                            </div>
                        )}

                        {showPasteArea && (
                            <div className={`p-3 rounded-lg border space-y-2.5 animate-fadeIn ${theme === 'dark' ? 'bg-black/50 border-white/5' : 'bg-white border-slate-200'}`}>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="filename.js (optional)"
                                        value={pasteFilename}
                                        onChange={(e) => setPasteFilename(e.target.value)}
                                        className={`flex-1 p-2 text-[9px] rounded-lg border outline-none font-mono ${theme === 'dark' ? 'bg-black/30 text-slate-200 border-white/10' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
                                    />
                                </div>
                                <textarea
                                    placeholder="Paste your project code snippet here..."
                                    value={pasteCodeContent}
                                    onChange={(e) => setPasteCodeContent(e.target.value)}
                                    rows={4}
                                    className={`w-full p-2 text-[9px] rounded-lg border outline-none resize-none font-mono ${theme === 'dark' ? 'bg-black/30 text-slate-200 border-white/10' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowPasteArea(false)}
                                        className={`px-3 py-1.5 text-[9px] font-mono rounded-lg border transition-colors ${theme === 'dark' ? 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-850' : 'bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleAddPastedCode}
                                        className="px-3 py-1.5 text-[9px] font-mono rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
                                    >
                                        Add Code Snippet
                                    </button>
                                </div>
                            </div>
                        )}

                        {codeUploadError && <p className="text-[9px] font-mono text-rose-500">{codeUploadError}</p>}

                        {attachedCodeFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                                {attachedCodeFiles.map((file, idx) => (
                                    <div 
                                        key={idx}
                                        className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[9px] font-mono text-cyan-400 flex items-center gap-1.5 animate-fadeIn"
                                    >
                                        <span className="truncate max-w-[120px]">{file.name}</span>
                                        <button 
                                            type="button"
                                            onClick={() => removeAttachedCodeFile(idx)}
                                            className="text-rose-500 hover:text-rose-400 font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 items-center border-t border-white/5 pt-4">
                    <button 
                        onClick={toggleVoice} 
                        className={`p-3 rounded-xl border text-sm cursor-pointer transition-all duration-200 ${isListening ? 'bg-rose-500 border-rose-500 text-white animate-pulse' : 'bg-black border-white/5 text-slate-400 hover:text-slate-200'}`}
                    >
                        {isListening ? '🛑' : '🎙️'}
                    </button>
                    <textarea 
                        rows={1}
                        value={userInput} 
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter' && !e.shiftKey) { 
                                e.preventDefault(); 
                                executeTransmission(userInput); 
                            } 
                        }}
                        placeholder={isListening ? "🎙️ Mic Active: Speak clearly now... Press Mic icon to pause or Send to transmit." : (attachedCodeFiles.length > 0 ? "Press Send to analyze attached files..." : "Type response code, paste resume, or speech...")} 
                        className={`flex-1 p-3 border rounded-xl text-xs outline-none transition-all resize-none max-h-32 overflow-y-auto ${theme === 'dark' ? 'bg-black border-white/5 text-white focus:border-cyan-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500/40'}`}
                    />
                    <button 
                        onClick={() => executeTransmission(userInput)}
                        className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                        {attachedCodeFiles.length > 0 ? "Analyze & Send" : "Send"}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`border rounded-3xl p-8 backdrop-blur-xl min-h-[520px] flex flex-col justify-between transition-all duration-300 text-left ${
            theme === 'dark' ? 'bg-slate-950/45 border-cyan-500/20' : 'bg-white border-slate-250 shadow-sm'
        }`}>
            <style>{`
                @keyframes audio-wave-pulse {
                    0% { height: 6px; }
                    100% { height: 20px; }
                }
                .audio-bar-pulse-1 { animation: audio-wave-pulse 0.4s ease-in-out infinite alternate; }
                .audio-bar-pulse-2 { animation: audio-wave-pulse 0.55s ease-in-out infinite alternate; }
                .audio-bar-pulse-3 { animation: audio-wave-pulse 0.35s ease-in-out infinite alternate; }
                .audio-bar-pulse-4 { animation: audio-wave-pulse 0.48s ease-in-out infinite alternate; }
                .audio-bar-pulse-5 { animation: audio-wave-pulse 0.62s ease-in-out infinite alternate; }
            `}</style>
            
            {showReport ? (
                <div className="space-y-6 w-full animate-fadeIn max-w-3xl mx-auto text-left">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-cyan-400">Mock Interview Diagnostics</h2>
                            <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Zephyr AI Professional Performance Audit</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowReport(false);
                                setReportContent('');
                                setChatHistory([]);
                                setMode('');
                            }}
                            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                                theme === 'dark'
                                    ? 'bg-slate-900 border-white/10 text-white hover:bg-slate-800'
                                    : 'bg-slate-100 border-slate-205 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Start New Session
                        </button>
                    </div>

                    {generatingReport ? (
                        <div className="flex flex-col justify-center items-center py-24 space-y-4">
                            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-mono text-cyan-400 animate-pulse uppercase tracking-widest text-center">
                                Zephyr is parsing interview telemetry & compiling report...
                            </p>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-3xl border text-sm leading-relaxed max-h-[500px] overflow-y-auto scrollbar-thin max-w-2xl mx-auto ${
                            theme === 'dark' 
                                ? 'bg-[#0b0f19] border-white/5 text-slate-300' 
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                            <div className="text-left space-y-5 font-sans">
                                {reportContent.split("\n\n").map((para, pIdx) => {
                                    if (para.startsWith("#")) {
                                        const cleanHeader = para.replace(/#/g, "").trim();
                                        return (
                                            <h3 key={pIdx} className="text-sm font-black tracking-widest text-cyan-400 mt-6 mb-3 uppercase border-b border-cyan-500/10 pb-1.5 flex items-center gap-2">
                                                <span>⚡</span> {cleanHeader}
                                            </h3>
                                        );
                                    }
                                    if (para.startsWith("*") || para.startsWith("-")) {
                                        return (
                                            <ul key={pIdx} className="list-disc pl-5 space-y-2 my-2 text-slate-400">
                                                {para.split("\n").map((li, lIdx) => {
                                                    const cleanLi = li.replace(/^[\*\-]\s*/, "").trim();
                                                    return <li key={lIdx}>{renderMessageContent(cleanLi)}</li>;
                                                })}
                                            </ul>
                                        );
                                    }
                                    return <p key={pIdx} className="leading-relaxed text-[13px]">{renderMessageContent(para)}</p>;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : !chatHistory.length ? (
                <div className="space-y-8 mx-auto my-auto w-full transition-all duration-500 max-w-3xl">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            Launch AI Vocal Session
                        </h2>
                        <p className={`text-xs max-w-md mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Select your interactive assessment target. Prepare with Zephyr, our realistic neural interviewer.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => { setMode('company'); setCompany(''); setTopic(''); setResumeText(''); setResumeFileName(''); }}
                            className={`p-6 border rounded-2xl flex flex-col items-center justify-center space-y-4 transition-all duration-350 transform hover:scale-[1.02] cursor-pointer ${
                                mode === 'company' 
                                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10' 
                                    : theme === 'dark' 
                                        ? 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200' 
                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <span className="text-4xl">🏢</span>
                            <div className="text-center space-y-1">
                                <span className="block font-black text-xs uppercase tracking-wider">Company Mode</span>
                                <span className="block text-[9px] opacity-60 leading-normal max-w-[160px] mx-auto">
                                    Simulate targeted placement rounds for top companies like Google, Amazon, TCS.
                                </span>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setMode('concept'); setCompany(''); setTopic(''); setResumeText(''); setResumeFileName(''); }}
                            className={`p-6 border rounded-2xl flex flex-col items-center justify-center space-y-4 transition-all duration-350 transform hover:scale-[1.02] cursor-pointer ${
                                mode === 'concept' 
                                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10' 
                                    : theme === 'dark' 
                                        ? 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200' 
                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <span className="text-4xl">📚</span>
                            <div className="text-center space-y-1">
                                <span className="block font-black text-xs uppercase tracking-wider">Concept Mastery</span>
                                <span className="block text-[9px] opacity-60 leading-normal max-w-[160px] mx-auto">
                                    Master specific CS topics using code snippets, outputs, and diagrams.
                                </span>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setMode('resume'); setCompany(''); setTopic(''); }}
                            className={`p-6 border rounded-2xl flex flex-col items-center justify-center space-y-4 transition-all duration-350 transform hover:scale-[1.02] cursor-pointer ${
                                mode === 'resume' 
                                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10' 
                                    : theme === 'dark' 
                                        ? 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200' 
                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <span className="text-4xl">📄</span>
                            <div className="text-center space-y-1">
                                <span className="block font-black text-xs uppercase tracking-wider">Resume Defense</span>
                                <span className="block text-[9px] opacity-60 leading-normal max-w-[160px] mx-auto">
                                    Submit your resume and codebases for custom architectural queries.
                                </span>
                            </div>
                        </button>
                    </div>

                    {!mode && (
                        <div className={`p-6 rounded-2xl border text-left space-y-4 backdrop-blur-md transition-all duration-300 shadow-sm ${
                            theme === 'dark' 
                                ? 'bg-slate-900/20 border-white/5 text-slate-400' 
                                : 'bg-slate-100/40 border-slate-200 text-slate-600'
                        }`}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                <span className={`font-mono text-xs uppercase tracking-wider font-black ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                    Assessment Guidelines
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-[11px] uppercase tracking-wide opacity-80">🎙️ Vocal Communication</h4>
                                    <p className="leading-relaxed opacity-70">
                                        Use your microphone for speech response simulation. Zephyr analyzes pacing, word choice, and structural clarity.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-[11px] uppercase tracking-wide opacity-80">🛠️ Deep Project Review</h4>
                                    <p className="leading-relaxed opacity-70">
                                        Resume mode allows drag & dropping code folders or pasting snippet repositories for specific design checks.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'company' && (
                        <div className="space-y-4 transition-all duration-350">
                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Big Tech</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {COMPANIES_DATA.filter(c => c.category === 'Big Tech').map(c => {
                                        const isSelected = company === c.name;
                                        return (
                                            <div 
                                                key={c.name}
                                                onClick={() => setCompany(c.name)}
                                                style={{
                                                    boxShadow: isSelected ? `0 0 15px ${c.glowColor}` : 'none'
                                                }}
                                                className={`relative border rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none bg-gradient-to-br ${c.bgGrad} ${
                                                    isSelected 
                                                        ? theme === 'dark' 
                                                            ? 'border-white text-white scale-105' 
                                                            : 'border-slate-800 text-slate-900 scale-105'
                                                        : theme === 'dark'
                                                            ? 'border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200'
                                                            : 'border-slate-200 hover:border-slate-350 text-slate-550 hover:text-slate-850'
                                                }`}
                                            >
                                                <div className="h-8 flex items-center justify-center mb-2">
                                                    {renderCompanyLogo(c.name)}
                                                </div>
                                                <span className="text-[10px] font-bold tracking-tight">{c.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Consulting & Services</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {COMPANIES_DATA.filter(c => c.category === 'Consulting & Services').map(c => {
                                        const isSelected = company === c.name;
                                        return (
                                            <div 
                                                key={c.name}
                                                onClick={() => setCompany(c.name)}
                                                style={{
                                                    boxShadow: isSelected ? `0 0 15px ${c.glowColor}` : 'none'
                                                }}
                                                className={`relative border rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none bg-gradient-to-br ${c.bgGrad} ${
                                                    isSelected 
                                                        ? theme === 'dark' 
                                                            ? 'border-white text-white scale-105' 
                                                            : 'border-slate-800 text-slate-900 scale-105'
                                                        : theme === 'dark'
                                                            ? 'border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200'
                                                            : 'border-slate-200 hover:border-slate-350 text-slate-550 hover:text-slate-855'
                                                }`}
                                            >
                                                <div className="h-8 flex items-center justify-center mb-2">
                                                    {renderCompanyLogo(c.name)}
                                                </div>
                                                <span className="text-[10px] font-bold tracking-tight">{c.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'concept' && (
                        <div className="space-y-4 transition-all duration-350">
                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Select Theory / Practical Topic</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {CONCEPTS_DATA.map(c => {
                                        const isSelected = topic === c.name;
                                        return (
                                            <div 
                                                key={c.name}
                                                onClick={() => setTopic(c.name)}
                                                style={{
                                                    boxShadow: isSelected ? `0 0 15px ${c.glowColor}` : 'none'
                                                }}
                                                className={`relative border rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none bg-gradient-to-br ${c.bgGrad} ${
                                                    isSelected 
                                                        ? theme === 'dark' 
                                                            ? 'border-white text-white scale-105' 
                                                            : 'border-slate-800 text-slate-900 scale-105'
                                                        : theme === 'dark'
                                                            ? 'border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200'
                                                            : 'border-slate-200 hover:border-slate-350 text-slate-550 hover:text-slate-855'
                                                }`}
                                            >
                                                <span className="text-3xl mb-2">{c.emoji}</span>
                                                <span className="text-[10px] font-bold tracking-tight text-center">{c.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'resume' && (
                        <div className="space-y-4 transition-all duration-350">
                            <div 
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                className={`p-6 border-2 border-dashed rounded-xl transition-all duration-200 text-center cursor-pointer ${
                                    dragActive 
                                        ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01]' 
                                        : theme === 'dark' 
                                            ? 'border-white/10 bg-black/30 hover:border-white/20' 
                                            : 'border-slate-250 bg-slate-50 hover:border-slate-350'
                                }`}
                                onClick={() => resumeInputRef.current.click()}
                            >
                                <span className="text-3xl block mb-2">📤</span>
                                <span className={`text-xs block font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {resumeFileName && !codeUploadError ? `Selected: ${resumeFileName}` : "Drag & Drop Resume here or Click to Upload"}
                                </span>
                                <span className="text-[9px] text-slate-500 block font-mono">Supports PDF, DOCX, TXT (extracted in-browser)</span>
                            </div>
                            <input 
                                type="file" 
                                ref={resumeInputRef}
                                onChange={handleResumeUpload}
                                className="hidden" 
                                accept=".pdf,.docx,.txt"
                            />

                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500">
                                    Or Paste Resume Text Directly
                                </label>
                                <textarea
                                    value={resumeText}
                                    onChange={(e) => {
                                        setResumeText(e.target.value);
                                        setResumeFileName(e.target.value ? "Pasted_Resume_Text" : "");
                                        setCodeUploadError('');
                                    }}
                                    placeholder="Paste your professional resume, skills, or projects here..."
                                    rows={4}
                                    className={`w-full p-3 border rounded-xl text-xs outline-none resize-none font-mono ${
                                        theme === 'dark' 
                                            ? 'bg-black border-white/5 text-white' 
                                            : 'bg-slate-50 border-slate-200 text-slate-800'
                                    }`}
                                />
                            </div>

                            {codeUploadError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                    <p className="text-[10px] font-mono text-rose-450 leading-relaxed">{codeUploadError}</p>
                                </div>
                            )}

                            <div className={`p-4 border rounded-2xl space-y-3 text-left ${theme === 'dark' ? 'bg-black/20 border-white/5 text-slate-350 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'}`}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-cyan-500">
                                            🔗 Link Codebase & Sources (Optional)
                                        </h4>
                                        <p className="text-[8px] text-slate-500 font-mono">
                                            Link GitHub repos, drag folders, or upload files to enable deep code parsing.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => codeFilesInputRef.current.click()} 
                                            className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono text-slate-300 cursor-pointer"
                                        >
                                            Files
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => codeFolderInputRef.current.click()} 
                                            className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono text-slate-300 cursor-pointer"
                                        >
                                            Folder
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setShowPasteArea(prev => !prev); setShowGithubInput(false); }} 
                                            className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono text-slate-300 cursor-pointer"
                                        >
                                            Paste
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setShowGithubInput(prev => !prev); setShowPasteArea(false); }} 
                                            className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/5 rounded text-[8px] font-mono text-slate-300 cursor-pointer animate-pulse"
                                        >
                                            GitHub
                                        </button>
                                    </div>
                                </div>

                                {showGithubInput && (
                                    <div className="flex gap-2 animate-fadeIn">
                                        <input 
                                            type="text" 
                                            placeholder="https://github.com/username/project"
                                            value={githubUrlInput}
                                            onChange={(e) => setGithubUrlInput(e.target.value)}
                                            className={`flex-1 p-2 text-[9px] rounded-lg border outline-none font-mono ${theme === 'dark' ? 'bg-black/30 border-white/10 text-slate-200' : 'bg-white border-slate-255 text-slate-800'}`}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleLinkGithubRepo}
                                            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-[9px] font-mono cursor-pointer"
                                        >
                                            Link
                                        </button>
                                    </div>
                                )}

                                {showPasteArea && (
                                    <div className="space-y-2.5 animate-fadeIn">
                                        <input 
                                            type="text" 
                                            placeholder="filename.js (optional)"
                                            value={pasteFilename}
                                            onChange={(e) => setPasteFilename(e.target.value)}
                                            className={`w-full p-2 text-[9px] rounded-lg border outline-none font-mono ${theme === 'dark' ? 'bg-black/30 border-white/10 text-slate-200' : 'bg-white border-slate-255 text-slate-800'}`}
                                        />
                                        <textarea
                                            placeholder="Paste your project code snippet here..."
                                            value={pasteCodeContent}
                                            onChange={(e) => setPasteCodeContent(e.target.value)}
                                            rows={3}
                                            className={`w-full p-2 text-[9px] rounded-lg border outline-none resize-none font-mono ${theme === 'dark' ? 'bg-black/30 border-white/10 text-slate-200' : 'bg-white border-slate-255 text-slate-850'}`}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setShowPasteArea(false)} className="px-2 py-1 text-[8px] font-mono rounded border border-slate-700 text-slate-400">Cancel</button>
                                            <button type="button" onClick={handleAddPastedCode} className="px-2.5 py-1 text-[8px] font-mono rounded bg-cyan-500 text-slate-950 font-bold">Add Code</button>
                                        </div>
                                    </div>
                                )}

                                {attachedCodeFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
                                        {attachedCodeFiles.map((file, fIdx) => (
                                            <div key={fIdx} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[8px] font-mono text-cyan-400 flex items-center gap-1.5">
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachedCodeFile(fIdx)} className="text-rose-500 hover:text-rose-400 font-bold">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {resumeText && !codeUploadError && (
                                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-1">
                                    <p className="text-xs font-bold text-emerald-500">✓ Portfolio structure parsed successfully!</p>
                                    <p className="text-[9px] font-mono text-slate-550 uppercase">Ready for deep project-defense simulation</p>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleStart}
                        disabled={!mode || (mode === 'company' && !company) || (mode === 'resume' && (!resumeText || codeUploadError)) || (mode === 'concept' && !topic)}
                        className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                        {attachedCodeFiles.length > 0 ? "Analyze & Send" : "Send"}
                    </button>
                </div>
            ) : (
                renderChatPanel("h-[560px]")
            )}
        </div>
    );
};

export default App;