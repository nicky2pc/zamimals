export class Weapon {
  fireRate: number;
  bulletSize: number;
  damage: number;
  color: string;
  image?: HTMLImageElement;
  barrelOffset: number;

  constructor(
    fireRate: number,
    bulletSize: number,
    damage: number,
    color: string,
    image?: HTMLImageElement,
    barrelOffset: number = 10,
  ) {
    this.fireRate = fireRate;
    this.bulletSize = bulletSize;
    this.damage = damage;
    this.color = color;
    this.image = image;
    this.barrelOffset = barrelOffset;
  }
}


