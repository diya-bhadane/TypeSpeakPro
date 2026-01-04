import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Zap, Swords, X, Keyboard, Trophy, Menu, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TypingTest from '@/components/typing/TypingTest';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Practice = () => {
    const navigate = useNavigate();
    const [selectedMode, setSelectedMode] = useState<'solo' | 'multiplayer' | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 relative overflow-hidden">

            {/* Header: Logo (left) and Menu (right) */}
            {selectedMode !== null && (
                <header className="absolute top-0 left-0 right-0 p-6 flex justify-end items-center z-50">
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                        {/* Simple Menu Dropdown */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-lg shadow-xl p-2 animate-in fade-in slide-in-from-top-2 flex flex-col gap-1 z-50">
                                <Button variant="ghost" className="justify-start" onClick={() => navigate('/')}>
                                    Home
                                </Button>
                                <Button variant="ghost" className="justify-start" onClick={() => navigate('/dashboard')}>
                                    Dashboard
                                </Button>
                                <Button variant="ghost" className="justify-start text-red-400 hover:text-red-400 hover:bg-red-400/10" onClick={() => setSelectedMode(null)}>
                                    Exit Mode
                                </Button>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* Navbar for Mode Selection Screen Only */}
            {selectedMode === null && <Navbar />}

            {/* Subtle Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] opacity-20 animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[128px] opacity-20 animate-pulse-slow delay-1000"></div>
            </div>



            <main className={`flex-1 flex flex-col items-center px-4 sm:px-8 relative w-full max-w-7xl mx-auto ${selectedMode ? 'justify-center min-h-screen pt-0' : 'pt-20'} pb-12`}>

                {/* Hero Section */}
                {selectedMode === null && (
                    <div className="text-center mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-secondary/50 border border-white/5 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">Premium Typing Experience</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
                            Master Your <span className="text-teal-400">Keystrokes</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Challenge yourself to improve speed and accuracy. Compete with friends in real-time or practice solo with detailed analytics.
                        </p>
                    </div>
                )}

                {selectedMode === null ? (
                    // Mode Selection Screen
                    <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
                        {/* Solo Mode Card */}
                        <div
                            onClick={() => setSelectedMode('solo')}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all cursor-pointer hover:border-primary/50 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10 flex flex-col h-full gap-6">
                                <div className="p-4 w-fit rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300 ring-1 ring-primary/20">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">Solo Practice</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Focus on your own speed and accuracy. Customize your test settings and track your personal progress.
                                    </p>
                                </div>
                                <div className="mt-auto pt-4 flex items-center text-primary font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    Start Session <Zap className="w-4 h-4 ml-2 fill-current" />
                                </div>
                            </div>
                        </div>

                        {/* Multiplayer Mode Card */}
                        <div
                            onClick={() => setSelectedMode('multiplayer')}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all cursor-pointer hover:border-teal-500/50 hover:shadow-[0_0_40px_-10px_rgba(45,212,191,0.1)] hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10 flex flex-col h-full gap-6">
                                <div className="p-4 w-fit rounded-2xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform duration-300 ring-1 ring-teal-500/20">
                                    <Swords className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-teal-400 transition-colors">Ranked Race</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Challenge friends or compete against others in real-time. Synced words, live progress tracking.
                                    </p>
                                </div>
                                <div className="mt-auto pt-4 flex items-center text-teal-400 font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    Create or Join Room <Users className="w-4 h-4 ml-2 fill-current" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Typing Test Component (Centered)
                    <div className="w-full max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Removed local toolbar, now using global header/sidebar */}
                        <TypingTest initialMultiplayer={selectedMode === 'multiplayer'} />

                        {/* Centered Restart / additional controls could go here if not in TypingTest */}
                    </div>
                )}
            </main>

            {selectedMode === null && <Footer />}
        </div>
    );
};

export default Practice;