import React from 'react';
import { GameUIProps } from '../../types.ts';
import './GameUI.css';

const GameUI: React.FC<GameUIProps> = ({
  killCount,
  buffTimerValue,
  soundBtnLabelOn,
  onSoundToggle,
  onStopGame,
  volume,
  onVolumeChange,
  ultTimerValue,
  ultCooldownValue,
  dashCooldownSeconds
}) => {
  return (
    <>
      <div className="game-ui-list">
        <div className="game-ui">
          <div className="ui-counter">
            <span className="counter-label">Kills:</span>
            <span className="counter-value">{killCount}</span>
          </div>
        </div>
      </div>

      <div className="game-ui-list game-ui-list-bottom">
        <div className="game-ui">
          <div className="ui-counter">
            <span className="counter-label">Control: </span>
            <span className="counter-value">WASD</span>
          </div>
        </div>
        <div className="game-ui">
          <div className="ui-counter">
            <span className="counter-label">Shoot: </span>
            <span className="counter-value">LM</span>
          </div>
        </div>
        {buffTimerValue ? (
          <div className="game-ui">
            <div className="ui-counter">
              <span className="counter-label">Buff: </span>
              <span className="counter-value">{buffTimerValue}</span>
            </div>
          </div>
        ) : null}
        {/* Cooldown icons */}
        <div className="" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className={`cd-icon ${ultCooldownValue && ultCooldownValue > 0 ? 'cooling' : 'ready'}`} style={{ position: 'relative', width: 150, height: 150, overflow: 'hidden', borderRadius: '50%' }}>
            <img src="/chars/icons/ult_zama.png" alt="ult" style={{ width: '100%', height: '100%', transform: 'scale(1.23)', transition: 'filter 0.2s ease, transform 0.2s ease' }} />
            {
              ultTimerValue && ultTimerValue > 0 ? (
                <span style={{ fontSize: 40, fontWeight: 'bold', inset: 0, background: 'rgba(101, 0, 0, 0.15)', fontFamily: 'Caveat, cursive', color: 'red', transition: 'opacity 0.2s ease', position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ultTimerValue}</span>
              ) : (
                ultCooldownValue && ultCooldownValue > 0 ? (
                  <div className="cd-backdrop" style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Caveat, cursive', fontSize: 40, fontWeight: 'bold', color: '#fff', transition: 'opacity 0.2s ease'
                  }}>{ultCooldownValue}</div>
                ) : <span style={{ fontSize: 40, fontWeight: 'bold', inset: 0, background: 'rgba(0,0,0,0.15)', fontFamily: 'Caveat, cursive', color: '#fff', transition: 'opacity 0.2s ease', position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>R</span>
              )
            }
            
          </div>

        </div>
        <div className="">

        <div className={`cd-icon ${dashCooldownSeconds && dashCooldownSeconds > 0 ? 'cooling' : 'ready'}`} style={{ position: 'relative', width: 150, height: 150, overflow: 'hidden', borderRadius: '50%' }}>
            <img src="/chars/icons/dash_zama.png" alt="dash" style={{ width: '100%', height: '100%', transform: 'scale(1.23)', transition: 'filter 0.2s ease, transform 0.2s ease' }} />
            {dashCooldownSeconds && dashCooldownSeconds > 0 ? (
              <div className="cd-backdrop" style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Caveat, cursive', fontSize: 40, fontWeight: 'bold', color: '#fff', transition: 'opacity 0.2s ease'
              }}>{dashCooldownSeconds}</div>
            ) : <span style={{ fontSize: 40, fontWeight: 'bold',inset: 0, background: 'rgba(0,0,0,0.15)', fontFamily: 'Caveat, cursive', color: '#fff', transition: 'opacity 0.2s ease', position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Q</span>}
          </div>
        </div>
        <div className="ui-counter">
          <button style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 0, 0, 0.3)",
            border: "none",
            padding: "8px 12px",
            borderRadius: "32px"
          }}>
            <span className="counter-label" style={{ color: "#fff" }}>
              🔊
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              style={{
                width: "140px",
                accentColor: "#FFD700"
              }}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                onVolumeChange(value);
                const audioElements = document.getElementsByTagName('audio');
                Array.from(audioElements).forEach(audio => {
                  const baseVolume = parseFloat(audio.dataset.baseVolume || "0.05");
                  audio.volume = (value / 100) * baseVolume;
                });
              }}
            />
          </button>
        </div>
        <div className="ui-counter">
          <button onClick={onStopGame}>
            <span className="counter-label">
              Stop
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default GameUI; 