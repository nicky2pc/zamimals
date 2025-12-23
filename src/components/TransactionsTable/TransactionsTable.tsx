import React, { useEffect, useRef } from 'react';
import { Transaction, TransactionsTableProps } from '../../types.ts';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useTransactions } from '../../hooks/useTransactions.ts';
import './TransactionsTable.css';

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, clearTransactions }) => {
  const prevTransactionsRef = useRef<Transaction[]>([]);
  const { logout } = usePrivy();
  const { handleFaucet } = useTransactions();
  const { wallets } = useWallets();

  const CONTRACT_EXPLORER_URL = 'https://sepolia.etherscan.io/address/0x7e6114bAB8ADf97d88e028697a9D0CF11A6af9e0';

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

  // Форматируем ошибку — скрываем технический мусор
  const formatError = (error: string) => {
    if (!error) return '';

    // Если юзер отклонил транзакцию
    if (error.includes('4001') || error.includes('user rejected') || error.includes('ACTION_REJECTED')) {
      return 'Transaction rejected by user';
    }

    // Другие частые ошибки
    if (error.includes('insufficient funds')) {
      return 'Insufficient funds for gas';
    }
    if (error.includes('nonce too low')) {
      return 'Nonce error — try again';
    }

    // По умолчанию — коротко
    return error.length > 100 ? error.slice(0, 97) + '...' : error;
  };

  return (
    <div className="transactions">
      <div className="header">
        <h2>Transactions {transactions.length ? `(${transactions.length})` : null}</h2>
        {clearTransactions && transactions.length > 0 && (
          <button onClick={handleClearTransactions} className="clear-btn">
            Clear transactions
          </button>
        )}
      </div>

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
              {transactions.map((tx, index) => (
                <tr key={`${tx.id}-${index}`} datatype={tx.type.split(' ')[0].replace(':', '')}>
                  <td>{tx.type}</td>
                  <td>
                    {tx.error ? (
                      <span className="error-text">{formatError(tx.error)}</span>
                    ) : !tx.link || tx.link === 'Pending...' || tx.link === 'Not processed' ? (
                      <span className="pending">{tx.link}</span>
                    ) : isFheMint(tx.type) ? (
                      // Одна строка — поздравление + ссылки
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <span className="regular">You have no transactions</span>
      )}
    </div>
  );
};

export default TransactionsTable;