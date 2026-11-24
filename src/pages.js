// 《弹珠勇者 · 弹夹撞击闯关录》五大主界面渲染模块（闯关 / 战团 / 宝箱 / 图鉴与神器合成 / 黑市）

import { BATTLE_PROPS, UI_SPRITES, assetUrl, renderSphereAvatar } from './assets.js';
import { SFX, vibrate } from './audio.js';
import { COLLECTION_GROUPS, ELEMENT_META, HERO_MAP, HERO_ROSTER, RARITY_META } from './data/roster.js';
import { STAGES } from './data/stages.js';
import { BASE_TREASURES, MYTHIC_TREASURES, TREASURE_MAP } from './data/treasures.js';
import { openGachaRevealModal, openHeroModal, openSquadPickerModal } from './modals.js';
import {
  CODEX_MILESTONES,
  STATE,
  autoSynthesizeTreasures,
  getHeroStats,
  getSquadSummary,
  getTreasureBonuses,
  grantTreasure,
  pullTreasureChest,
  resetState,
  saveState,
} from './state.js';
import { ELEMENT_SVG_MARKUP } from './svg_fallbacks.js';

let codexGroup = '全部阵营';
let codexRarity = 'ALL';
let gachaGroup = 'ALL';

const ico = (rel) => `<img class="inline-ico" src="${assetUrl(rel)}" alt="" />`;

// ==================== 1. 闯关讨伐页 ====================
export function renderCampaignPage(hooks) {
  const sec = document.getElementById('page-campaign');
  const chStages = STAGES.filter((s) => s.chapter === STATE.selectedChapter);
  const firstStage = chStages[0] || STAGES[0];
  const leftHero = HERO_MAP[STATE.squad[0]];
  const rightHero = HERO_MAP[STATE.squad[1]];
  const summary = getSquadSummary();
  const chapterNames = ['一章·林地', '二章·矿脉', '三章·海渊', '四章·云巅', '五章·天灾', '六章·神殿'];

  sec.innerHTML = `
    <div class="campaign-hero-header" style="background-image:url('${assetUrl(firstStage.bg)}')">
      <div class="guard-unit" data-inspect="${leftHero.id}">
        <img src="${assetUrl(leftHero.portrait)}" alt="${leftHero.name}" />
        <span class="guard-name-pill">${leftHero.name}·1号位</span>
      </div>
      <div class="chapter-plaque">
        <img class="chapter-plaque-emblem" src="${assetUrl(firstStage.emblem)}" alt="" />
        <div class="chapter-plaque-title">${firstStage.chapterTitle}</div>
        <div class="chapter-plaque-power">战团总战力 ${summary.totalPower.toLocaleString()}</div>
      </div>
      <div class="guard-unit" data-inspect="${rightHero.id}">
        <img src="${assetUrl(rightHero.portrait)}" alt="${rightHero.name}" />
        <span class="guard-name-pill">${rightHero.name}·2号位</span>
      </div>
    </div>

    <div class="chapter-tabs">
      ${chapterNames
        .map((label, i) => `<button type="button" class="ch-tab-btn ${STATE.selectedChapter === i + 1 ? 'active' : ''}" data-ch="${i + 1}">${label}</button>`)
        .join('')}
    </div>

    <div class="yz-board">
      ${chStages
        .map((st) => {
          const stars = STATE.clearedStages[st.id] || 0;
          const headClass = stars > 0 ? 'Cleared' : st.stageNum === 3 ? 'BossStage' : 'NormalStage';
          const starStr = stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : st.stageNum === 3 ? '首领决战' : '待讨伐';
          const elemMeta = ELEMENT_META[st.recElement];
          const bossEnemy = st.waves
            .flatMap((w) => w.enemies)
            .find((e) => e.isBoss || e.portrait === st.bossPortrait);
          const bossColor = ELEMENT_META[bossEnemy?.element || st.recElement]?.color || '#d99830';
          const firstHero = st.firstClearHeroId ? HERO_MAP[st.firstClearHeroId] : null;
          const firstTr = st.firstClearTreasureId ? TREASURE_MAP[st.firstClearTreasureId] : null;
          return `
            <article class="stage-card">
              <div class="stage-card-head ${headClass}">
                <span>${st.id} ${st.name}</span>
                <span>荐:${elemMeta.name} · ${starStr}</span>
              </div>
              <div class="stage-card-body">
                <div class="stage-boss-thumb">
                  ${renderSphereAvatar(st.bossPortrait, st.name, 54, bossColor)}
                </div>
                <div class="stage-info">
                  <div class="stage-sub">${st.subtitle}</div>
                  <div class="stage-rewards">
                    <span class="reward-chip">${ico(UI_SPRITES.coin)}+${st.rewardCoins}</span>
                    <span class="reward-chip">${ico(UI_SPRITES.gem)}+${st.rewardGems}</span>
                    ${stars === 0 && firstHero ? `<span class="reward-chip first-clear">${ico(UI_SPRITES.firstClear)}首通：${firstHero.name}</span>` : ''}
                    ${stars === 0 && firstTr ? `<span class="reward-chip first-clear">${ico(firstTr.icon)}${firstTr.name}</span>` : ''}
                  </div>
                </div>
                <button type="button" class="btn-launch-stage" data-stage="${st.id}">
                  <span>出击</span>
                  <small>${ico(UI_SPRITES.stamina)}${st.energyCost}</small>
                </button>
              </div>
            </article>
          `;
        })
        .join('')}
    </div>

    <div class="parchment-strip">
      <span>
        ${
          summary.activeBonds.length > 0
            ? `✨ 已激活流派：${summary.activeBonds.map((b) => `【${b.bondName}】`).join(' ')}`
            : '💡 同流派上阵2名勇者即可激活强力流派羁绊'
        }
      </span>
      <button type="button" class="mini-ctrl-btn" id="btn-goto-squad">调整战团</button>
    </div>
  `;

  sec.querySelectorAll('[data-inspect]').forEach((el) => {
    el.addEventListener('click', () => {
      SFX.click();
      openHeroModal(el.dataset.inspect, hooks);
    });
  });

  sec.querySelectorAll('[data-ch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SFX.click();
      STATE.selectedChapter = Number(btn.dataset.ch);
      saveState();
      renderCampaignPage(hooks);
    });
  });

  sec.querySelectorAll('[data-stage]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const st = STAGES.find((s) => s.id === btn.dataset.stage);
      if (st) hooks.startStageBattle(st);
    });
  });

  sec.querySelector('#btn-goto-squad')?.addEventListener('click', () => {
    SFX.click();
    hooks.switchTab('squad');
  });
}

// ==================== 2. 弹珠战团页 ====================
export function renderSquadPage(hooks) {
  const sec = document.getElementById('page-squad');
  const summary = getSquadSummary();
  const tBonus = getTreasureBonuses();
  const rOrder = { SSR: 3, SR: 2, R: 1 };
  const ownedIds = Object.keys(STATE.owned).sort((a, b) => {
    const sa = getHeroStats(a);
    const sb = getHeroStats(b);
    if (rOrder[sb.def.rarity] !== rOrder[sa.def.rarity]) return rOrder[sb.def.rarity] - rOrder[sa.def.rarity];
    return sb.power - sa.power;
  });

  sec.innerHTML = `
    <div class="section-banner">
      <div>
        <h2>弹珠四勇者战团</h2>
        <span>撞击队友触发原版子弹友情技 · 同流派2人激活羁绊</span>
      </div>
      <span>战力 ${summary.totalPower.toLocaleString()}</span>
    </div>

    <div class="yz-board">
      <div class="squad-slots-grid">
        ${STATE.squad
          .map((id, idx) => {
            const st = getHeroStats(id);
            const rar = RARITY_META[st.def.rarity];
            const accent = ELEMENT_META[st.def.element]?.color || '#d99830';
            return `
              <div class="unit-card ${st.def.rarity}" data-slot-card="${idx}">
                <span class="rarity-ribbon" style="background:${rar.badgeBg}">${idx + 1}号位</span>
                <span class="elem-badge">${ELEMENT_SVG_MARKUP[st.def.element]}</span>
                ${renderSphereAvatar(st.def.portrait, st.def.name, 62, accent)}
                <div class="unit-card-name">${st.def.name}</div>
                <div class="unit-card-meta">Lv.${st.owned.level} ${'★'.repeat(st.owned.stars)}</div>
                <div class="unit-card-meta">${st.def.moveType === 'pierce' ? '贯通' : '反射'}·${st.def.genre.slice(0, 4)}</div>
                <button type="button" class="mini-ctrl-btn" style="margin-top:4px;width:100%" data-pick-slot="${idx}">换将</button>
              </div>
            `;
          })
          .join('')}
      </div>

      <div class="parchment-strip" style="flex-direction:column;align-items:flex-start;gap:4px">
        <div>${ico(UI_SPRITES.hpHeart)} <strong>战团总生命：</strong>${summary.totalHp.toLocaleString()} · 宝物永久增幅：攻+${tBonus.atkPct}% / 血+${tBonus.hpPct}%</div>
        ${
          summary.activeBonds.length > 0
            ? summary.activeBonds.map((b) => `<div>🔥 <strong>【${b.bondName}】</strong>(${b.genre})：${b.desc}</div>`).join('')
            : '<div>💡 提示：将同一流派（石头暴击流、冰毒减速流、纯正吸血流等）2名角色编入队伍即可激活流派羁绊！</div>'
        }
      </div>
    </div>

    <div class="section-banner">
      <h2>已招募名册 (${ownedIds.length} / ${HERO_ROSTER.length})</h2>
      <span>点击角色查看颜艺与升级</span>
    </div>

    <div class="yz-board deferred-list">
      <div class="cards-grid-4">
        ${ownedIds
          .map((id) => {
            const st = getHeroStats(id);
            const rar = RARITY_META[st.def.rarity];
            const accent = ELEMENT_META[st.def.element]?.color || '#d99830';
            const inTeam = STATE.squad.includes(id);
            return `
              <div class="unit-card ${st.def.rarity}" data-hero-id="${id}">
                <span class="rarity-ribbon" style="background:${rar.badgeBg}">${rar.label}</span>
                <span class="elem-badge">${ELEMENT_SVG_MARKUP[st.def.element]}</span>
                ${renderSphereAvatar(st.def.portrait, st.def.name, 62, accent)}
                <div class="unit-card-name">${st.def.name}</div>
                <div class="unit-card-meta">Lv.${st.owned.level} ${'★'.repeat(st.owned.stars)}</div>
                <div class="unit-card-meta">${inTeam ? '✅ 出战中' : st.def.genre.slice(0, 4)}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  sec.querySelectorAll('[data-slot-card]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-pick-slot]')) return;
      SFX.click();
      openHeroModal(STATE.squad[Number(card.dataset.slotCard)], hooks);
    });
  });

  sec.querySelectorAll('[data-pick-slot]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      SFX.click();
      openSquadPickerModal(Number(btn.dataset.pickSlot), hooks);
    });
  });

  sec.querySelectorAll('[data-hero-id]').forEach((card) => {
    card.addEventListener('click', () => {
      SFX.click();
      openHeroModal(card.dataset.heroId, hooks);
    });
  });
}

// ==================== 3. 璀璨宝箱页 ====================
export function renderGachaPage(hooks) {
  const sec = document.getElementById('page-gacha');
  const remainPity = Math.max(1, 20 - STATE.pitySSR);
  const previewPool = gachaGroup === 'ALL' ? ['skin_15', 'ride_ashes'] : HERO_ROSTER.filter((h) => h.group === gachaGroup).slice(0, 2).map((h) => h.id);
  const leftP = HERO_MAP[previewPool[0]] || HERO_ROSTER[0];
  const rightP = HERO_MAP[previewPool[1]] || HERO_ROSTER[1];

  sec.innerHTML = `
    <div class="section-banner">
      <div>
        <h2>勇者宝库 · 璀璨宝箱</h2>
        <span>公开概率 · 20抽必出SSR传说 · 五连必赠合成宝物</span>
      </div>
      <span>${ico(UI_SPRITES.keySuper)} 钥匙 ${STATE.chestKeys}</span>
    </div>

    <div class="filter-pills">
      <button type="button" class="filter-pill ${gachaGroup === 'ALL' ? 'active' : ''}" data-ggroup="ALL">全阵营招募</button>
      ${COLLECTION_GROUPS.map((g) => `<button type="button" class="filter-pill ${gachaGroup === g ? 'active' : ''}" data-ggroup="${g}">${g}</button>`).join('')}
    </div>

    <div class="gacha-stage" style="background-image:url('${assetUrl(UI_SPRITES.gachaBg)}')">
      <div class="gacha-stage-inner">
        <div style="font-size:12px;font-weight:900;color:#ffe28a">
          当前卡池：${gachaGroup === 'ALL' ? '全阵营 54 位勇者/神装/魔宠/坐骑/魔王' : `【${gachaGroup}】定向专柜`}
        </div>
        <div class="gacha-showcase-row">
          <img class="hero-preview" src="${assetUrl(leftP.portrait)}" alt="" />
          <img class="chest-img" src="${assetUrl(UI_SPRITES.chestSuper)}" alt="璀璨宝箱" />
          <img class="hero-preview" src="${assetUrl(rightP.portrait)}" alt="" />
        </div>
        <div style="font-size:12px;font-weight:800;color:#fff6df">
          ✨ 再开 <strong>${remainPity}</strong> 次必出【传说 SSR】！五连额外必得 1 件未拥有宝物组件！
        </div>
        <div class="gacha-btn-row">
          <button type="button" class="yz-primary-btn emerald" id="btn-pull-1">
            单抽一箱<br /><small>${STATE.chestKeys >= 1 ? `${ico(UI_SPRITES.keySuper)}1把钥匙` : `${ico(UI_SPRITES.coin)}300金币`}</small>
          </button>
          <button type="button" class="yz-primary-btn" id="btn-pull-5">
            五连璀璨开箱<br /><small>${STATE.chestKeys >= 5 ? `${ico(UI_SPRITES.keySuper)}5把钥匙` : `${ico(UI_SPRITES.keySuper)}${STATE.chestKeys} + ${ico(UI_SPRITES.coin)}${(5 - STATE.chestKeys) * 300}`}</small>
          </button>
        </div>
      </div>
    </div>

    <div class="yz-board">
      <div style="font-size:13px;font-weight:900;color:#5c280e">📜 宝箱概率与二合一宝物说明</div>
      <div style="font-size:11.5px;line-height:1.65;color:#3d2011;font-weight:700">
        • <strong>传说（SSR）</strong>：综合概率 <strong>10.0%</strong>（最多 20 抽必出保底）<br />
        • <strong>史诗（SR）</strong>：<strong>58.0%</strong> · <strong>稀有（R）</strong>：<strong>32.0%</strong><br />
        • 重复角色自动转化为<strong>升星碎片</strong>，集满自动突破升星（最高 5★）；随箱掉落的基础宝物凑齐一对将自动合成为<strong>彩色神话神器</strong>！
      </div>
    </div>
  `;

  sec.querySelectorAll('[data-ggroup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SFX.click();
      gachaGroup = btn.dataset.ggroup;
      renderGachaPage(hooks);
    });
  });

  const execPull = (count) => {
    const res = pullTreasureChest(count, gachaGroup);
    if (!res) {
      SFX.click();
      hooks.showToast('钥匙或金币不足，去闯关或领图鉴里程碑吧！');
      return;
    }
    const hasSSR = res.items.some((r) => r.hero.rarity === 'SSR');
    const hasSynth = (res.bonusTreasure?.synthesized?.length || 0) > 0;
    SFX.play(hasSynth ? 'synthStart' : hasSSR ? 'rewardPop' : 'gachaRoll', 0.65, 40);
    vibrate(hasSSR || hasSynth ? 40 : 18);
    hooks.onStateMutated();
    openGachaRevealModal(res, hooks);
  };

  sec.querySelector('#btn-pull-1')?.addEventListener('click', () => execPull(1));
  sec.querySelector('#btn-pull-5')?.addEventListener('click', () => execPull(5));
}

// ==================== 4. 图鉴与二合一神话合成页 ====================
export function renderCodexPage(hooks) {
  const sec = document.getElementById('page-codex');
  const ownedCount = Object.keys(STATE.owned).length;
  const filtered = HERO_ROSTER.filter((h) => {
    if (codexGroup !== '全部阵营' && h.group !== codexGroup) return false;
    if (codexRarity !== 'ALL' && h.rarity !== codexRarity) return false;
    return true;
  });

  const nextMs = CODEX_MILESTONES.find((m) => !STATE.claimedMilestones.includes(m.count)) || CODEX_MILESTONES[CODEX_MILESTONES.length - 1];
  const canClaim = ownedCount >= nextMs.count && !STATE.claimedMilestones.includes(nextMs.count);
  const mythicCount = MYTHIC_TREASURES.filter((m) => STATE.treasures.includes(m.id)).length;

  sec.innerHTML = `
    <div class="section-banner">
      <div>
        <h2>神器合成台 (${mythicCount}/${MYTHIC_TREASURES.length})</h2>
        <span>集齐2件对应原版宝物散件，自动融合成彩色神话神器！</span>
      </div>
      <img src="${assetUrl(UI_SPRITES.synthBadge)}" alt="" style="height:24px;object-fit:contain" />
    </div>

    <div class="yz-board">
      <div class="synth-recipe-grid">
        ${MYTHIC_TREASURES.map((mt) => {
          const hasMythic = STATE.treasures.includes(mt.id);
          const m1 = TREASURE_MAP[mt.materials[0]];
          const m2 = TREASURE_MAP[mt.materials[1]];
          const hasM1 = hasMythic || STATE.treasures.includes(m1.id);
          const hasM2 = hasMythic || STATE.treasures.includes(m2.id);
          return `
            <div class="synth-row ${hasMythic ? 'owned-mythic' : ''}">
              <div class="t-slot ${hasM1 ? 'lit' : 'dim'}" title="${m1.name}">
                <img src="${assetUrl(m1.icon)}" alt="${m1.name}" />
              </div>
              <img class="synth-op" src="${assetUrl(UI_SPRITES.synthPlus)}" alt="+" />
              <div class="t-slot ${hasM2 ? 'lit' : 'dim'}" title="${m2.name}">
                <img src="${assetUrl(m2.icon)}" alt="${m2.name}" />
              </div>
              <img class="synth-op" src="${assetUrl(UI_SPRITES.synthEqual)}" alt="=" />
              <div class="t-slot ${hasMythic ? 'lit' : 'dim'}" title="${mt.name}">
                <img src="${assetUrl(mt.icon)}" alt="${mt.name}" />
              </div>
              <div style="flex:1;min-width:0;font-size:11px;line-height:1.4">
                <div style="font-weight:900;color:${hasMythic ? '#942812' : '#3d2212'}">${mt.name} ${hasMythic ? '✅已激活' : ''}</div>
                <div style="color:#694228;font-size:10px">${m1.name} + ${m2.name} · 攻+${mt.atkPct}% 血+${mt.hpPct}%</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="parchment-strip">
      <div>
        <div><strong>${ico(UI_SPRITES.chestStage3)}图鉴里程碑【${nextMs.title}】(${Math.min(ownedCount, nextMs.count)}/${nextMs.count})</strong></div>
        <div style="font-size:10.5px;color:#6e4427">奖励：${ico(UI_SPRITES.coin)}${nextMs.coins} + ${ico(UI_SPRITES.gem)}${nextMs.gems} + ${ico(UI_SPRITES.keySuper)}${nextMs.keys}把钥匙</div>
      </div>
      <button type="button" class="yz-primary-btn ${canClaim ? 'emerald' : ''}" id="btn-claim-ms" ${canClaim ? '' : 'disabled style="opacity:0.55"'}>
        ${STATE.claimedMilestones.includes(nextMs.count) ? '已领完' : canClaim ? '领取奖励' : '未达成'}
      </button>
    </div>

    <div class="section-banner">
      <h2>全角色图鉴 (${ownedCount}/${HERO_ROSTER.length})</h2>
      <span>点击任意头像预览受击颜艺与必杀</span>
    </div>

    <div class="filter-pills">
      <button type="button" class="filter-pill ${codexGroup === '全部阵营' ? 'active' : ''}" data-cgroup="全部阵营">全部阵营</button>
      ${COLLECTION_GROUPS.map((g) => `<button type="button" class="filter-pill ${codexGroup === g ? 'active' : ''}" data-cgroup="${g}">${g}</button>`).join('')}
    </div>

    <div class="filter-pills">
      ${[['ALL', '全部品质'], ['SSR', '✦ 传说'], ['SR', '✦ 史诗'], ['R', '✦ 稀有']]
        .map(([k, lb]) => `<button type="button" class="filter-pill ${codexRarity === k ? 'active' : ''}" data-crarity="${k}">${lb}</button>`)
        .join('')}
    </div>

    <div class="yz-board deferred-list">
      <div class="cards-grid-4">
        ${filtered
          .map((h) => {
            const isOwned = !!STATE.owned[h.id];
            const rar = RARITY_META[h.rarity];
            const accent = ELEMENT_META[h.element]?.color || '#d99830';
            return `
              <div class="unit-card ${h.rarity} ${isOwned ? '' : 'locked'}" data-poke-id="${h.id}">
                <span class="rarity-ribbon" style="background:${rar.badgeBg}">${rar.label}</span>
                <span class="elem-badge">${ELEMENT_SVG_MARKUP[h.element]}</span>
                ${renderSphereAvatar(h.portrait, h.name, 62, accent)}
                <div class="unit-card-name">${h.name}</div>
                <div class="unit-card-meta">${isOwned ? h.title : '未招募·预览'}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  sec.querySelectorAll('[data-cgroup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SFX.click();
      codexGroup = btn.dataset.cgroup;
      renderCodexPage(hooks);
    });
  });

  sec.querySelectorAll('[data-crarity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SFX.click();
      codexRarity = btn.dataset.crarity;
      renderCodexPage(hooks);
    });
  });

  sec.querySelectorAll('[data-poke-id]').forEach((card) => {
    card.addEventListener('click', () => {
      SFX.click();
      openHeroModal(card.dataset.pokeId, hooks);
    });
  });

  sec.querySelector('#btn-claim-ms')?.addEventListener('click', () => {
    if (!canClaim) return;
    STATE.claimedMilestones.push(nextMs.count);
    STATE.coins += nextMs.coins;
    STATE.gems += nextMs.gems;
    STATE.chestKeys += nextMs.keys;
    saveState();
    SFX.play('rewardPop', 0.65, 40);
    hooks.onStateMutated();
    hooks.showToast(`达成【${nextMs.title}】！获得金币+${nextMs.coins} 钻石+${nextMs.gems} 钥匙+${nextMs.keys}！`);
  });
}

// ==================== 5. 勇者补给黑市与试玩台 ====================
export function renderShopPage(hooks) {
  const sec = document.getElementById('page-shop');
  const dailyClaimed = !!STATE.shopPurchases['daily_free'];

  sec.innerHTML = `
    <div class="section-banner">
      <div>
        <h2>勇者营地 · 补给黑市</h2>
        <span>日常巡逻补给、大餐体力、定向宝物匣与全图鉴鉴赏开关</span>
      </div>
      <span>${ico(UI_SPRITES.gem)} ${STATE.gems}</span>
    </div>

    <div class="yz-board">
      <div class="shop-grid">
        <div class="shop-item-card">
          <img src="${assetUrl(UI_SPRITES.giftPack)}" alt="每日巡逻补给包" />
          <div style="font-size:13px;font-weight:900">每日巡逻补给</div>
          <div style="font-size:11px;color:#5e3922">免费领 30体力 + 600金币 + 2把钥匙</div>
          <button type="button" class="yz-primary-btn emerald" style="width:100%;padding:7px" id="shop-daily" ${dailyClaimed ? 'disabled style="opacity:0.55;width:100%;padding:7px"' : ''}>
            ${dailyClaimed ? '今日已领' : '免费领取'}
          </button>
        </div>

        <div class="shop-item-card">
          <img src="${assetUrl(BATTLE_PROPS.foodLv3)}" alt="元素牛肉拼盘" />
          <div style="font-size:13px;font-weight:900">牛肉拼盘大餐</div>
          <div style="font-size:11px;color:#5e3922">立即恢复 60 点出击体力</div>
          <button type="button" class="yz-primary-btn" style="width:100%;padding:7px" id="shop-energy">
            ${ico(UI_SPRITES.gem)} 35 兑换
          </button>
        </div>

        <div class="shop-item-card">
          <img src="${assetUrl(UI_SPRITES.keySuper)}" alt="璀璨钥匙串" />
          <div style="font-size:13px;font-weight:900">璀璨宝箱钥匙 ×5</div>
          <div style="font-size:11px;color:#5e3922">前往宝箱五连必得SSR进度+宝物</div>
          <button type="button" class="yz-primary-btn" style="width:100%;padding:7px" id="shop-keys">
            ${ico(UI_SPRITES.gem)} 120 兑换
          </button>
        </div>

        <div class="shop-item-card">
          <img src="${assetUrl(UI_SPRITES.diceToken)}" alt="奇遇宝物盲匣" />
          <div style="font-size:13px;font-weight:900">未拥有宝物盲匣</div>
          <div style="font-size:11px;color:#5e3922">必出1件未持有散件，冲刺神话合成！</div>
          <button type="button" class="yz-primary-btn" style="width:100%;padding:7px" id="shop-treasure">
            ${ico(UI_SPRITES.gem)} 80 兑换
          </button>
        </div>
      </div>
    </div>

    <div class="yz-board">
      <div style="font-size:13px;font-weight:900;color:#5c280e">🛠️ 策划鉴赏与全资产试玩台</div>
      <div style="font-size:11.5px;color:#3d2011;font-weight:700">
        一键解锁全部 54 位《闯关勇者》角色/神装/魔宠/坐骑/魔王与全套 8 件彩色神话宝物，自由编队体验弹珠连携！
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="yz-primary-btn emerald" style="flex:1" id="btn-unlock-all">
          ✨ 一键解锁全54角色 + 全神话神器
        </button>
        <button type="button" class="mini-ctrl-btn" id="btn-reset-save">
          重置初始存档
        </button>
      </div>
    </div>
  `;

  sec.querySelector('#shop-daily')?.addEventListener('click', () => {
    if (STATE.shopPurchases['daily_free']) return;
    STATE.shopPurchases['daily_free'] = 1;
    STATE.energy += 30;
    STATE.coins += 600;
    STATE.chestKeys += 2;
    saveState();
    SFX.play('rewardPop', 0.65, 40);
    hooks.onStateMutated();
    hooks.showToast('巡逻补给到账！+30体力 +600金币 +2把璀璨钥匙！');
  });

  sec.querySelector('#shop-energy')?.addEventListener('click', () => {
    if (STATE.gems < 35) return hooks.showToast('钻石不足！');
    STATE.gems -= 35;
    STATE.energy += 60;
    saveState();
    SFX.play('pickupHeal', 0.6, 40);
    hooks.onStateMutated();
    hooks.showToast('享用元素牛肉拼盘，恢复 +60 体力！');
  });

  sec.querySelector('#shop-keys')?.addEventListener('click', () => {
    if (STATE.gems < 120) return hooks.showToast('钻石不足！');
    STATE.gems -= 120;
    STATE.chestKeys += 5;
    saveState();
    SFX.play('shopRefresh', 0.6, 40);
    hooks.onStateMutated();
    hooks.showToast('兑换成功！获得 5 把璀璨宝箱钥匙！');
  });

  sec.querySelector('#shop-treasure')?.addEventListener('click', () => {
    if (STATE.gems < 80) return hooks.showToast('钻石不足！');
    const unowned = BASE_TREASURES.filter((bt) => {
      const pm = MYTHIC_TREASURES.find((m) => m.materials.includes(bt.id));
      return !STATE.treasures.includes(bt.id) && !(pm && STATE.treasures.includes(pm.id));
    });
    if (unowned.length === 0) return hooks.showToast('你已集齐并合成全部神话神器啦！');
    STATE.gems -= 80;
    const picked = unowned[Math.floor(Math.random() * unowned.length)];
    const res = grantTreasure(picked.id);
    SFX.play(res.synthesized.length > 0 ? 'synthStart' : 'treasureVault', 0.65, 40);
    hooks.onStateMutated();
    if (res.synthesized.length > 0) {
      hooks.showToast(`获得【${picked.name}】，触发二合一神话合成：${res.synthesized.map((m) => m.name).join('、')}！`);
    } else {
      hooks.showToast(`获得宝物散件【${picked.name}】！去【图鉴】查看合成进度`);
    }
  });

  sec.querySelector('#btn-unlock-all')?.addEventListener('click', () => {
    for (const h of HERO_ROSTER) {
      if (!STATE.owned[h.id]) STATE.owned[h.id] = { level: 12, stars: 2, shards: 0 };
    }
    for (const bt of BASE_TREASURES) {
      if (!STATE.treasures.includes(bt.id)) STATE.treasures.push(bt.id);
    }
    autoSynthesizeTreasures();
    STATE.coins += 15000;
    STATE.energy = Math.max(STATE.energy, 120);
    saveState();
    SFX.play('synthStart', 0.7, 40);
    hooks.onStateMutated();
    hooks.showToast('已解锁全部 54 位角色与 8 件彩色神话宝物，快去【战团】自由搭配！');
  });

  sec.querySelector('#btn-reset-save')?.addEventListener('click', () => {
    resetState();
    SFX.click();
    hooks.onStateMutated();
    hooks.showToast('存档已恢复至初始状态');
  });
}
