// ============================================================
//  BOOT SCENE
// ============================================================

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // No external assets needed – everything is drawn procedurally
    const W = this.scale.width || 1920, H = this.scale.height || 1080;

    // Loading screen
    const bar = this.add.graphics();
    bar.fillStyle(0x00ccff, 1);
    bar.fillRect(W/2 - 200, H/2 - 10, 400 * this.load.progress, 20);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x00ccff, 1);
      bar.fillRect(W/2 - 200, H/2 - 10, 400 * v, 20);
    });
  }

  create() {
    this.scene.start('GameScene');
  }
}
