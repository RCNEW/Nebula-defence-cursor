// ============================================================
//  DEFENSE SYSTEM — placement, upgrades, removal, cube rotation
// ============================================================

class DefenseSystem {
  constructor(scene) {
    this.scene = scene;
    this.placedDefenses = [];
    this.selectedDefense = null;    // placed defense currently selected
    this.placingType = null;        // 'planetDefense' | 'spaceDamage' | 'spaceDebuff'
    this.placingKey = null;         // config key e.g. 'turret'

    // Cube face indices
    this.cubeIndices = { a: 0, b: 0, c: 0 };
    this.cubeKeys = {
      a: Object.keys(CONFIG.PLANET_DEFENSES),
      b: Object.keys(CONFIG.SPACE_DAMAGE_DEFENSES),
      c: Object.keys(CONFIG.SPACE_DEBUFF_DEFENSES),
    };

    // Preview ghost
    this.ghost = null;
    this.ghostValid = false;
    this.activeProjectiles = [];
    this._createGhost();
    this._setupInputHandlers();
  }

  // ── CUBE ROTATION ─────────────────────────────────────────
  rotateCubes(animate = true) {
    const nextIndices = {};
    for (const id of ['a', 'b', 'c']) {
      const keys = this.cubeKeys[id];
      let newIdx = Math.floor(Math.random() * keys.length);
      while (newIdx === this.cubeIndices[id] && keys.length > 1) {
        newIdx = Math.floor(Math.random() * keys.length);
      }
      nextIndices[id] = newIdx;
    }

    if (animate) {
      this.scene.uiScene?.animateCubeRotation(nextIndices, () => {
        for (const id of ['a', 'b', 'c']) this.cubeIndices[id] = nextIndices[id];
        this.scene.uiScene?.updateCubeButtons();
      });
    } else {
      for (const id of ['a', 'b', 'c']) this.cubeIndices[id] = nextIndices[id];
      this.scene.uiScene?.updateCubeButtons();
    }
  }

  getCurrentCubeDefense(cubeId) {
    const idx = this.cubeIndices[cubeId];
    const key = this.cubeKeys[cubeId][idx];
    switch (cubeId) {
      case 'a': return { key, cfg: CONFIG.PLANET_DEFENSES[key], category: 'planetDefense' };
      case 'b': {
        const cfg = CONFIG.SPACE_DAMAGE_DEFENSES[key];
        const cat = (key === 'minishield') ? 'shieldDefense' : 'spaceDamage';
        return { key, cfg, category: cat };
      }
      case 'c': {
        const cfg = CONFIG.SPACE_DEBUFF_DEFENSES[key];
        const cat = (key === 'blocker') ? 'shieldDefense' : 'spaceDebuff';
        return { key, cfg, category: cat };
      }
    }
  }

  // ── PLACING ───────────────────────────────────────────────
  startPlacing(category, key) {
    this.deselectAll();
    this.placingType = category;
    this.placingKey = key;
    this.scene.input.setDefaultCursor('crosshair');
    this.ghost.setVisible(true);
    this.scene.uiScene?.setStatusMsg('Klik om verdediging te plaatsen. ESC om te annuleren.');
    const ptr = this.scene.input.activePointer;
    if (ptr) this._updateGhost(ptr.worldX, ptr.worldY);
  }

  cancelPlacing() {
    this.placingType = null;
    this.placingKey = null;
    this.ghost.setVisible(false);
    this.scene.input.setDefaultCursor('default');
    this.scene.uiScene?.setStatusMsg('');
  }

  _createGhost() {
    this.ghost = this.scene.add.graphics();
    this.ghost.setVisible(false).setAlpha(0.55).setDepth(100);
  }

  _usesSnapRing() {
    return this.placingType === 'planetDefense' || this.placingType === 'shieldDefense';
  }

  _computeSnapPosition(x, y) {
    const L = CONFIG.layout(this.scene);
    const angle = Math.atan2(y - L.PLANET_Y, x - L.PLANET_X);
    const radius = this.placingType === 'planetDefense' ? L.PLANET_R : L.ORBIT_R;
    return {
      x: L.PLANET_X + Math.cos(angle) * radius,
      y: L.PLANET_Y + Math.sin(angle) * radius,
    };
  }

  _updateGhost(x, y) {
    if (!this.placingType) return;
    const cfg = this._getConfigForPlacing();
    if (!cfg) return;

    const valid = this._isValidPlacement(x, y);
    this.ghostValid = valid;
    const col = valid ? 0x00ff88 : 0xff2222;

    this.ghost.clear();

    if (this._usesSnapRing()) {
      const L = CONFIG.layout(this.scene);
      const { x: snapX, y: snapY } = this._computeSnapPosition(x, y);
      this.ghostSnapX = snapX;
      this.ghostSnapY = snapY;
      this.ghost.x = snapX;
      this.ghost.y = snapY;

      const r = this.placingType === 'planetDefense' ? 14 : 12;
      this.ghost.fillStyle(col, 0.7);
      this.ghost.fillCircle(0, 0, r);
      this.ghost.lineStyle(2, col, 1);
      this.ghost.strokeCircle(0, 0, r);
      if (cfg.range) {
        this.ghost.lineStyle(1, col, 0.2);
        this.ghost.strokeCircle(0, 0, cfg.range);
      }
      const ringR = this.placingType === 'planetDefense' ? L.PLANET_R : L.ORBIT_R;
      const ringCol = this.placingType === 'planetDefense' ? 0xffffff : 0x4488ff;
      this.ghost.lineStyle(1, ringCol, this.placingType === 'planetDefense' ? 0.15 : 0.2);
      this.ghost.strokeCircle(L.PLANET_X - snapX, L.PLANET_Y - snapY, ringR);
    } else {
      this.ghost.x = x;
      this.ghost.y = y;
      this.ghost.fillStyle(col, 0.5);
      this.ghost.lineStyle(2, col);
      this.ghost.fillCircle(0, 0, 18);
      this.ghost.strokeCircle(0, 0, 18);
      if (cfg.range) {
        this.ghost.lineStyle(1, col, 0.25);
        this.ghost.strokeCircle(0, 0, cfg.range);
      }
    }
  }

  _isValidPlacement(x, y) {
    const L = CONFIG.layout(this.scene);
    if (y > L.BAR_Y - 20) return false;

    // Planeet / schild: hoek van muis bepaalt snap-positie — klik mag overal in speelveld
    if (this._usesSnapRing()) return true;

    const dist = Phaser.Math.Distance.Between(x, y, L.PLANET_X, L.PLANET_Y);
    if (dist < L.ORBIT_R + 20) return false;
    return true;
  }

  _getConfigForPlacing() {
    switch (this.placingType) {
      case 'planetDefense':  return CONFIG.PLANET_DEFENSES[this.placingKey];
      case 'spaceDamage':    return CONFIG.SPACE_DAMAGE_DEFENSES[this.placingKey];
      case 'spaceDebuff':    return CONFIG.SPACE_DEBUFF_DEFENSES[this.placingKey];
      case 'shieldDefense':
        return CONFIG.SPACE_DAMAGE_DEFENSES[this.placingKey]
            || CONFIG.SPACE_DEBUFF_DEFENSES[this.placingKey];
    }
    return null;
  }

  placeDefense(x, y) {
    if (!this.placingType) return false;
    if (!this._isValidPlacement(x, y)) return false;
    if (!this._usesSnapRing() && !this.ghostValid) return false;

    const cfg = this._getConfigForPlacing();
    if (!cfg) return false;

    const cost = CONFIG.GAME.TEST_MODE ? 0 : cfg.cost;
    if (!this.scene.canAfford(cost)) {
      this.scene.uiScene?.flashMsg('Niet genoeg energie!');
      return false;
    }

    this.scene.spendEnergy(cost);

    let placeX = x, placeY = y;
    if (this._usesSnapRing()) {
      const snap = this._computeSnapPosition(x, y);
      placeX = snap.x;
      placeY = snap.y;
    }

    const defense = this._createDefenseObject(placeX, placeY, this.placingType, this.placingKey, cfg);
    this.placedDefenses.push(defense);
    this.cancelPlacing();
    this.selectDefense(defense);
    this._updateMiniShieldPulse();
    this._updateBlockerRing();
    return true;
  }

  _createDefenseObject(x, y, category, key, baseCfg) {
    const cfg = { ...baseCfg };
    const id = Date.now() + Math.random();

    const container = this.scene.add.container(x, y).setDepth(10);
    const gfx = this.scene.add.graphics();
    container.add(gfx);
    this._drawDefense(gfx, cfg, category, 0);

    const rangeGfx = this.scene.add.graphics();
    if (cfg.range) {
      rangeGfx.lineStyle(1, cfg.color || 0x00ffff, 0.3);
      rangeGfx.strokeCircle(0, 0, cfg.range);
    }
    rangeGfx.setVisible(false);
    container.add(rangeGfx);

    const defense = {
      id, container, gfx, rangeGfx,
      x, y, category, key, cfg,
      upgradeLevel: 0,
      fireTimer: 0,
      active: true,
      hp: cfg.hp ?? null,
    };

    const hitArea = this.scene.add.circle(0, 0, 40, 0xffffff, 0).setInteractive();
    container.add(hitArea);
    hitArea.on('pointerdown', () => this.selectDefense(defense));

    return defense;
  }

  _drawDefense(gfx, cfg, category, upgradeLevel = 0) {
    gfx.clear();
    const col = cfg.color || 0x00ffff;
    const level = Phaser.Math.Clamp(upgradeLevel || 0, 0, 3);
    const glowRadius = 22 + level * 2.5;
    const coreRadius = 14 + level * 2;

    gfx.fillStyle(col, 0.2);
    gfx.fillCircle(0, 0, glowRadius);
    gfx.fillStyle(col, 0.85);
    gfx.fillCircle(0, 0, coreRadius);
    gfx.fillStyle(0xffffff, 0.4);
    if (category === 'planetDefense') {
      gfx.fillRect(-6, -8, 12, 6);
    } else if (category === 'spaceDamage') {
      gfx.fillTriangle(0, -8, 8, 8, -8, 8);
    } else {
      gfx.fillCircle(0, 0, 5);
    }

    this._drawUpgradeLevelFX(gfx, level, glowRadius + 6, col);
  }

  _drawUpgradeLevelFX(gfx, level, radius, color) {
    if (level <= 0) return;
    const markerCount = Math.min(level, 3);
    const arc = Math.PI * 0.28;
    const start = -Math.PI / 2 - ((markerCount - 1) * arc) / 2;

    for (let i = 0; i < markerCount; i++) {
      const angle = start + i * arc;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      gfx.fillStyle(color, 0.42);
      gfx.fillCircle(x, y, 3.5);
      gfx.lineStyle(1.5, 0xffffff, 0.32);
      gfx.strokeCircle(x, y, 4.8);
    }

    gfx.lineStyle(1.5, color, 0.18 + level * 0.06);
    gfx.strokeCircle(0, 0, radius - 2);
  }

  // ── SELECT / DESELECT ─────────────────────────────────────
  selectDefense(defense) {
    this.deselectAll();
    this.selectedDefense = defense;
    defense.rangeGfx.setVisible(true);
    this.scene.uiScene?.showDefenseInfo(defense);
  }

  deselectAll() {
    if (this.selectedDefense) {
      this.selectedDefense.rangeGfx.setVisible(false);
    }
    this.selectedDefense = null;
    this.scene.uiScene?.hideDefenseInfo();
  }

  // ── UPGRADE ───────────────────────────────────────────────
  upgradeSelected() {
    const d = this.selectedDefense;
    if (!d) return;
    const upgrades = d.cfg.upgrades;
    if (!upgrades || d.upgradeLevel >= upgrades.length) {
      this.scene.uiScene?.flashMsg('Maximaal geüpgraded!');
      return;
    }
    const upg = upgrades[d.upgradeLevel];
    const cost = CONFIG.GAME.TEST_MODE ? 0 : upg.cost;
    if (!this.scene.canAfford(cost)) {
      this.scene.uiScene?.flashMsg('Niet genoeg energie!');
      return;
    }
    this.scene.spendEnergy(cost);
    this._applyUpgrade(d, upg);
    d.upgradeLevel++;
    this._drawDefense(d.gfx, d.cfg, d.category, d.upgradeLevel);
    this._redrawRangeCircle(d);
    this.scene.uiScene?.showDefenseInfo(d);
    this.scene.uiScene?.flashMsg('Upgrade toegepast!');
  }

  _applyUpgrade(defense, upg) {
    const c = defense.cfg;
    if (upg.stat && upg.mult  !== undefined) c[upg.stat] = Math.round((c[upg.stat] ?? 1) * upg.mult);
    if (upg.stat && upg.value !== undefined && !upg.add) c[upg.stat] = upg.value;
    if (upg.stat && upg.add   !== undefined) c[upg.stat] = (c[upg.stat] ?? 0) + upg.add;
    if (defense.key === 'blocker') {
      if (upg.stat === 'hitsAllowed' && upg.add !== undefined) {
        defense.hitsRemaining = (defense.hitsRemaining ?? c.hitsAllowed) + upg.add;
      }
      this._drawDefense(defense.gfx, c, defense.category, defense.upgradeLevel);
    }
  }

  _redrawRangeCircle(defense) {
    const rg = defense.rangeGfx;
    rg.clear();
    if (defense.cfg.range) {
      rg.lineStyle(1, defense.cfg.color || 0x00ffff, 0.3);
      rg.strokeCircle(0, 0, defense.cfg.range);
    }
  }

  // ── REMOVE ────────────────────────────────────────────────
  removeSelected() {
    const d = this.selectedDefense;
    if (!d) return;
    const refund = Math.floor(d.cfg.cost * 0.5);
    if (!CONFIG.GAME.TEST_MODE) this.scene.addEnergy(refund);
    d.active = false;
    d.container.destroy();
    this.placedDefenses = this.placedDefenses.filter(x => x.id !== d.id);
    this.selectedDefense = null;
    this.scene.uiScene?.hideDefenseInfo();
    this.scene.uiScene?.flashMsg(`Verwijderd. +${refund} energie teruggekregen.`);
  }

  // ── UPDATE / FIRE ─────────────────────────────────────────
  update(delta, gameSpeed) {
    this._lastDelta = delta * gameSpeed;
    this._lastRawDelta = delta;
    for (const d of this.placedDefenses) {
      if (!d.active) continue;
      this._updateDefense(d, delta, gameSpeed);
    }
    this._updateProjectiles(delta, gameSpeed);
  }

  _updateDefense(d, delta, gameSpeed) {
    // Mini Shield
    if (d.key === 'minishield') {
      d.fireTimer = (d.fireTimer ?? 0) + delta * gameSpeed;
      const interval = d.cfg.repairInterval || 500;
      if (d.fireTimer >= interval) {
        d.fireTimer = 0;
        const ss = this.scene.shieldSystem;
        const current = this.scene.shieldPct;
        if (current >= CONFIG.GAME.SHIELD_MAX) {
          this._removeMiniShield(d);
        } else {
          ss.repair(d.cfg.repairRate || 1.5);
        }
      }
      return;
    }

    // Vortex: eigen update-logica buiten het standaard trigger-systeem
    if (d.key === 'vortex') {
      this._updateVortex(d, delta, gameSpeed);
      return;
    }

    // Gravitrap: orbit-systeem identiek aan vortex, maar zonder sling-fase
    if (d.key === 'gravitrap') {
      this._updateGravitrap(d, delta, gameSpeed);
      return;
    }

    if (!d.cfg.fireRate && !d.cfg.drainRate && !d.cfg.pulseInterval && !d.cfg.tickInterval
        && d.key !== 'empdisruptor') return;

    const needsTrigger = d.cfg.activeDuration &&
      (d.category === 'spaceDamage' || d.category === 'spaceDebuff') &&
      d.key !== 'blocker';

    if (needsTrigger) {
      const range = d.cfg.range || 150;
      if (!d.active_triggered) {
        const es = this.scene.enemySystem;
        let candidates = es.getEnemiesInRange(d.x, d.y, range);
        if (d.key === 'empdisruptor' && d.cfg.triggerMinTier != null) {
          const order = CONFIG.ENEMY_TIER_ORDER;
          candidates = candidates.filter(e => order.indexOf(e.type) >= d.cfg.triggerMinTier);
        }
        if (candidates.length > 0) {
          if (d.key === 'empdisruptor') {
            this._fire(d);
            return;
          }
          d.active_triggered = true;
          d.activeTimer = d.cfg.activeDuration;
          d.fireTimer   = (d.cfg.fireRate || 1000);
        }
        return;
      }
      d.activeTimer = (d.activeTimer || 0) - delta * gameSpeed;
      if (d.activeTimer <= 0) {
        this._spaceWeaponBurnoutFX(d);
        this._removeDefense(d);
        return;
      }
    }

    d.fireTimer = (d.fireTimer ?? 0) + delta * gameSpeed;
    const interval = d.cfg.fireRate || d.cfg.tickInterval || d.cfg.pulseInterval || 1000;

    if (d.fireTimer >= interval) {
      d.fireTimer = 0;
      this._fire(d);
    }
  }

  _removeMiniShield(d) {
    d.active = false;
    d.container?.destroy();
    const idx = this.placedDefenses.indexOf(d);
    if (idx !== -1) this.placedDefenses.splice(idx, 1);
    if (this.selectedDefense === d) {
      this.selectedDefense = null;
      this.scene.uiScene?.hideDefenseInfo();
    }
    this.scene.uiScene?.flashMsg('Mini Shield verwijderd — schild volledig!');
    this._updateMiniShieldPulse();
  }

  _updateMiniShieldPulse() {
    const count = this._activeMiniShieldCount();
    const ls    = this.scene.layoutSystem;
    if (!ls) return;
    ls.setShieldPulsing(count > 0);
  }

  _activeMiniShieldCount() {
    return this.placedDefenses.filter(d => d.key === 'minishield' && d.active).length;
  }

  // ── VORTEX — 3-fase systeem ───────────────────────────────
  // Fase 1 (pull):  vijanden worden aangetrokken zodra ze in range komen
  // Fase 2 (orbit): vijanden zweven rustig in een baan rond de vortex
  // Fase 3 (sling): na orbitDuration ontploft de vortex en slingert vijanden weg
  _updateVortex(d, delta, gameSpeed) {
    const cfg = d.cfg;
    const es  = this.scene.enemySystem;

    // Initialiseer vortex-state bij eerste update
    if (!d.vortexState) {
      d.vortexState    = 'active';
      d.vortexTimer    = cfg.orbitDuration || 6000; // ms tot ontploffing
      d.vortexCaptured = new Set();                  // vijanden die al in orbit zijn
      this._vortexSpinFX(d);                         // start visuele rotatie
    }

    if (d.vortexState === 'done') return;

    const dt = (delta / 1000) * gameSpeed;
    d.vortexTimer -= delta * gameSpeed;

    // Trek nieuwe vijanden aan die in range zijn en nog niet gevangen
    const pullRange = cfg.pullRange || 180;
    for (const e of es.enemies) {
      if (!e.active || d.vortexCaptured.has(e)) continue;
      if (e.vortexOrbit && e.vortexOrbit.owner !== d.id) continue; // andere vortex
      const dx = e.container.x - d.x;
      const dy = e.container.y - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= pullRange && !e.vortexOrbit) {
        // Leg orbit-data vast op de vijand — EnemySystem doet de beweging
        const startAngle = Math.atan2(dy, dx);
        e.vortexOrbit = {
          owner:      d.id,
          cx:         d.x,
          cy:         d.y,
          radius:     cfg.orbitRadius || 55,
          orbitSpeed: cfg.orbitSpeed  || 1.4,
          pullSpeed:  cfg.pullSpeed   || 110,
          angle:      startAngle,
          phase:      'pull',
          vx: 0, vy: 0,
        };
        d.vortexCaptured.add(e);
      }
    }

    // Ontploffing: slingert alle gevangen vijanden weg
    if (d.vortexTimer <= 0) {
      this._vortexExplode(d, cfg);
      d.vortexState = 'done';
      this._spaceWeaponBurnoutFX(d);
      this._removeDefense(d);
    }
  }

  // Slingert alle gevangen vijanden in willekeurige richting weg
  _vortexExplode(d, cfg) {
    const slingSpeed = cfg.slingSpeed || 700;
    const es = this.scene.enemySystem;
    const L  = CONFIG.layout(this.scene);

    for (const e of es.enemies) {
      if (!e.active) continue;
      if (!e.vortexOrbit || e.vortexOrbit.owner !== d.id) continue;

      // Sling richting: de huidige orbit-hoek vanuit het vortex-centrum.
      // Dit is altijd NAAR BUITEN (weg van de vortex), met een kleine willekeurige spread.
      const orbitAngle = e.vortexOrbit.angle; // hoek van vijand t.o.v. vortex-centrum
      const spread = (Math.random() - 0.5) * Math.PI * 0.4; // ±36° spread
      const finalAngle = orbitAngle + spread;
      const speed = slingSpeed * (0.85 + Math.random() * 0.3);

      e.vortexOrbit.vx    = Math.cos(finalAngle) * speed;
      e.vortexOrbit.vy    = Math.sin(finalAngle) * speed;
      e.vortexOrbit.phase = 'sling';
    }

    // Grote visuele explosie-ring
    const gfx = this.scene.add.graphics().setDepth(22);
    gfx.setPosition(d.x, d.y);
    gfx.lineStyle(4, cfg.color || 0x00ffff, 1);
    gfx.strokeCircle(0, 0, (cfg.orbitRadius || 55) * 0.8);
    this.scene.tweens.add({
      targets: gfx, scaleX: 3.5, scaleY: 3.5, alpha: 0,
      duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  // Visuele puls-ring die de pullRange aangeeft zolang de vortex actief is
  _vortexSpinFX(d) {
    if (!d.active || d.vortexState === 'done') return;
    const col = d.cfg.color || 0x00ffff;
    const gfx = this.scene.add.graphics().setDepth(8);
    gfx.lineStyle(1, col, 0.25);
    gfx.strokeCircle(d.x, d.y, d.cfg.pullRange || 180);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 1800,
      onComplete: () => {
        gfx.destroy();
        if (d.active && d.vortexState !== 'done') this._vortexSpinFX(d);
      },
    });
  }

  // ── GRAVITRAP — orbit-systeem (fase 1: pull, fase 2: orbit) ──
  // Identiek aan vortex maar zonder sling-fase.
  // Bij verlopen van de timer worden alle gevangen vijanden simpelweg vrijgelaten.
  _updateGravitrap(d, delta, gameSpeed) {
    const cfg = d.cfg;
    const es  = this.scene.enemySystem;

    // Initialiseer state bij eerste update
    if (!d.gravitrapState) {
      d.gravitrapState    = 'active';
      d.gravitrapTimer    = cfg.activeDuration || 7000;
      d.gravitrapDamageTimer = 0;
      d.gravitrapCaptured = new Set();
      this._gravitrapRangeFX(d); // visuele range-ring
    }

    if (d.gravitrapState === 'done') return;

    d.gravitrapTimer -= delta * gameSpeed;

    // Trek nieuwe vijanden aan die in range zijn
    const pullRange = cfg.range || 150;
    for (const e of es.enemies) {
      if (!e.active || d.gravitrapCaptured.has(e)) continue;
      if (e.vortexOrbit) continue; // al gevangen door vortex of andere trap
      const dx = e.container.x - d.x;
      const dy = e.container.y - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= pullRange) {
        const startAngle = Math.atan2(dy, dx);
        // Hergebruik vortexOrbit-veld — EnemySystem kent dit systeem al
        e.vortexOrbit = {
          owner:      d.id,
          cx:         d.x,
          cy:         d.y,
          radius:     cfg.orbitRadius || 50,
          orbitSpeed: cfg.orbitSpeed  || 0.6,
          pullSpeed:  cfg.pullSpeed   || 100,
          angle:      startAngle,
          phase:      'pull',
          vx: 0, vy: 0,
        };
        d.gravitrapCaptured.add(e);
        es.applyGravitrapRing?.(e);
      }
    }

    const interval = cfg.tickInterval || 100;
    d.gravitrapDamageTimer += delta * gameSpeed;
    while (d.gravitrapDamageTimer >= interval) {
      d.gravitrapDamageTimer -= interval;
      const tickSec = interval / 1000;
      const dmgPerTick = (cfg.drainRate || 15) * tickSec;
      for (const e of Array.from(d.gravitrapCaptured)) {
        if (!e.active) {
          d.gravitrapCaptured.delete(e);
          continue;
        }
        if (!e.vortexOrbit || e.vortexOrbit.owner !== d.id) {
          es.removeGravitrapRing?.(e);
          d.gravitrapCaptured.delete(e);
          continue;
        }
        if (e.vortexOrbit.phase === 'orbit') {
          es.damageEnemy(e, dmgPerTick);
        }
      }
    }

    // Timer verlopen: vrijlaten en verdwijnen
    if (d.gravitrapTimer <= 0) {
      d.gravitrapState = 'done';
      // Vrijlaten: alle gevangen vijanden terugzetten naar normale beweging
      for (const e of es.enemies) {
        if (e.vortexOrbit && e.vortexOrbit.owner === d.id) {
          delete e.vortexOrbit;
          es.removeGravitrapRing?.(e);
        }
      }
      this._spaceWeaponBurnoutFX(d);
      this._removeDefense(d);
    }
  }

  // Zachte puls-ring als visuele indicator van de gravitrap range
  _gravitrapRangeFX(d) {
    if (!d.active || d.gravitrapState === 'done') return;
    const col = d.cfg.color || 0x6600aa;
    const gfx = this.scene.add.graphics().setDepth(8);
    gfx.lineStyle(1, col, 0.2);
    gfx.strokeCircle(d.x, d.y, d.cfg.range || 150);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 2200,
      onComplete: () => {
        gfx.destroy();
        if (d.active && d.gravitrapState !== 'done') this._gravitrapRangeFX(d);
      },
    });
  }

  _slowFieldFX(d) {
    const range = d.cfg.range || 130;
    const col   = d.cfg.color || 0x88ccff;
    const gfx   = this.scene.add.graphics().setDepth(15);
    gfx.fillStyle(col, 0.07);
    gfx.fillCircle(d.x, d.y, range);
    gfx.lineStyle(1, col, 0.35);
    gfx.strokeCircle(d.x, d.y, range);
    this.scene.time.delayedCall(450, () => { if (gfx?.active) gfx.destroy(); });
  }

  _empFX(d) {
    const range = d.cfg.range || 140;
    const col   = d.cfg.color || 0xffff00;
    const gfx   = this.scene.add.graphics().setDepth(22);
    gfx.setPosition(d.x, d.y);
    gfx.fillStyle(col, 0.25);
    gfx.fillCircle(0, 0, range);
    gfx.lineStyle(3, col, 1);
    gfx.strokeCircle(0, 0, range);
    this.scene.tweens.add({
      targets: gfx, scaleX: 1.5, scaleY: 1.5, alpha: 0,
      duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  _drainBeamFX(defense, target) {
    const scene = this.scene;
    const col   = defense.cfg.color || 0xaa00ff;
    const gfx   = scene.add.graphics().setDepth(22);
    const x1 = defense.x,          y1 = defense.y;
    const x2 = target.container.x, y2 = target.container.y;

    gfx.lineStyle(3, col, 0.7);
    gfx.lineBetween(x1, y1, x2, y2);
    gfx.lineStyle(1, 0xffffff, 0.5);
    gfx.lineBetween(x1, y1, x2, y2);

    scene.tweens.add({
      targets: gfx, alpha: 0,
      duration: 80, ease: 'Linear',
      onComplete: () => gfx.destroy(),
    });
  }

  // Nauwkeurigheid van een planeetverdediging: schaalt van baseAccuracy (bij
  // plaatsing) naar maxAccuracy (bij de laatste upgrade). Alleen relevant voor
  // defenses met een homing-projectiel (PLANET_DEFENSES); overige defenses
  // hebben geen accuracy-config en raken dus altijd.
  _getAccuracy(d) {
    const base = d.cfg.baseAccuracy;
    if (base == null) return 1;
    const max = d.cfg.maxAccuracy ?? 1;
    const maxLevel = (d.cfg.upgrades || []).length;
    if (maxLevel <= 0) return base;
    const t = Math.min(1, d.upgradeLevel / maxLevel);
    return base + (max - base) * t;
  }

  _fire(d) {
    const es = this.scene.enemySystem;
    const cat = d.category;

    if (cat === 'planetDefense') {
      const target = (d.key === 'netgun')
        ? es.getNearestEnemyNotNetted(d.x, d.y, d.cfg.range || 420)
        : es.getNearestEnemy(d.x, d.y, d.cfg.range || 300);
      if (!target) return;
      this._shootProjectile(d, target);
    }
    else if (cat === 'spaceDamage') {
      if (d.key === 'sonarbomb' || d.key === 'pulsar') {
        const targets = es.getEnemiesInRange(d.x, d.y, d.cfg.range || 200);
        targets.forEach(t => {
          es.damageEnemy(t, d.cfg.damage);
          if (d.key === 'sonarbomb' && d.cfg.slowFactor) {
            t.slowed     = true;
            t.slowFactor = Math.min(t.slowFactor ?? 1, d.cfg.slowFactor);
            t.slowTimer  = Math.max(t.slowTimer ?? 0, d.cfg.slowDuration || 2500);
          }
        });
        this._pulseFX(d);
      } else if (d.key === 'energydrain') {
        const targets = es.getEnemiesInRange(d.x, d.y, d.cfg.range || 160)
          .slice(0, d.cfg.maxTargets || 1);
        const tickSec = (d.cfg.tickInterval || 100) / 1000;
        const dmgPerTick = (d.cfg.drainRate || 15) * tickSec;
        targets.forEach(t => {
          es.damageEnemy(t, dmgPerTick);
          this._drainBeamFX(d, t);
        });
      }
    }
    else if (cat === 'spaceDebuff') {
      const range = d.cfg.range || 150;
      const targets = es.getEnemiesInRange(d.x, d.y, range);

      if (d.key === 'slowfield') {
        targets.forEach(t => {
          t.slowed     = true;
          t.slowFactor = Math.min(t.slowFactor, d.cfg.slowFactor || 0.45);
          t.slowTimer  = Math.max(t.slowTimer, d.cfg.slowApplyTime || 1500);
        });
        this._slowFieldFX(d);
      }

      // gravitrap wordt afgehandeld via _updateGravitrap(), niet via _fire()

      // vortex wordt afgehandeld via _updateVortex(), niet via _fire()

      else if (d.key === 'empdisruptor') {
        targets.forEach(t => es.degradeEnemy(t));
        this._empFX(d);
        this._spaceWeaponBurnoutFX(d);
        this._removeDefense(d);
      }

      else if (d.key === 'webspinner') {
        targets.forEach(t => {
          const curFactor = t.netted ? t.netSlowFactor : 1.0;
          const newFactor = curFactor * (d.cfg.netSlowFactor || 0.6);
          es.applyNet(t,
            d.cfg.netDamagePerSec || 8,
            d.cfg.netDuration     || 4000,
            Math.max(0.05, newFactor),
            d.cfg.color || 0xccaaff
          );
        });
      }
    }
  }

  _shootProjectile(d, target) {
    if (!target || !target.active) return;
    const scene = this.scene;

    const proj = scene.add.graphics();
    const projRadius = (d.key === 'cannon') ? 8 : 4;
    const coreRadius = (d.key === 'cannon') ? 4 : 2;
    proj.fillStyle(d.cfg.color || 0x00ffff, 0.9);
    proj.fillCircle(0, 0, projRadius);
    proj.fillStyle(0xffffff, 0.8);
    proj.fillCircle(0, 0, coreRadius);
    proj.x = d.x;
    proj.y = d.y;
    proj.setDepth(20);

    const baseProjSpeed = d.cfg.projectileSpeed || 400;
    const LASER_PACKET_LEN = 52;
    const hitRadius = (target.cfg?.radius || 18) + 6
      + (d.key === 'laser' ? LASER_PACKET_LEN : 0);

    // Nauwkeurigheid: bepaalt of dit schot raak is. Bij een misser vliegt het
    // projectiel naar een vast punt net naast het doelwit i.p.v. continu te
    // blijven homen — zo mist het zichtbaar in plaats van altijd te raken.
    const accuracy = this._getAccuracy(d);
    const isMiss = Math.random() >= accuracy;
    let missX = null, missY = null;
    if (isMiss) {
      const M = CONFIG.GAME;
      const missAngle = Math.random() * Math.PI * 2;
      const missDist  = hitRadius + Phaser.Math.FloatBetween(M.MISS_OFFSET_MIN, M.MISS_OFFSET_MAX);
      missX = target.container.x + Math.cos(missAngle) * missDist;
      missY = target.container.y + Math.sin(missAngle) * missDist;
    }

    const isNet = (d.key === 'netgun');

    if (isNet) {
      proj.clear();
      const nc = d.cfg.color || 0x44ffcc;
      proj.lineStyle(2, nc, 0.9);
      proj.strokeCircle(0, 0, 6);
      proj.lineStyle(1, nc, 0.6);
      proj.lineBetween(-6, 0, 6, 0);
      proj.lineBetween(0, -6, 0, 6);
      proj.lineBetween(-4, -4, 4, 4);
      proj.lineBetween(4, -4, -4, 4);
    }

    const isMortar = (d.key === 'mortar');

    let mortarData = null;
    if (isMortar) {
      proj.clear();
      const sx = d.x, sy = d.y;
      const endX = isMiss ? missX : target.container.x;
      const endY = isMiss ? missY : target.container.y;
      const totalDist = Phaser.Math.Distance.Between(sx, sy, endX, endY);
      const flightTime = (totalDist / baseProjSpeed) * 1000;
      const arcHeight = Math.max(80, totalDist * 0.35);
      mortarData = {
        sx, sy,
        endX, endY,
        flightTime,
        elapsed: 0,
        arcHeight,
        trailPoints: [],
        TRAIL_LEN: 18,
        lostTarget: false,
        missMode: isMiss,
      };
    }

    const isRailgun = (d.key === 'railgun');
    const isLaser   = (d.key === 'laser');
    if (isRailgun || isLaser) {
      proj.clear();
    }

    this.activeProjectiles.push({
      gfx: proj,
      target,
      defense: d,
      speed: baseProjSpeed,
      damage: d.cfg.damage || 0,
      splashRadius: d.cfg.splashRadius || d.cfg.splash || 0,
      hitRadius,
      active: true,
      isNet,
      netDamagePerSec: d.cfg.netDamagePerSec || 0,
      netDuration:     d.cfg.netDuration     || 4000,
      netSlowFactor:   d.cfg.slowFactor      || 0.45,
      netColor:        d.cfg.color           || 0x44ffcc,
      isMortar,
      mortar: mortarData,
      isRailgun,
      railgunTrail: isRailgun ? [] : null,
      isLaser,
      forcedMiss: isMiss,
      missX, missY,
    });
  }

  // ── PROJECTILE UPDATE ─────────────────────────────────────
  _updateProjectiles(delta, gameSpeed) {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];

      if (!p.active || !p.gfx?.active) {
        if (p.gfx?.active) p.gfx.destroy();
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      const missFlightFixed = p.forcedMiss || (p.isMortar && p.mortar.missMode);

      if (!p.target.active && !missFlightFixed) {
        if (p.isMortar && !p.mortar.lostTarget) {
          if (this._mortarRetargetOnTargetLost(p)) {
            this.activeProjectiles.splice(i, 1);
            continue;
          }
        } else if (!p.isMortar) {
          p.gfx.destroy();
          this.activeProjectiles.splice(i, 1);
          continue;
        }
      }

      if (!p.isMortar) {
        const tx = p.forcedMiss ? p.missX : p.target.container.x;
        const ty = p.forcedMiss ? p.missY : p.target.container.y;
        const dx = tx - p.gfx.x;
        const dy = ty - p.gfx.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = p.speed * gameSpeed * (delta / 1000);

        if (dist <= step + p.hitRadius) {
          if (p.forcedMiss) {
            this._missFX(tx, ty, p.defense.cfg.color || 0x888888);
            p.gfx.destroy();
            this.activeProjectiles.splice(i, 1);
            continue;
          }

          const es = this.scene.enemySystem;

          if (p.target.active) {
            if (p.isNet) {
              es.applyNet(p.target, p.netDamagePerSec, p.netDuration, p.netSlowFactor, p.netColor);
              this._netImpactFX(tx, ty, p.netColor);
            } else {
              es.damageEnemy(p.target, p.damage);
              if (p.splashRadius > 0) {
                const near = es.getEnemiesInRange(tx, ty, p.splashRadius);
                near.forEach(e => {
                  if (e !== p.target) es.damageEnemy(e, p.damage * 0.5);
                });
              }
              this._impactFX(tx, ty, p.defense.cfg.color || 0x00ffff);
            }
          }

          p.gfx.destroy();
          this.activeProjectiles.splice(i, 1);
          continue;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        p.gfx.x += nx * step;
        p.gfx.y += ny * step;

        if (p.isRailgun) {
          const col   = p.defense.cfg.color || 0xff00ff;
          const trail = p.railgunTrail;
          const TRAIL_LEN = 20;

          trail.push({ x: p.gfx.x, y: p.gfx.y });
          if (trail.length > TRAIL_LEN) trail.shift();

          p.gfx.clear();

          for (let ti = 1; ti < trail.length; ti++) {
            const frac  = ti / trail.length;
            const thick = frac * 4.5 + 0.5;
            const alpha = frac * frac * 0.85;
            const tCol  = ti === trail.length - 1 ? 0xffffff : col;
            p.gfx.lineStyle(thick, tCol, alpha);
            p.gfx.lineBetween(
              trail[ti-1].x - p.gfx.x, trail[ti-1].y - p.gfx.y,
              trail[ti].x   - p.gfx.x, trail[ti].y   - p.gfx.y
            );
          }

          const BL = 18, BW = 3.5;
          const tailX = -nx * BL, tailY = -ny * BL;
          const perpX = -ny * BW, perpY =  nx * BW;

          p.gfx.fillStyle(col, 1);
          p.gfx.beginPath();
          p.gfx.moveTo(nx * 6,              ny * 6);
          p.gfx.lineTo(perpX * 0.65,        perpY * 0.65);
          p.gfx.lineTo(tailX + perpX * 0.3, tailY + perpY * 0.3);
          p.gfx.lineTo(tailX - perpX * 0.3, tailY - perpY * 0.3);
          p.gfx.lineTo(-perpX * 0.65,      -perpY * 0.65);
          p.gfx.closePath();
          p.gfx.fillPath();

          p.gfx.lineStyle(1.5, 0xffffff, 0.9);
          p.gfx.lineBetween(nx * 4, ny * 4, tailX * 0.7, tailY * 0.7);
        }

        if (p.isLaser) {
          const col = p.defense.cfg.color || 0x00ff88;
          const SEG_LEN = 12, SEG_GAP = 8, SEG_W = 5;
          const PITCH   = SEG_LEN + SEG_GAP;

          p.gfx.clear();
          const totalLen = 3 * SEG_LEN + 2 * SEG_GAP;

          for (let s = 0; s < 3; s++) {
            const alpha = 1 - s * 0.22;
            const back  = totalLen - (s * PITCH + SEG_LEN);
            const front = back + SEG_LEN;
            const x0 = nx * back,  y0 = ny * back;
            const x1 = nx * front, y1 = ny * front;

            p.gfx.lineStyle(SEG_W, col, alpha);
            p.gfx.lineBetween(x0, y0, x1, y1);
            p.gfx.lineStyle(2, 0xffffff, alpha * 0.7);
            p.gfx.lineBetween(x0, y0, x1, y1);
          }
        }
      }

      if (p.isMortar) {
        const m = p.mortar;
        m.elapsed += delta * gameSpeed;
        const t = Math.min(m.elapsed / m.flightTime, 1);

        const etx = (m.lostTarget || m.missMode) ? m.endX : p.target.container.x;
        const ety = (m.lostTarget || m.missMode) ? m.endY : p.target.container.y;
        if (!m.lostTarget && !m.missMode) {
          m.endX = etx;
          m.endY = ety;
        }

        const lx = m.sx + (etx - m.sx) * t;
        const ly = m.sy + (ety - m.sy) * t;

        const fdx = etx - m.sx, fdy = ety - m.sy;
        const flen = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
        const perpX = -fdy / flen;
        const perpY =  fdx / flen;
        const upPerp = perpY < 0 ? 1 : -1;
        const arc = Math.sin(Math.PI * t) * m.arcHeight * upPerp;

        const newX = lx + perpX * arc * upPerp;
        const newY = ly + perpY * arc * upPerp;

        m.trailPoints.push({ x: newX, y: newY });
        if (m.trailPoints.length > m.TRAIL_LEN) m.trailPoints.shift();

        p.gfx.x = 0; p.gfx.y = 0;
        p.gfx.clear();

        const col = p.defense.cfg.color || 0xffaa00;
        const pts = m.trailPoints;
        for (let ti = 1; ti < pts.length; ti++) {
          const frac = ti / pts.length;
          const thick = frac * 5 + 0.5;
          const alpha = frac * frac * 0.85;
          p.gfx.lineStyle(thick, col, alpha);
          p.gfx.lineBetween(pts[ti - 1].x, pts[ti - 1].y, pts[ti].x, pts[ti].y);
        }

        p.gfx.fillStyle(col, 1);
        p.gfx.fillCircle(newX, newY, 6);
        p.gfx.fillStyle(0xffffff, 0.8);
        p.gfx.fillCircle(newX, newY, 2.5);

        const headDist = Phaser.Math.Distance.Between(newX, newY, etx, ety);
        if (t >= 1 || headDist <= p.hitRadius + 4) {
          if (m.lostTarget || m.missMode) {
            this._mortarFadeOutFX(etx, ety, col, p.gfx);
          } else {
            this._mortarExplosionFX(etx, ety, col, p.splashRadius || 80);
            if (p.target.active) {
              const es = this.scene.enemySystem;
              es.damageEnemy(p.target, p.damage);
              if (p.splashRadius > 0) {
                const near = es.getEnemiesInRange(etx, ety, p.splashRadius);
                near.forEach(e => {
                  if (e !== p.target) es.damageEnemy(e, p.damage * 0.6);
                });
              }
            }
            p.gfx.destroy();
          }
          this.activeProjectiles.splice(i, 1);
        }
        continue;
      }
    }
  }

  _impactFX(x, y, color) {
    const gfx = this.scene.add.graphics().setDepth(25);
    gfx.setPosition(x, y);
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(0, 0, 7);
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillCircle(0, 0, 3);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, scaleX: 2.5, scaleY: 2.5,
      duration: 180, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  _missFX(x, y, color) {
    const gfx = this.scene.add.graphics().setDepth(21);
    gfx.setPosition(x, y);
    gfx.lineStyle(2, color, 0.5);
    gfx.lineBetween(-6, -6, 6, 6);
    gfx.lineBetween(-6, 6, 6, -6);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, scaleX: 1.8, scaleY: 1.8,
      duration: 220, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  _netImpactFX(x, y, color) {
    const gfx = this.scene.add.graphics().setDepth(25);
    gfx.lineStyle(2, color, 0.9);
    gfx.strokeCircle(0, 0, 8);
    gfx.x = x; gfx.y = y;
    this.scene.tweens.add({
      targets: gfx, scaleX: 3.5, scaleY: 3.5, alpha: 0,
      duration: 350, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  /** Doelwit dood vóór impact: vlieg naar doodpositie, geen schade/ontploffing. */
  _mortarRetargetOnTargetLost(p) {
    const m = p.mortar;
    const col = p.defense.cfg.color || 0xffaa00;
    m.endX = p.target.deathX ?? m.endX;
    m.endY = p.target.deathY ?? m.endY;
    m.lostTarget = true;

    const pts = m.trailPoints;
    const cur = pts.length ? pts[pts.length - 1] : { x: m.sx, y: m.sy };
    m.sx = cur.x;
    m.sy = cur.y;
    m.elapsed = 0;
    m.trailPoints = [];

    const totalDist = Phaser.Math.Distance.Between(m.sx, m.sy, m.endX, m.endY);
    if (totalDist < 10) {
      this._mortarFadeOutFX(m.endX, m.endY, col, p.gfx);
      p.active = false;
      return true;
    }

    m.flightTime = Math.max(150, (totalDist / p.speed) * 1000);
    m.arcHeight = Math.max(30, totalDist * 0.25);
    return false;
  }

  _mortarFadeOutFX(x, y, color, gfx) {
    if (!gfx?.active) return;
    gfx.clear();
    gfx.setPosition(x, y);
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(0, 0, 6);
    gfx.fillStyle(0xffffff, 0.75);
    gfx.fillCircle(0, 0, 2.5);
    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 380,
      ease: 'Cubic.easeIn',
      onComplete: () => gfx.destroy(),
    });
  }

  _mortarExplosionFX(x, y, color, splashR) {
    const scene = this.scene;

    const flash = scene.add.graphics().setDepth(30);
    flash.setPosition(x, y);
    flash.fillStyle(0xffffff, 1);
    flash.fillCircle(0, 0, 14);
    flash.fillStyle(color, 0.9);
    flash.fillCircle(0, 0, 10);
    scene.tweens.add({
      targets: flash, alpha: 0, scaleX: 3, scaleY: 3,
      duration: 280, ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    const ring = scene.add.graphics().setDepth(28);
    ring.setPosition(x, y);
    ring.lineStyle(3, color, 0.8);
    ring.strokeCircle(0, 0, 12);
    scene.tweens.add({
      targets: ring,
      scaleX: splashR / 12, scaleY: splashR / 12, alpha: 0,
      duration: 380, ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      const p = scene.add.graphics().setDepth(29);
      p.setPosition(x, y);
      p.fillStyle(color, 0.9);
      p.fillCircle(0, 0, 2 + Math.random() * 2);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scaleX: 0.3, scaleY: 0.3,
        duration: 320 + Math.random() * 160,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  _pulseFX(d) {
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, d.cfg.color || 0x00ffff, 0.8);
    ring.strokeCircle(0, 0, 10);
    ring.x = d.x;
    ring.y = d.y;
    const radius = d.cfg.pulseRadius || d.cfg.range || 200;
    this.scene.tweens.add({
      targets: ring,
      scaleX: radius / 10,
      scaleY: radius / 10,
      alpha: 0,
      duration: 600,
      onComplete: () => ring.destroy(),
    });
  }

  checkMineCollisions() {
    const es = this.scene.enemySystem;
    for (let i = this.placedDefenses.length - 1; i >= 0; i--) {
      const d = this.placedDefenses[i];
      if (!d.active) continue;

      // ── Mine ─────────────────────────────────────────────
      if (d.key === 'mine') {
        const hit = es.getEnemiesInRange(d.x, d.y, d.cfg.triggerRadius || 50);
        if (hit.length > 0) {
          const splash = es.getEnemiesInRange(d.x, d.y, d.cfg.splashRadius || 100);
          splash.forEach(e => es.damageEnemy(e, d.cfg.damage || 220));
          this._pulseFX(d);
          this._removeDefense(d);
        }
        continue;
      }

      // ── Nova Core ─────────────────────────────────────────
      if (d.key === 'nova') {
        const range = d.cfg.range || 160;

        if (!d.burning) {
          if (es.getEnemiesInRange(d.x, d.y, range).length > 0) {
            d.burning   = true;
            d.burnTimer = d.cfg.burnDuration || 6000;
            d.fireTimer = 0;
            this._novaStartFX(d);
          }
          continue;
        }

        const dt = this._lastRawDelta || 0;
        d.fireTimer = (d.fireTimer || 0) + dt;
        d.burnTimer = (d.burnTimer || 0) - dt;

        const tickInterval = d.cfg.tickInterval || 150;
        if (d.fireTimer >= tickInterval) {
          d.fireTimer -= tickInterval;
          const targets = es.getEnemiesInRange(d.x, d.y, range);
          targets.forEach(t => {
            const dist = Phaser.Math.Distance.Between(d.x, d.y, t.container.x, t.container.y);
            const falloff = 1 - (dist / range) * 0.75;
            es.damageEnemy(t, (d.cfg.damage || 18) * falloff);
          });
          this._novaGlowFX(d);
        }

        if (d.burnTimer <= 0) {
          this._novaBurnoutFX(d);
          this._removeDefense(d);
        }
        continue;
      }

      // Blocker handled separately
      if (d.key === 'blocker') continue;
    }
  }

  _checkBlockerRingCollision() {
    const blockers = this.placedDefenses.filter(d => d.key === 'blocker' && d.active);
    if (blockers.length === 0) return;

    const L      = CONFIG.layout(this.scene);
    const pX     = L.PLANET_X, pY = L.PLANET_Y;
    const extraR = L.ORBIT_R + 25;
    const es     = this.scene.enemySystem;

    for (const e of es.enemies) {
      if (!e.active) continue;
      const dist = Phaser.Math.Distance.Between(pX, pY, e.container.x, e.container.y);
      if (dist > extraR + e.cfg.radius) continue;
      if (dist > extraR - e.cfg.radius - 4) {
        const b = blockers[Math.floor(Math.random() * blockers.length)];
        es.killEnemy(e, false);
        b.hitsRemaining = (b.hitsRemaining ?? b.cfg.hitsAllowed ?? 1) - 1;
        this._blockerHitFX(b);
        if (b.hitsRemaining <= 0) {
          this._spaceWeaponBurnoutFX(b);
          this._removeDefense(b);
        } else {
          this._updateBlockerRing();
        }
        break;
      }
    }
  }

  _removeDefense(d) {
    // Vortex: vrijlaten van gevangen vijanden
    // — maar NIET als ze al in de sling-fase zitten (die moeten verder vliegen)
    if (d.key === 'vortex' && d.vortexCaptured) {
      for (const e of this.scene.enemySystem.enemies) {
        if (e.vortexOrbit && e.vortexOrbit.owner === d.id) {
          if (e.vortexOrbit.phase !== 'sling') {
            delete e.vortexOrbit;
          }
        }
      }
    }
    // Gravitrap: altijd vrijlaten (geen sling-fase)
    if (d.key === 'gravitrap' && d.gravitrapCaptured) {
      for (const e of this.scene.enemySystem.enemies) {
        if (e.vortexOrbit && e.vortexOrbit.owner === d.id) {
          delete e.vortexOrbit;
          this.scene.enemySystem.removeGravitrapRing?.(e);
        }
      }
    }
    d.active = false;
    d.container?.destroy();
    this.placedDefenses = this.placedDefenses.filter(x => x.id !== d.id);
    if (this.selectedDefense?.id === d.id) this.deselectAll();
    this._updateBlockerRing();
  }

  _updateBlockerRing() {
    const ls = this.scene.layoutSystem;
    if (!ls) return;
    const blockers   = this.placedDefenses.filter(d => d.key === 'blocker' && d.active);
    const count      = blockers.length;
    const totalHits  = blockers.reduce((s, d) => s + (d.hitsRemaining ?? d.cfg.hitsAllowed ?? 1), 0);
    ls.updateBlockerRing(count, totalHits);
  }

  _novaStartFX(d) {
    const gfx = this.scene.add.graphics().setDepth(18);
    gfx.fillStyle(0xffffff, 0.7);
    gfx.fillCircle(d.x, d.y, d.cfg.range || 160);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 400, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  _novaGlowFX(d) {
    const range    = d.cfg.range || 160;
    const burnPct  = Math.max(0, (d.burnTimer || 0) / (d.cfg.burnDuration || 6000));
    const alpha    = 0.07 + burnPct * 0.13;
    const col      = d.cfg.color || 0xffaa00;
    const gfx      = this.scene.add.graphics().setDepth(18);
    gfx.fillStyle(col, alpha);
    gfx.fillCircle(d.x, d.y, range);
    gfx.fillStyle(0xffffff, alpha * 0.5);
    gfx.fillCircle(d.x, d.y, range * 0.3);
    gfx.lineStyle(2, col, Math.min(1, alpha * 3));
    gfx.strokeCircle(d.x, d.y, range);
    this.scene.time.delayedCall(130, () => { if (gfx.active) gfx.destroy(); });
  }

  _novaBurnoutFX(d) {
    const range = d.cfg.range || 160;
    const col   = d.cfg.color || 0xffaa00;
    const gfx = this.scene.add.graphics().setDepth(22);
    gfx.setPosition(d.x, d.y);
    gfx.lineStyle(4, col, 1);
    gfx.strokeCircle(0, 0, range * 0.5);
    gfx.fillStyle(col, 0.4);
    gfx.fillCircle(0, 0, range * 0.5);
    this.scene.tweens.add({
      targets: gfx,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: 600, ease: 'Cubic.easeIn',
      onComplete: () => gfx.destroy(),
    });
  }

  _blockerHitFX(d) {
    const gfx = this.scene.add.graphics().setDepth(22);
    gfx.setPosition(d.x, d.y);
    gfx.lineStyle(3, 0xffffff, 1);
    gfx.strokeCircle(0, 0, 12);
    gfx.fillStyle(d.cfg.color || 0x88aaff, 0.55);
    gfx.fillCircle(0, 0, 12);
    this._drawDefense(d.gfx, d.cfg, d.category, d.upgradeLevel);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 350, ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  _spaceWeaponBurnoutFX(d) {
    const range = d.cfg.range || 160;
    const col   = d.cfg.color || 0x00ffaa;
    const gfx   = this.scene.add.graphics().setDepth(22);
    gfx.setPosition(d.x, d.y);
    gfx.lineStyle(3, col, 0.9);
    gfx.strokeCircle(0, 0, range * 0.4);
    gfx.fillStyle(col, 0.25);
    gfx.fillCircle(0, 0, range * 0.4);
    this.scene.tweens.add({
      targets: gfx, scaleX: 0, scaleY: 0, alpha: 0,
      duration: 500, ease: 'Cubic.easeIn',
      onComplete: () => gfx.destroy(),
    });
  }

  // ── INPUT ─────────────────────────────────────────────────
  _setupInputHandlers() {
    this._teardownInputHandlers();
    const scene = this.scene;

    this._inputHandlers = {
      pointermove: (ptr) => {
        if (this.placingType) this._updateGhost(ptr.x, ptr.y);
      },
      pointerdown: (ptr) => {
        if (ptr.y > CONFIG.layout(this.scene).BAR_Y) return;
        if (this.placingType) {
          this.placeDefense(ptr.x, ptr.y);
        } else {
          const hit = this.placedDefenses.find(d => {
            const dx = d.x - ptr.x, dy = d.y - ptr.y;
            return Math.sqrt(dx * dx + dy * dy) < 24;
          });
          if (!hit) this.deselectAll();
        }
      },
      esc: () => {
        if (this.placingType) this.cancelPlacing();
        else this.deselectAll();
      },
      upgrade: () => this.upgradeSelected(),
    };

    scene.input.on('pointermove', this._inputHandlers.pointermove);
    scene.input.on('pointerdown', this._inputHandlers.pointerdown);
    scene.input.keyboard.on('keydown-ESC', this._inputHandlers.esc);
    scene.input.keyboard.on('keydown-U', this._inputHandlers.upgrade);
  }

  _teardownInputHandlers() {
    const scene = this.scene;
    const h = this._inputHandlers;
    if (!scene || !h) return;
    scene.input.off('pointermove', h.pointermove);
    scene.input.off('pointerdown', h.pointerdown);
    scene.input.keyboard.off('keydown-ESC', h.esc);
    scene.input.keyboard.off('keydown-U', h.upgrade);
    this._inputHandlers = null;
  }
}