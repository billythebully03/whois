import React, { useState, useMemo, useEffect } from 'react';
import { Settings } from './settings';

const globImages = import.meta.glob<string>(
  '/public/pics/**/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true, query: '?url', import: 'default' }
);

const gatheredUrls = Object.entries(globImages).map(([path, url]) => {
  if (typeof url === 'string' && url.length > 0) {
    return url.replace(/^\/public/, '');
  }
  return path.replace(/^\/public/, '');
});

const defaultFallbacks = [
  '/pics/Marvel/iron_man.png',
  '/pics/Marvel/spider_man.png',
  '/pics/TheBoys/homelander.png',
  '/pics/TheBoys/starlight.png',
  '/pics/Invincible/omni_man.png',
  '/pics/Invincible/atom_eve.png',
  '/pics/StarWars/darth_vader.png',
  '/pics/StarWars/yoda.png'
];

const allPics = gatheredUrls.length > 0 ? gatheredUrls : defaultFallbacks;

const shuffleList = (arr: string[]) => {
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [gameMode, setGameMode] = useState<'ai' | 'online'>('ai');

  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('wtc_nickname') || 'Игрок';
  });

  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem('wtc_avatar') || null;
  });

  useEffect(() => {
    const isIos = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(Boolean(isIos || isMediaStandalone));
  }, []);

  const handleSaveSettings = (newNick: string, newAvatar: string | null) => {
    setNickname(newNick);
    localStorage.setItem('wtc_nickname', newNick);

    setAvatar(newAvatar);
    if (newAvatar) {
      localStorage.setItem('wtc_avatar', newAvatar);
    } else {
      localStorage.removeItem('wtc_avatar');
    }

    setIsSettingsOpen(false);
  };

  const [col1, col2, col3, col4, col5] = useMemo(() => {
    const randomized = shuffleList(allPics);
    const generateColumn = (offset: number) => {
      const slice = [
        ...randomized.slice(offset),
        ...randomized.slice(0, offset),
        ...randomized.slice(offset),
        ...randomized.slice(0, offset)
      ];
      while (slice.length < 16) {
        slice.push(...slice);
      }
      return slice.slice(0, 20);
    };

    return [
      generateColumn(0),
      generateColumn(2),
      generateColumn(4),
      generateColumn(6),
      generateColumn(8)
    ];
  }, []);

  return (
    <div className="app-viewport">
      <main className="home-view">
        <div className="home-top">
          <header className="profile-card">
            <div className="profile-info">
              <div className="avatar-placeholder">
                {avatar ? (
                  <img src={avatar} alt="" />
                ) : (
                  <span className="material-symbols-rounded">person</span>
                )}
              </div>
              <span className="profile-nick">{nickname}</span>
            </div>
            <button
              type="button"
              className="btn-settings"
              aria-label="Настройки"
              onClick={() => setIsSettingsOpen(true)}
            >
              <span className="material-symbols-rounded">settings</span>
            </button>
          </header>

          <section className="hero-box">
            <div className="marquee-columns">
              <div className="marquee-col c1">
                <div className="track-up">
                  {col1.map((src, i) => (
                    <div key={i} className="marquee-card">
                      <img
                        src={src}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.35';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="marquee-col c2">
                <div className="track-down">
                  {col2.map((src, i) => (
                    <div key={i} className="marquee-card">
                      <img
                        src={src}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.35';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="marquee-col c3">
                <div className="track-up">
                  {col3.map((src, i) => (
                    <div key={i} className="marquee-card">
                      <img
                        src={src}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.35';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="marquee-col c4">
                <div className="track-down">
                  {col4.map((src, i) => (
                    <div key={i} className="marquee-card">
                      <img
                        src={src}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.35';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="marquee-col c5">
                <div className="track-up">
                  {col5.map((src, i) => (
                    <div key={i} className="marquee-card">
                      <img
                        src={src}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.35';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-scrim" />

            <div className="hero-overlay">
              <h1 className="hero-heading">Who Is?</h1>
              <h1 className="hero-heading">Guess A Character</h1>
            </div>
          </section>
        </div>

        <section className="home-bottom">
          <div className="play-stack">
            <div className="peeker-card">
              <div className="peeker-segments">
                <button
                  type="button"
                  className={`peeker-segment ${gameMode === 'ai' ? 'active' : ''}`}
                  onClick={() => setGameMode('ai')}
                >
                  <span className="material-symbols-rounded">smart_toy</span>
                  <span>С ИИ</span>
                </button>
                <button
                  type="button"
                  className={`peeker-segment ${gameMode === 'online' ? 'active' : ''}`}
                  onClick={() => setGameMode('online')}
                >
                  <span className="material-symbols-rounded">groups</span>
                  <span>Онлайн</span>
                </button>
              </div>
            </div>

            <button type="button" className="btn-pill primary">
              <span
                key={gameMode}
                className={`btn-label-text ${
                  gameMode === 'online' ? 'slide-from-right' : 'slide-from-left'
                }`}
              >
                {gameMode === 'ai' ? 'Играть' : 'Создать комнату'}
              </span>
            </button>
          </div>

          <button type="button" className="btn-pill outline">
            Присоединиться
          </button>

          {isStandalone ? (
            <span className="pibs-signature">Made by PIBS</span>
          ) : (
            <button
              type="button"
              className="pwa-chip"
              onClick={() => setShowIosSheet(true)}
            >
              <span className="material-symbols-rounded">ios_share</span>
              <span>На экран «Домой»</span>
            </button>
          )}
        </section>
      </main>

      <Settings
        isOpen={isSettingsOpen}
        nickname={nickname}
        avatar={avatar}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {showIosSheet && (
        <div className="sheet-backdrop" onClick={() => setShowIosSheet(false)}>
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="sheet-preview">
              <img
                src="/app/%D1%8D%D0%BF%D0%BF%D0%BB%20%D1%82%D0%B0%D1%87%20%D0%B0%D0%B9%D1%84%D0%BE%D0%BD%20.png"
                alt="WhoIs"
                className="sheet-preview-icon"
              />
              <div>
                <div className="sheet-preview-title">WhoIs</div>
                <div className="sheet-preview-sub">Веб-приложение для экрана «Домой»</div>
              </div>
            </div>

            <h2 className="sheet-title">Установка на iPhone</h2>
            <p className="sheet-desc">
              Чтобы играть без рамок браузера на весь экран:
            </p>
            <div className="sheet-steps">
              <div className="sheet-step">
                <div className="sheet-step-icon">
                  <span className="material-symbols-rounded">ios_share</span>
                </div>
                <span>Нажмите «Поделиться» внизу Safari</span>
              </div>
              <div className="sheet-step">
                <div className="sheet-step-icon">
                  <span className="material-symbols-rounded">add_box</span>
                </div>
                <span>Выберите «На экран „Домой“»</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-pill primary"
              onClick={() => setShowIosSheet(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [gameMode, setGameMode] = useState<'ai' | 'online'>('ai');

  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('wtc_nickname') || 'Игрок';
  });

  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem('wtc_avatar') || null;
  });

  const [tempNick, setTempNick] = useState<string>(nickname);
  const [tempAvatar, setTempAvatar] = useState<string | null>(avatar);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isIos = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(Boolean(isIos || isMediaStandalone));
  }, []);

  const openSettings = () => {
    setTempNick(nickname);
    setTempAvatar(avatar);
    setCurrentScreen('settings');
  };

  const closeSettings = () => {
    setCurrentScreen('home');
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTempAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const hasSettingsChanges = tempNick.trim() !== nickname || tempAvatar !== avatar;

  const saveSettings = () => {
    const cleanNick = tempNick.trim() || 'Игрок';
    setNickname(cleanNick);
    localStorage.setItem('wtc_nickname', cleanNick);

    if (tempAvatar) {
      setAvatar(tempAvatar);
      localStorage.setItem('wtc_avatar', tempAvatar);
    } else {
      setAvatar(null);
      localStorage.removeItem('wtc_avatar');
    }

    closeSettings();
  };

  const [col1, col2, col3, col4, col5] = useMemo(() => {
    const randomized = shuffleList(allPics);
    const generateColumn = (offset: number) => {
      const slice = [
        ...randomized.slice(offset),
        ...randomized.slice(0, offset),
        ...randomized.slice(offset),
        ...randomized.slice(0, offset)
      ];
      while (slice.length < 16) {
        slice.push(...slice);
      }
      return slice.slice(0, 20);
    };

    return [
      generateColumn(0),
      generateColumn(2),
      generateColumn(4),
      generateColumn(6),
      generateColumn(8)
    ];
  }, []);

  return (
    <div className="app-viewport">
      <div
        className={`view-panel ${
          currentScreen === 'home' ? 'home-active' : 'home-pushed'
        }`}
      >
        <main className="home-view">
          <div className="home-top">
            <header className="profile-card">
              <div className="profile-info">
                <div className="avatar-placeholder">
                  {avatar ? (
                    <img src={avatar} alt="" />
                  ) : (
                    <span className="material-symbols-rounded">person</span>
                  )}
                </div>
                <span className="profile-nick">{nickname}</span>
              </div>
              <button
                type="button"
                className="btn-settings"
                aria-label="Настройки"
                onClick={openSettings}
              >
                <span className="material-symbols-rounded">settings</span>
              </button>
            </header>

            <section className="hero-box">
              <div className="marquee-columns">
                <div className="marquee-col c1">
                  <div className="track-up">
                    {col1.map((src, i) => (
                      <div key={i} className="marquee-card">
                        <img
                          src={src}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.35';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="marquee-col c2">
                  <div className="track-down">
                    {col2.map((src, i) => (
                      <div key={i} className="marquee-card">
                        <img
                          src={src}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.35';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="marquee-col c3">
                  <div className="track-up">
                    {col3.map((src, i) => (
                      <div key={i} className="marquee-card">
                        <img
                          src={src}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.35';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="marquee-col c4">
                  <div className="track-down">
                    {col4.map((src, i) => (
                      <div key={i} className="marquee-card">
                        <img
                          src={src}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.35';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="marquee-col c5">
                  <div className="track-up">
                    {col5.map((src, i) => (
                      <div key={i} className="marquee-card">
                        <img
                          src={src}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.35';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hero-scrim" />

              <div className="hero-overlay">
                <h1 className="hero-heading">Who Is?</h1>
                <h1 className="hero-heading">Guess A Character</h1>
              </div>
            </section>
          </div>

          <section className="home-bottom">
            <div className="play-stack">
              <div className="peeker-card">
                <div className="peeker-segments">
                  <button
                    type="button"
                    className={`peeker-segment ${gameMode === 'ai' ? 'active' : ''}`}
                    onClick={() => setGameMode('ai')}
                  >
                    <span className="material-symbols-rounded">smart_toy</span>
                    <span>С ИИ</span>
                  </button>
                  <button
                    type="button"
                    className={`peeker-segment ${gameMode === 'online' ? 'active' : ''}`}
                    onClick={() => setGameMode('online')}
                  >
                    <span className="material-symbols-rounded">groups</span>
                    <span>Онлайн</span>
                  </button>
                </div>
              </div>

              <button type="button" className="btn-pill primary">
                <span
                  key={gameMode}
                  className={`btn-label-text ${
                    gameMode === 'online' ? 'slide-from-right' : 'slide-from-left'
                  }`}
                >
                  {gameMode === 'ai' ? 'Играть' : 'Создать комнату'}
                </span>
              </button>
            </div>

            <button type="button" className="btn-pill outline">
              Присоединиться
            </button>

            {isStandalone ? (
              <span className="pibs-signature">Made by PIBS</span>
            ) : (
              <button
                type="button"
                className="pwa-chip"
                onClick={() => setShowIosSheet(true)}
              >
                <span className="material-symbols-rounded">ios_share</span>
                <span>На экран «Домой»</span>
              </button>
            )}
          </section>
        </main>
      </div>

      <div
        className={`view-panel ${
          currentScreen === 'settings' ? 'settings-active' : 'settings-hidden'
        }`}
      >
        <section className="settings-view">
          <div>
            <header className="settings-header">
              <h1>Настройки</h1>
            </header>

            <div className="settings-content">
              <div className="settings-field-group">
                <span className="settings-field-label">Никнейм</span>
                <div className="settings-input-card">
                  <input
                    type="text"
                    maxLength={22}
                    value={tempNick}
                    onChange={(e) => setTempNick(e.target.value)}
                    placeholder="Ваш никнейм"
                    className="settings-text-input"
                  />
                  <span className="settings-counter">
                    {tempNick.length} / 22
                  </span>
                </div>
                <span className="settings-field-desc">
                  Ваш никнейм будет виден другим игрокам во время игры по сети
                </span>
              </div>

              <div className="settings-field-group">
                <span className="settings-field-label">Аватар</span>
                <div
                  className="avatar-setting-card"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {tempAvatar ? (
                    <div className="avatar-filled-box">
                      <img src={tempAvatar} alt="" />
                    </div>
                  ) : (
                    <div className="avatar-dashed-box">
                      <span className="material-symbols-rounded">add</span>
                    </div>
                  )}

                  <div className="avatar-setting-text">
                    <span className="avatar-setting-title">
                      {tempAvatar ? 'Изменить изображение' : 'Выбрать аватар'}
                    </span>
                    <span className="avatar-setting-sub">
                      Нажмите, чтобы загрузить персональное фото профиля
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarSelect}
                  />
                </div>
              </div>
            </div>
          </div>

          <footer className="settings-footer">
            {hasSettingsChanges ? (
              <button
                type="button"
                className="btn-pill primary"
                onClick={saveSettings}
              >
                Сохранить
              </button>
            ) : (
              <button
                type="button"
                className="btn-pill outline"
                onClick={closeSettings}
              >
                Назад
              </button>
            )}
          </footer>
        </section>
      </div>

      {showIosSheet && (
        <div className="sheet-backdrop" onClick={() => setShowIosSheet(false)}>
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="sheet-preview">
              <img
                src="/app/%D1%8D%D0%BF%D0%BF%D0%BB%20%D1%82%D0%B0%D1%87%20%D0%B0%D0%B9%D1%84%D0%BE%D0%BD%20.png"
                alt="WhoIs"
                className="sheet-preview-icon"
              />
              <div>
                <div className="sheet-preview-title">WhoIs</div>
                <div className="sheet-preview-sub">Веб-приложение для экрана «Домой»</div>
              </div>
            </div>

            <h2 className="sheet-title">Установка на iPhone</h2>
            <p className="sheet-desc">
              Чтобы играть без рамок браузера на весь экран:
            </p>
            <div className="sheet-steps">
              <div className="sheet-step">
                <div className="sheet-step-icon">
                  <span className="material-symbols-rounded">ios_share</span>
                </div>
                <span>Нажмите «Поделиться» внизу Safari</span>
              </div>
              <div className="sheet-step">
                <div className="sheet-step-icon">
                  <span className="material-symbols-rounded">add_box</span>
                </div>
                <span>Выберите «На экран „Домой“»</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-pill primary"
              onClick={() => setShowIosSheet(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
