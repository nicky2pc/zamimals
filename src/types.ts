// Game States
export type GameState = 'menu' | 'playing' | 'gameover' | "countdown";

// Component Props
export interface GameUIProps {
  killCount: number;
  buffTimerValue: number;
  ultTimerValue?: number;
  ultCooldownValue?: number;
  dashCooldownSeconds?: number;
  soundBtnLabelOn: boolean;
  onSoundToggle: () => void;
  onStopGame: () => void;
  volume: number;
  onVolumeChange: (value: number) => void;
}

export interface TransactionsTableProps {
  transactions: Transaction[];
  clearTransactions?: () => void;
}

export interface LeaderboardPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ProvidersProps {
  children: React.ReactNode;
}

// Game Objects
export interface Transaction {
  id: number;
  type: string;
  link: string;
  date: number;
  tx_url?: string;
  error?: string;
  userAddress?: string;
}

export interface LeaderboardRecord {
  id: string;
  score: number;
  tx: string;
  address: string;
  hash_tx: string;
  url: string;
  total_score?: number;
  username?: string;
  updated_at?: string;
  record_score?: number;
  wallet?: string;
}

export interface ImageCache {
  enemies: {
    [key: string]: HTMLImageElement;
  };
  fire: {
    [key: string]: HTMLImageElement;
  };
  player: {
    [key: string]: HTMLImageElement;
  };
  weapons: {
    [key: string]: HTMLImageElement;
  };
}

// Game Stats
export interface GameStats {
  totalScore: number;
  killCount: number;
  fireMolandakKillCount: number;
  damageTaken: number;
  damageGiven: number;
  healsUsed: number;
  buffsTaken: number;
}

// Game Controls
export interface GameKeys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export interface GameMouse {
  x: number;
  y: number;
  shooting: boolean;
}

// Game Objects
export interface Explosion {
  x: number;
  y: number;
  frame: number;
  width: number;
  height: number;
}

// Hook Return Types
export interface UseTransactionsReturn {
  transactions: Transaction[];
  handleMint: (killCount: number) => void;
  handleConfidentialMint: (score: number) => Promise<string>;
  handleTotalScore: (score: number, isDead: boolean, unitType?: 'FLY' | 'FIRE_MOLANDAK' | null, gameStat?: GameStats) => void;
  handleFaucet: (address: string) => Promise<void>;
  clearTransactions: () => void;
}

// Utils Types
export type LeaderboardResponse = {
  url?: string;
  error: string;
  message?: string;
  tx_url?: string;
  mon?: number;
  tx?: string;
  userAddress?: string;
  deadline_seconds?: number;
};

export interface UpdateTransactionCallback {
  (): Promise<any>;
}

// Error Types
export interface ApiError {
  detail: string;
} 