import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { BATTLE_PROPS, HUD_DIGIT_PREFIXES, UI_SPRITES } from '../src/assets.js';
import { AUDIO_TRACKS } from '../src/audio.js';
import { runHeadlessBattle } from '../src/battle/engine.js';
import { HERO_ROSTER, RARITY_META } from '../src/data/roster.js';
import { SPHERE_CROPS } from '../src/data/sphere_crops.js';
import { STAGES } from '../src/data/stages.js';
import { MYTHIC_TREASURES, TREASURES } from '../src/data/treasures.js';
import {
  STATE,
  createInitialState,
  getSquadSummary,
  grantTreasure,
  pullTreasureChest,
  resetState,
} from '../src/state.js';
import {
  AUDIO_ICON_SVG,
  ELEMENT_SVG_MARKUP,
  ELEMENT_SVG_URIS,
  MOVE_TYPE_SVG_URIS,
  WEAKPOINT_RETICLE_URI,
} from '../src/svg_fallbacks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PINBALL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PINBALL_ROOT, '..');
const ASSETS_ROOT = path.join(REPO_ROOT, 'assets');

function walkCodeFiles(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'dist' || ent.name === '.wrangler' || ent.name === 'tests' || ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkCodeFiles(p));
    else if (/\.(html|css|js|mjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}

test('1. 零原项目资产残留校验（无 .webp、无福福贴贴/门神旧资产引用）', () => {
  const files = walkCodeFiles(PINBALL_ROOT);
  assert.ok(files.length >= 10);
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    assert.ok(!/\.webp\b/i.test(content), `Found forbidden .webp asset reference in ${f}`);
    assert.ok(!/fufu|menshen|福福|门神/i.test(content), `Found leftover original project reference in ${f}`);
  }
});

test('2. 全部引用的《闯关勇者》REA立绘、_st颜艺差分、子弹大招、宝物、UI、Hud位图字与31轨音频100%存在', () => {
  const rels = new Set(['fonts/fz.ttf']);
  const add = (u) => {
    if (!u || u.startsWith('data:image/svg+xml')) return;
    rels.add(u.replace(/^\.\.\/assets\//, '').replace(/^\.\/assets\//, ''));
  };

  for (const v of Object.values(UI_SPRITES)) add(v);
  for (const v of Object.values(BATTLE_PROPS)) add(v);
  for (const v of Object.values(AUDIO_TRACKS)) add(v);
  for (const r of Object.values(RARITY_META)) add(r.frameSprite);

  assert.equal(HERO_ROSTER.length, 54, 'Roster should contain 54 playable units');
  for (const h of HERO_ROSTER) {
    add(h.portrait);
    add(h.hitPortrait);
    add(h.comboBullet);
    add(h.strikeProjectile);
  }
  for (const t of TREASURES) add(t.icon);
  for (const s of STAGES) {
    add(s.bg);
    add(s.emblem);
    add(s.bossPortrait);
    for (const w of s.waves) {
      for (const b of w.bumpers || []) add(b.sprite);
      for (const e of w.enemies) {
        add(e.portrait);
        add(e.hitPortrait);
      }
    }
  }
  for (const pfx of HUD_DIGIT_PREFIXES) {
    for (let d = 0; d <= 9; d++) rels.add(`sprites/UI_界面/ui/Hud/${pfx}${d}.png`);
  }

  assert.ok(rels.size >= 270, `Expected high REA asset utilization (>=270), got ${rels.size}`);
  for (const rel of rels) {
    const fullPath = path.join(ASSETS_ROOT, rel);
    assert.ok(fs.existsSync(fullPath), `Missing REA asset on disk: ${fullPath}`);
  }
});

test('3. SVG 过渡指示件完整性校验（元素纹章、反射/贯通印章、弱点准星、音量开关）', () => {
  for (const k of ['fire', 'water', 'wood', 'gold', 'star']) {
    assert.ok(ELEMENT_SVG_MARKUP[k].includes('<svg'));
    assert.ok(ELEMENT_SVG_URIS[k].startsWith('data:image/svg+xml;utf8,'));
  }
  assert.ok(MOVE_TYPE_SVG_URIS.reflect.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(MOVE_TYPE_SVG_URIS.pierce.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(WEAKPOINT_RETICLE_URI.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(AUDIO_ICON_SVG.on.includes('<svg') && AUDIO_ICON_SVG.off.includes('<svg'));
});

test('4. 《闯关勇者》宝物二合一神话合成、流派羁绊与20抽SSR保底校验', () => {
  const st = createInitialState();
  // 初始持有 t_drumstick（魔法鸡腿），再获得 t_wand（魔杖）应自动合成为 m_drumstick_staff（★鸡腿法杖）！
  const synthRes = grantTreasure('t_wand', st);
  assert.equal(synthRes.synthesized.length, 1);
  assert.equal(synthRes.synthesized[0].id, 'm_drumstick_staff');
  assert.ok(st.treasures.includes('m_drumstick_staff'));
  assert.ok(!st.treasures.includes('t_drumstick') && !st.treasures.includes('t_wand'));
  assert.equal(MYTHIC_TREASURES.length, 8);

  // 同流派2人激活羁绊
  const sum = getSquadSummary(['lieren', 'skin_2', 'shuangling', 'shuangfeng'], st);
  assert.ok(sum.activeBonds.some((b) => b.genre === '石头暴击流'));
  assert.ok(sum.totalAtkPct >= 36);

  // 20 抽必出 SSR 传说保底
  resetState();
  STATE.chestKeys = 25;
  let gotSSR = false;
  for (let i = 0; i < 20; i++) {
    const res = pullTreasureChest(1);
    if (res.items[0].hero.rarity === 'SSR') gotSSR = true;
  }
  assert.ok(gotSSR, '20 pulls must guarantee at least 1 SSR unit');
});

test('5. 200 局无头 AI 自动拉弓弹射通关平衡性压测（零报错 + 健康胜率区间）', () => {
  let seed = 20261124;
  const seededRng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const archetypes = [
    { squad: ['lieren', 'shuangfeng', 'shuangling', 'yanti'], lv: 4, stars: 1, treasures: ['t_drumstick'], stageIdx: 2 }, // 1-3 霍格
    { squad: ['longkai', 'daodun', 'panda', 'yingshoumo'], lv: 7, stars: 1, treasures: ['m_drumstick_staff'], stageIdx: 8 }, // 越级挑战 3-3 加兹瑞拉
    { squad: ['shuangling', 'shuangzhao', 'skin_12', 'skin_3'], lv: 12, stars: 2, treasures: ['m_drumstick_staff'], stageIdx: 14 }, // 挑战 5-3 克尔苏加德
    { squad: ['ride_ashes', 'boss_illidan', 'skin_14', 'skin_15'], lv: 18, stars: 2, treasures: ['m_rage_totem'], stageIdx: 17 }, // 越级挑战终章 6-3 毁灭者
  ];

  let wins = 0;
  let totalTurns = 0;
  let maxComboObserved = 0;
  const totalRuns = 200;

  for (let i = 0; i < totalRuns; i++) {
    const arch = archetypes[i % archetypes.length];
    const st = createInitialState();
    st.treasures = [...arch.treasures];
    for (const hid of arch.squad) {
      st.owned[hid] = { level: arch.lv, stars: arch.stars, shards: 0 };
    }
    const res = runHeadlessBattle(STAGES[arch.stageIdx], arch.squad, st, seededRng, 40);
    assert.ok(res && typeof res.win === 'boolean');
    if (res.win) wins += 1;
    totalTurns += res.turns;
    maxComboObserved = Math.max(maxComboObserved, res.maxCombo);
  }

  const winRate = wins / totalRuns;
  console.log(
    JSON.stringify({
      totalRuns,
      wins,
      winRatePct: Number((winRate * 100).toFixed(1)),
      avgTurns: Number((totalTurns / totalRuns).toFixed(2)),
      maxComboObserved,
    }),
  );
  assert.ok(winRate >= 0.55 && winRate <= 0.99, `Expected balanced AI win rate between 55% and 99%, got ${winRate}`);
  assert.ok(maxComboObserved >= 8, `Expected lively multi-hit/combo chains, got maxCombo=${maxComboObserved}`);
});

test('6. SPHERE_CROPS 球体完整头部裁切表 100% 覆盖全部54勇者与全关卡魔物/首领立绘及受击差分', () => {
  const norm = (u) => String(u || '').replace(/^\.\.\/assets\//, '').replace(/^\.\/assets\//, '');
  const requiredPortraits = new Set();

  assert.equal(HERO_ROSTER.length, 54, 'Roster should contain 54 playable units');
  for (const h of HERO_ROSTER) {
    requiredPortraits.add(norm(h.portrait));
    requiredPortraits.add(norm(h.hitPortrait));
  }

  for (const s of STAGES) {
    requiredPortraits.add(norm(s.bossPortrait));
    for (const w of s.waves) {
      for (const e of w.enemies) {
        requiredPortraits.add(norm(e.portrait));
        requiredPortraits.add(norm(e.hitPortrait));
      }
    }
  }

  assert.ok(requiredPortraits.size >= 80, `Expected >=80 unique role/monster portraits, got ${requiredPortraits.size}`);
  for (const rel of requiredPortraits) {
    const crop = SPHERE_CROPS[rel];
    assert.ok(Array.isArray(crop) && crop.length === 6, `Missing or malformed SPHERE_CROPS entry for: ${rel}`);
    const [sx, sy, sw, sh, nw, nh] = crop;
    assert.ok(Number.isFinite(sx) && Number.isFinite(sy), `Invalid sx/sy in SPHERE_CROPS for ${rel}: ${crop}`);
    assert.ok(sw > 0 && sh > 0 && nw > 0 && nh > 0, `Expected sw,sh,nw,nh > 0 in SPHERE_CROPS for ${rel}: ${crop}`);
  }
});
