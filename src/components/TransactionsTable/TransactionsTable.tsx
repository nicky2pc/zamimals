import React, { useEffect, useRef, useState } from 'react';
import { Transaction, TransactionsTableProps } from '../../types.ts';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useTransactions } from '../../hooks/useTransactions.ts';
import NFTScoreCheckerModal from '../NFTScoreChecker/NFTScoreChecker';
import './TransactionsTable.css';

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, clearTransactions }) => {
  const prevTransactionsRef = useRef<Transaction[]>([]);
  const { logout } = usePrivy();
  const { handleFaucet } = useTransactions();
  const { wallets } = useWallets();
  const [isNFTCheckerOpen, setIsNFTCheckerOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | undefined>();

  const CONTRACT_EXPLORER_URL = 'https://sepolia.etherscan.io/address/0x7e6114bAB8ADf97d88e028697a9D0CF11A6af9e0';
  const NFT_IMAGE_URL = 'https://ipfs.io/ipfs/bafybeif4pjtchxcmndfr2aqcalblp5go36e7ndb6kasjtrcpvojv55hlia';

  const handleInteractiveLink = (e: React.MouseEvent<HTMLTableElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('interactive-link')) {
      e.preventDefault();
      const action = target.getAttribute('data-action');
      if (action === 'logout') {
        logout();
      } else if (action === 'faucet') {
        const privyWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
        if (privyWallet) {
          handleFaucet(privyWallet.address);
        }
      }
    }
  };

  useEffect(() => {
    prevTransactionsRef.current = [...transactions];
  }, [transactions]);

  const handleClearTransactions = () => {
    if (clearTransactions && window.confirm('Are you sure you want to clear all transactions?')) {
      clearTransactions();
    }
  };

  const isFheMint = (type: string) => type.startsWith('FHE Mint');

  // Format error messages
  const formatError = (error: string) => {
    if (!error) return '';

    if (error.includes('Not owner')) {
      return 'Access denied - not NFT owner';
    }
    
    if (error.includes('4001') || error.includes('user rejected') || error.includes('ACTION_REJECTED')) {
      return 'Transaction rejected by user';
    }

    if (error.includes('insufficient funds')) {
      return 'Insufficient funds for gas';
    }

    if (error.includes('nonce too low')) {
      return 'Nonce error — try again';
    }

    return error.length > 100 ? error.slice(0, 97) + '...' : error;
  };

  // Extract token ID from transaction type
  const extractTokenInfo = (type: string) => {
    const match = type.match(/FHE Mint \((\d+)\)/);
    if (match) {
      return {
        tokenId: parseInt(match[1]),
        score: parseInt(match[1]) // If you want to use the minted score
      };
    }
    return null;
  };

  // Open NFT checker modal
  const openNFTChecker = (tokenId?: number) => {
    setSelectedTokenId(tokenId);
    setIsNFTCheckerOpen(true);
  };

  // Get unique minted NFTs from transactions
  const mintedNFTs = transactions
    .filter(tx => isFheMint(tx.type) && tx.link && tx.link !== "Pending..." && tx.link !== "Not processed")
    .map(tx => {
      const tokenInfo = extractTokenInfo(tx.type);
      if (tokenInfo) {
        return {
          tokenId: tokenInfo.tokenId,
          date: new Date(tx.date),
          txHash: tx.link?.split('/').pop() || ''
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.tokenId - a.tokenId);

  return (
    <div className="transactions">
      <div className="header">
        <h2>Transactions {transactions.length ? `(${transactions.length})` : null}</h2>
        {mintedNFTs.length >= 0 && (
          <button 
            onClick={() => openNFTChecker()}
            className="nft-checker-btn"
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              background: '#f6ffa4',
              color: '#1b1b1b',
              border: 'none',
              borderRadius: '32px',
              cursor: 'pointer',
              fontWeight: '700',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '14px'
            }}
          >
            🔍 Check NFT Scores
          </button>
        )}
        {clearTransactions && transactions.length > 0 && (
          <button onClick={handleClearTransactions} className="clear-btn">
            Clear transactions
          </button>
        )}
      </div>

      {mintedNFTs.length > 0 && (
        <div className="nft-display-section">
          <h3 style={{ color: '#f6ffa4', marginBottom: '15px' }}>
            🏆 Your Confidential Trophy NFTs
          </h3>
          <div className="nft-grid">
            {mintedNFTs.map((nft: any) => (
              <div key={nft.tokenId} className="nft-card">
                <div className="nft-image">
                  <img 
                    src={NFT_IMAGE_URL} 
                    alt={`NFT #${nft.tokenId}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150/1b1b1b/f6ffa4?text=NFT';
                    }}
                  />
                </div>
                <div className="nft-info">
                  <div className="nft-id">Token ID: #{nft.tokenId}</div>
                  <div className="nft-date">
                    {nft.date.toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => openNFTChecker(nft.tokenId)}
                    className="check-score-btn"
                  >
                    Check Score
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length ? (
        <div className="table-wrapper">
          <table className="transactions-table" onClick={handleInteractiveLink}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => {
                const isSuccessfulFheMint = isFheMint(tx.type) && tx.link && tx.link !== "Pending..." && tx.link !== "Not processed";

                return (
                  <tr key={`${tx.id}-${index}`} datatype={tx.type.split(' ')[0].replace(':', '')}>
                    <td>{tx.type}</td>
                    <td>
                      {tx.error ? (
                        <span className="error-text">{formatError(tx.error)}</span>
                      ) : !tx.link || tx.link === 'Pending...' || tx.link === 'Not processed' ? (
                        <span className="pending">{tx.link}</span>
                      ) : isFheMint(tx.type) ? (
                        <span>
                          Congrats! You minted a{' '}
                          <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
                            Confidential Trophy NFT
                          </a>
                          {' '}🏆 | Tx:{' '}
                          <a href={tx.link} target="_blank" rel="noopener noreferrer">
                            {tx.link.slice(-12)}
                          </a>
                        </span>
                      ) : (
                        <a href={tx.link} target="_blank" rel="noopener noreferrer">
                          {tx.link.length > 60 ? `${tx.link.slice(0, 30)}...${tx.link.slice(-8)}` : tx.link}
                        </a>
                      )}
                    </td>
                    <td>{new Date(tx.date).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <span className="regular">You have no transactions</span>
      )}

      {/* NFT Score Checker Modal */}
      <NFTScoreCheckerModal
        isOpen={isNFTCheckerOpen}
        onClose={() => setIsNFTCheckerOpen(false)}
        initialTokenId={selectedTokenId}
      />
    </div>
  );
};

export default TransactionsTable;