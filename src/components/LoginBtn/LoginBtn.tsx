import React, { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getFormattedBalance } from '../../game/utils.ts';
import { sepolia } from 'viem/chains'; // если понадобится switchChain

export default function LoginBtn() {
  const { ready: privyReady, authenticated, login, logout, isModalOpen } = usePrivy();
  const { wallets } = useWallets();

  // ← ИЗМЕНЕНИЕ: берём первый подключённый wallet (любой тип)
  const connectedWallet = wallets[0]; // обычно первый — активный

  const fullAddress = connectedWallet?.address || '';
  const shortAddress = fullAddress
    ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`
    : ''; 

  const [displayText, setDisplayText] = useState(shortAddress);
  const [balance, setBalance] = useState('0.0000');

  const updateBalance = async () => {
    if (!connectedWallet) return;

    try {
      // Опционально: если нужно принудительно на Sepolia
      const currentChain = connectedWallet.chainId?.split(':')[1];
      if (Number(currentChain) !== sepolia.id) {
          await connectedWallet.switchChain(sepolia.id);
      }

      const formatted = await getFormattedBalance(connectedWallet);
      setBalance(formatted);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0.0000');
    }
  };

  const copyAddress = async () => {
    if (!fullAddress) return;
    await navigator.clipboard.writeText(fullAddress);
    setDisplayText('Copied!');
    setTimeout(() => setDisplayText(shortAddress), 2000);
  };

  const handleLoginClick = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  useEffect(() => {
    setDisplayText(shortAddress);
  }, [shortAddress]);

  // Обновляем баланс при изменении wallet'а или аутентификации
  useEffect(() => {
    if (authenticated && connectedWallet) {
      updateBalance();

      // Опционально: автообновление баланса каждые 15 сек
      const interval = setInterval(updateBalance, 15000);
      return () => clearInterval(interval);
    } else {
      setBalance('0.0000');
    }
  }, [authenticated, connectedWallet]); // ← зависим от connectedWallet

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isModalOpen]);

  if (!privyReady) {
    return null; // или лоадер
  }

  return (
    <>
      <button className="login-btn" onClick={handleLoginClick} disabled={!privyReady}>
        <span>{authenticated ? 'Logout' : 'Login'}</span>
      </button>

      {authenticated && fullAddress && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
          <div
            className="username-container"
            onClick={copyAddress}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to copy address"
          >
            <p
              style={{
                background: displayText === 'Copied!' ? 'linear-gradient(90deg, #d4e87c 0%, #f6ffa4 100%)' : 'none',
                WebkitBackgroundClip: displayText === 'Copied!' ? 'text' : 'initial',
                WebkitTextFillColor: displayText === 'Copied!' ? 'transparent' : 'inherit',
                fontWeight: displayText === 'Copied!' ? '700' : 'normal',
                transition: 'all 0.3s ease',
                margin: 0,
              }}
            >
              {displayText}
            </p>
          </div>

          <div className="balance-container">
            <p>{balance} ETH</p>
          </div>
        </div>
      )}
    </>
  );
}