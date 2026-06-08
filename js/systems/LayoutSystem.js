// ============================================================
//  LAYOUT SYSTEM — background, stars, planets, panels
//  All positions use CONFIG.layout(scene) — fully responsive.
// ============================================================

class LayoutSystem {
  constructor(scene) {
    this.scene = scene;
  }

  buildBackground() {
    const scene = this.scene;
    const L = CONFIG.layout(scene);
    const T = CONFIG.THEME;

    const bg = scene.add.graphics().setDepth(-100);
    bg.fillGradientStyle(T.BG_DEEP, T.BG_DEEP, T.BG_MID, T.BG_MID, 1);
    bg.fillRect(0, 0, L.W, L.H);

    // Stars — statische laag + knipperende accenten
    const stars = scene.add.graphics().setDepth(-90);
    for (let i = 0; i < T.STAR_COUNT; i++) {
      const x = Phaser.Math.Between(0, L.W);
      const y = Phaser.Math.Between(0, L.H);
      const r = Math.random() < 0.1 ? 2 : 1;
      stars.fillStyle(0xffffff, 0.3 + Math.random() * 0.7);
      stars.fillCircle(x, y, r);
    }
    this._buildTwinkleStars(scene, L);

    // Decorative background planets
    this._drawBgPlanet(bg, L.W * 0.12, L.H * 0.28, L.W * 0.14, 0x2a0060, 0x4400aa);
    this._drawBgPlanet(bg, L.W * 0.90, L.H * 0.35, L.W * 0.12, 0x003366, 0x0055aa);

    // Nebula patches
    const nebula = scene.add.graphics().setDepth(-85);
    nebula.fillStyle(0x220044, 0.3);
    nebula.fillEllipse(L.W * 0.16, L.H * 0.37, L.W * 0.26, L.H * 0.28);
    nebula.fillStyle(0x001133, 0.25);
    nebula.fillEllipse(L.W * 0.84, L.H * 0.32, L.W * 0.23, L.H * 0.26);
  }

  _buildTwinkleStars(scene, L) {
    const TWINKLE_COUNT = 42;
    const maxY = Math.max(L.BAR_Y - 30, L.H * 0.85);

    for (let i = 0; i < TWINKLE_COUNT; i++) {
      const x = Phaser.Math.Between(0, L.W);
      const y = Phaser.Math.Between(0, maxY);
      const radius = Phaser.Math.FloatBetween(1, 2.5);
      const peak = Phaser.Math.FloatBetween(0.55, 1);
      const star = scene.add.circle(x, y, radius, 0xffffff, peak).setDepth(-89);

      scene.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.12, 0.35),
        duration: Phaser.Math.Between(1400, 3200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2200),
        ease: 'Sine.easeInOut',
      });
    }
  }

  _drawBgPlanet(gfx, cx, cy, r, c1, c2) {
    gfx.fillStyle(c1, 0.5);
    gfx.fillCircle(cx, cy, r);
    gfx.fillStyle(c2, 0.3);
    gfx.fillCircle(cx - r * 0.2, cy - r * 0.2, r * 0.7);
  }

  buildPlanet() {
    const scene = this.scene;
    const L = CONFIG.layout(scene);
    const pX = L.PLANET_X;
    const pY = L.PLANET_Y;
    const pR = L.PLANET_R;
    const oR = L.ORBIT_R;

    // Planet body
    const planet = scene.add.graphics().setDepth(1);
    planet.fillStyle(CONFIG.THEME.PLANET_GLOW, 0.15);
    planet.fillCircle(pX, pY, pR + 25 * L.s);
    planet.fillStyle(CONFIG.THEME.PLANET_COLOR, 0.9);
    planet.fillCircle(pX, pY, pR);
    planet.fillStyle(0xffffff, 0.25);
    planet.fillCircle(pX - pR * 0.3, pY - pR * 0.3, pR * 0.4);
    planet.fillStyle(0x005577, 0.5);
    planet.fillEllipse(pX + 10 * L.s, pY + 20 * L.s, 70 * L.s, 40 * L.s);
    planet.fillEllipse(pX - 30 * L.s, pY - 10 * L.s, 40 * L.s, 25 * L.s);

    const shieldRing = scene.add.graphics().setDepth(2);
    this.shieldRing     = shieldRing;
    this.shieldRingPX   = pX;
    this.shieldRingPY   = pY;
    this.shieldRingR    = oR;
    this.shieldPulseTween = null;

    const blockerRing = scene.add.graphics().setDepth(3);
    this.blockerRing   = blockerRing;
    this.blockerRingPX = pX;
    this.blockerRingPY = pY;
    this.blockerRingR  = oR + 25;
    blockerRing.setVisible(false);

    CONFIG.GAME.PLANET_RADIUS = pR;
    CONFIG.LAYOUT.PLANET_X    = pX;
    CONFIG.LAYOUT.PLANET_Y    = pY;

    return shieldRing;
  }

  updateShieldRing(pct) {
    const ring = this.shieldRing;
    if (!ring) return;

    const t = Math.max(0, Math.min(1, pct / 100));

    const r1 = 0xff, g1 = 0x22, b1 = 0x00;
    const r2 = 0x44, g2 = 0x88, b2 = 0xff;
    const r  = Math.round(r1 + (r2 - r1) * t);
    const g  = Math.round(g1 + (g2 - g1) * t);
    const b  = Math.round(b1 + (b2 - b1) * t);
    const col = (r << 16) | (g << 8) | b;

    const thick = 1 + t * 3;
    const alpha = 0.15 + t * 0.70;

    ring.clear();
    ring.lineStyle(thick, col, alpha);
    ring.strokeCircle(this.shieldRingPX, this.shieldRingPY, this.shieldRingR);
  }

  updateBlockerRing(count, totalHits) {
    const ring = this.blockerRing;
    if (!ring) return;
    if (count <= 0) { ring.setVisible(false); return; }

    const t     = Math.min(1, totalHits / 6);
    const thick = 2 + t * 4;
    const alpha = 0.4 + t * 0.5;
    const r = Math.round(0x44 + (0xff - 0x44) * t);
    const g = Math.round(0x88 + (0xff - 0x88) * t);
    const b = 0xff;
    const col = (r << 16) | (g << 8) | b;

    ring.clear();
    ring.lineStyle(thick, col, alpha);
    ring.strokeCircle(this.blockerRingPX, this.blockerRingPY, this.blockerRingR);
    ring.setVisible(true);
  }

  setShieldPulsing(active) {
    if (active && !this.shieldPulseTween) {
      this.shieldPulseTween = this.scene.tweens.add({
        targets: this.shieldRing,
        alpha: { from: this.shieldRing.alpha, to: Math.min(1, this.shieldRing.alpha + 0.4) },
        duration: 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!active && this.shieldPulseTween) {
      this.shieldPulseTween.stop();
      this.shieldPulseTween = null;
      const pct = this.scene.shieldPct ?? 100;
      this.shieldRing.alpha = 1;
      this.updateShieldRing(pct);
    }
  }

  shieldHit() {
    const ring = this.shieldRing;
    if (!ring) return;
    if (this._shakeTimeline) { this._shakeTimeline.stop(); ring.x = 0; ring.y = 0; }

    const AMP = 5;
    const T   = 40;
    this._shakeTimeline = this.scene.tweens.chain({
      targets: ring,
      tweens: [
        { x: -AMP, y:  AMP*0.4, duration: T, ease: 'Linear' },
        { x:  AMP, y: -AMP*0.4, duration: T, ease: 'Linear' },
        { x: -AMP*0.5, y:  AMP*0.2, duration: T, ease: 'Linear' },
        { x:  AMP*0.5, y: -AMP*0.2, duration: T, ease: 'Linear' },
        { x: 0,    y: 0,        duration: T, ease: 'Linear' },
      ],
      onComplete: () => { ring.x = 0; ring.y = 0; this._shakeTimeline = null; },
    });
  }

  buildBottomBar() {
    const scene = this.scene;
    const L  = CONFIG.layout(scene);
    const CC = CONFIG.CUBE_COLORS;

    const bar = scene.add.graphics().setDepth(50);

    bar.fillStyle(0x020c1a, 0.97);
    bar.fillRect(0, L.BAR_Y, L.W, L.BAR_H);

    const zoneW = L.CUBE_W + Math.round(20 * L.sx);
    const zoneH = L.BAR_H - 4;
    [
      { x: L.CUBE_A_X, col: CC.a.border },
      { x: L.CUBE_B_X, col: CC.b.border },
      { x: L.CUBE_C_X, col: CC.c.border },
    ].forEach(({ x, col }) => {
      bar.fillStyle(col, 0.04);
      bar.fillRoundedRect(x - zoneW / 2, L.BAR_Y + 2, zoneW, zoneH, 6);
    });

    bar.lineStyle(2, CONFIG.THEME.PANEL_BORDER, 0.8);
    bar.lineBetween(0, L.BAR_Y, L.W, L.BAR_Y);

    const divX1 = L.SPECIAL_X - Math.round(80 * L.sx);
    bar.lineStyle(1, 0x224466, 0.6);
    bar.lineBetween(divX1, L.BAR_Y + 10, divX1, L.BAR_Y + L.BAR_H - 10);

    const divX2 = L.UPGRADE_BTN_X - Math.round(100 * L.sx);
    bar.lineBetween(divX2, L.BAR_Y + 10, divX2, L.BAR_Y + L.BAR_H - 10);

    return bar;
  }

  buildStatsPanel() {
    const scene = this.scene;
    const L = CONFIG.layout(scene);
    const gfx = scene.add.graphics().setDepth(60);
    gfx.fillStyle(CONFIG.THEME.PANEL_BG, 0.9);
    gfx.fillRoundedRect(L.STATS_X, L.STATS_Y, L.STATS_W, L.STATS_H, 8);
    gfx.lineStyle(1.5, CONFIG.THEME.PANEL_BORDER, 0.7);
    gfx.strokeRoundedRect(L.STATS_X, L.STATS_Y, L.STATS_W, L.STATS_H, 8);
    return gfx;
  }
}
