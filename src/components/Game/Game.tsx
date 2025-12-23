import React, { useState, useRef, useEffect } from 'react';
import { CONFIG } from '../../game/config.ts';
import { Mondalak } from '../../game/classes/Mondalak.ts';
import { Bullet } from '../../game/classes/Bullet.ts';
import { GameState } from '../../types.ts';
import { Enemy } from '../../game/classes/Enemy.ts';
import { Heart } from '../../game/classes/Heart.ts';
import { Buff } from '../../game/classes/Heart.ts';
import createEnemy from '../../game/createEnemy.ts';
import { loadSounds, playRandomSound, playSound, resetGameTransactionCount } from '../../game/utils.ts';
import FaucetModal from './modals/FaucetModal.tsx';
import UsernameModal from './modals/UsernameModal.tsx';
import CharacterSelectModal, { CharacterDef } from './modals/CharacterSelectModal.tsx';
import { drawMap } from './utils/map.ts';
import { getMonadIdWallet, checkUsername } from './utils/username.ts';
import { useUltimate } from './hooks/useUltimate.ts';
import { useFrameMultiplier } from '../../providers/FrameMultiplierProvider.tsx';
import { useTransactions } from '../../hooks/useTransactions.ts';
import { useBalance } from '../../hooks/useBalance.ts';
import { getCachedImage, preloadImages } from '../../game/imageCache.ts';
const LeaderboardPopup = React.lazy(() => import('../LeaderboardPopup/LeaderboardPopup.tsx'));
const TransactionsTable = React.lazy(() => import('../TransactionsTable/TransactionsTable.tsx'));
const GameUI = React.lazy(() => import('../GameUI/GameUI.tsx'));
import {useIdentityToken, usePrivy, useWallets} from '@privy-io/react-auth';

import LoginBtn from '../LoginBtn/LoginBtn.tsx';

const API = import.meta.env.VITE_API_URL;

const Game = () => {
  const {authenticated, ready, login, user} = usePrivy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const explosions = useRef<{ x: number; y: number; frame: number, width: number, height: number }[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const playerTank = useRef<Mondalak | null>(null);
  const bullets = useRef<Bullet[]>([]);
  const isDead = useRef<boolean>(false);
  const audioPool = useRef<HTMLAudioElement[]>([]);
  const hearts = useRef<Heart[]>([]);
  const buffs = useRef<Buff[]>([]);
  const deathParticles = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    created: number;
    size: number;
    alpha: number;
  }>>([]);
  const killCountRef = useRef<number>(0);
  const totalScoreRef = useRef<number>(0);
  const countdownRef = useRef<boolean>(false);
  const isSoundOn = useRef<boolean>(true);
  const buffTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [myTotalScore, setMyTotalScore] = useState<number>(0);
  const { ultActiveRef, ultCooldownRef, ultTimerValue, ultCooldownValue, setUltTimerValue, setUltCooldownValue, activateUlt, ultWeaponImageRef, ultBulletImageRef, resetUlt } = useUltimate(); 
  const frameMultiplier = useFrameMultiplier(); 
  const { transactions, handleMint, handleConfidentialMint, handleTotalScore, clearTransactions, handleFaucet } = useTransactions();
  const {wallets} = useWallets();
  const { updateBalance } = useBalance();
  const { identityToken } = useIdentityToken();
  
  const [weaponSrc] = useState<string>("/chars/weapons/m4a1-s.svg");
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [sounds, setSounds] = useState<{ [key: string]: HTMLAudioElement[] } | null>(null);
  const [soundBtnLabelOn, setSoundBtnLabelOn] = useState(true);
  const [volume, setVolume] = useState(100);
  const volumeRef = useRef<number>(100);
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [buffTimerValue, setBuffTimerValue] = useState<number>(0);
  const [isStartButtonDisabled, setIsStartButtonDisabled] = useState(true);
  const [gameStat, setGameStat] = useState({
    totalScore: 0,
    killCount: 0,
    fireMolandakKillCount: 0,
    damageTaken: 0,
    damageGiven: 0,
    healsUsed: 0,
    buffsTaken: 0
  });
  const gameStatRef = useRef(gameStat);
  useEffect(() => {
    gameStatRef.current = gameStat;
  }, [gameStat]);

  // Character selection
  const characterDefs: CharacterDef[] = [
    { key: 'default', points_to_unlock: 0, name: 'Molandak', src: '/chars/zamimals/zama.png', moveSpeed: 2.0, health: 5, twitter: null },
    { key: 'wick', points_to_unlock: 5, name: 'John', src: '/chars/custom-chars/john.png', moveSpeed: 2, health: 5, twitter: "@JohnWRichKid" },
    { key: 'fish', points_to_unlock: 10, name: 'Tunez', src: '/chars/custom-chars/tunez.png', moveSpeed: 2, health: 5, twitter: "@cryptunez" },
    { key: 'bdnj', points_to_unlock: 20, name: 'Benja', src: '/chars/custom-chars/benja.png', moveSpeed: 2, health: 5, twitter: "@1stBenjaNAD" },
    { key: 'lee', points_to_unlock: 30, name: 'Changpeng Zhao', src: '/chars/custom-chars/lee.png', moveSpeed: 2.1, health: 5, twitter: "@cz_binance" },
    { key: 'intern', points_to_unlock: 50, name: 'Intern', src: '/chars/custom-chars/intern.png', moveSpeed: 2.15, health: 5, twitter: "@intern" },
    { key: "lex", points_to_unlock: 70, name: "Bull market genius", src: '/chars/custom-chars/bull.png', moveSpeed: 2.2, health: 6, twitter: "@bull_genius" },
    { key: 'port', points_to_unlock: 90, name: 'Port', src: '/chars/custom-chars/port.png', moveSpeed: 2.3, health: 6, twitter: "@port_dev" },
    { key: 'bond', points_to_unlock: 110, name: 'James', src: '/chars/custom-chars/james.png', moveSpeed: 2.15, health: 7, twitter: "@_jhunsaker" },
    { key: 'wees', points_to_unlock: 130, name: 'Mike Web', src: '/chars/custom-chars/mike.png', moveSpeed: 2.15, health: 8, twitter: "@mikeinweb" },
    { key: 'beb', points_to_unlock: 150, name: 'Bill Monday', src: '/chars/custom-chars/beb.png', moveSpeed: 2.5, health: 6, twitter: "@billmondays" },
    { key: 'goog', points_to_unlock: 175, name: 'Keone Hon', src: '/chars/custom-chars/goog.png', moveSpeed: 2.7, health: 7, twitter: "@keoneHD" },
    { key: 'daniel', points_to_unlock: 200, name: 'Daniel_', src: '/chars/custom-chars/daniel.png', moveSpeed: 5, health: 4, twitter: "@solodanETH" },
  ];
  const [activeCharacter, setActiveCharacter] = useState<CharacterDef>(characterDefs[0]);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [explosionFrames, setExplosionFrames] = useState<HTMLImageElement[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showShopTooltip, setShowShopTooltip] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [hasMinted, setHasMinted] = useState(false);

  const bulletPoolRef = useRef<Bullet[]>([]);
  const lastDashTimeRef = useRef<number>(0);
  const lastMoveVectorRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const dashEffectsRef = useRef<{ created: number; duration: number; segments: { x1: number; y1: number; x2: number; y2: number; width: number; alpha: number }[] }[]>([]);
  const [dashCooldownSeconds, setDashCooldownSeconds] = useState<number>(0);
  
  const updateGameStat = (
    key: keyof typeof gameStat,
    value: number | ((prev: number) => number)
  ) => {
    setGameStat(prev => ({
      ...prev,
      [key]: typeof value === "function" ? (value as (prev: number) => number)(prev[key]) : value
    }));
  };

  const isUnsupportedBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      (ua.includes("firefox")) ||
      (ua.includes("safari") && !ua.includes("chrome")) ||
      (ua.includes("edg/") && !ua.includes("chrome")) ||  
      ua.includes("tor") 
    );
  };

  const startCountdown = () => {
    setGameState('countdown');
    countdownRef.current = true;
    setCountdownValue(3);

    let counter = 3;
    const countdownInterval = setInterval(() => {
      counter--;
      setCountdownValue(counter);

      if (counter <= 0) {
        clearInterval(countdownInterval);
        countdownRef.current = false;
        setGameState('playing');
      }
    }, 1000);
  };

  const startBuffTimer = (number: number, playerTank: React.RefObject<{ isBuffed: boolean }>) => {
    if (!playerTank.current || gameState !== "playing") return;

    setBuffTimerValue(number);
    playerTank.current.isBuffed = true;

    if (buffTimerRef.current) {
      clearInterval(buffTimerRef.current);
    }

    let counter = number;

    const buffCountDown = setInterval(() => {
      counter--;
      setBuffTimerValue(counter);

      if (counter <= 0) {
        clearInterval(buffCountDown);
        buffTimerRef.current = null;
        if (playerTank.current) {
          playerTank.current.isBuffed = false;
        }
      }
    }, 1000);

    buffTimerRef.current = buffCountDown;
  };

  const loadAllAssets = async () => {
    const enemies = ["/chars/enemy0.png","/chars/enemy1.png","/chars/enemy2.png"]; 
    const bosses = ["/chars/main_enemy0.png"]; 
    const players = [
      "/chars/zamimals/zama.png",
      // "/chars/custom-chars/beb.png",
      // "/chars/custom-chars/goog.png",
      // "/chars/custom-chars/lee.png",
      // "/chars/custom-chars/port.png",
      // "/chars/custom-chars/wees.png",
      // "/chars/custom-chars/mike.jpg",
      // "/chars/custom-chars/daniel.png",
    ];
  
    await preloadImages([...enemies, ...bosses, ...players, weaponSrc]);
  
    const explosionFramesArr = await Promise.all(
      Array.from({ length: 151 - 16 + 1 }, (_, i) => 16 + i).map(async (i) => getCachedImage(`/explotion/frame(${i}).png`))
    );
    setExplosionFrames(explosionFramesArr);
  };

  const toggleSound = () => {
    setSoundBtnLabelOn(!isSoundOn.current)
    isSoundOn.current = !isSoundOn.current;
  };

  const resetGameObjects = async () => {
    resetGameTransactionCount();
    const selected = activeCharacter;
    playerTank.current = new Mondalak(
      canvasRef.current!.width / 2,
      canvasRef.current!.width / 2,
      true,
      CONFIG.BULLET_SPEED,
      CONFIG.FIRE_RATE,
      "#c8aa01ff",
      "main",
      (await getCachedImage(selected.src)),
      (await getCachedImage(weaponSrc))
    );
    // Apply selected stats
    if (playerTank.current) {
      playerTank.current.speed = selected.moveSpeed;
      playerTank.current.health = selected.health;
      playerTank.current.maxHealth = selected.health;
    }

    bullets.current = [];
    hearts.current = [];
    buffs.current = [];
    deathParticles.current = [];
    buffTimerRef.current = null;
    ultActiveRef.current = false;
    dashEffectsRef.current = [];

    updateGameStat("killCount", 0);
    updateGameStat("fireMolandakKillCount", 0);
    updateGameStat("damageTaken", 0);
    updateGameStat("damageGiven", 0);
    updateGameStat("totalScore", 0);
    updateGameStat("healsUsed", 0);
    updateGameStat("buffsTaken", 0);

    setBuffTimerValue(0);
    resetUlt();
    setDashCooldownSeconds(0);

    killCountRef.current = 0;
    totalScoreRef.current = 0;

    isDead.current = false;
    audioPool.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioPool.current = [];

    if (gameState === "countdown") {
      enemies.current = [];
      spawnEnemies(0);
    }

    if (bulletPoolRef.current.length === 0) {
      for (let i = 0; i < 50; i++) {
        bulletPoolRef.current.push(new Bullet(0, 0, 0, 0, '', 0, false, 0, ''));
      }
    }
  };

  const spawnEnemies = (killCount) => {
    if (!killCount) {
      createEnemy(enemies.current, 1, true, "default", frameMultiplier, {});
      return;
    }

    const maxEnemiesAllowed = Math.min(CONFIG.MAX_ENEMIES_BEGINNING + Math.floor(killCount / 10), CONFIG.MAX_ENEMIES);

    if (enemies.current.length < maxEnemiesAllowed) {
      const enemiesToSpawn = maxEnemiesAllowed - enemies.current.length;

      for (let i = 0; i < enemiesToSpawn; i++) {
        const spawnDelay = 150 + Math.random() * (430 - 150);
        setTimeout(() => {
          if (enemies.current.length < maxEnemiesAllowed) {
            const enemyType = Math.random() < 0.05 ? "fire" : "default";
            const difficulty = Math.min(Math.floor(killCount / 10), 10);
            const adjustedDifficulty = enemyType === "fire" ? difficulty * 10 : difficulty;
            enemies.current = createEnemy(enemies.current, adjustedDifficulty, false, enemyType, frameMultiplier, {});
          }
        }, spawnDelay);
      }
    }
  };


  const checkGuestId = async () => {
    const guestId = localStorage.getItem("guestId");
  
    if (!guestId) {
      const res = await fetch(`${API}/api/v1/auth/guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
  
      const data = await res.json();
      const guestId = data.guest_id; 
      if (guestId) {
        localStorage.setItem("guestId", guestId);
      }
    }
  };
  
  useEffect(() => {
    if (authenticated) {
      checkUsernameIfNeeded();
    }
  }, [authenticated]);

  const handleStopGame = async () => {
    const totalScore = totalScoreRef.current;
    //handleTotalScore(totalScore, true, null, gameStatRef.current);
    setGameState("gameover");
    resetUlt();

    if (authenticated && wallets.length > 0) {
      const privyWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
      if (privyWallet) {
        setTimeout(async () => {
          await updateBalance(privyWallet);
        }, 1000);
      }
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1100px)");

    const handleResize = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
      loadSounds().then(loadedSounds => {
        Object.values(loadedSounds).forEach(categoryAudios => {
          categoryAudios.forEach(audio => {
            audio.volume = (volumeRef.current / 100) * 0.10;
          });
        });
        setSounds(loadedSounds);
      });
      
      loadAllAssets().then(() => {
        setAssetsLoaded(true);
      });
      
      setTimeout(() => {
        setIsStartButtonDisabled(false);
      }, 1000);
  }, []);

  useEffect(() => {
    if (gameState === "playing" || gameState === "countdown") {
      if ( assetsLoaded ) {
        resetGameObjects();
      } else {
        loadAllAssets().then(() => {
          setAssetsLoaded(true);
          resetGameObjects();
        });
      }
    setHasMinted(false);
    } else {
      playerTank.current = null;
      enemies.current = [];
      bullets.current = [];
      deathParticles.current = [];
    }

  }, [gameState]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = CONFIG.CANVAS_WIDTH;
    canvasRef.current.height = CONFIG.CANVAS_HEIGHT;

    const keys = { w: false, a: false, s: false, d: false };
    const mouse = { x: 0, y: 0, shooting: false };

    const keyHandler = (e: KeyboardEvent, isKeyDown: boolean) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'ц': keys.w = isKeyDown; break;
        case 'a': case 'ф': keys.a = isKeyDown; break;
        case 's': case 'ы': case "і": keys.s = isKeyDown; break;
        case 'd': case 'в': keys.d = isKeyDown; break;
        case 'r': case 'к':
          if (isKeyDown) {
            tryActivateUlt();
          }
          break;
        case 'q': case 'й':
          if (isKeyDown) {
            performDash();
          }
          break;
      }
    };

    const getScale = () => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return rect.width / CONFIG.CANVAS_WIDTH;
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      const scale = getScale();

      const rect = canvasRef.current!.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / scale;
      mouse.y = (e.clientY - rect.top) / scale;
    };

    const tryActivateUlt = async () => {
      if (ultCooldownRef.current) return;
      const audioPoolNew: HTMLAudioElement[] = playRandomSound(sounds, "ult", isSoundOn.current, audioPool.current, volumeRef.current);
      audioPool.current = audioPoolNew;
      await activateUlt(playerTank.current);
      // expose the weapon override so the renderer can pull it
      (window as any).__ULT_WEAPON_OVERRIDE__ = ultWeaponImageRef.current ?? null;
      (window as any).__ULT_WEAPON_SCALE__ = 1.5; // scale up ult weapon
    };

    const performDash = () => {
      if (!playerTank.current || !canvasRef.current) return;
      const now = Date.now();
      const dashCooldownMs = 1300;
      if (now - lastDashTimeRef.current < dashCooldownMs) return;
      lastDashTimeRef.current = now;
      setDashCooldownSeconds(Math.ceil(dashCooldownMs / 1000));
      // countdown for UI only
      setTimeout(() => setDashCooldownSeconds(1), 500);
      setTimeout(() => setDashCooldownSeconds(0), dashCooldownMs);

      const audioPoolNew: HTMLAudioElement[] = playRandomSound(sounds, "dash", isSoundOn.current, audioPool.current, volumeRef.current);
      audioPool.current = audioPoolNew;

      const dashDistance = 180;
      // prefer last movement direction; if zero, fall back to facing angle
      const mv = lastMoveVectorRef.current;
      const useFacing = Math.abs(mv.x) < 0.001 && Math.abs(mv.y) < 0.001;
      const dirX = useFacing ? Math.cos(playerTank.current.angle) : mv.x;
      const dirY = useFacing ? Math.sin(playerTank.current.angle) : mv.y;
      const startX = playerTank.current.x;
      const startY = playerTank.current.y;
      let targetX = startX + dirX * dashDistance;
      let targetY = startY + dirY * dashDistance;

      // clamp inside arena bounds (same margins as movement)
      targetX = Math.max(45, Math.min(canvasRef.current!.width - 45, targetX));
      targetY = Math.max(45, Math.min(canvasRef.current!.height - 45, targetY));
      
      // create speed-line dash effect (segments fade quickly)
      const perpX = -dirY;
      const perpY = dirX;
      const count = 28;
      const segments: { x1: number; y1: number; x2: number; y2: number; width: number; alpha: number }[] = [];
      for (let i = 0; i < count; i++) {
        const fStart = Math.random() * 0.9;
        const fLen = 0.06 + Math.random() * 0.25;
        const fEnd = Math.min(1, fStart + fLen);
        const len = (fEnd - fStart) * dashDistance;
        const cx = startX + dirX * ((fStart + fEnd) * 0.5 * dashDistance);
        const cy = startY + dirY * ((fStart + fEnd) * 0.5 * dashDistance);
        const off = (Math.random() * 2 - 1) * 12;
        const ox = perpX * off;
        const oy = perpY * off;
        const hx = dirX * (len / 2);
        const hy = dirY * (len / 2);
        segments.push({
          x1: cx - hx + ox,
          y1: cy - hy + oy,
          x2: cx + hx + ox,
          y2: cy + hy + oy,
          width: 2 + Math.random() * 3,
          alpha: 0.6 + Math.random() * 0.3,
        });
      }
      dashEffectsRef.current.push({ created: Date.now(), duration: 260, segments });
      playerTank.current.updatePosition(targetX, targetY);
    };

    const killEnemy = (enemy, enemyIndex) => {
      // explosions.current.push({ x: enemy.x, y: enemy.y, frame: 16, width: 100, height: 96 });
      
      // Create death particles
      const particles = Enemy.createDeathParticles(enemy.x, enemy.y);
      deathParticles.current.push(...particles);
      
      enemies.current.splice(enemyIndex, 1);

      setGameStat(prev => {
        const newKillCount = prev.killCount + 1;
        killCountRef.current = newKillCount;
        totalScoreRef.current = prev.totalScore + (enemy.type === "fire" ? 3 : 1);
        spawnEnemies(newKillCount);
        
        return {
          ...prev,
          totalScore: prev.totalScore + (enemy.type === "fire" ? 3 : 1),
          killCount: newKillCount,
          fireMolandakKillCount: enemy.type === "fire" ? prev.fireMolandakKillCount + 1 : prev.fireMolandakKillCount
        };
      });
      setTimeout(() => {
        const totalScore = totalScoreRef.current;
          //handleTotalScore(totalScore, false, enemy.type === "fire" ? "FIRE_MOLANDAK" : "FLY", gameStatRef.current);
      }, 0);

      if (enemy.type === "fire" && authenticated) {
        setTimeout(() => {
          const totalScore = totalScoreRef.current;
        }, 0);
      } 

      audioPool.current = playRandomSound(sounds, "kill", isSoundOn.current, audioPool.current, volumeRef.current);
      //here
    };

    const updateGameState = () => {
      if (!playerTank.current || !canvasRef.current) return;

      let newX = playerTank.current.x;
      let newY = playerTank.current.y;

      if (keys.w) newY -= playerTank.current.speed * frameMultiplier;
      if (keys.s) newY += playerTank.current.speed * frameMultiplier;
      if (keys.a) newX -= playerTank.current.speed * frameMultiplier;
      if (keys.d) newX += playerTank.current.speed * frameMultiplier;

      newX = Math.max(45, Math.min(canvasRef.current!.width - 45, newX));
      newY = Math.max(45, Math.min(canvasRef.current!.height - 45, newY));

      // capture last movement vector before applying
      const deltaX = newX - playerTank.current.x;
      const deltaY = newY - playerTank.current.y;
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) {
        const len = Math.hypot(deltaX, deltaY) || 1;
        lastMoveVectorRef.current = { x: deltaX / len, y: deltaY / len };
      }

      playerTank.current.updatePosition(newX, newY);

      const dx = mouse.x - playerTank.current.x;
      const dy = mouse.y - playerTank.current.y;
      playerTank.current.angle = Math.atan2(dy, dx);

      if (mouse.shooting && Date.now() - playerTank.current.lastShot > playerTank.current.fireRate) {

        const barrelEndX = playerTank.current.x + Math.cos(playerTank.current.angle) * playerTank.current.barrelSize;
        const barrelEndY = playerTank.current.y + Math.sin(playerTank.current.angle) * playerTank.current.barrelSize;

        const audioPoolNew: HTMLAudioElement[] = playRandomSound(sounds, "shoot", isSoundOn.current, audioPool.current, volumeRef.current - 4);

        audioPool.current = audioPoolNew;

        const bullet = new Bullet(
          barrelEndX,
          barrelEndY,
          playerTank.current.angle,
          playerTank.current.bulletSpeed * frameMultiplier,
          playerTank.current.bulletColor,
          ultActiveRef.current ? 10 : (playerTank.current.isBuffed ? 18 : 7),
          playerTank.current.isPlayer,
          ultActiveRef.current ? 10 : (playerTank.current.isBuffed ? 2 : 1),
          ultActiveRef.current ? "ult" : "player",
          ultActiveRef.current ? ultBulletImageRef.current ?? undefined : undefined
        );
        bullets.current.push(bullet);
        playerTank.current.lastShot = Date.now();
      }

      bullets.current = bullets.current.filter(bullet => !bullet.isExpired);
      bullets.current.forEach(bullet => bullet.update());

      bullets.current.forEach((bullet, bulletIndex) => {
        if (playerTank.current && !bullet.isExpired) {
          const dx = playerTank.current.x - bullet.x;
          const dy = playerTank.current.y - bullet.y;
          if (Math.sqrt(dx * dx + dy * dy) < 35) {
            // Invincible during ultimate
            const dead = playerTank.current.takeDamage(bullet.damage);

            bullets.current.splice(bulletIndex, 1);
            updateGameStat("damageTaken", prev => prev + bullet.damage);
            if (dead && !isDead.current) {
              const totalScore = totalScoreRef.current;
              if (authenticated) {
                //handleTotalScore(totalScore, true, null, gameStatRef.current);
              }

              resetUlt();

              isDead.current = true;
              deathParticles.current = deathParticles.current.concat(Enemy.createDeathParticles(playerTank.current.x, playerTank.current.y));

              playRandomSound(sounds, "death", isSoundOn.current, audioPool.current, volumeRef.current);
              
              setTimeout(() => {
                setGameState("gameover");
              }, 1000);
            } else {
              const audioPoolNew: HTMLAudioElement[] = playSound("/sound/dmg.mp3", isSoundOn.current, audioPool.current, volumeRef.current - 10);
              audioPool.current = audioPoolNew;
            }
          }
        }

        enemies.current.forEach((enemy, enemyIndex) => {
          if (bullet.isPlayer) {
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            if (Math.sqrt(dx * dx + dy * dy) < (enemy.width / 2)) {
              const result = enemy.takeDamage(bullet.damage);
              // For ultimate bullets, do not remove on hit; they pierce through enemies
              if (bullet.type !== 'ult') {
                bullets.current.splice(bulletIndex, 1);
              }
              updateGameStat("damageGiven", prev => prev + bullet.damage);
              
              switch (result) {
                case "drop_heart":
                  hearts.current.push(new Heart(
                    enemy.x,
                    enemy.y
                  ))

                  killEnemy(enemy, enemyIndex);
                  return;
                case "drop_buff":
                  buffs.current.push(new Buff(
                    enemy.x,
                    enemy.y
                  ))

                  killEnemy(enemy, enemyIndex);
                  return;
                case "explode":
                  killEnemy(enemy, enemyIndex);
                  return;
                case false:
                  const pool = playRandomSound(sounds, "hit", isSoundOn.current, audioPool.current, volumeRef.current);
                  audioPool.current = pool;
                  
                  return;
              }
            }
          }
        });

      });
      hearts.current.forEach((heart, heartIndex) => {
        if (playerTank.current) {
          const dx = playerTank.current.x - heart.x;
          const dy = playerTank.current.y - heart.y;

          if (Math.sqrt(dx * dx + dy * dy) < (playerTank.current.width / 2) && playerTank.current.health < playerTank.current.maxHealth) {
            hearts.current.splice(heartIndex, 1);
            const audioPoolNew: HTMLAudioElement[] = playSound("/sound/heal.mp3", isSoundOn.current, audioPool.current, volumeRef.current);

            audioPool.current = audioPoolNew;
            playerTank.current.heal();
            updateGameStat("healsUsed", prev => prev + 1);

          }

          const expired = heart.isExpired();
          if (expired) {
            hearts.current.splice(heartIndex, 1);
          }
        }
      })

      buffs.current.forEach((buff, buffIndex) => {
        if (playerTank.current) {
          const dx = playerTank.current.x - buff.x;
          const dy = playerTank.current.y - buff.y;

          if (Math.sqrt(dx * dx + dy * dy) < (playerTank.current.width / 2)) {
            buffs.current.splice(buffIndex, 1);
            const audioPoolNew: HTMLAudioElement[] = playSound("/sound/heal.mp3", isSoundOn.current, audioPool.current, volumeRef.current);

            audioPool.current = audioPoolNew;
            playerTank.current.isBuffed = true;
            startBuffTimer(10, playerTank);
            updateGameStat("buffsTaken", prev => prev + 1);

          }

          const expired = buff.isExpired();
          if (expired) {
            buffs.current.splice(buffIndex, 1);
          }
        }
      })

      enemies.current.forEach(enemy => {
        const bullet = enemy.updateAI(playerTank.current!.x, playerTank.current!.y);
        if (bullet) {
          bullets.current.push(bullet);
        }
      });
   

      if (killCountRef.current > 10) {
        playerTank.current.maxHealth = 8
      }
    };

    const gameLoop = () => {
      if (!playerTank.current) return;
      
      ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.fillStyle = '#f7f492';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      
      drawMap(ctx);

      // draw dash speed-lines (fade quickly)
      const nowTs = Date.now();
      dashEffectsRef.current = dashEffectsRef.current.filter(e => nowTs - e.created < e.duration);
      dashEffectsRef.current.forEach(eff => {
        const t = (nowTs - eff.created) / eff.duration;
        eff.segments.forEach(seg => {
          const fade = Math.max(0, 1 - t);
          const lw = Math.max(0.5, seg.width * (1 - t * 0.5));
          // dark core
          ctx.save();
          ctx.globalAlpha = seg.alpha * fade * 0.9;
          ctx.strokeStyle = 'rgb(255, 251, 1)';
          ctx.lineWidth = lw + 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
          // purple highlight
          ctx.globalAlpha = seg.alpha * fade * 0.65;
          ctx.strokeStyle = 'rgb(255, 145, 0)';
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
          ctx.restore();
        });
      });

      if (gameState === "playing") {
        updateGameState();
      }

      playerTank.current.draw(ctx, isDead.current);

      enemies.current.forEach(enemy => enemy.draw(ctx));

      bullets.current.forEach(bullet => bullet.draw(ctx));

      hearts.current.forEach(heart => heart.draw(ctx));
      buffs.current.forEach(buff => buff.drawBuff(ctx));

      explosions.current.forEach((explosion, index) => {
        if (explosion.frame >= explosionFrames.length) {
          explosions.current.splice(index, 1);
          return;
        }
        ctx.drawImage(explosionFrames[explosion.frame], explosion.x - (explosion.width / 2) + (10 / 2),
          explosion.y - (explosion.height / 2) + (20 / 2), explosion.height, explosion.height);
        explosion.frame += Math.ceil(frameMultiplier);
      });

      // Update and render death particles
      const now = Date.now();
      deathParticles.current = deathParticles.current.filter(particle => {
        const age = now - particle.created;
        return age < 2000; // Remove after 2 seconds
      });

      deathParticles.current.forEach(particle => {
        const age = now - particle.created;
        const progress = age / 2000; // 0 to 1 over 2 seconds
        
        // Update position
        particle.x += particle.vx * frameMultiplier;
        particle.y += particle.vy * frameMultiplier;
        
        // Fade out over time
        particle.alpha = Math.max(0, 1 - progress);
        
        // Draw red particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e: KeyboardEvent) => keyHandler(e, true);
    const handleKeyUp = (e: KeyboardEvent) => keyHandler(e, false);
    const handleMouseDown = () => { mouse.shooting = true; };
    const handleMouseUp = () => { mouse.shooting = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvasRef.current.addEventListener('mousemove', mouseMoveHandler);
    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    canvasRef.current.addEventListener('mouseup', handleMouseUp);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvasRef.current?.removeEventListener('mousemove', mouseMoveHandler);
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      canvasRef.current?.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState]);

  const handleVolumeChange = (value: number) => {
    setVolume(value); 
    volumeRef.current = value; 
    setSoundBtnLabelOn(value > 0);
    
    audioPool.current.forEach(audio => {
      audio.volume = (value / 100) * 0.10;
    });

    if (sounds) {
      Object.values(sounds).forEach(categoryAudios => {
        categoryAudios.forEach(audio => {
          audio.volume = (value / 100) * 0.10;
        });
      });
    }
  };

  const checkBalanceAndStartGame = () => {
    setHasMinted(false);
    startCountdown();
  };

  const handleFaucetAndStartGame = async () => {
    if (authenticated && wallets.length > 0) {
      const privyWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
      
      if (privyWallet) {
        try {
          await handleFaucet(privyWallet.address);
          setShowFaucetModal(false);
          startCountdown();
          await updateBalance(privyWallet);


          setTimeout(async () => {
            await updateBalance(privyWallet);
          }, 5000);
        } catch (error) {
          console.error("Faucet error in Game:", error);
          setShowFaucetModal(false);
          startCountdown();
        }
      }
    }
  };

  // Checks if a Monad Games ID user has registered a username. If not, opens a modal and blocks game start.
  const checkUsernameIfNeeded = async (): Promise<boolean> => {
    if (!user) return true;
    try {
      const monadIdWalletAddress: string | undefined = getMonadIdWallet(user as any);
      if (!monadIdWalletAddress) {
        setUsername(null);
        localStorage.removeItem('monadUsername');
        localStorage.removeItem('monadUsernameWallet');
        return true;
      }

      setIsCheckingUsername(true);
      const data = await checkUsername(monadIdWalletAddress);
      setIsCheckingUsername(false);

      if (data?.hasUsername) {
        try {
          const name = data?.user?.username || '';
          setUsername(name || null);
          localStorage.setItem('monadUsername', name);
          localStorage.setItem('monadUsernameWallet', monadIdWalletAddress);
        } catch {}
        return true;
      }

      setShowUsernameModal(true);
      return false;
    } catch (e) {
      console.error('Failed to check Monad username:', e);
      setIsCheckingUsername(false);
      setUsername(null);
      localStorage.removeItem('monadUsername');
      localStorage.removeItem('monadUsernameWallet');
      return true;
    }
  };


  if (isMobile) {
    return (
      <div className="bg-mobile bg">
        <div className="mobile-warning">
          <h2>Desktop version only</h2>
          <p>Web version is not available on mobile devices.</p>
        </div>
      </div>
    );
  }

  if (isUnsupportedBrowser()) {
    return (
      <div className="bg-mobile bg">
        <div className="mobile-warning">
          <h2>Unsupported browser</h2>
          <p>Please use browser from the list below.</p>
          <ul style={{
            textAlign: "left",
            padding: 0,
            margin: 0
          }}>
            <li>Chrome</li>
            <li>Edge (Chrome based)</li>
            <li>Safari (Chrome based)</li>
          </ul>
        </div>
      </div>
    );
  }


  return (
    <div className="game-container">
      <div>
        <canvas ref={canvasRef} width={canvasRef.current?.width} height={canvasRef.current?.height}></canvas>
        {
          gameState === "countdown" && (
            <>
              <div className="coundown bg">
                <h1>{countdownValue}</h1>
              </div>
            </>
          )
        }

      {isLeaderboardOpen && (
        <React.Suspense fallback={null}>
          <LeaderboardPopup 
            isOpen={isLeaderboardOpen} 
            onClose={() => setIsLeaderboardOpen(false)} 
          />
        </React.Suspense>
      )}

      {showFaucetModal && (
        <FaucetModal 
          onClose={() => setShowFaucetModal(false)} 
        />
      )}

      {showUsernameModal && (
        <UsernameModal 
          onClose={() => setShowUsernameModal(false)} 
          onCheckAgain={() => { setShowUsernameModal(false); checkUsernameIfNeeded(); }} 
          isChecking={isCheckingUsername}
        />
      )}

      {showCharacterModal && (
        <CharacterSelectModal
          isOpen={showCharacterModal}
          onClose={() => setShowCharacterModal(false)}
          myTotalScore={myTotalScore}
          characters={characterDefs}
          activeKey={activeCharacter.key}
          onSelect={(key) => { setActiveCharacter(characterDefs.find(c => c.key === key) || characterDefs[0]); setShowCharacterModal(false); }}
        />
      )}

        {gameState === 'playing' && (
          <React.Suspense fallback={null}>
            <GameUI
              killCount={gameStat.killCount}
              buffTimerValue={buffTimerValue}
              ultTimerValue={ultTimerValue}
              ultCooldownValue={ultCooldownValue}
              dashCooldownSeconds={dashCooldownSeconds}
              soundBtnLabelOn={soundBtnLabelOn}
              onSoundToggle={toggleSound}
              onStopGame={handleStopGame}
              volume={volume}
              onVolumeChange={handleVolumeChange}
            />
          </React.Suspense>
        )}
        {gameState === 'menu' && (
          <>
            <div className="bg">
              <h1 className='total-score h1'>Kill everyone <br /> Dodge everything</h1>
                <button disabled={isStartButtonDisabled} className="leaderboard-button" onClick={() => setIsLeaderboardOpen(true)}>
                  Leaderboard
                </button>
                <LoginBtn />


                <a 
                  href="https://x.com/solodanETH" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#000',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" fill="white"/>
                  </svg>
                </a>

              <div className="game-menu" style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column" ,
                gap: "10px",
                top: authenticated ? "45%" : "45%"
              }}>
             
                <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                flexDirection: "column"
              }} className="flex-wrapper">
                

                  <button className={authenticated ? "play-btn" : "play-btn-guest"} onClick={checkBalanceAndStartGame} disabled={isStartButtonDisabled}>
                    {authenticated ? "Play" : "Play as a guest"}
                  </button>
                  
                </div>
                  <button disabled={isStartButtonDisabled} style={{
                  marginRight: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255, 255, 255, 0.6)",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "32px"
                }}>
                  <span className="counter-label" style={{ color: "#fff" }}>
                    🔊
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    style={{
                      width: "140px",
                      accentColor: "#FFD700"
                    }}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  />
                </button> 
              </div>
            </div>

          </>
        )}

      {gameState === 'gameover' && (
        <>
          <div className="bg">
            <h1 className='total-score h1'>Your total score: {gameStat.totalScore}</h1>
            <button className="leaderboard-button" onClick={() => setIsLeaderboardOpen(true)}>
              Leaderboard
            </button>
            <LoginBtn />

            <div className="game-menu" style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: "column",
              gap: "20px",
              top: authenticated ? "45%" : "45%"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                flexDirection: "column"
              }} className="flex-wrapper">
                
                <button className={authenticated ? "play-btn" : "play-btn-guest"} onClick={checkBalanceAndStartGame}>
                  {authenticated ? "Play again" : "Play as a guest"}
                </button>

                {/* КНОПКА МИНТА — показываем только если: залогинен, score >= 5 и ещё НЕ минтили в этой сессии */}
                {authenticated && gameStat.totalScore >= 5 && !hasMinted && (
                  <button 
                    className="play-btn"
                    style={{
                      background: '#f6ffa4',
                      color: '#1b1b1b',
                      border: '2px solid #f6ffa4',
                      fontWeight: '700',
                      fontFamily: "'Orbitron', sans-serif",
                      padding: '14px 28px',
                      fontSize: '18px',
                      boxShadow: '0 4px 15px rgba(246, 255, 164, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#f6ffa4';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(246, 255, 164, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f6ffa4';
                      e.currentTarget.style.color = '#1b1b1b';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(246, 255, 164, 0.4)';
                    }}
                    onClick={async () => {
                      const connectedWallet = wallets[0];
                      if (!connectedWallet) {
                        alert("No wallet connected");
                        return;
                      }

                      const currentBalance = await updateBalance(connectedWallet);
                      const balanceNum = parseFloat(currentBalance || '0');

                      if (balanceNum < 0.001) {
                        setShowFaucetModal(true);
                        return;
                      }

                      // Запускаем минт и сразу скрываем кнопку
                      setHasMinted(true);

                      try {
                        await handleConfidentialMint(gameStat.totalScore);
                        // Если минт прошёл успешно — можно показать успех в транзакциях
                      } catch (err) {
                        // Если минт провалился (reject или ошибка) — возвращаем кнопку
                        setHasMinted(false);
                      }
                    }}
                  >
                    🏆 Mint Trophy NFT
                  </button>
                )}

                {/* Если уже минтили — показываем подтверждение */}
                {authenticated && gameStat.totalScore >= 5 && hasMinted && (
                  <div style={{
                    color: '#f6ffa4',
                    fontSize: '18px',
                    textAlign: 'center',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: '700',
                    opacity: 0.9
                  }}>
                    🏆 Trophy NFT mint in progress...
                    <br />
                    <small style={{fontSize: '14px', opacity: 0.8}}>
                      Check transaction in the list below
                    </small>
                  </div>
                )}

                {/* ПОДСКАЗКА — если score от 1 до 4 */}
                {authenticated && gameStat.totalScore > 0 && gameStat.totalScore < 5 && (
                  <div style={{
                    color: '#f6ffa4',
                    fontSize: '16px',
                    textAlign: 'center',
                    opacity: 0.9,
                    fontFamily: "'Space Mono', monospace",
                    marginTop: '10px'
                  }}>
                    Need 5+ points to mint Trophy NFT
                  </div>
                )}

              </div>
            </div>

            <div className="game-stat">
              <div className="row">
                <div className="col">
                  <span>Total kills: {gameStat.killCount}</span>
                  <span>Bosses killed: {gameStat.fireMolandakKillCount}</span>
                  <span>Damage dealt: {gameStat.damageGiven}</span>
                </div>
                <div className="col">
                  <span>Damage taken: {gameStat.damageTaken}</span>
                  <span>Heals used: {gameStat.healsUsed}</span>
                  <span>Buffs taken: {gameStat.buffsTaken}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
      <React.Suspense fallback={null}>
        <TransactionsTable transactions={transactions} clearTransactions={clearTransactions} key={transactions.length} />
      </React.Suspense>
    </div>
  );
};
export default Game;

