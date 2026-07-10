import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Bot, FileText, Zap, TrendingUp, CheckCircle2 } from './lucide-mock'; // Uses no-install fallback script

const AnalyticsDashboard = ({ setActiveTab }) => {
    const [metrics, setMetrics] = useState({
        avgAccuracy: 0,
        totalQuizzes: 0,
        totalAiSessions: 0,
        progressionLog: []
    });
    const [loading, setLoading] = useState(true);

    const userEmail = "developer@test.com";

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/analytics/${userEmail}`);
                setMetrics(response.data);
            } catch (error) {
                console.error("Dashboard calculation handshake error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const width = 500;
    const height = 150;
    const padding = 20;
    
    const points = metrics.progressionLog.length > 0 
        ? metrics.progressionLog.map((log, index) => {
            const x = padding + (index * (width - padding * 2)) / (metrics.progressionLog.length - 1);
            const y = height - padding - (log.score * (height - padding * 2)) / 100;
            return `${x},${y}`;
          }).join(' ')
        : `${padding},${height - padding}`;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[300px]">
                <div className="w-8 h-8 border-4 border-appText border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ANIME.JS TARGET: Metric Cards Row Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-item">
                <div className="bg-appCard p-5 rounded-xl border border-appBorder shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Award size={24} /></div>
                    <div>
                        <h3 className="text-xs font-bold text-appText/40 uppercase tracking-wider">Avg. Accuracy</h3>
                        <p className="text-2xl font-extrabold text-appText mt-0.5">{metrics.avgAccuracy}%</p>
                    </div>
                </div>

                <div className="bg-appCard p-5 rounded-xl border border-appBorder shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><Bot size={24} /></div>
                    <div>
                        <h3 className="text-xs font-bold text-appText/40 uppercase tracking-wider">AI Sessions</h3>
                        <p className="text-2xl font-extrabold text-appText mt-0.5">{metrics.totalAiSessions} Rounds</p>
                    </div>
                </div>

                <div className="bg-appCard p-5 rounded-xl border border-appBorder shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400"><FileText size={24} /></div>
                    <div>
                        <h3 className="text-xs font-bold text-appText/40 uppercase tracking-wider">Assessments</h3>
                        <p className="text-2xl font-extrabold text-appText mt-0.5">{metrics.totalQuizzes} Taken</p>
                    </div>
                </div>

                <div className="bg-appCard p-5 rounded-xl border border-appBorder shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-appGold"><Zap size={24} /></div>
                    <div>
                        <h3 className="text-xs font-bold text-appText/40 uppercase tracking-wider">Platform Engine</h3>
                        <p className="text-sm font-bold text-appGold mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">Cloud Sync Live</p>
                    </div>
                </div>
            </div>

            {/* ANIME.JS TARGET: Progression Curve Graph section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-item">
                <div className="bg-appCard p-6 rounded-xl border border-appBorder shadow-sm lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-appText text-base flex items-center gap-2">
                                <TrendingUp size={18} className="text-appCyan" /> Live Readiness Progression Curve
                            </h3>
                            <p className="text-xs text-appText/40">Renders performance indexes drawn directly from your local database logs.</p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--bg-primary)" strokeWidth="1" opacity="0.2" />
                            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--text-main)" strokeWidth="1" strokeDasharray="4" opacity="0.05" />
                            <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--text-main)" strokeWidth="1" strokeDasharray="4" opacity="0.05" />

                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            
                            <path d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`} fill="url(#chartGradient)" />
                            <polyline fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />

                            {metrics.progressionLog.map((log, index) => {
                                const x = padding + (index * (width - padding * 2)) / (metrics.progressionLog.length - 1);
                                const y = height - padding - (log.score * (height - padding * 2)) / 100;
                                return (
                                    <g key={index} className="group cursor-pointer">
                                        <circle cx={x} cy={y} r="4" fill="var(--bg-primary)" stroke="var(--accent-cyan)" strokeWidth="2" />
                                        <text x={x} y={height - 4} textAnchor="middle" className="text-[10px] fill-appText opacity-50 font-semibold">{log.day}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Quick Shortcuts Side Layout panel */}
                <div className="bg-appCard p-6 rounded-xl border border-appBorder shadow-sm space-y-4">
                    <h3 className="font-bold text-appText text-base">Quick Launch Pipeline</h3>
                    <p className="text-xs text-appText/40">Launch direct workspace modules.</p>
                    
                    <div className="space-y-2 pt-2">
                        <button onClick={() => setActiveTab('materials')} className="w-full p-3 border border-appBorder rounded-xl bg-appBg/30 hover:bg-blue-500/5 hover:border-blue-500/20 text-left transition-all flex items-center justify-between group cursor-pointer">
                            <div>
                                <h4 className="text-xs font-bold text-appText">Browse Study Repositories</h4>
                                <p className="text-[11px] text-appText/40 mt-0.5">12 Active Domain Tracks Available</p>
                            </div>
                            <span className="text-appText/30 group-hover:text-appCyan transition-colors">➔</span>
                        </button>

                        <button onClick={() => setActiveTab('quiz')} className="w-full p-3 border border-appBorder rounded-xl bg-appBg/30 hover:bg-emerald-500/5 hover:border-emerald-500/20 text-left transition-all flex items-center justify-between group cursor-pointer">
                            <div>
                                <h4 className="text-xs font-bold text-appText">Take Adaptive Assessment</h4>
                                <p className="text-[11px] text-appText/40 mt-0.5">Dropdown & Difficulty Sliders Configured</p>
                            </div>
                            <span className="text-appText/30 group-hover:text-emerald-400 transition-colors">➔</span>
                        </button>

                        <button onClick={() => setActiveTab('ai-chat')} className="w-full p-3 border border-appBorder rounded-xl bg-appBg/30 hover:bg-purple-500/5 hover:border-purple-500/20 text-left transition-all flex items-center justify-between group cursor-pointer">
                            <div>
                                <h4 className="text-xs font-bold text-appText">Launch AI Interview Bot</h4>
                                <p className="text-[11px] text-appText/40 mt-0.5">Bifurcated Corporate/Resume Sub-modules</p>
                            </div>
                            <span className="text-appText/30 group-hover:text-purple-400 transition-colors">➔</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;