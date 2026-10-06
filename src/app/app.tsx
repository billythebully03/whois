import React from 'react';

const universePics = [
  '/pics/marvel/iron_man.png',
  '/pics/marvel/spider_man.png',
  '/pics/marvel/thor.png',
  '/pics/the_boys/homelander.png',
  '/pics/the_boys/billy_butcher.png',
  '/pics/the_boys/starlight.png',
  '/pics/invincible/omni_man.png',
  '/pics/invincible/invincible_mark.png',
  '/pics/invincible/atom_eve.png',
  '/pics/star_wars/darth_vader.png',
  '/pics/star_wars/luke_skywalker.png',
  '/pics/star_wars/yoda.png'
];

const getColumnItems = (offset: number) => {
  const rotated = [
    ...universePics.slice(offset),
    ...universePics.slice(0, offset),
    ...universePics.slice(offset),
    ...universePics.slice(0, offset)
  ];
  return rotated;
};

export const App: React.FC = () => {
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
