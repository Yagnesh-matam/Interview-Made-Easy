// AiChatConsole.jsx (Fully Redesigned & Enhanced)

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Input sanitization helper
const sanitizeUserInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, 5000);
};

// Validate base64 audio format
const isValidBase64Audio = (str) => {
    if (typeof str !== 'string') return false;
    return /^[A-Za-z0-9+/=]*$/.test(str) && str.length > 0;
};

const AiChatConsole = () => {
    const [mode, setMode] = useState(''); // 'company', 'concept', or 'resume'
    const [company, setCompany] = useState('');
    const [topic, setTopic] = useState('');
    const [interviewComponent, setInterviewComponent] = useState('technical'); 
    const [resumeFile, setResumeFile] = useState(null);
    const [parsedResumeText, setParsedResumeText] = useState('');
    const [resumeFocusType, setResumeFocusType] = useState('project');
    const [resumeProjectIndex, setResumeProjectIndex] = useState('random');
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [notification, setNotification] = useState(null); // Custom Toast state

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // Persistent Audio element pointer
    const audioRef = useRef(new Audio());

    // Grouped companies
    const bigTechCompanies = [
        { name: 'Google', symbol: '🌐', style: 'border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-400' },
        { name: 'Microsoft', symbol: '❖', style: 'border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-400' },
        { name: 'Amazon', symbol: '⚡', style: 'border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400' },
        { name: 'Apple', symbol: '', style: 'border-slate-500/20 hover:border-slate-400/50 hover:bg-slate-500/5 text-slate-350' },
        { name: 'IBM', symbol: '█', style: 'border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-indigo-400' }
    ];

    const serviceCompanies = [
        { name: 'TCS', symbol: '⚙', style: 'border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/5 text-sky-400' },
        { name: 'Infosys', symbol: '∞', style: 'border-green-500/20 hover:border-green-500/50 hover:bg-green-500/5 text-green-400' },
        { name: 'Accenture', symbol: '🡥', style: 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-400' },
        { name: 'Cognizant', symbol: '⬡', style: 'border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400' },
        { name: 'Capgemini', symbol: '♠', style: 'border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-400/5 text-blue-300' },
        { name: 'Wipro', symbol: '⚫', style: 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400' },
        { name: 'Tech Mahindra', symbol: 'Ⓜ', style: 'border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-400' },
        { name: 'HCL Technologies', symbol: 'ʜ', style: 'border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-500/5 text-teal-400' },
        { name: 'Genpact', symbol: 'ɢ', style: 'border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/5 text-violet-400' },
        { name: 'EY', symbol: 'ᴇʏ', style: 'border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/5 text-yellow-400' },
        { name: 'Deloitte', symbol: 'ᴅ', style: 'border-lime-500/20 hover:border-lime-500/50 hover:bg-lime-500/5 text-lime-400' }
    ];

    const topics = [
        'Java', 'Python', 'C/C++', 'Software Engineering', 
        'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Git', 'OOPs'
    ];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, loading]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        return () => {
            stopActiveSpeechPlayback();
        };
    }, []);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
    };

    const stopActiveSpeechPlayback = () => {
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.src = "";
            } catch (err) {
                console.error("Audio cleanup error");
            }
        }
    };

    const executeNetworkTransmissionRef = useRef(null);
    
    const executeNetworkTransmission = async (textToSend) => {
        if (loading) return;
        
        const cleanInput = sanitizeUserInput(textToSend);
        if (!cleanInput) {
            showNotification("Please enter a valid message.", "error");
            return;
        }
        
        setLoading(true);

        const updatedHistory = [...chatHistory, { role: 'user', content: cleanInput }];
        setChatHistory(updatedHistory);
        setUserInput('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/interview-chat`, {
                company: mode === 'company' ? company : '',
                topic: mode === 'resume' ? parsedResumeText : topic,
                chatHistory: updatedHistory,
                component: mode === 'resume' ? 'technical' : interviewComponent,
                isCompanyMode: mode === 'company',
                isConceptMode: mode === 'concept',
                isResumeMode: mode === 'resume',
                resumeFocusType: mode === 'resume' ? resumeFocusType : '',
                resumeProjectIndex: mode === 'resume' ? resumeProjectIndex : ''
            });

            const replyText = response.data.reply;
            setChatHistory([...updatedHistory, { role: 'assistant', content: replyText }]);
            playNeuralAudioStream(response.data.audio);
        } catch (error) {
            console.error("Network transmission error");
            showNotification("Failed to get response from Zephyr. Please retry.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        executeNetworkTransmissionRef.current = executeNetworkTransmission;
    }, [chatHistory, mode, company, topic, interviewComponent, parsedResumeText, resumeFocusType, resumeProjectIndex]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => setIsListening(true);
            rec.onend = () => setIsListening(false);
            
            rec.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                const cleanSpeech = sanitizeUserInput(speechResult);
                setUserInput(cleanSpeech);
                if (cleanSpeech && executeNetworkTransmissionRef.current) {
                    executeNetworkTransmissionRef.current(cleanSpeech);
                }
            };

            recognitionRef.current = rec;
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    const processFile = async (file) => {
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            showNotification("Only PDF files are accepted.", "error");
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showNotification("File size must be less than 5 MB.", "error");
            return;
        }
        
        setResumeFile(file);
        setUploading(true);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/resume/parse`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const extractedText = sanitizeUserInput(response.data.extractedText || '');
            setParsedResumeText(extractedText);
            showNotification("Resume successfully parsed and indexed.", "success");
        } catch (error) {
            console.error("Resume upload error");
            showNotification("Failed to parse resume document. Please try again.", "error");
            setResumeFile(null);
        } finally {
            setUploading(false);
        }
    };

    const handleResumeUpload = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const primeSpeechEngine = () => {
        try {
            audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            audioRef.current.play()
                .catch((e) => console.warn("Audio priming deferred:", e.message));
        } catch (e) {
            console.error("Audio engine priming failed");
        }
    };

    const playNeuralAudioStream = (base64Audio) => {
        if (!base64Audio || !isValidBase64Audio(base64Audio)) {
            console.warn("Invalid audio payload received");
            return;
        }

        try {
            audioRef.current.src = `data:audio/mp3;base64,${base64Audio}`;
            audioRef.current.play()
                .catch(e => {
                    console.error("Audio playback blocked");
                    showNotification("Audio blocked by browser. Tap the console to vocalize.", "info");
                });
        } catch (err) {
            console.error("Audio playback error");
        }
    };

    const toggleVoiceRecording = () => {
        if (!recognitionRef.current) {
            showNotification("Voice input not supported on this browser.", "error");
            return;
        }

        primeSpeechEngine();

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const startInterviewSession = async () => {
        if (mode === 'company' && !company) return;
        if (mode === 'concept' && !topic) return;
        if (mode === 'resume' && !parsedResumeText) return;

        primeSpeechEngine();
        setInterviewStarted(true);
        setLoading(true);

        if (mode === 'resume') {
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
        }

        // Formulate vocal initial messages based on mode
        let kickstartMessage = '';
        if (mode === 'company') {
            kickstartMessage = `Welcome to the Vocal AI Arena. I am Zephyr, your interactive AI interviewer. I see the company you've selected from our platform is ${company}. To help me tailor this session perfectly to your goals, please tell me: What role are you pursuing, and what is your primary programming language or tech stack? (Feel free to paste your resume or highlight a few key projects as well!)`;
        } else if (mode === 'concept') {
            kickstartMessage = `Welcome to the Concept Mastery Arena. I am Zephyr, your academic assessor. I see you've selected the topic: ${topic}. To begin, please tell me your level of experience with this topic and any specific sub-concepts you'd like to focus on today.`;
        } else if (mode === 'resume') {
            kickstartMessage = `Welcome to the Portfolio Defense Arena. I am Zephyr, your engineering manager. I have parsed and indexed your resume. To begin, please summarize your most significant project and explain the technical challenges you faced while building it.`;
        }

        const initialChat = [{ role: 'assistant', content: kickstartMessage }];
        setChatHistory(initialChat);

        // Fetch vocalization for the kickstart message in the background
        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/tts`, {
                text: kickstartMessage
            });
            if (response.data.success && response.data.audio) {
                playNeuralAudioStream(response.data.audio);
            }
        } catch (err) {
            console.error("TTS kickstart fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!userInput.trim() || loading) return;

        primeSpeechEngine();
        executeNetworkTransmission(userInput);
    };

    const terminateActiveSession = () => {
        stopActiveSpeechPlayback();
        if (recognitionRef.current) recognitionRef.current.stop();
        setInterviewStarted(false);
        setMode('');
        setCompany('');
        setTopic('');
        setChatHistory([]);
    };

    return (
        <div className="bg-appCard rounded-2xl border border-appBorder min-h-[550px] flex flex-col overflow-hidden transition-colors relative shadow-2xl">
            
            {/* Custom Toast Container */}
            {notification && (
                <div className={`absolute top-4 right-4 z-50 p-4 rounded-xl shadow-lg border transition-all duration-300 text-xs font-bold flex items-center gap-2 ${
                    notification.type === 'success' 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-emerald-500/5' 
                        : notification.type === 'error' 
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/25 shadow-rose-500/5' 
                        : 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/25 shadow-[var(--accent-cyan)]/5'
                }`}>
                    <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
                    <p>{notification.message}</p>
                </div>
            )}

            {/* Stage 1: Arena Selection */}
            {!interviewStarted && !mode && (
                <div className="p-8 md:p-12 my-auto max-w-4xl mx-auto text-center space-y-6 w-full animate-fadeIn">
                    <div>
                        <span className="text-5xl animate-bounce inline-block">🎙️</span>
                        <h2 className="text-3xl font-black text-appText mt-3 tracking-wide">Vocal AI Interview Arena</h2>
                        <p className="text-xs text-appText/50 mt-1.5 max-w-md mx-auto leading-relaxed font-medium">
                            Step into the arena with "Zephyr," our elite technical assessor. Experience a live, adaptive oral examination loop.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                        {/* Company Specific Card */}
                        <button 
                            onClick={() => setMode('company')} 
                            className="p-6 border border-appBorder bg-appBg/40 hover:bg-appBg/80 rounded-2xl text-left hover:border-[var(--accent-cyan)] transition-all group shadow-md hover:shadow-[0_0_20px_rgba(0,245,212,0.1)] hover:scale-[1.01]"
                        >
                            <span className="text-4xl block mb-3">🏢</span>
                            <h3 className="font-black text-appText text-base group-hover:text-[var(--accent-cyan)]">Company Specific</h3>
                            <p className="text-[11px] text-appText/40 mt-1.5 leading-relaxed font-medium">
                                Simulate placements at Google, Amazon, Microsoft, EY, TCS, and more using historical interview tracks.
                            </p>
                        </button>

                        {/* Concept Specific Card */}
                        <button 
                            onClick={() => setMode('concept')} 
                            className="p-6 border border-appBorder bg-appBg/40 hover:bg-appBg/80 rounded-2xl text-left hover:border-[var(--accent-gold)] transition-all group shadow-md hover:shadow-[0_0_20px_rgba(236,201,75,0.1)] hover:scale-[1.01]"
                        >
                            <span className="text-4xl block mb-3">🧠</span>
                            <h3 className="font-black text-appText text-base group-hover:text-[var(--accent-gold)]">Concept Specific</h3>
                            <p className="text-[11px] text-appText/40 mt-1.5 leading-relaxed font-medium">
                                Audit your conceptual depth in DSA, DBMS, System Design, Operating Systems, or Git fundamentals.
                            </p>
                        </button>

                        {/* Portfolio Defense Card */}
                        <button 
                            onClick={() => setMode('resume')} 
                            className="p-6 border border-appBorder bg-appBg/40 hover:bg-appBg/80 rounded-2xl text-left hover:border-purple-500 transition-all group shadow-md hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:scale-[1.01]"
                        >
                            <span className="text-4xl block mb-3">📄</span>
                            <h3 className="font-black text-appText text-base group-hover:text-purple-400">Portfolio Vault</h3>
                            <p className="text-[11px] text-appText/40 mt-1.5 leading-relaxed font-medium">
                                Upload your professional resume to trigger custom defense loops targeting your claimed project stack.
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {/* Stage 2: Arena Setup Forms */}
            {!interviewStarted && mode && (
                <div className="p-6 md:p-8 my-auto max-w-2xl mx-auto w-full space-y-5 text-left animate-fadeIn">
                    <button onClick={() => { setMode(''); setCompany(''); setTopic(''); setResumeFile(null); setParsedResumeText(''); }} className="text-xs font-bold font-mono text-appText/40 hover:text-appText transition-colors flex items-center gap-1.5">
                        🡨 Back to Arenas
                    </button>
                    
                    {/* Mode: Company Specific Configuration */}
                    {mode === 'company' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-appText">Enterprise Placement Round</h3>
                                <p className="text-xs text-appText/55 mt-0.5">Select a brand card to load their historical loop parameters.</p>
                            </div>

                            {/* Brand Card selector */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-appText/55 uppercase tracking-widest font-mono">Select Target Corporate</label>
                                
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {/* Big Tech Grid */}
                                    <div className="text-[9px] font-mono text-appText/40 font-black uppercase tracking-wider mb-1">Big Tech</div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                                        {bigTechCompanies.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => setCompany(c.name)}
                                                className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                    company === c.name 
                                                        ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-md' 
                                                        : `bg-appBg border-appBorder ${c.style}`
                                                }`}
                                            >
                                                <span>{c.symbol}</span>
                                                <span>{c.name}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Consulting & Service Grid */}
                                    <div className="text-[9px] font-mono text-appText/40 font-black uppercase tracking-wider mb-1">Consulting & Services</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {serviceCompanies.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => setCompany(c.name)}
                                                className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                    company === c.name 
                                                        ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-md' 
                                                        : `bg-appBg border-appBorder ${c.style}`
                                                }`}
                                            >
                                                <span>{c.symbol}</span>
                                                <span>{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Round style & Topic selector */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-appText/55 uppercase tracking-widest font-mono mb-1.5">Focus Tech Domain</label>
                                    <select 
                                        value={topic} 
                                        onChange={(e) => setTopic(e.target.value)} 
                                        className="w-full p-3 bg-appBg border border-appBorder rounded-xl text-xs font-semibold text-appText outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                                    >
                                        <option value="">-- General Placement Focus --</option>
                                        {topics.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-appText/55 uppercase tracking-widest font-mono mb-1.5">Round Component</label>
                                    <div className="grid grid-cols-3 gap-1.5 h-11">
                                        {['technical', 'coding', 'behavioral'].map(type => (
                                            <button 
                                                key={type} 
                                                type="button" 
                                                onClick={() => setInterviewComponent(type)} 
                                                className={`rounded-xl border text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                                                    interviewComponent === type 
                                                        ? 'bg-[var(--accent-cyan)] text-slate-950 border-[var(--accent-cyan)]' 
                                                        : 'bg-appBg text-appText/65 border-appBorder hover:border-appText/30'
                                                }`}
                                            >
                                                {type === 'coding' ? 'Code' : type === 'behavioral' ? 'HR' : 'Tech'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={startInterviewSession} 
                                disabled={!company} 
                                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    company 
                                        ? 'bg-[var(--accent-cyan)] text-slate-950 hover:bg-opacity-90 shadow-lg shadow-[var(--accent-cyan)]/20 cursor-pointer' 
                                        : 'bg-appBorder text-appText/30 cursor-not-allowed'
                                }`}
                            >
                                Launch Zephyr Session
                            </button>
                        </div>
                    )}

                    {/* Mode: Concept Mastery Configuration */}
                    {mode === 'concept' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-appText">Concept Mastery Assessment</h3>
                                <p className="text-xs text-appText/55 mt-0.5">Select a core concept area to begin an academic concept round.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-appText/55 uppercase tracking-widest font-mono mb-1.5">Technical Domain</label>
                                <select 
                                    value={topic} 
                                    onChange={(e) => setTopic(e.target.value)} 
                                    className="w-full p-3 bg-appBg border border-appBorder rounded-xl text-xs font-semibold text-appText outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
                                >
                                    <option value="">-- Select Subject Domain --</option>
                                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-appText/55 uppercase tracking-widest font-mono mb-1.5">Assessment Focus</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['technical', 'coding', 'behavioral'].map(type => (
                                        <button 
                                            key={type} 
                                            type="button" 
                                            onClick={() => setInterviewComponent(type)} 
                                            className={`py-3 rounded-xl border text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                                                interviewComponent === type 
                                                    ? 'bg-[var(--accent-gold)] text-slate-950 border-[var(--accent-gold)]' 
                                                    : 'bg-appBg text-appText/65 border-appBorder hover:border-appText/30'
                                            }`}
                                        >
                                            {type === 'coding' ? 'Code' : type === 'behavioral' ? 'HR' : 'Tech'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={startInterviewSession} 
                                disabled={!topic} 
                                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    topic 
                                        ? 'bg-[var(--accent-gold)] text-slate-950 hover:bg-opacity-90 shadow-lg shadow-[var(--accent-gold)]/20 cursor-pointer' 
                                        : 'bg-appBorder text-appText/30 cursor-not-allowed'
                                }`}
                            >
                                Start Mastery Round
                            </button>
                        </div>
                    )}

                    {/* Mode: Resume / Portfolio Defense Configuration */}
                    {mode === 'resume' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-appText">Portfolio Defense Simulation</h3>
                                <p className="text-xs text-appText/55 mt-0.5">Upload your software engineering resume (PDF) to build a custom project defense loop.</p>
                            </div>

                            {/* Drag and drop zone */}
                            {!resumeFile ? (
                                <div 
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                                        isDragging 
                                            ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                            : 'border-appBorder bg-appBg/20 hover:border-purple-500/40 hover:bg-purple-500/5'
                                    }`}
                                >
                                    <span className="text-4xl animate-pulse">📤</span>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-appText">Drag and drop your Resume PDF here</p>
                                        <p className="text-[10px] text-appText/40 mt-1">or click to browse local files (Max 5MB)</p>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        accept=".pdf" 
                                        onChange={handleResumeUpload} 
                                        className="hidden" 
                                    />
                                </div>
                            ) : (
                                /* File Details Card */
                                <div className="p-4 border border-purple-500/30 rounded-xl bg-purple-500/5 flex items-center justify-between gap-3 animate-slideIn">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-3xl">📄</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-appText truncate">{resumeFile.name}</p>
                                            <p className="text-[9px] font-mono text-purple-400 mt-0.5">
                                                {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => { setResumeFile(null); setParsedResumeText(''); }}
                                        className="text-xs font-black text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                        ✕ Remove
                                    </button>
                                </div>
                            )}

                            {uploading && (
                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center gap-2 justify-center text-xs font-mono animate-pulse">
                                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>ANALYZING PORTFOLIO STRUCTURES...</span>
                                </div>
                            )}

                            {!uploading && parsedResumeText && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2 justify-center text-xs font-mono">
                                    <span>✓ PORTFOLIO INDEXED AND ENCRYPTED SUCCESSFULLY!</span>
                                </div>
                            )}

                            <button 
                                onClick={startInterviewSession} 
                                disabled={!parsedResumeText || uploading} 
                                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    parsedResumeText && !uploading 
                                        ? 'bg-purple-600 text-white hover:bg-opacity-90 shadow-lg shadow-purple-600/20 cursor-pointer' 
                                        : 'bg-appBorder text-appText/30 cursor-not-allowed'
                                }`}
                            >
                                Launch Defense Round
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Stage 3: Live Interview Session Console */}
            {interviewStarted && (
                <div className="flex-1 flex flex-col h-[600px] animate-fadeIn">
                    
                    {/* Header bar */}
                    <div className={`px-6 py-4 flex justify-between items-center shadow-md transition-colors ${
                        mode === 'resume' ? 'bg-purple-600 text-white' : mode === 'concept' ? 'bg-[var(--accent-gold)] text-slate-950' : 'bg-[var(--accent-cyan)] text-slate-950'
                    }`}>
                        <div className="flex items-center space-x-3 text-left">
                            <span className="text-2xl">🎙️</span>
                            <div>
                                <h3 className="font-black text-sm tracking-wider uppercase">
                                    {mode === 'resume' ? 'Zephyr Portfolio Assessor' : mode === 'concept' ? 'Zephyr Subject Professor' : `Zephyr • ${company} Assessor`}
                                </h3>
                                <p className="text-[10px] font-mono font-bold opacity-75">
                                    {mode === 'resume' ? 'Auditing Engineering Portfolio' : mode === 'concept' ? `Focus Domain: ${topic}` : `Placement Focus: ${topic || 'General Full Stack'}`}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Speech Pulsing Visualizer */}
                        <div className="flex items-center gap-4">
                            {/* CSS Pulsing Audio Wave */}
                            <div className="flex items-center gap-1 h-5 px-3 bg-black/10 rounded-full">
                                <span className={`w-0.5 rounded-full bg-current transition-all duration-300 ${loading ? 'h-3 animate-pulse' : 'h-1.5'}`} style={{ animationDelay: '0ms' }}></span>
                                <span className={`w-0.5 rounded-full bg-current transition-all duration-300 ${loading ? 'h-4 animate-pulse' : 'h-1.5'}`} style={{ animationDelay: '150ms' }}></span>
                                <span className={`w-0.5 rounded-full bg-current transition-all duration-300 ${loading ? 'h-3 animate-pulse' : 'h-1.5'}`} style={{ animationDelay: '300ms' }}></span>
                                <span className={`w-0.5 rounded-full bg-current transition-all duration-300 ${loading ? 'h-5 animate-pulse' : 'h-1.5'}`} style={{ animationDelay: '450ms' }}></span>
                                <span className={`w-0.5 rounded-full bg-current transition-all duration-300 ${loading ? 'h-2.5 animate-pulse' : 'h-1.5'}`} style={{ animationDelay: '600ms' }}></span>
                            </div>

                            <button 
                                onClick={terminateActiveSession} 
                                className="text-[10px] uppercase tracking-wider bg-black/20 hover:bg-black/35 px-3 py-2 rounded-xl font-mono font-black transition-all cursor-pointer"
                            >
                                Terminate Loop
                            </button>
                        </div>
                    </div>

                    {/* Chat Bubble History Log */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-appBg/20 text-left">
                        {chatHistory.filter(msg => msg.role !== 'system').map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-md ${
                                    msg.role === 'user' 
                                        ? 'bg-[var(--accent-cyan)] text-slate-950 rounded-br-none font-bold' 
                                        : 'bg-appCard text-appText border border-appBorder rounded-bl-none'
                                }`}>
                                    {msg.role !== 'user' && (
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className={`font-mono text-[9px] font-black uppercase tracking-widest ${
                                                mode === 'resume' ? 'text-purple-400' : mode === 'concept' ? 'text-[var(--accent-gold)]' : 'text-[var(--accent-cyan)]'
                                            }`}>
                                                🛡️ ZEPHYR ASSESSOR
                                            </span>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-line">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {/* Loading/Thinking Bubble */}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-appCard border border-appBorder p-4 rounded-xl rounded-bl-none shadow-sm flex items-center space-x-1.5">
                                    <div className="w-1.5 h-1.5 bg-appText/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-appText/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-appText/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Input Controller panel */}
                    <form onSubmit={handleFormSubmit} className="p-4 border-t border-appBorder bg-appCard flex gap-3 items-center">
                        <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            disabled={loading}
                            className={`p-3.5 rounded-xl border transition-all text-base flex items-center justify-center shadow-md cursor-pointer ${
                                isListening 
                                    ? 'bg-rose-500 text-white border-rose-500 animate-pulse scale-105' 
                                    : 'bg-appBg text-appText border-appBorder hover:bg-appBg/80'
                             }`}
                            title={isListening ? "Listening... Click to mute mic" : "Vocalize response"}
                        >
                            {isListening ? '🛑' : '🎙️'}
                        </button>

                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={loading || isListening}
                            placeholder={isListening ? "Listening... Speak your assessment response clearly." : "Type your professional answer or 'End Interview' to wrap up..."}
                            className="flex-1 p-3 bg-appBg border border-appBorder rounded-xl outline-none text-appText text-xs focus:ring-1 focus:ring-[var(--accent-cyan)] font-medium"
                        />
                        
                        <button 
                            type="submit" 
                            disabled={loading || isListening || !userInput.trim()} 
                            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                                !userInput.trim() || loading || isListening 
                                    ? 'bg-appBorder text-appText/20 cursor-not-allowed' 
                                    : 'bg-[var(--accent-cyan)] text-slate-950 hover:opacity-90'
                            }`}
                        >
                            Transmit
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AiChatConsole;