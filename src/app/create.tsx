import React, { useState, useEffect, useRef } from 'react';

interface CreateRoomProps {
  isOpen: boolean;
  nickname: string;
  onClose: () => void;
  onCreate: (config: {
    roomTitle: string;
    themeType: 'all' | 'single' | 'double';
    selectedUniverses: string[];
    gameRule: 'classic' | 'double_trouble';
  }) => void;
}

const universeOptions = [
  { id: 'marvel', label: 'Marvel' },
  { id: 'the_boys', label: 'The Boys' },
  { id: 'invincible', label: 'Invincible' },
  { id: 'star_wars', label: 'Star Wars' }
];

export const CreateRoom: React.FC<CreateRoomProps> = ({
  isOpen,
  nickname,
  onClose,
  onCreate
}) => {
  const truncatedNick =
    nickname.length > 8 ? `${nickname.slice(0, 8)}...` : nickname;

  const [roomTitle, setRoomTitle] = useState(`Комната ${truncatedNick}`);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [themeTab, setThemeTab] = useState<'all' | 'single' | 'double'>('all');
  const [singleUniverse, setSingleUniverse] = useState('marvel');
  const [doubleUniverses, setDoubleUniverses] = useState(['marvel', 'the_boys']);
  const [gameRule, setGameRule] = useState<'classic' | 'double_trouble'>('classic');

  useEffect(() => {
    if (isOpen) {
      setRoomTitle(`Комната ${truncatedNick}`);
      setIsEditingTitle(false);
    }
  }, [isOpen, truncatedNick]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
    }
  }, [isEditingTitle]);

  const toggleDoubleUniverse = (id: string) => {
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

  const handleCreateRoom = () => {
    let chosen: string[] = [];
    if (themeTab === 'all') {
      chosen = ['all'];
    } else if (themeTab === 'single') {
      chosen = [singleUniverse];
    } else {
      chosen = doubleUniverses;
    }

    onCreate({
      roomTitle: roomTitle.trim() || `Комната ${truncatedNick}`,
      themeType: themeTab,
      selectedUniverses: chosen,
      gameRule
    });
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
                  {universeOptions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`sub-chip ${
                        singleUniverse === u.id ? 'active' : ''
                      }`}
                      onClick={() => setSingleUniverse(u.id)}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              )}

              {themeTab === 'double' && (
                <div className="sub-chips-row">
                  {universeOptions.map((u) => {
                    const isSelected = doubleUniverses.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`sub-chip ${isSelected ? 'active' : ''}`}
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
                  'В игре участвуют персонажи сразу из всех вселенных без ограничений.'}
                {themeTab === 'single' &&
                  'Все 36 карточек доски формируются строго из выбранной вселенной.'}
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
          </div>
        </div>

        <footer className="room-footer">
          <button
            type="button"
            className="btn-pill primary"
            onClick={handleCreateRoom}
          >
            Создать комнату
          </button>
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
};  const [doubleUniverses, setDoubleUniverses] = useState(['marvel', 'the_boys']);
  const [gameRule, setGameRule] = useState<'classic' | 'double_trouble'>('classic');

  useEffect(() => {
    if (isOpen) {
      setRoomTitle(`Комната ${truncatedNick}`);
      setIsEditingTitle(false);
    }
  }, [isOpen, truncatedNick]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
    }
  }, [isEditingTitle]);

  const toggleDoubleUniverse = (id: string) => {
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

  const handleCreateRoom = () => {
    let chosen: string[] = [];
    if (themeTab === 'all') {
      chosen = ['all'];
    } else if (themeTab === 'single') {
      chosen = [singleUniverse];
    } else {
      chosen = doubleUniverses;
    }

    onCreate({
      roomTitle: roomTitle.trim() || `Комната ${truncatedNick}`,
      themeType: themeTab,
      selectedUniverses: chosen,
      gameRule
    });
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
                  {universeOptions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`sub-chip ${
                        singleUniverse === u.id ? 'active' : ''
                      }`}
                      onClick={() => setSingleUniverse(u.id)}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              )}

              {themeTab === 'double' && (
                <div className="sub-chips-row">
                  {universeOptions.map((u) => {
                    const isSelected = doubleUniverses.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`sub-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleDoubleUniverse(u.id)}
                      >
                        {u.label} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="room-desc-box">
                {themeTab === 'all' &&
                  'В игре участвуют персонажи сразу из всех вселенных без ограничений.'}
                {themeTab === 'single' &&
                  'Все 36 карточек доски формируются строго из выбранной вселенной.'}
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
          </div>
        </div>

        <footer className="room-footer">
          <button
            type="button"
            className="btn-pill primary"
            onClick={handleCreateRoom}
          >
            Создать комнату
          </button>
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
