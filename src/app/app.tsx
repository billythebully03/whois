import React, { useState } from 'react';

const characterPics = [
  '/pics/Marvel/iron_man.png',
  '/pics/Marvel/spider_man.png',
  '/pics/Marvel/thor.png',
  '/pics/TheBoys/homelander.png',
  '/pics/TheBoys/billy_butcher.png',
  '/pics/TheBoys/starlight.png',
  '/pics/Invincible/omni_man.png',
  '/pics/Invincible/invincible_mark.png',
  '/pics/Invincible/atom_eve.png',
  '/pics/StarWars/darth_vader.png',
  '/pics/StarWars/luke_skywalker.png',
  '/pics/StarWars/yoda.png'
];

const getColumnItems = (offset: number) => {
  return [
    ...characterPics.slice(offset),
    ...characterPics.slice(0, offset),
    ...characterPics.slice(offset),
    ...characterPics.slice(0, offset)
  ];
};

export const App: React.FC = () => {
  const [showIosSheet, setShowIosSheet] = useState(false);

  const col1 = getColumnItems(1);
  const col2 = getColumnItems(3);
  const col3 = getColumnItems(5);
  const col4 = getColumnItems(7);
  const col5 = getColumnItems(9);

  return (
    <main className="home-view">
      <section className="hero-box">
        <div className="marquee-columns">
          <div className="marquee-col c1">
            <div className="track-up">
              {col1.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c2">
            <div className="track-down">
              {col2.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c3">
            <div className="track-up">
              {col3.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c4">
            <div className="track-down">
              {col4.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c5">
            <div className="track-up">
              {col5.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
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

      <section className="home-bottom">
        <button type="button" className="btn-pill primary">
          Играть
        </button>
        <button type="button" className="btn-pill secondary">
          Присоединиться
        </button>
        <button
          type="button"
          className="pwa-chip"
          onClick={() => setShowIosSheet(true)}
        >
          <span className="material-symbols-rounded">ios_share</span>
          <span>На экран «Домой»</span>
        </button>
      </section>

      {showIosSheet && (
        <div className="sheet-backdrop" onClick={() => setShowIosSheet(false)}>
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
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
    </main>
  );
};      <section className="hero-box">
        <div className="marquee-columns">
          <div className="marquee-col c1">
            <div className="track-up">
              {col1.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c2">
            <div className="track-down">
              {col2.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c3">
            <div className="track-up">
              {col3.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c4">
            <div className="track-down">
              {col4.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-col c5">
            <div className="track-up">
              {col5.map((src, i) => (
                <div key={i} className="marquee-card">
                  <img src={src} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.35'; }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-scrim" />

        <div className="hero-overlay">
          <span className="hero-subtitle">Who Is?</span>
          <h1 className="hero-title">Guess A Character</h1>
        </div>
      </section>

      <section className="home-actions">
        <button type="button" className="btn-pill primary">
          Играть
        </button>
        <button type="button" className="btn-pill secondary">
          Присоединиться
        </button>
      </section>
    </main>
  );
};
