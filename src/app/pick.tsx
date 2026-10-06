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

const allImages = Object.entries(globImages).map(([p, url]) => {
  const cleanUrl = typeof url === 'string' && url.length > 0 ? url.replace(/^\/public/, '') : p.replace(/^\/public/, '');
  const fileName = cleanUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  const formattedName = fileName
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { url: cleanUrl, name: formattedName };
});

export const PickScreen: React.FC<PickScreenProps> = ({
  isOpen,
  room,
  nickname,
  onExit
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [hostReady, setHostReady] = useState(false);
  const [guestReady, setGuestReady] = useState(false);
  const [dimOpacity, setDimOpacity] = useState(1);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const isHost = room?.host_nickname === nickname;

  const relevantImages = useMemo(() => {
    if (!room || room.theme_type === 'all' || !room.selected_universes.length) {
      return allImages;
    }
    const filtered = allImages.filter((img) => {
      const lower = img.url.toLowerCase();
      return room.selected_universes.some((u) => lower.includes(u.toLowerCase()));
    });
    return filtered.length > 0 ? filtered : allImages;
  }, [room]);

  const gridItems = useMemo(() => {
    const list = [...relevantImages];
    while (list.length < 49) {
      list.push(...list);
    }
    const shuffled = list.slice(0, 49).sort(() => 0.5 - Math.random());
    const items = [];
    const size = 7;
    const spacing = 115;
    const offset = Math.floor(size / 2);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const x = (c - offset) * spacing;
        const y = (r - offset) * spacing;
        items.push({
          id: idx,
          x,
          y,
          img: shuffled[idx % shuffled.length]
        });
      }
    }
    return items;
  }, [relevantImages]);

  useEffect(() => {
    if (isOpen) {
      setDimOpacity(1);
      setPan({ x: 0, y: 0 });
      setIsReady(false);
      setHostReady(false);
      setGuestReady(false);

      const timer = setTimeout(() => {
        setDimOpacity(0);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !room?.id || !supabase) return;
    const client = supabase;

    const channel = client
      .channel(`room_pick_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload: { new: { host_ready?: boolean; guest_ready?: boolean; status?: string } }) => {
          if (payload.new) {
            setHostReady(Boolean(payload.new.host_ready));
            setGuestReady(Boolean(payload.new.guest_ready));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isOpen, room?.id]);

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

  const closestItem = useMemo(() => {
    let closest = gridItems[0];
    let minD = Infinity;

    gridItems.forEach((item) => {
      const screenX = item.x + pan.x;
      const screenY = item.y + pan.y;
      const d = Math.sqrt(screenX * screenX + screenY * screenY);
      if (d < minD) {
        minD = d;
        closest = item;
      }
    });
    return closest;
  }, [gridItems, pan]);

  const toggleReady = async () => {
    const nextState = !isReady;
    setIsReady(nextState);

    if (room?.id && supabase) {
      const updateData = isHost
        ? { host_ready: nextState, host_picked: closestItem.img.name }
        : { guest_ready: nextState, guest_picked: closestItem.img.name };

      await supabase.from('rooms').update(updateData).eq('id', room.id);
    }
  };

  const readyCount = (hostReady ? 1 : 0) + (guestReady ? 1 : 0);

  return (
    <aside className={`pick-overlay ${isOpen ? 'is-open' : ''}`}>
      <div
        className="pick-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="pick-fade-backdrop"
          style={{ opacity: dimOpacity }}
        />

        <div className="pick-crosshair" />

        <div
          className="pick-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          {gridItems.map((item) => {
            const screenX = item.x + pan.x;
            const screenY = item.y + pan.y;
            const d = Math.sqrt(screenX * screenX + screenY * screenY);

            const scale = Math.max(0.78, Math.min(1.15, 1.15 - d * 0.0016));
            const blur = Math.min(3, d * 0.008);
            const opacity = Math.max(0.45, Math.min(1, 1 - d * 0.0022));

            return (
              <div
                key={item.id}
                className="pick-card-item"
                style={{
                  transform: `translate(${item.x - 45}px, ${item.y - 45}px) scale(${scale})`,
                  filter: `blur(${blur}px)`,
                  opacity
                }}
              >
                <img src={item.img.url} alt="" />
              </div>
            );
          })}
        </div>

        <div className="pick-bottom-bar">
          <div className="pick-info-col">
            <h2 className="pick-char-name">{closestItem.img.name}</h2>
            <span className="pick-char-sub">— Твой выбор</span>
          </div>

          <button
            type="button"
            className={`btn-pill ${isReady ? 'primary' : 'outline'}`}
            onClick={toggleReady}
          >
            {isReady ? `Готов (${readyCount}/2)` : `Выбрать (${readyCount}/2)`}
          </button>
        </div>
      </div>
    </aside>
  );
};
