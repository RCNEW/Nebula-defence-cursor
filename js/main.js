// ============================================================
//  MAIN — Phaser game initialisation
//  RESIZE mode: canvas always fills the full browser window.
//  All positions are computed dynamically via scene.scale.width/height.
// ============================================================

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#020818',
  scene: [BootScene, GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    mode:       Phaser.Scale.RESIZE,   // canvas = full browser size, no black bars
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: { noAudio: true },
});
