// ============================================================
//  WAVE SYSTEM — manages waves, spawning, difficulty scaling
// ============================================================

class WaveSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 0;
    this.totalEnemiesThisWave = 0;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.state = 'prep';      // prep | active | waveDone
    this.prepTimer = 0;
    this.spawnTimer = 0;
    this.spawnQueue = [];
  }

  get waveDifficultyMult() {
    return 1 + (this.currentWave - 1) * 0.18;
  }

  startGame() {
    this.currentWave = 0;
    this.state = 'prep';
    this.prepTimer = 1500;
    this._beginNextWavePrepUI();
  }

  update(delta) {
    const wCfg = CONFIG.WAVES;

    if (this.state === 'prep') {
      this.prepTimer -= delta * this.scene.gameSpeed;
      this.scene.uiScene?.updateWaveCountdown(this.prepTimer);
      if (this.prepTimer <= 0) this._startWave();

    } else if (this.state === 'active') {
      if (this.enemiesSpawned < this.spawnQueue.length) {
        this.spawnTimer -= delta * this.scene.gameSpeed;
        if (this.spawnTimer <= 0) {
          this._spawnNext();
          this.spawnTimer = wCfg.SPAWN_INTERVAL;
        }
      }
      if (this.enemiesSpawned >= this.spawnQueue.length &&
          this.scene.enemySystem.enemies.filter(e => e.active).length === 0) {
        this._waveComplete();
      }
    }
  }

  _beginNextWavePrepUI() {
    this.prepTimer = CONFIG.WAVES.PREP_TIME;
    const wave = this.currentWave + 1;
    this.scene.uiScene?.showWaveAnnouncement(wave, this.totalEnemiesThisWave);
    this.scene.uiScene?.updateEnemiesRemaining(null);
  }

  _startWave() {
    this.currentWave++;
    this.scene.uiScene?.updateWaveDisplay(this.currentWave);

    this.spawnQueue = this._buildSpawnQueue();
    this.totalEnemiesThisWave = this.spawnQueue.length;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.spawnTimer = 200;
    this.state = 'active';

    this.scene.uiScene?.showWaveAnnouncement(this.currentWave, this.totalEnemiesThisWave);
    this.scene.defenseSystem?.rotateCubes(false);
    this.scene.uiScene?.updateEnemiesRemaining(this.totalEnemiesThisWave);
  }

  _buildSpawnQueue() {
    const wCfg = CONFIG.WAVES;
    const wave = this.currentWave;
    const pool = CONFIG.GAME.TEST_MODE
      ? CONFIG.TEST_ENEMY_POOL
      : this._getEnemyPoolForWave(wave);

    const count = wCfg.BASE_ENEMIES + (wave - 1) * wCfg.ENEMIES_PER_WAVE_INCREASE;
    const queue = [];

    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const fromLeft = Math.random() < 0.5;
      queue.push({ type, fromLeft });
    }

    if (wave % 5 === 0) queue.push({ type: 'boss', fromLeft: Math.random() < 0.5 });

    return queue;
  }

  _getEnemyPoolForWave(wave) {
    const pool = ['scout'];
    if (wave >= 2) pool.push('swarm');
    if (wave >= 3) pool.push('soldier');
    if (wave >= 4) pool.push('bomber');
    if (wave >= 6) pool.push('tank');
    return pool;
  }

  _spawnNext() {
    if (this.enemiesSpawned >= this.spawnQueue.length) return;
    const { type, fromLeft } = this.spawnQueue[this.enemiesSpawned];
    this.scene.enemySystem.spawnEnemy(type, fromLeft);
    this.enemiesSpawned++;
  }

  onEnemyKilled() {
    this.enemiesKilled++;
    if (this.state === 'active') {
      const activeCount = this.scene.enemySystem.enemies.filter(e => e.active).length;
      const toSpawn     = this.spawnQueue.length - this.enemiesSpawned;
      const remaining   = activeCount + toSpawn;
      this.scene.uiScene?.updateEnemiesRemaining(remaining);
    }
  }

  _waveComplete() {
    this.state = 'waveDone';
    this.scene.uiScene?.updateEnemiesRemaining(null);

    // Toon "Wave X completed" banner, wacht dan voor het upgrade-scherm
    this.scene.uiScene?.showWaveCompleted(this.currentWave, () => {
      this.scene.uiScene?.showUpgradeChoice(() => {
        this._beginNextWavePrepUI();
        this.state = 'prep';
      });
    });

    this.scene.defenseSystem?.rotateCubes(true);
  }

  skipPrep() {
    if (this.state === 'prep') this.prepTimer = 0;
  }
}
