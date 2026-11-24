// 构建独立自包含静态发布包 pinball/dist/（自动归集实际引用的全部《闯关勇者》解包美术/位图字/字体/31轨音频）

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BATTLE_PROPS, HUD_DIGIT_PREFIXES, UI_SPRITES } from '../src/assets.js';
import { AUDIO_TRACKS } from '../src/audio.js';
import { HERO_ROSTER, RARITY_META } from '../src/data/roster.js';
import { STAGES } from '../src/data/stages.js';
import { TREASURES } from '../src/data/treasures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PINBALL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PINBALL_ROOT, '..');
const SRC_ASSETS = path.join(REPO_ROOT, 'assets');
const DIST_DIR = path.join(PINBALL_ROOT, 'dist');

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

const assetRels = new Set([
  'fonts/fz.ttf',
  'textures/角色/role/role_2.png',
  'sprites/UI_界面/ui/Hud/HX_+.png',
  'sprites/UI_界面/ui/Hud/PT_+.png',
  'sprites/UI_界面/ui/Hud/BJ_+.png',
]);

function addRel(u) {
  if (!u || u.startsWith('data:image/svg+xml')) return;
  assetRels.add(u.replace(/^\.\.\/assets\//, '').replace(/^\.\/assets\//, ''));
}

for (const v of Object.values(UI_SPRITES)) addRel(v);
for (const v of Object.values(BATTLE_PROPS)) addRel(v);
for (const v of Object.values(AUDIO_TRACKS)) addRel(v);
for (const r of Object.values(RARITY_META)) addRel(r.frameSprite);

for (const h of HERO_ROSTER) {
  addRel(h.portrait);
  addRel(h.hitPortrait);
  addRel(h.comboBullet);
  addRel(h.strikeProjectile);
}

for (const t of TREASURES) addRel(t.icon);

for (const st of STAGES) {
  addRel(st.bg);
  addRel(st.emblem);
  addRel(st.bossPortrait);
  for (const w of st.waves) {
    if (w.bumpers) {
      for (const b of w.bumpers) addRel(b.sprite);
    }
    for (const e of w.enemies) {
      addRel(e.portrait);
      addRel(e.hitPortrait);
    }
  }
}

for (const pfx of HUD_DIGIT_PREFIXES) {
  for (let d = 0; d <= 9; d++) {
    assetRels.add(`sprites/UI_界面/ui/Hud/${pfx}${d}.png`);
  }
}

function copyAndRewrite(relPath, replacer = (s) => s) {
  const srcFile = path.join(PINBALL_ROOT, relPath);
  const dstFile = path.join(DIST_DIR, relPath);
  fs.mkdirSync(path.dirname(dstFile), { recursive: true });
  const raw = fs.readFileSync(srcFile, 'utf8');
  fs.writeFileSync(dstFile, replacer(raw), 'utf8');
}

copyAndRewrite('index.html', (s) => s.replaceAll('../assets/', './assets/'));
copyAndRewrite('styles.css', (s) => s.replaceAll('../assets/', './assets/'));
copyAndRewrite('src/svg_fallbacks.js');
copyAndRewrite('src/assets.js', (s) =>
  s.replace("export const ASSET_BASE = '../assets';", "export const ASSET_BASE = './assets';"),
);
copyAndRewrite('src/audio.js');
copyAndRewrite('src/state.js');
copyAndRewrite('src/modals.js');
copyAndRewrite('src/pages.js');
copyAndRewrite('src/main.js');
copyAndRewrite('src/data/roster.js');
copyAndRewrite('src/data/sphere_crops.js');
copyAndRewrite('src/data/treasures.js');
copyAndRewrite('src/data/stages.js');
copyAndRewrite('src/battle/renderer.js');
copyAndRewrite('src/battle/engine.js');

fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '', 'utf8');

let copiedAssets = 0;
let totalBytes = 0;
for (const rel of assetRels) {
  const src = path.join(SRC_ASSETS, rel);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing required REA asset during dist build: ${src}`);
  }
  const dst = path.join(DIST_DIR, 'assets', rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  copiedAssets += 1;
  totalBytes += fs.statSync(dst).size;
}

console.log(
  JSON.stringify({
    ok: true,
    distDir: DIST_DIR,
    copiedAssets,
    totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
  }),
);
