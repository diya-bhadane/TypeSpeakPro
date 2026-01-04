
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCcw, Hash, Type, AlignLeft, type LucideIcon, Pilcrow, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import TestResults from './TestResults';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import RaceTrack from './RaceTrack';
import MultiplayerModal from './MultiplayerModal';
import MultiplayerResults from './MultiplayerResults';

import {
    COMMON_WORDS, WORDS_EASY, WORDS_HARD,
    SENTENCES_EASY, SENTENCES_MEDIUM, SENTENCES_HARD,
    PARAGRAPHS_EASY, PARAGRAPHS_MEDIUM, PARAGRAPHS_HARD,
    PUNCTUATION,
    TypingMode, Difficulty,
    generateWords, generateSentences, applyTextTransformations
} from '@/lib/text-generation';

interface TypingTestProps {
    onComplete?: (stats: { wpm: number; accuracy: number; errorCount: number }) => void;
    initialMultiplayer?: boolean;
}

const TypingTest = ({ onComplete, initialMultiplayer = false }: TypingTestProps) => {
    const { user } = useAuth();
    const multiplayer = useMultiplayer(user);
    const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(initialMultiplayer);
    const [targetText, setTargetText] = useState('');
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [errorCount, setErrorCount] = useState(0);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (multiplayer.gameState === 'countdown' && multiplayer.startTime) {
            const i = setInterval(() => {
                const left = Math.ceil((multiplayer.startTime! - Date.now()) / 1000);
                setCountdown(left > 0 ? left : 0);
            }, 100);
            return () => clearInterval(i);
        }
    }, [multiplayer.gameState, multiplayer.startTime]);

    // Config State
    const [mode, setMode] = useState<TypingMode>('words');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [selectedTime, setSelectedTime] = useState(30);
    const [includeNumbers, setIncludeNumbers] = useState(false);
    const [includePunctuation, setIncludePunctuation] = useState(false);

    const [isFinished, setIsFinished] = useState(false);
    const [history, setHistory] = useState<{ time: number; wpm: number; raw: number }[]>([]);

    // Automatically open multiplayer modal if prop passed OR if URL has ?room=
    // Automatically open multiplayer modal if prop passed OR if URL has ?room=
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomCodeParam = params.get('room');

        if (initialMultiplayer || roomCodeParam) {
            // Short delay to ensure Radix Dialog can attach to DOM properly on fresh mount
            setTimeout(() => {
                setIsMultiplayerOpen(true);
            }, 100);

            if (roomCodeParam && !multiplayer.roomCode) {
                multiplayer.joinRoom(roomCodeParam);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [initialMultiplayer]);

    // Update Room Config when Host changes settings
    useEffect(() => {
        if (multiplayer.isHost && multiplayer.roomCode) {
            const config = {
                text: targetText, // Note: This might need to be generated *before* broadcasting
                mode,
                duration: selectedTime,
                difficulty
            };
            // multiplayer.broadcastConfig(config); // Uncomment when ready to sync
        }
    }, [targetText, mode, selectedTime, difficulty, multiplayer.isHost, multiplayer.roomCode]);

    // Sync Local State with Room Config (Clients)
    useEffect(() => {
        if (multiplayer.roomConfig && !multiplayer.isHost) {
            setMode(multiplayer.roomConfig.mode);
            setDifficulty(multiplayer.roomConfig.difficulty);
            setSelectedTime(multiplayer.roomConfig.duration);
            setTargetText(multiplayer.roomConfig.text);

            // Force reset local test state
            setUserInput('');
            setStartTime(null);
            setTimeLeft(multiplayer.roomConfig.duration);
            setIsActive(false);
            setWpm(0);
            setAccuracy(100);
        }
    }, [multiplayer.roomConfig, multiplayer.isHost]);


    // Handle Game Start Countdown
    useEffect(() => {
        if (multiplayer.gameState === 'countdown' && multiplayer.startTime) {
            // Ensure everything is reset
            setUserInput('');
            setWpm(0);
            setAccuracy(100);
            setIsFinished(false);
            setIsActive(false);

            // The actual "start" happens when countdown hits 0 (handled in UI or separate effect)
        }
    }, [multiplayer.gameState, multiplayer.startTime]);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Initialize test
    useEffect(() => {
        resetTest();
    }, [selectedTime, includeNumbers, includePunctuation, mode, difficulty]);

    const resetTest = () => {
        let text = '';
        if (mode === 'words') {
            text = generateWords(100, includeNumbers, includePunctuation, difficulty);
        } else if (mode === 'sentences') {
            const rawText = generateSentences(100, difficulty);
            text = applyTextTransformations(rawText, includeNumbers, includePunctuation);
        } else {
            // Paragraph Mode
            let sourceParagraphs = PARAGRAPHS_MEDIUM;
            if (difficulty === 'easy') sourceParagraphs = PARAGRAPHS_EASY;
            if (difficulty === 'hard') sourceParagraphs = PARAGRAPHS_HARD;

            const rawText = sourceParagraphs[Math.floor(Math.random() * sourceParagraphs.length)];
            text = applyTextTransformations(rawText, includeNumbers, includePunctuation);
        }

        setTargetText(text);
        setUserInput('');
        setStartTime(null);
        setTimeLeft(selectedTime);
        setIsActive(false);
        setIsFinished(false);
        setWpm(0);
        setAccuracy(100);
        setErrorCount(0);
        setHistory([]);
        if (inputRef.current) inputRef.current.focus();
    };

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endTest();
                        return 0;
                    }
                    return prev - 1;
                });

                // Record history
                setHistory(prev => {
                    const timeElapsed = selectedTime - (timeLeft - 1);
                    return [...prev, { time: timeElapsed, wpm, raw: wpm }];
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Update WPM and Accuracy live
    useEffect(() => {
        if (isActive && startTime) {
            const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
            const wordsTyped = userInput.length / 5;
            const currentWpm = Math.round(wordsTyped / timeElapsed) || 0;

            setWpm(currentWpm);

            // Calculate accuracy
            let errors = 0;
            for (let i = 0; i < userInput.length; i++) {
                if (userInput[i] !== targetText[i]) errors++;
            }
            const acc = Math.max(0, Math.round(((userInput.length - errors) / userInput.length) * 100));
            setAccuracy(acc || 100);
            setErrorCount(errors);
        }
    }, [userInput, startTime, isActive]);



    const endTest = async () => {
        setIsActive(false);
        setIsFinished(true);

        // Save to Supabase if user is logged in
        // Save to Supabase if user is logged in
        console.log("EndTest called. User:", user);

        if (user?.id) {
            console.log("Attempting to save result to Supabase...", {
                user_id: user.id,
                wpm,
                accuracy,
                errorCount,
                time: selectedTime,
                mode
            });

            try {
                const { data, error } = await supabase
                    .from('test_results')
                    .insert({
                        user_id: user.id,
                        wpm: wpm,
                        accuracy: accuracy,
                        error_count: errorCount,
                        time_duration: selectedTime,
                        mode: mode
                    })
                    .select();

                if (error) {
                    console.error("Supabase SAVE ERROR:", error);
                    // Don't toast error to user if it's just a config issue, maybe silent fail or debug log
                    // toast.error(`Failed to save history: ${error.message}`); 
                } else {
                    console.log("Result saved successfully!", data);
                    toast.success("Result saved to history!");
                }
            } catch (err) {
                console.error("Unexpected error saving result:", err);
                // Prevent crash
            }
        } else {
            console.warn("User ID missing, cannot save result. User object:", user);
            if (user) {
                toast.warning("Not connected to database (User ID missing).");
            }
        }

        if (onComplete) {
            onComplete({ wpm, accuracy, errorCount });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!isActive && value.length === 1) {
            setStartTime(Date.now());
            setIsActive(true);
        }

        setUserInput(value);

        // Auto-scroll logic if needed (already implemented via useEffect below)
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            resetTest();
        }
    };

    // Calculate active character position for auto-scroll
    const [activeCharIndex, setActiveCharIndex] = useState(0);
    const activeCharRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setActiveCharIndex(userInput.length);

        // Scroll logic: Keep active line ~2nd line
        if (activeCharRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeChar = activeCharRef.current;

            // Simple logic: Scroll active char into view with some padding
            const containerRect = container.getBoundingClientRect();
            const charRect = activeChar.getBoundingClientRect();

            const relativeTop = charRect.top - containerRect.top;
            const lineHeight = 64; // approx 4rem

            // If character is below the 2nd line, scroll
            if (relativeTop > lineHeight * 2) {
                container.scrollTo({
                    top: container.scrollTop + lineHeight,
                    behavior: 'smooth'
                });
            } else if (relativeTop < lineHeight) {
                // Check if we need to scroll up (backspacing)
                container.scrollTo({
                    top: container.scrollTop - lineHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [userInput]);

    // Render text with specific coloring
    const renderText = () => {
        return targetText.split('').map((char, index) => {
            // Colors: Untyped = very muted, Typed Correct = bright, Error = red
            let className = 'text-muted-foreground/40 transition-colors duration-200';

            if (index < userInput.length) {
                const isCorrect = char === userInput[index];
                className = isCorrect ? 'text-foreground' : 'text-red-500 bg-red-500/10';
            }

            const isCurrent = index === activeCharIndex;

            return (
                <span
                    key={index}
                    ref={isCurrent ? activeCharRef : null}
                    className={cn(className, "relative inline-block")}
                >
                    {isCurrent && (
                        <span className="absolute -left-[2px] top-1 bottom-1 w-[2px] bg-primary animate-pulse rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)]"></span>
                    )}
                    {char}
                </span>
            );
        });
    };

    return (
        <div
            className="w-full max-w-5xl mx-auto flex flex-col gap-8 outline-none relative justify-center"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            onClick={() => inputRef.current?.focus()}
        >
            {/* Website Branding */}
            <div className="absolute -top-32 left-0 flex items-center gap-3 select-none group cursor-default">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)] group-hover:shadow-[0_0_20px_-3px_rgba(20,184,166,0.5)] transition-shadow duration-300">
                    <Type className="w-6 h-6 text-teal-400" />
                </div>
                <h1 className="font-bold text-2xl tracking-tighter text-white">
                    TypeSpeak<span className="text-teal-400">Pro</span>
                </h1>
            </div>

            {/* Controls Header - Fades out config, keeps stats */}
            <div
                className="flex items-center justify-between bg-transparent p-2 absolute -top-16 left-0 right-0 z-20"
            >


                {/* Config Options - Fade out when active */}
                <div className={cn(
                    "flex gap-2 bg-secondary/30 p-1 rounded-full backdrop-blur-md border border-white/5 transition-all duration-500 ease-in-out",
                    isActive ? "opacity-0 pointer-events-none translate-y-[-10px]" : "opacity-100 translate-y-0"
                )}>
                    {/* Mode Selector */}
                    <div className="flex items-center gap-1 pr-2 border-r border-white/10 mr-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setMode('words')}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                            mode === 'words' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Type className="w-3.5 h-3.5" />
                                        <span className="sr-only">words</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Words</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setMode('sentences')}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                            mode === 'sentences' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <AlignLeft className="w-3.5 h-3.5" />
                                        <span className="sr-only">sentences</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Sentences</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button onClick={() => setMode('paragraphs')}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                            mode === 'paragraphs' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span className="font-serif">¶</span>
                                        <span className="sr-only">paragraphs</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Paragraphs</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {[15, 30, 60, 120].map(time => (
                        <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                                "text-sm font-mono transition-all duration-200 px-3 py-1 rounded-full",
                                selectedTime === time ? "bg-primary/20 text-primary font-bold shadow-glow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {time}s
                        </button>
                    ))}
                    <div className="w-[1px] h-4 bg-white/10 mx-2 self-center" />

                    {/* Punctuation/Numbers toggle for ALL modes */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIncludeNumbers(!includeNumbers)}
                            className={cn(
                                "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                includeNumbers ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Hash className="w-3.5 h-3.5" />
                            <span className="sr-only">numbers</span>
                        </button>
                        <button
                            onClick={() => setIncludePunctuation(!includePunctuation)}
                            className={cn(
                                "flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full",
                                includePunctuation ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="font-mono font-bold text-xs">@</span>
                            <span className="sr-only">punctuation</span>
                        </button>
                    </div>

                    {/* Difficulty UI for All Modes */}
                    <div className="flex items-center gap-1">
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={cn(
                                    "text-xs font-medium transition-colors px-2.5 py-1 rounded-full capitalize",
                                    difficulty === level ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="w-[1px] h-4 bg-white/10 mx-2 self-center" />

                    {/* Leaderboard Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1 rounded-full text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"
                                >
                                    <Trophy className="w-3.5 h-3.5" />
                                    <span className="sr-only">Leaderboard</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Leaderboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Live Stats - ALWAYS VISIBLE (but subtle) */}
                <div className="flex items-center gap-6 text-xl font-mono transition-opacity duration-300">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Time</span>
                        <span className="text-primary font-bold text-2xl">{timeLeft}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">WPM</span>
                        <span className="text-foreground font-bold text-2xl">{wpm}</span>
                    </div>
                </div>
            </div>

            {/* Multiplayer Race Track */}
            {multiplayer.roomCode && (
                <div className="mb-8">
                    <RaceTrack players={multiplayer.players} currentUserId={user?.id} />
                </div>
            )}

            {/* Results Modal */}
            {multiplayer.roomCode ? (
                <MultiplayerResults
                    open={isFinished}
                    onOpenChange={setIsFinished}
                    multiplayer={multiplayer}
                    onRestart={() => {
                        resetTest();
                    }}
                    results={{
                        wpm,
                        accuracy,
                        time: selectedTime,
                        errorCount
                    }}
                />
            ) : (
                <TestResults
                    open={isFinished}
                    onOpenChange={setIsFinished}
                    stats={{
                        wpm,
                        accuracy,
                        errorCount,
                        time: selectedTime,
                        history
                    }}
                    onRestart={resetTest}
                />
            )}

            {/* Typing Area - 5 Lines Fixed Height (approx 20rem/320px) with overflow-hidden */}
            <div
                ref={containerRef}
                className={cn(
                    "relative h-[280px] w-full overflow-hidden flex items-start justify-start text-3xl leading-[4rem] tracking-wide font-mono outline-none cursor-default rounded-xl bg-black/20 p-4 border border-white/5",
                    isFinished ? "blur-sm opacity-50 grayscale pointer-events-none" : ""
                )}
            >
                {/* Text Display */}
                <div
                    className="relative z-10 break-words pointer-events-none select-none w-full whitespace-pre-wrap tracking-wide"
                    style={{ wordSpacing: '0.1em' }}
                >
                    {renderText()}
                </div>

                {/* Hidden Input field to capture typing */}
                <input
                    ref={inputRef}
                    type="text"
                    className="absolute opacity-0 inset-0 cursor-default"
                    value={userInput}
                    onChange={handleInputChange}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    disabled={isFinished || (!!multiplayer.roomCode && multiplayer.gameState !== 'racing')}
                />
            </div>

            {/* Results Modal Overlay */}


            <div className="flex justify-center pt-8">
                <Button variant="ghost" size="lg" onClick={resetTest} className="opacity-50 hover:opacity-100 transition-opacity">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart Test
                </Button>
            </div>
            <MultiplayerModal
                open={isMultiplayerOpen}
                onOpenChange={setIsMultiplayerOpen}
                multiplayer={multiplayer}
            />

            {/* Countdown Overlay */}
            {multiplayer.gameState === 'countdown' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="text-[12rem] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 animate-pulse tracking-tighter drop-shadow-2xl">
                        {countdown}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TypingTest;