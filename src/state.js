// 《弹珠勇者 · 弹夹撞击闯关录》存档、战团流派羁绊、二合一神话合成与宝箱招募状态机

import { GENRE_BONDS, HERO_MAP, HERO_ROSTER } from './data/roster.js';
import { BASE_TREASURES, MYTHIC_TREASURES, TREASURE_MAP } from './data/treasures.js';

const SAVE_KEY = 'pinball-yongzhe-save-v1';

export const CODEX_MILESTONES = [
  { count: 6, coins: 800, gems: 90, keys: 2, title: '初出茅庐' },
  { count: 15, coins: 1600, gems: 160, keys: 3, title: '百战精锐' },
  { count: 28, coins: 3000, gems: 280, keys: 5, title: '流派宗师' },
  { count: 42, coins: 5200, gems: 460, keys: 8, title: '传奇统帅' },
  { count: 54, coins: 12000, gems: 999, keys: 15, title: '勇者全图鉴制霸' },
];

export function createInitialState() {
  return {
    version: 1,
    playerLv: 1,
    playerExp: 0,
    energy: 60,
    maxEnergy: 60,
    coins: 3200,
    gems: 400,
    chestKeys: 5, // 璀璨宝箱钥匙
    pitySSR: 0, // 20抽必出SSR传说保底
    // 初始4人弹珠小队：猎人(贯通火) + 勇士·猎人(反射火，直接激活「石头暴击流」羁绊！) + 霜灵(贯通冰陨) + 双锋(反射圣光回血)
    squad: ['lieren', 'shuangfeng', 'shuangling', 'yanti'],
    owned: {
      lieren: { level: 5, stars: 1, shards: 0 },
      shuangfeng: { level: 5, stars: 2, shards: 0 },
      shuangling: { level: 5, stars: 1, shards: 0 },
      yanti: { level: 5, stars: 1, shards: 0 },
    },
    treasures: ['t_drumstick'], // 初始赠予「魔法鸡腿」，首通1-2得「魔杖」即可立即体验神话二合一合成！
    clearedStages: {},
    selectedChapter: 1,
    claimedMilestones: [],
    shopPurchases: {},
  };
}

export let STATE = loadState();

export function loadState() {
  try {
    if (typeof localStorage === 'undefined') return createInitialState();
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.squad) || parsed.squad.length !== 4) {
      return createInitialState();
    }
    for (const id of parsed.squad) {
      if (!HERO_MAP[id]) return createInitialState();
    }
    if (!Array.isArray(parsed.treasures)) parsed.treasures = [];
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVE_KEY, JSON.stringify(STATE));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function resetState() {
  STATE = createInitialState();
  saveState();
}

// 计算已持有宝物（含二合一神话宝物）提供的全队永久加成
export function getTreasureBonuses(treasureIds = STATE.treasures) {
  let atkPct = 0;
  let hpPct = 0;
  let coinPct = 0;
  const hasDrumstickStaff = treasureIds.includes('m_drumstick_staff');
  for (const tid of treasureIds) {
    const t = TREASURE_MAP[tid];
    if (!t) continue;
    atkPct += t.atkPct || 0;
    hpPct += t.hpPct || 0;
    coinPct += t.coinPct || 0;
  }
  return { atkPct, hpPct, coinPct, hasDrumstickStaff };
}

// 检查并自动执行《闯关勇者》标志性「二合一神话宝物合成」（合成后消耗2件散件、生成彩色神话神器）
export function autoSynthesizeTreasures(stateObj = STATE) {
  const synthesized = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const mythic of MYTHIC_TREASURES) {
      if (stateObj.treasures.includes(mythic.id)) continue;
      const hasAllMats = mythic.materials.every((mId) => stateObj.treasures.includes(mId));
      if (hasAllMats) {
        stateObj.treasures = stateObj.treasures.filter((id) => !mythic.materials.includes(id));
        stateObj.treasures.push(mythic.id);
        synthesized.push(mythic);
        changed = true;
      }
    }
  }
  if (synthesized.length > 0 && stateObj === STATE) saveState();
  return synthesized;
}

export function grantTreasure(treasureId, stateObj = STATE) {
  const def = TREASURE_MAP[treasureId];
  if (!def) return { granted: null, synthesized: [] };
  // 如果对应的神话成品已经合成过，则折算为金币奖励
  const parentMythic = MYTHIC_TREASURES.find((m) => m.materials.includes(treasureId));
  if (stateObj.treasures.includes(treasureId) || (parentMythic && stateObj.treasures.includes(parentMythic.id))) {
    stateObj.coins += 180;
    if (stateObj === STATE) saveState();
    return { granted: def, duplicateCoins: 180, synthesized: [] };
  }
  stateObj.treasures.push(treasureId);
  const synthesized = autoSynthesizeTreasures(stateObj);
  if (stateObj === STATE) saveState();
  return { granted: def, duplicateCoins: 0, synthesized };
}

export function getHeroStats(heroId, stateObj = STATE) {
  const def = HERO_MAP[heroId];
  const owned = stateObj.owned[heroId] || { level: 1, stars: 1, shards: 0 };
  const lvMult = 1 + (owned.level - 1) * 0.088;
  const starMult = 1 + (owned.stars - 1) * 0.17;
  const atk = Math.round(def.baseAtk * lvMult * starMult);
  const hp = Math.round(def.baseHp * lvMult * starMult);
  const power = Math.round(atk * 4.2 + hp * 0.55);
  return { def, owned, atk, hp, power };
}

export function getSquadSummary(squadIds = STATE.squad, stateObj = STATE) {
  const counts = {};
  for (const id of squadIds) {
    const def = HERO_MAP[id];
    if (def) counts[def.genre] = (counts[def.genre] || 0) + 1;
  }
  const activeBonds = GENRE_BONDS.filter((b) => (counts[b.genre] || 0) >= b.minCount);
  const bondAtkPct = activeBonds.reduce((s, b) => s + b.atkPct, 0);
  const bondHpPct = activeBonds.reduce((s, b) => s + b.hpPct, 0);
  const tBonus = getTreasureBonuses(stateObj.treasures);

  const totalAtkPct = bondAtkPct + tBonus.atkPct;
  const totalHpPct = bondHpPct + tBonus.hpPct;
  const coinBonusPct = activeBonds.reduce((s, b) => s + (b.coinBonusPct || 0), 0) + tBonus.coinPct;
  const critBonusPct = activeBonds.reduce((s, b) => s + (b.critBonusPct || 0), 0);
  const cdReduce = activeBonds.reduce((s, b) => s + (b.cdReduce || 0), 0);
  const lifestealPct = activeBonds.reduce((s, b) => s + (b.lifestealPct || 0), 0);
  const chillChance = activeBonds.reduce((mx, b) => Math.max(mx, b.chillChance || 0), 0);
  const bumperBonusPct = activeBonds.reduce((s, b) => s + (b.bumperBonusPct || 0), 0);

  let rawHp = 0;
  let rawPower = 0;
  for (const id of squadIds) {
    const st = getHeroStats(id, stateObj);
    rawHp += st.hp;
    rawPower += st.power;
  }
  const totalHp = Math.round(rawHp * (1 + totalHpPct / 100));
  const totalPower = Math.round(rawPower * (1 + (totalAtkPct + totalHpPct) / 200));

  return {
    activeBonds,
    totalAtkPct,
    totalHpPct,
    coinBonusPct,
    critBonusPct,
    cdReduce,
    lifestealPct,
    chillChance,
    bumperBonusPct,
    hasDrumstickStaff: tBonus.hasDrumstickStaff,
    totalHp,
    totalPower,
  };
}

export function getUpgradeCost(level) {
  return Math.round(80 + level * 45 + Math.pow(level, 1.55) * 12);
}

export function upgradeHeroLevel(heroId) {
  const owned = STATE.owned[heroId];
  if (!owned || owned.level >= 60) return false;
  const cost = getUpgradeCost(owned.level);
  if (STATE.coins < cost) return false;
  STATE.coins -= cost;
  owned.level += 1;
  saveState();
  return true;
}

export function promoteHeroStar(heroId) {
  const owned = STATE.owned[heroId];
  if (!owned || owned.stars >= 5) return false;
  const needShards = owned.stars * 2;
  if (owned.shards < needShards) return false;
  owned.shards -= needShards;
  owned.stars += 1;
  saveState();
  return true;
}

export function grantHero(heroId, stateObj = STATE) {
  const hero = HERO_MAP[heroId];
  if (!stateObj.owned[heroId]) {
    stateObj.owned[heroId] = { level: 1, stars: 1, shards: 0 };
    if (stateObj === STATE) saveState();
    return { hero, isNew: true, shardsGained: 0, autoStarUp: false };
  }
  const st = stateObj.owned[heroId];
  const gain = hero.rarity === 'SSR' ? 3 : 2;
  st.shards += gain;
  let autoStarUp = false;
  if (st.stars < 5 && st.shards >= st.stars * 2) {
    st.shards -= st.stars * 2;
    st.stars += 1;
    autoStarUp = true;
  }
  if (stateObj === STATE) saveState();
  return { hero, isNew: false, shardsGained: gain, autoStarUp };
}

// 公开透明概率璀璨宝箱招募（SSR 10% + 20抽必出保底，SR 58%，R 32%，每5连额外必赠1件随机基础宝物！）
export function pullTreasureChest(count, groupFilter = 'ALL') {
  const coinCostPerPull = 300;
  if (STATE.chestKeys >= count) {
    STATE.chestKeys -= count;
  } else {
    const missing = count - STATE.chestKeys;
    const totalCoins = missing * coinCostPerPull;
    if (STATE.coins < totalCoins) return null;
    STATE.chestKeys = 0;
    STATE.coins -= totalCoins;
  }

  const pool = groupFilter && groupFilter !== 'ALL'
    ? HERO_ROSTER.filter((h) => h.group === groupFilter)
    : HERO_ROSTER;

  const ssrPool = pool.filter((h) => h.rarity === 'SSR');
  const srPool = pool.filter((h) => h.rarity === 'SR');
  const rPool = pool.filter((h) => h.rarity === 'R');

  const items = [];
  for (let i = 0; i < count; i++) {
    STATE.pitySSR += 1;
    let targetRarity = 'SR';
    const roll = Math.random() * 100;
    if (STATE.pitySSR >= 20 || roll < 10) {
      targetRarity = 'SSR';
      STATE.pitySSR = 0;
    } else if (roll < 68) {
      targetRarity = 'SR';
    } else {
      targetRarity = 'R';
    }
    let bucket = targetRarity === 'SSR' ? ssrPool : targetRarity === 'SR' ? srPool : rPool;
    if (bucket.length === 0) bucket = pool;
    const chosen = bucket[Math.floor(Math.random() * bucket.length)];
    items.push(grantHero(chosen.id));
  }

  // 五连开箱必附赠 1 件尚未拥有或随机的基础宝物，加速二合一神话合成！
  let bonusTreasure = null;
  if (count >= 5 || Math.random() < 0.35) {
    const unowned = BASE_TREASURES.filter((bt) => {
      const pm = MYTHIC_TREASURES.find((m) => m.materials.includes(bt.id));
      return !STATE.treasures.includes(bt.id) && !(pm && STATE.treasures.includes(pm.id));
    });
    const pickPool = unowned.length > 0 ? unowned : BASE_TREASURES;
    const picked = pickPool[Math.floor(Math.random() * pickPool.length)];
    bonusTreasure = grantTreasure(picked.id);
  }

  saveState();
  return { items, bonusTreasure };
}

export function addPlayerExp(exp) {
  STATE.playerExp += exp;
  let leveledUp = false;
  while (STATE.playerExp >= STATE.playerLv * 100) {
    STATE.playerExp -= STATE.playerLv * 100;
    STATE.playerLv += 1;
    STATE.maxEnergy += 2;
    STATE.energy = Math.max(STATE.energy, STATE.maxEnergy);
    leveledUp = true;
  }
  saveState();
  return leveledUp;
}
