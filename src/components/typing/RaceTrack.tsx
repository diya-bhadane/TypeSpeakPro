import React from 'react';
import { Player } from '@/hooks/useMultiplayer';
import { cn } from '@/lib/utils';
import { Flag, Trophy } from 'lucide-react';
import UserAvatar from '../UserAvatar';

interface RaceTrackProps {
    players: Player[];
    currentUserId?: string;
}

const RaceTrack = ({ players, currentUserId }: RaceTrackProps) => {
    // Sort players: Finished players first (by Rank), then by Progress descending
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.progress === 100 && b.progress === 100) return (a.rank || 999) - (b.rank || 999);
        return b.progress - a.progress;
    });

    return (
        <div className="w-full bg-black/40 border border-white/5 rounded-xl p-6 space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                <span>Racers</span>
                <span>Track</span>
            </div>

            <div className="space-y-4">
                {sortedPlayers.map((player) => {
                    const isMe = player.id === currentUserId;
                    const isFinished = player.progress >= 100;

                    return (
                        <div
                            key={player.id}
                            className={cn(
                                "relative flex items-center gap-4 p-3 rounded-lg transition-all duration-300 border",
                                isMe
                                    ? "bg-white/5 border-primary/30 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                            )}
                        >
                            {/* Player Info (Left) */}
                            <div className="w-40 flex items-center gap-3 shrink-0">
                                <div className="relative">
                                    <UserAvatar
                                        src={player.avatarUrl}
                                        name={player.name}
                                        className="w-10 h-10 border-2"
                                        showBorder={false}
                                    />
                                    {/* Rank Badge */}
                                    {isFinished && player.rank && player.rank <= 3 && (
                                        <div className={cn(
                                            "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-black/50 shadow-md",
                                            player.rank === 1 ? "bg-yellow-400 text-black" :
                                                player.rank === 2 ? "bg-slate-300 text-black" :
                                                    "bg-amber-600 text-white"
                                        )}>
                                            {player.rank}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "text-sm font-bold truncate",
                                        isMe ? "text-primary" : "text-foreground"
                                    )}>
                                        {player.name} {isMe && "(You)"}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {Math.round(player.wpm)} WPM
                                    </span>
                                </div>
                            </div>

                            {/* The Track (Center) */}
                            <div className="flex-1 relative h-10 flex items-center">
                                {/* Track Line */}
                                <div className="absolute left-0 right-0 h-2 bg-secondary/50 rounded-full overflow-hidden">
                                    {/* Filled portion for visual effect */}
                                    <div
                                        className="h-full transition-all duration-300 ease-out opacity-40 bg-current"
                                        style={{
                                            width: `${player.progress}%`,
                                            color: player.color || 'var(--primary)'
                                        }}
                                    />
                                </div>

                                {/* Moving Avatar/Indicator */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10"
                                    style={{ left: `calc(${player.progress}% - 12px)` }} // Offset to center marker
                                >
                                    <div
                                        className="relative w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-background transform hover:scale-110 transition-transform"
                                        style={{ borderColor: player.color }}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: player.color }} />

                                        {/* Tooltip-ish WPM popup moving with car */}
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {Math.round(player.progress)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Finish Line Flag */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-0 opacity-20">
                                    <Flag className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Status (Right - Optional, mainly for finished state or ready state if implemented here) */}
                            <div className="w-8 flex justify-end shrink-0">
                                {isFinished ? (
                                    <Trophy className={cn(
                                        "w-5 h-5",
                                        player.rank === 1 ? "text-yellow-400" : "text-muted-foreground"
                                    )} />
                                ) : (
                                    <div className="text-xs font-mono text-muted-foreground/50">
                                        {Math.floor(player.progress)}%
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RaceTrack;
