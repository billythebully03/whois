import React from 'react';

export const App: React.FC = () => {
  return (
    <main
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="splash-badge">
        <span className="splash-text">PIBS</span>
      </div>
    </main>
  );
};
