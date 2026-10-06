import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RoomItem {
  id: string;
  title: string;
  host_nickname: string;
  host_avatar: string | null;
  guest_nickname: string | null;
  theme_type: string;
  selected_universes: string[];
  game_rule: string;
  question_check: boolean;
  status: string;
}

interface RoomsListProps {
  isOpen: boolean;
  nickname: string;
  onClose: () => void;
  onOpenCreate: () => void;
  onSelectRoom: (room: RoomItem) => void;
}

export const RoomsList: React.FC<RoomsListProps> = ({
  isOpen,
  nickname,
  onClose,
  onOpenCreate,
  onSelectRoom
}) => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRooms = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (data) {
      setRooms(data as RoomItem[]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('rooms_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const hasMyRoom = rooms.some((r) => r.host_nickname === nickname);

  const filteredRooms = rooms
    .filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.host_nickname.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const isMineA = a.host_nickname === nickname;
      const isMineB = b.host_nickname === nickname;
      if (isMineA && !isMineB) return -1;
      if (!isMineA && isMineB) return 1;
      return 0;
    });

  const getRuleLabel = (rule: string) => {
    return rule === 'double_trouble' ? 'Дабл Трабл' : 'Классика';
  };

  const getThemeLabel = (theme: string) => {
    if (theme === 'single') return '1 тема';
    if (theme === 'double') return '2 темы';
    return 'Все темы';
  };

  return (
    <aside className={`rooms-overlay ${isOpen ? 'is-open' : ''}`}>
      <div className="rooms-view">
        <div>
          <header className="rooms-header">
            <h1>Все комнаты</h1>
          </header>

          <div className="rooms-search">
            <span className="material-symbols-rounded">search</span>
            <input
              type="text"
              placeholder="Поиск по названию или автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="rooms-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            )}
          </div>

          <div className="rooms-list">
            {filteredRooms.length === 0 ? (
              <div className="rooms-empty">
                <span className="material-symbols-rounded">meeting_room</span>
                <span>
                  {searchQuery ? 'Комнат не найдено' : 'Пока нет созданных комнат'}
                </span>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isOwn = room.host_nickname === nickname;
                return (
                  <button
                    key={room.id}
                    type="button"
                    className={`room-outline-card ${isOwn ? 'own' : ''}`}
                    onClick={() => onSelectRoom(room)}
                  >
                    <div className="room-card-top">
                      <div className="room-host-row">
                        <div className="room-host-avatar">
                          {room.host_avatar ? (
                            <img src={room.host_avatar} alt="" />
                          ) : (
                            <span className="material-symbols-rounded">person</span>
                          )}
                        </div>
                        <span className="room-card-title">{room.title}</span>
                      </div>

                      {isOwn ? (
                        <span className="room-status-badge own-badge">Вы</span>
                      ) : (
                        <span className="room-status-badge">Ждет</span>
                      )}
                    </div>

                    <div className="room-card-tags">
                      <span className="room-tag">{getRuleLabel(room.game_rule)}</span>
                      <span className="room-tag">{getThemeLabel(room.theme_type)}</span>
                      {room.question_check && (
                        <span className="room-tag">Проверка ИИ</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <footer className="rooms-footer">
          {!hasMyRoom && (
            <button
              type="button"
              className="btn-pill primary"
              onClick={onOpenCreate}
            >
              Создать комнату
            </button>
          )}

          <button
            type="button"
            className="btn-pill outline"
            onClick={onClose}
          >
            Назад
          </button>
        </footer>
      </div>
    </aside>
  );
};
