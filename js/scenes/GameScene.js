// ============================================================
//  GAME SCENE — main scene, orchestrates all systems
// ============================================================

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.energy     = CONFIG.GAME.INITIAL_ENERGY;
    this.shieldPct  = CONFIG.GAME.TEST_MODE
      ? CONFIG.GAME.TEST_SHIELD_START
      : CONFIG.GAME.INITIAL_SHIELD;
    this.score      = 0;
    this.paused     = false;
    this.gameOver   = false;
    this._syncPhaserPause(false);
    this.speedIndex = CONFIG.GAME.DEFAULT_SPEED_INDEX;
    this.gameSpeed  = CONFIG.GAME.SPEED_OPTIONS[this.speedIndex];

    // Systems
    this.layoutSystem        = new LayoutSystem(this);
    this.enemySystem         = new EnemySystem(this);
    this.defenseSystem       = new DefenseSystem(this);
    this.specialActionSystem = new SpecialActionSystem(this);
    this.shieldSystem        = this._buildShieldSystem();
    this.waveSystem          = new WaveSystem(this);

    // Build world — LayoutSystem uses scale.width/height
    this.layoutSystem.buildBackground();
    this.layoutSystem.buildPlanet();
    // Sync shield ring with actual starting shieldPct (may differ from 100 in TEST_MODE)
    this.layoutSystem.updateShieldRing(this.shieldPct);
    this.layoutSystem.buildBottomBar();

    // Launch UI scene in parallel (UIScene blijft actief na GameScene-restart)
    this.scene.launch('UIScene');
    this.uiScene = null;
    this._teardownUiReady();
    this._onUiReady = (uiScene) => this._connectUiScene(uiScene);
    const existingUi = this.scene.get('UIScene');
    if (existingUi?.sys?.isActive()) {
      this._connectUiScene(existingUi);
    } else {
      this.events.once('uiReady', this._onUiReady);
    }

    this._setupGlobalKeys();
  }

  shutdown() {
    this._teardownGlobalKeys();
    this._teardownUiReady();
    this.defenseSystem?._teardownInputHandlers?.();
  }

  _connectUiScene(uiScene) {
    this.uiScene = uiScene;
    uiScene.gameScene = this;
    uiScene.defenseSystem = this.defenseSystem;
    uiScene.specialActionSystem = this.specialActionSystem;
    uiScene.enemySystem = this.enemySystem;
    this.uiScene.updateEnergyDisplay(this.energy);
    this.uiScene.updateShieldDisplay(this.shieldPct);
    this.uiScene.updateScoreDisplay(this.score);
    this.uiScene.updateWaveDisplay(0);
    this.uiScene.highlightSpeedBtn(this.speedIndex);
    this.uiScene.resetCubeButtons();
    this.waveSystem.startGame();
  }

  _teardownUiReady() {
    if (this._onUiReady) {
      this.events.off('uiReady', this._onUiReady);
      this._onUiReady = null;
    }
  }

  _buildShieldSystem() {
    const self = this;
    return {
      takeDamage(amount) {
        if (self.gameOver) return;
        const minShield = CONFIG.GAME.TEST_MODE ? CONFIG.GAME.TEST_SHIELD_MIN : 0;
        self.shieldPct = Math.max(minShield, self.shieldPct - amount);
        self.uiScene?.updateShieldDisplay(Math.round(self.shieldPct));
        self.layoutSystem?.updateShieldRing(self.shieldPct);
        self.layoutSystem?.shieldHit();
        // Full-screen red flash — use current scale dimensions
        const W = self.scale.width, H = self.scale.height;
        const flash = self.add.rectangle(W/2, H/2, W, H, 0xff0000, 0.2).setDepth(500);
        self.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
        if (!CONFIG.GAME.TEST_MODE && self.shieldPct <= 0) self._triggerGameOver();
      },
      repair(amount) {
        self.shieldPct = Math.min(CONFIG.GAME.SHIELD_MAX, self.shieldPct + amount);
        self.uiScene?.updateShieldDisplay(Math.round(self.shieldPct));
        self.layoutSystem?.updateShieldRing(self.shieldPct);
      },
    };
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const gs = this.gameSpeed;
    this.enemySystem.update(delta, gs);
    this.defenseSystem.update(delta, gs);
    this.defenseSystem.checkMineCollisions();
    this.defenseSystem._checkBlockerRingCollision();
    this.specialActionSystem.update(delta, gs);
    this.waveSystem.update(delta);
  }

  addEnergy(amount)  { this.energy += amount; this.uiScene?.updateEnergyDisplay(this.energy); }
  spendEnergy(amount) {
    if (!CONFIG.GAME.TEST_MODE) this.energy = Math.max(0, this.energy - amount);
    this.uiScene?.updateEnergyDisplay(this.energy);
  }
  canAfford(amount)  { return CONFIG.GAME.TEST_MODE || this.energy >= amount; }
  addScore(amount)   { this.score += amount; this.uiScene?.updateScoreDisplay(this.score); }

  setSpeed(index) {
    this.speedIndex = Phaser.Math.Clamp(index, 0, CONFIG.GAME.SPEED_OPTIONS.length - 1);
    this.gameSpeed  = CONFIG.GAME.SPEED_OPTIONS[this.speedIndex];
    this.uiScene?.highlightSpeedBtn(this.speedIndex);
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    this._syncPhaserPause(this.paused);
    this.uiScene?.showPausedIndicator(this.paused);
    this.uiScene?.setStatusMsg(this.paused ? '⏸  GEPAUZEERD — Druk P om door te gaan' : '');
  }

  /** Pause/resume Phaser timers and tweens (GameScene + UIScene). */
  _syncPhaserPause(paused) {
    this.time.paused = paused;
    if (paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();

    const ui = this.uiScene ?? this.scene.get('UIScene');
    if (!ui) return;
    ui.time.paused = paused;
    if (paused) ui.tweens.pauseAll();
    else ui.tweens.resumeAll();
  }

  _setupGlobalKeys() {
    this._teardownGlobalKeys();
    this._keyHandlers = {
      pause:     () => this.togglePause(),
      speed0:    () => this.setSpeed(0),
      speed1:    () => this.setSpeed(1),
      speed2:    () => this.setSpeed(2),
      restart:   (e) => {
        if (!e.ctrlKey) return;
        this.enemySystem.clearAll();
        this.scene.restart();
      },
      remove:    () => this.defenseSystem?.removeSelected(),
      skipPrep:  () => this.waveSystem?.skipPrep(),
      freeze:    () => this.specialActionSystem?.activate('freeze'),
      shockwave: () => this.specialActionSystem?.activate('shockwave'),
      repair:    () => this.specialActionSystem?.activate('repair'),
      testMode:  (e) => {
        if (!e.ctrlKey) return;
        CONFIG.GAME.TEST_MODE = !CONFIG.GAME.TEST_MODE;
        this.uiScene?.flashMsg(`Testmodus: ${CONFIG.GAME.TEST_MODE ? 'AAN' : 'UIT'}`);
      },
    };
    const kb = this.input.keyboard;
    kb.on('keydown-P',         this._keyHandlers.pause);
    kb.on('keydown-ONE',      this._keyHandlers.speed0);
    kb.on('keydown-TWO',      this._keyHandlers.speed1);
    kb.on('keydown-THREE',    this._keyHandlers.speed2);
    kb.on('keydown-R',        this._keyHandlers.restart);
    kb.on('keydown-DELETE',   this._keyHandlers.remove);
    kb.on('keydown-BACKSPACE', this._keyHandlers.remove);
    kb.on('keydown-ENTER',    this._keyHandlers.skipPrep);
    kb.on('keydown-F',        this._keyHandlers.freeze);
    kb.on('keydown-G',        this._keyHandlers.shockwave);
    kb.on('keydown-H',        this._keyHandlers.repair);
    kb.on('keydown-T',       this._keyHandlers.testMode);
  }

  _teardownGlobalKeys() {
    const kb = this.input?.keyboard;
    const h  = this._keyHandlers;
    if (!kb || !h) return;
    kb.off('keydown-P',          h.pause);
    kb.off('keydown-ONE',        h.speed0);
    kb.off('keydown-TWO',        h.speed1);
    kb.off('keydown-THREE',      h.speed2);
    kb.off('keydown-R',          h.restart);
    kb.off('keydown-DELETE',     h.remove);
    kb.off('keydown-BACKSPACE',  h.remove);
    kb.off('keydown-ENTER',      h.skipPrep);
    kb.off('keydown-F',          h.freeze);
    kb.off('keydown-G',          h.shockwave);
    kb.off('keydown-H',          h.repair);
    kb.off('keydown-T',          h.testMode);
    this._keyHandlers = null;
  }

  _triggerGameOver() {
    this.gameOver = true;
    this.enemySystem.clearAll();
    this.paused = true;
    this._syncPhaserPause(true);
    this.uiScene?.showGameOver(this.score, this.waveSystem.currentWave);
  }
}
