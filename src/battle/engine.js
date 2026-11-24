// 《弹珠勇者 · 弹夹撞击闯关录》拉弓弹射物理核心引擎（支持浏览器实时渲染与 Node 无头 AI 压测）

import { BATTLE_PROPS } from '../assets.js';
import { SFX, vibrate } from '../audio.js';
import { ELEMENT_META } from '../data/roster.js';
import { getHeroStats, getSquadSummary } from '../state.js';
import { LOGICAL_H, LOGICAL_W, WALL_PAD, renderBattleScene } from './renderer.js';

export class PinballBattleEngine {
  constructor(canvas, stage, squadIds, callbacks = {}, options = {}) {
    this.canvas = canvas;
    this.headless = !!options.headless || !canvas;
    this.ctx = this.headless ? null : canvas.getContext('2d');
    this.stage = stage;
    this.callbacks = callbacks;
    this.stateRef = options.stateObj;
    this.rng = options.rng || Math.random;
    this.reducedMotion =
      !this.headless && typeof window !== 'undefined'
        ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
        : true;

    this.rafId = 0;
    this.lastTs = 0;
    this.nowTime = 0;
    this.destroyed = false;
    this.externallyPaused = false;

    this.waveIndex = 0;
    this.turnIndex = 0;
    this.turnCount = 1;
    this.hp = 10000;
    this.maxHp = 10000;
    this.summary = null;

    this.phase = 'aiming';
    this.phaseTimer = 0;
    this.strikeArmed = false;
    this.activeStrikeHero = null;
    this.turnAtkBuff = false;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.bonusCoins = 0;
    this.speed2x = false;
    this.autoPlay = !!options.autoPlay;
    this.autoDelay = 0.25;
    this.paused = false;

    this.marbles = [];
    this.enemies = [];
    this.bumpers = [];
    this.pickups = [];
    this.projectiles = [];
    this.beams = [];
    this.bitmapPopups = [];
    this.texts = [];
    this.particles = [];
    this.nextUid = 1;
    this.battleResult = null;

    this.hitstopTimer = 0;
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.cutinTitle = '';
    this.cutinSub = '';
    this.cutinPortrait = '';

    this.dragging = false;
    this.pointerId = -1;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragCurX = 0;
    this.dragCurY = 0;

    this.initSquad(squadIds);
    this.spawnWave(0, true);

    if (!this.headless) {
      this.bindEvents();
      this.resize();
      this.emitHud();
      this.lastTs = performance.now();
      this.loop(this.lastTs);
    }
  }

  initSquad(squadIds) {
    const summary = getSquadSummary(squadIds, this.stateRef);
    this.summary = summary;
    this.maxHp = summary.totalHp;
    this.hp = summary.totalHp;
    const atkMult = 1 + summary.totalAtkPct / 100;

    const startPositions = [
      { x: LOGICAL_W * 0.23, y: LOGICAL_H * 0.8 },
      { x: LOGICAL_W * 0.41, y: LOGICAL_H * 0.83 },
      { x: LOGICAL_W * 0.59, y: LOGICAL_H * 0.83 },
      { x: LOGICAL_W * 0.77, y: LOGICAL_H * 0.8 },
    ];

    this.marbles = squadIds.map((id, idx) => {
      const st = getHeroStats(id, this.stateRef);
      return {
        index: idx,
        def: st.def,
        atk: Math.round(st.atk * atkMult),
        x: startPositions[idx].x,
        y: startPositions[idx].y,
        vx: 0,
        vy: 0,
        r: 22.5,
        cd: Math.max(1, st.def.strikeCd - 4 - summary.cdReduce),
        maxCd: st.def.strikeCd,
        activeMoving: false,
        tempPierce: false,
        dmgMult: 1,
        weakMult: 1,
        comboTriggeredThisTurn: false,
        squash: 0,
        squashAngle: 0,
        hitTimer: 0,
        hitCooldowns: new Map(),
        trail: [],
      };
    });
  }

  spawnWave(idx, initial = false) {
    this.waveIndex = idx;
    const wave = this.stage.waves[idx];
    this.enemies = [];
    this.bumpers = [];

    if (wave.bumpers) {
      for (const b of wave.bumpers) {
        this.bumpers.push({
          x: WALL_PAD + b.xPct * (LOGICAL_W - WALL_PAD * 2),
          y: WALL_PAD + b.yPct * (LOGICAL_H - WALL_PAD * 2),
          r: b.radius,
          sprite: b.sprite,
          label: b.label,
          squash: 0,
        });
      }
    }

    let hasBoss = false;
    for (const e of wave.enemies) {
      const weakAngles = [];
      if (e.isBoss) {
        hasBoss = true;
        const count = e.weakPoints || 1;
        for (let i = 0; i < count; i++) {
          weakAngles.push(Math.PI * 0.5 + (i * Math.PI * 2) / count);
        }
      }
      const effCd = e.isBoss ? Math.min(2, e.cd) : e.cd;
      this.enemies.push({
        uid: this.nextUid++,
        name: e.name,
        portrait: e.portrait,
        hitPortrait: e.hitPortrait,
        isBoss: !!e.isBoss,
        element: e.element,
        x: WALL_PAD + e.xPct * (LOGICAL_W - WALL_PAD * 2),
        y: WALL_PAD + e.yPct * (LOGICAL_H - WALL_PAD * 2),
        r: e.radius,
        hp: e.hp,
        maxHp: e.hp,
        atk: e.atk,
        cd: effCd,
        maxCd: effCd,
        skillLabel: e.skillLabel || '',
        weakAngles,
        markedForMeteor: false,
        chilled: false,
        hitFlash: 0,
        hitTimer: 0,
        squash: 0,
      });
    }

    if (this.pickups.length < 2) {
      this.spawnRandomPickup(initial ? 'battery' : 'meat');
    }

    if (hasBoss && !this.headless) {
      const boss = this.enemies.find((e) => e.isBoss);
      SFX.play('bossWarn', 0.65, 120);
      this.cutinPortrait = boss.portrait;
      this.cutinTitle = `首领来袭 · ${boss.name}`;
      this.cutinSub = this.stage.bossQuote;
      this.phase = 'cutin';
      this.phaseTimer = 1.15;
    } else {
      this.phase = 'aiming';
      this.autoDelay = this.headless ? 0 : 0.42;
    }
    this.emitHud();
  }

  spawnRandomPickup(preferred) {
    if (this.pickups.length >= 4) return;
    const kinds = ['meat', 'battery', 'warhorn'];
    const kind = preferred || kinds[Math.floor(this.rng() * kinds.length)];
    for (let attempt = 0; attempt < 16; attempt++) {
      const x = WALL_PAD + 38 + this.rng() * (LOGICAL_W - WALL_PAD * 2 - 76);
      const y = WALL_PAD + 85 + this.rng() * (LOGICAL_H - WALL_PAD * 2 - 160);
      const clearE = this.enemies.every((e) => Math.hypot(e.x - x, e.y - y) > e.r + 28);
      const clearB = this.bumpers.every((b) => Math.hypot(b.x - x, b.y - y) > b.r + 28);
      const clearM = this.marbles.every((m) => Math.hypot(m.x - x, m.y - y) > m.r + 26);
      if (clearE && clearB && clearM) {
        this.pickups.push({
          uid: this.nextUid++,
          kind,
          tier: 1,
          x,
          y,
          r: 18,
          bobPhase: this.rng() * Math.PI * 2,
        });
        return;
      }
    }
  }

  resize() {
    if (this.headless || !this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(LOGICAL_W * dpr);
    this.canvas.height = Math.round(LOGICAL_H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  toggleSpeed() {
    this.speed2x = !this.speed2x;
    this.emitHud();
    return this.speed2x;
  }

  toggleAuto() {
    this.autoPlay = !this.autoPlay;
    this.autoDelay = 0.22;
    this.emitHud();
    return this.autoPlay;
  }

  setPaused(p) {
    this.paused = p;
    this.emitHud();
  }

  setExternalPause(p) {
    this.externallyPaused = p;
    if (!p && !this.destroyed && !this.rafId && !this.headless) {
      this.lastTs = performance.now();
      this.loop(this.lastTs);
    }
  }

  toggleStrikeForCurrent() {
    if (this.phase !== 'aiming') return false;
    const cur = this.marbles[this.turnIndex];
    if (!cur || cur.cd > 0) return false;
    this.strikeArmed = !this.strikeArmed;
    if (!this.headless) {
      if (this.strikeArmed) {
        SFX.play('strikeReady', 0.65, 60);
        vibrate(20);
      } else {
        SFX.click();
      }
    }
    this.emitHud();
    return this.strikeArmed;
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (!this.headless) this.unbindEvents();
  }

  onPointerDown = (e) => {
    if (this.paused || this.phase !== 'aiming' || this.autoPlay) return;
    SFX.unlock();
    const pt = this.toLogical(e);
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.dragStartX = pt.x;
    this.dragStartY = pt.y;
    this.dragCurX = pt.x;
    this.dragCurY = pt.y;
    try { this.canvas.setPointerCapture(e.pointerId); } catch {}
  };

  onPointerMove = (e) => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    const pt = this.toLogical(e);
    this.dragCurX = pt.x;
    this.dragCurY = pt.y;
  };

  onPointerUp = (e) => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    this.dragging = false;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch {}
    if (this.phase !== 'aiming') return;
    const dx = this.dragStartX - this.dragCurX;
    const dy = this.dragStartY - this.dragCurY;
    const pull = Math.hypot(dx, dy);
    if (pull < 14) return;
    const angle = Math.atan2(dy, dx);
    const power = Math.min(1, Math.max(0.55, pull / 95));
    this.launchCurrentMarble(angle, power);
  };

  bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
  }

  unbindEvents() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
  }

  toLogical(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * LOGICAL_W,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * LOGICAL_H,
    };
  }

  runAutoAim() {
    const cur = this.marbles[this.turnIndex];
    if (!cur) return;
    if (cur.cd <= 0 && !this.strikeArmed) {
      this.strikeArmed = true;
      if (!this.headless) SFX.play('strikeReady', 0.55, 100);
    }

    let bestAngle = -Math.PI * 0.42;
    let bestScore = -1;
    const boss = this.enemies.find((e) => e.isBoss);
    const candidates = [];

    for (const e of this.enemies) {
      candidates.push(Math.atan2(e.y - cur.y, e.x - cur.x));
      if (e.isBoss && e.weakAngles.length > 0) {
        for (const wa of e.weakAngles) {
          const wx = e.x + Math.cos(wa) * (e.r * 0.78);
          const wy = e.y + Math.sin(wa) * (e.r * 0.78);
          candidates.push(Math.atan2(wy - cur.y, wx - cur.x));
        }
      }
    }
    for (const m of this.marbles) {
      if (m.index !== cur.index) candidates.push(Math.atan2(m.y - cur.y, m.x - cur.x));
    }
    if (this.hp < this.maxHp * 0.65) {
      for (const p of this.pickups) {
        if (p.kind === 'meat') candidates.push(Math.atan2(p.y - cur.y, p.x - cur.x));
      }
    }
    for (let i = 0; i < 16; i++) candidates.push((i / 16) * Math.PI * 2);

    for (const ang of candidates) {
      const ux = Math.cos(ang);
      const uy = Math.sin(ang);
      let score = 0;
      for (const m of this.marbles) {
        if (m.index === cur.index) continue;
        const proj = (m.x - cur.x) * ux + (m.y - cur.y) * uy;
        if (proj > 0 && proj < 420) {
          const perp = Math.abs((m.x - cur.x) * uy - (m.y - cur.y) * ux);
          if (perp < m.r + cur.r + 8) score += 48;
        }
      }
      for (const e of this.enemies) {
        const proj = (e.x - cur.x) * ux + (e.y - cur.y) * uy;
        if (proj > 0 && proj < 500) {
          const perp = Math.abs((e.x - cur.x) * uy - (e.y - cur.y) * ux);
          if (perp < e.r + cur.r) score += e.isBoss ? 58 : 32;
        }
      }
      if (this.hp < this.maxHp * 0.65) {
        for (const p of this.pickups) {
          const proj = (p.x - cur.x) * ux + (p.y - cur.y) * uy;
          if (proj > 0 && proj < 420) {
            const perp = Math.abs((p.x - cur.x) * uy - (p.y - cur.y) * ux);
            if (perp < p.r + cur.r) score += p.kind === 'meat' ? 40 : 22;
          }
        }
      }
      if (boss && Math.abs(ux) > 0.18 && Math.abs(uy) > 0.18) score += 12;
      score += this.rng() * 6;
      if (score > bestScore) {
        bestScore = score;
        bestAngle = ang;
      }
    }

    this.launchCurrentMarble(bestAngle, 0.96);
  }

  launchCurrentMarble(angle, power) {
    const cur = this.marbles[this.turnIndex];
    if (!cur) return;

    this.comboCount = 0;
    this.turnAtkBuff = false;
    for (const m of this.marbles) {
      m.comboTriggeredThisTurn = false;
      m.activeMoving = false;
      m.tempPierce = false;
      m.dmgMult = 1;
      m.weakMult = 1;
      m.hitCooldowns.clear();
      m.trail = [];
    }
    for (const e of this.enemies) e.markedForMeteor = false;

    let speedMult = 1.0;
    this.activeStrikeHero = null;

    if (this.strikeArmed && cur.cd <= 0) {
      this.activeStrikeHero = cur.def;
      cur.cd = cur.maxCd;
      this.strikeArmed = false;

      switch (cur.def.strikeType) {
        case 'speed_storm':
          speedMult = 1.46;
          cur.dmgMult = 2.08;
          break;
        case 'meteor_judgement':
          speedMult = 1.28;
          cur.dmgMult = 1.68;
          break;
        case 'all_command':
          speedMult = 1.32;
          cur.dmgMult = 1.78;
          break;
        case 'weakness_pierce':
          speedMult = 1.35;
          cur.tempPierce = true;
          cur.dmgMult = 2.15;
          cur.weakMult = 1.55;
          this.projectiles.push({
            kind: 'wave_slash',
            sprite: cur.def.strikeProjectile,
            color: ELEMENT_META[cur.def.element].color,
            x: cur.x,
            y: cur.y,
            vx: Math.cos(angle) * 560,
            vy: Math.sin(angle) * 560,
            dmg: Math.round(cur.atk * 2.85),
            element: cur.def.element,
            life: 0,
            maxLife: 1.2,
            pierce: true,
            hitSet: new Set(),
          });
          break;
        case 'blessing_sanctuary':
          speedMult = 1.28;
          cur.dmgMult = 1.82;
          this.healSquad(Math.round(this.maxHp * 0.32), cur.x, cur.y, '圣光回春');
          this.spawnRandomPickup('meat');
          this.spawnRandomPickup('warhorn');
          break;
      }

      if (!this.headless) {
        this.cutinPortrait = cur.def.portrait;
        this.cutinTitle = `终极必杀 · ${cur.def.strikeName}`;
        this.cutinSub = cur.def.quote;
      }
    }

    const launchSpeed = cur.def.speed * (0.78 + 0.32 * power) * speedMult;
    cur.vx = Math.cos(angle) * launchSpeed;
    cur.vy = Math.sin(angle) * launchSpeed;
    cur.activeMoving = true;
    cur.squash = 0.32;
    cur.squashAngle = angle;

    if (!this.headless) {
      SFX.play('launchShot', 0.62, 40);
      vibrate(16);
    }

    if (this.activeStrikeHero && !this.headless) {
      this.phase = 'cutin';
      this.phaseTimer = 0.88;
    } else {
      this.phase = 'moving';
    }
    this.emitHud();
  }

  loop = (ts) => {
    if (this.destroyed || this.externallyPaused) {
      this.rafId = 0;
      return;
    }
    const rawDt = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000));
    this.lastTs = ts;
    this.nowTime += rawDt;

    if (!this.paused) {
      const scaledDt = rawDt * (this.speed2x ? 1.85 : 1.0);
      this.update(scaledDt);
    }
    if (this.ctx) renderBattleScene(this.ctx, this);

    this.rafId = requestAnimationFrame(this.loop);
  };

  update(dt) {
    if (this.hitstopTimer > 0 && !this.headless) {
      this.hitstopTimer -= dt;
      this.updateVisualFx(dt * 0.35);
      return;
    }

    if (!this.headless) this.updateVisualFx(dt);

    if (this.phase === 'cutin') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        const anyMoving = this.marbles.some((m) => m.activeMoving);
        this.phase = anyMoving ? 'moving' : 'aiming';
        this.emitHud();
      }
      return;
    }

    if (this.phase === 'aiming') {
      if (this.autoPlay) {
        this.autoDelay -= dt;
        if (this.autoDelay <= 0) this.runAutoAim();
      }
      return;
    }

    if (this.phase === 'moving') {
      const substeps = 8;
      const subDt = dt / substeps;
      for (let s = 0; s < substeps; s++) this.stepMarblesPhysics(subDt);
      this.updateProjectiles(dt);

      const anyBallMoving = this.marbles.some((m) => m.activeMoving);
      if (!anyBallMoving && this.projectiles.length === 0) {
        this.onPlayerShotSettled();
      }
      return;
    }

    if (this.phase === 'wave_clear') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        if (this.waveIndex + 1 < this.stage.waves.length) {
          this.spawnWave(this.waveIndex + 1);
        } else {
          this.finishBattle(true);
        }
      }
      return;
    }

    if (this.phase === 'enemy_turn') {
      this.updateProjectiles(dt);
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0 && this.projectiles.length === 0) {
        if (this.hp <= 0) this.finishBattle(false);
        else this.advanceNextTurn();
      }
    }
  }

  stepMarblesPhysics(dt) {
    const minX = WALL_PAD;
    const maxX = LOGICAL_W - WALL_PAD;
    const minY = WALL_PAD;
    const maxY = LOGICAL_H - WALL_PAD;

    for (const m of this.marbles) {
      if (!m.activeMoving) continue;

      for (const [uid, cd] of m.hitCooldowns) {
        const next = cd - dt;
        if (next <= 0) m.hitCooldowns.delete(uid);
        else m.hitCooldowns.set(uid, next);
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (!this.headless && this.rng() < 0.45) {
        m.trail.push({ x: m.x, y: m.y, alpha: 0.55, color: ELEMENT_META[m.def.element].glow });
        if (m.trail.length > 14) m.trail.shift();
      }

      // 1. 四壁弹性反射
      let bouncedWall = false;
      if (m.x - m.r < minX) { m.x = minX + m.r; m.vx = Math.abs(m.vx) * 0.96; bouncedWall = true; }
      else if (m.x + m.r > maxX) { m.x = maxX - m.r; m.vx = -Math.abs(m.vx) * 0.96; bouncedWall = true; }
      if (m.y - m.r < minY) { m.y = minY + m.r; m.vy = Math.abs(m.vy) * 0.96; bouncedWall = true; }
      else if (m.y + m.r > maxY) { m.y = maxY - m.r; m.vy = -Math.abs(m.vy) * 0.96; bouncedWall = true; }

      if (bouncedWall && !this.headless) {
        m.squash = 0.24;
        m.squashAngle = Math.atan2(m.vy, m.vx);
        SFX.play('hitNormal', 0.35, 70);
        this.spawnSparks(m.x, m.y, '#ffe49e', 4);
      }

      // 2. 木桩 / 机关宝箱 / 圣盾碰柱反弹
      for (const b of this.bumpers) {
        const dx = m.x - b.x;
        const dy = m.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m.r + b.r;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          m.x = b.x + nx * (minDist + 0.5);
          m.y = b.y + ny * (minDist + 0.5);
          const speed = Math.min(1080, Math.hypot(m.vx, m.vy) * 1.08 + 55);
          m.vx = nx * speed;
          m.vy = ny * speed;
          b.squash = 0.35;
          m.squash = 0.28;
          m.squashAngle = Math.atan2(ny, nx);
          if (!this.headless) SFX.play('hitBumper', 0.55, 80);

          const bKey = -1000 - this.bumpers.indexOf(b);
          if (!m.hitCooldowns.has(bKey)) {
            m.hitCooldowns.set(bKey, 0.22);
            this.bonusCoins += 8;
            this.addText('+8金币', b.x, b.y - b.r, '#ffe26a', 0.95);
            const alive = this.enemies.filter((e) => e.hp > 0);
            if (alive.length > 0) {
              const target = alive[Math.floor(this.rng() * alive.length)];
              const bMult = 1 + (this.summary.bumperBonusPct || 0) / 100;
              const zapDmg = Math.round(m.atk * 0.88 * bMult);
              this.damageEnemy(target, zapDmg, 'gold', false, target.x, target.y, 'FS_');
              if (!this.headless) {
                this.beams.push({
                  kind: 'lightning',
                  x: b.x,
                  y: b.y,
                  tx: target.x,
                  ty: target.y,
                  points: this.makeJaggedLine(b.x, b.y, target.x, target.y, 5),
                  color: '#ffd95a',
                  life: 0,
                  maxLife: 0.24,
                });
              }
            }
          }
        }
      }

      // 3. 场地补给拾取（3阶成长鸡腿拼盘 / 充能电池 / 无尽战意）
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        if (Math.hypot(m.x - p.x, m.y - p.y) < m.r + p.r) {
          this.consumePickup(p, m);
          this.pickups.splice(i, 1);
        }
      }

      // 4. 撞击队友触发「弹夹连携友情技」与「号令全军冲锋」
      for (const ally of this.marbles) {
        if (ally.index === m.index) continue;
        const dx = ally.x - m.x;
        const dy = ally.y - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist < m.r + ally.r) {
          if (!ally.activeMoving && dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;
            ally.x = Math.min(maxX - ally.r, Math.max(minX + ally.r, ally.x + nx * 2.2));
            ally.y = Math.min(maxY - ally.r, Math.max(minY + ally.r, ally.y + ny * 2.2));
            ally.squash = 0.25;
            ally.squashAngle = Math.atan2(ny, nx);
          }

          if (!ally.comboTriggeredThisTurn) {
            ally.comboTriggeredThisTurn = true;
            this.triggerFriendshipCombo(ally);
          }

          if (
            this.activeStrikeHero?.strikeType === 'all_command' &&
            m.def.id === this.activeStrikeHero.id &&
            !ally.activeMoving
          ) {
            const ang = dist > 0.001 ? Math.atan2(dy, dx) : Math.atan2(m.vy, m.vx);
            const cmdSpd = ally.def.speed * 1.18;
            ally.vx = Math.cos(ang) * cmdSpd;
            ally.vy = Math.sin(ang) * cmdSpd;
            ally.activeMoving = true;
            ally.dmgMult = 1.55;
            this.addText('号令突击!', ally.x, ally.y - 26, '#fff099', 1.12);
            this.spawnSparks(ally.x, ally.y, '#ffd86b', 10);
          }
        }
      }

      // 5. 碰撞魔物与首领（反射 vs 贯通 + BOSS 弱点暴击 + _st 挨揍颜艺）
      const isPierce = m.tempPierce || m.def.moveType === 'pierce';
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const dx = m.x - e.x;
        const dy = m.y - e.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m.r + e.r;

        if (dist < minDist) {
          const canDamage = !m.hitCooldowns.has(e.uid);
          if (canDamage) {
            m.hitCooldowns.set(e.uid, isPierce ? 0.21 : 0.098);
            let hitWeak = false;
            if (e.isBoss && e.weakAngles.length > 0) {
              for (let wi = 0; wi < e.weakAngles.length; wi++) {
                const wa = e.weakAngles[wi];
                const wx = e.x + Math.cos(wa) * (e.r * 0.8);
                const wy = e.y + Math.sin(wa) * (e.r * 0.8);
                if (Math.hypot(m.x - wx, m.y - wy) < m.r + 17) {
                  hitWeak = true;
                  e.weakAngles[wi] += Math.PI * 0.65;
                  break;
                }
              }
            }

            const buffMult = this.turnAtkBuff ? 1.32 : 1.0;
            const critExtra = 1 + (this.summary.critBonusPct || 0) / 100;
            const weakFactor = hitWeak ? 2.85 * m.weakMult * critExtra : 1.0;
            const rawDmg = Math.round(m.atk * 0.72 * m.dmgMult * buffMult * weakFactor * (0.94 + this.rng() * 0.12));
            this.damageEnemy(e, rawDmg, m.def.element, hitWeak, m.x, m.y, hitWeak ? 'BJ_' : 'PT_');

            if (this.activeStrikeHero?.strikeType === 'meteor_judgement' && m.def.id === this.activeStrikeHero.id) {
              e.markedForMeteor = true;
            }
          }

          if (!isPierce && dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;
            m.x = e.x + nx * (minDist + 0.5);
            m.y = e.y + ny * (minDist + 0.5);
            const dot = m.vx * nx + m.vy * ny;
            if (dot < 0) {
              m.vx = (m.vx - 2 * dot * nx) * 0.965;
              m.vy = (m.vy - 2 * dot * ny) * 0.965;
              m.squash = 0.28;
              m.squashAngle = Math.atan2(ny, nx);
            }
          } else if (isPierce && canDamage) {
            m.vx *= 0.91;
            m.vy *= 0.91;
          }
        }
      }

      // 6. 阻尼停球
      const damping = Math.exp(-1.16 * dt);
      m.vx *= damping;
      m.vy *= damping;
      if (Math.hypot(m.vx, m.vy) < 28) {
        m.vx = 0;
        m.vy = 0;
        m.activeMoving = false;
        m.trail = [];
      }
    }
  }

  consumePickup(p, m) {
    if (p.kind === 'meat') {
      const staffBonus = this.summary.hasDrumstickStaff ? 1.2 : 1.0;
      const pct = (p.tier === 1 ? 0.1 : p.tier === 2 ? 0.18 : 0.28) * staffBonus;
      const label = p.tier === 1 ? '烤鸡腿' : p.tier === 2 ? '魔法鸡腿' : '牛肉拼盘';
      this.healSquad(Math.round(this.maxHp * pct), p.x, p.y, label);
      if (!this.headless) SFX.play('pickupHeal', 0.6, 60);
    } else if (p.kind === 'battery') {
      m.vx *= 1.24;
      m.vy *= 1.24;
      for (const ally of this.marbles) {
        if (ally.cd > 0) ally.cd = Math.max(0, ally.cd - 1);
      }
      this.addText('充能加速 · 必杀-1回合!', p.x, p.y - 12, '#6fe4ff', 1.05);
      this.spawnSparks(p.x, p.y, '#6fe4ff', 10);
      if (!this.headless) SFX.play('statUp', 0.6, 60);
    } else {
      this.turnAtkBuff = true;
      this.bonusCoins += 25;
      this.addText('无尽战意 · 伤害UP!', p.x, p.y - 12, '#ffe066', 1.05);
      this.spawnSparks(p.x, p.y, '#ffe066', 10);
      if (!this.headless) SFX.play('coinGain', 0.6, 60);
    }
    this.emitHud();
  }

  healSquad(amount, x, y, prefix = '生命恢复') {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.addBitmapPopup('HX_', `+${Math.max(1, amount)}`, x, y - 6, false, 0.95);
    this.addText(prefix, x, y - 24, '#6af29a', 0.95);
    this.spawnSparks(x, y, '#6af29a', 8);
    this.emitHud();
  }

  triggerFriendshipCombo(ally) {
    if (!this.headless) SFX.play('comboTrigger', 0.58, 65);
    this.comboCount += 1;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    const elemColor = ELEMENT_META[ally.def.element].color;
    this.addText(`弹夹! ${ally.def.comboName}`, ally.x, ally.y - 30, '#fff1a8', 1.06);
    this.spawnSparks(ally.x, ally.y, elemColor, 9);

    // 纯正吸血流羁绊：触发友情技直接吸取回复全队生命！
    if (this.summary.lifestealPct > 0) {
      const vampHeal = Math.round((this.maxHp * this.summary.lifestealPct) / 100);
      this.hp = Math.min(this.maxHp, this.hp + vampHeal);
      if (!this.headless) SFX.play('hitVamp', 0.45, 140);
    }

    const alive = this.enemies.filter((e) => e.hp > 0);
    const buffMult = this.turnAtkBuff ? 1.32 : 1.0;

    // 冰毒减速流羁绊：概率推迟1名敌人行动回合！
    if (this.summary.chillChance > 0 && alive.length > 0 && this.rng() < this.summary.chillChance) {
      const chillTarget = alive[Math.floor(this.rng() * alive.length)];
      if (!chillTarget.chilled) {
        chillTarget.chilled = true;
        chillTarget.cd += 1;
        this.addText('冰封减速+1CD', chillTarget.x, chillTarget.y - chillTarget.r - 10, '#7bd4ff', 0.94);
        if (!this.headless) SFX.play('hitIce', 0.5, 120);
      }
    }

    switch (ally.def.comboType) {
      case 'homing':
        for (let i = 0; i < 5; i++) {
          const target = alive.length > 0 ? alive[i % alive.length] : undefined;
          const ang = (i / 5) * Math.PI * 2;
          this.projectiles.push({
            kind: 'homing',
            sprite: ally.def.comboBullet,
            color: elemColor,
            x: ally.x,
            y: ally.y,
            vx: Math.cos(ang) * 240,
            vy: Math.sin(ang) * 240,
            targetUid: target?.uid,
            dmg: Math.round(ally.atk * 0.46 * buffMult),
            element: ally.def.element,
            life: 0,
            maxLife: 1.5,
          });
        }
        break;

      case 'cross_laser': {
        if (!this.headless) {
          this.beams.push({ kind: 'cross', x: ally.x, y: ally.y, color: elemColor, life: 0, maxLife: 0.42 });
        }
        const laserDmg = Math.round(ally.atk * 1.48 * buffMult);
        for (const e of alive) {
          if (Math.abs(e.y - ally.y) < e.r + 16 || Math.abs(e.x - ally.x) < e.r + 16) {
            const hitWeak = e.isBoss && e.weakAngles.some((wa) => {
              const wx = e.x + Math.cos(wa) * (e.r * 0.8);
              const wy = e.y + Math.sin(wa) * (e.r * 0.8);
              return Math.abs(wy - ally.y) < 20 || Math.abs(wx - ally.x) < 20;
            });
            this.damageEnemy(e, hitWeak ? Math.round(laserDmg * 1.8) : laserDmg, ally.def.element, hitWeak, e.x, e.y, 'JN_');
          }
        }
        break;
      }

      case 'aura_blast': {
        const blastR = 154;
        if (!this.headless) {
          this.beams.push({ kind: 'aura', x: ally.x, y: ally.y, radius: blastR, color: elemColor, life: 0, maxLife: 0.45 });
        }
        this.healSquad(Math.round(this.maxHp * 0.065), ally.x, ally.y, '炉石回血');
        const auraDmg = Math.round(ally.atk * 1.36 * buffMult);
        for (const e of alive) {
          if (Math.hypot(e.x - ally.x, e.y - ally.y) <= blastR + e.r) {
            this.damageEnemy(e, auraDmg, ally.def.element, false, e.x, e.y, 'JN_');
          }
        }
        break;
      }

      case 'barrage':
        for (let i = 0; i < 6; i++) {
          const target = alive.length > 0 ? alive[Math.floor(this.rng() * alive.length)] : null;
          const tx = target ? target.x + (this.rng() - 0.5) * 34 : LOGICAL_W * (0.2 + this.rng() * 0.6);
          const ty = target ? target.y + (this.rng() - 0.5) * 34 : LOGICAL_H * 0.28;
          const dur = 0.34 + i * 0.045;
          this.projectiles.push({
            kind: 'barrage',
            sprite: ally.def.comboBullet,
            color: elemColor,
            x: ally.x,
            y: ally.y,
            vx: (tx - ally.x) / dur,
            vy: (ty - ally.y) / dur,
            dmg: Math.round(ally.atk * 0.5 * buffMult),
            element: ally.def.element,
            life: 0,
            maxLife: dur,
          });
        }
        break;

      case 'chain_bolt': {
        if (alive.length === 0) break;
        const sorted = [...alive].sort((a, b) => Math.hypot(a.x - ally.x, a.y - ally.y) - Math.hypot(b.x - ally.x, b.y - ally.y));
        let px = ally.x;
        let py = ally.y;
        const boltDmg = Math.round(ally.atk * 1.18 * buffMult);
        for (const target of sorted.slice(0, 4)) {
          if (!this.headless) {
            this.beams.push({
              kind: 'lightning',
              x: px,
              y: py,
              tx: target.x,
              ty: target.y,
              points: this.makeJaggedLine(px, py, target.x, target.y, 5),
              color: elemColor,
              life: 0,
              maxLife: 0.34,
            });
          }
          this.damageEnemy(target, boltDmg, ally.def.element, false, target.x, target.y, 'JN_');
          px = target.x;
          py = target.y;
        }
        break;
      }
    }
    this.emitHud();
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;

      if (p.kind === 'homing') {
        let target = this.enemies.find((e) => e.uid === p.targetUid && e.hp > 0);
        if (!target) {
          target = this.enemies.find((e) => e.hp > 0);
          p.targetUid = target?.uid;
        }
        if (target) {
          const desired = Math.atan2(target.y - p.y, target.x - p.x);
          const curSpd = Math.min(620, 320 + p.life * 380);
          p.vx = p.vx * 0.84 + Math.cos(desired) * curSpd * 0.8;
          p.vy = p.vy * 0.84 + Math.sin(desired) * curSpd * 0.8;
          const norm = Math.hypot(p.vx, p.vy) || 1;
          p.vx = (p.vx / norm) * curSpd;
          p.vy = (p.vy / norm) * curSpd;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        let hit = false;
        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 12) {
            this.damageEnemy(e, p.dmg, p.element, false, p.x, p.y, 'JN_');
            hit = true;
            break;
          }
        }
        if (hit || p.life >= p.maxLife || this.enemies.every((e) => e.hp <= 0)) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.kind === 'barrage') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life >= p.maxLife) {
          if (!this.headless) {
            this.beams.push({ kind: 'explosion', x: p.x, y: p.y, radius: 52, color: p.color, life: 0, maxLife: 0.28 });
          }
          for (const e of this.enemies) {
            if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) <= e.r + 52) {
              this.damageEnemy(e, p.dmg, p.element, false, p.x, p.y, 'JN_');
            }
          }
          this.projectiles.splice(i, 1);
        }
      } else if (p.kind === 'wave_slash') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        for (const e of this.enemies) {
          if (e.hp > 0 && !p.hitSet.has(e.uid) && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 32) {
            p.hitSet.add(e.uid);
            this.damageEnemy(e, p.dmg, p.element, e.isBoss, e.x, e.y, 'DZ_');
          }
        }
        if (p.life >= p.maxLife || p.x < -40 || p.x > LOGICAL_W + 40 || p.y < -40 || p.y > LOGICAL_H + 40) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.kind === 'enemy_shot') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life >= p.maxLife) {
          this.hp = Math.max(0, this.hp - p.dmg);
          if (p.targetMarble) {
            // 我方勇者弹珠被敌弹命中时同样触发 _st 挨揍颜艺帧！
            p.targetMarble.hitTimer = 0.42;
            p.targetMarble.squash = 0.26;
          }
          this.shake(0.22, 5.5);
          this.addBitmapPopup('BJ_', `${p.dmg}`, p.x, p.y - 12, false, 0.96);
          this.spawnSparks(p.x, p.y, '#ff6b5e', 10);
          if (!this.headless) {
            SFX.play('hitCritAxe', 0.55, 80);
            vibrate(25);
          }
          this.projectiles.splice(i, 1);
          this.emitHud();
        }
      }
    }
  }

  damageEnemy(e, baseDmg, atkElem, isWeakCrit, hx, hy, digitPrefix = 'PT_') {
    if (e.hp <= 0) return;

    let elemMult = 1.0;
    if (ELEMENT_META[atkElem].beats === e.element) elemMult = 1.35;
    else if (ELEMENT_META[e.element].beats === atkElem && atkElem !== 'gold' && atkElem !== 'star') elemMult = 0.82;

    const dmg = Math.max(1, Math.round(baseDmg * elemMult));
    e.hp = Math.max(0, e.hp - dmg);
    e.hitFlash = 1.0;
    e.hitTimer = 0.36; // 保持 360ms 原版 _st 挨揍颜艺差分立绘！
    e.squash = isWeakCrit ? 0.36 : 0.22;

    this.comboCount += 1;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);

    if (isWeakCrit) {
      if (!this.headless) {
        SFX.play('hitCritAxe', 0.65, 55);
        vibrate(22);
      }
      this.hitstopTimer = 0.028;
      this.shake(0.22, 6);
      this.addBitmapPopup('BJ_', `${dmg}`, hx, hy - 14, true, 1.15);
      this.addText('弱点暴击!', hx, hy - 34, '#ffe359', 1.12);
      this.spawnSparks(hx, hy, '#ffe359', 14);
    } else {
      if (!this.headless) SFX.play('hitNormal', 0.45, 55);
      this.addBitmapPopup(digitPrefix, `${dmg}`, hx + (this.rng() - 0.5) * 14, hy - 10, false, elemMult > 1.1 ? 1.02 : 0.9);
      this.spawnSparks(hx, hy, ELEMENT_META[atkElem].glow, 5);
    }

    if (e.hp <= 0) {
      if (!this.headless) SFX.play('enemyDie', 0.58, 90);
      const coinDrop = e.isBoss ? 90 : 18;
      const coinMult = 1 + (this.summary.coinBonusPct || 0) / 100;
      this.bonusCoins += Math.round(coinDrop * coinMult);
      if (!this.headless) {
        this.beams.push({
          kind: 'explosion',
          x: e.x,
          y: e.y,
          radius: e.r * 1.45,
          color: e.isBoss ? '#ffd84d' : '#e8b86d',
          life: 0,
          maxLife: e.isBoss ? 0.5 : 0.32,
        });
      }
      this.spawnSparks(e.x, e.y, '#ffd84d', e.isBoss ? 22 : 10);
      this.addText(e.isBoss ? '首领讨伐成功!' : '击破!', e.x, e.y, '#ffe57f', e.isBoss ? 1.28 : 1.0);
      if (e.isBoss) {
        this.shake(0.35, 8);
        for (const minion of this.enemies) {
          if (!minion.isBoss && minion.hp > 0) {
            minion.hp = 0;
            this.spawnSparks(minion.x, minion.y, '#ffe57f', 8);
          }
        }
      }
    }
    this.emitHud();
  }

  onPlayerShotSettled() {
    const marked = this.enemies.filter((e) => e.hp > 0 && e.markedForMeteor);
    if (marked.length > 0 && this.activeStrikeHero?.strikeType === 'meteor_judgement') {
      const caster = this.marbles.find((m) => m.def.id === this.activeStrikeHero.id) || this.marbles[this.turnIndex];
      if (!this.headless) SFX.play('hitCritAxe', 0.7, 40);
      this.shake(0.32, 7.5);
      for (const target of marked) {
        target.markedForMeteor = false;
        if (!this.headless) {
          this.beams.push({ kind: 'meteor', x: target.x, y: target.y, radius: target.r + 36, color: '#ffd954', life: 0, maxLife: 0.52 });
        }
        this.damageEnemy(target, Math.round(caster.atk * 3.45), caster.def.element, target.isBoss, target.x, target.y, 'DZ_');
      }
    }
    this.activeStrikeHero = null;

    this.enemies = this.enemies.filter((e) => e.hp > 0);
    if (this.enemies.length === 0) {
      if (this.headless) {
        if (this.waveIndex + 1 < this.stage.waves.length) this.spawnWave(this.waveIndex + 1);
        else this.finishBattle(true);
      } else {
        this.phase = 'wave_clear';
        this.phaseTimer = 0.8;
        this.emitHud();
      }
      return;
    }

    let attackingCount = 0;
    for (const e of this.enemies) {
      e.chilled = false;
      e.cd -= 1;
      if (e.cd <= 0) {
        e.cd = e.maxCd;
        const volley = e.isBoss ? 2 : 1;
        if (e.isBoss && e.skillLabel) {
          this.addText(e.skillLabel, e.x, e.y - e.r - 12, '#ff9478', 1.14);
        }
        const orbSprite =
          e.element === 'fire'
            ? BATTLE_PROPS.enemyFireOrb
            : e.element === 'water'
              ? BATTLE_PROPS.enemyIceOrb
              : BATTLE_PROPS.enemyOrb;
        const chapScale = 1 + (this.stage.chapter - 1) * 0.34;
        for (let v = 0; v < volley; v++) {
          attackingCount += 1;
          const targetMarble = this.marbles[Math.floor(this.rng() * this.marbles.length)];
          const dur = 0.34 + attackingCount * 0.07;
          this.projectiles.push({
            kind: 'enemy_shot',
            sprite: orbSprite,
            color: '#a46bff',
            x: e.x,
            y: e.y,
            vx: (targetMarble.x - e.x) / dur,
            vy: (targetMarble.y - e.y) / dur,
            targetMarble,
            dmg: Math.round(e.atk * chapScale * (e.isBoss ? 1.65 : 1.75)),
            element: e.element,
            life: 0,
            maxLife: dur,
          });
        }
      }
    }

    if (attackingCount > 0) {
      this.phase = 'enemy_turn';
      this.phaseTimer = this.headless ? 0.05 : 0.5;
      this.emitHud();
    } else {
      this.advanceNextTurn();
    }
  }

  advanceNextTurn() {
    for (const p of this.pickups) {
      if (p.kind === 'meat' && p.tier < 3) {
        p.tier += 1;
        this.spawnSparks(p.x, p.y, '#98f5b1', 5);
      }
    }
    if (this.rng() < 0.62) this.spawnRandomPickup();

    for (const m of this.marbles) {
      if (m.cd > 0) m.cd -= 1;
    }

    this.turnIndex = (this.turnIndex + 1) % this.marbles.length;
    this.turnCount += 1;
    this.strikeArmed = false;
    this.phase = 'aiming';
    this.autoDelay = this.headless ? 0 : 0.42;
    this.emitHud();
  }

  finishBattle(win) {
    this.phase = 'ended';
    if (!this.headless) {
      if (win) {
        SFX.play('battleWin', 0.68, 50);
        vibrate(35);
      } else {
        SFX.play('battleLose', 0.65, 50);
      }
    }
    const stars = !win ? 0 : this.turnCount <= 10 ? 3 : this.turnCount <= 16 ? 2 : 1;
    this.battleResult = {
      win,
      turns: this.turnCount,
      stars,
      bonusCoins: this.bonusCoins,
      maxCombo: this.maxCombo,
    };
    this.emitHud();
    this.callbacks.onBattleEnd?.(this.battleResult);
  }

  shake(duration, magnitude) {
    if (this.headless || this.reducedMotion) return;
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeMag = Math.max(this.shakeMag, magnitude);
  }

  addBitmapPopup(prefix, str, x, y, boom = false, baseScale = 1) {
    if (this.headless) return;
    if (this.bitmapPopups.length > 36) this.bitmapPopups.shift();
    this.bitmapPopups.push({
      prefix,
      str: String(str).slice(0, 7),
      x: Math.min(LOGICAL_W - 36, Math.max(36, x)),
      y: Math.max(28, y),
      boom,
      baseScale,
      life: 0,
    });
  }

  addText(text, x, y, color, scale = 1) {
    if (this.headless) return;
    this.texts.push({
      text,
      x: Math.min(LOGICAL_W - 44, Math.max(44, x)),
      y: Math.max(30, y),
      vy: -34,
      color,
      scale,
      life: 0,
      maxLife: 0.85,
    });
  }

  spawnSparks(x, y, color, count) {
    if (this.headless) return;
    const n = this.reducedMotion ? Math.min(3, count) : count;
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const spd = 40 + this.rng() * 145;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 2.5 + this.rng() * 3.5,
        color,
        life: 0,
        maxLife: 0.28 + this.rng() * 0.24,
      });
    }
  }

  makeJaggedLine(x1, y1, x2, y2, segs) {
    const pts = [{ x: x1, y: y1 }];
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push({
        x: x1 + (x2 - x1) * t + (this.rng() - 0.5) * 22,
        y: y1 + (y2 - y1) * t + (this.rng() - 0.5) * 22,
      });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  }

  updateVisualFx(dt) {
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    for (const m of this.marbles) {
      if (m.squash > 0) m.squash = Math.max(0, m.squash - dt * 2.8);
      if (m.hitTimer > 0) m.hitTimer = Math.max(0, m.hitTimer - dt);
      for (let i = m.trail.length - 1; i >= 0; i--) {
        m.trail[i].alpha -= dt * 2.2;
        if (m.trail[i].alpha <= 0) m.trail.splice(i, 1);
      }
    }
    for (const b of this.bumpers) {
      if (b.squash > 0) b.squash = Math.max(0, b.squash - dt * 2.8);
    }
    for (const e of this.enemies) {
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt * 5.2);
      if (e.hitTimer > 0) e.hitTimer = Math.max(0, e.hitTimer - dt);
      if (e.squash > 0) e.squash = Math.max(0, e.squash - dt * 2.8);
    }
    for (const p of this.pickups) p.bobPhase += dt * 3.2;
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life += dt;
      if (this.beams[i].life >= this.beams[i].maxLife) this.beams.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.92;
      pt.vy *= 0.92;
      if (pt.life >= pt.maxLife) this.particles.splice(i, 1);
    }
    for (let i = this.bitmapPopups.length - 1; i >= 0; i--) {
      this.bitmapPopups[i].life += dt;
      if (this.bitmapPopups[i].life > 0.85) this.bitmapPopups.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const ft = this.texts[i];
      ft.life += dt;
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
      if (ft.life >= ft.maxLife) this.texts.splice(i, 1);
    }
  }

  emitHud() {
    if (this.headless || !this.callbacks.onHudUpdate) return;
    const boss = this.enemies.find((e) => e.isBoss && e.hp > 0);
    this.callbacks.onHudUpdate({
      waveIndex: this.waveIndex + 1,
      totalWaves: this.stage.waves.length,
      hp: this.hp,
      maxHp: this.maxHp,
      turnCount: this.turnCount,
      comboCount: this.comboCount,
      bonusCoins: this.bonusCoins,
      atkBuffActive: this.turnAtkBuff,
      speed2x: this.speed2x,
      autoPlay: this.autoPlay,
      paused: this.paused,
      phase: this.phase,
      slots: this.marbles.map((m, idx) => ({
        id: m.def.id,
        name: m.def.name,
        portrait: m.def.portrait,
        element: m.def.element,
        moveType: m.def.moveType,
        cd: m.cd,
        maxCd: m.maxCd,
        isCurrent: idx === this.turnIndex,
        strikeArmed: idx === this.turnIndex && this.strikeArmed,
      })),
      bossName: boss?.name,
      bossHp: boss?.hp,
      bossMaxHp: boss?.maxHp,
      bossElement: boss?.element,
    });
  }
}

// 无头确定性 AI 自动通关模拟器（供自动化单测跑 200 局平衡性压测使用）
export function runHeadlessBattle(stage, squadIds, stateObj, rng = Math.random, maxTurns = 45) {
  const sim = new PinballBattleEngine(null, stage, squadIds, {}, { headless: true, autoPlay: true, stateObj, rng });
  let steps = 0;
  while (sim.phase !== 'ended' && sim.turnCount <= maxTurns && steps < 40000) {
    sim.update(0.033);
    steps += 1;
  }
  if (!sim.battleResult) {
    sim.finishBattle(false);
  }
  return sim.battleResult;
}
