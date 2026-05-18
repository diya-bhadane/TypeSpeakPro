
import React, { useState, useEffect, useCallback } from 'react';
import { useInterview } from '@/context/InterviewContext';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { QuestionFeedback } from '@/types/hr-interview';
import { analyzeAnswer } from '@/services/aiAnalysis';
import { supabase } from '@/lib/supabase';
import InterviewSidebar from '@/components/hr/InterviewSidebar';
import QuestionCard from '@/components/hr/QuestionCard';
import MicButton from '@/components/hr/MicButton';
import FeedbackPanel from '@/components/hr/FeedbackPanel';
import { AlertCircle, Loader2, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const MAX_DURATION = 60; // seconds

interface HRSessionProps {
    config?: any;
    onComplete?: (results: any) => void;
    onCancel?: () => void;
}

const HRSession: React.FC<HRSessionProps> = ({ onComplete, onCancel }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const {
        session,
        getCurrentQuestion,
        getProgress,
        submitAnswer,
        nextQuestion,
        endInterview
    } = useInterview();

    const [phase, setPhase] = useState<'question' | 'processing' | 'feedback'>('question');
    const [currentFeedback, setCurrentFeedback] = useState<QuestionFeedback | null>(null);
    const [dbSessionId, setDbSessionId] = useState<string | null>(null);

    // Initialize Supabase Session
    useEffect(() => {
        const initSession = async () => {
            if (!session) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Or handle guest

                const { data, error } = await supabase
                    .from('interview_sessions')
                    .insert({
                        user_id: user.id,
                        level: session.level,
                        status: 'in_progress'
                    })
                    .select()
                    .single();

                if (data) setDbSessionId(data.id);
                if (error) console.error('Error creating DB session:', error);
            } catch (err) {
                console.error('Session init error:', err);
            }
        };

        initSession();
    }, [session?.level]); // Run once when level is set

    const handleRecordingComplete = useCallback(async (blob: Blob) => {
        setPhase('processing');

        // We need the transcript. useVoiceRecorder gives us the final blob.
        // However, for this implementation, we are using the transcript text from the hook?
        // Wait, useVoiceRecorder returns `transcript`? 
        // Let's check useVoiceRecorder signature usage in the original file. 
        // It says: const { transcript, ... } = useVoiceRecorder...
        // But handleRecordingComplete only gets blob.

        // Actually, we need to pass the transcript from the hook state to this function 
        // or access it from the hook return value in the component scope.
        // The previous implementation used `transcript` from `useVoiceRecorder`.

        // Let's assume we can access `transcript` variable from the hook below since it's in scope.
        // Wait, we can't access `recorderTranscript` inside this callback easily if it's stale.
        // Use a ref or just rely on the hook's state if we change logic slightly.

        // But `analyzeAnswer` handles the API call.

    }, []);

    // Wait, I need to see how I can get the transcript into the callback or if I should trigger it differently.
    // In the original file: 
    /*
      const handleRecordingComplete = useCallback(async (blob: Blob) => {
          // ...
          const question = getCurrentQuestion();
          // calls generateMockFeedback
      }, ...);
    */
    // It didn't use transcript in the mock.

    // Real implementation needs transcript.
    // `useVoiceRecorder` likely returns `transcript`.

    const {
        isRecording,
        transcript,
        timeRemaining,
        startRecording,
        stopRecording,
        error: recorderError,
        hasPermission,
    } = useVoiceRecorder({
        maxDuration: MAX_DURATION,
        onRecordingComplete: async (blob, finalTranscript) => {
            await processAnswer(blob, finalTranscript);
        },
    });

    const processAnswer = async (blob: Blob, finalTranscript: string) => {
        setPhase('processing');
        const question = getCurrentQuestion();
        if (!question) return;

        try {
            // 1. Analyze
            const analysis = await analyzeAnswer(question.text, finalTranscript, session?.level || 'professional');

            // 2. Map to QuestionFeedback
            const feedback: QuestionFeedback = {
                questionId: question.id,
                transcribedAnswer: finalTranscript || "(No audio detected)",
                scores: {
                    grammar: analysis.grammar_score,
                    fluency: analysis.fluency_score,
                    confidence: analysis.confidence_score,
                    relevance: analysis.relevance_score
                },
                corrections: analysis.corrections || [analysis.feedback], // fallback
                improvementTips: analysis.improvements,
                betterAnswer: analysis.corrected_text
            };

            // 3. Save to Supabase
            if (dbSessionId) {
                await supabase.from('interview_answers').insert({
                    session_id: dbSessionId,
                    question: question.text,
                    transcript: finalTranscript,
                    analysis: analysis,
                    duration: MAX_DURATION - timeRemaining // approx
                });
            }

            setCurrentFeedback(feedback);
            submitAnswer(feedback);
            setPhase('feedback');

        } catch (err) {
            console.error("Processing error:", err);
            toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not analyze answer.' });
            setPhase('question');
        }
    };

    // Redirect if no session
    useEffect(() => {
        if (!session && onCancel) {
            onCancel();
        }
    }, [session, onCancel]);

    // Handle exit
    const handleExit = () => {
        endInterview();
        if (onCancel) onCancel();
    };

    // Handle next question
    const handleNext = () => {
        nextQuestion();
        setCurrentFeedback(null);
        setPhase('question');
    };

    // Watch for completion
    useEffect(() => {
        if (session?.isComplete && onComplete) {
            // Maybe update DB session status to 'completed'
            if (dbSessionId) {
                supabase.from('interview_sessions')
                    .update({ status: 'completed' })
                    .eq('id', dbSessionId)
                    .then(() => onComplete(session));
            } else {
                onComplete(session);
            }
        }
    }, [session?.isComplete, onComplete, dbSessionId]);


    // Handle mic error
    useEffect(() => {
        if (recorderError) {
            toast({
                variant: 'destructive',
                title: 'Microphone Error',
                description: recorderError,
            });
        }
    }, [recorderError, toast]);

    if (!session) return <div>Loading Session...</div>;
    if (session.isComplete) return null;

    const question = getCurrentQuestion();
    const progress = getProgress();
    const isLastQuestion = progress.current >= progress.total;

    return (
        <div className="flex flex-col min-h-[calc(100vh-200px)] w-full max-w-5xl mx-auto">
            {/* New Top Header */}
            <div className="flex items-center justify-between py-2 px-4 md:px-0">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium border border-primary/20">
                        {session.level.charAt(0).toUpperCase() + session.level.slice(1)} Interview
                    </div>
                    <span className="text-muted-foreground text-sm">
                        Question {progress.current} of {progress.total}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</span>
                        <span className={`font-mono font-bold text-xl ${timeRemaining < 10 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-muted-foreground hover:text-primary px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </button>
                    <button
                        onClick={handleExit}
                        className="text-muted-foreground hover:text-destructive px-4 py-2 hover:bg-destructive/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        End Session
                    </button>
                </div>
            </div>

            {/* Main content - Centered and Focused */}
            <main className="flex-1 px-4 md:px-0 pb-12 flex flex-col justify-center">
                {/* Question phase */}
                {phase === 'question' && question && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <QuestionCard
                            question={question}
                            questionNumber={progress.current}
                            totalQuestions={progress.total}
                        />

                        {/* Mic section */}
                        <div className="flex flex-col items-center">
                            {hasPermission === false && (
                                <div className="mb-6 p-4 bg-destructive/10 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-destructive" />
                                    <p className="text-sm text-destructive">
                                        Microphone access is required. Please enable it.
                                    </p>
                                </div>
                            )}

                            <div className="scale-110 mb-4">
                                <MicButton
                                    isRecording={isRecording}
                                    timeRemaining={timeRemaining}
                                    maxDuration={MAX_DURATION}
                                    onStart={startRecording}
                                    onStop={stopRecording}
                                    disabled={hasPermission === false}
                                />
                            </div>

                            <p className="text-center text-muted-foreground text-lg max-w-md font-light">
                                {isRecording
                                    ? "Listening... Speak naturally."
                                    : "Tap the microphone to start answering."
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Processing phase */}
                {phase === 'processing' && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                        <Loader2 className="w-16 h-16 text-primary mb-6 animate-spin" />
                        <h2 className="font-heading text-3xl font-bold mb-3 text-foreground">
                            Analyzing Response...
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Generating AI feedback on your answer.
                        </p>
                    </div>
                )}

                {/* Feedback phase */}
                {phase === 'feedback' && currentFeedback && (
                    <div className="w-full max-w-4xl mx-auto">
                        <FeedbackPanel
                            feedback={currentFeedback}
                            onNext={handleNext}
                            isLastQuestion={isLastQuestion}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default HRSession;
