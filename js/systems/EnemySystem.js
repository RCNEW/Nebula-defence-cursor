// ============================================================
//  ENEMY SYSTEM — creates, tracks and manages all enemies
// ============================================================

class EnemySystem {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];          // active enemy objects
    this.group = scene.add.group();
  }

  // ── SPAWN ──────────────────────────────────────────────────
  spawnEnemy(type, fromLeft = true) {
    const cfg = CONFIG.getEnemyConfig(
      type,
      this.scene.waveSystem?.waveDifficultyMult ?? 1.0,
      CONFIG.GAME.TEST_MODE ? CONFIG.TEST_ENEMY_STRENGTH_MULTIPLIER : null
    );
    if (!cfg) return null;

    const L = CONFIG.layout(this.scene);
    const W = L.W;
    const H = L.H;
    const startX = fromLeft ? -50 : W + 50;
    const startY = Phaser.Math.Between(80, L.BAR_Y - 60);

    const speed = cfg.speed * (this.scene.gameSpeed ?? 1);

    // Graphics container
    const container = this.scene.add.container(startX, startY);

    // Body
    const body = this.scene.add.graphics();
    this._drawEnemyBody(body, cfg, type);
    container.add(body);

    // Health bar background
    const hbBg = this.scene.add.graphics();
    hbBg.fillStyle(0x333333);
    hbBg.fillRect(-cfg.radius, -cfg.radius - 12, cfg.radius * 2, 7);
    container.add(hbBg);

    // Health bar fill
    const hbFill = this.scene.add.graphics();
    container.add(hbFill);

    // Label (boss only)
    let label = null;
    if (type === 'boss') {
      label = this.scene.add.text(0, -cfg.radius - 22, cfg.label, {
        fontSize: '11px', fill: '#ff4444', fontFamily: CONFIG.THEME.FONT_MAIN,
      }).setOrigin(0.5);
      container.add(label);
    }

    // Steering-gedrag: elke vijand krijgt eigen willekeurige variatie zodat
    // de vlucht van geen twee vijanden hetzelfde aanvoelt.
    const M = CONFIG.MOVEMENT;

    const enemy = {
      container,
      body,
      hbFill,
      cfg,
      type,
      maxHp: cfg.hp,
      hp: cfg.hp,
      fromLeft,
      frozen: false,
      frozenTimer: 0,
      slowed: false,
      slowFactor: 1.0,
      slowTimer: 0,
      stunned: false,
      stunTimer: 0,
      netted: false,
      netTimer: 0,
      netDamagePerSec: 0,
      netSlowFactor: 1.0,
      netRing: null,
      iceShell: null,
      gravTrapRing: null,
      speed: cfg.speed,
      active: true,
      reachedPlanet: false,

      // ── Steering state ──────────────────────────────────
      heading: null,        // huidige vlieghoek (rad); null = nog niet geïnitialiseerd
      wanderOffset: 0,      // huidige afwijking t.o.v. de directe koers naar de planeet
      wanderTarget: 0,      // doel-afwijking waar wanderOffset naar toe interpoleert
      wanderTimer: Phaser.Math.Between(M.WANDER_CHANGE_MIN, M.WANDER_CHANGE_MAX),
      wanderScale: Phaser.Math.FloatBetween(M.WANDER_SCALE_MIN, M.WANDER_SCALE_MAX),
      steerRate: M.STEER_RATE * (1 + Phaser.Math.FloatBetween(-1, 1) * M.STEER_RATE_VARIATION),
    };

    this._updateHealthBar(enemy);
    this.enemies.push(enemy);
    return enemy;
  }

  _drawEnemyBody(gfx, cfg, type) {
    gfx.clear();
    // Glow
    gfx.fillStyle(cfg.color, 0.25);
    gfx.fillCircle(0, 0, cfg.radius + 6);
    // Body
    gfx.fillStyle(cfg.color, 0.9);
    gfx.fillCircle(0, 0, cfg.radius);
    // Inner shine
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillCircle(-cfg.radius * 0.3, -cfg.radius * 0.3, cfg.radius * 0.35);
  }

  _updateHealthBar(enemy) {
    const r = enemy.cfg.radius;
    const pct = Math.max(0, enemy.hp / enemy.maxHp);
    const w = r * 2;
    enemy.hbFill.clear();
    const col = pct > 0.5 ? 0x00ff66 : pct > 0.25 ? 0xffaa00 : 0xff2222;
    enemy.hbFill.fillStyle(col);
    enemy.hbFill.fillRect(-r, -r - 12, w * pct, 7);
  }

  // ── UPDATE ─────────────────────────────────────────────────
  update(delta, gameSpeed) {
    const L = CONFIG.layout(this.scene);
    const planetX = L.PLANET_X;
    const planetY = L.PLANET_Y;
    const shieldR = L.ORBIT_R;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) { this.enemies.splice(i, 1); continue; }

      // Status timers
      if (e.frozen) {
        e.frozenTimer -= delta;
        if (e.frozenTimer <= 0) {
          e.frozen = false;
          this._removeFreezeVisual(e);
        } else if (e.iceShell?.active) {
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.007);
          e.iceShell.setAlpha(0.5 + pulse * 0.4);
        }
      }
      if (e.slowed && !e.frozen) {
        e.slowTimer -= delta;
        if (e.slowTimer <= 0) { e.slowed = false; e.slowFactor = 1.0; }
      }
      if (e.stunned) {
        e.stunTimer -= delta;
        if (e.stunTimer <= 0) { e.stunned = false; }
      }

      if (e.netted) {
        e.netTimer -= delta;
        if (e.netTimer <= 0) {
          e.netted = false; e.netDamagePerSec = 0; e.netSlowFactor = 1.0;
          if (e.netRing) { e.netRing.destroy(); e.netRing = null; }
        } else {
          this.damageEnemy(e, e.netDamagePerSec * (delta / 1000));
          if (e.netRing) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
            e.netRing.setAlpha(0.55 + pulse * 0.35);
          }
        }
      }

      if (e.gravTrapRing) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
        e.gravTrapRing.setAlpha(0.35 + pulse * 0.45);
        e.gravTrapRing.setScale(0.96 + pulse * 0.1);
      }

      if (e.frozen || e.stunned) continue;

      // ── VORTEX ORBIT — volledig eigen bewegingssysteem ──────
      // Als een vijand in orbit is, vervangen we de normale planeetbeweging
      // volledig door een cirkelbaan-berekening op basis van hoek + straal.
      // Geen krachten, geen botsende vectoren → geen bibberen.
      if (e.vortexOrbit) {
        const orb = e.vortexOrbit;
        const dt = (delta / 1000) * gameSpeed;

        // Fase A: vijand beweegt naar de orbitstraal toe (zachte nadering)
        if (orb.phase === 'pull') {
          const dx = orb.cx - e.container.x;
          const dy = orb.cy - e.container.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const targetDist = orb.radius;

          if (dist <= targetDist + 4) {
            // Op orbitafstand — initialiseer hoek en ga naar orbit-fase
            orb.angle = Math.atan2(e.container.y - orb.cy, e.container.x - orb.cx);
            orb.phase = 'orbit';
          } else {
            // Beweeg naar een punt op de orbitring (niet naar het midden!)
            // Bereken het dichtstbijzijnde punt op de ring
            const nx = dx / dist;
            const ny = dy / dist;
            // Punt op de ring in de richting van de vijand vanuit het centrum
            const ringX = orb.cx - nx * orb.radius;
            const ringY = orb.cy - ny * orb.radius;
            const rdx = ringX - e.container.x;
            const rdy = ringY - e.container.y;
            const rDist = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
            const diameter = (e.cfg.radius || 18) * 2;
            const sizePullFactor = Math.max(0.18, Math.min(1.4, Math.pow(36 / diameter, 1.6)));
            const moveStep = Math.min(orb.pullSpeed * sizePullFactor * dt, rDist);
            e.container.x += (rdx / rDist) * moveStep;
            e.container.y += (rdy / rDist) * moveStep;
          }
          e.container.rotation += 0.04 * gameSpeed;
          continue;
        }

        // Fase B: orbit — vijand zweeft op vaste straal rond het centrum
        if (orb.phase === 'orbit') {
          orb.angle += orb.orbitSpeed * dt;
          e.container.x = orb.cx + Math.cos(orb.angle) * orb.radius;
          e.container.y = orb.cy + Math.sin(orb.angle) * orb.radius;
          e.container.rotation += 0.03 * gameSpeed;
          continue; // geen planeetcheck — vijand zit vast in orbit
        }

        // Fase C: wegslingerd — beweeg in geslingerde richting en rem af
        if (orb.phase === 'sling') {
          e.container.x += orb.vx * dt;
          e.container.y += orb.vy * dt;
          // Rem licht af (luchtweerstand-gevoel)
          const FRICTION = Math.pow(0.94, delta / 16.67);
          orb.vx *= FRICTION;
          orb.vy *= FRICTION;
          // Als de snelheid laag genoeg is: terug naar normale beweging
          const vel = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
          if (vel < 30) {
            delete e.vortexOrbit;
          }
          e.container.rotation += 0.06 * gameSpeed;
          continue;
        }

        continue; // onbekende fase — sla over
      }

      // ── Standaard beweging richting planeet — steering-gedrag ──
      // In plaats van rechtstreeks of via een vaste sinus te bewegen, stuurt
      // de vijand zijn koers continu en vloeiend bij richting de planeet, met
      // een langzaam driftende "wander"-afwijking erbovenop. Dat voorkomt zowel
      // schokkerigheid (geen harde richtingsveranderingen) als voorspelbaarheid
      // (geen herkenbaar sinuspatroon) en geeft een organisch vlieggevoel.
      const combinedSlow = e.netted ? Math.min(e.slowFactor, e.netSlowFactor) : e.slowFactor;
      const effSpeed = e.speed * combinedSlow * gameSpeed;
      const dx = planetX - e.container.x;
      const dy = planetY - e.container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= shieldR + e.cfg.radius) {
        this._enemyReachedPlanet(e);
        continue;
      }

      const M = CONFIG.MOVEMENT;
      const dtScaled = (delta / 1000) * gameSpeed; // voor timing/smoothing — schaalt mee met gamesnelheid
      const rawDt = delta / 1000;                  // voor verplaatsing — effSpeed heeft gameSpeed al verwerkt

      // Wander-hoek: kiest af en toe een nieuw willekeurig doel en glijdt daar
      // vloeiend naartoe (geen abrupte sprongen).
      e.wanderTimer -= delta * gameSpeed;
      if (e.wanderTimer <= 0) {
        e.wanderTarget = Phaser.Math.FloatBetween(-1, 1) * M.WANDER_STRENGTH * e.wanderScale;
        e.wanderTimer = Phaser.Math.Between(M.WANDER_CHANGE_MIN, M.WANDER_CHANGE_MAX);
      }
      const wanderLerp = 1 - Math.exp(-M.WANDER_SMOOTHING * dtScaled);
      e.wanderOffset += (e.wanderTarget - e.wanderOffset) * wanderLerp;

      // Gewenste koers = richting planeet + wander-afwijking
      const desiredAngle = Math.atan2(dy, dx) + e.wanderOffset;

      // Huidige koers zachtjes bijsturen richting de gewenste hoek (kortste
      // weg rond de cirkel, exponentiële smoothing i.p.v. sprongen).
      if (e.heading === null) e.heading = desiredAngle;
      const angleDiff = Phaser.Math.Angle.Wrap(desiredAngle - e.heading);
      const steerLerp = 1 - Math.exp(-e.steerRate * dtScaled);
      e.heading += angleDiff * steerLerp;

      e.container.x += Math.cos(e.heading) * effSpeed * rawDt;
      e.container.y += Math.sin(e.heading) * effSpeed * rawDt;
      e.container.rotation += 0.01 * gameSpeed;
    }
  }

  _enemyReachedPlanet(enemy) {
    this.scene.layoutSystem?.shieldHit();
    if (!CONFIG.GAME.TEST_MODE) {
      this.scene.shieldSystem?.takeDamage(enemy.cfg.damage);
    }
    this.killEnemy(enemy, false);
  }

  // ── DAMAGE ────────────────────────────────────────────────
  damageEnemy(enemy, amount) {
    if (!enemy.active) return;
    enemy.hp = Math.max(0, enemy.hp - amount);
    this._updateHealthBar(enemy);
    if (enemy.hp <= 0) {
      this.killEnemy(enemy, true);
    } else {
      this._flashEnemyHit(enemy);
    }
  }

  _flashEnemyHit(enemy) {
    if (!enemy.container?.active) return;
    if (enemy._hitTween) {
      enemy._hitTween.stop();
      enemy._hitTween = null;
    }
    enemy.container.setAlpha(1);
    enemy._hitTween = this.scene.tweens.add({
      targets: enemy.container,
      alpha: 0.25,
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        enemy._hitTween = null;
        if (enemy.container?.active) enemy.container.setAlpha(1);
      },
    });
  }

  damageAllEnemies(amount) {
    for (const e of this.enemies) this.damageEnemy(e, amount);
  }

  // EMP Disruptor: verlaag vijand één tier
  degradeEnemy(enemy) {
    if (!enemy.active) return;
    const order = CONFIG.ENEMY_TIER_ORDER;
    const idx   = order.indexOf(enemy.type);
    if (idx <= 0) {
      this.killEnemy(enemy, true);
      return;
    }
    const newType = order[idx - 1];
    const newCfg  = CONFIG.getEnemyConfig(newType);
    if (!newCfg) { this.killEnemy(enemy, true); return; }

    enemy.type   = newType;
    enemy.cfg    = newCfg;
    enemy.maxHp  = newCfg.hp;
    enemy.hp     = Math.min(enemy.hp, newCfg.hp);
    enemy.speed  = newCfg.speed;

    this._drawEnemyBody(enemy.body, newCfg, newType);
    this._updateHealthBar(enemy);

    this.scene.tweens.add({
      targets: enemy.container, alpha: 0.2, duration: 80, yoyo: true, repeat: 2,
      onComplete: () => { enemy.container.setAlpha(1); },
    });
  }

  freezeAll(duration) {
    for (const e of this.enemies) {
      if (!e.active) continue;
      e.frozen = true;
      e.frozenTimer = Math.max(e.frozenTimer, duration);
      this._applyFreezeVisual(e);
    }
  }

  _drawIceShell(gfx, radius, seed) {
    gfx.clear();
    const r = radius + 9;

    gfx.fillStyle(0x66bbff, 0.38);
    gfx.fillCircle(0, 0, r);
    gfx.fillStyle(0xffffff, 0.22);
    gfx.fillCircle(-r * 0.28, -r * 0.32, r * 0.42);
    gfx.fillStyle(0x224466, 0.12);
    gfx.fillCircle(r * 0.2, r * 0.25, r * 0.35);

    gfx.lineStyle(2.2, 0x99eeff, 0.9);
    gfx.strokeCircle(0, 0, r);
    gfx.lineStyle(1, 0xffffff, 0.45);
    gfx.strokeCircle(0, 0, r * 0.88);

    const cracks = 6;
    for (let i = 0; i < cracks; i++) {
      const a = (i / cracks) * Math.PI * 2 + seed * 0.41;
      const len = r * (0.55 + ((i * 17 + seed) % 5) * 0.08);
      const jag = 0.15 + ((i * 3 + seed) % 7) * 0.04;
      const x0 = Math.cos(a) * r * 0.12;
      const y0 = Math.sin(a) * r * 0.12;
      const x1 = Math.cos(a + jag) * len * 0.55;
      const y1 = Math.sin(a + jag) * len * 0.55;
      const x2 = Math.cos(a - jag * 1.3) * len;
      const y2 = Math.sin(a - jag * 1.3) * len;

      gfx.lineStyle(1.4, 0xffffff, 0.75);
      gfx.beginPath();
      gfx.moveTo(x0, y0);
      gfx.lineTo(x1, y1);
      gfx.lineTo(x2, y2);
      gfx.strokePath();

      gfx.lineStyle(0.9, 0x336688, 0.45);
      gfx.beginPath();
      gfx.moveTo(x0, y0);
      gfx.lineTo(x1 * 0.92, y1 * 0.92);
      gfx.strokePath();
    }

    gfx.lineStyle(1, 0xffffff, 0.35);
    for (let j = 0; j < 3; j++) {
      const ca = seed * 0.9 + j * 2.1;
      gfx.lineBetween(
        Math.cos(ca) * r * 0.3, Math.sin(ca) * r * 0.3,
        Math.cos(ca + 0.5) * r * 0.7, Math.sin(ca + 0.5) * r * 0.7,
      );
    }
  }

  _applyFreezeVisual(enemy) {
    if (!enemy.active) return;
    const r = enemy.cfg.radius || 18;
    const seed = (enemy.type?.length ?? 0) * 1.7 + r;

    enemy.body.setAlpha(0.72);

    if (!enemy.iceShell?.active) {
      const shell = this.scene.add.graphics();
      this._drawIceShell(shell, r, seed);
      const bodyIdx = enemy.container.getIndex(enemy.body);
      enemy.container.addAt(shell, bodyIdx + 1);
      enemy.iceShell = shell;
      shell.setScale(0.2);
      shell.setAlpha(0);
      this.scene.tweens.add({
        targets: shell,
        scaleX: 1,
        scaleY: 1,
        alpha: 0.85,
        duration: 220,
        ease: 'Back.easeOut',
      });
      this._spawnFreezeBurst(enemy.container.x, enemy.container.y, r);
    } else {
      this._drawIceShell(enemy.iceShell, r, seed);
    }
  }

  _removeFreezeVisual(enemy) {
    if (enemy.body?.active) enemy.body.setAlpha(1);
    if (enemy.iceShell) {
      const shell = enemy.iceShell;
      enemy.iceShell = null;
      if (!shell.active) return;
      this.scene.tweens.add({
        targets: shell,
        alpha: 0,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 280,
        ease: 'Cubic.easeIn',
        onComplete: () => shell.destroy(),
      });
    }
  }

  _spawnFreezeBurst(x, y, radius) {
    const gfx = this.scene.add.graphics().setDepth(18);
    gfx.setPosition(x, y);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const dist = radius + Phaser.Math.Between(4, 14);
      gfx.fillStyle(0xcceeff, 0.85);
      gfx.fillCircle(Math.cos(a) * dist, Math.sin(a) * dist, Phaser.Math.Between(2, 4));
    }
    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy(),
    });
  }

  killEnemy(enemy, giveReward) {
    if (!enemy.active) return;
    enemy.deathX = enemy.container.x;
    enemy.deathY = enemy.container.y;
    enemy.active = false;
    if (enemy.netRing) { enemy.netRing.destroy(); enemy.netRing = null; }
    if (enemy.iceShell) { enemy.iceShell.destroy(); enemy.iceShell = null; }
    this.removeGravitrapRing(enemy);

    if (giveReward) {
      this.scene.addEnergy(enemy.cfg.energyReward);
      this.scene.addScore(enemy.cfg.scoreReward ?? 10);
      this._spawnDeathFX(enemy.deathX, enemy.deathY, enemy.cfg.color);
      this._spawnFloatingReward(
        enemy.deathX,
        enemy.deathY,
        enemy.cfg.energyReward,
        enemy.cfg.scoreReward ?? 10,
      );
    }

    enemy.container.destroy();
    this.scene.waveSystem?.onEnemyKilled();
  }

  _spawnDeathFX(x, y, color) {
    const particles = this.scene.add.graphics();
    particles.fillStyle(color, 0.8);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const r = Phaser.Math.Between(10, 30);
      particles.fillCircle(x + Math.cos(ang) * r, y + Math.sin(ang) * r, 3);
    }
    this.scene.tweens.add({
      targets: particles,
      alpha: 0,
      duration: 500,
      onComplete: () => particles.destroy(),
    });
  }

  _spawnFloatingReward(x, y, energy, score) {
    const L = CONFIG.layout(this.scene);
    const fs = Math.max(12, Math.round(14 * L.s));
    const lineGap = Math.round(16 * L.sy);
    const rise = Math.round(36 * L.sy);
    const lines = [];
    if (energy > 0) lines.push({ t: `+${energy} ⚡`, fill: CONFIG.THEME.ENERGY_COLOR });
    if (score > 0) lines.push({ t: `+${score} ★`, fill: CONFIG.THEME.TEXT_SECONDARY });

    lines.forEach((line, i) => {
      const startY = y - i * lineGap;
      const txt = this.scene.add.text(x, startY, line.t, {
        fontSize: `${fs}px`,
        fill: line.fill,
        fontFamily: CONFIG.THEME.FONT_MAIN,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(24);

      this.scene.tweens.add({
        targets: txt,
        y: startY - rise,
        alpha: 0,
        duration: 850,
        ease: 'Cubic.easeOut',
        onComplete: () => txt.destroy(),
      });
    });
  }

  getEnemiesInRange(x, y, range) {
    return this.enemies.filter(e => {
      if (!e.active) return false;
      const dx = e.container.x - x;
      const dy = e.container.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= range;
    });
  }

  getNearestEnemy(x, y, range) {
    let nearest = null;
    let best = Infinity;
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.container.x - x;
      const dy = e.container.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= range && d < best) { best = d; nearest = e; }
    }
    return nearest;
  }

  getNearestEnemyNotNetted(x, y, range) {
    let nearest = null, best = Infinity;
    for (const e of this.enemies) {
      if (!e.active || e.netted) continue;
      const dx = e.container.x - x, dy = e.container.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= range && d < best) { best = d; nearest = e; }
    }
    return nearest;
  }

  applyNet(enemy, damagePerSec, duration, slowFactor, color) {
    if (!enemy || !enemy.active) return;
    enemy.netted = true;
    enemy.netTimer = Math.max(enemy.netTimer, duration);
    enemy.netDamagePerSec = Math.max(enemy.netDamagePerSec, damagePerSec);
    enemy.netSlowFactor = Math.min(enemy.netSlowFactor, slowFactor);
    if (!enemy.netRing) {
      const r = (enemy.cfg.radius || 18) + 7;
      const ring = this.scene.add.graphics();
      ring.lineStyle(2.5, color, 0.9);
      ring.strokeCircle(0, 0, r);
      for (let a = 0; a < Math.PI; a += Math.PI / 3) {
        ring.lineStyle(1, color, 0.5);
        ring.lineBetween(
          Math.cos(a) * r, Math.sin(a) * r,
          Math.cos(a + Math.PI) * r, Math.sin(a + Math.PI) * r
        );
      }
      ring.lineStyle(1, color, 0.4);
      ring.strokeCircle(0, 0, r * 0.55);
      ring.setDepth(15);
      enemy.container.add(ring);
      enemy.netRing = ring;
    }
  }

  applyGravitrapRing(enemy) {
    if (!enemy || !enemy.active || enemy.gravTrapRing) return;
    const r = (enemy.cfg.radius || 18) + 10;
    const ring = this.scene.add.graphics();
    ring.lineStyle(2.5, 0xff2222, 0.85);
    ring.strokeCircle(0, 0, r);
    ring.lineStyle(1, 0xff6666, 0.45);
    ring.strokeCircle(0, 0, r + 4);
    ring.setDepth(16);
    enemy.container.add(ring);
    enemy.gravTrapRing = ring;
  }

  removeGravitrapRing(enemy) {
    if (enemy?.gravTrapRing) {
      enemy.gravTrapRing.destroy();
      enemy.gravTrapRing = null;
    }
  }

  clearAll() {
    for (const e of this.enemies) {
      if (e.active) {
        if (e.netRing) e.netRing.destroy();
        if (e.iceShell) e.iceShell.destroy();
        this.removeGravitrapRing(e);
        e.active = false; e.container.destroy();
      }
    }
    this.enemies = [];
  }
}
