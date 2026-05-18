import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Sparkles, RefreshCw, CheckCircle, PenTool, Home } from 'lucide-react';
import { analyzeWriting, WritingAnalysisResult } from '@/services/aiAnalysis';
import { toast } from 'sonner';

const WRITING_TOPICS = [
    "Describe your ideal weekend getaway.",
    "Write an email to a colleague asking for a meeting.",
    "What are your career goals for the next 5 years?",
    "Explain the importance of time management.",
    "Write a short story about a lost key.",
    "Review your favorite movie or book.",
    "Argue for or against remote work.",
    "Describe a challenge you overcame recently."
];

const WritingPractice = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState(WRITING_TOPICS[0]);
    const [text, setText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<WritingAnalysisResult | null>(null);

    const handleNewTopic = () => {
        const random = WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
        setTopic(random);
        setResult(null);
        setText('');
    };

    const handleAnalyze = async () => {
        if (!text.trim() || text.length < 10) {
            toast.error("Please write at least 10 characters.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const data = await analyzeWriting(text, topic);
            setResult(data);
            toast.success("Analysis complete!");
        } catch (error) {
            toast.error("Failed to analyze text.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-teal-500/30 flex flex-col">
            <Navbar forceOpaque={true} />

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
                <div className="flex gap-4 mb-8">
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-muted-foreground pl-0"
                        onClick={() => navigate('/voice-practice/communication')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:text-teal-400 text-muted-foreground pl-0"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4 mr-2" /> Home
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                    {/* Left Panel: Input */}
                    <div className="flex-1 space-y-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-teal-400 text-sm font-medium uppercase tracking-wider">
                                        <PenTool className="w-4 h-4" /> Writing Prompt
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleNewTopic} className="text-muted-foreground hover:text-white">
                                        <RefreshCw className="w-4 h-4 mr-2" /> New Topic
                                    </Button>
                                </div>
                                <CardTitle className="text-xl md:text-2xl leading-relaxed">"{topic}"</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    className="min-h-[300px] bg-black/40 border-white/10 text-lg leading-relaxed resize-none focus:border-teal-500/50 p-6"
                                    placeholder="Start writing here..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                                <div className="mt-4 flex justify-between items-center text-sm text-neutral-500">
                                    <span>{text.split(/\s+/).filter(w => w.length > 0).length} words</span>
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !text}
                                        className="bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        {isAnalyzing ? (
                                            <>Analyzing <Sparkles className="w-4 h-4 ml-2 animate-spin" /></>
                                        ) : (
                                            <>Analyze Writing <Send className="w-4 h-4 ml-2" /></>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel: Analysis (only visible when result exists) */}
                    {result && (
                        <div className="w-full lg:w-[450px] space-y-6 animate-in slide-in-from-right-4">
                            {/* Score Card */}
                            <Card className="bg-neutral-900/80 border-white/5 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle>AI Feedback</CardTitle>
                                    <CardDescription>{result.feedback}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="text-2xl font-bold text-teal-400">{result.grammar_score}</div>
                                            <div className="text-[10px] uppercase text-neutral-500 mt-1">Grammar</div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="text-2xl font-bold text-purple-400">{result.vocabulary_score}</div>
                                            <div className="text-[10px] uppercase text-neutral-500 mt-1">Vocab</div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="text-2xl font-bold text-blue-400">{result.tone_score}</div>
                                            <div className="text-[10px] uppercase text-neutral-500 mt-1">Tone</div>
                                        </div>
                                    </div>

                                    {/* Corrections */}
                                    {result.corrections.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm text-neutral-300 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-red-400" /> Corrections
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.corrections.map((corr, idx) => (
                                                    <li key={idx} className="text-sm bg-red-500/10 border border-red-500/20 p-2 rounded text-red-200">
                                                        {corr}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Better Version */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm text-neutral-300 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-yellow-400" /> Improved Version
                                        </h4>
                                        <div className="text-sm bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-lg text-neutral-300 leading-relaxed italic">
                                            "{result.better_version}"
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default WritingPractice;
