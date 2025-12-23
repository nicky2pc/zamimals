import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmjh3wc2w01hpjv0ct8ex2f0l"
      config={{
        // Методы логина: email, Google, Twitter (X), wallet
        loginMethods: ['wallet'],

        // Поддерживаемая цепь — только Sepolia
        supportedChains: [
          {
            id: 11155111, // Sepolia
            name: 'Sepolia',
            rpcUrls: {
              default: {
                http: ['https://ethereum-sepolia-rpc.publicnode.com'],
              },
              public: {
                http: ['https://ethereum-sepolia-rpc.publicnode.com'],
              },
            },
            nativeCurrency: {
              name: 'Sepolia Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorers: {
              default: {
                name: 'Etherscan',
                url: 'https://sepolia.etherscan.io',
              },
            },
          },
        ],

        walletConnectCloudProjectId: '1247cce75f33facb80993a3fd3c9a16b',
        // Дополнительные настройки
        mfa: {
          noPromptOnMfaRequired: true,
        },
        appearance: {
          theme: 'light',
          accentColor: '#6e54ff',
          logo: '',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}