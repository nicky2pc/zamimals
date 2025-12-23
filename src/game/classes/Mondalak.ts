import { CONFIG } from '../config.ts';
import { Bullet } from './Bullet.ts';
import { Weapon } from './Weapon.ts';

export class Mondalak {
  x: number;
  y: number;
  angle: number;
  speed: number;
  bulletSpeed: number;
  lastShot: number;
  isPlayer: boolean;
  fireRate: number; // kept for backward compat; derived from weapon when present
  bulletColor: string;
  health: number;
  shakeOffsetX: number = 0; 
  shakeOffsetY: number = 0;
  maxHealth: number;
  barrelSize: number = 35;
  width: number = 70;  
  height: number = 70;
  hitboxRadius: number = 35;
  barrelThickness: number = 6;
  shootingAnimation: boolean = false;
  characterImage: HTMLImageElement;
  weaponImage?: HTMLImageElement;
  isBuffed: boolean;
  type: string;
  cornerRadius: number;
  weapon: Weapon | null;
  constructor(
    x: number,
    y: number,
    isPlayer: boolean,
    bulletSpeed: number = CONFIG.BULLET_SPEED,
    fireRate: number = CONFIG.FIRE_RATE,
    bulletColor: string,
    type: string,
    characterImage: HTMLImageElement,
    weaponImage?: HTMLImageElement,
    cornerRadius: number = 10,
  ) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.speed = CONFIG.PLAYER_SPEED;
    this.bulletSpeed = bulletSpeed;
    this.fireRate = fireRate;
    this.lastShot = 0;
    this.isPlayer = isPlayer;
    this.bulletColor = bulletColor;
    this.health = isPlayer ? 100004 : 2; 
    this.maxHealth = this.health; 
    this.isBuffed = false;
    this.type = type; 
    this.characterImage = characterImage;
    this.weaponImage = weaponImage;
    this.cornerRadius = cornerRadius;
    this.weapon = null;
    if (this.type === "fire") {
      this.width = this.width + 30
      this.height = this.height + 40
      this.health = 4
      this.maxHealth = 4
    }
  }
  draw(ctx: CanvasRenderingContext2D, isDead?: boolean) {
    ctx.save();
    if (isDead) return;

    ctx.translate(this.x + this.shakeOffsetX, this.y + this.shakeOffsetY);
    ctx.rotate(this.angle);
    let width = this.width;
    let height = this.height;
    if (this.isPlayer) {
      width = 70;
      height = 35;
    }

    if (this.isPlayer) {
      ctx.scale(-1, 1); 
    }
    // For player keep strict sizes; for others keep computed width/height
    const characterW = this.isPlayer ? 50 : width;
    const characterH = this.isPlayer ? 50 : height;
    const weaponW = this.weaponImage ? (this.isPlayer ? 75 : Math.min(width * 0.6, 48)) : 0;
    const weaponH = this.weaponImage ? (this.isPlayer ? 30 : Math.min(height * 0.6, 24)) : 0;

    // draw character as rounded-rect masked image (first)
    this.drawRoundedImage(
      ctx,
      this.characterImage,
      -characterW / 2 + 20,
      -characterH / 2 - 10,
      characterW,
      characterH,
      this.cornerRadius,
      true
    );

    // draw weapon on top so it looks held
    if (this.weaponImage) {
      // Because of ctx.scale(-1, 1), forward direction is towards negative X.
      // Place the weapon slightly forward and centered vertically on the body.
      const forwardShift = -characterW * 0.45; // move towards barrel/front
      const ultScale = (window as any).__ULT_WEAPON_SCALE__ as number | undefined;
      const scale = ultScale && ultScale > 0 ? ultScale : 1;
      const weaponX = forwardShift - (weaponW * scale) * 0.15; // compensate so grip sits near center
      const weaponY = - (weaponH * scale) * 0.05; // slight upward offset to overlap "hands"
      const imgToDraw = (window as any).__ULT_WEAPON_OVERRIDE__ as HTMLImageElement | undefined;
      const weaponImg = imgToDraw ?? this.weaponImage;
      this.drawRoundedImage(
        ctx,
        weaponImg,
        weaponX,
        weaponY,
        weaponW * scale,
        weaponH * scale,
        Math.max(4, Math.floor(this.cornerRadius / 2)),
        false
      );
    }

    this.drawHealthBar(ctx);

    ctx.restore();
  }

  private drawRoundedImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    flipX: boolean = false
  ) {
    const r = Math.min(radius, width/2, height/2);
    ctx.save();
    if (flipX) {
      ctx.scale(-1, 1);
      x = -x - width;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
  }

  drawHealthBar(ctx: CanvasRenderingContext2D) {
    const barWidth = 30;
    const barHeight = 4;
    const hpRatio = this.health / this.maxHealth;

    ctx.save();
    const translateY = this.type === "fire" ? 65 : 28; 
    ctx.translate(20, translateY); 

    ctx.fillStyle = '#333';
    ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.3 ? '#ff0' : '#f00';
    ctx.fillRect(-barWidth / 2, 0, barWidth * hpRatio, barHeight);

    ctx.restore();
  }

  heal() {
    if ( this.health < this.maxHealth ) {
      this.health++
    }
  }

  updatePosition(newX: number, newY: number) {
    this.x = newX;
    this.y = newY;
  }


  shoot(): Bullet | null {
    //Only for enemies
    const effectiveFireRate = this.weapon ? this.weapon.fireRate : this.fireRate;
    if (Date.now() - this.lastShot > effectiveFireRate) {
      this.lastShot = Date.now();

      const barrelEndX = this.x + Math.cos(this.angle) * this.barrelSize;
      const barrelEndY = this.y + Math.sin(this.angle) * this.barrelSize;

      const bulletSize = this.weapon ? this.weapon.bulletSize : (this.type === "fire" ? 18 : 6);
      const bulletDamage = this.weapon ? this.weapon.damage : (this.type === "fire" ? 4 : 1);
      const bulletColor = this.weapon ? this.weapon.color : this.bulletColor;

      return new Bullet(
          barrelEndX,  
          barrelEndY,  
          this.angle,
          this.bulletSpeed,
          bulletColor,
          bulletSize,
          this.isPlayer,
          bulletDamage,
          this.type
      );    }
    return null;
  }

  takeDamage(value): boolean | string {
    this.health -= value;
    this.applyShake();

    if (this.health <= 0) {
      if ( !this.isPlayer ) {
        const random = Math.floor(Math.random() * 10);
        if (random > 5) { 
          const additionalRandom = Math.floor(Math.random() * 10);
          if ( additionalRandom > 6) {
            return "drop_buff";
          } else {
            return "drop_heart";
          }
        }
        return "explode"; 
      }
      return true;
    } 
    
    return false;
  }

  applyShake() {
    let shakeFrames = 6;
    let lastTime = 0;
    
    const shakeStep = (timestamp) => {
      if (!lastTime || timestamp - lastTime > 30) {
        this.shakeOffsetX = (Math.random() - 0.5) * 4;
        this.shakeOffsetY = (Math.random() - 0.5) * 4;
        shakeFrames--;
        lastTime = timestamp;
      }
      
      if (shakeFrames > 0) {
        requestAnimationFrame(shakeStep);
      } else {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    };
    
    requestAnimationFrame(shakeStep);
  }
}
