import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, theme, toggleTheme }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'materials', label: 'Study Material', icon: '📚' },
        { id: 'quiz', label: 'Adaptive Quiz', icon: '📝' },
        { id: 'ai-chat', label: 'AI Mock Interview', icon: '🤖' }
    ];

    return (
        <div className="w-64 bg-appCard text-appText h-screen fixed top-0 left-0 flex flex-col justify-between border-r border-appBorder z-50 transition-colors">
            <div className="p-6">
                <h1 className="text-2xl font-extrabold tracking-wider border-b border-appBorder pb-4 bg-gradient-to-r from-appCyan to-appGold bg-clip-text text-transparent">
                    PrepAI Platform
                </h1>
                
                <nav className="mt-8 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all relative overflow-hidden ${
                                    isActive
                                        ? 'bg-appCyan text-slate-950 shadow-lg shadow-appCyan/20 transform scale-[1.02]'
                                        : 'hover:bg-appBorder text-appText/70 hover:text-appText'
                                }`}
                            >
                                <span className="z-10">{item.icon}</span>
                                <span className="z-10">{item.label}</span>
                                {isActive && (
                                    <span className="absolute right-2 w-1.5 h-6 bg-appGold rounded-full animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            {/* Theme Customizer Panel */}
            <div className="p-4 border-t border-appBorder space-y-3">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-appText/50">Theme Mode</span>
                    <button 
                        onClick={toggleTheme}
                        type="button"
                        className="px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs rounded-lg transition-all border border-appBorder active:scale-95 cursor-pointer"
                    >
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>
                </div>
                <div className="text-[10px] text-appText/40 text-center font-mono">
                    Anime.js Visual Engine Active
                </div>
            </div>
        </div>
    );
};

export default Sidebar;