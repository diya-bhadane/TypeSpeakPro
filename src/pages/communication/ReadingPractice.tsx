import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mic, MicOff, RefreshCw, Volume2, BookOpen, ChevronDown, ChevronRight, Lock, Trophy, ArrowRight, Home } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { toast } from 'sonner';
import { READING_PASSAGES } from '@/data/readingPassages';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const ReadingPractice = () => {
    const navigate = useNavigate();
    const [selectedPassage, setSelectedPassage] = useState(READING_PASSAGES[0]);
    const { isListening, transcript, startListening, stopListening, resetTranscript, speak } = useSpeech('en-US');
    const [accuracy, setAccuracy] = useState(0);
    const [feedback, setFeedback] = useState<{ word: string; status: 'correct' | 'wrong' | 'pending' }[]>([]);

    // UI States
    const [expandedLevel, setExpandedLevel] = useState<string | null>('Beginner');
    const [hasAttempted, setHasAttempted] = useState(false);
    const [isPass, setIsPass] = useState(false);

    // Process transcript and compare with target text
    useEffect(() => {
        if (!selectedPassage) return;

        const flatContent = selectedPassage.content.replace(/\n/g, ' ');
        const targetWords = flatContent.split(/\s+/).filter(w => w.length > 0);
        const spokenWords = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);

        const newFeedback = targetWords.map((originalWord) => {
            const cleanTarget = originalWord.replace(/[^\w\s]/gi, '').toLowerCase();
            const isMatch = spokenWords.includes(cleanTarget);
            return {
                word: originalWord,
                status: isMatch ? 'correct' : 'pending'
            } as const;
        });

        const correctCount = newFeedback.filter(f => f.status === 'correct').length;
        const currentAccuracy = Math.round((correctCount / targetWords.length) * 100);

        setAccuracy(currentAccuracy);
        setFeedback(newFeedback);

        // Real-time pass check (optional, but requested logic is "if user pass... then show next")
        if (currentAccuracy >= 80) {
            setIsPass(true);
        }

    }, [transcript, selectedPassage]);

    const handleToggle = () => {
        if (isListening) {
            stopListening();
            setHasAttempted(true);
            if (accuracy >= 80) {
                toast.success("Great job! You passed.");
            } else {
                toast.warning("Keep trying aiming for 80% accuracy.");
            }
        } else {
            resetTranscript();
            setHasAttempted(false);
            setIsPass(false);
            startListening();
        }
    };

    const handlePassageChange = (passage: typeof READING_PASSAGES[0]) => {
        setSelectedPassage(passage);
        resetTranscript();
        setAccuracy(0);
        setFeedback([]);
        setHasAttempted(false);
        setIsPass(false);
    };

    const handleNext = () => {
        const currentIndex = READING_PASSAGES.findIndex(p => p.id === selectedPassage.id);
        if (currentIndex < READING_PASSAGES.length - 1) {
            handlePassageChange(READING_PASSAGES[currentIndex + 1]);
        } else {
            toast.success("You've completed all passages!");
        }
    };

    const toggleLevel = (level: string) => {
        setExpandedLevel(prev => prev === level ? null : level);
    };

    // Rendering Helper
    const renderContent = () => {
        if (feedback.length === 0 && !selectedPassage) return null;

        const paragraphs = selectedPassage.content.split('\n\n');
        let globalWordIndex = 0;

        return (
            <div className="space-y-6">
                {paragraphs.map((para, pIdx) => {
                    const words = para.split(/\s+/).filter(w => w.length > 0);
                    return (
                        <p key={pIdx} className="text-xl md:text-2xl leading-relaxed font-medium text-neutral-300">
                            {words.map((word, wIdx) => {
                                const currentStatus = feedback[globalWordIndex]?.status || 'pending';
                                const displayWord = feedback[globalWordIndex]?.word || word;
                                globalWordIndex++;

                                return (
                                    <span
                                        key={wIdx}
                                        className={`mr-2 transition-colors duration-300 ${currentStatus === 'correct' ? 'text-green-400' :
                                                currentStatus === 'wrong' ? 'text-red-400' : 'text-neutral-300'
                                            }`}
                                    >
                                        {displayWord}{' '}
                                    </span>
                                );
                            })}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-teal-500/30 flex flex-col">
            <Navbar forceOpaque={true} />

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
                <div className="flex gap-4 mb-8">
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-neutral-400 pl-0"
                        onClick={() => navigate('/voice-practice/communication')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-neutral-400 pl-0"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Home
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                    {/* Sidebar: Collapsible Library */}
                    <div className="w-full lg:w-80 space-y-4">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-teal-400" /> Library
                        </h2>

                        <div className="space-y-2">
                            {LEVELS.map((level) => {
                                const levelPassages = READING_PASSAGES.filter(p => p.level === level);
                                const isExpanded = expandedLevel === level;

                                return (
                                    <div key={level} className="space-y-1">
                                        <button
                                            onClick={() => toggleLevel(level)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 transition-colors"
                                        >
                                            <span className="font-semibold">{level}</span>
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="pl-2 space-y-1 animate-in slide-in-from-top-2">
                                                {levelPassages.map(passage => (
                                                    <Card
                                                        key={passage.id}
                                                        onClick={() => handlePassageChange(passage)}
                                                        className={`cursor-pointer transition-all border-white/5 hover:bg-white/5 ${selectedPassage.id === passage.id ? 'bg-teal-500/10 border-teal-500/50' : 'bg-transparent border-transparent'}`}
                                                    >
                                                        <CardContent className="p-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className={`text-sm ${selectedPassage.id === passage.id ? 'text-teal-400 font-medium' : 'text-neutral-400'}`}>
                                                                    {passage.title}
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Practice Area */}
                    <div className="flex-1 space-y-6">
                        <Card className="bg-neutral-900/50 border-white/5 min-h-[600px] flex flex-col relative overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">{selectedPassage.title}</h1>
                                    <p className="text-neutral-400 text-sm">Read aloud. Goal: 80% accuracy to unlock next.</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-bold ${accuracy >= 80 ? 'text-green-400' : 'text-teal-400'}`}>{accuracy}%</div>
                                    <div className="text-xs text-neutral-500 uppercase tracking-widest">Accuracy</div>
                                </div>
                            </div>

                            <CardContent className="p-8 flex-1 flex flex-col gap-8 relative z-10">
                                {/* Text Display */}
                                <div className="flex-1">
                                    {renderContent()}
                                </div>

                                {/* Results Overlay (if finished) */}
                                {hasAttempted && (
                                    <div className="flex flex-col items-center justify-center p-6 bg-neutral-900/80 rounded-xl border border-white/10 backdrop-blur-sm animate-in zoom-in-95">
                                        {isPass ? (
                                            <div className="text-center space-y-4">
                                                <div className="flex items-center justify-center gap-2 text-green-400 text-xl font-bold">
                                                    <Trophy className="w-6 h-6" /> Excellent Work!
                                                </div>
                                                <p className="text-neutral-400">You achieved {accuracy}% accuracy.</p>
                                                <div className="flex gap-4 justify-center">
                                                    <Button onClick={() => { resetTranscript(); setHasAttempted(false); startListening(); }} variant="outline">
                                                        Retry
                                                        <RefreshCw className="w-4 h-4 ml-2" />
                                                    </Button>
                                                    <Button onClick={handleNext} className="bg-teal-600 hover:bg-teal-700">
                                                        Next Passage
                                                        <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <div className="text-yellow-400 text-lg font-bold">
                                                    Almost there!
                                                </div>
                                                <p className="text-neutral-400">You need 80% accuracy to proceed. Current: {accuracy}%</p>
                                                <Button onClick={() => { resetTranscript(); setHasAttempted(false); startListening(); }} variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                                                    Try Again
                                                    <RefreshCw className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Controls (Hidden if results are showing, typically) or shown below */}
                                {!hasAttempted && (
                                    <div className="mt-auto flex justify-center gap-6">
                                        <Button
                                            size="lg"
                                            onClick={handleToggle}
                                            className={`
                                                h-16 w-16 rounded-full shadow-xl transition-all duration-300
                                                ${isListening
                                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30'
                                                    : 'bg-teal-500 hover:bg-teal-600 ring-4 ring-teal-500/30'
                                                }
                                            `}
                                        >
                                            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-16 w-16 rounded-full border-white/10 hover:bg-white/10"
                                            onClick={() => speak(selectedPassage.content)}
                                            disabled={isListening}
                                            title="Listen to pronunciation"
                                        >
                                            <Volume2 className="w-6 h-6 text-blue-400" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-16 w-16 rounded-full border-white/10 hover:bg-white/10"
                                            onClick={() => { resetTranscript(); setAccuracy(0); setHasAttempted(false); }}
                                            disabled={isListening}
                                            title="Reset"
                                        >
                                            <RefreshCw className="w-6 h-6 text-neutral-400" />
                                        </Button>
                                    </div>
                                )}

                                <div className="text-center h-6">
                                    {isListening && (
                                        <p className="text-sm text-teal-400 animate-pulse">Listening... read aloud</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ReadingPractice;
