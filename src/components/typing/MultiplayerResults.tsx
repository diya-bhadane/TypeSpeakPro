import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Player } from '@/hooks/useMultiplayer';
import { Trophy, Medal, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from '../UserAvatar';

interface MultiplayerResultsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    multiplayer: {
        players: Player[];
        playerId: string;
        gameState: string;
    };
    onRestart: () => void;
    results: {
        wpm: number;
        accuracy: number;
        time: number;
        errorCount: number;
    };
}

const MultiplayerResults = ({ open, onOpenChange, multiplayer, onRestart, results }: MultiplayerResultsProps) => {
    // Sort by rank if available, otherwise by progress/wpm
    const sortedPlayers = [...multiplayer.players].sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return b.progress - a.progress;
    });

    const winner = sortedPlayers.find(p => p.rank === 1);
    const isWinner = winner?.id === multiplayer.playerId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 p-0 overflow-hidden">
                <div className="relative p-6 bg-gradient-to-b from-primary/10 to-transparent text-center">
                    <DialogHeader>
                        <div className="mx-auto mb-4 relative">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]",
                                isWinner ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.3)]" : "border-primary/20 bg-black/40"
                            )}>
                                <Trophy className={cn("w-8 h-8", isWinner ? "text-yellow-400" : "text-primary")} />
                            </div>
                            {isWinner && <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>}
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Race Finished!</DialogTitle>
                        <DialogDescription>
                            {isWinner ? "You won the race! 🎉" : "Good game! Here are the results."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-2 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Group Test Results</h3>
                            <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</span>
                        </div>
                        {sortedPlayers.map((player, index) => {
                            const isMe = player.id === multiplayer.playerId;
                            let rankIcon = null;
                            if (player.rank === 1) rankIcon = <Trophy className="w-4 h-4 text-yellow-400" />;
                            else if (player.rank === 2) rankIcon = <Medal className="w-4 h-4 text-slate-300" />;
                            else if (player.rank === 3) rankIcon = <Medal className="w-4 h-4 text-amber-600" />;
                            else rankIcon = <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>;

                            return (
                                <div
                                    key={player.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                                        isMe ? "bg-primary/5 border-primary/20" : "bg-secondary/20 border-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 flex justify-center">
                                            {rankIcon}
                                        </div>
                                        <UserAvatar
                                            src={player.avatarUrl}
                                            name={player.name}
                                            className="w-8 h-8 border border-white/10"
                                            showBorder={false}
                                        />
                                        <div className="flex flex-col">
                                            <span className={cn("text-sm font-bold", isMe ? "text-primary" : "text-foreground")}>
                                                {player.name} {isMe && "(You)"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-foreground">{Math.round(player.wpm)} WPM</span>
                                            <span className="text-[10px] text-muted-foreground">{player.accuracy || 100}% acc</span>
                                        </div>
                                        {player.progress < 100 && (
                                            <div className="text-xs text-muted-foreground/50 italic">DNF</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                            Download Report
                        </Button>
                        <Button className="flex-1" onClick={onRestart}>
                            Return to Lobby
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MultiplayerResults;
