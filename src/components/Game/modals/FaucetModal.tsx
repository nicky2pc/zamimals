import React from 'react';

interface FaucetModalProps {
  onClose: () => void;
}

const FaucetModal: React.FC<FaucetModalProps> = ({ onClose }) => {
  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          background: '#1b1b1b',
          padding: '40px 30px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '520px',
          textAlign: 'center',
          border: '2px solid #f6ffa4',
          boxShadow: '0 0 30px rgba(246, 255, 164, 0.4)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '12px', 
            right: '12px',
            background: 'none',
            border: 'none',
            color: '#f6ffa4',
            fontSize: '28px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        
        <h2 style={{ 
          color: '#f6ffa4', 
          fontSize: '32px', 
          margin: '0 0 20px 0',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(246, 255, 164, 0.5)'
        }}>
          Not enough gas?
        </h2>

        <p style={{ 
          color: '#fff', 
          fontSize: '18px', 
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>
          To mint your Trophy NFT on Zama fhEVM (Sepolia), you need a little Sepolia ETH for gas.
        </p>

        <a 
          href="https://www.alchemy.com/faucets/ethereum-sepolia" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: 'linear-gradient(90deg, #f6ffa4 0%, #d4e87c 100%)',
            color: '#1b1b1b',
            fontWeight: 'bold',
            fontSize: '20px',
            borderRadius: '12px',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(246, 255, 164, 0.5)',
            marginBottom: '20px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Get Sepolia ETH — Alchemy Faucet
        </a>

        <p style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.5' }}>
          Other options:<br/>
          <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" style={{ color: '#f6ffa4' }}>sepoliafaucet.com</a> • 
          <a href="https://faucet.quicknode.com/ethereum/sepolia" target="_blank" rel="noopener noreferrer" style={{ color: '#f6ffa4' }}>QuickNode</a>
        </p>
      </div>
    </div>
  );
};

export default FaucetModal;