import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';
import { Trophy, Medal, Crown, Timer, Percent, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import UserAvatar from '@/components/UserAvatar';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    wpm: number;
    accuracy: number;
    created_at: string;
    users: {
        name: string;
        picture: string;
        country?: string;
    };
}

const getFlagEmoji = (countryCode: string = 'IN') => {
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    } catch (e) {
        return '🏳️';
    }
};

const MotionTbody = motion.tbody as any;
const MotionTr = motion.tr as any;

const Leaderboard = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaderboard();
        triggerFireworks();
    }, []);

    const triggerFireworks = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const fetchLeaderboard = async () => {
        try {
            // Fetch top results ordered by WPM desc
            const { data, error } = await supabase
                .from('test_results')
                .select(`
                    user_id,
                    wpm,
                    accuracy,
                    created_at,
                    users (
                        name,
                        picture,
                        country
                    )
                `)
                .order('wpm', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Client-side deduplication
            const uniqueEntries: { [key: string]: any } = {};
            data?.forEach((entry: any) => {
                if (!uniqueEntries[entry.user_id]) {
                    uniqueEntries[entry.user_id] = entry;
                } else {
                    if (entry.wpm > uniqueEntries[entry.user_id].wpm) {
                        uniqueEntries[entry.user_id] = entry;
                    }
                }
            });

            const sorted = Object.values(uniqueEntries)
                .sort((a: any, b: any) => b.wpm - a.wpm)
                .slice(0, 50)
                .map((entry: any, index: number) => ({
                    ...entry,
                    rank: index + 1
                }));

            setEntries(sorted);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 fill-gray-300/20" />;
        if (rank === 3) return <Medal className="w-6 h-6 text-amber-600 fill-amber-600/20" />;
        return <span className="font-mono text-neutral-500 font-bold">#{rank}</span>;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-teal-500/30 overflow-x-hidden">
            <Navbar forceOpaque={true} />

            <div className="max-w-5xl mx-auto p-6 md:p-12 pt-24 space-y-8 relative">

                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => navigate('/practice')}
                    className="absolute top-8 left-6 md:left-0 md:top-24 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center space-y-4 pt-12 md:pt-0"
                >
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 shadow-[0_0_30px_-10px_rgba(20,184,166,0.5)]">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                        Global Elite
                    </h1>
                    <p className="text-neutral-400 max-w-lg mx-auto text-lg">
                        The fastest typists in the world.
                    </p>
                </motion.div>

                {/* Table */}
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                    {/* Scanning Line Effect */}
                    <motion.div
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: "100%", opacity: [0, 1, 0] }}
                        transition={{ duration: 2, ease: "linear", repeat: 0 }}
                        className="absolute left-0 right-0 h-[2px] bg-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.5)] z-10 pointer-events-none"
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                                    <th className="p-4 pl-6 w-24 text-center">Rank</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4 text-center">WPM</th>
                                    <th className="p-4 text-center">Accuracy</th>
                                    <th className="p-4 text-right pr-6">Date</th>
                                </tr>
                            </thead>
                            <MotionTbody
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="divide-y divide-white/5"
                            >
                                {loading ? (
                                    // Skeleton Loading
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <MotionTr variants={itemVariants} key={i} className="animate-pulse">
                                            <td className="p-4"><div className="h-6 w-8 bg-white/5 rounded mx-auto" /></td>
                                            <td className="p-4"><div className="h-6 w-32 bg-white/5 rounded" /></td>
                                            <td className="p-4"><div className="h-6 w-12 bg-white/5 rounded mx-auto" /></td>
                                            <td className="p-4"><div className="h-6 w-12 bg-white/5 rounded mx-auto" /></td>
                                            <td className="p-4"><div className="h-6 w-24 bg-white/5 rounded ml-auto" /></td>
                                        </MotionTr>
                                    ))
                                ) : entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-neutral-500">
                                            No results found yet. Be the first!
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry) => (
                                        <MotionTr
                                            variants={itemVariants}
                                            key={entry.rank}
                                            className="group hover:bg-white/5 transition-colors duration-200"
                                        >
                                            <td className="p-4 pl-6 text-center">
                                                <div className="flex justify-center items-center">
                                                    {getRankIcon(entry.rank)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar
                                                        name={entry.users?.name}
                                                        src={entry.users?.picture}
                                                        className="w-10 h-10"
                                                    />
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span title={entry.users?.country || 'India'} className="text-lg leading-none select-none filter contrast-125">
                                                                {getFlagEmoji(entry.users?.country || 'IN')}
                                                            </span>
                                                            <span className="font-bold text-white group-hover:text-teal-400 transition-colors">
                                                                {entry.users?.name || 'Unknown User'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-neutral-500 font-mono">
                                                            Reign
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <Timer className="w-4 h-4 text-teal-500" />
                                                    <span className="font-mono text-xl font-bold text-teal-400">{entry.wpm}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <Percent className="w-4 h-4 text-purple-500" />
                                                    <span className={`font-mono font-bold ${entry.accuracy >= 98 ? 'text-purple-400' : 'text-neutral-400'}`}>
                                                        {entry.accuracy}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <div className="inline-flex items-center gap-2 text-neutral-500 text-sm">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                        </MotionTr>
                                    ))
                                )}
                            </MotionTbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;