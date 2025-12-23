import React from 'react';

interface UsernameModalProps {
  onClose: () => void;
  onCheckAgain: () => void;
  isChecking: boolean;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ onClose, onCheckAgain, isChecking }) => {
  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1200px',
        height: '900px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          backgroundColor: 'rgb(131 102 235)', 
          padding: '40px 38px  20px 38px ', 
          borderRadius: '10px',
          width: '500px',
          minHeight: '550px',
          margin: '0 auto',
          backgroundImage: 'url(/logo_2.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center 15px',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '5px', 
            right: '5px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
        
        <p style={{ color: '#fff', marginBottom: '450px', marginTop: '12px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
          Monad Username Required
        </p>
        <span style={{ fontSize: '15px', display: 'block', color: '#fff', fontWeight: 'bold', letterSpacing: '0.05em', textAlign: 'center' }}>
          You need to register your Monad username to play this game.
        </span>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => window.open('https://monadclip.fun/', '_blank')}
            style={{ 
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#6e54ff',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: 'auto'
            }}
          >
            Register Username
          </button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button 
            disabled={isChecking}
            onClick={onCheckAgain}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            {isChecking ? 'Checking...' : '🔄 Check Again'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsernameModal;


