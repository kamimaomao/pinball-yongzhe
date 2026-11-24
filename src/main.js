// 《弹珠勇者 · 弹夹撞击闯关录》应用主入口（顶栏、五格底栏、战斗HUD同步与现代Web规范兜底）

import { UI_SPRITES, assetUrl, preloadStageAssets, renderSphereAvatar } from './assets.js';
import { SFX } from './audio.js';
import { PinballBattleEngine } from './battle/engine.js';
import { ELEMENT_META, HERO_MAP } from './data/roster.js';
import { STAGES } from './data/stages.js';
import {
  renderCampaignPage,
  renderCodexPage,
  renderGachaPage,
  renderShopPage,
  renderSquadPage,
} from './pages.js';
import {
  CODEX_MILESTONES,
  STATE,
  addPlayerExp,
  grantHero,
  grantTreasure,
  saveState,
} from './state.js';
import { AUDIO_ICON_SVG } from './svg_fallbacks.js';

let activeTab = 'campaign';
let inBattle = false;
let currentStage = null;
let battleEngine = null;
let toastTimer = 0;

const appRoot = document.getElementById('app');
const resultModal = document.getElementById('result-modal');
const resultModalContent = document.getElementById('result-modal-content');

function showToast(msg) {
  const slot = document.getElementById('toast-slot');
  if (!slot) return;
  slot.innerHTML = `<div class="toast-banner">${msg}</div>`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    slot.innerHTML = '';
  }, 2200);
}

const hooks = {
  showToast,
  switchTab,
  startStageBattle,
  onStateMutated: () => {
    renderTopbar();
    renderNavbar();
    if (!inBattle) renderActiveTab();
  },
};

// 遵循 modern-web-guidance (light-dismiss-a-dialog)：为不支持 closedby 的浏览器补齐边界点击关闭兜底
function setupDialogFallbacks() {
  for (const dialog of document.querySelectorAll('dialog.yz-dialog')) {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }
  }
}

// 遵循 modern-web-guidance (efficient-background-processing)：组件跳帧不可见或页面隐藏时挂起模拟循环
function setupBackgroundPause() {
  const canvasStage = document.getElementById('canvas-container');
  canvasStage.addEventListener('contentvisibilityautostatechange', (event) => {
    if (battleEngine) {
      battleEngine.setExternalPause(!!event.skipped);
    }
  });

  if (!('contentVisibility' in document.documentElement.style) && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (battleEngine) battleEngine.setExternalPause(!entry.isIntersecting);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(canvasStage);
  }

  document.addEventListener('visibilitychange', () => {
    if (battleEngine) battleEngine.setExternalPause(document.hidden);
  });

  window.addEventListener('resize', () => {
    battleEngine?.resize();
  });

  document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
}

function buildShell() {
  appRoot.innerHTML = `
    <div class="phone-shell" id="phone-shell">
      <header class="yz-topbar" id="topbar"></header>
      <div id="toast-slot" role="status" aria-live="polite"></div>

      <main class="yz-main">
        <section id="page-campaign" class="tab-page"></section>
        <section id="page-squad" class="tab-page" hidden></section>
        <section id="page-gacha" class="tab-page" hidden></section>
        <section id="page-codex" class="tab-page" hidden></section>
        <section id="page-shop" class="tab-page" hidden></section>

        <section id="battle-screen" class="battle-screen" hidden>
          <div class="battle-top-hud">
            <div class="wave-pill" id="b-wave-text">波次 1/3</div>
            <div class="combo-pill" id="b-combo-text">连携 ×0</div>
            <div class="battle-ctrl-btns">
              <button type="button" class="mini-ctrl-btn" id="btn-speed">1×常速</button>
              <button type="button" class="mini-ctrl-btn" id="btn-auto">手操</button>
              <button type="button" class="mini-ctrl-btn" id="btn-pause">暂歇</button>
            </div>
          </div>

          <div class="boss-bar-wrap" id="b-boss-wrap" hidden>
            <div class="boss-bar-top">
              <span id="b-boss-name">守关首领</span>
              <span id="b-boss-hp-num">0 / 0</span>
            </div>
            <div class="boss-bar-track">
              <div class="boss-bar-fill" id="b-boss-fill" style="width:100%"></div>
            </div>
          </div>

          <div class="canvas-frame" id="canvas-container">
            <canvas id="battle-canvas" width="400" height="520"></canvas>
          </div>

          <div class="battle-bottom-tray">
            <div class="squad-hp-row">
              <span id="b-buff-label">❤️ 战团生命</span>
              <div class="squad-hp-track">
                <div class="squad-hp-fill" id="b-hp-fill" style="width:100%"></div>
              </div>
              <span id="b-hp-num">0 / 0</span>
            </div>
            <div class="battle-slots" id="b-slots"></div>
          </div>
        </section>
      </main>

      <nav class="yz-navbar" id="navbar"></nav>
    </div>
  `;

  bindBattleButtons();
  setupBackgroundPause();
}

function renderTopbar() {
  const el = document.getElementById('topbar');
  el.innerHTML = `
    <div class="lv-badge" title="团长等级 Lv.${STATE.playerLv}">
      <img src="${assetUrl(UI_SPRITES.levelBadge)}" alt="等级" />
      <span>${STATE.playerLv}</span>
    </div>
    <div class="res-pills">
      <div class="res-pill" title="出击体力">
        <img src="${assetUrl(UI_SPRITES.stamina)}" alt="体力" />
        <span>${STATE.energy}/${STATE.maxEnergy}</span>
        <button type="button" class="res-pill-plus" data-action="quick-energy" aria-label="补充体力">+</button>
      </div>
      <div class="res-pill" title="金币">
        <img src="${assetUrl(UI_SPRITES.coin)}" alt="金币" />
        <span>${STATE.coins.toLocaleString()}</span>
        <button type="button" class="res-pill-plus" data-action="go-shop" aria-label="前往黑市">+</button>
      </div>
      <div class="res-pill" title="钻石">
        <img src="${assetUrl(UI_SPRITES.gem)}" alt="钻石" />
        <span>${STATE.gems.toLocaleString()}</span>
        <button type="button" class="res-pill-plus" data-action="go-codex" aria-label="图鉴领奖">+</button>
      </div>
    </div>
    <button type="button" class="icon-square-btn" data-action="toggle-mute" aria-label="切换声音" title="${SFX.muted ? '当前静音' : '声音已开'}">
      ${SFX.muted ? AUDIO_ICON_SVG.off : AUDIO_ICON_SVG.on}
    </button>
  `;

  el.querySelector('[data-action="quick-energy"]')?.addEventListener('click', () => {
    SFX.click();
    if (STATE.gems >= 30) {
      STATE.gems -= 30;
      STATE.energy += 45;
      saveState();
      renderTopbar();
      showToast('消耗 30 钻石，补充 +45 体力！');
    } else {
      switchTab('shop');
      showToast('可在【黑市】免费领取每日巡逻体力！');
    }
  });
  el.querySelector('[data-action="go-shop"]')?.addEventListener('click', () => switchTab('shop'));
  el.querySelector('[data-action="go-codex"]')?.addEventListener('click', () => switchTab('codex'));
  el.querySelector('[data-action="toggle-mute"]')?.addEventListener('click', () => {
    SFX.unlock();
    const muted = SFX.toggleMute();
    renderTopbar();
    showToast(muted ? '已静音' : '原版配乐与战斗音效已开启');
  });
}

function hasClaimableMilestone() {
  const n = Object.keys(STATE.owned).length;
  return CODEX_MILESTONES.some((m) => n >= m.count && !STATE.claimedMilestones.includes(m.count));
}

function renderNavbar() {
  const nav = document.getElementById('navbar');
  nav.hidden = inBattle;
  if (inBattle) return;

  const tabs = [
    { id: 'campaign', label: '闯关', icon: UI_SPRITES.navCampaign },
    { id: 'squad', label: '战团', icon: UI_SPRITES.navSquad },
    { id: 'gacha', label: '宝箱', icon: UI_SPRITES.navGacha, dot: STATE.chestKeys > 0 },
    { id: 'codex', label: '图鉴', icon: UI_SPRITES.navCodex, dot: hasClaimableMilestone() },
    { id: 'shop', label: '黑市', icon: UI_SPRITES.navShop, dot: !STATE.shopPurchases['daily_free'] },
  ];

  nav.innerHTML = tabs
    .map(
      (t) => `
      <button type="button" class="nav-tile ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
        ${t.dot ? '<span class="nav-dot"></span>' : ''}
        <img class="nav-ico" src="${assetUrl(t.icon)}" alt="" />
        <span>${t.label}</span>
      </button>
    `,
    )
    .join('');

  nav.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SFX.click();
      switchTab(btn.dataset.tab);
    });
  });
}

function syncBgmForState() {
  if (inBattle) SFX.playBgm('bgmBattle');
  else if (activeTab === 'gacha' || activeTab === 'shop') SFX.playBgm('bgmShop');
  else if (activeTab === 'codex') SFX.playBgm('bgmCodex');
  else SFX.playBgm('bgmHome');
}

function renderActiveTab() {
  if (activeTab === 'campaign') renderCampaignPage(hooks);
  else if (activeTab === 'squad') renderSquadPage(hooks);
  else if (activeTab === 'gacha') renderGachaPage(hooks);
  else if (activeTab === 'codex') renderCodexPage(hooks);
  else if (activeTab === 'shop') renderShopPage(hooks);
}

function switchTab(tab) {
  activeTab = tab;
  for (const id of ['campaign', 'squad', 'gacha', 'codex', 'shop']) {
    document.getElementById(`page-${id}`).hidden = inBattle || id !== tab;
  }
  document.getElementById('battle-screen').hidden = !inBattle;
  renderTopbar();
  renderNavbar();
  syncBgmForState();
  if (!inBattle) renderActiveTab();
}

async function startStageBattle(stage) {
  if (STATE.energy < stage.energyCost) {
    SFX.click();
    showToast('体力不足！点击顶栏「+」或前往【黑市】领取补给');
    return;
  }
  STATE.energy -= stage.energyCost;
  saveState();

  SFX.unlock();
  SFX.play('launchShot', 0.55, 40);

  const squadDefs = STATE.squad.map((id) => HERO_MAP[id]);
  await preloadStageAssets(stage, squadDefs);

  currentStage = stage;
  inBattle = true;
  switchTab(activeTab);

  battleEngine?.destroy();
  const canvas = document.getElementById('battle-canvas');
  battleEngine = new PinballBattleEngine(canvas, stage, STATE.squad, {
    onHudUpdate: updateBattleHud,
    onBattleEnd: handleBattleEnd,
  });
}

function bindBattleButtons() {
  document.getElementById('btn-speed')?.addEventListener('click', () => {
    if (!battleEngine) return;
    SFX.click();
    battleEngine.toggleSpeed();
  });

  document.getElementById('btn-auto')?.addEventListener('click', () => {
    if (!battleEngine) return;
    SFX.click();
    const on = battleEngine.toggleAuto();
    showToast(on ? '已开启智能自动弹射' : '已切换为手动拉弓瞄准');
  });

  document.getElementById('btn-pause')?.addEventListener('click', () => {
    if (!battleEngine || !currentStage) return;
    SFX.click();
    battleEngine.setPaused(true);
    resultModalContent.innerHTML = `
      <div class="modal-header">
        <h2 id="result-modal-title">战斗暂歇 · ${currentStage.name}</h2>
      </div>
      <p style="font-size:12.5px;line-height:1.6;font-weight:700;color:#4a2214">
        💡 弹射要诀：<strong>反射型</strong>卡进墙壁与BOSS缝隙可打出几十连击壁咚；<strong>贯通型</strong>可直穿BOSS旋转弱点准星（3倍暴击）并串联全体队友发射原版子弹友情技！
      </p>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button type="button" class="yz-primary-btn emerald" style="flex:1" id="btn-resume-battle" autofocus>继续讨伐</button>
        <button type="button" class="mini-ctrl-btn" style="padding:10px 14px" id="btn-quit-battle">撤退返体力</button>
      </div>
    `;
    resultModalContent.querySelector('#btn-resume-battle')?.addEventListener('click', () => {
      SFX.click();
      resultModal.close();
      battleEngine?.setPaused(false);
    });
    resultModalContent.querySelector('#btn-quit-battle')?.addEventListener('click', () => {
      SFX.close();
      resultModal.close();
      if (currentStage) {
        STATE.energy += Math.max(1, currentStage.energyCost - 1);
        saveState();
      }
      exitBattleToTab('campaign');
    });
    if (!resultModal.open) resultModal.showModal();
  });
}

function updateBattleHud(hud) {
  const waveEl = document.getElementById('b-wave-text');
  const comboEl = document.getElementById('b-combo-text');
  const spdBtn = document.getElementById('btn-speed');
  const autoBtn = document.getElementById('btn-auto');
  const bossWrap = document.getElementById('b-boss-wrap');
  const bossName = document.getElementById('b-boss-name');
  const bossHpNum = document.getElementById('b-boss-hp-num');
  const bossFill = document.getElementById('b-boss-fill');
  const hpFill = document.getElementById('b-hp-fill');
  const hpNum = document.getElementById('b-hp-num');
  const buffLabel = document.getElementById('b-buff-label');
  const slotsContainer = document.getElementById('b-slots');

  if (waveEl) waveEl.textContent = `波次 ${hud.waveIndex}/${hud.totalWaves} · 回合 ${hud.turnCount}`;
  if (comboEl) comboEl.textContent = `连携 ×${hud.comboCount}`;
  if (spdBtn) {
    spdBtn.textContent = hud.speed2x ? '2×倍速' : '1×常速';
    spdBtn.classList.toggle('active', hud.speed2x);
  }
  if (autoBtn) {
    autoBtn.textContent = hud.autoPlay ? '自动中' : '手操';
    autoBtn.classList.toggle('active', hud.autoPlay);
  }

  if (bossWrap && bossName && bossHpNum && bossFill) {
    if (hud.bossName && hud.bossHp !== undefined && hud.bossMaxHp) {
      bossWrap.hidden = false;
      const em = hud.bossElement ? `[${ELEMENT_META[hud.bossElement].name}] ` : '';
      bossName.textContent = `👑 ${em}${hud.bossName}`;
      bossHpNum.textContent = `${hud.bossHp.toLocaleString()} / ${hud.bossMaxHp.toLocaleString()}`;
      bossFill.style.width = `${Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100))}%`;
    } else {
      bossWrap.hidden = true;
    }
  }

  if (hpFill && hpNum && buffLabel) {
    hpFill.style.width = `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%`;
    hpNum.textContent = `${hud.hp.toLocaleString()} / ${hud.maxHp.toLocaleString()}`;
    buffLabel.textContent = hud.atkBuffActive ? '🔥 无尽战意增伤' : '❤️ 战团生命';
  }

  if (slotsContainer) {
    slotsContainer.innerHTML = hud.slots
      .map((s, idx) => {
        const ready = s.cd <= 0;
        const cdLabel = s.strikeArmed ? '必杀ON!' : ready ? '必杀就绪!' : `${s.cd}回合`;
        const accent = ELEMENT_META[s.element]?.color || '#d99830';
        return `
          <button type="button" class="b-slot ${s.isCurrent ? 'current' : ''} ${s.strikeArmed ? 'armed' : ''}" data-bslot="${idx}">
            <span class="b-slot-cd ${ready ? 'ready' : ''}">${cdLabel}</span>
            ${renderSphereAvatar(s.portrait, s.name, 46, accent)}
            <span class="b-slot-name">${s.name}</span>
          </button>
        `;
      })
      .join('');

    slotsContainer.querySelectorAll('[data-bslot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.bslot);
        const slot = hud.slots[idx];
        if (slot.isCurrent && slot.cd <= 0) {
          battleEngine?.toggleStrikeForCurrent();
        } else if (slot.isCurrent) {
          showToast(`${slot.name} 的终极必杀还需 ${slot.cd} 回合充能`);
        } else {
          showToast(`当前轮到 ${hud.slots.find((x) => x.isCurrent)?.name} 拉弓弹射！`);
        }
      });
    });
  }
}

function handleBattleEnd(res) {
  const stage = currentStage;
  if (res.win) {
    const prevStars = STATE.clearedStages[stage.id] || 0;
    const isFirstClear = prevStars === 0;
    STATE.clearedStages[stage.id] = Math.max(prevStars, res.stars);

    const totalCoins = stage.rewardCoins + res.bonusCoins;
    const totalGems = isFirstClear ? stage.rewardGems : Math.round(stage.rewardGems * 0.35);
    STATE.coins += totalCoins;
    STATE.gems += totalGems;
    if (isFirstClear && stage.stageNum === 3) STATE.chestKeys += 2;
    const leveledUp = addPlayerExp(55 + stage.chapter * 20);

    let unlockedHero = null;
    if (isFirstClear && stage.firstClearHeroId) {
      unlockedHero = grantHero(stage.firstClearHeroId).hero;
    }
    let treasureDrop = null;
    if (isFirstClear && stage.firstClearTreasureId) {
      treasureDrop = grantTreasure(stage.firstClearTreasureId);
    }
    saveState();

    const curIdx = STAGES.findIndex((s) => s.id === stage.id);
    const nextStage = curIdx >= 0 && curIdx + 1 < STAGES.length ? STAGES[curIdx + 1] : null;

    resultModalContent.innerHTML = `
      <div style="text-align:center;margin-bottom:6px">
        <img src="${assetUrl(UI_SPRITES.winBanner)}" alt="讨伐胜利" style="height:52px;object-fit:contain" />
        <h2 id="result-modal-title" style="margin:4px 0;font-size:17px">${stage.id} ${stage.name} 讨伐成功！</h2>
        <div style="font-size:22px;color:#d98b14;letter-spacing:4px">${'★'.repeat(res.stars)}${'☆'.repeat(3 - res.stars)}</div>
        <div style="font-size:11.5px;color:#5e3922;font-weight:800">共耗时 ${res.turns} 回合 · 最高连携 ×${res.maxCombo}</div>
      </div>

      <div class="parchment-strip" style="flex-direction:column;align-items:flex-start;gap:4px;margin-bottom:10px">
        <div><img class="inline-ico" src="${assetUrl(UI_SPRITES.coin)}" alt="" /> 获得金币：<strong>+${totalCoins}</strong>（含场内碰撞掉落 +${res.bonusCoins}）</div>
        <div><img class="inline-ico" src="${assetUrl(UI_SPRITES.gem)}" alt="" /> 获得钻石：<strong>+${totalGems}</strong> ${isFirstClear && stage.stageNum === 3 ? '· 章节首通赠璀璨钥匙 +2！' : ''}</div>
        ${leveledUp ? `<div>🎉 <strong>团长等级提升至 Lv.${STATE.playerLv}，体力上限增加！</strong></div>` : ''}
      </div>

      ${
        unlockedHero
          ? `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:linear-gradient(180deg,#fff3c4 0%,#ecc86d 100%);border:2px solid var(--ink-dark);margin-bottom:8px">
            ${renderSphereAvatar(unlockedHero.portrait, unlockedHero.name, 56, ELEMENT_META[unlockedHero.element]?.color || '#d99830')}
            <div>
              <div style="font-size:12.5px;font-weight:900;color:#7a1c12">✨ 首通加盟勇者：${unlockedHero.name}·${unlockedHero.title}！</div>
              <div style="font-size:11px;font-weight:700;color:#4a2214">「${unlockedHero.quote}」</div>
            </div>
          </div>
        `
          : ''
      }

      ${
        treasureDrop?.granted
          ? `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#fff7e6;border:2px solid #855734;margin-bottom:10px">
            <img src="${assetUrl(treasureDrop.granted.icon)}" alt="" style="width:42px;height:42px;object-fit:contain" />
            <div style="font-size:11.5px;font-weight:800">
              <div>🏆 首通战利品：<strong>${treasureDrop.granted.name}</strong></div>
              ${
                treasureDrop.synthesized.length > 0
                  ? `<div style="color:#b83214">🔥 自动二合一合成神话神器：<strong>${treasureDrop.synthesized.map((m) => m.name).join('、')}</strong>！</div>`
                  : `<div style="font-size:10.5px;color:#6e4427">${treasureDrop.granted.desc}</div>`
              }
            </div>
          </div>
        `
          : ''
      }

      <div style="display:flex;gap:8px">
        ${nextStage ? `<button type="button" class="yz-primary-btn emerald" style="flex:1" id="res-next-stage" autofocus>下一关 (${nextStage.id})</button>` : ''}
        <button type="button" class="yz-primary-btn" style="flex:1" id="res-back-home">返回营地</button>
      </div>
    `;

    resultModalContent.querySelector('#res-next-stage')?.addEventListener('click', () => {
      resultModal.close();
      if (nextStage) {
        STATE.selectedChapter = nextStage.chapter;
        saveState();
        startStageBattle(nextStage);
      }
    });
    resultModalContent.querySelector('#res-back-home')?.addEventListener('click', () => {
      resultModal.close();
      exitBattleToTab('campaign');
    });
  } else {
    const refund = Math.floor(stage.energyCost * 0.5);
    STATE.energy += refund;
    saveState();

    resultModalContent.innerHTML = `
      <div style="text-align:center;margin-bottom:8px">
        <img src="${assetUrl(UI_SPRITES.loseBanner)}" alt="讨伐受挫" style="height:48px;object-fit:contain" />
        <h2 id="result-modal-title" style="margin:4px 0;font-size:16px">魔物势大 · 暂退修整</h2>
      </div>
      <p style="font-size:12px;line-height:1.6;font-weight:700;color:#4a2214">
        营地已返还 <strong>+${refund} 体力</strong>！前往【战团】升级勇者、激活同流派羁绊，或在战斗中多拾取成长鸡腿与充能电池即可轻松破关！
      </p>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button type="button" class="yz-primary-btn emerald" style="flex:1" id="res-retry" autofocus>再次讨伐</button>
        <button type="button" class="yz-primary-btn" style="flex:1" id="res-go-upgrade">强化战团</button>
      </div>
    `;

    resultModalContent.querySelector('#res-retry')?.addEventListener('click', () => {
      resultModal.close();
      startStageBattle(stage);
    });
    resultModalContent.querySelector('#res-go-upgrade')?.addEventListener('click', () => {
      resultModal.close();
      exitBattleToTab('squad');
    });
  }

  if (!resultModal.open) resultModal.showModal();
}

function exitBattleToTab(tab) {
  battleEngine?.destroy();
  battleEngine = null;
  inBattle = false;
  currentStage = null;
  switchTab(tab);
}

buildShell();
setupDialogFallbacks();
switchTab('campaign');
