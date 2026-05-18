import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import SetupScreen from './speaking/SetupScreen';
import MissionInterface from './speaking/MissionInterface';
import { UserProfile, ZONES } from '@/data/speakingGameData';
import { Card, CardContent } from '@/components/ui/card';

type GamePhase = 'LOADING' | 'SETUP' | 'MAP' | 'MISSION' | 'FEEDBACK';

const SpeakingPractice = () => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<GamePhase>('LOADING');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeZone, setActiveZone] = useState<number | null>(null);

    // Initial Load Check (Mock persistence)
    useEffect(() => {
        const savedProfile = localStorage.getItem('speaking_rpg_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            // DEBUG: Force unlock all zones if not already
            if (profile.unlockedZones.length < 5) {
                profile.unlockedZones = [1, 2, 3, 4, 5];
                localStorage.setItem('speaking_rpg_profile', JSON.stringify(profile));
            }
            setUserProfile(profile);
            setPhase('MAP');
        } else {
            setPhase('SETUP');
        }
    }, []);

    const handleSetupComplete = (profile: UserProfile) => {
        setUserProfile(profile);
        localStorage.setItem('speaking_rpg_profile', JSON.stringify(profile));
        setPhase('MAP');
    };

    const handleEnterZone = (zoneId: number) => {
        // Only allow unlocked keys
        if (userProfile?.unlockedZones.includes(zoneId)) {
            setActiveZone(zoneId);
            setPhase('MISSION');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-teal-500/30 flex flex-col">
            <Navbar forceOpaque={true} />

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12 flex flex-col relative">
                {/* Global Back Button (except in deep immersion modes maybe?) */}
                <div className="absolute top-24 left-4 z-10 flex gap-4">
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-neutral-400 pl-0"
                        onClick={() => {
                            if (phase === 'MISSION') setPhase('MAP');
                            else navigate('/voice-practice/communication');
                        }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {phase === 'MISSION' ? 'Back to Map' : 'Back to Modules'}
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-neutral-400 pl-0"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex items-center justify-center pt-12">
                    {phase === 'LOADING' && (
                        <div className="animate-pulse text-teal-400">Loading World...</div>
                    )}

                    {phase === 'SETUP' && (
                        <SetupScreen onComplete={handleSetupComplete} />
                    )}

                    {phase === 'MAP' && userProfile && (
                        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-end mb-12">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">The World Map 🌍</h1>
                                    <p className="text-neutral-400">Select a zone to start your mission, {userProfile.name}.</p>
                                </div>
                                <div className="text-right bg-neutral-900 border border-white/10 px-6 py-3 rounded-2xl">
                                    <div className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Total XP</div>
                                    <div className="text-2xl font-bold text-yellow-500 flex items-center gap-2 justify-end">
                                        {userProfile.xp} <span className="text-sm">✨</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ZONES.map((zone) => {
                                    const isUnlocked = userProfile.unlockedZones.includes(zone.id);
                                    return (
                                        <Card
                                            key={zone.id}
                                            onClick={() => handleEnterZone(zone.id)}
                                            className={`
                                                relative overflow-hidden transition-all duration-300 border-white/5
                                                ${isUnlocked
                                                    ? 'bg-neutral-900/50 hover:bg-neutral-800 cursor-pointer hover:border-teal-500/50 hover:scale-[1.02] shadow-2xl'
                                                    : 'bg-black/40 opacity-50 cursor-not-allowed grayscale'}
                                            `}
                                        >
                                            <CardContent className="p-6 flex flex-col items-center text-center h-[260px] justify-between">
                                                <div className="text-6xl mb-4 transform transition-transform duration-500 hover:rotate-12">
                                                    {zone.icon}
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-bold mb-2 text-white">{zone.name}</h3>
                                                    <p className="text-sm text-neutral-500 line-clamp-2">{zone.description}</p>
                                                </div>

                                                <div className="w-full pt-4 mt-4 border-t border-white/5">
                                                    {isUnlocked ? (
                                                        <span className="inline-flex items-center text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                                                            OPEN ZONE
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs font-bold text-neutral-500 bg-white/5 px-3 py-1 rounded-full">
                                                            LOCKED 🔒
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {phase === 'MISSION' && activeZone && (
                        <MissionInterface
                            zoneId={activeZone}
                            onExit={() => setPhase('MAP')}
                            onComplete={(score) => {
                                console.log("Mission Complete", score);
                                // Here we would update XP and show Feedback Screen
                                // For now, just go back to map with a toast
                                setUserProfile(prev => prev ? ({ ...prev, xp: prev.xp + 100 }) : null);
                                setPhase('MAP');
                            }}
                        />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SpeakingPractice;
