// 《弹珠勇者 · 弹夹撞击闯关录》原生 <dialog> 详情、颜艺预览、换将与宝箱揭晓模块

import { UI_SPRITES, assetUrl, renderSphereAvatar } from './assets.js';
import { SFX } from './audio.js';
import { ELEMENT_META, GENRE_BONDS, HERO_MAP, RARITY_META } from './data/roster.js';
import {
  STATE,
  getHeroStats,
  getUpgradeCost,
  promoteHeroStar,
  saveState,
  upgradeHeroLevel,
} from './state.js';
import { ELEMENT_SVG_MARKUP, MOVE_TYPE_SVG_MARKUP } from './svg_fallbacks.js';

export function assignHeroToSquadSlot(heroId, slotIdx) {
  const existingIdx = STATE.squad.indexOf(heroId);
  if (existingIdx === slotIdx) return;
  if (existingIdx !== -1) {
    const tmp = STATE.squad[slotIdx];
    STATE.squad[slotIdx] = heroId;
    STATE.squad[existingIdx] = tmp;
  } else {
    STATE.squad[slotIdx] = heroId;
  }
  saveState();
}

export function openHeroModal(heroId, hooks) {
  const def = HERO_MAP[heroId];
  if (!def) return;
  const heroModal = document.getElementById('hero-modal');
  const content = document.getElementById('hero-modal-content');
  const isOwned = !!STATE.owned[heroId];
  const st = getHeroStats(heroId);
  const elem = ELEMENT_META[def.element];
  const rar = RARITY_META[def.rarity];
  const cost1 = getUpgradeCost(st.owned.level);
  const needShards = st.owned.stars * 2;
  const bond = GENRE_BONDS.find((b) => b.genre === def.genre);

  content.innerHTML = `
    <div class="modal-header">
      <h2 id="hero-modal-title">${def.name} · ${def.title}</h2>
      <form method="dialog"><button type="submit" class="modal-close-btn" aria-label="关闭">✕</button></form>
    </div>

    <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
      <div id="hero-face-preview" style="position:relative;width:98px;height:98px;display:grid;place-items:center;flex-shrink:0;cursor:${def.hasHitDiff ? 'pointer' : 'default'}">
        <span id="hero-face-sphere">${renderSphereAvatar(def.portrait, def.name, 92, elem.color)}</span>
        ${
          def.hasHitDiff
            ? `<span id="hero-face-tag" style="position:absolute;bottom:0;z-index:4;padding:1px 7px;border-radius:999px;background:rgba(24,13,8,0.88);border:1.2px solid #f0be59;color:#ffe494;font-size:9px;font-weight:900">点此看颜艺</span>`
            : ''
        }
      </div>
      <div style="flex:1;font-size:12px;line-height:1.58">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          <span style="padding:2px 7px;border-radius:6px;background:${rar.badgeBg};color:#fff;font-weight:900;border:1.5px solid var(--ink-dark)">${rar.label}</span>
          <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:6px;background:${elem.color};color:#fff;font-weight:900;border:1.5px solid var(--ink-dark)">
            <span style="width:14px;height:14px;display:inline-block">${ELEMENT_SVG_MARKUP[def.element]}</span>${elem.name}
          </span>
          <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:6px;background:#2a3452;color:#ffe69e;font-weight:900">
            <span style="width:14px;height:14px;display:inline-block">${MOVE_TYPE_SVG_MARKUP[def.moveType]}</span>${def.moveType === 'pierce' ? '贯通型' : '反射型'}
          </span>
        </div>
        <div style="margin-top:4px;font-weight:900;color:#6e3112">${def.group} · 【${def.genre}】</div>
        ${
          isOwned
            ? `<div>等级：<strong>Lv.${st.owned.level}/60</strong> · 星级：<strong>${'★'.repeat(st.owned.stars)}</strong> (碎片 ${st.owned.shards}/${st.owned.stars < 5 ? needShards : '满'})</div>
               <div>攻击：<strong>${st.atk}</strong> · 生命：<strong>${st.hp}</strong> · 弹速：<strong>${def.speed}</strong></div>`
            : `<div style="color:#9e2a1c;font-weight:800">尚未招募（【宝箱】抽取或主线首通获得）</div>
               <div>基础攻击：${def.baseAtk} · 基础生命：${def.baseHp} · 弹速：${def.speed}</div>`
        }
      </div>
    </div>

    <div class="parchment-strip" style="margin-bottom:8px;font-style:italic;color:#4f230e">「${def.quote}」</div>

    <div style="font-size:12px;line-height:1.6;background:#fff8e8;border:2px solid var(--ink-dark);border-radius:11px;padding:9px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:6px">
        <img src="${assetUrl(def.comboBullet)}" alt="" style="width:26px;height:26px;object-fit:contain;flex-shrink:0" />
        <div><strong>弹夹友情技【${def.comboName}】</strong>：${def.comboDesc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
        <img src="${assetUrl(def.strikeProjectile)}" alt="" style="width:26px;height:26px;object-fit:contain;flex-shrink:0" />
        <div><strong>终极必杀【${def.strikeName}】</strong>（${def.strikeCd}回合）：${def.strikeDesc}</div>
      </div>
      ${bond ? `<div style="margin-top:6px;color:#7a3e12">🔗 <strong>流派羁绊【${bond.bondName}】</strong>：${bond.desc}</div>` : ''}
    </div>

    ${
      isOwned
        ? `
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button type="button" class="yz-primary-btn emerald" style="flex:1;padding:7px" id="modal-lv-up" ${st.owned.level >= 60 ? 'disabled' : ''}>
            升级 Lv.+1 (<img class="inline-ico" src="${assetUrl(UI_SPRITES.coin)}" alt="" />${cost1})
          </button>
          <button type="button" class="yz-primary-btn" style="flex:1;padding:7px" id="modal-lv-up5" ${st.owned.level >= 60 ? 'disabled' : ''}>
            连升 5 级
          </button>
          ${st.owned.stars < 5 && st.owned.shards >= needShards ? `<button type="button" class="yz-primary-btn" style="padding:7px" id="modal-star-up">升星 ★+1</button>` : ''}
        </div>
        <div style="font-size:11.5px;font-weight:900;margin-bottom:5px">一键派驻出战槽位：</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
          ${STATE.squad
            .map((sid, idx) => `<button type="button" class="mini-ctrl-btn ${sid === heroId ? 'active' : ''}" data-assign-slot="${idx}">${idx + 1}号:${HERO_MAP[sid].name.slice(0, 3)}</button>`)
            .join('')}
        </div>
      `
        : ''
    }
  `;

  if (def.hasHitDiff) {
    let showingHit = false;
    content.querySelector('#hero-face-preview')?.addEventListener('click', () => {
      showingHit = !showingHit;
      SFX.play('hitNormal', 0.45, 40);
      const sphereWrap = content.querySelector('#hero-face-sphere');
      const tagEl = content.querySelector('#hero-face-tag');
      if (sphereWrap) {
        sphereWrap.innerHTML = renderSphereAvatar(showingHit ? def.hitPortrait : def.portrait, def.name, 92, elem.color);
      }
      if (tagEl) tagEl.textContent = showingHit ? '受击颜艺_st' : '点此看颜艺';
    });
  }

  content.querySelector('#modal-lv-up')?.addEventListener('click', () => {
    if (upgradeHeroLevel(heroId)) {
      SFX.play('statUp', 0.6, 40);
      hooks.onStateMutated();
      openHeroModal(heroId, hooks);
    } else hooks.showToast('金币不足或已满级！');
  });

  content.querySelector('#modal-lv-up5')?.addEventListener('click', () => {
    let n = 0;
    for (let i = 0; i < 5; i++) {
      if (upgradeHeroLevel(heroId)) n++;
      else break;
    }
    if (n > 0) {
      SFX.play('pickupHeal', 0.6, 40);
      hooks.onStateMutated();
      openHeroModal(heroId, hooks);
      hooks.showToast(`${def.name} 连升 ${n} 级！`);
    } else hooks.showToast('金币不足或已满级！');
  });

  content.querySelector('#modal-star-up')?.addEventListener('click', () => {
    if (promoteHeroStar(heroId)) {
      SFX.play('rewardPop', 0.65, 40);
      hooks.onStateMutated();
      openHeroModal(heroId, hooks);
      hooks.showToast(`${def.name} 升星突破成功！`);
    }
  });

  content.querySelectorAll('[data-assign-slot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slotIdx = Number(btn.dataset.assignSlot);
      assignHeroToSquadSlot(heroId, slotIdx);
      SFX.click();
      heroModal.close();
      hooks.onStateMutated();
      hooks.showToast(`${def.name} 已派驻至 ${slotIdx + 1} 号位！`);
    });
  });

  if (!heroModal.open) heroModal.showModal();
}

export function openSquadPickerModal(slotIndex, hooks) {
  const modal = document.getElementById('picker-modal');
  const content = document.getElementById('picker-modal-content');
  const ownedIds = Object.keys(STATE.owned);

  content.innerHTML = `
    <div class="modal-header">
      <h2 id="picker-modal-title">选择第 ${slotIndex + 1} 号位出战勇者</h2>
      <form method="dialog"><button type="submit" class="modal-close-btn" aria-label="关闭">✕</button></form>
    </div>
    <div class="cards-grid-4">
      ${ownedIds
        .map((id) => {
          const st = getHeroStats(id);
          const rar = RARITY_META[st.def.rarity];
          const accent = ELEMENT_META[st.def.element]?.color || '#d99830';
          const inIdx = STATE.squad.indexOf(id);
          return `
            <div class="unit-card ${st.def.rarity}" data-choose-hero="${id}">
              <span class="rarity-ribbon" style="background:${rar.badgeBg}">${rar.label}</span>
              <span class="elem-badge">${ELEMENT_SVG_MARKUP[st.def.element]}</span>
              ${renderSphereAvatar(st.def.portrait, st.def.name, 62, accent)}
              <div class="unit-card-name">${st.def.name}</div>
              <div class="unit-card-meta">${st.def.moveType === 'pierce' ? '贯' : '弹'}·Lv.${st.owned.level}</div>
              <div class="unit-card-meta">${inIdx >= 0 ? `${inIdx + 1}号在阵` : '点击上阵'}</div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  content.querySelectorAll('[data-choose-hero]').forEach((card) => {
    card.addEventListener('click', () => {
      const hid = card.dataset.chooseHero;
      assignHeroToSquadSlot(hid, slotIndex);
      SFX.click();
      modal.close();
      hooks.onStateMutated();
      hooks.showToast(`${HERO_MAP[hid].name} 已派驻至 ${slotIndex + 1} 号位！`);
    });
  });

  if (!modal.open) modal.showModal();
}

export function openGachaRevealModal(pullRes, hooks) {
  const modal = document.getElementById('gacha-modal');
  const content = document.getElementById('gacha-modal-content');
  const { items, bonusTreasure } = pullRes;

  content.innerHTML = `
    <div class="modal-header">
      <h2 id="gacha-modal-title">✨ 璀璨宝箱开启！</h2>
      <form method="dialog"><button type="submit" class="modal-close-btn" aria-label="关闭">✕</button></form>
    </div>
    <div style="display:grid;grid-template-columns:repeat(${items.length === 1 ? 1 : 3},1fr);gap:8px;justify-items:center;margin-bottom:10px">
      ${items
        .map((it) => {
          const rar = RARITY_META[it.hero.rarity];
          const accent = ELEMENT_META[it.hero.element]?.color || '#d99830';
          return `
            <div class="unit-card ${it.hero.rarity}" style="width:100%;max-width:155px" data-gacha-inspect="${it.hero.id}">
              <span class="rarity-ribbon" style="background:${rar.badgeBg}">${rar.label}</span>
              <span class="elem-badge">${ELEMENT_SVG_MARKUP[it.hero.element]}</span>
              ${renderSphereAvatar(it.hero.portrait, it.hero.name, 68, accent)}
              <div class="unit-card-name">${it.hero.name}</div>
              <div class="unit-card-meta">${it.hero.genre}</div>
              <div style="margin-top:3px;font-size:10px;font-weight:900;color:${it.isNew ? '#c92e1d' : '#1b7a52'}">
                ${it.isNew ? '✨ 新勇者入列!' : it.autoStarUp ? '🌟 自动升星突破!' : `碎片 +${it.shardsGained}`}
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
    ${
      bonusTreasure?.granted
        ? `
        <div class="parchment-strip" style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <img src="${assetUrl(bonusTreasure.granted.icon)}" alt="" style="width:38px;height:38px;object-fit:contain" />
            <div>
              <div>🎁 随箱附赠宝物：<strong>${bonusTreasure.granted.name}</strong> ${bonusTreasure.duplicateCoins ? `(重复折算 +${bonusTreasure.duplicateCoins}金币)` : ''}</div>
              ${
                bonusTreasure.synthesized.length > 0
                  ? `<div style="color:#b83214">🔥 自动触发二合一神话合成：<strong>${bonusTreasure.synthesized.map((m) => m.name).join('、')}</strong>！</div>`
                  : `<div style="font-size:10.5px;color:#6e4427">${bonusTreasure.granted.desc}</div>`
              }
            </div>
          </div>
        </div>
      `
        : ''
    }
    <form method="dialog">
      <button type="submit" class="yz-primary-btn emerald" style="width:100%" autofocus>收下战利品</button>
    </form>
  `;

  content.querySelectorAll('[data-gacha-inspect]').forEach((el) => {
    el.addEventListener('click', () => {
      modal.close();
      openHeroModal(el.dataset.gachaInspect, hooks);
    });
  });

  if (!modal.open) modal.showModal();
}
