import React from 'react';
import './Banner.css';

const Banner = () => {
  return (
    <div className="banner-container">
      <div className="banner-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="stars"></div>
      </div>
      
      <div className="banner-content">
        <div className="banner-icon-wrapper">
          <div className="icon-glow"></div>
          <img src="/zama_monster_icon.png" alt="Zama Network" className="banner-icon" />
        </div>
        
        <div className="banner-text">
          <div className="token-name-wrapper">
            <h1 className="token-name">$ZAMA</h1>
            <div className="announcement">
              <span className="coming-soon">🚀 LIVE ON MAINNET!</span>
              <div className="pulse-dot"></div>
            </div>
          </div>
        </div>
        
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
