import React, { useState } from 'react';

const StudyMaterials = () => {
    const [selectedTopic, setSelectedTopic] = useState('');

    const topics = [
        'Java', 'Python', 'C/C++', 'Software Engineering', 
        'DSA', 'DBMS', 'Operating Systems', 'Soft Skills', 'Aptitude',
        'Computer Networks', 'Git', 'Interview Etiquette'
    ];

    // Core content repository matrix - Easy to update with your own reference notes/links
    const staticRepository = {
        'Java': {
            notes: "Java is a class-based, object-oriented programming language designed to have as few implementation dependencies as possible. Key pillars include the JVM (Java Virtual Machine) abstraction layer and automatic garbage collection routines.",
            cheatSheet: "• Compiles to bytecode (.class files)\n• Memory divided into Stack (primitive frames) and Heap (dynamic objects)\n• String objects are immutable and stored inside the String Constant Pool.",
            diagramUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60", // Replace with your flowchart or diagram link
            pdfLink: "https://drive.google.com/file/d/your-java-notes-id/view" // Paste your Google Drive link here
        },
        'Computer Networks': {
            notes: "Computer Networks govern data packet encapsulation, transit paths, and decoding parameters across linked routing switches using standard layered architectures.",
            cheatSheet: "• OSI Model: 7 Layers (Physical up to Application)\n• TCP/IP Model: 4 Practical functional layers\n• MAC addresses operate at Layer 2; IP routing vectors operate at Layer 3.",
            diagramUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=60",
            pdfLink: "https://drive.google.com/file/d/your-networks-cheat-sheet/view"
        },
        'Interview Etiquette': {
            notes: "Interview Etiquette governs technical presence, structured STAR methodology responses, reverse interviewing protocols, and professional follow-ups to maximize placement success.",
            cheatSheet: "• Tech Setup: Verify high-speed network and clean acoustics before logging in.\n• Verbal Flow: Maintain structural response patterns (STAR: Situation, Task, Action, Result).\n• Technical Gap Rule: Never guess; explain your problem-solving approaches transparently.",
            diagramUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop&q=60",
            pdfLink: "https://www.hbs.edu/recruiting/business-resources/Documents/Interviewing-Guide.pdf"
        }
    };

    const currentData = staticRepository[selectedTopic] || {
        notes: "Notes array compilation pending text attachment.",
        cheatSheet: "• Bullet points and quick review shortcuts will display here.",
        diagramUrl: "",
        pdfLink: "#"
    };

    return (
        <div className="space-y-6 animate-item">
            {/* Topic Selector Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {topics.map((topic) => (
                    <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`p-3 rounded-xl border text-xs font-bold tracking-wide transition-all ${
                            selectedTopic === topic
                                ? 'bg-appCyan text-slate-950 border-appCyan shadow-md transform scale-[1.01]'
                                : 'bg-appCard text-appText/80 border-appBorder hover:border-appCyan'
                        }`}
                    >
                        📚 {topic}
                    </button>
                ))}
            </div>

            {/* Premium Content View Frame */}
            <div className="bg-appCard p-6 rounded-xl border border-appBorder shadow-sm min-h-[450px] transition-colors">
                {!selectedTopic ? (
                    <div className="text-center text-appText/40 py-32 space-y-2">
                        <span className="text-5xl block">📑</span>
                        <h3 className="text-lg font-bold">Academic Resource Hub</h3>
                        <p className="text-xs">Select a domain above to unlock structural notes, cheat sheets, and architectural diagrams.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Header Section */}
                        <div className="border-b border-appBorder pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-appText tracking-wide">{selectedTopic} Comprehensive Hub</h3>
                                <p className="text-xs text-appText/50">Verified placement preparation assets and study templates</p>
                            </div>
                            {currentData.pdfLink !== '#' && (
                                <a 
                                    href={currentData.pdfLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5"
                                >
                                    📥 Download Official PDF Notes
                                </a>
                            )}
                        </div>

                        {/* Interactive Notes Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {/* Core Lecture Notes */}
                                <div className="p-4 bg-appBg rounded-xl border border-appBorder">
                                    <h4 className="text-xs font-black text-appCyan uppercase tracking-widest mb-2">📋 Core Lecture Concepts</h4>
                                    <p className="text-sm leading-relaxed text-appText/80 whitespace-pre-line">{currentData.notes}</p>
                                </div>

                                {/* High-Density Cheat Sheet */}
                                <div className="p-4 bg-appBg rounded-xl border border-appBorder">
                                    <h4 className="text-xs font-black text-appGold uppercase tracking-widest mb-2">⚡ Revision Cheat Sheet</h4>
                                    <p className="text-sm font-mono leading-relaxed text-appText/80 whitespace-pre-line">{currentData.cheatSheet}</p>
                                </div>
                            </div>

                            {/* Flowcharts & Diagram Render Section */}
                            <div className="p-4 bg-appBg rounded-xl border border-appBorder flex flex-col justify-between">
                                <div>
                                    <h4 className="text-xs font-black text-appCyan uppercase tracking-widest mb-3">📊 Architectural Diagrams & Flowcharts</h4>
                                    {currentData.diagramUrl ? (
                                        <img 
                                            src={currentData.diagramUrl} 
                                            alt={`${selectedTopic} Concept Layout`}
                                            className="w-full h-auto max-h-64 object-cover rounded-lg border border-appBorder shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-appCard border border-dashed border-appBorder rounded-lg flex flex-col items-center justify-center text-appText/30 text-xs">
                                            <span>📷</span>
                                            <span className="mt-1">No diagram link mounted for this node yet.</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-appText/40 mt-3 italic">Tip: You can host diagrams on Imgur or Postimages and drop the direct URL links right into your configuration setup text arrays.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyMaterials;