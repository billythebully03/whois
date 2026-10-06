import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RoomItem, RoomParticipant } from './rooms';
import { supabase } from '../lib/supabase';

interface RouletteScreenProps {
  isOpen: boolean;
  room: RoomItem | null;
  nickname: string;
}

const PALETTE = ['#8ab4f8', '#f28b82', '#fdd663', '#c58af9', '#81c995'];

export const RouletteScreen: React.FC<RouletteScreenProps> = ({
  isOpen,
  room,
  nickname
}) => {
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [spinOffset, setSpinOffset] = useState(0);
  const isHost = room?.host_nickname === nickname;
  const animRef = useRef<number | null>(null);

  const playersList: RoomParticipant[] = useMemo(() => {
    if (!room) return [];
    if (Array.isArray(room.players) && room.players.length > 0) {
      return room.players;
    }
    const list: RoomParticipant[] = [
      { nickname: room.host_nickname, avatar: room.host_avatar, isHost: true }
    ];
    if (room.guest_nickname) {
      list.push({ nickname: room.guest_nickname, avatar: room.guest_avatar, isHost: false });
    }
    return list;
  }, [room]);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    playersList.forEach((p, idx) => {
      map.set(p.nickname, PALETTE[idx % PALETTE.length]);
    });
    return map;
  }, [playersList]);

  const drumSequence = useMemo(() => {
    if (playersList.length === 0) return [];
    const seq = [];
    for (let i = 0; i < 48; i++) {
      seq.push(playersList[i % playersList.length].nickname);
    }
    return seq;
  }, [playersList]);

  const ITEM_HEIGHT = 72;

  useEffect(() => {
    if (!isOpen || playersList.length === 0 || !room?.id) return;

    setWinnerName(null);
    setIsDone(false);
    setSpinOffset(0);

    const client = supabase;
    if (isHost && client) {
      const chosen = playersList[Math.floor(Math.random() * playersList.length)].nickname;
      client
        .from('rooms')
        .update({ starter_nickname: chosen })
        .eq('id', room.id)
        .then(() => {});
    }

    const timer = setTimeout(() => {
      const targetWinner = room.starter_nickname || playersList[0].nickname;
      let targetIndex = drumSequence.lastIndexOf(targetWinner);
      if (targetIndex < 24) targetIndex = 24;

      const totalDistance = targetIndex * ITEM_HEIGHT;
      const startTime = performance.now();
      const duration = 3800;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        const easeOut = 1 - Math.pow(1 - progress, 3.5);
        const currentPos = totalDistance * easeOut;
        setSpinOffset(currentPos);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setWinnerName(targetWinner);
          setIsDone(true);
        }
      };

      animRef.current = requestAnimationFrame(animate);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, room?.id, isHost]);

  useEffect(() => {
    if (!isOpen || !room?.id || !supabase) return;
    const client = supabase;

    const channel = client
      .channel(`roulette_sub_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload: { new: { starter_nickname?: string } }) => {
          if (payload.new?.starter_nickname && !winnerName) {
            setWinnerName(payload.new.starter_nickname);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isOpen, room?.id, winnerName]);

  const activeColor = winnerName ? colorMap.get(winnerName) || '#ffffff' : '#ffffff';

  return (
    <aside className={`roulette-overlay ${isOpen ? 'is-open' : ''}`}>
      <div className="roulette-viewport">
        <div className="roulette-drum-stage">
          <div
            className="roulette-drum-track"
            style={{ transform: `translateY(-${spinOffset}px)` }}
          >
            {drumSequence.map((nick, idx) => {
              const itemCenterY = idx * ITEM_HEIGHT - spinOffset;
              const distFromCenter = Math.abs(itemCenterY);
              const scale = Math.max(0.72, Math.min(1.22, 1.22 - distFromCenter * 0.0035));
              const opacity = Math.max(0.2, Math.min(1, 1 - distFromCenter * 0.005));
              const itemColor = colorMap.get(nick) || '#ffffff';

              return (
                <div
                  key={idx}
                  className="roulette-drum-item"
                  style={{
                    color: itemColor,
                    transform: `scale(${scale})`,
                    opacity
                  }}
                >
                  {nick}
                </div>
              );
            })}
          </div>
        </div>

        <div className="roulette-bottom-bar">
          <div className="pick-info-col">
            <h2 className="roulette-title" style={{ color: isDone ? activeColor : '#ffffff' }}>
              {isDone && winnerName ? winnerName : 'Подожди…'}
            </h2>
            <span className="roulette-sub">
              {isDone && winnerName ? `Первым ходит ${winnerName}` : 'Выбираем кто ходит первым'}
            </span>
          </div>

          <button type="button" className="btn-pill primary" style={{ cursor: 'default' }}>
            <div className="btn-spinner-icon" />
          </button>
        </div>
      </div>
    </aside>
  );
};
