import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, RefreshCw, StopCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSpeech } from '@/hooks/useSpeech';
import { PROMPTS_DATA } from '@/data/voice-practice';
import { useNavigate } from 'react-router-dom';

interface PracticeSessionProps {
    config: {
        language: string;
        mode?: string;
        role?: string;
        topic?: string;
        level?: string;
        modeType?: string;
    };
    onComplete: (results: any) => void;
    onCancel: () => void;
}

const PracticeSession = ({ config, onComplete, onCancel }: PracticeSessionProps) => {
    const navigate = useNavigate();
    const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript } = useSpeech(config.language);

    const [prompt, setPrompt] = useState('');
    const [timeLeft, setTimeLeft] = useState(60); // 60 seconds default
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let selectedPrompts: string[] = [];

        // Determine prompts based on config
        if (config.topic && config.level) {
            // Communication Flow
            const topicData = PROMPTS_DATA[config.topic];
            if (topicData) {
                selectedPrompts = topicData[config.level] || [];
            }
        } else if (config.mode && config.role) {
            // HR Flow
            const modeData = PROMPTS_DATA[config.mode];
            if (modeData) {
                selectedPrompts = modeData[config.role] || [];
            }
        }

        // Fallback or Random selection
        if (selectedPrompts.length === 0) {
            // Try to find ANY prompts if specific mapping fails, or default to a generic set
            // For safety, let's use a default if nothing matches
            selectedPrompts = ["Describe your day.", "Talk about your favorite hobby."];
        }

        const randomPrompt = selectedPrompts[Math.floor(Math.random() * selectedPrompts.length)];
        setPrompt(randomPrompt);

    }, [config]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleStop();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleToggle = () => {
        if (isListening) {
            // Pause/Stop
            stopListening();
            setIsActive(false);
        } else {
            // Start
            startListening();
            setIsActive(true);
        }
    };

    const handleStop = () => {
        stopListening();
        setIsActive(false);
        // Calculate basic stats
        const wordCount = transcript.trim().split(/\s+/).length;
        const wpm = Math.round((wordCount / (60 - timeLeft)) * 60) || 0;

        onComplete({
            transcript,
            wpm,
            duration: 60 - timeLeft,
            wordCount
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex gap-4 mb-4">
                <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-white pl-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Setup
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white pl-0">
                    <Home className="w-4 h-4 mr-2" /> Home
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <Card className="bg-neutral-900/50 border-white/5 backdrop-blur-sm min-h-[400px] flex flex-col">
                        <CardContent className="flex-1 p-6 flex flex-col">
                            {/* Prompt Header */}
                            <div className="mb-6 p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
                                <h3 className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-2">Topic</h3>
                                <p className="text-xl text-white font-medium italic">"{prompt}"</p>
                            </div>

                            {/* Transcript Area */}
                            <div className="flex-1 rounded-xl bg-black/40 border border-white/5 p-6 mb-6 overflow-y-auto text-lg leading-relaxed relative">
                                {transcript ? (
                                    <>
                                        <span className="text-white">{transcript}</span>
                                        <span className="text-white/50">{interimTranscript}</span>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                                        <p>Press the microphone and start speaking...</p>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6">
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

                                {isActive && (
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-12 w-12 rounded-full border-white/10 hover:bg-white/10"
                                        onClick={handleStop}
                                    >
                                        <StopCircle className="w-6 h-6 text-red-400" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="w-full md:w-80 space-y-6">
                    <Card className="bg-neutral-900/50 border-white/5">
                        <CardContent className="p-6 text-center">
                            <h4 className="text-muted-foreground text-sm font-medium mb-2">Time Remaining</h4>
                            <div className={`text-5xl font-mono font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
                                00:{timeLeft.toString().padStart(2, '0')}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/50 border-white/5">
                        <CardContent className="p-6 space-y-4">
                            <h4 className="text-white font-medium border-b border-white/5 pb-2">Guidelines</h4>
                            <ul className="space-y-3 text-sm text-neutral-400">
                                <li className="flex gap-2">
                                    <span className="text-teal-400">•</span>
                                    Speak clearly at a moderate pace.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-teal-400">•</span>
                                    Try to avoid filler words like "um" or "uh".
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-teal-400">•</span>
                                    Focus on the prompt topic.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PracticeSession;
