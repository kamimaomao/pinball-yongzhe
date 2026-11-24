// 《闯关勇者》原生 31 轨 MP3 配乐与弹射战斗音效管理器

import { assetUrl } from './assets.js';

const MUTE_KEY = 'pinball-yongzhe-muted-v1';

export const AUDIO_TRACKS = {
  // 4 首原生场景 BGM
  bgmHome: 'audio/BGM_ZhuJieMian.mp3',
  bgmBattle: 'audio/BGM_ZiDongZhanDou.mp3',
  bgmShop: 'audio/BGM_ShangDian.mp3',
  bgmCodex: 'audio/BGM_ShiJian.mp3',

  // 27 首原生战斗与系统音效
  btnClick: 'audio/AnNiuDianJi.mp3',
  btnClose: 'audio/AnNiuGuanBi.mp3',
  bossWarn: 'audio/BOSSYuJing.mp3',
  synthStart: 'audio/BaoWuHeCheng_1.mp3',
  synthDone: 'audio/BaoWuHeCheng_2.mp3',
  treasureVault: 'audio/BaoWu_BaoKu.mp3',
  rewardPop: 'audio/GongXiHuoDe.mp3',
  strikeReady: 'audio/JiNengBiaoTi.mp3',
  deckOpen: 'audio/JiNeng_PaiKu.mp3',
  comboTrigger: 'audio/JiNeng_XuanZe.mp3',
  battleWin: 'audio/JieSuan_ShengLi.mp3',
  battleLose: 'audio/JieSuan_ShiBai.mp3',
  gachaRoll: 'audio/LaoHuJi_1.mp3',
  gachaStop: 'audio/LaoHuJi_2.mp3',
  shopRefresh: 'audio/ShangDianShuaXin.mp3',
  eventTap: 'audio/ShiJianDianJi.mp3',
  enemyDie: 'audio/SiWang.mp3',
  coinSpend: 'audio/ZhuBi_HuiShou.mp3',
  coinGain: 'audio/ZhuBi_HuoDe.mp3',
  statUp: 'audio/ZiDanShuXing_BianHua.mp3',
  hitIce: 'audio/ZiDan_BingKuai.mp3',
  launchShot: 'audio/ZiDan_FaShe.mp3',
  hitCritAxe: 'audio/ZiDan_FuTou.mp3',
  hitBumper: 'audio/ZiDan_NaoZi.mp3',
  hitNormal: 'audio/ZiDan_QuanTao.mp3',
  hitVamp: 'audio/ZiDan_XiXueGui.mp3',
  pickupHeal: 'audio/ZiDan_XueDi.mp3',
};

class SoundController {
  constructor() {
    this.muted = false;
    this.unlocked = false;
    this.currentBgmKey = null;
    this.bgmAudio = null;
    this.lastPlayTs = new Map();

    try {
      if (typeof localStorage !== 'undefined') {
        this.muted = localStorage.getItem(MUTE_KEY) === '1';
      }
    } catch {
      // ignore storage restrictions
    }
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (!this.muted && this.currentBgmKey) {
      this.playBgm(this.currentBgmKey);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
      }
    } catch {
      // ignore
    }
    if (this.muted) {
      if (this.bgmAudio) this.bgmAudio.pause();
    } else if (this.currentBgmKey) {
      this.playBgm(this.currentBgmKey);
    }
    return this.muted;
  }

  playBgm(trackKey) {
    this.currentBgmKey = trackKey;
    if (typeof Audio === 'undefined' || this.muted) return;
    const rel = AUDIO_TRACKS[trackKey];
    if (!rel) return;
    const src = assetUrl(rel);
    if (this.bgmAudio && this.bgmAudio.dataset.trackKey === trackKey) {
      if (this.bgmAudio.paused && this.unlocked) {
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = trackKey === 'bgmBattle' ? 0.34 : 0.3;
    audio.dataset.trackKey = trackKey;
    this.bgmAudio = audio;
    if (this.unlocked) {
      audio.play().catch(() => {});
    }
  }

  play(trackKey, volume = 0.6, throttleMs = 55) {
    if (typeof Audio === 'undefined' || this.muted) return;
    const rel = AUDIO_TRACKS[trackKey];
    if (!rel) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const prev = this.lastPlayTs.get(trackKey) || 0;
    if (now - prev < throttleMs) return;
    this.lastPlayTs.set(trackKey, now);

    const a = new Audio(assetUrl(rel));
    a.volume = Math.max(0.05, Math.min(1, volume));
    a.play().catch(() => {});
  }

  click() {
    this.unlock();
    this.play('btnClick', 0.55, 35);
  }

  close() {
    this.unlock();
    this.play('btnClose', 0.55, 35);
  }
}

export const SFX = new SoundController();

export function vibrate(ms = 15) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // ignore unsupported environments
  }
}
