import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface CreateRoomProps {
  isOpen: boolean;
  nickname: string;
  avatar: string | null;
  onClose: () => void;
  onCreated: (roomId: string) => void;
  hasExistingRoom: boolean;
}

const globImages = import.meta.glob<string>(
  '/public/pics/**/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true, query: '?url', import: 'default' }
);

const allImagePaths = Object.keys(globImages);

const universeOptions = [
  { id: 'marvel', label: 'Marvel', folder: 'Marvel' },
  { id: 'the_boys', label: 'The Boys', folder: 'TheBoys' },
  { id: 'invincible', label: 'Invincible', folder: 'Invincible' },
  { id: 'star_wars', label: 'Star Wars', folder: 'StarWars' }
];

export const CreateRoom: React.FC<CreateRoomProps> = ({
  isOpen,
  nickname,
  avatar,
  onClose,
  onCreated,
  hasExistingRoom
}) => {
  const truncatedNick =
    nickname.length > 8 ? `${nickname.slice(0, 8)}...` : nickname;

  const [roomTitle, setRoomTitle] = useState(`Комната ${truncatedNick}`);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const availableUniverses = useMemo(() => {
    const found = new Set<string>();
    universeOptions.forEach((opt) => {
      const hasFiles = allImagePaths.some((p) =>
        p.toLowerCase().includes(`/pics/${opt.folder.toLowerCase()}/`)
      );
      if (hasFiles) {
        found.add(opt.id);
      }
    });
    return found;
  }, []);

  const defaultSingle = universeOptions.find((u) => availableUniverses.has(u.id))?.id || 'marvel';

  const [themeTab, setThemeTab] = useState<'all' | 'single' | 'double'>('all');
  const [singleUniverse, setSingleUniverse] = useState(defaultSingle);
  const [doubleUniverses, setDoubleUniverses] = useState<string[]>([]);
  const [gameRule, setGameRule] = useState<'classic' | 'double_trouble'>('classic');
  const [questionCheck, setQuestionCheck] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRoomTitle(`Комната ${truncatedNick}`);
      setIsEditingTitle(false);
      setIsSubmitting(false);
      const availList = Array.from(availableUniverses);
      if (availList.length >= 2) {
        setDoubleUniverses([availList[0], availList[1]]);
      } else if (availList.length === 1) {
        setDoubleUniverses([availList[0]]);
      }
    }
  }, [isOpen, truncatedNick, availableUniverses]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
    }
  }, [isEditingTitle]);

  const toggleDoubleUniverse = (id: string) => {
    if (!availableUniverses.has(id)) return;

    if (doubleUniverses.includes(id)) {
      if (doubleUniverses.length > 1) {
        setDoubleUniverses(doubleUniverses.filter((u) => u !== id));
      }
    } else {
      if (doubleUniverses.length < 2) {
        setDoubleUniverses([...doubleUniverses, id]);
      } else {
        setDoubleUniverses([doubleUniverses[1], id]);
      }
    }
  };

  const handleCreateRoom = async () => {
    if (isSubmitting || hasExistingRoom) return;

    let chosen: string[] = [];
    if (themeTab === 'all') {
      chosen = ['all'];
    } else if (themeTab === 'single') {
      chosen = [singleUniverse];
    } else {
      chosen = doubleUniverses;
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const finalTitle = roomTitle.trim() || `Комната ${truncatedNick}`;

    setIsSubmitting(true);

    if (supabase) {
      await supabase.from('rooms').insert({
        id: roomId,
        title: finalTitle,
        host_nickname: nickname,
        host_avatar: avatar,
        players: [{ nickname, avatar, isHost: true }],
        theme_type: themeTab,
        selected_universes: chosen,
        game_rule: gameRule,
        question_check: questionCheck,
        status: 'waiting'
      });
    }

    setIsSubmitting(false);
    onCreated(roomId);
  };

  return (
    <aside className={`room-overlay ${isOpen ? 'is-open' : ''}`}>
      <div className="room-view">
        <div>
          <header className="room-header">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                maxLength={24}
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="room-title-input"
              />
            ) : (
              <button
                type="button"
                className="room-title-btn"
                onClick={() => setIsEditingTitle(true)}
              >
                <h1>{roomTitle}</h1>
                <span className="material-symbols-rounded">edit</span>
              </button>
            )}
          </header>

          <div className="room-content">
            <div className="room-section">
              <span className="room-section-label">Тематика персонажей</span>
              <div className="room-segmented">
                <button
                  type="button"
                  className={`room-segment ${themeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setThemeTab('all')}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={`room-segment ${themeTab === 'single' ? 'active' : ''}`}
                  onClick={() => setThemeTab('single')}
                >
                  Одна тема
                </button>
                <button
                  type="button"
                  className={`room-segment ${themeTab === 'double' ? 'active' : ''}`}
                  onClick={() => setThemeTab('double')}
                >
                  Тема + Тема
                </button>
              </div>

              {themeTab === 'single' && (
                <div className="sub-chips-row">
                  {universeOptions.map((u) => {
                    const isAvail = availableUniverses.has(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`sub-chip ${
                          singleUniverse === u.id ? 'active' : ''
                        } ${!isAvail ? 'disabled' : ''}`}
                        onClick={() => isAvail && setSingleUniverse(u.id)}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {themeTab === 'double' && (
                <div className="sub-chips-row">
                  {universeOptions.map((u) => {
                    const isAvail = availableUniverses.has(u.id);
                    const isSelected = doubleUniverses.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`sub-chip ${isSelected ? 'active' : ''} ${
                          !isAvail ? 'disabled' : ''
                        }`}
                        onClick={() => toggleDoubleUniverse(u.id)}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="room-desc-box">
                {themeTab === 'all' &&
                  'В игре участвуют персонажи сразу из всех доступных вселенных.'}
                {themeTab === 'single' &&
                  'Все карточки доски формируются строго из одной выбранной вселенной.'}
                {themeTab === 'double' &&
                  'Доска составляется поровну из персонажей двух выбранных вселенных.'}
              </p>
            </div>

            <div className="room-section">
              <span className="room-section-label">Правила дуэли</span>
              <div className="mode-cards-grid">
                <button
                  type="button"
                  className={`mode-select-card ${
                    gameRule === 'classic' ? 'active' : ''
                  }`}
                  onClick={() => setGameRule('classic')}
                >
                  <div className="mode-card-head">
                    <span className="mode-card-title">Классика</span>
                    {gameRule === 'classic' && (
                      <span className="mode-card-badge">Выбрано</span>
                    )}
                  </div>
                  <span className="mode-card-desc">
                    1 на 1 пытаетесь угадать загаданного персонажа соперника по наводящим вопросам.
                  </span>
                </button>

                <button
                  type="button"
                  className={`mode-select-card ${
                    gameRule === 'double_trouble' ? 'active' : ''
                  }`}
                  onClick={() => setGameRule('double_trouble')}
                >
                  <div className="mode-card-head">
                    <span className="mode-card-title">Дабл Трабл</span>
                    {gameRule === 'double_trouble' && (
                      <span className="mode-card-badge">Выбрано</span>
                    )}
                  </div>
                  <span className="mode-card-desc">
                    В отличие от классики, каждому игроку нужно разгадать сразу двух персонажей.
                  </span>
                </button>
              </div>
            </div>

            <div
              className="flat-toggle-row"
              onClick={() => setQuestionCheck((prev) => !prev)}
            >
              <div className={`flat-toggle-text ${!questionCheck ? 'dimmed' : ''}`}>
                <span className="flat-toggle-title">Проверка вопроса</span>
                <span className="flat-toggle-desc">
                  ИИ проверяет, не нарушает ли вопрос правила игры
                </span>
              </div>

              <div className={`circle-switch ${questionCheck ? 'on' : ''}`}>
                <div className="circle-switch-dot" />
              </div>
            </div>
          </div>
        </div>

        <footer className="room-footer">
          {hasExistingRoom ? (
            <div className="room-desc-box" style={{ textAlign: 'center', color: '#f28b82' }}>
              У вас уже есть созданная комната. Нельзя создать больше одной.
            </div>
          ) : (
            <button
              type="button"
              className="btn-pill primary"
              disabled={isSubmitting}
              onClick={handleCreateRoom}
            >
              {isSubmitting ? 'Создание...' : 'Создать комнату'}
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
