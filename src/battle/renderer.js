// 《弹珠勇者 · 弹夹撞击闯关录》Canvas 战场渲染器
// 集成：原版关卡背景、_st 受击颜艺切换、原版子弹与大招贴图、Hud 位图数字跳字、bosscome 预警横幅及 SVG 过渡件

import { BATTLE_PROPS, UI_SPRITES, getHudDigitImage, getImageByUrl } from '../assets.js';
import { ELEMENT_META } from '../data/roster.js';
import { SPHERE_CROPS } from '../data/sphere_crops.js';
import { ELEMENT_SVG_URIS, MOVE_TYPE_SVG_URIS, WEAKPOINT_RETICLE_URI } from '../svg_fallbacks.js';

export const LOGICAL_W = 400;
export const LOGICAL_H = 520;
export const WALL_PAD = 14;

// 高饱和元素与道具宝石球体配色（center -> mid -> edge 放射底衬 + 双层金属光泽外圈）
const SPHERE_GEM_THEMES = {
  fire: {
    center: '#ff9662',
    mid: '#df3c26',
    edge: '#681108',
    rimLight: '#ffc288',
    rimMid: '#e04836',
    rimDark: '#6b150b',
  },
  water: {
    center: '#79e2ff',
    mid: '#1f80cc',
    edge: '#0a2f59',
    rimLight: '#b2f0ff',
    rimMid: '#2b8fd4',
    rimDark: '#0e3c66',
  },
  wood: {
    center: '#74f0b4',
    mid: '#1f996b',
    edge: '#0b3f29',
    rimLight: '#aafad0',
    rimMid: '#2ca87b',
    rimDark: '#104932',
  },
  gold: {
    center: '#ffe570',
    mid: '#da9216',
    edge: '#633505',
    rimLight: '#fff3ab',
    rimMid: '#e5a624',
    rimDark: '#6e4007',
  },
  star: {
    center: '#da9eff',
    mid: '#7d3fc4',
    edge: '#311057',
    rimLight: '#eec9ff',
    rimMid: '#8e52cc',
    rimDark: '#3c1866',
  },
  pickupMeat: {
    center: '#84f7ac',
    mid: '#22a659',
    edge: '#0c4623',
    rimLight: '#b8fcd2',
    rimMid: '#38c975',
    rimDark: '#12542b',
  },
  pickupMeatMax: {
    center: '#9efcb8',
    mid: '#26b460',
    edge: '#0d4a26',
    rimLight: '#fff2a1',
    rimMid: '#f0b83a',
    rimDark: '#693c08',
  },
  pickupBattery: {
    center: '#8ef0ff',
    mid: '#1994d8',
    edge: '#093a66',
    rimLight: '#c4f8ff',
    rimMid: '#3bb8f5',
    rimDark: '#0d4775',
  },
  pickupWarhorn: {
    center: '#ffe675',
    mid: '#df8516',
    edge: '#662b05',
    rimLight: '#fff3a8',
    rimMid: '#f2a829',
    rimDark: '#6e3508',
  },
  bumperDummy: {
    center: '#ffbe6b',
    mid: '#c45b1c',
    edge: '#541d07',
    rimLight: '#ffe49c',
    rimMid: '#e8a238',
    rimDark: '#66310b',
  },
  bumperChest: {
    center: '#ffe87c',
    mid: '#d98918',
    edge: '#5e2e06',
    rimLight: '#fff3ad',
    rimMid: '#f0b238',
    rimDark: '#6b3808',
  },
  bumperShield: {
    center: '#94dfff',
    mid: '#2979c4',
    edge: '#0f3059',
    rimLight: '#fff0a6',
    rimMid: '#e6b245',
    rimDark: '#593b10',
  },
};

function stripAssetPrefix(url) {
  if (!url) return '';
  return String(url)
    .replace(/^(?:\.\.\/|\.\/)+assets\//, '')
    .replace(/^\/?assets\//, '');
}

// 在已调用 ctx.clip()（圆心 0,0，半径 r）的前提下，使用跨浏览器安全的 5 参数仿射映射绘制完整头部球体贴图
function drawCalibratedSphereSprite(ctx, img, spriteUrl, r) {
  const crop = SPHERE_CROPS[stripAssetPrefix(spriteUrl)];
  if (crop) {
    const [sx, sy, sw, sh, nw, nh] = crop;
    const scaleX = (r * 2) / sw;
    const scaleY = (r * 2) / sh;
    const natW = img.naturalWidth || nw;
    const natH = img.naturalHeight || nh;
    ctx.drawImage(img, -r - sx * scaleX, -r - sy * scaleY, natW * scaleX, natH * scaleY);
    return;
  }
  const natW = img.naturalWidth || r * 2;
  const natH = img.naturalHeight || r * 2;
  const scale = Math.min((r * 1.8) / natW, (r * 1.8) / natH);
  const dw = natW * scale;
  const dh = natH * scale;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
}

// 统一立体宝石圆球渲染：严格将底衬、贴图、冰冻层、受击闪白、内缘立体暗角与左上月牙高光全部包裹在圆形 clip 内
function drawGemSphere(ctx, r, innerR, theme, img, spriteUrl, fx = {}) {
  // 1. 圆球墨线外廓与柔和球底投影（绝不延伸破坏圆球轮廓）
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.36)';
  ctx.shadowBlur = 4.5;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1b0d07';
  ctx.fill();
  ctx.restore();

  // 2. 金属元素斜切外圈与内嵌墨线
  const bezelR = Math.max(1, r - 1.25);
  const bezelGrad = ctx.createLinearGradient(-r * 0.72, -r * 0.72, r * 0.72, r * 0.72);
  bezelGrad.addColorStop(0, theme.rimLight);
  bezelGrad.addColorStop(0.5, theme.rimMid);
  bezelGrad.addColorStop(1, theme.rimDark);
  ctx.beginPath();
  ctx.arc(0, 0, bezelR, 0, Math.PI * 2);
  ctx.fillStyle = bezelGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, innerR + 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#1b0d07';
  ctx.fill();

  // 3. 严格圆形裁剪区：任何超出圆形的身体、脚底黑影、长柄武器一律裁剪不显示
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, Math.PI * 2);
  ctx.clip();

  // 3a. 高饱和宝石放射渐变底衬（center -> mid -> edge）
  const gemGrad = ctx.createRadialGradient(
    -innerR * 0.25,
    -innerR * 0.28,
    innerR * 0.06,
    0,
    0,
    innerR,
  );
  gemGrad.addColorStop(0, theme.center);
  gemGrad.addColorStop(0.58, theme.mid);
  gemGrad.addColorStop(1, theme.edge);
  ctx.fillStyle = gemGrad;
  ctx.fillRect(-innerR - 1, -innerR - 1, innerR * 2 + 2, innerR * 2 + 2);

  // 3b. 100% 完整头部校准图像
  if (img) {
    drawCalibratedSphereSprite(ctx, img, spriteUrl, innerR);
  }

  // 3c. 冰冻状态晶化内层
  if (fx.chilled) {
    const frostGrad = ctx.createRadialGradient(0, 0, innerR * 0.22, 0, 0, innerR);
    frostGrad.addColorStop(0, 'rgba(130, 232, 255, 0.16)');
    frostGrad.addColorStop(0.7, 'rgba(95, 208, 255, 0.34)');
    frostGrad.addColorStop(1, 'rgba(215, 250, 255, 0.58)');
    ctx.fillStyle = frostGrad;
    ctx.fillRect(-innerR - 1, -innerR - 1, innerR * 2 + 2, innerR * 2 + 2);
  }

  // 3d. 受击闪白与球内受击火花
  if (fx.hitFlash > 0) {
    const flashAlpha = Math.min(0.46, fx.hitFlash * 0.38);
    ctx.fillStyle = `rgba(255, 250, 236, ${flashAlpha.toFixed(3)})`;
    ctx.fillRect(-innerR - 1, -innerR - 1, innerR * 2 + 2, innerR * 2 + 2);

    if (fx.showHitSpark) {
      const spark = getImageByUrl(BATTLE_PROPS.hitSpark);
      if (spark) {
        const sSz = innerR * 1.36;
        ctx.globalAlpha = Math.min(1, fx.hitFlash * 1.05);
        ctx.drawImage(spark, -sSz / 2, -sSz / 2, sSz, sSz);
        ctx.globalAlpha = 1;
      }
    }
  }

  // 3e. 球体内缘立体暗角
  const vignette = ctx.createRadialGradient(
    -innerR * 0.1,
    -innerR * 0.12,
    innerR * 0.55,
    0,
    0,
    innerR,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.78, 'rgba(16, 8, 4, 0.13)');
  vignette.addColorStop(1, 'rgba(12, 5, 2, 0.48)');
  ctx.fillStyle = vignette;
  ctx.fillRect(-innerR - 1, -innerR - 1, innerR * 2 + 2, innerR * 2 + 2);

  // 3f. 左上角通透月牙高光
  ctx.save();
  ctx.translate(-innerR * 0.35, -innerR * 0.45);
  ctx.rotate(-0.62);
  const hlGrad = ctx.createLinearGradient(0, -innerR * 0.16, 0, innerR * 0.16);
  hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
  hlGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.22)');
  hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
  ctx.beginPath();
  ctx.ellipse(0, 0, innerR * 0.35, innerR * 0.15, 0, 0, Math.PI * 2);
  ctx.fillStyle = hlGrad;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(-innerR * 0.56, -innerR * 0.2, Math.max(1.2, innerR * 0.06), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.46)';
  ctx.fill();

  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function renderBattleScene(ctx, eng) {
  ctx.save();
  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

  if (eng.shakeTime > 0 && !eng.reducedMotion) {
    const ox = (Math.random() - 0.5) * eng.shakeMag * 2;
    const oy = (Math.random() - 0.5) * eng.shakeMag * 2;
    ctx.translate(ox, oy);
  }

  drawArenaBackground(ctx, eng.stage);

  for (const b of eng.bumpers) drawBumper(ctx, b);
  for (const p of eng.pickups) drawPickup(ctx, p, eng.reducedMotion);
  for (const e of eng.enemies) {
    if (e.hp > 0) drawEnemy(ctx, e, eng.nowTime);
  }

  drawBeamsAndEffects(ctx, eng.beams);

  for (const m of eng.marbles) drawMarbleTrail(ctx, m);
  for (const m of eng.marbles) {
    drawMarble(
      ctx,
      m,
      m.index === eng.turnIndex && eng.phase === 'aiming',
      eng.strikeArmed,
      eng.nowTime,
      eng.reducedMotion,
    );
  }

  drawProjectiles(ctx, eng.projectiles);

  if (eng.phase === 'aiming' && eng.dragging) {
    drawAimGuide(ctx, eng);
  } else if (eng.phase === 'aiming' && !eng.autoPlay && eng.turnCount === 1) {
    drawHintPill(ctx, '按住任意处向后拉弓 · 撞队友触发「弹夹友情技」！');
  }

  drawParticlesAndPopups(ctx, eng.particles, eng.bitmapPopups, eng.texts);

  if (eng.phase === 'cutin') {
    drawCutinBanner(ctx, eng);
  } else if (eng.phase === 'wave_clear' && eng.waveIndex + 1 < eng.stage.waves.length) {
    drawHintPill(ctx, `第 ${eng.waveIndex + 1} 波魔物击溃 · 下一波袭来！`);
  }

  ctx.restore();
}

function drawArenaBackground(ctx, stage) {
  const bgImg = getImageByUrl(stage.bg);
  if (bgImg) {
    const scale = Math.max(LOGICAL_W / bgImg.naturalWidth, LOGICAL_H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * scale;
    const dh = bgImg.naturalHeight * scale;
    ctx.drawImage(bgImg, (LOGICAL_W - dw) / 2, (LOGICAL_H - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    g.addColorStop(0, '#1f2842');
    g.addColorStop(1, '#101424');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  // 半透暗色石板衬底，让角色立绘、子弹和位图跳字对比度拉满
  ctx.fillStyle = 'rgba(16, 20, 34, 0.44)';
  ctx.fillRect(WALL_PAD, WALL_PAD, LOGICAL_W - WALL_PAD * 2, LOGICAL_H - WALL_PAD * 2);

  // 轻微战术棋盘暗纹
  const cols = 7;
  const tileW = (LOGICAL_W - WALL_PAD * 2) / cols;
  const rows = Math.ceil((LOGICAL_H - WALL_PAD * 2) / tileW);
  ctx.save();
  ctx.beginPath();
  ctx.rect(WALL_PAD, WALL_PAD, LOGICAL_W - WALL_PAD * 2, LOGICAL_H - WALL_PAD * 2);
  ctx.clip();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 226, 150, 0.045)';
        ctx.fillRect(WALL_PAD + c * tileW, WALL_PAD + r * tileW, tileW, tileW);
      }
    }
  }
  ctx.restore();

  // 勇者暗金铁木反弹墙外框
  ctx.lineWidth = WALL_PAD * 2;
  ctx.strokeStyle = '#3b2416';
  ctx.strokeRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#180d08';
  ctx.strokeRect(WALL_PAD, WALL_PAD, LOGICAL_W - WALL_PAD * 2, LOGICAL_H - WALL_PAD * 2);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e6b455';
  ctx.strokeRect(WALL_PAD - 2, WALL_PAD - 2, LOGICAL_W - WALL_PAD * 2 + 4, LOGICAL_H - WALL_PAD * 2 + 4);

  const corners = [
    [WALL_PAD, WALL_PAD],
    [LOGICAL_W - WALL_PAD, WALL_PAD],
    [WALL_PAD, LOGICAL_H - WALL_PAD],
    [LOGICAL_W - WALL_PAD, LOGICAL_H - WALL_PAD],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd269';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1b0d07';
    ctx.stroke();
  }
}

function drawBumper(ctx, b) {
  const theme =
    b.sprite === BATTLE_PROPS.bumperChest
      ? SPHERE_GEM_THEMES.bumperChest
      : b.sprite === BATTLE_PROPS.bumperShield
        ? SPHERE_GEM_THEMES.bumperShield
        : SPHERE_GEM_THEMES.bumperDummy;

  ctx.save();
  ctx.translate(b.x, b.y);
  const s = 1 + b.squash * 0.32;
  ctx.scale(s, 2 - s);

  // 同心金属反击导引环（不含出框底座）
  ctx.beginPath();
  ctx.arc(0, 0, b.r + 2.4, 0, Math.PI * 2);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(255, 214, 102, 0.48)';
  ctx.stroke();

  const img = getImageByUrl(b.sprite);
  const innerR = Math.max(4, b.r - 2.3);
  drawGemSphere(ctx, b.r, innerR, theme, img, b.sprite, {
    hitFlash: b.squash * 1.35,
  });

  ctx.restore();
}

function drawPickup(ctx, p, reducedMotion) {
  const bob = reducedMotion ? 0 : Math.sin(p.bobPhase) * 2.5;
  const spriteUrl =
    p.kind === 'meat'
      ? p.tier === 1
        ? BATTLE_PROPS.foodLv1
        : p.tier === 2
          ? BATTLE_PROPS.foodLv2
          : BATTLE_PROPS.foodLv3
      : p.kind === 'battery'
        ? BATTLE_PROPS.battery
        : BATTLE_PROPS.warhorn;

  const theme =
    p.kind === 'meat'
      ? p.tier === 3
        ? SPHERE_GEM_THEMES.pickupMeatMax
        : SPHERE_GEM_THEMES.pickupMeat
      : p.kind === 'battery'
        ? SPHERE_GEM_THEMES.pickupBattery
        : SPHERE_GEM_THEMES.pickupWarhorn;

  ctx.save();
  ctx.translate(p.x, p.y + bob);

  // 紧凑同心光晕环（满阶美食球呈金翠双辉）
  ctx.beginPath();
  ctx.arc(0, 0, p.r + 2.2, 0, Math.PI * 2);
  ctx.lineWidth = p.kind === 'meat' && p.tier === 3 ? 2.1 : 1.5;
  ctx.strokeStyle =
    p.kind === 'meat'
      ? p.tier === 3
        ? 'rgba(255, 224, 102, 0.82)'
        : 'rgba(116, 246, 158, 0.56)'
      : p.kind === 'battery'
        ? 'rgba(110, 228, 255, 0.62)'
        : 'rgba(255, 214, 92, 0.68)';
  ctx.stroke();

  const img = getImageByUrl(spriteUrl);
  const innerR = Math.max(4, p.r - 2.1);
  drawGemSphere(ctx, p.r, innerR, theme, img, spriteUrl);

  ctx.restore();
}

function drawEnemy(ctx, e, nowTime) {
  const meta = ELEMENT_META[e.element] || ELEMENT_META.fire;
  const theme = SPHERE_GEM_THEMES[e.element] || SPHERE_GEM_THEMES.fire;
  // 还原《闯关勇者》RoleView.hurt 受击角色局部微抖
  const jx = e.hitTimer > 0.1 ? (Math.random() - 0.5) * 7 : 0;
  const jy = e.hitTimer > 0.1 ? (Math.random() - 0.5) * 4.5 : 0;

  ctx.save();
  ctx.translate(e.x + jx, e.y + jy);
  const sx = 1 + e.squash * 0.28;
  const sy = 1 - e.squash * 0.22;
  ctx.scale(sx, sy);

  if (e.isBoss) {
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 3.8, 0, Math.PI * 2);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = meta.glow || meta.color;
    ctx.globalAlpha = 0.68;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 受击期间切换为《闯关勇者》原版 _st 挨揍颜艺差分帧（SPHERE_CROPS 具备一致校准条目）
  const wantUrl = e.hitTimer > 0 ? e.hitPortrait : e.portrait;
  let usedUrl = wantUrl;
  let img = getImageByUrl(wantUrl);
  if (!img && wantUrl !== e.portrait) {
    img = getImageByUrl(e.portrait);
    usedUrl = e.portrait;
  }

  const innerR = Math.max(6, e.r - (e.isBoss ? 3.3 : 2.4));
  drawGemSphere(ctx, e.r, innerR, theme, img, usedUrl, {
    chilled: e.chilled,
    hitFlash: e.hitFlash,
    showHitSpark: true,
  });

  if (e.markedForMeteor) {
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 7.5, 0, Math.PI * 2);
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffd84d';
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // BOSS 旋转弱点准星（SVG 过渡矢量靶心）
  if (e.isBoss && e.weakAngles.length > 0) {
    const retImg = getImageByUrl(WEAKPOINT_RETICLE_URI);
    for (const wa of e.weakAngles) {
      const wx = e.x + Math.cos(wa) * (e.r * 0.82);
      const wy = e.y + Math.sin(wa) * (e.r * 0.82);
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(nowTime * 2.1);
      if (retImg) {
        ctx.drawImage(retImg, -16, -16, 32, 32);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd84d';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 血条 + 右上元素 SVG 纹章 + 左上行动倒计时章（对称贴合球缘，不遮挡头顶）
  const bw = Math.max(44, e.r * 1.55);
  const bh = e.isBoss ? 8 : 6;
  const bx = e.x - bw / 2;
  const by = e.y + e.r + 5;
  ctx.fillStyle = '#180d08';
  roundRectPath(ctx, bx - 1.5, by - 1.5, bw + 3, bh + 3, 4);
  ctx.fill();
  ctx.fillStyle = '#3b241c';
  roundRectPath(ctx, bx, by, bw, bh, 3);
  ctx.fill();
  const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
  ctx.fillStyle = e.isBoss ? '#f04735' : '#f28b30';
  roundRectPath(ctx, bx, by, bw * ratio, bh, 3);
  ctx.fill();

  const elemImg = getImageByUrl(ELEMENT_SVG_URIS[e.element]);
  if (elemImg) {
    const ex = e.x + e.r * 0.72 - 9;
    const ey = e.y - e.r * 0.72 - 9;
    ctx.drawImage(elemImg, ex, ey, 18, 18);
  }

  const cdX = e.x - e.r * 0.72;
  const cdY = e.y - e.r * 0.72;
  ctx.beginPath();
  ctx.arc(cdX, cdY, 10.5, 0, Math.PI * 2);
  ctx.fillStyle = e.cd <= 1 ? '#e03426' : '#f7e6c4';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#1b0d07';
  ctx.stroke();
  ctx.font = '900 11px "YongzheFont", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = e.cd <= 1 ? '#fff8e8' : '#2b140a';
  ctx.fillText(String(e.cd), cdX, cdY + 0.5);
}

function drawMarbleTrail(ctx, m) {
  for (let i = 0; i < m.trail.length; i++) {
    const t = m.trail[i];
    const frac = (i + 1) / m.trail.length;
    ctx.beginPath();
    ctx.arc(t.x, t.y, m.r * 0.75 * frac, 0, Math.PI * 2);
    ctx.fillStyle = t.color;
    ctx.globalAlpha = Math.max(0, t.alpha * 0.45);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMarble(ctx, m, isCurrentAiming, strikeArmed, nowTime = 0, reducedMotion = false) {
  const theme = SPHERE_GEM_THEMES[m.def.element] || SPHERE_GEM_THEMES.gold;
  ctx.save();
  ctx.translate(m.x, m.y);

  // 当前行动勇者：干净利落的同心呼吸导引圆环（移除原先未裁剪溢出的 Buff_JiSu / Buff_HuDun 贴图）
  if (isCurrentAiming) {
    const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(nowTime * 5.2);
    const guideColor = strikeArmed ? '#ffd84d' : '#4ce6b0';
    const rInner = m.r + 3.2 + pulse * 1.6;
    const rOuter = m.r + 6.8 + pulse * 2.6;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = guideColor;
    ctx.globalAlpha = 0.22 + (1 - pulse) * 0.24;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, rInner, 0, Math.PI * 2);
    ctx.lineWidth = strikeArmed ? 2.6 : 2.2;
    ctx.strokeStyle = guideColor;
    ctx.globalAlpha = 0.74 + pulse * 0.24;
    ctx.stroke();
    ctx.restore();
  }

  if (m.squash > 0.01) {
    ctx.rotate(m.squashAngle);
    ctx.scale(1 - m.squash * 0.34, 1 + m.squash * 0.32);
    ctx.rotate(-m.squashAngle);
  }

  const wantUrl = m.hitTimer > 0 ? m.def.hitPortrait : m.def.portrait;
  let usedUrl = wantUrl;
  let img = getImageByUrl(wantUrl);
  if (!img && wantUrl !== m.def.portrait) {
    img = getImageByUrl(m.def.portrait);
    usedUrl = m.def.portrait;
  }

  const innerR = Math.max(6, m.r - 2.3);
  drawGemSphere(ctx, m.r, innerR, theme, img, usedUrl, {
    hitFlash: m.hitTimer > 0.22 ? (m.hitTimer - 0.22) * 1.6 : 0,
  });

  // 右下角「反射 / 贯通」SVG 印章缩小至 14.5×14.5，紧贴球面右下缘，不破坏圆球轮廓
  const isPierce = m.tempPierce || m.def.moveType === 'pierce';
  const moveSvg = getImageByUrl(isPierce ? MOVE_TYPE_SVG_URIS.pierce : MOVE_TYPE_SVG_URIS.reflect);
  if (moveSvg) {
    const stampSz = 14.5;
    const stampHalf = stampSz / 2;
    const diag = (m.r - stampHalf + 1.1) * Math.SQRT1_2;
    ctx.drawImage(moveSvg, diag - stampHalf, diag - stampHalf, stampSz, stampSz);
  }

  ctx.restore();
}

function drawAimGuide(ctx, eng) {
  const cur = eng.marbles[eng.turnIndex];
  if (!cur) return;
  const dx = eng.dragStartX - eng.dragCurX;
  const dy = eng.dragStartY - eng.dragCurY;
  const pull = Math.hypot(dx, dy);
  if (pull < 14) return;

  const ux = dx / pull;
  const uy = dy / pull;
  const power01 = Math.min(1, pull / 95);

  const minX = WALL_PAD + cur.r;
  const maxX = LOGICAL_W - WALL_PAD - cur.r;
  const minY = WALL_PAD + cur.r;
  const maxY = LOGICAL_H - WALL_PAD - cur.r;

  let tHit = 9999;
  let hitSide = 'x';
  if (ux > 0.001) {
    const tx = (maxX - cur.x) / ux;
    if (tx < tHit) { tHit = tx; hitSide = 'x'; }
  } else if (ux < -0.001) {
    const tx = (minX - cur.x) / ux;
    if (tx < tHit) { tHit = tx; hitSide = 'x'; }
  }
  if (uy > 0.001) {
    const ty = (maxY - cur.y) / uy;
    if (ty < tHit) { tHit = ty; hitSide = 'y'; }
  } else if (uy < -0.001) {
    const ty = (minY - cur.y) / uy;
    if (ty < tHit) { tHit = ty; hitSide = 'y'; }
  }

  const p1x = cur.x + ux * tHit;
  const p1y = cur.y + uy * tHit;
  const rux = hitSide === 'x' ? -ux : ux;
  const ruy = hitSide === 'y' ? -uy : uy;
  const bounceLen = 96 * power01;
  const p2x = p1x + rux * bounceLen;
  const p2y = p1y + ruy * bounceLen;

  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cur.x, cur.y);
  ctx.lineTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(20, 10, 6, 0.65)';
  ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = eng.strikeArmed ? '#ffd84d' : '#fff4d2';
  ctx.stroke();
  ctx.setLineDash([]);

  // 高亮路径上可触发弹夹友情技的队友
  for (const ally of eng.marbles) {
    if (ally.index === cur.index) continue;
    const proj = (ally.x - cur.x) * ux + (ally.y - cur.y) * uy;
    if (proj > 0 && proj <= tHit) {
      const perp = Math.abs((ally.x - cur.x) * uy - (ally.y - cur.y) * ux);
      if (perp < cur.r + ally.r) {
        ctx.beginPath();
        ctx.arc(ally.x, ally.y, ally.r + 7, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffd84d';
        ctx.stroke();
        drawBadgeTag(ctx, '连携!', ally.x, ally.y - ally.r - 12, '#ffe066', '#2b1208');
      }
    }
  }

  // 结合《闯关勇者》原生 Game/jiantou.png 准星箭头与弹性弓弦
  const arrowLen = 38 + power01 * 56;
  const angle = Math.atan2(uy, ux);
  ctx.translate(cur.x, cur.y);
  ctx.rotate(angle);

  // 后拉蓄力弓弦（SVG风格矢量弦线）
  const pullBack = 16 + power01 * 24;
  ctx.beginPath();
  ctx.moveTo(-4, -cur.r * 0.85);
  ctx.lineTo(-pullBack, 0);
  ctx.lineTo(-4, cur.r * 0.85);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#ffe38a';
  ctx.stroke();

  const arrowImg = getImageByUrl(UI_SPRITES.aimArrow);
  ctx.beginPath();
  ctx.moveTo(cur.r + 2, -6);
  ctx.lineTo(cur.r + arrowLen - 14, -6);
  ctx.lineTo(cur.r + arrowLen - 14, -13);
  ctx.lineTo(cur.r + arrowLen + 5, 0);
  ctx.lineTo(cur.r + arrowLen - 14, 13);
  ctx.lineTo(cur.r + arrowLen - 14, 6);
  ctx.lineTo(cur.r + 2, 6);
  ctx.closePath();
  ctx.fillStyle = eng.strikeArmed ? '#ffbe2e' : '#f7ca5e';
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#1b0d07';
  ctx.stroke();

  if (arrowImg) {
    ctx.drawImage(arrowImg, cur.r + arrowLen - 12, -11, 22, 22);
  }

  ctx.restore();
}

function drawProjectiles(ctx, projectiles) {
  for (const p of projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const ang = Math.atan2(p.vy, p.vx);
    ctx.rotate(ang + p.life * (p.kind === 'wave_slash' ? 0 : 7));

    const img = getImageByUrl(p.sprite);
    if (p.kind === 'wave_slash') {
      const fxImg = getImageByUrl(BATTLE_PROPS.fireWhirl);
      if (fxImg) {
        ctx.globalAlpha = 0.72;
        ctx.drawImage(fxImg, -36, -36, 72, 72);
        ctx.globalAlpha = 1;
      }
      if (img) {
        ctx.drawImage(img, -26, -26, 52, 52);
      }
    } else if (img) {
      const sz = p.kind === 'barrage' ? 30 : 26;
      ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBeamsAndEffects(ctx, beams) {
  for (const b of beams) {
    const t = b.life / b.maxLife;
    const alpha = Math.max(0, 1 - t);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (b.kind === 'cross') {
      const w = 22 * (1 - t * 0.55);
      ctx.fillStyle = '#1b0d07';
      ctx.fillRect(WALL_PAD, b.y - w / 2 - 2, LOGICAL_W - WALL_PAD * 2, w + 4);
      ctx.fillRect(b.x - w / 2 - 2, WALL_PAD, w + 4, LOGICAL_H - WALL_PAD * 2);
      ctx.fillStyle = b.color;
      ctx.fillRect(WALL_PAD, b.y - w / 2, LOGICAL_W - WALL_PAD * 2, w);
      ctx.fillRect(b.x - w / 2, WALL_PAD, w, LOGICAL_H - WALL_PAD * 2);
      ctx.fillStyle = '#fff9e6';
      ctx.fillRect(WALL_PAD, b.y - w * 0.22, LOGICAL_W - WALL_PAD * 2, w * 0.44);
      ctx.fillRect(b.x - w * 0.22, WALL_PAD, w * 0.44, LOGICAL_H - WALL_PAD * 2);
    } else if (b.kind === 'aura' || b.kind === 'explosion' || b.kind === 'meteor') {
      const r = (b.radius || 60) * (b.kind === 'meteor' ? 1 - t * 0.22 : 0.35 + t * 0.65);
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = alpha * 0.26;
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = b.kind === 'meteor' ? 6 : 4;
      ctx.strokeStyle = b.color;
      ctx.stroke();

      if (b.kind === 'meteor') {
        const dragImg = getImageByUrl(BATTLE_PROPS.dragonStrike);
        if (dragImg) {
          ctx.drawImage(dragImg, b.x - r * 0.8, b.y - r * 1.1, r * 1.6, r * 1.6);
        }
        ctx.beginPath();
        ctx.moveTo(b.x, WALL_PAD);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = 13 * (1 - t);
        ctx.strokeStyle = '#fff3b0';
        ctx.stroke();
      } else if (b.kind === 'explosion') {
        const iceImg = getImageByUrl(BATTLE_PROPS.iceHammer);
        if (iceImg && b.color === '#2B8FD4') {
          ctx.drawImage(iceImg, b.x - r * 0.7, b.y - r * 0.7, r * 1.4, r * 1.4);
        }
      }
    } else if (b.kind === 'lightning' && b.points && b.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i].x, b.points[i].y);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#1b0d07';
      ctx.stroke();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = b.color;
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawParticlesAndPopups(ctx, particles, bitmapPopups, texts) {
  for (const pt of particles) {
    const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
    ctx.fillStyle = pt.color;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#1b0d07';
    ctx.stroke();
    ctx.restore();
  }

  // 1:1 复刻《闯关勇者》ui/Hud 位图数字伤害跳字动画曲线
  for (const pop of bitmapPopups) {
    const age = pop.life;
    let sc = 1.0;
    let op = 1.0;
    if (age < 0.14) {
      sc = 0.3 + (age / 0.14) * 0.96;
      op = age / 0.14;
    } else if (age < 0.25) {
      sc = 1.26;
    } else if (age < 0.36) {
      sc = 1.26 - ((age - 0.25) / 0.11) * 0.26;
    } else if (age > 0.56) {
      op = Math.max(0, 1 - (age - 0.56) / 0.29);
    }

    ctx.save();
    ctx.globalAlpha = op;
    ctx.translate(pop.x, pop.y - age * 38);
    ctx.scale(sc * pop.baseScale, sc * pop.baseScale);

    if (pop.boom) {
      const boomImg = getImageByUrl(BATTLE_PROPS.critBoom);
      if (boomImg) ctx.drawImage(boomImg, -34, -26, 68, 52);
    }

    const chars = pop.str.split('');
    const digitW = 15;
    const totalW = chars.length * digitW;
    let drawnAll = true;
    for (let i = 0; i < chars.length; i++) {
      const dImg = getHudDigitImage(pop.prefix, chars[i]);
      if (!dImg) {
        drawnAll = false;
        break;
      }
      ctx.drawImage(dImg, -totalW / 2 + i * digitW, -11, 17, 22);
    }
    if (!drawnAll) {
      ctx.font = '900 15px "YongzheFont", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#1b0d07';
      ctx.strokeText(pop.str, 0, 0);
      ctx.fillStyle = pop.boom ? '#ffe259' : '#ffffff';
      ctx.fillText(pop.str, 0, 0);
    }
    ctx.restore();
  }

  for (const ft of texts) {
    const alpha = Math.max(0, 1 - Math.pow(ft.life / ft.maxLife, 1.8));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${Math.round(13 * ft.scale)}px "YongzheFont", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1b0d07';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

function drawBadgeTag(ctx, text, x, y, bg, fg) {
  ctx.save();
  ctx.font = '900 10px "YongzheFont", system-ui, sans-serif';
  const w = ctx.measureText(text).width + 12;
  const h = 18;
  ctx.fillStyle = bg;
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, 9);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1b0d07';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fg;
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

function drawHintPill(ctx, text) {
  ctx.save();
  const w = LOGICAL_W - 48;
  const h = 32;
  const x = 24;
  const y = LOGICAL_H * 0.62;
  ctx.fillStyle = 'rgba(28, 18, 12, 0.9)';
  roundRectPath(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f0ba54';
  ctx.stroke();
  ctx.font = '800 12px "YongzheFont", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff3d1';
  ctx.fillText(text, LOGICAL_W / 2, y + h / 2 + 0.5);
  ctx.restore();
}

function drawCutinBanner(ctx, eng) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 16, 0.52)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  const bh = 114;
  const by = LOGICAL_H * 0.36;
  const bossBg = getImageByUrl(UI_SPRITES.bossWarnBg);
  if (bossBg) {
    ctx.drawImage(bossBg, 0, by, LOGICAL_W, bh);
  } else {
    const grad = ctx.createLinearGradient(0, by, LOGICAL_W, by + bh);
    grad.addColorStop(0, '#6e1912');
    grad.addColorStop(0.5, '#a82a1e');
    grad.addColorStop(1, '#59120c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, by, LOGICAL_W, bh);
  }

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd56b';
  ctx.beginPath();
  ctx.moveTo(0, by);
  ctx.lineTo(LOGICAL_W, by);
  ctx.moveTo(0, by + bh);
  ctx.lineTo(LOGICAL_W, by + bh);
  ctx.stroke();

  const img = getImageByUrl(eng.cutinPortrait);
  if (img) {
    const boxX = 12;
    const boxY = by - 6;
    const boxW = 122;
    const boxH = 126;
    const iw = img.naturalWidth || boxW;
    const ih = img.naturalHeight || boxH;
    const maxScale = iw < 140 ? Math.min(96 / iw, 96 / ih) : Math.min(boxW / iw, boxH / ih);
    const dw = iw * maxScale;
    const dh = ih * maxScale;
    ctx.drawImage(img, boxX + (boxW - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
  }

  ctx.textAlign = 'left';
  ctx.font = '900 17px "YongzheFont", system-ui, sans-serif';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1b0d07';
  ctx.strokeText(eng.cutinTitle, 144, by + 42);
  ctx.fillStyle = '#ffe580';
  ctx.fillText(eng.cutinTitle, 144, by + 42);

  ctx.font = '700 12px "YongzheFont", system-ui, sans-serif';
  const sub = eng.cutinSub.length > 19 ? `${eng.cutinSub.slice(0, 19)}…` : eng.cutinSub;
  ctx.strokeText(`「${sub}」`, 144, by + 74);
  ctx.fillStyle = '#fff6df';
  ctx.fillText(`「${sub}」`, 144, by + 74);

  ctx.restore();
}
