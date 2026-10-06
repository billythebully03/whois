import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RoomItem, RoomParticipant } from './rooms';
import { supabase } from '../lib/supabase';

interface PickScreenProps {
  isOpen: boolean;
  room: RoomItem | null;
  nickname: string;
  onExit: () => void;
  onAllReady: () => void;
}

const globImages = import.meta.glob<string>(
  '/public/pics/**/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true, query: '?url', import: 'default' }
);

const formatCleanTitle = (filePath: string): string => {
  const cleanPath = filePath.split('?')[0].split('#')[0];
  const fileWithExt = cleanPath.split('/').pop() || '';
  const lastDotIndex = fileWithExt.lastIndexOf('.');
  const nameOnly = lastDotIndex !== -1 ? fileWithExt.substring(0, lastDotIndex) : fileWithExt;
  const words = nameOnly.replace(/[_-]+/g, ' ').trim().split(/\s+/);
  return words
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const allAvailableImages = Object.entries(globImages).map(([rawPath, assetUrl]) => {
  const url = typeof assetUrl === 'string' && assetUrl.length > 0 ? assetUrl.replace(/^\/public/, '') : rawPath.replace(/^\/public/, '');
  return {
    url,
    name: formatCleanTitle(rawPath)
  };
});

export const PickScreen: React.FC<PickScreenProps> = ({
  isOpen,
  room,
  nickname,
  onExit,
  onAllReady
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(2);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [randomCenterIndex, setRandomCenterIndex] = useState(0);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const relevantImages = useMemo(() => {
    if (!room || room.theme_type === 'all' || !room.selected_universes.length) {
      return allAvailableImages;
    }
    const filtered = allAvailableImages.filter((img) => {
      const lower = img.url.toLowerCase();
      return room.selected_universes.some((u) => lower.includes(u.toLowerCase()));
    });
    return filtered.length > 0 ? filtered : allAvailableImages;
  }, [room]);

  useEffect(() => {
    if (isOpen) {
      setPan({ x: 0, y: 0 });
      setIsReady(false);
      setShowExitConfirm(false);
      if (relevantImages.length > 0) {
        setRandomCenterIndex(Math.floor(Math.random() * relevantImages.length));
      }
      const initialCount = Array.isArray(room?.players) && room?.players.length > 0 ? room.players.length : 2;
      setTotalParticipants(initialCount);
    }
  }, [isOpen]);

  const CELL_SPACING = 108;

  const visibleTiles = useMemo(() => {
    if (relevantImages.length === 0) return [];

    const viewportHalfW = typeof window !== 'undefined' ? window.innerWidth / 2 : 220;
    const viewportHalfH = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;

    const minCol = Math.floor((-pan.x - viewportHalfW - 130) / CELL_SPACING);
    const maxCol = Math.ceil((-pan.x + viewportHalfW + 130) / CELL_SPACING);
    const minRow = Math.floor((-pan.y - viewportHalfH - 130) / CELL_SPACING);
    const maxRow = Math.ceil((-pan.y + viewportHalfH + 130) / CELL_SPACING);

    const tiles = [];
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        let img = relevantImages[randomCenterIndex % relevantImages.length];
        if (c !== 0 || r !== 0) {
          const hash = Math.abs((c + 1000) * 73856093 ^ (r + 1000) * 19349663) % relevantImages.length;
          img = relevantImages[hash];
        }

        tiles.push({
          key: `${c}_${r}`,
          x: c * CELL_SPACING,
          y: r * CELL_SPACING,
          img
        });
      }
    }
    return tiles;
  }, [pan, relevantImages, randomCenterIndex]);

  const closestTile = useMemo(() => {
    if (visibleTiles.length === 0) return null;
    let closest = visibleTiles[0];
    let minD = Infinity;

    visibleTiles.forEach((tile) => {
      const screenX = tile.x + pan.x;
      const screenY = tile.y + pan.y;
      const d = Math.sqrt(screenX * screenX + screenY * screenY);
      if (d < minD) {
        minD = d;
        closest = tile;
      }
    });
    return closest;
  }, [visibleTiles, pan]);

  useEffect(() => {
    if (!isOpen || !room?.id || !supabase) return;
    const client = supabase;

    const channel = client
      .channel(`room_pick_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload: { new: { players?: RoomParticipant[]; status?: string } }) => {
          if (payload.new) {
            if (payload.new.status === 'cancelled') {
              onExit();
              return;
            }
            if (payload.new.status === 'roulette') {
              onAllReady();
              return;
            }
            if (Array.isArray(payload.new.players)) {
              const readies = payload.new.players.filter((p) => p.ready).length;
              const total = payload.new.players.length;
              setReadyCount(readies);
              setTotalParticipants(total);

              if (total >= 2 && readies >= total) {
                onAllReady();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isOpen, room?.id, onExit, onAllReady]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const toggleReady = async () => {
    if (!closestTile || !room?.id) return;
    const nextState = !isReady;
    setIsReady(nextState);

    const client = supabase;
    if (client) {
      const plist: RoomParticipant[] = Array.isArray(room.players) && room.players.length > 0
        ? room.players
        : [
            { nickname: room.host_nickname, avatar: room.host_avatar, isHost: true },
            { nickname: room.guest_nickname || 'Игрок 2', avatar: room.guest_avatar, isHost: false }
          ];

      const updated = plist.map((p) => {
        if (p.nickname === nickname) {
          return { ...p, ready: nextState, picked: closestTile.img.name };
        }
        return p;
      });

      const allAreReady = updated.length >= 2 && updated.every((p) => p.ready);

      client
        .from('rooms')
        .update({
          players: updated,
          ...(allAreReady ? { status: 'roulette' } : {})
        })
        .eq('id', room.id)
        .then(() => {});

      if (allAreReady) {
        onAllReady();
      }
    }
  };

  const handleConfirmExit = async () => {
    setShowExitConfirm(false);
    if (room?.id && supabase) {
      const client = supabase;
      await client.from('rooms').update({ status: 'cancelled' }).eq('id', room.id);
    }
    onExit();
  };

  const selectedName = closestTile?.img.name || 'Персонаж';

  return (
    <aside className={`pick-overlay ${isOpen ? 'is-open' : ''}`}>
      <div
        className="pick-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          style={{
            position: 'absolute',
            top: 'max(env(safe-area-inset-top), 18px)',
            right: '20px',
            zIndex: 35,
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(28, 28, 28, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: 0,
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer'
          }}
          aria-label="Выход"
        >
          <span className="material-symbols-rounded">close</span>
        </button>

        <div
          className="pick-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          {visibleTiles.map((tile) => {
            const screenX = tile.x + pan.x;
            const screenY = tile.y + pan.y;
            const d = Math.sqrt(screenX * screenX + screenY * screenY);

            const isSelected = closestTile?.key === tile.key;
            const scale = Math.max(0.66, Math.min(1.2, 1.2 - d * 0.0022));
            const blur = isSelected ? 0 : Math.min(3.5, d * 0.009);
            const opacity = Math.max(0.4, Math.min(1, 1 - d * 0.0025));

            return (
              <div
                key={tile.key}
                className={`pick-card-item ${isSelected ? 'selected' : ''}`}
                style={{
                  transform: `translate(${tile.x - 47}px, ${tile.y - 47}px) scale(${scale})`,
                  filter: `blur(${blur}px)`,
                  opacity
                }}
              >
                <img src={tile.img.url} alt="" />
              </div>
            );
          })}
        </div>

        <div className="pick-bottom-bar">
          <div className="pick-info-col">
            <h2 className="pick-char-name">{selectedName}</h2>
            <span className="pick-char-sub">Этот герой станет твоим секретом</span>
          </div>

          <button
            type="button"
            className={`btn-pill ${isReady ? 'primary' : 'outline'}`}
            onClick={toggleReady}
          >
            {isReady
              ? `Готов (${readyCount}/${totalParticipants})`
              : `Выбрать (${readyCount}/${totalParticipants})`}
          </button>
        </div>

        {showExitConfirm && (
          <div className="dialog-backdrop" onClick={() => setShowExitConfirm(false)}>
            <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-icon-circle danger">
                <span className="material-symbols-rounded">logout</span>
              </div>
              <div>
                <h2 className="dialog-title">Покинуть матч</h2>
                <p className="dialog-desc">
                  Вы уверены, что хотите выйти? Текущая игровая сессия будет завершена для всех участников комнаты.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  className="btn-pill danger"
                  onClick={handleConfirmExit}
                >
                  Покинуть игру
                </button>
                <button
                  type="button"
                  className="btn-pill outline"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Остаться
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
