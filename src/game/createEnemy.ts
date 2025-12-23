import { Enemy } from "./classes/Enemy.ts";
import { Weapon } from "./classes/Weapon.ts";
import { CONFIG } from "./config.ts";
import { getImageFromCache } from "./imageCache.ts";

const ENEMY_COLORS = ["#eb4034", "#635a19", "#b34a09", "#0a6349", "#0b1852", "#380613", "#000000"];

export default function createEnemy(enemiesRef, difficulty: number, firstPlayer: boolean, type: string, frameMultiplier: number, imageCache?: any) {
  if (enemiesRef.length >= CONFIG.MAX_ENEMIES) {
    return enemiesRef;
  }
  
  const padding = 100;
  const randomX = padding + Math.random() * (CONFIG.CANVAS_WIDTH - padding * 2);
  const randomY = padding + Math.random() * (CONFIG.CANVAS_HEIGHT - padding * 2);

  let difficultyMultiplier = Math.min(1 + difficulty * 0.1, 2.5);

  const baseBulletSpeed = ( 1.2 + Math.random() * 1 ) * frameMultiplier;
  const baseFireRate = 2500 + Math.random() * 1500;
  const baseMoveSpeed = ( 0.3 + Math.random() * 0.4) * frameMultiplier;
  
  const bulletSpeed = type === "fire" ? 2 * frameMultiplier : Math.min(baseBulletSpeed * difficultyMultiplier, 4);
  const fireRate = type === "fire" ? 800 : Math.max(baseFireRate / difficultyMultiplier, 800);
  const moveSpeed = type === "fire" ? 5 * frameMultiplier : Math.min(baseMoveSpeed * difficultyMultiplier, 1.5);

  const DEFAULT_ENEMY_SRCS = ["/chars/enemy0.png","/chars/enemy1.png","/chars/enemy2.png"]; 
  const FIRE_SRCS = ["/chars/main_enemy0.png"]; 

  const src = type === "fire" ? FIRE_SRCS[0] : DEFAULT_ENEMY_SRCS[Math.floor(Math.random() * DEFAULT_ENEMY_SRCS.length)];
  let characterImage = getImageFromCache(src);
  if (!characterImage) {
    const img = new Image();
    img.src = src;
    characterImage = img;
  }

  const bulletColor = type === "fire" ? "orange" : ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
  const weaponImage = imageCache?.weapons?.[0];

  const spawnTime = firstPlayer ? Date.now() + 3000 : Date.now();
  
  const enemy = new Enemy(randomX, randomY, bulletSpeed, fireRate, moveSpeed, bulletColor, spawnTime, type, characterImage);
  // Assign a basic weapon to enemy for future extensibility
  enemy.weapon = new Weapon(fireRate, type === 'fire' ? 18 : 6, type === 'fire' ? 4 : 1, bulletColor, weaponImage);
  enemiesRef.push(enemy);
  
  return enemiesRef;
}
