import { useRef, useState } from 'react';
import { CONFIG } from '../../../game/config';
import { getCachedImage } from '../../../game/imageCache';

export const useUltimate = () => {
  const ultActiveRef = useRef<boolean>(false);
  const ultCooldownRef = useRef<boolean>(false);
  const [ultTimerValue, setUltTimerValue] = useState<number>(0);
  const [ultCooldownValue, setUltCooldownValue] = useState<number>(0);
  const ultWeaponImageRef = useRef<HTMLImageElement | null>(null);
  const ultBulletImageRef = useRef<HTMLImageElement | null>(null);
  const ultIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activateUlt = async (player: { fireRate: number } | null) => {
    if (!player || ultCooldownRef.current || ultActiveRef.current) return;

    ultActiveRef.current = true;
    ultCooldownRef.current = true;

    player.fireRate = 400;

    // Load ult weapon and bullet images once
    if (!ultWeaponImageRef.current) {
      ultWeaponImageRef.current = await getCachedImage('/chars/weapons/ult-weapon.png').catch(() => null);
    }
    if (!ultBulletImageRef.current) {
      ultBulletImageRef.current = await getCachedImage('/chars/weapons/bullet.png').catch(() => null);
    }

    setUltTimerValue(15);
    let remaining = 15;
    const ultInterval = setInterval(() => {
      remaining--;
      setUltTimerValue(remaining);
      if (remaining <= 0) {
        clearInterval(ultInterval);
        ultIntervalRef.current = null;
        setUltTimerValue(0);
        player.fireRate = CONFIG.FIRE_RATE;
        ultActiveRef.current = false;
        if (typeof window !== 'undefined') {
          (window as any).__ULT_WEAPON_OVERRIDE__ = null;
          (window as any).__ULT_WEAPON_SCALE__ = null;
        }
      }
    }, 1000);
    ultIntervalRef.current = ultInterval;

    setUltCooldownValue(60);
    let cdRemaining = 60;
    const cdInterval = setInterval(() => {
      cdRemaining--;
      setUltCooldownValue(cdRemaining);
      if (cdRemaining <= 0) {
        clearInterval(cdInterval);
        cdIntervalRef.current = null;
        setUltCooldownValue(0);
        ultCooldownRef.current = false;
      }
    }, 1000);
    cdIntervalRef.current = cdInterval;
  };

  const resetUlt = () => {
    if (ultIntervalRef.current) {
      clearInterval(ultIntervalRef.current);
      ultIntervalRef.current = null;
    }
    if (cdIntervalRef.current) {
      clearInterval(cdIntervalRef.current);
      cdIntervalRef.current = null;
    }
    ultActiveRef.current = false;
    ultCooldownRef.current = false;
    setUltTimerValue(0);
    setUltCooldownValue(0);
    if (typeof window !== 'undefined') {
      (window as any).__ULT_WEAPON_OVERRIDE__ = null;
      (window as any).__ULT_WEAPON_SCALE__ = null;
    }
  };

  return {
    ultActiveRef,
    ultCooldownRef,
    ultTimerValue,
    ultCooldownValue,
    setUltTimerValue,
    setUltCooldownValue,
    activateUlt,
    ultWeaponImageRef,
    ultBulletImageRef,
    resetUlt,
  };
};


