// ============================================================
//  UI SCENE — parallel scene that owns all HUD elements
// ============================================================

class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    // Get reference to GameScene
    this.gameScene = this.scene.get('GameScene');

    // Build all UI via UISystem
    this.uiSystem = new UISystem(this);
    this.uiSystem.build();

    // Proxy UISystem methods to this scene so GameScene can call this.uiScene.xxx()
    const methods = [
      'updateEnergyDisplay', 'updateShieldDisplay', 'updateScoreDisplay',
      'updateWaveDisplay', 'updateWaveCountdown', 'showWaveAnnouncement',
      'highlightSpeedBtn', 'showPausedIndicator',
      'updateCubeButtons', 'animateCubeRotation',
      'updateSpecialAction', 'updateSpecialActionTimer',
      'showDefenseInfo', 'hideDefenseInfo',
      'setStatusMsg', 'flashMsg',
      'showUpgradeChoice', 'showGameOver',
    ];
    methods.forEach(m => { this[m] = (...args) => this.uiSystem[m]?.(...args); });

    // Forward system references so UISystem buttons can call back into game
    this.defenseSystem     = this.gameScene.defenseSystem;
    this.specialActionSystem = this.gameScene.specialActionSystem;
    this.enemySystem       = this.gameScene.enemySystem;

    // Signal GameScene that UI is ready (alleen bij eerste start)
    this.gameScene.events.emit('uiReady', this);
  }

  shutdown() {
    this.uiSystem?._teardownCubeKeyHandlers?.();
  }
}
