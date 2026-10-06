import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RoomParticipant {
  nickname: string;
  avatar: string | null;
  ready?: boolean;
  picked?: string;
  isHost?: boolean;
}

export interface RoomItem {
  id: string;
  title: string;
  host_nickname: string;
  host_avatar: string | null;
  guest_nickname: string | null;
  guest_avatar: string | null;
  players?: RoomParticipant[];
  theme_type: string;
  selected_universes: string[];
  game_rule: string;
  question_check: boolean;
  status: string;
}

interface RoomsListProps {
  isOpen: boolean;
  nickname: string;
  avatar: string | null;
  onClose: () => void;
  onOpenCreate: () => void;
  onRoomDeleted: () => void;
  onStartMatch: (room: RoomItem) => void;
}

export const RoomsList: React.FC<RoomsListProps> = ({
  isOpen,
  nickname,
  avatar,
  onClose,
  onOpenCreate,
  onRoomDeleted,
  onStartMatch
}) => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const fetchRooms = async () => {
    const client = supabase;
    if (!client) return;
    const { data } = await client
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
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel('rooms_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          fetchRooms();
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as RoomItem;
            const plist = getRoomPlayers(updated);
            const isUserInRoom = plist.some((p) => p.nickname === nickname);

            if (updated.status === 'picking' && isUserInRoom) {
              onStartMatch(updated);
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [nickname, onStartMatch]);

  const getRoomPlayers = (room: RoomItem): RoomParticipant[] => {
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
  };

  const hasMyRoom = rooms.some((r) => r.host_nickname === nickname);

  const handleCardClick = async (room: RoomItem) => {
    const isOwn = room.host_nickname === nickname;
    if (isOwn) return;
    if (activeRoomId === room.id) return;

    const client = supabase;
    if (!client) return;

    const currentPlayers = getRoomPlayers(room);
    if (currentPlayers.length >= 4) return;
    if (currentPlayers.some((p) => p.nickname === nickname)) return;

    const updatedPlayers = [
      ...currentPlayers,
      { nickname, avatar, isHost: false }
    ];

    setActiveRoomId(room.id);

    await client
      .from('rooms')
      .update({
        players: updatedPlayers,
        guest_nickname: nickname,
        guest_avatar: avatar
      })
      .eq('id', room.id);
  };

  const handleLeaveRoom = async (e: React.MouseEvent, room: RoomItem) => {
    e.stopPropagation();
    const client = supabase;
    if (!client) return;

    const isOwn = room.host_nickname === nickname;
    if (isOwn) {
      await client.from('rooms').delete().eq('id', room.id);
      setActiveRoomId(null);
      onRoomDeleted();
      fetchRooms();
    } else {
      const currentPlayers = getRoomPlayers(room);
      const remainingPlayers = currentPlayers.filter((p) => p.nickname !== nickname);

      await client
        .from('rooms')
        .update({
          players: remainingPlayers,
          guest_nickname: remainingPlayers[1]?.nickname || null,
          guest_avatar: remainingPlayers[1]?.avatar || null
        })
        .eq('id', room.id);
      setActiveRoomId(null);
      fetchRooms();
    }
  };

  const handleLaunchGame = async (e: React.MouseEvent, room: RoomItem) => {
    e.stopPropagation();
    const client = supabase;
    if (!client) return;

    const currentPlayers = getRoomPlayers(room);
    if (currentPlayers.length < 2) return;

    await client
      .from('rooms')
      .update({ status: 'picking' })
      .eq('id', room.id);

    onStartMatch({ ...room, status: 'picking' });
  };

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
                const playersList = getRoomPlayers(room);
                const isUserJoined = playersList.some((p) => p.nickname === nickname);
                const isExpanded = isOwn || isUserJoined || activeRoomId === room.id;
                const canStart = playersList.length >= 2;

                return (
                  <div
                    key={room.id}
                    className={`room-outline-card ${isOwn ? 'own' : ''} ${
                      isExpanded ? 'expanded' : ''
                    }`}
                    onClick={() => handleCardClick(room)}
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isOwn ? (
                          <span className="room-status-badge own-badge">Вы</span>
                        ) : isUserJoined ? (
                          <span className="room-status-badge">В комнате</span>
                        ) : (
                          <span className="room-status-badge">
                            {playersList.length}/4
                          </span>
                        )}

                        {isExpanded && (
                          <button
                            type="button"
                            className="btn-leave-icon"
                            onClick={(e) => handleLeaveRoom(e, room)}
                          >
                            <span className="material-symbols-rounded">close</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="room-card-tags">
                      <span className="room-tag">{getRuleLabel(room.game_rule)}</span>
                      <span className="room-tag">{getThemeLabel(room.theme_type)}</span>
                      {room.question_check && (
                        <span className="room-tag">Проверка ИИ</span>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="room-expanded-body">
                        <div className="room-players-row">
                          {[0, 1, 2, 3].map((slotIdx) => {
                            const p = playersList[slotIdx];
                            return (
                              <div key={slotIdx} className="player-slot">
                                {p ? (
                                  <div className="player-slot-avatar">
                                    {p.avatar ? (
                                      <img src={p.avatar} alt="" />
                                    ) : (
                                      <span className="material-symbols-rounded">person</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="player-slot-avatar empty">
                                    <span className="material-symbols-rounded">add</span>
                                  </div>
                                )}
                                <span className="player-slot-name">
                                  {p ? p.nickname : `Игрок ${slotIdx + 1}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="room-control-side">
                          {isOwn ? (
                            <button
                              type="button"
                              className={`btn-start-circle ${!canStart ? 'disabled' : ''}`}
                              aria-label="Начать игру"
                              onClick={(e) => handleLaunchGame(e, room)}
                            >
                              <span className="material-symbols-rounded">arrow_forward</span>
                            </button>
                          ) : (
                            <div className="waiting-circular-box">
                              <div className="spinner-circle" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
