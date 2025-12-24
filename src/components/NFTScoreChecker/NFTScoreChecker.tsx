import React, { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { decryptScoreForNFT } from '../../game/fheMintUtils';
import './NFTScoreChecker.css';

interface NFTScoreCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenId?: number;
}

const NFTScoreCheckerModal: React.FC<NFTScoreCheckerModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTokenId 
}) => {
  const [tokenId, setTokenId] = useState<string>(initialTokenId ? initialTokenId.toString() : '');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; score?: number } | null>(null);
  const { wallets } = useWallets();

  const NFT_IMAGE_URL = 'https://ipfs.io/ipfs/bafybeif4pjtchxcmndfr2aqcalblp5go36e7ndb6kasjtrcpvojv55hlia';

  // Auto-fill tokenId if provided
  useEffect(() => {
    if (initialTokenId) {
      setTokenId(initialTokenId.toString());
    }
  }, [initialTokenId]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      if (!initialTokenId) {
        setTokenId('');
      }
    }
  }, [isOpen, initialTokenId]);

  const handleCheckNFT = async () => {
    const id = parseInt(tokenId);
    if (isNaN(id) || id < 0) {
      setResult({ success: false, message: 'Enter valid NFT ID (number)' });
      return;
    }

    const connectedWallet = wallets[0];
    if (!connectedWallet) {
      setResult({ success: false, message: 'Wallet not connected' });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const score = await decryptScoreForNFT(id, connectedWallet);
      setResult({ 
        success: true, 
        message: `🏆 Confidential Score for NFT #${id}`,
        score 
      });
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: `❌ ${error.message || 'Decryption error'}` 
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setTokenId('');
    setResult(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tokenId && !isChecking) {
      handleCheckNFT();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">🔍 NFT SCORE CHECKER</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Enter NFT ID to reveal its confidential score
          </p>
          
          <div className="input-section">
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter NFT ID (e.g., 12)"
              min="0"
              disabled={isChecking}
              className="token-input"
              autoFocus
            />
          </div>

          <div className="button-section">
            <button 
              onClick={handleCheckNFT}
              disabled={isChecking || !tokenId}
              className="check-button"
            >
              {isChecking ? 'CHECKING...' : 'CHECK SCORE'}
            </button>
            
            <button 
              onClick={handleClear}
              disabled={isChecking}
              className="clear-button"
            >
              CLEAR
            </button>
          </div>

          {result && (
            <div className={`result-container ${result.success ? 'success' : 'error'}`}>
              <div className="result-message">
                {result.message}
              </div>
              
              {result.success && result.score !== undefined && (
                <div className="score-display">
                  <div className="nft-image-preview">
                    <img 
                      src={NFT_IMAGE_URL} 
                      alt={`NFT #${tokenId}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200/1b1b1b/f6ffa4?text=CONFIDENTIAL+NFT';
                      }}
                    />
                  </div>
                  <div className="score-value">
                    <span className="score-label">Confidential Score:</span>
                    <span className="score-number">{result.score}</span>
                  </div>
                  <div className="nft-info">
                    <div className="nft-id">Token ID: #{tokenId}</div>
                    <div className="success-message">
                      🔒 Score successfully decrypted from blockchain
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="info-section">
            <h4>💡 HOW IT WORKS:</h4>
            <ul>
              <li>Enter any NFT ID to check its confidential score</li>
              <li>Wallet signature required for secure decryption</li>
              <li>Only the NFT owner can access the encrypted score</li>
              <li>Score remains confidential on the blockchain</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTScoreCheckerModal;