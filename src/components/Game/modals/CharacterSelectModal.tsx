import React from 'react';

export type CharacterDef = {
  key: string;
  points_to_unlock: number;
  name: string;
  src: string;
  moveSpeed: number;
  health: number;
  twitter: string | null;
};

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterDef[];
  activeKey: string;
  onSelect: (key: string) => void;
  myTotalScore: number;
}

const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({ isOpen, onClose, characters, activeKey, onSelect, myTotalScore }) => {
  if (!isOpen) return null;
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'absolute', top: 0, left: 0, width: '1200px', height: '900px',
        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'rgb(131 102 235)', padding: 20, borderRadius: 10, width: 780, maxWidth: '92%', color: '#fff' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
          <h2 style={{ margin: 0 }}>Select Character</h2>
          <span style={{ fontSize: 14, opacity: 0.9 }}>Your total penetrations: {myTotalScore}</span></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {characters.map((c) => (
            <button
              key={c.key}
              disabled={myTotalScore < c.points_to_unlock}
              className={`character-select-button-modal`}
              onClick={() => {
                if (myTotalScore >= c.points_to_unlock) {
                  onSelect(c.key);
                } else {
                  alert("You need to have at least " + c.points_to_unlock + " penetrations to unlock this character");
                }
              }}
              style={{
                textAlign: 'left',
                background: activeKey === c.key ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                border: activeKey === c.key ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                borderRadius: 2,
                padding: 12,
                color: '#fff',
                cursor: myTotalScore < c.points_to_unlock ? 'not-allowed' : 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={c.src} style={{ width: 45, height: 45, objectFit: 'contain', borderRadius: 8 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{c.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>{"Penetrations to unlock: " + c.points_to_unlock}</div>
                  {c.twitter && (
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{"X: "} <a style={{ color: '#fff' }} href={c.twitter ? `https://x.com/${c.twitter}` : ''} target='_blank' rel='noopener noreferrer'>{c.twitter ? c.twitter : 'N/A'}</a></div>
                  )}
                  <div style={{ fontSize: 12, marginTop: 6 }}>Move speed: {c.moveSpeed.toFixed(2)} • Health: {c.health}</div>
                </div>
              </div>
            </button>
          ))}

          
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectModal;


