import { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../game/config.ts';
import { Transaction, UseTransactionsReturn, UpdateTransactionCallback, LeaderboardResponse } from '../types.ts';
import { useIdentityToken, usePrivy, useUser } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';

import { mintConfidentialNFT, getExplorerUrl } from '../game/fheMintUtils.ts';


const TRANSACTIONS_UPDATED_EVENT = 'transactions-updated';

const dispatchTransactionsUpdated = (transactions: Transaction[]) => {
  const event = new CustomEvent(TRANSACTIONS_UPDATED_EVENT, { detail: transactions });
  window.dispatchEvent(event);
};

let globalTransactions: Transaction[] = (() => {
  const savedTransactions = localStorage.getItem("transactions");
  if (!savedTransactions) return [];

  let parsedTransactions = JSON.parse(savedTransactions);

  parsedTransactions = parsedTransactions.map(tx => 
    (!tx.link || tx.link === "Pending...") ? { ...tx, link: "Not processed" } : tx
  );

  localStorage.setItem("transactions", JSON.stringify(parsedTransactions));
  return parsedTransactions;
})();

const updateGlobalTransactions = (newTransactions: Transaction[]) => {
  globalTransactions = newTransactions;
  localStorage.setItem("transactions", JSON.stringify(globalTransactions));
  dispatchTransactionsUpdated(globalTransactions);
};

export const useTransactions = (): UseTransactionsReturn => {
  const {wallets} = useWallets();
  const {authenticated, user, getAccessToken} = usePrivy();
  const { refreshUser } = useUser();
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const { identityToken } = useIdentityToken();
  const identityTokenRef = useRef<string | null>(identityToken);
  useEffect(() => { identityTokenRef.current = identityToken; }, [identityToken]);
  
  const [transactions, setTransactions] = useState<Transaction[]>(globalTransactions);
  const scoreBufferRef = useRef<number | null>(null);
  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const pendingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleTransactionsUpdated = (event: CustomEvent<Transaction[]>) => {
      if (event.detail) {
        setTransactions([...event.detail]);
      } else {
        setTransactions([...globalTransactions]);
      }
    };

    window.addEventListener(TRANSACTIONS_UPDATED_EVENT, handleTransactionsUpdated as EventListener);
    
    setTransactions([...globalTransactions]);
    
    return () => {
      window.removeEventListener(TRANSACTIONS_UPDATED_EVENT, handleTransactionsUpdated as EventListener);
    };
  }, []);

  const updateTransactions = (transaction: Transaction, callback: UpdateTransactionCallback) => {
    const { id, type } = transaction;
    
    const updated = [transaction, ...globalTransactions];
    if (updated.length > CONFIG.MAX_TRANSACTIONS) {
      updated.length = CONFIG.MAX_TRANSACTIONS;
    }
    
    updateGlobalTransactions(updated);

    callback()
      .then((data) => {
        const updatedTransactions = globalTransactions.map(tx => {
          if (tx.id === id && tx.type === type) {
            if (tx.type === "Faucet") {
              if (data?.tx) {
                return {
                  ...tx,
                  type: `Faucet: ${data.mon} MON`,
                  link: `https://testnet.monadexplorer.com/tx/${data.tx}`,
                  date: Date.now(),
                  error: ""
                };
              } else if (data?.error) {
                const formatSeconds = (seconds: number) => {
                  const totalSeconds = Math.floor(seconds);
                  
                  if (totalSeconds >= 86400) {
                    const days = Math.floor(totalSeconds / 86400);
                    const hours = Math.floor((totalSeconds % 86400) / 3600);
                    return `${days}d ${hours}h`;
                  }
                  else if (totalSeconds >= 3600) {
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const remainingSeconds = totalSeconds % 60;
                    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                  } else {
                    const minutes = Math.floor(totalSeconds / 60);
                    const remainingSeconds = totalSeconds % 60;
                    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                  }
                };
                return {
                  ...tx,
                  link: "",
                  date: Date.now(),
                  error: data.error + (data?.deadline_seconds ? " " + formatSeconds(data?.deadline_seconds) + " left" : "")
                };
              }
            }
            
            return {
              ...tx,
              link: (data?.tx_url ?? tx.link) as string,
              tx_url: data?.tx_url ?? tx.tx_url,
              date: Date.now(),
              error: data?.error ?? tx.error
            };
          }
          return tx;
        });
        
        updateGlobalTransactions(updatedTransactions);
      })
      .catch(() => {
        const updatedTransactions = globalTransactions.map(tx =>
          tx.id === id && tx.type === type
            ? { ...tx, link: "", date: Date.now(), error: tx.error ? tx.error : "Unexpected error" }
            : tx
        );
        
        updateGlobalTransactions(updatedTransactions);
      });
  };

  const handleMint = (killCount: number) => {
    const transaction: Transaction = {
      id: Date.now(),
      type: `Mint: ${killCount}`,
      link: "Pending...",
      date: Date.now(),
      error: "",
      userAddress: privyWallet?.address || ""
    };

    updateTransactions(transaction, () => import('../game/utils.ts').then(m => m.mint(wallets, authenticated)));
  };

  const handleConfidentialMint = async (score: number) => {
    // Берём первый активный кошелёк — работает и с Privy, и с MetaMask
    const connectedWallet = wallets[0];
  
    if (!connectedWallet) {
      throw new Error("No wallet connected");
    }
  
    const transaction: Transaction = {
      id: Date.now(),
      type: `FHE Mint: ${score}`,
      link: "Pending...",
      date: Date.now(),
      error: "",
      userAddress: connectedWallet.address
    };
  
    // Добавляем транзакцию в список
    const updated = [transaction, ...globalTransactions];
    if (updated.length > CONFIG.MAX_TRANSACTIONS) {
      updated.length = CONFIG.MAX_TRANSACTIONS;
    }
    updateGlobalTransactions(updated);
  
    try {
      // Используем connectedWallet вместо privyWallet
      const txHash = await mintConfidentialNFT(
        connectedWallet,
        score,
        (status) => {
          console.log(`[FHE Mint] ${status}`);
        }
      );
  
      // Обновляем транзакцию с хэшем
      const updatedTransactions = globalTransactions.map(tx =>
        tx.id === transaction.id
          ? {
              ...tx,
              link: getExplorerUrl(txHash),
              date: Date.now(),
              error: ""
            }
          : tx
      );
      updateGlobalTransactions(updatedTransactions);
  
      return txHash;
    } catch (error: any) {
      // В случае ошибки обновляем транзакцию
      const updatedTransactions = globalTransactions.map(tx =>
        tx.id === transaction.id
          ? {
              ...tx,
              link: "",
              date: Date.now(),
              error: error.message || "Mint failed"
            }
          : tx
      );
      updateGlobalTransactions(updatedTransactions);
      throw error;
    }
  };

  const handleFaucet = async (address: string) => {
    const transaction: Transaction = {
      id: Date.now(),
      type: `Faucet`,
      link: "Pending...",
      date: Date.now(),
      error: ""
    };
    
    const updated = [transaction, ...globalTransactions];
    if (updated.length > CONFIG.MAX_TRANSACTIONS) {
      updated.length = CONFIG.MAX_TRANSACTIONS;
    }
    updateGlobalTransactions(updated);
    
    return new Promise<void>(async (resolve, reject) => {
      import('../game/utils.ts')
        .then(async utils => {
          // Try with current token first
          let tokenToUse = identityTokenRef.current;
          let data = await utils.faucet(address, tokenToUse);
          // If backend reports auth error, refresh identity token and retry once
          if ((data as any)?.error && String((data as any).error).toLowerCase().includes('token')) {
            try {
              await refreshUser();
            } catch {}
            tokenToUse = identityTokenRef.current;
            data = await utils.faucet(address, tokenToUse);
          }
          return data;
        })
        .then(data => {
          const currentTransactions = [...globalTransactions];
          
          const updatedTransactions = currentTransactions.map(tx => {
            if (tx.id === transaction.id && tx.type === transaction.type) {
              
              if (data && data.message) {
                const updatedTx = {
                  ...tx,
                  type: `Faucet`,
                  link: ``,
                  date: Date.now(),
                  error: data.message
                };
                return updatedTx;
              } else if (data?.error || data.deadline_seconds) {
                const formatSeconds = (seconds: number) => {
                  if (!seconds) return "";
                  const totalSeconds = Math.floor(seconds);
                  
                  if (totalSeconds >= 86400) {
                    const days = Math.floor(totalSeconds / 86400);
                    const hours = Math.floor((totalSeconds % 86400) / 3600);
                    return `${days}d ${hours}h`;
                  }
                  else if (totalSeconds >= 3600) {
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const remainingSeconds = totalSeconds % 60;
                    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                  } else {
                    const minutes = Math.floor(totalSeconds / 60);
                    const remainingSeconds = totalSeconds % 60;
                    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                  }
                };
                
                const updatedTx = {
                  ...tx,
                  link: "",
                  date: Date.now(),
                  error: data.error + (data.deadline_seconds ? " " + formatSeconds(data.deadline_seconds) + " left" : "")
                };
                return updatedTx;
              }
            }
            return tx;
          });
          
          
          updateGlobalTransactions(updatedTransactions);
          
          dispatchTransactionsUpdated(updatedTransactions);
          
          resolve();
        })
        .catch(error => {
          console.error("Faucet API error:", error);
          
          const currentTransactions = [...globalTransactions];
          
          const updatedTransactions = currentTransactions.map(tx =>
            tx.id === transaction.id && tx.type === transaction.type
              ? { ...tx, link: "", date: Date.now(), error: "Unexpected error: " + (error?.message || String(error)) }
              : tx
          );
          
          updateGlobalTransactions(updatedTransactions);
          
          dispatchTransactionsUpdated(updatedTransactions);
          
          resolve();
        });
    });
  };

  const handleTotalScore = async (score: number, isDead = false, unitType?: 'FLY' | 'FIRE_MOLANDAK' | null, gameStat?: any) => {
    const accessToken = await getAccessToken();
    
    const submit = (finalScore: number, finalIsDead: boolean) => {
      const transaction: Transaction = {
        id: Date.now(),
        type: finalIsDead ? `Death: ${finalScore}` : `Kill: ${finalScore}`,
        link: "Pending...",
        date: Date.now(),
        error: ""
      };

      updateTransactions(transaction, async () => {
        if ( authenticated ) {
          // Ensure identity token is fresh
          if (finalIsDead) {
            try { await refreshUser(); } catch {}
          }
          const freshIdentityToken = identityTokenRef.current;
          return import('../game/utils.ts').then(m => m.sendTransaction(finalScore, wallets, accessToken, freshIdentityToken, authenticated, finalIsDead, user, gameStat))
        } else {
          return import('../game/utils.ts').then(m => m.sendTransactionAsGuest({score: finalScore, isDead: finalIsDead, unitType: unitType ?? "FLY"}))
        }
      });
    };

    // For ongoing kills, debounce and serialize submissions to avoid nonce and underpriced errors
    if (!isDead && authenticated) {
      scoreBufferRef.current = score;

      if (isSubmittingRef.current) {
        pendingRef.current = true;
        return;
      }

      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }

      submitTimerRef.current = setTimeout(() => {
        const buffered = scoreBufferRef.current ?? score;
        isSubmittingRef.current = true;
        submit(buffered, false);
        // After a short delay, allow next submission or flush pending
        setTimeout(() => {
          isSubmittingRef.current = false;
          if (pendingRef.current) {
            pendingRef.current = false;
            // Schedule immediate next send with latest buffer
            handleTotalScore(scoreBufferRef.current ?? buffered, false, unitType, gameStat);
          }
        }, 0);
      }, 0);

      return;
    }

    // On death or guests: send immediately
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    isSubmittingRef.current = true;
    submit(score, isDead);
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 800);
  };

  const clearTransactions = () => {
    updateGlobalTransactions([]);
  };

  return {
    transactions,
    handleMint,
    handleConfidentialMint,
    handleTotalScore,
    handleFaucet,
    clearTransactions
  };
}; 