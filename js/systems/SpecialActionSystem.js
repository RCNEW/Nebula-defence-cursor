// ============================================================
//  SPECIAL ACTION SYSTEM — freeze / shockwave / repair
// ============================================================

class SpecialActionSystem {
  constructor(scene) {
    this.scene = scene;
    this.actions = {};

    for (const [key, baseCfg] of Object.entries(CONFIG.SPECIAL_ACTIONS)) {
      this.actions[key] = {
        key,
        cfg: { ...baseCfg },
        timer: baseCfg.initialDelay,
        state: 'waiting',
        upgradeLevel: 0,
      };
    }
  }

  update(delta, gameSpeed) {
    for (const a of Object.values(this.actions)) {
      if (a.state === 'waiting' || a.state === 'cooldown') {
        a.timer -= delta * gameSpeed;
        if (a.timer <= 0) {
          a.timer = 0;
          a.state = 'ready';
          this.scene.uiScene?.updateSpecialAction(a.key);
        }
        this.scene.uiScene?.updateSpecialActionTimer(a.key, a.timer);
      }
    }
  }

  activate(key) {
    const a = this.actions[key];
    if (!a || a.state !== 'ready') return false;

    a.state = 'cooldown';
    a.timer = a.cfg.cooldown;
    this.scene.uiScene?.updateSpecialAction(key);

    switch (key) {
      case 'freeze':    this._doFreeze(a); break;
      case 'shockwave': this._doShockwave(a); break;
      case 'repair':    this._doRepair(a); break;
    }
    return true;
  }

  _doFreeze(a) {
    const duration = a.cfg.duration ?? 5000;
    this.scene.enemySystem.freezeAll(duration);
    this._fxFreeze();
    if (a.cfg.thawDamage) {
      this.scene.time.delayedCall(duration, () => {
        this.scene.enemySystem.enemies.forEach(e => {
          this.scene.enemySystem.damageEnemy(e, a.cfg.thawDamage);
        });
      });
    }
  }

  _doShockwave(a) {
    const L = CONFIG.layout(this.scene);
    const pX = L.PLANET_X;
    const pY = L.PLANET_Y;
    const maxR = Math.max(L.W, L.H);
    this._fxShockwave(pX, pY, maxR);

    for (const e of this.scene.enemySystem.enemies) {
      if (!e.active) continue;
      const dist = Phaser.Math.Distance.Between(e.container.x, e.container.y, pX, pY);
      const ratio = 1 - Math.min(1, dist / maxR);
      const dmg = a.cfg.baseDamage + (a.cfg.maxDamage - a.cfg.baseDamage) * ratio;
      this.scene.enemySystem.damageEnemy(e, Math.round(dmg));
    }

    if (a.cfg.doubleWave) {
      this.scene.time.delayedCall(600, () => this._fxShockwave(pX, pY, maxR));
    }
  }

  _doRepair(a) {
    const amount = a.cfg.repairAmount ?? 10;
    this.scene.shieldSystem?.repair(amount);
    this._fxRepair();
  }

  upgradeAction(key) {
    const a = this.actions[key];
    if (!a) return false;
    const upgrades = a.cfg.upgrades;
    if (!upgrades || a.upgradeLevel >= upgrades.length) return false;

    const upg = upgrades[a.upgradeLevel];
    const cost = CONFIG.GAME.TEST_MODE ? 0 : upg.cost;
    if (!this.scene.canAfford(cost)) {
      this.scene.uiScene?.flashMsg('Niet genoeg energie!');
      return false;
    }
    this.scene.spendEnergy(cost);

    const c = a.cfg;
    if (upg.mult !== undefined) c[upg.stat] = Math.round((c[upg.stat] ?? 0) * upg.mult);
    if (upg.add  !== undefined) c[upg.stat] = (c[upg.stat] ?? 0) + upg.add;
    if (upg.value !== undefined) c[upg.stat] = upg.value;

    a.upgradeLevel++;
    this.scene.uiScene?.flashMsg(`${a.cfg.label} geüpgraded!`);
    return true;
  }

  _fxFreeze() {
    const L = CONFIG.layout(this.scene);
    const scene = this.scene;

    const overlay = scene.add.rectangle(
      L.W / 2, L.H / 2, L.W, L.H, 0x66aaff, 0.32
    ).setDepth(200);
    scene.tweens.add({
      targets: overlay, alpha: 0, duration: 1100,
      onComplete: () => overlay.destroy(),
    });

    const ring = scene.add.graphics().setDepth(199);
    ring.setPosition(L.PLANET_X, L.PLANET_Y);
    ring.lineStyle(3, 0x99ddff, 0.7);
    ring.strokeCircle(0, 0, L.ORBIT_R + 40);
    ring.lineStyle(1.5, 0xffffff, 0.35);
    ring.strokeCircle(0, 0, L.PLANET_R + 25);
    scene.tweens.add({
      targets: ring,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  _fxShockwave(x, y, maxR) {
    const ring = this.scene.add.graphics().setDepth(200);
    ring.lineStyle(4, 0xff8800, 1);
    ring.strokeCircle(0, 0, 10);
    ring.x = x; ring.y = y;
    this.scene.tweens.add({
      targets: ring,
      scaleX: maxR / 10, scaleY: maxR / 10,
      alpha: 0, duration: 1200,
      onComplete: () => ring.destroy(),
    });
  }

  _fxRepair() {
    const L = CONFIG.layout(this.scene);
    const glow = this.scene.add.graphics().setDepth(200);
    glow.fillStyle(0x00ff88, 0.3);
    glow.fillCircle(L.PLANET_X, L.PLANET_Y, L.PLANET_R + 20);
    this.scene.tweens.add({
      targets: glow, alpha: 0, duration: 1000,
      onComplete: () => glow.destroy(),
    });
  }
}
