// ============================================================
//  UI SYSTEM — all HUD, buttons, overlays
//  Uses CONFIG.layout(scene) for all positions — fully responsive.
// ============================================================

class UISystem {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
    this.statusMsgTimer = null;
  }

  build() {
    this._buildStatsHUD();
    this._buildWaveDisplay();
    this._buildSpeedControls();
    this._buildCubeButtons();
    this._buildSpecialButtons();
    this._buildActionButtons();
    this._buildStatusMsg();
    this._buildDefenseInfoPanel();
    this._buildTestModeBadge();
    if (CONFIG.GAME.TEST_MODE) this._buildTestPanel();
  }

  _L() { return CONFIG.layout(this.scene); }

  _buildStatsHUD() {
    const L = this._L();
    const x = L.STATS_X + Math.round(12 * L.sx);
    const y = L.STATS_Y + Math.round(12 * L.sy);
    const fs = Math.round(18 * L.sy);
    const fsS = Math.round(14 * L.sy);

    this.elements.energyText = this.scene.add.text(x, y, '⚡ Energie: 0', {
      fontSize: `${fs}px`, fill: CONFIG.THEME.ENERGY_COLOR,
      fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
    }).setDepth(70);

    this.elements.shieldText = this.scene.add.text(x, y + Math.round(28 * L.sy), '🛡 Schild: 100%', {
      fontSize: `${fs}px`, fill: CONFIG.THEME.SHIELD_COLOR,
      fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
    }).setDepth(70);

    this.elements.scoreText = this.scene.add.text(x, y + Math.round(56 * L.sy), '★ Score: 0', {
      fontSize: `${fsS}px`, fill: CONFIG.THEME.TEXT_SECONDARY,
      fontFamily: CONFIG.THEME.FONT_MAIN,
    }).setDepth(70);
  }

  updateEnergyDisplay(val) { this.elements.energyText?.setText(`⚡ Energie: ${val}`); }
  updateShieldDisplay(pct) {
    const col = pct > 50 ? CONFIG.THEME.SHIELD_COLOR : pct > 25 ? CONFIG.THEME.TEXT_WARN : CONFIG.THEME.TEXT_DANGER;
    this.elements.shieldText?.setFill(col).setText(`🛡 Schild: ${pct}%`);
  }
  updateScoreDisplay(val) { this.elements.scoreText?.setText(`★ Score: ${val}`); }

  _buildWaveDisplay() {
    const L = this._L();

    this.elements.waveText = this.scene.add.text(L.WAVE_X, L.WAVE_Y, '', {
      fontSize: `${Math.round(28 * L.sy)}px`, fill: '#ff44ff',
      fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(70).setVisible(false);

    this.elements.countdownText = this.scene.add.text(
      L.WAVE_X, L.WAVE_Y + Math.round(38 * L.sy), '', {
        fontSize: `${Math.round(15 * L.sy)}px`, fill: CONFIG.THEME.TEXT_SECONDARY,
        fontFamily: CONFIG.THEME.FONT_MAIN,
      }
    ).setOrigin(1, 0).setDepth(70);

    // Vijandenteller
    this.elements.enemiesText = this.scene.add.text(
      L.WAVE_X, L.WAVE_Y + Math.round(62 * L.sy), '', {
        fontSize: `${Math.round(15 * L.sy)}px`, fill: '#ffaa00',
        fontFamily: CONFIG.THEME.FONT_MAIN,
      }
    ).setOrigin(1, 0).setDepth(70).setVisible(false);

    this._buildPrepCountdown();
  }

  _buildPrepCountdown() {
    const L = this._L();
    const x = L.W / 2;
    const y = Math.round(105 * L.sy);
    const W = Math.round(230 * L.s);
    const H = Math.round(132 * L.s);
    const container = this.scene.add.container(x, y)
      .setDepth(210)
      .setVisible(false)
      .setAlpha(0)
      .setScale(0.92);

    const bg = this.scene.add.graphics();
    this._drawPrepCountdownBg(bg, W, H);
    container.add(bg);

    const ring = this.scene.add.graphics();
    ring.lineStyle(Math.max(2, Math.round(2 * L.s)), 0x00ccff, 0.75);
    ring.strokeCircle(0, Math.round(20 * L.s), Math.round(38 * L.s));
    ring.lineStyle(Math.max(1, Math.round(1 * L.s)), 0xff44ff, 0.5);
    ring.beginPath();
    ring.arc(0, Math.round(20 * L.s), Math.round(48 * L.s), Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330));
    ring.strokePath();
    container.add(ring);

    const label = this.scene.add.text(0, Math.round(-38 * L.s), 'Get ready', {
      fontSize: `${Math.round(20 * L.s)}px`,
      fill: '#aaddff',
      fontFamily: CONFIG.THEME.FONT_MAIN,
      fontStyle: 'bold',
      stroke: '#001122',
      strokeThickness: Math.max(2, Math.round(3 * L.s)),
    }).setOrigin(0.5);
    container.add(label);

    const number = this.scene.add.text(0, Math.round(22 * L.s), '5', {
      fontSize: `${Math.round(68 * L.s)}px`,
      fill: '#ffffff',
      fontFamily: CONFIG.THEME.FONT_MAIN,
      fontStyle: 'bold',
      stroke: '#00ccff',
      strokeThickness: Math.max(3, Math.round(5 * L.s)),
    }).setOrigin(0.5);
    container.add(number);

    const sparkles = [
      this.scene.add.circle(Math.round(-76 * L.s), Math.round(-18 * L.s), Math.max(2, Math.round(3 * L.s)), 0xffffff, 0.9),
      this.scene.add.circle(Math.round(78 * L.s), Math.round(0 * L.s), Math.max(2, Math.round(4 * L.s)), 0x00ffff, 0.85),
      this.scene.add.circle(Math.round(58 * L.s), Math.round(50 * L.s), Math.max(2, Math.round(2.5 * L.s)), 0xff44ff, 0.9),
    ];
    sparkles.forEach(s => container.add(s));

    this.scene.tweens.add({
      targets: ring,
      angle: 360,
      duration: 4200,
      repeat: -1,
      ease: 'Linear',
    });
    this.scene.tweens.add({
      targets: sparkles,
      alpha: 0.25,
      scale: 1.8,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: this.scene.tweens.stagger(160),
    });

    this.elements.prepCountdown = {
      container, bg, ring, label, number, sparkles,
      lastValue: null,
      hideTimer: null,
    };
  }

  _drawPrepCountdownBg(gfx, W, H) {
    gfx.clear();
    gfx.fillStyle(0x020818, 0.82);
    gfx.fillRoundedRect(-W / 2, -H / 2, W, H, 8);
    gfx.lineStyle(2, 0x00ccff, 0.78);
    gfx.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
    gfx.lineStyle(1, 0xff44ff, 0.45);
    gfx.strokeRoundedRect(-W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 6);
  }

  updateWaveDisplay(n) {
    const el = this.elements.waveText;
    if (!el) return;
    if (n <= 0) {
      el.setVisible(false);
    } else {
      el.setText(`Wave ${n}`).setVisible(true);
    }
  }
  updateWaveCountdown(ms) {
    this.elements.countdownText?.setText(ms > 0 ? `Volgende wave: ${(ms/1000).toFixed(1)}s` : '');
    this._updatePrepCountdown(ms);
  }

  _updatePrepCountdown(ms) {
    const el = this.elements.prepCountdown;
    if (!el) return;

    if (ms > 5000) {
      this._setPrepCountdownVisible(false);
      el.lastValue = null;
      return;
    }

    const value = ms <= 0 ? 0 : Math.ceil(ms / 1000);
    this._setPrepCountdownVisible(true);

    if (el.lastValue !== value) {
      el.lastValue = value;
      el.number.setText(`${value}`);
      this._pulsePrepCountdown(value);
    }

    if (ms <= 0 && !el.hideTimer) {
      el.hideTimer = this.scene.time.delayedCall(260, () => {
        this._setPrepCountdownVisible(false);
        el.lastValue = null;
        el.hideTimer = null;
      });
    }
  }

  _setPrepCountdownVisible(visible) {
    const el = this.elements.prepCountdown;
    if (!el || el.container.visible === visible) return;

    this.scene.tweens.killTweensOf(el.container);
    if (visible) {
      el.container.setVisible(true);
      this.scene.tweens.add({
        targets: el.container,
        alpha: 1,
        scale: 1,
        duration: 220,
        ease: 'Back.easeOut',
      });
    } else {
      this.scene.tweens.add({
        targets: el.container,
        alpha: 0,
        scale: 0.92,
        duration: 180,
        ease: 'Cubic.easeIn',
        onComplete: () => el.container.setVisible(false),
      });
    }
  }

  _pulsePrepCountdown(value) {
    const el = this.elements.prepCountdown;
    if (!el) return;

    const warning = value <= 1;
    el.number.setFill(warning ? '#ffff66' : '#ffffff');
    el.number.setStroke(warning ? '#ff44ff' : '#00ccff', Math.max(3, Math.round(5 * this._L().s)));
    this.scene.tweens.killTweensOf([el.number, el.bg]);
    el.number.setScale(0.72).setAlpha(0.65);
    this.scene.tweens.add({
      targets: el.number,
      scale: 1,
      alpha: 1,
      duration: 240,
      ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: el.bg,
      alpha: warning ? 1 : 0.78,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  updateEnemiesRemaining(remaining) {
    const el = this.elements.enemiesText;
    if (!el) return;
    if (remaining === null || remaining === undefined) {
      el.setVisible(false);
    } else {
      el.setText(`Enemies: ${remaining}`).setVisible(true);
    }
  }

  showWaveAnnouncement(wave, count) {
    if (this.elements.announcement) this.elements.announcement.destroy();
    const L = this._L();
    const txt = this.scene.add.text(L.W / 2, Math.round(120 * L.sy),
      `Wave ${wave}\n${count} enemies!`, {
        fontSize: `${Math.round(30 * L.sy)}px`, fill: '#ff44ff',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
        stroke: '#000', strokeThickness: 4,
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.scene.tweens.add({
      targets: txt, alpha: 1, duration: 400, yoyo: true, hold: 2000,
      onComplete: () => txt.destroy(),
    });
    this.elements.announcement = txt;
  }

  _buildSpeedControls() {
    const L = this._L();
    const baseY  = L.SPEED_Y;
    const bW     = L.SPD_BTN_W;
    const bH     = L.SPD_BTN_H;
    const gap    = Math.round(4 * L.sx);
    const speeds = ['½×', '1×', '2×'];
    this.elements.speedBtns = [];

    speeds.forEach((label, i) => {
      const btnX = L.SPEED_BTN_BASE_X + i * (bW + gap);
      const btn  = this._makeButton(btnX, baseY, bW, bH, label, 0x0a1a2e, 0x00ccff, Math.round(13 * L.sy));
      btn._w = bW; btn._h = bH; btn._borderCol = 0x00ccff;
      btn.on('pointerdown', () => this.scene.gameScene?.setSpeed(i));
      this.elements.speedBtns.push(btn);
    });

    const pauseX = L.SPEED_BTN_BASE_X + 3 * (bW + Math.round(4 * L.sx)) + 8;
    this.elements.pauseText = this.scene.add.text(pauseX, baseY - bH / 2 + 4, '', {
      fontSize: `${Math.round(13 * L.sy)}px`, fill: CONFIG.THEME.TEXT_WARN,
      fontFamily: CONFIG.THEME.FONT_MAIN,
    }).setDepth(70);
  }

  highlightSpeedBtn(index) {
    this.elements.speedBtns?.forEach((btn, i) => {
      const active = i === index;
      const w = btn._w ?? 64, h = btn._h ?? 30, bc = btn._borderCol ?? 0x00ccff;
      btn.bg.clear();
      btn.bg.fillStyle(active ? 0x004466 : 0x0a1a2e, 0.95);
      btn.bg.lineStyle(1.5, active ? 0x00ffff : bc, active ? 1 : 0.8);
      btn.bg.fillRoundedRect(-w/2, -h/2, w, h, 6);
      btn.bg.strokeRoundedRect(-w/2, -h/2, w, h, 6);
    });
  }

  showPausedIndicator(paused) {
    this.elements.pauseText?.setText(paused ? '⏸ GEPAUZEERD' : '');
  }

  _buildCubeButtons() {
    const L = this._L();
    this.elements.cubeBtns = {};

    ['a', 'b', 'c'].forEach((id) => {
      const X = L[`CUBE_${id.toUpperCase()}_X`];
      const Y = L.CUBE_Y;
      const W = L.CUBE_W;
      const H = L.CUBE_H;
      const theme = CONFIG.CUBE_COLORS[id];

      const container = this.scene.add.container(X, Y).setDepth(60);

      const sideL = this.scene.add.graphics();
      sideL.fillStyle(theme.border, 0.18);
      sideL.fillRect(-W/2 - 8, -H/2 + 8, 8, H);
      container.add(sideL);

      const sideB = this.scene.add.graphics();
      sideB.fillStyle(theme.border, 0.12);
      sideB.fillRect(-W/2, H/2, W, 8);
      container.add(sideB);

      const bg = this.scene.add.graphics();
      this._drawCubeFace(bg, W, H, theme, false);
      container.add(bg);

      const fs = (v) => Math.round(v * L.sy);

      const catLabel = this.scene.add.text(-W/2 + 6, -H/2 + 5, theme.name, {
        fontSize: `${fs(10)}px`, fill: theme.label,
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
      }).setDepth(61);
      container.add(catLabel);

      const icon = this.scene.add.text(0, fs(-18), '?', {
        fontSize: `${fs(30)}px`,
      }).setOrigin(0.5).setDepth(61);
      container.add(icon);

      const nameT = this.scene.add.text(0, fs(14), '?', {
        fontSize: `${fs(14)}px`, fill: '#ffffff',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(61);
      container.add(nameT);

      const costT = this.scene.add.text(0, fs(32), '⚡ ?', {
        fontSize: `${fs(12)}px`, fill: CONFIG.THEME.ENERGY_COLOR,
        fontFamily: CONFIG.THEME.FONT_MAIN,
      }).setOrigin(0.5).setDepth(61);
      container.add(costT);

      const hotkeyT = this.scene.add.text(W/2 - 6, H/2 - 6,
        id === 'a' ? '[Q]' : id === 'b' ? '[W]' : '[E]', {
          fontSize: `${fs(10)}px`, fill: '#446688',
          fontFamily: CONFIG.THEME.FONT_MAIN,
        }
      ).setOrigin(1, 1).setDepth(61);
      container.add(hotkeyT);

      const hit = this.scene.add.rectangle(0, 0, W, H, 0xffffff, 0).setInteractive().setDepth(62);
      container.add(hit);

      hit.on('pointerover', () => this._drawCubeFace(bg, W, H, theme, true));
      hit.on('pointerout',  () => this._drawCubeFace(bg, W, H, theme, false));
      hit.on('pointerdown', () => {
        const info = this.scene.defenseSystem?.getCurrentCubeDefense(id);
        if (info) this.scene.defenseSystem?.startPlacing(info.category, info.key);
      });

      this.elements.cubeBtns[id] = { container, bg, icon, nameT, costT, hit, theme, W, H };
    });

    this.updateCubeButtons();
    this._setupCubeKeyHandlers();
  }

  _setupCubeKeyHandlers() {
    this._teardownCubeKeyHandlers();
    this._cubeKeyHandlers = {
      a: () => this._triggerCubePlacement('a'),
      b: () => this._triggerCubePlacement('b'),
      c: () => this._triggerCubePlacement('c'),
    };
    const kb = this.scene.input.keyboard;
    kb.on('keydown-Q', this._cubeKeyHandlers.a);
    kb.on('keydown-W', this._cubeKeyHandlers.b);
    kb.on('keydown-E', this._cubeKeyHandlers.c);
  }

  _teardownCubeKeyHandlers() {
    const kb = this.scene?.input?.keyboard;
    const h = this._cubeKeyHandlers;
    if (!kb || !h) return;
    kb.off('keydown-Q', h.a);
    kb.off('keydown-W', h.b);
    kb.off('keydown-E', h.c);
    this._cubeKeyHandlers = null;
  }

  _drawCubeFace(gfx, W, H, theme, hovered) {
    gfx.clear();
    gfx.fillStyle(hovered ? 0x0d2040 : theme.bg, 0.97);
    gfx.fillRoundedRect(-W/2, -H/2, W, H, 8);
    gfx.lineStyle(hovered ? 2 : 1.5, theme.border, hovered ? 1 : 0.75);
    gfx.strokeRoundedRect(-W/2, -H/2, W, H, 8);
    gfx.lineStyle(1, theme.border, 0.4);
    gfx.beginPath(); gfx.moveTo(-W/2+2,-H/2+14); gfx.lineTo(-W/2+2,-H/2+2); gfx.lineTo(-W/2+14,-H/2+2); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(W/2-2,H/2-14);   gfx.lineTo(W/2-2,H/2-2);   gfx.lineTo(W/2-14,H/2-2);  gfx.strokePath();
  }

  _getActiveCubeDef(id) {
    const ds = this.scene.defenseSystem;
    if (!ds) return { key: null, cfg: {} };
    const idx = ds.cubeIndices[id];
    const key = ds.cubeKeys[id][idx];
    const cfg = id === 'a' ? CONFIG.PLANET_DEFENSES[key]
              : id === 'b' ? CONFIG.SPACE_DAMAGE_DEFENSES[key]
              :               CONFIG.SPACE_DEBUFF_DEFENSES[key];
    return { key, cfg };
  }

  _triggerCubePlacement(id) {
    const info = this.scene.defenseSystem?.getCurrentCubeDefense(id);
    if (info?.key) this.scene.defenseSystem?.startPlacing(info.category, info.key);
  }

  // Zet de cube-knoppen terug naar de placeholder-status ('?'), zoals bij
  // de allereerste keer spelen. Nodig bij (her)start van een game, omdat
  // UIScene — en dus deze knoppen — actief blijft na een restart en anders
  // gewoon de laatst getoonde verdedigingen van de vorige sessie zou tonen.
  resetCubeButtons() {
    ['a', 'b', 'c'].forEach(id => {
      const btn = this.elements.cubeBtns?.[id];
      if (!btn) return;
      btn.icon.setText('❓');
      btn.nameT.setText('?');
      btn.costT.setText('⚡ ?');
    });
  }

  updateCubeButtons() {
    ['a', 'b', 'c'].forEach(id => {
      const btn = this.elements.cubeBtns?.[id];
      if (!btn) return;
      const def = this._getActiveCubeDef(id);
      btn.icon.setText(def.cfg?.icon || '❓');
      btn.nameT.setText(def.cfg?.label || '???');
      btn.costT.setText(`⚡ ${def.cfg?.cost ?? '?'}`);
      btn.hit.removeAllListeners('pointerdown');
      btn.hit.on('pointerdown', () => {
        const info = this.scene.defenseSystem?.getCurrentCubeDefense(id);
        if (info) this.scene.defenseSystem?.startPlacing(info.category, info.key);
      });
    });
  }

  animateCubeRotation(nextIndices, onComplete) {
    const cubeIds = ['a', 'b', 'c'];
    let completed = 0;
    cubeIds.forEach((id, i) => {
      const btn = this.elements.cubeBtns?.[id];
      if (!btn) { if (++completed === cubeIds.length) onComplete?.(); return; }

      this.scene.time.delayedCall(i * 120, () => {
        this.scene.tweens.add({
          targets: btn.container, scaleY: 0, scaleX: 0.85,
          duration: 180, ease: 'Cubic.easeIn',
          onComplete: () => {
            const saved = this.scene.defenseSystem.cubeIndices[id];
            this.scene.defenseSystem.cubeIndices[id] = nextIndices[id];
            this._updateSingleCubeBtn(id);
            this.scene.defenseSystem.cubeIndices[id] = saved;

            this.scene.tweens.add({
              targets: btn.container, scaleY: 1.05, scaleX: 1,
              duration: 126, ease: 'Cubic.easeOut',
              onComplete: () => {
                this.scene.tweens.add({
                  targets: btn.container, scaleY: 1,
                  duration: 80, ease: 'Bounce.easeOut',
                  onComplete: () => { if (++completed === cubeIds.length) onComplete?.(); },
                });
              },
            });
          },
        });
      });
    });
  }

  _updateSingleCubeBtn(id) {
    const btn = this.elements.cubeBtns?.[id];
    if (!btn) return;
    const def = this._getActiveCubeDef(id);
    btn.icon.setText(def.cfg?.icon || '❓');
    btn.nameT.setText(def.cfg?.label || '???');
    btn.costT.setText(`⚡ ${def.cfg?.cost ?? '?'}`);
  }

  _buildSpecialButtons() {
    const L = this._L();
    const baseX = L.SPECIAL_X;
    const Y = L.CUBE_Y;
    const keys = Object.keys(CONFIG.SPECIAL_ACTIONS);
    this.elements.specialBtns = {};

    keys.forEach((key, i) => {
      const cfg = CONFIG.SPECIAL_ACTIONS[key];
      const x = baseX + i * Math.round(150 * L.sx);
      this.elements.specialBtns[key] = this._makeSpecialButton(x, Y, key, cfg, L);
    });
  }

  _makeSpecialButton(x, y, key, cfg, L) {
    if (!L) L = this._L();
    const W = Math.round(135 * L.sx), H = Math.round(90 * L.sy);
    const container = this.scene.add.container(x, y).setDepth(60);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081428, 0.95);
    bg.lineStyle(1.5, 0x446688, 0.7);
    bg.fillRoundedRect(-W/2, -H/2, W, H, 6);
    bg.strokeRoundedRect(-W/2, -H/2, W, H, 6);
    container.add(bg);

    const iconT = this.scene.add.text(0, Math.round(-20 * L.sy), cfg.icon, {
      fontSize: `${Math.round(28 * L.sy)}px`,
    }).setOrigin(0.5).setDepth(61);
    container.add(iconT);

    const timerT = this.scene.add.text(0, Math.round(14 * L.sy),
      `${(cfg.initialDelay/1000).toFixed(0)}s`, {
        fontSize: `${Math.round(18 * L.sy)}px`, fill: '#886644',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
      }
    ).setOrigin(0.5).setDepth(61);
    container.add(timerT);

    const hit = this.scene.add.rectangle(0, 0, W, H, 0xffffff, 0).setInteractive().setDepth(62);
    container.add(hit);
    hit.on('pointerdown', () => this.scene.specialActionSystem?.activate(key));

    return { container, bg, timerT, iconT, W, H };
  }

  updateSpecialActionTimer(key, ms) {
    this.elements.specialBtns?.[key]?.timerT.setText(ms > 0 ? `${(ms/1000).toFixed(0)}s` : 'KLAAR');
  }

  updateSpecialAction(key) {
    const btn = this.elements.specialBtns?.[key];
    const action = this.scene.specialActionSystem?.actions[key];
    if (!btn || !action) return;
    const ready = action.state === 'ready';
    const W = btn.W, H = btn.H;
    btn.bg.clear();
    const borderCol = ready ? 0x00ff88 : 0x446688;
    btn.bg.fillStyle(ready ? 0x0d2a1a : 0x081428, 0.95);
    btn.bg.lineStyle(1.5, borderCol, ready ? 1 : 0.5);
    btn.bg.fillRoundedRect(-W/2, -H/2, W, H, 6);
    btn.bg.strokeRoundedRect(-W/2, -H/2, W, H, 6);
    btn.timerT.setFill(ready ? CONFIG.THEME.TEXT_GOOD : '#886644');
  }

  _buildActionButtons() {
    const L   = this._L();
    const Y   = L.ACTION_BTN_Y;
    const bW  = L.BTN_W;
    const bH  = Math.round(90 * L.sy);
    const fs  = Math.round(14 * L.sy);

    const upgBtn = this._makeButton(L.UPGRADE_BTN_X, Y, bW, bH, '⬆ UPGRADE\n[U]', 0x102040, 0x00aaff, fs);
    upgBtn.on('pointerdown', () => this.scene.defenseSystem?.upgradeSelected());
    this.elements.upgradeBtn = upgBtn;

    const remBtn = this._makeButton(L.REMOVE_BTN_X, Y, bW, bH, '🗑 VERWIJDER\n[Del]', 0x200a0a, 0xff4444, fs);
    remBtn.on('pointerdown', () => this.scene.defenseSystem?.removeSelected());
    this.elements.removeBtn = remBtn;
  }

  _buildDefenseInfoPanel() {
    const L = this._L();
    const x = L.STATS_X;
    const y = L.SPEED_Y + L.SPD_BTN_H + Math.round(10 * L.sy);
    const w = L.STATS_W, h = Math.round(280 * L.sy);
    const gfx = this.scene.add.graphics().setDepth(65).setVisible(false);
    gfx.fillStyle(CONFIG.THEME.PANEL_BG, 0.92);
    gfx.fillRoundedRect(x, y, w, h, 8);
    gfx.lineStyle(1.5, 0xffaa00, 0.8);
    gfx.strokeRoundedRect(x, y, w, h, 8);

    const fs = Math.round(13 * L.sy);
    const lineGap = Math.round(20 * L.sy);
    const texts = [];
    for (let i = 0; i < 13; i++) {
      texts.push(this.scene.add.text(x + 12, y + 10 + i * lineGap, '', {
        fontSize: `${fs}px`, fill: '#ccddff', fontFamily: CONFIG.THEME.FONT_MAIN,
      }).setDepth(66).setVisible(false));
    }
    this.elements.defInfoPanel = { gfx, texts };
  }

  showDefenseInfo(defense) {
    const p = this.elements.defInfoPanel;
    if (!p) return;
    p.gfx.setVisible(true);
    const cfg = defense.cfg;
    const nextUpg = (cfg.upgrades || [])[defense.upgradeLevel];
    const accuracy = cfg.baseAccuracy != null
      ? this.scene.defenseSystem?.getAccuracy(defense) : null;
    const instantKill = defense.category === 'planetDefense'
      ? this.scene.defenseSystem?.getInstantKillChance(defense) : null;
    const lines = [
      `${cfg.icon || ''}  ${cfg.label}`,
      `Niveau: ${defense.upgradeLevel}/${(cfg.upgrades||[]).length}`,
      cfg.damage         ? `Schade: ${cfg.damage}` : (cfg.drainRate ? `Drain: ${cfg.drainRate}/s` : ''),
      cfg.range          ? `Bereik: ${Math.round(cfg.range)}` : '',
      (cfg.fireRate || cfg.pulseInterval)
        ? `Rate: ${(1000/(cfg.fireRate||cfg.pulseInterval)).toFixed(1)}/s` : '',
      accuracy != null ? `Nauwkeurigheid: ${Math.round(accuracy * 100)}%` : '',
      instantKill != null ? `Instant kill: ${Math.round(instantKill * 100)}%` : '',
      cfg.activeDuration && cfg.activeDuration > 1
        ? `Actief: ${(cfg.activeDuration/1000).toFixed(0)}s` : '',
      cfg.hitsAllowed != null
        ? `Schild: ${defense.hitsRemaining ?? cfg.hitsAllowed}/${cfg.hitsAllowed} treffers` : '',
      nextUpg ? `── Upgrade ──` : `── Max niveau ──`,
      nextUpg ? `${nextUpg.label} (⚡${nextUpg.cost})` : '',
      `[U] Upgrade`,
      `[Del] Verwijder`,
    ];
    p.texts.forEach((t, i) => {
      const line = lines[i] || '';
      t.setText(line).setVisible(!!line);
    });
  }

  hideDefenseInfo() {
    const p = this.elements.defInfoPanel;
    if (!p) return;
    p.gfx.setVisible(false);
    p.texts.forEach(t => t.setVisible(false));
  }

  _buildStatusMsg() {
    const L = this._L();
    this.elements.statusMsg = this.scene.add.text(
      L.W / 2, L.BAR_Y - Math.round(22 * L.sy), '', {
        fontSize: `${Math.round(15 * L.sy)}px`, fill: CONFIG.THEME.TEXT_WARN,
        fontFamily: CONFIG.THEME.FONT_MAIN, stroke: '#000', strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(80);
  }

  setStatusMsg(msg) { this.elements.statusMsg?.setText(msg); }

  flashMsg(msg) {
    this.elements.statusMsg?.setText(msg);
    if (this.statusMsgTimer) this.scene.time.removeEvent(this.statusMsgTimer);
    this.statusMsgTimer = this.scene.time.delayedCall(2500, () => this.elements.statusMsg?.setText(''));
  }

  _buildTestModeBadge() {
    if (!CONFIG.GAME.TEST_MODE) return;
    const L = this._L();
    this.scene.add.text(L.W / 2, Math.round(6 * L.sy),
      '⚗ TESTMODUS', {
        fontSize: `${Math.round(11 * L.sy)}px`, fill: '#ff8800',
        fontFamily: CONFIG.THEME.FONT_MAIN, stroke: '#000', strokeThickness: 2,
      }
    ).setOrigin(0.5, 0).setDepth(200);
  }

  _buildTestPanel() {
    const L   = this._L();
    const scene = this.scene;

    const groups = [
      { label: 'Planeet',       cat: 'planetDefense',  defs: CONFIG.PLANET_DEFENSES,      color: CONFIG.CUBE_COLORS.a },
      { label: 'Ruimte Aanval', cat: 'spaceDamage',    defs: CONFIG.SPACE_DAMAGE_DEFENSES, color: CONFIG.CUBE_COLORS.b },
      { label: 'Ruimte Debuff', cat: 'spaceDebuff',    defs: CONFIG.SPACE_DEBUFF_DEFENSES, color: CONFIG.CUBE_COLORS.c },
    ];

    const PANEL_H   = Math.round(52 * L.sy);
    const PANEL_Y   = Math.round(20 * L.sy);
    const BTN_H     = Math.round(40 * L.sy);
    const BTN_W     = Math.round(90 * L.sx);
    const BTN_GAP   = Math.round(4  * L.sx);
    const GROUP_GAP = Math.round(14 * L.sx);
    const FS_ICON   = Math.round(16 * L.sy);
    const FS_LABEL  = Math.round(9  * L.sy);
    const DEPTH     = 150;

    const totalBtns = groups.reduce((s, g) => s + Object.keys(g.defs).length, 0);
    const totalGroups = groups.length;
    const totalW = totalBtns * (BTN_W + BTN_GAP) + (totalGroups - 1) * GROUP_GAP;
    let curX = (L.W - totalW) / 2;

    const bg = scene.add.graphics().setDepth(DEPTH - 1);
    bg.fillStyle(0x020c1a, 0.88);
    bg.fillRoundedRect((L.W - totalW) / 2 - 10, PANEL_Y - 4, totalW + 20, PANEL_H + 8, 6);
    bg.lineStyle(1, 0x334455, 0.7);
    bg.strokeRoundedRect((L.W - totalW) / 2 - 10, PANEL_Y - 4, totalW + 20, PANEL_H + 8, 6);

    groups.forEach((group, gi) => {
      const keys = Object.keys(group.defs);

      scene.add.text(curX, PANEL_Y - 2, group.label, {
        fontSize: `${Math.round(9 * L.sy)}px`,
        fill: group.color.label,
        fontFamily: CONFIG.THEME.FONT_MAIN,
      }).setOrigin(0, 1).setDepth(DEPTH);

      keys.forEach((key) => {
        const cfg  = group.defs[key];
        const bx   = curX + (BTN_W / 2);
        const by   = PANEL_Y + BTN_H / 2;

        const btnBg = scene.add.graphics().setDepth(DEPTH);
        this._drawTestBtn(btnBg, BTN_W, BTN_H, group.color, false);
        btnBg.x = bx; btnBg.y = by;

        scene.add.text(bx, by - Math.round(10 * L.sy), cfg.icon || '?', {
          fontSize: `${FS_ICON}px`,
        }).setOrigin(0.5, 0.5).setDepth(DEPTH + 1);

        scene.add.text(bx, by + Math.round(11 * L.sy), cfg.label, {
          fontSize: `${FS_LABEL}px`, fill: '#ccddff',
          fontFamily: CONFIG.THEME.FONT_MAIN,
        }).setOrigin(0.5, 0.5).setDepth(DEPTH + 1);

        const hit = scene.add.rectangle(bx, by, BTN_W, BTN_H, 0xffffff, 0)
          .setInteractive().setDepth(DEPTH + 2);

        hit.on('pointerover', () => this._drawTestBtn(btnBg, BTN_W, BTN_H, group.color, true));
        hit.on('pointerout',  () => this._drawTestBtn(btnBg, BTN_W, BTN_H, group.color, false));
        hit.on('pointerdown', () => {
          const cat = (key === 'minishield' || key === 'blocker') ? 'shieldDefense' : group.cat;
          scene.defenseSystem?.startPlacing(cat, key);
        });

        curX += BTN_W + BTN_GAP;
      });

      if (gi < groups.length - 1) curX += GROUP_GAP;
    });
  }

  _drawTestBtn(gfx, W, H, color, hovered) {
    gfx.clear();
    gfx.fillStyle(hovered ? 0x1a3050 : 0x081428, hovered ? 1 : 0.9);
    gfx.fillRoundedRect(-W/2, -H/2, W, H, 5);
    gfx.lineStyle(1.5, color.border, hovered ? 1 : 0.55);
    gfx.strokeRoundedRect(-W/2, -H/2, W, H, 5);
  }

  showUpgradeChoice(onDone) {
    const L = this._L();
    const W = L.W, H = L.H;
    const overlay = this.scene.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(300);

    this.scene.add.text(W/2, H/2 - Math.round(200 * L.sy),
      '⭐ Kies een Speciale Actie om te upgraden', {
        fontSize: `${Math.round(28 * L.sy)}px`, fill: '#ff44ff',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
      }
    ).setOrigin(0.5).setDepth(301);

    const actions = Object.values(this.scene.specialActionSystem?.actions ?? {});
    const step = Math.round(340 * L.sx);

    actions.forEach((action, i) => {
      const x = W/2 + (i - 1) * step;
      const y = H/2;
      const bW = Math.round(300 * L.sx), bH = Math.round(200 * L.sy);
      const nextUpg = (action.cfg.upgrades || [])[action.upgradeLevel];

      const bg = this.scene.add.graphics().setDepth(301);
      bg.fillStyle(0x0a1a2e, 0.95);
      bg.lineStyle(2, 0x00aaff, 0.8);
      bg.fillRoundedRect(x - bW/2, y - bH/2, bW, bH, 10);
      bg.strokeRoundedRect(x - bW/2, y - bH/2, bW, bH, 10);

      this.scene.add.text(x, y - Math.round(70 * L.sy), action.cfg.icon, {
        fontSize: `${Math.round(40 * L.sy)}px`,
      }).setOrigin(0.5).setDepth(302);

      this.scene.add.text(x, y - Math.round(20 * L.sy), action.cfg.label, {
        fontSize: `${Math.round(18 * L.sy)}px`, fill: '#ffffff',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(302);

      this.scene.add.text(x, y + Math.round(20 * L.sy),
        nextUpg ? `${nextUpg.label}\n⚡ ${nextUpg.cost}` : 'Max niveau', {
          fontSize: `${Math.round(14 * L.sy)}px`, fill: '#aaddff',
          fontFamily: CONFIG.THEME.FONT_MAIN, align: 'center',
        }
      ).setOrigin(0.5).setDepth(302);

      const hit = this.scene.add.rectangle(x, y, bW, bH, 0xffffff, 0).setInteractive().setDepth(303);
      hit.on('pointerdown', () => {
        this.scene.specialActionSystem?.upgradeAction(action.key);
        this._closeUpgradeChoice(onDone);
      });
    });

    // Overslaan-knop — zelfde stijl als "Opnieuw spelen"
    const sbW = Math.round(240 * L.sx);
    const sbH = Math.round(60 * L.sy);
    const sbY = H/2 + Math.round(180 * L.sy);
    const sbFs = Math.round(20 * L.sy);

    const skipBg = this.scene.add.graphics().setDepth(302);
    const drawSkip = (hovered) => {
      skipBg.clear();
      skipBg.fillStyle(hovered ? 0x1a3a1a : 0x0a1a0a, 0.97);
      skipBg.lineStyle(3, hovered ? 0x44ff88 : 0x228844, 1);
      skipBg.fillRoundedRect(W/2 - sbW/2, sbY - sbH/2, sbW, sbH, 12);
      skipBg.strokeRoundedRect(W/2 - sbW/2, sbY - sbH/2, sbW, sbH, 12);
    };
    drawSkip(false);

    this.scene.add.text(W/2, sbY, '» Overslaan', {
      fontSize: `${sbFs}px`, fill: '#ffffff',
      fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(303);

    const skipHit = this.scene.add.rectangle(W/2, sbY, sbW, sbH, 0xffffff, 0)
      .setInteractive().setDepth(304);
    skipHit.on('pointerover',  () => drawSkip(true));
    skipHit.on('pointerout',   () => drawSkip(false));
    skipHit.on('pointerdown',  () => this._closeUpgradeChoice(onDone));
  }

  _closeUpgradeChoice(onDone) {
    this.scene.children.list
      .filter(c => c.depth >= 300 && c.depth <= 304)
      .forEach(c => c.destroy());
    onDone?.();
  }

  // ── WAVE COMPLETED — fade + banner + pauze voor upgrade-scherm ──
  showWaveCompleted(wave, onDone) {
    const L = this._L();
    const W = L.W, H = L.H;

    // Lichte groene flash over het scherm
    const flash = this.scene.add.rectangle(W/2, H/2, W, H, 0x00ff88, 0)
      .setDepth(350);
    this.scene.tweens.add({
      targets: flash, alpha: 0.15, duration: 300, ease: 'Cubic.easeOut',
      yoyo: true, hold: 200,
      onComplete: () => flash.destroy(),
    });

    // Banner achtergrond
    const bannerH = Math.round(110 * L.sy);
    const bannerY = H / 2;
    const bannerBg = this.scene.add.graphics().setDepth(351).setAlpha(0);
    bannerBg.fillStyle(0x020c1a, 0.92);
    bannerBg.fillRoundedRect(W/2 - Math.round(380 * L.sx), bannerY - bannerH/2,
      Math.round(760 * L.sx), bannerH, 14);
    bannerBg.lineStyle(2, 0x00ff88, 0.8);
    bannerBg.strokeRoundedRect(W/2 - Math.round(380 * L.sx), bannerY - bannerH/2,
      Math.round(760 * L.sx), bannerH, 14);

    // Tekst
    const line1 = this.scene.add.text(W/2, bannerY - Math.round(22 * L.sy),
      `Wave ${wave} completed!`, {
        fontSize: `${Math.round(38 * L.sy)}px`, fill: '#00ff88',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
        stroke: '#003322', strokeThickness: 5,
      }
    ).setOrigin(0.5).setDepth(352).setAlpha(0);

    const line2 = this.scene.add.text(W/2, bannerY + Math.round(26 * L.sy),
      'Kies een upgrade...', {
        fontSize: `${Math.round(18 * L.sy)}px`, fill: '#88ddbb',
        fontFamily: CONFIG.THEME.FONT_MAIN,
      }
    ).setOrigin(0.5).setDepth(352).setAlpha(0);

    // Fade in
    this.scene.tweens.add({
      targets: [bannerBg, line1, line2], alpha: 1,
      duration: 400, ease: 'Cubic.easeOut',
    });

    // Na 2 seconden: fade uit, dan upgrade-scherm
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: [bannerBg, line1, line2], alpha: 0,
        duration: 350, ease: 'Cubic.easeIn',
        onComplete: () => {
          bannerBg.destroy();
          line1.destroy();
          line2.destroy();
          onDone?.();
        },
      });
    });
  }

  // ── GAME OVER ─────────────────────────────────────────────
  showGameOver(score, wave) {
    const L = this._L();
    const W = L.W, H = L.H;
    const cx = W / 2;
    const cy = H / 2;

    // Donker overlay
    this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.88).setDepth(400);

    // Rode gloed achter de titel
    const glow = this.scene.add.graphics().setDepth(401);
    glow.fillStyle(0xff0000, 0.08);
    glow.fillCircle(cx, cy - Math.round(80 * L.sy), Math.round(300 * L.s));

    // Titel
    this.scene.add.text(cx, cy - Math.round(160 * L.sy), 'GAME OVER', {
      fontSize: `${Math.round(90 * L.sy)}px`,
      fill: '#ff2222',
      fontFamily: CONFIG.THEME.FONT_MAIN,
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(402);

    // Score-paneel
    const panelW = Math.round(420 * L.sx);
    const panelH = Math.round(120 * L.sy);
    const panelY = cy - Math.round(30 * L.sy);
    const panelGfx = this.scene.add.graphics().setDepth(402);
    panelGfx.fillStyle(0x0a1a2e, 0.92);
    panelGfx.lineStyle(2, 0x334466, 0.9);
    panelGfx.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);
    panelGfx.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);

    this.scene.add.text(cx, panelY - Math.round(22 * L.sy),
      `Wave bereikt: ${wave}`, {
        fontSize: `${Math.round(22 * L.sy)}px`, fill: '#aaddff',
        fontFamily: CONFIG.THEME.FONT_MAIN, align: 'center',
      }
    ).setOrigin(0.5).setDepth(403);

    this.scene.add.text(cx, panelY + Math.round(22 * L.sy),
      `Score: ${score}`, {
        fontSize: `${Math.round(28 * L.sy)}px`, fill: '#ffff44',
        fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold', align: 'center',
      }
    ).setOrigin(0.5).setDepth(403);

    // Opnieuw-knop — groot, duidelijk, met hover-effect
    const btnW = Math.round(300 * L.sx);
    const btnH = Math.round(72 * L.sy);
    const btnY = cy + Math.round(110 * L.sy);
    const btnFs = Math.round(26 * L.sy);

    const btnBg = this.scene.add.graphics().setDepth(403);
    const drawBtn = (hovered) => {
      btnBg.clear();
      btnBg.fillStyle(hovered ? 0x0055cc : 0x003388, 0.97);
      btnBg.lineStyle(3, hovered ? 0x44aaff : 0x0077ff, 1);
      btnBg.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
      btnBg.strokeRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
    };
    drawBtn(false);

    this.scene.add.text(cx, btnY, '↺  OPNIEUW SPELEN', {
      fontSize: `${btnFs}px`, fill: '#ffffff',
      fontFamily: CONFIG.THEME.FONT_MAIN, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(404);

    // Onzichtbaar klikgebied over de knop
    const btnHit = this.scene.add.rectangle(cx, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive().setDepth(405);

    btnHit.on('pointerover',  () => drawBtn(true));
    btnHit.on('pointerout',   () => drawBtn(false));
    btnHit.on('pointerdown',  () => {
      // Stop UIScene en herstart GameScene volledig
      this.scene.gameScene?.enemySystem?.clearAll();
      this.scene.scene.stop('UIScene');
      this.scene.gameScene?.scene.restart();
    });
  }

  _makeButton(x, y, w, h, label, bgCol, borderCol, fontSize = 14) {
    const container = this.scene.add.container(x, y).setDepth(65);

    const bg = this.scene.add.graphics();
    bg.fillStyle(bgCol, 0.95);
    bg.lineStyle(1.5, borderCol, 0.8);
    bg.fillRoundedRect(-w/2, -h/2, w, h, 6);
    bg.strokeRoundedRect(-w/2, -h/2, w, h, 6);
    container.add(bg);

    const txt = this.scene.add.text(0, 0, label, {
      fontSize: `${fontSize}px`, fill: '#ffffff',
      fontFamily: CONFIG.THEME.FONT_MAIN, align: 'center',
    }).setOrigin(0.5);
    container.add(txt);

    const hit = this.scene.add.rectangle(0, 0, w, h, 0xffffff, 0).setInteractive();
    container.add(hit);

    hit.on('pointerover', () => bg.setAlpha(1.2));
    hit.on('pointerout',  () => bg.setAlpha(1));

    container.on  = (evt, fn) => { hit.on(evt, fn); return container; };
    container.bg  = bg;
    container.label = txt;

    return container;
  }
}
