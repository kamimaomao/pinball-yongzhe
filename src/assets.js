// 《弹珠勇者 · 弹夹撞击闯关录》统一 REA 资产路径与 Canvas 贴图缓存管理
// 严格遵循：100% 引用 ../assets/ 解包资产，0 原项目资产残留，缺失指示件统一走 svg_fallbacks.js

import { SPHERE_CROPS } from './data/sphere_crops.js';
import { ELEMENT_SVG_URIS, MOVE_TYPE_SVG_URIS, WEAKPOINT_RETICLE_URI } from './svg_fallbacks.js';

export const ASSET_BASE = './assets';

export function assetUrl(relPath) {
  if (!relPath) return '';
  if (relPath.startsWith('data:image/svg+xml')) return relPath;
  if (relPath.startsWith('../assets/') || relPath.startsWith('./assets/')) return relPath;
  return `${ASSET_BASE}/${relPath}`;
}

export function cleanAssetRel(pathOrUrl) {
  if (!pathOrUrl) return '';
  return String(pathOrUrl)
    .replace(/^\.\.\/assets\//, '')
    .replace(/^\.\/assets\//, '');
}

function parseHexRgb(hex, fallback = [217, 152, 48]) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return fallback;
  const raw = m[1];
  if (raw.length === 3) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16),
    ];
  }
  return [
    parseInt(raw.slice(0, 2), 16),
    parseInt(raw.slice(2, 4), 16),
    parseInt(raw.slice(4, 6), 16),
  ];
}

function mixRgb(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function buildSphereGemBg(accentColor) {
  const base = parseHexRgb(accentColor);
  const hi = mixRgb(base, [255, 246, 214], 0.46);
  const mid = mixRgb(base, [255, 255, 255], 0.06);
  const deep = mixRgb(base, [18, 10, 26], 0.62);
  return `radial-gradient(circle at 35% 28%, ${hi} 0%, ${mid} 54%, ${deep} 100%)`;
}

export function renderSphereAvatar(relPath, alt = '', sizePx = 58, accentColor = '#d99830') {
  const src = assetUrl(relPath);
  const safeAlt = String(alt ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const size = Number(sizePx) || 58;
  const safeAccent = String(accentColor || '#d99830');
  const gemBg = buildSphereGemBg(safeAccent);
  const crop = SPHERE_CROPS[cleanAssetRel(relPath)];

  let imgStyle = 'left:0;top:0;width:100%;height:100%;object-fit:cover';
  if (crop && crop[2] > 0 && crop[3] > 0) {
    const [sx, sy, sw, sh, nw, nh] = crop;
    const wPct = ((nw / sw) * 100).toFixed(3);
    const hPct = ((nh / sh) * 100).toFixed(3);
    const lPct = ((-sx / sw) * 100).toFixed(3);
    const tPct = ((-sy / sh) * 100).toFixed(3);
    imgStyle = `width:${wPct}%;height:${hPct}%;left:${lPct}%;top:${tPct}%`;
  }

  return `<span class="yz-sphere-avatar" style="width:${size}px;height:${size}px;--sphere-accent:${safeAccent};--sphere-bg:${gemBg}"><img src="${src}" alt="${safeAlt}" style="${imgStyle}" /></span>`;
}

export function rolePortraitRel(key) {
  return `textures/角色/role/${key}.png`;
}

export function roleHitRel(key, hasSt = true) {
  return hasSt ? `textures/角色/role/${key}_st.png` : `textures/角色/role/${key}.png`;
}

export function iconRel(name) {
  return `textures/UI_图标/icon/${name}.png`;
}

export function bulletRel(name) {
  return `sprites/UI_界面/ui/Bullets/${name}.png`;
}

export function effectRel(name) {
  return `textures/特效/effect/${name}.png`;
}

export function bgRel(fileName) {
  return `textures/背景_大图/bigimg/${fileName}`;
}

export function uiRel(atlas, frameName) {
  return `sprites/UI_界面/ui/${atlas}/${frameName}.png`;
}

// 顶栏、导航、弹窗、战斗通用的《闯关勇者》原生 UI 切图清单
export const UI_SPRITES = {
  levelBadge: uiRel('Common', 'dengji_bg'),
  stamina: uiRel('Common', 'tili'),
  coin: uiRel('Common', 'jinbi'),
  gem: uiRel('Common', 'zuanshi'),
  redDot: uiRel('Common', 'hongdian'),
  lock: uiRel('Common', 'suo'),
  closeBtn: uiRel('Common', 'anniu_guanbi'),
  btnRed: uiRel('Common', 'anniu_hong'),
  btnYellow: uiRel('Common', 'anniu_huang'),
  btnGreen: uiRel('Common', 'anniu_lv'),
  firstClear: uiRel('Result', 'shoutong'),
  winBanner: uiRel('Result', 'shengli'),
  loseBanner: uiRel('Result', 'shibai'),
  bossWarnBg: uiRel('bosscome', 'bg_1'),
  navBg: uiRel('Main', 'gongneng_bg'),
  navActive: uiRel('Main', 'gongneng_xuanzhong'),
  navCampaign: uiRel('Main', 'gongneng_tiaozhan'),
  navSquad: uiRel('Main', 'gongneng_yingxiong'),
  navGacha: uiRel('Shop', 'cuicanbaoxiang'),
  navCodex: uiRel('Main', 'btn_tujian_main'),
  navShop: uiRel('Main', 'gongneng_shangdian'),
  chestNormal: uiRel('Shop', 'tutongbaoxiang'),
  chestSuper: uiRel('Shop', 'cuicanbaoxiang'),
  chestStage2: uiRel('Main', 'baoxiang_2'),
  chestStage3: uiRel('Main', 'baoxiang_3'),
  keyNormal: iconRel('yaoshi_putong'),
  keySuper: iconRel('yaoshi_cuican'),
  giftPack: iconRel('libao_1'),
  luckyRedBag: iconRel('item_g_1'),
  diceToken: iconRel('item_touzi'),
  aimArrow: uiRel('Game', 'jiantou'),
  pedestal: uiRel('Game', 'img_dizuo_sy'),
  speedX1: uiRel('Game', 'btn_x1_zd'),
  speedX2: uiRel('Game', 'btn_x2_zd'),
  hpHeart: uiRel('Game', 'biaozhi_shengming'),
  mpBolt: uiRel('Game', 'biaozhi_huineng'),
  synthPlus: uiRel('Treasures', 'fuhao_+'),
  synthEqual: uiRel('Treasures', 'fuhao_='),
  synthBadge: uiRel('Treasures', 'hecheng'),
  starOn: uiRel('Hero', 'xing_jiesuo'),
  starOff: uiRel('Hero', 'xing_weijiesuo'),
  rarityMythic: uiRel('Common', 'pinzhi_cai'),
  rarityLegend: uiRel('Common', 'pinzhi_hong'),
  rarityEpic: uiRel('Common', 'pinzhi_cheng'),
  rarityRare: uiRel('Common', 'pinzhi_zi'),
  rarityCommon: uiRel('Common', 'pinzhi_lan'),
  gachaBg: bgRel('img_choubg_xh.jpg'),
  tavernBg: bgRel('img_jgbj_jgzq.jpg'),
  bossBg: bgRel('img_bg_boss.jpg'),
};

// 场地成长补给与反弹木桩/机关贴图（全部复用《闯关勇者》原生子弹、宝物、木桩与护盾）
export const BATTLE_PROPS = {
  bumperDummy: rolePortraitRel('moster_mz'),
  bumperChest: uiRel('Main', 'baoxiang_2'),
  bumperShield: iconRel('equip_shield'),
  foodLv1: bulletRel('zidan_10'), // 烤鸡腿
  foodLv2: iconRel('2001'), // 魔法鸡腿
  foodLv3: iconRel('2004'), // 元素牛肉拼盘
  battery: iconRel('buff_dianchi'), // 充能电池（加速 + 全队CD-1）
  warhorn: iconRel('3010'), // 无尽之刃战意（全队本回合增伤 + 爆金币）
  enemyOrb: effectRel('effect_xinghunhei'),
  enemyFireOrb: effectRel('effect_xinghunhong'),
  enemyIceOrb: effectRel('effect_xinghunlan'),
  hitSpark: uiRel('Hud', 'shouji'),
  critBoom: uiRel('Hud', 'boom'),
  shieldAura: effectRel('Buff_HuDun_GaoJi_Jin'),
  hasteAura: effectRel('Buff_JiSu'),
  fireWhirl: effectRel('Skill_Type2_XuanFengZhan_Huo_02'),
  iceHammer: effectRel('Skill_Type2_YuanLiChui_Bing'),
  dragonStrike: effectRel('Skill_Type3_YueJi_HuangLong'),
};

// 原生 Hud 彩色位图数字前缀与可用字符集
export const HUD_DIGIT_PREFIXES = ['PT_', 'BJ_', 'HX_', 'JN_', 'FS_', 'DZ_'];

const imgCache = new Map();
const loadingMap = new Map();

export function getImageByUrl(url) {
  if (!url) return null;
  const resolved = assetUrl(url);
  const cached = imgCache.get(resolved);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  if (typeof Image !== 'undefined' && !loadingMap.has(resolved)) {
    loadImageByUrl(resolved);
  }
  return null;
}

export function loadImageByUrl(url) {
  if (!url || typeof Image === 'undefined') return Promise.resolve(null);
  const resolved = assetUrl(url);
  if (imgCache.has(resolved)) {
    const el = imgCache.get(resolved);
    if (el.complete && el.naturalWidth > 0) return Promise.resolve(el);
  }
  if (loadingMap.has(resolved)) {
    return loadingMap.get(resolved);
  }
  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      imgCache.set(resolved, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = resolved;
  });
  loadingMap.set(resolved, p);
  return p;
}

export function getHudDigitImage(prefix, ch) {
  const rel = `sprites/UI_界面/ui/Hud/${prefix}${ch}.png`;
  return getImageByUrl(rel);
}

export async function preloadHudDigitsAndSvg() {
  const urls = [
    WEAKPOINT_RETICLE_URI,
    ...Object.values(ELEMENT_SVG_URIS),
    ...Object.values(MOVE_TYPE_SVG_URIS),
    ...Object.values(BATTLE_PROPS),
    `sprites/UI_界面/ui/Hud/HX_+.png`,
    `sprites/UI_界面/ui/Hud/PT_+.png`,
    `sprites/UI_界面/ui/Hud/BJ_+.png`,
  ];
  for (const pfx of HUD_DIGIT_PREFIXES) {
    for (let d = 0; d <= 9; d++) {
      urls.push(`sprites/UI_界面/ui/Hud/${pfx}${d}.png`);
    }
  }
  await Promise.all(urls.map((u) => loadImageByUrl(u)));
}

export async function preloadStageAssets(stage, squadDefs) {
  const urls = new Set([stage.bg]);
  for (const h of squadDefs) {
    urls.add(h.portrait);
    urls.add(h.hitPortrait);
    urls.add(h.comboBullet);
    urls.add(h.strikeProjectile);
  }
  for (const w of stage.waves) {
    if (w.bumpers) {
      for (const b of w.bumpers) urls.add(b.sprite);
    }
    for (const e of w.enemies) {
      urls.add(e.portrait);
      urls.add(e.hitPortrait);
    }
  }
  await Promise.all([preloadHudDigitsAndSvg(), ...[...urls].map((u) => loadImageByUrl(u))]);
}
