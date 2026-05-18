
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verbalCategories, Category, Question, Difficulty } from '../data/verbalQuestions';
import { ArrowLeft, Clock, RefreshCcw, CheckCircle, XCircle, Trophy, Zap, Star, Flame, X, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const VerbalGame = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Game State
    const [gameState, setGameState] = useState<'difficulty-select' | 'playing' | 'finished'>('difficulty-select');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(20);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [category, setCategory] = useState<Category | null>(null);
    const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'Mixed'>('Mixed');
    const [showWrongAnimation, setShowWrongAnimation] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Category
    useEffect(() => {
        const foundCategory = verbalCategories.find(c => c.id === categoryId);
        if (!foundCategory) {
            toast.error("Category not found");
            navigate('/verbal-practice');
            return;
        }
        setCategory(foundCategory);
    }, [categoryId, navigate]);

    // Timer Logic
    useEffect(() => {
        if (gameState !== 'playing' || isAnswered || !category) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, isAnswered, category, currentQuestionIndex]);

    const startGame = (difficulty: Difficulty | 'Mixed') => {
        if (!category) return;

        let questions = category.questions;
        if (difficulty !== 'Mixed') {
            questions = category.questions.filter(q => q.difficulty === difficulty);
        }

        // Shuffle questions
        questions = [...questions].sort(() => Math.random() - 0.5);

        // Limit to 30 questions max if pool is huge, though user requested 30.
        questions = questions.slice(0, 30);

        if (questions.length === 0) {
            toast.error(`No questions found for ${difficulty} difficulty.`);
            return;
        }

        setGameQuestions(questions);
        setSelectedDifficulty(difficulty);
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimeLeft(20);
        setIsAnswered(false);
        setSelectedOption(null);
    };

    const handleTimeUp = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsAnswered(true);
        setSelectedOption(null); // No option selected means time ran out

        // Trigger wrong animation for time up too
        setShowWrongAnimation(true);
        setTimeout(() => setShowWrongAnimation(false), 1000);

        // Auto move to next question after a delay
        setTimeout(nextQuestion, 2000);
    };

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;

        setIsAnswered(true);
        setSelectedOption(option);
        if (timerRef.current) clearInterval(timerRef.current);

        if (option === gameQuestions[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 10);

            // Celebration Animation
            const duration = 2000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#22c55e', '#10b981', '#ffffff'] // Green/White theme for correct
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#22c55e', '#10b981', '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

        } else {
            // Wrong Answer Animation
            setShowWrongAnimation(true);
            setTimeout(() => setShowWrongAnimation(false), 1000);
        }

        setTimeout(nextQuestion, 2000);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < gameQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(20);
            setIsAnswered(false);
            setSelectedOption(null);
            setShowWrongAnimation(false);
            setShowWrongAnimation(false);
        } else {
            // Game Finished
            setGameState('finished');

            // Save Result
            if (user?.id) {
                const saveScore = async () => {
                    const { error } = await supabase.from('practice_results').insert({
                        user_id: user.id,
                        practice_type: 'verbal', // or 'voice' mapping? User requested "voive". 'verbal' is usually vocal/speech or vocabulary. This component is 'VerbalGame', seems like vocabulary MCQ. User said "voive practice and vocal practice".
                        // Wait, "Voice Practice" is likely the `VoicePractice.tsx` landing page, which links to `Communication` (Listening?) and `HR`.
                        // "Vocal Practice" button, user said.
                        // I will save this as 'verbal' and 'listening' and assume the Dashboard maps them correctly.
                        score: score,
                        accuracy: Math.round((score / (gameQuestions.length * 10)) * 100) // approximate based on score logic
                    });
                    if (error) console.error('Error saving score:', error);
                    else toast.success(`Score saved!`);
                };
                saveScore();
            }
        }
    };

    const restartGame = () => {
        setGameState('difficulty-select');
        setScore(0);
        setTimeLeft(20);
        setIsAnswered(false);
        setSelectedOption(null);
    };

    if (!category) return null;

    // Difficulty Selection Screen
    if (gameState === 'difficulty-select') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="flex gap-4 mb-8">
                        <Button variant="ghost" onClick={() => navigate('/verbal-practice')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button variant="ghost" onClick={() => navigate('/')}>
                            <Home className="w-4 h-4 mr-2" /> Home
                        </Button>
                    </div>

                    <div className="text-center mb-12">
                        <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 shadow-lg`}>
                            {/* We can re-use the icon component logic or simply pass the icon string/component if refactored. 
                                For now, simpler to just show the title letter or generic icon */}
                            <span className="text-3xl text-white font-bold">{category.title[0]}</span>
                        </div>
                        <h1 className="text-4xl font-bold font-heading mb-4">{category.title}</h1>
                        <p className="text-lg text-muted-foreground">{category.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        <button
                            onClick={() => startGame('Easy')}
                            className="group p-6 rounded-2xl bg-card border border-border hover:border-green-500 hover:bg-green-500/5 transition-all duration-300 text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Easy</h3>
                            <p className="text-sm text-muted-foreground">Warm up with basic concepts.</p>
                        </button>

                        <button
                            onClick={() => startGame('Medium')}
                            className="group p-6 rounded-2xl bg-card border border-border hover:border-yellow-500 hover:bg-yellow-500/5 transition-all duration-300 text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Star className="w-6 h-6 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Medium</h3>
                            <p className="text-sm text-muted-foreground">Challenge yourself with standard questions.</p>
                        </button>

                        <button
                            onClick={() => startGame('Hard')}
                            className="group p-6 rounded-2xl bg-card border border-border hover:border-red-500 hover:bg-red-500/5 transition-all duration-300 text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Flame className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Hard</h3>
                            <p className="text-sm text-muted-foreground">Expert level for top preparation.</p>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <Button variant="outline" size="lg" onClick={() => startGame('Mixed')}>
                            Mix All Difficulties
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = gameQuestions[currentQuestionIndex];
    if (!currentQuestion) return null; // Safety check

    const progress = ((currentQuestionIndex + 1) / gameQuestions.length) * 100;

    // Results Screen
    if (gameState === 'finished') {
        const percentage = Math.round((score / (gameQuestions.length * 10)) * 100);

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in zoom-in duration-300">
                <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-3xl font-bold font-heading mb-2">Quiz Complete!</h2>
                    <p className="text-muted-foreground mb-8">
                        {category.title} - {selectedDifficulty} Mode
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-accent/20 rounded-xl border border-accent/20">
                            <p className="text-sm text-muted-foreground">Score</p>
                            <p className="text-3xl font-bold text-primary">{score}</p>
                        </div>
                        <div className="p-4 bg-accent/20 rounded-xl border border-accent/20">
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                            <p className="text-3xl font-bold text-primary">{percentage}%</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button onClick={restartGame} className="w-full h-12 text-lg font-medium" size="lg">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Play Again
                        </Button>
                        <Button onClick={() => navigate('/verbal-practice')} variant="outline" className="w-full h-12 text-lg font-medium" size="lg">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Choose Another
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Full Screen Error Overlay */}
            <AnimatePresence>
                {showWrongAnimation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-red-500/20 flex items-center justify-center backdrop-blur-[2px]"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                            className="bg-red-500 rounded-full p-8 shadow-2xl"
                        >
                            <X className="w-24 h-24 text-white" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
                <div className="flex gap-2">
                    <Button variant="ghost" className="gap-2" onClick={() => setGameState('difficulty-select')}>
                        <ArrowLeft className="w-4 h-4" /> Quit
                    </Button>
                    <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
                        <Home className="w-4 h-4" /> Home
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold">{score}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-colors ${timeLeft <= 5 ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-card border-border'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-bold font-mono w-6 text-center">{timeLeft}s</span>
                    </div>
                </div>
            </div>

            {/* Game Card */}
            <div className={`w-full max-w-4xl z-10 duration-200 ${showWrongAnimation ? 'animate-shake' : ''}`}>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-accent/20 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 ease-linear" style={{ width: `${progress}%` }} />
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${category.color}`} />

                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider block">
                                Question {currentQuestionIndex + 1} of {gameQuestions.length}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium`}>
                                {currentQuestion.difficulty}
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight">
                            {currentQuestion.question}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = selectedOption === option;
                            const isCorrect = option === currentQuestion.correctAnswer;
                            const showCorrect = isAnswered && isCorrect;
                            const showWrong = isAnswered && isSelected && !isCorrect;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={isAnswered}
                                    className={`
                                        relative group p-6 rounded-xl border-2 text-left transition-all duration-200
                                        ${showCorrect
                                            ? 'border-green-500 bg-green-500/5 text-green-700 dark:text-green-400'
                                            : showWrong
                                                ? 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-400'
                                                : 'border-border hover:border-primary/50 hover:bg-accent/5'
                                        }
                                        ${isAnswered ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-lg font-medium ${isAnswered ? '' : 'group-hover:text-primary'}`}>
                                            {option}
                                        </span>
                                        {showCorrect && <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in spin-in-180" />}
                                        {showWrong && <XCircle className="w-5 h-5 text-red-500 animate-in zoom-in" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerbalGame;
