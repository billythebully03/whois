import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RoomItem } from './rooms';
import { supabase } from '../lib/supabase';

interface PickScreenProps {
  isOpen: boolean;
  room: RoomItem | null;
  nickname: string;
  onExit: () => void;
}

const globImages = import.meta.glob<string>(
  '/public/pics/**/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true, query: '?url', import: 'default' }
);

const formatCleanTitle = (path: string): string => {
  const cleanPath = path.split('?')[0].split('#')[0];
  const fileWithExt = cleanPath.split('/').pop() || '';
  let baseName = fileWithExt.replace(/\.[^/.]+$/, '');
  baseName = baseName.replace(/[-_][a-zA-Z0-9]{4,10}$/, '');
  const words = baseName.replace(/[_-]+/g, ' ').trim().split(/\s+/);
  return words
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const allAvailableImages = Object.entries(globImages).map(([p, url]) => {
  const cleanUrl = typeof url === 'string' && url.length > 0 ? url.replace(/^\/public/, '') : p.replace(/^\/public/, '');
  return {
    url: cleanUrl,
    name: formatCleanTitle(cleanUrl)
  };
});

export const PickScreen: React.FC<PickScreenProps> = ({
  isOpen,
  room,
  nickname,
  onExit
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(2);
  const [dimOpacity, setDimOpacity] = useState(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

  const centerImage = useMemo(() => {
    if (relevantImages.length === 0) return null;
    return relevantImages[Math.floor(Math.random() * relevantImages.length)];
  }, [relevantImages]);

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
        let img = centerImage || relevantImages[0];
        if (c !== 0 || r !== 0) {
          const hash = Math.abs(c * 73856093 ^ r * 19349663) % relevantImages.length;
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
  }, [pan, relevantImages, centerImage]);

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
    if (isOpen) {
      setDimOpacity(1);
      setPan({ x: 0, y: 0 });
      setIsReady(false);
      setShowExitConfirm(false);

      const playersCount = Array.isArray(room?.players) && room?.players.length > 0 ? room.players.length : 2;
      setTotalParticipants(playersCount);

      const timer = setTimeout(() => {
        setDimOpacity(0);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isOpen, room]);

  useEffect(() => {
    if (!isOpen || !room?.id || !supabase) return;
    const client = supabase;

    const channel = client
      .channel(`room_pick_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload: { new: { players?: Array<{ ready?: boolean }>; status?: string } }) => {
          if (payload.new) {
            if (payload.new.status === 'cancelled') {
              onExit();
              return;
            }
            if (Array.isArray(payload.new.players)) {
              const readies = payload.new.players.filter((p) => p.ready).length;
              setReadyCount(readies);
              setTotalParticipants(payload.new.players.length);
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isOpen, room?.id, onExit]);

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
    if (!closestTile) return;
    const nextState = !isReady;
    setIsReady(nextState);

    if (room?.id && supabase) {
      const client = supabase;
      const { data } = await client.from('rooms').select('players').eq('id', room.id).single();
      const currentList: Array<{ nickname: string; avatar: string | null; ready?: boolean; picked?: string }> =
        data && Array.isArray(data.players) ? data.players : [];

      const updated = currentList.map((p) => {
        if (p.nickname === nickname) {
          return { ...p, ready: nextState, picked: closestTile.img.name };
        }
        return p;
      });

      await client.from('rooms').update({ players: updated }).eq('id', room.id);
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
          className="pick-fade-backdrop"
          style={{ opacity: dimOpacity }}
        />

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
