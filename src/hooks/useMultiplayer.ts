import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type GameState = 'lobby' | 'countdown' | 'racing' | 'finished';

export interface Player {
    id: string;
    name: string;
    isReady: boolean;
    progress: number; // 0-100
    wpm: number;
    rank?: number;
    color?: string; // For avatar/track
    avatarUrl?: string;
    accuracy?: number;
    completionTime?: number;
}

export interface RoomConfig {
    text: string;
    mode: 'words' | 'sentences' | 'paragraphs';
    duration: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

export const useMultiplayer = (user: any) => {
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState>('lobby');
    const [players, setPlayers] = useState<Player[]>([]);
    const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
    const [countdown, setCountDown] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [playerId, setPlayerId] = useState<string>(user?.id || `guest_${Math.floor(Math.random() * 100000)}`);

    // Update playerId if user logs in
    useEffect(() => {
        if (user?.id) setPlayerId(user.id);
    }, [user]);

    // Internal Countdown Logic
    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountDown(c => (c ? c - 1 : 0)), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setGameState('racing');
            setCountDown(null); // Clear countdown
        }
    }, [countdown]);

    const channelRef = useRef<RealtimeChannel | null>(null);

    // Generate a random color for the player
    const myColor = useRef(`hsl(${Math.random() * 360}, 70%, 50%)`).current;

    const cleanup = useCallback(async () => {
        try {
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        } catch (err) {
            console.error("[useMultiplayer] Cleanup failed:", err);
        }
        setRoomCode(null);
        setPlayers([]);
        setGameState('lobby');
    }, []);

    const joinRoom = useCallback(async (code: string, isCreating: boolean = false) => {
        await cleanup();

        try {
            const channel = supabase.channel(`typing_room_${code}`, {
                config: {
                    broadcast: { self: true } // We want to receive our own events for consistency
                }
            });

            channelRef.current = channel;
            setRoomCode(code);
            setIsHost(isCreating);

            // -- Event Listeners --

            // 1. New Player Joined (or existing players announcing themselves)
            channel.on('broadcast', { event: 'player_join' }, ({ payload }) => {
                console.log("Player joined:", payload);
                setPlayers(prev => {
                    const exists = prev.find(p => p.id === payload.id);
                    if (exists) return prev;
                    return [...prev, { ...payload, isReady: false, progress: 0, wpm: 0 }];
                });

                // If I am Host, and a new player joined, I should probably re-broadcast the room config
                // so they get it immediately.
                if (isCreating && roomConfig) {
                    setTimeout(() => {
                        channel.send({
                            type: 'broadcast',
                            event: 'room_config',
                            payload: roomConfig
                        });
                    }, 500);
                }
            });

            // 2. Room Config Sync
            channel.on('broadcast', { event: 'room_config' }, ({ payload }) => {
                console.log("Received Room Config:", payload);
                setRoomConfig(payload);
            });

            // 3. Player Ready Toggle
            channel.on('broadcast', { event: 'player_ready' }, ({ payload }) => {
                setPlayers(prev => prev.map(p =>
                    p.id === payload.id ? { ...p, isReady: payload.isReady } : p
                ));
            });

            // 4. Game Start (Countdown)
            channel.on('broadcast', { event: 'game_start' }, ({ payload }) => {
                setStartTime(payload.startTime);
                setGameState('countdown');
                // Reset progress
                setPlayers(prev => prev.map(p => ({ ...p, progress: 0, wpm: 0, rank: undefined })));
            });

            // 5. Progress Updates
            channel.on('broadcast', { event: 'player_progress' }, ({ payload }) => {
                setPlayers(prev => prev.map(p =>
                    p.id === payload.userId ? { ...p, progress: payload.progress, wpm: payload.wpm } : p
                ));
            });

            // 6. Player Finished
            channel.on('broadcast', { event: 'player_complete' }, ({ payload }) => {
                setPlayers(prev => {
                    const existing = prev.find(p => p.id === payload.userId);
                    // If already marked as finished/ranked, ignore (deduplicate)
                    if (existing?.rank || existing?.progress === 100) return prev;

                    // Calculate rank based on how many have ALREADY finished
                    const finishedCount = prev.filter(p => p.progress >= 100).length;

                    return prev.map(p =>
                        p.id === payload.userId
                            ? { ...p, progress: 100, wpm: payload.wpm, accuracy: payload.accuracy, rank: finishedCount + 1 }
                            : p
                    );
                });
            });

            // Subscribe
            const subscription = channel.subscribe(async (status) => {
                console.log(`[useMultiplayer] Room ${code} subscription status:`, status);
                if (status === 'SUBSCRIBED') {
                    // Announce self
                    const myProfile: Player = {
                        id: playerId,
                        name: (user?.user_metadata?.full_name || user?.email?.split('@')[0] || `Guest_${playerId.slice(-4)}`) || "Guest",
                        isReady: false,
                        progress: 0,
                        wpm: 0,
                        color: myColor || '#666',
                        avatarUrl: user?.user_metadata?.avatar_url || null
                    };

                    try {
                        await channel.send({
                            type: 'broadcast',
                            event: 'player_join',
                            payload: myProfile
                        });
                    } catch (err) {
                        console.error("Failed to broadcast join:", err);
                    }

                    // Optimistically add self to list
                    setPlayers(prev => {
                        const exists = prev.find(p => p.id === myProfile.id);
                        if (exists) return prev;
                        return [...prev, myProfile];
                    });

                    if (!isCreating) {
                        toast.success("Joined room successfully!");
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    toast.error("Failed to connect to room. Check connection.");
                    console.error("Channel error for room:", code);
                } else if (status === 'TIMED_OUT') {
                    toast.error("Connection timed out. Retrying...");
                    console.warn("Channel timeout for room:", code);
                }
            });

            return () => {
                supabase.removeChannel(channel);
            };

        } catch (error) {
            console.error("Join room error:", error);
            toast.error("Failed to join room");
        }

    }, [user, myColor, cleanup, roomConfig, playerId]); // Depend on roomConfig so Host can re-broadcast it

    const createRoom = useCallback(async () => {
        // Generate 6-digit numeric code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await joinRoom(code, true);
        return code;
    }, [joinRoom]);

    const broadcastConfig = useCallback(async (config: RoomConfig) => {
        if (!channelRef.current) return;
        setRoomConfig(config); // Set local
        await channelRef.current.send({
            type: 'broadcast',
            event: 'room_config',
            payload: config
        });
    }, []);

    const toggleReady = useCallback(async () => {
        if (!channelRef.current) return;
        const myId = playerId; // Use the stable playerId
        if (!myId) return;

        const myself = players.find(p => p.id === myId);
        const newStatus = !myself?.isReady;

        // Optimistic update
        setPlayers(prev => prev.map(p =>
            p.id === myId ? { ...p, isReady: newStatus } : p
        ));

        try {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'player_ready',
                payload: { id: myId, isReady: newStatus }
            });
        } catch (err) {
            console.error("Failed to broadcast ready:", err);
            // Revert on error? Or just let it sync later?
        }
    }, [players, playerId]);

    const startGame = useCallback(async () => {
        if (!channelRef.current || !isHost) return;

        // Manual local trigger to ensure start even if broadcast fails
        setCountDown(3);
        setGameState('countdown');

        // Broadcast to others
        await channelRef.current.send({
            type: 'broadcast',
            event: 'game_start',
            payload: {}
        });
    }, [isHost]);

    const updateProgress = useCallback(async (progress: number, wpm: number) => {
        if (!channelRef.current) return;
        const myId = user?.id || players.find(p => p.color === myColor)?.id;
        if (!myId) return;

        await channelRef.current.send({
            type: 'broadcast',
            event: 'player_progress',
            payload: { userId: myId, progress, wpm }
        });
    }, [user, players, myColor]);

    const completeRace = useCallback(async (results: { wpm: number, accuracy: number, time: number }) => {
        if (!channelRef.current) return;
        const myId = user?.id || players.find(p => p.color === myColor)?.id;
        if (!myId) return;

        await channelRef.current.send({
            type: 'broadcast',
            event: 'player_complete',
            payload: { userId: myId, ...results }
        });
    }, [user, players, myColor]);

    return {
        roomCode,
        gameState,
        players,
        roomConfig,
        countdown,
        startTime,
        isHost,
        joinRoom,
        createRoom,
        broadcastConfig,
        toggleReady,
        startGame,
        updateProgress,
        completeRace,
        setGameState, // Manually change state if needed (e.g. countdown -> racing)
        cleanup,
        playerId
    };
};
