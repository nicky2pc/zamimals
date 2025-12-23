import { CONFIG } from '../config.ts';

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spawnTime: number;
  bounces: number;
  speed: number;
  color: string;
  size: number; 
  isPlayer: boolean;
  damage: number;
  type: string;
  lastUpdateTime: number;
  trail: { x: number; y: number; alpha: number }[];
  image?: HTMLImageElement;
  
  constructor(x: number, y: number, angle: number, speed: number, color: string, size: number, isPlayer: boolean, damage: number, type: string, image?: HTMLImageElement) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.spawnTime = Date.now();
    this.bounces = 0;
    this.size = size;
    this.isPlayer = isPlayer; 
    this.damage = damage;
    this.type = type;
    this.lastUpdateTime = performance.now();
    this.trail = [];
    this.image = image;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // If a sprite image is provided, draw it rotated along velocity
    if (this.image) {
      const angle = Math.atan2(this.vy, this.vx);
      const spriteW = this.size * 5.4; // scaled up for ult feel
      const spriteH = this.size * 3.2;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.drawImage(this.image, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
      ctx.restore();
      return;
    }
    if (this.type === "ult") {
        ctx.save();
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          ctx.globalAlpha = t.alpha;
          const gradient = ctx.createRadialGradient(t.x, t.y, this.size * 0.2, t.x, t.y, this.size);
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(0.5, "rgba(255,120,0,0.8)");
          gradient.addColorStop(1, "rgba(255,0,0,0.0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(t.x, t.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core glow
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(255,120,0,0.9)";
        const coreGradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.2, this.x, this.y, this.size * 1.4);
        coreGradient.addColorStop(0, "#fff5e6");
        coreGradient.addColorStop(0.4, "#ffb347");
        coreGradient.addColorStop(1, "rgba(255,0,0,0.35)");
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
        return;
    } else if (this.type === "fire") {
        ctx.shadowBlur = 10 + Math.sin(performance.now() / 100) * 5;
        ctx.shadowColor = "rgba(255, 100, 0, 0.8)";

        const gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.2, this.x, this.y, this.size);
        gradient.addColorStop(0, "yellow");
        gradient.addColorStop(0.5, "orange");
        gradient.addColorStop(1, "red");

        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = this.color;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + (this.type === "fire" ? Math.sin(performance.now() / 100) * 2 : 0), 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  update() {
    const now = performance.now();
    this.lastUpdateTime = now;
    
    const prevX = this.x;
    const prevY = this.y;

    this.x += this.vx;
    this.y += this.vy;

    // Maintain a short trail for ultimate bullets
    if (this.type === 'ult') {
      this.trail.unshift({ x: this.x, y: this.y, alpha: 0.5 });
      if (this.trail.length > 8) this.trail.pop();
      // Fade
      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].alpha *= 0.86;
      }
    }

    this.checkWallCollision(prevX, prevY);
  }

  private checkWallCollision(prevX: number, prevY: number) {
    if (this.bounces >= CONFIG.MAX_BOUNCES) return;

    const nextCellX = Math.floor(this.x / CONFIG.CELL_SIZE);
    const nextCellY = Math.floor(this.y / CONFIG.CELL_SIZE);
    const prevCellX = Math.floor(prevX / CONFIG.CELL_SIZE);
    const prevCellY = Math.floor(prevY / CONFIG.CELL_SIZE);

    if (nextCellX < 0 || nextCellY < 0 || 
        nextCellY >= CONFIG.MAP.length || 
        nextCellX >= CONFIG.MAP[0].length) {
      return;
    }

    if (CONFIG.MAP[nextCellY][nextCellX] === 1) {
        const hitVertical = nextCellX !== prevCellX;
        const hitHorizontal = nextCellY !== prevCellY;

        if (hitVertical) this.vx *= -1;
        if (hitHorizontal) this.vy *= -1;

        this.bounces++;
        this.x = prevX - this.vx;
        this.y = prevY - this.vy;
    }
  }

  get isExpired() {
    return Date.now() - this.spawnTime > CONFIG.BULLET_LIFETIME || 
      this.bounces > CONFIG.MAX_BOUNCES;
  }
}
