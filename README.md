# Zamimals – On-Chain Game Using Zama FHE

**Zamimals** is a simple on-chain game powered by **Zama's Fully Homomorphic Encryption (FHE)**.

Players mint a **Confidential Trophy NFT** containing their secret game score.
The score is stored **fully encrypted on-chain** — no one can see it except the owner.
Decryption happens **privately in the owner's browser**.

**Network:** Ethereum Sepolia testnet

---

## Features

- Wallet connect via **Privy**
- Mint trophy with hidden score (client-side FHE encryption)
- Owner-only decryption of the secret score
- Transaction history with decrypt button
- IPFS metadata

---

## Tech Stack

- **Frontend:** React + TypeScript + Privy
- **FHE:** Zama FHEVM + `relayer-sdk-js`
- **Contract:** Solidity + `@fhevm/solidity`

---

## Quick Start

```bash
npm install
```

```bash
npm run dev
```

Open: http://localhost:3000

---

## How to Play

1. Connect wallet
2. Mint your **Zamimals trophy** (enter your game score `0–4294967295`)
3. After mint confirmation, click **🔓 Decrypt score** in transactions
4. Your secret score is revealed — **only to you**

> First decryption requires a **one-time signature** (cached ~1 year).

---

The rest of the game logic is yours to build — this repo gives you the **core confidential scoring system using Zama FHE**.

🏆🔒
Enjoy your private Zamimals achievements!
