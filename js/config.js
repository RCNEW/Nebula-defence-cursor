// ============================================================
//  NEBULA DEFENSE — CENTRAL CONFIGURATION
//  Edit values here to tweak gameplay without touching game logic
// ============================================================

const CONFIG = {

  // ── GAME ────────────────────────────────────────────────
  GAME: {
    WIDTH: 1920,
    HEIGHT: 1080,
    TEST_MODE: true,           // true = unlimited energy & no shield damage
    INITIAL_ENERGY: 150,
    INITIAL_SHIELD: 100,       // percentage (TEST_MODE overrides to 50)
    SHIELD_MAX: 100,
    TEST_SHIELD_START: 50,     // TEST_MODE: shield starts at this %
    TEST_SHIELD_MIN: 50,       // TEST_MODE: shield never drops below this %
    PLANET_RADIUS: 110,
    ORBIT_RADIUS: 175,         // ring around planet
    SPEED_OPTIONS: [0.5, 1, 2],// slow / normal / fast multipliers
    DEFAULT_SPEED_INDEX: 0,    // 0=½×  1=1×  2=2×  (TEST MODE starts at ½×)
    PAUSE_KEY: 'P',
    RESTART_KEY: 'R_RESTART',  // handled manually to avoid conflict
    MISS_OFFSET_MIN: 20,       // px — kleinste afwijking van een gemist projectiel t.o.v. het doelwit
    MISS_OFFSET_MAX: 70,       // px — grootste afwijking van een gemist projectiel t.o.v. het doelwit
  },

  // ── WAVES ────────────────────────────────────────────────
  WAVES: {
    PREP_TIME: 8000,           // ms between waves
    BASE_ENEMIES: 4,
    ENEMIES_PER_WAVE_INCREASE: 2,
    SPAWN_INTERVAL: 1400,      // ms between individual enemy spawns
    STRONG_ENEMY_START_WAVE: 3,// wave at which strong enemies start appearing
    STRONG_ENEMY_RATIO: 0.3,   // fraction of enemies that are "strong" (scales with wave)
    ENERGY_PER_KILL_BASE: 20,
  },

  // ── ENEMIES ─────────────────────────────────────────────
  // Each entry is a template. Add/remove/modify freely.
  ENEMIES: {
    scout: {
      label: 'Scout',
      hp: 40,
      speed: 80,
      damage: 5,
      radius: 14,
      color: 0xff4466,
      energyReward: 15,
      scoreReward: 10,
    },
    soldier: {
      label: 'Soldier',
      hp: 100,
      speed: 55,
      damage: 12,
      radius: 18,
      color: 0xff8800,
      energyReward: 25,
      scoreReward: 25,
    },
    tank: {
      label: 'Tank',
      hp: 280,
      speed: 32,
      damage: 25,
      radius: 26,
      color: 0xcc2222,
      energyReward: 50,
      scoreReward: 60,
    },
    swarm: {
      label: 'Swarm',
      hp: 20,
      speed: 120,
      damage: 3,
      radius: 10,
      color: 0xffff00,
      energyReward: 8,
      scoreReward: 5,
    },
    bomber: {
      label: 'Bomber',
      hp: 160,
      speed: 45,
      damage: 40,
      radius: 22,
      color: 0xaa00ff,
      energyReward: 40,
      scoreReward: 50,
    },
    boss: {
      label: 'BOSS',
      hp: 800,
      speed: 20,
      damage: 60,
      radius: 40,
      color: 0xff0000,
      energyReward: 150,
      scoreReward: 200,
    },
  },

  // ── ENEMY MOVEMENT (steering-gedrag) ─────────────────────
  // Vijanden vliegen niet meer in een rechte lijn of vaste sinus, maar sturen
  // hun koers voortdurend en vloeiend bij richting de planeet, met een
  // langzaam driftende "wander"-afwijking erbovenop. Dit geeft een organisch,
  // net-echt-vliegend gevoel zonder schokkerigheid of herkenbaar patroon.
  MOVEMENT: {
    STEER_RATE: 2.4,           // rad/sec — hoe snel een vijand zijn koers bijstuurt richting de planeet
    STEER_RATE_VARIATION: 0.25,// ± variatie per vijand (0 = alle vijanden identiek, 1 = zeer wisselend)
    WANDER_STRENGTH: 0.4,      // max. afwijkingshoek (radialen) t.o.v. de directe koers naar de planeet
    WANDER_CHANGE_MIN: 500,    // ms — kortste tijd tussen twee nieuwe wander-doelhoeken
    WANDER_CHANGE_MAX: 1400,   // ms — langste tijd tussen twee nieuwe wander-doelhoeken
    WANDER_SMOOTHING: 2.5,     // hoe vloeiend de wander-hoek naar zijn nieuwe doel toe beweegt
    WANDER_SCALE_MIN: 0.6,     // ondergrens per-vijand-variatie op WANDER_STRENGTH
    WANDER_SCALE_MAX: 1.3,     // bovengrens per-vijand-variatie op WANDER_STRENGTH
  },

  // TEST MODE: choose which enemy types to spawn (overrides wave logic)
  TEST_ENEMY_POOL: ['scout', 'soldier'],  // edit to test specific enemies
  TEST_ENEMY_STRENGTH_MULTIPLIER: 1.0,    // 0.5 = half strength, 2 = double

  // ── DEFENSES ────────────────────────────────────────────
  // PLANET DEFENSES (mounted on planet surface)
  PLANET_DEFENSES: {
    turret: {
      label: 'Turret',
      icon: '🔫',
      cost: 30,
      damage: 20,
      fireRate: 1200,    // ms between shots
      range: 320,
      projectileSpeed: 400,
      color: 0x00ffff,
      baseAccuracy: 0.6,   // nauwkeurigheid bij plaatsing (60%)
      maxAccuracy: 1.0,    // nauwkeurigheid bij max. upgrade (100%)
      upgrades: [
        { label: 'Dmg +50%', cost: 40, stat: 'damage', mult: 1.5 },
        { label: 'Rate +30%', cost: 50, stat: 'fireRate', mult: 0.7 },
        { label: 'Range +25%', cost: 35, stat: 'range', mult: 1.25 },
      ],
    },
    cannon: {
      label: 'Cannon',
      icon: '💥',
      cost: 50,
      damage: 60,
      fireRate: 3000,
      range: 380,
      projectileSpeed: 600,
      color: 0xff6600,
      baseAccuracy: 0.6,
      maxAccuracy: 1.0,
      upgrades: [
        { label: 'Dmg +75%', cost: 60, stat: 'damage', mult: 1.75 },
        { label: 'Rate +40%', cost: 70, stat: 'fireRate', mult: 0.6 },
        { label: 'Splash', cost: 80, stat: 'splash', value: 60 },
      ],
    },
    laser: {
      label: 'Laser',
      icon: '⚡',
      cost: 45,
      damage: 55,          // één krachtige puls per schot
      fireRate: 3500,      // 1 schot per ~3.5 seconden
      range: 350,
      projectileSpeed: 420, // zichtbaar maar snel
      color: 0x00ff88,
      baseAccuracy: 0.6,
      maxAccuracy: 1.0,
      upgrades: [
        { label: 'Dmg +60%',   cost: 55, stat: 'damage',   mult: 1.6 },
        { label: 'Range +30%', cost: 45, stat: 'range',     mult: 1.3 },
        { label: 'Rate -25%',  cost: 90, stat: 'fireRate',  mult: 0.75 },
      ],
    },
    netgun: {
      label: 'Net Gun',
      icon: '🕸️',
      cost: 35,
      damage: 0,              // no direct hit damage — damage comes from net DoT
      fireRate: 3500,         // slower fire rate (ms between shots)
      range: 420,             // longer range than other planet defenses
      projectileSpeed: 280,   // net projectile is slow and visible
      slowFactor: 0.45,       // slows target while netted
      netDamagePerSec: 12,    // damage per second while net is on enemy
      netDuration: 5000,      // how long the net stays on (ms)
      color: 0x44ffcc,        // teal-green net color
      baseAccuracy: 0.6,
      maxAccuracy: 1.0,
      upgrades: [
        { label: 'Net DoT +50%', cost: 40, stat: 'netDamagePerSec', mult: 1.5 },
        { label: 'Duration +60%', cost: 35, stat: 'netDuration', mult: 1.6 },
        { label: 'Range +20%', cost: 35, stat: 'range', mult: 1.2 },
      ],
    },
    mortar: {
      label: 'Mortar',
      icon: '🎯',
      cost: 60,
      damage: 80,
      fireRate: 4000,
      range: 500,
      projectileSpeed: 300,
      splashRadius: 80,
      color: 0xffaa00,
      baseAccuracy: 0.6,
      maxAccuracy: 1.0,
      upgrades: [
        { label: 'Dmg +50%', cost: 70, stat: 'damage', mult: 1.5 },
        { label: 'Splash +40%', cost: 60, stat: 'splashRadius', mult: 1.4 },
        { label: 'Rate +30%', cost: 65, stat: 'fireRate', mult: 0.7 },
      ],
    },
    railgun: {
      label: 'Railgun',
      icon: '🛸',
      cost: 80,
      damage: 120,
      fireRate: 6000,        // 1 schot per 6 seconden
      range: 420,
      projectileSpeed: 320,  // langzamer zodat je hem kunt volgen
      penetrating: true,
      color: 0xff00ff,
      baseAccuracy: 0.6,
      maxAccuracy: 1.0,
      upgrades: [
        { label: 'Dmg +60%',    cost: 90, stat: 'damage',   mult: 1.6  },
        { label: 'Reload -25%', cost: 85, stat: 'fireRate',  mult: 0.75 },
        { label: 'Range +25%',  cost: 75, stat: 'range',     mult: 1.25 },
      ],
    },
  },

  // SPACE DEFENSES (placed anywhere in space — damage dealers)
  SPACE_DAMAGE_DEFENSES: {
    mine: {
      label: 'Mine',
      icon: '💣',
      cost: 50,
      damage: 220,           // hoog — eenmalige explosie, geen herhalende schade
      triggerRadius: 50,
      splashRadius: 110,
      color: 0xff4400,
      upgrades: [
        { label: 'Dmg +80%',    cost: 55, stat: 'damage',       mult: 1.8 },
        { label: 'Splash +50%', cost: 50, stat: 'splashRadius',  mult: 1.5 },
        { label: 'Triple',      cost: 80, stat: 'count',         value: 3 },
      ],
    },
    minishield: {
      label: 'Mini Shield',
      icon: '🛡️',
      cost: 40,
      repairRate: 1.5,       // shield % hersteld per seconde
      repairInterval: 500,   // ms tussen repair-ticks
      color: 0x4488ff,
      upgrades: [
        { label: 'Repair +60%', cost: 45, stat: 'repairRate', mult: 1.6 },
        { label: 'Rate +40%',   cost: 40, stat: 'repairInterval', mult: 0.6 },
        { label: 'Boost +100%', cost: 70, stat: 'repairRate', mult: 2.0 },
      ],
    },
    sonarbomb: {
      label: 'Sonar Bomb',
      icon: '📡',
      cost: 55,
      damage: 15,            // laag — kracht zit in de slow
      fireRate: 2500,        // ms tussen pulsen
      range: 200,            // bereik van elke puls
      activeDuration: 8000,  // ms actief voordat ie verdwijnt
      slowFactor: 0.45,      // vertraagt vijanden tot 45% snelheid
      slowDuration: 2500,    // ms dat de slow duurt
      color: 0x00ffaa,
      upgrades: [
        { label: 'Slow +30%',  cost: 60, stat: 'slowDuration', mult: 1.3 },
        { label: 'Range +30%', cost: 50, stat: 'range',        mult: 1.3 },
        { label: 'Rate +40%',  cost: 55, stat: 'fireRate',     mult: 0.6 },
      ],
    },
    energydrain: {
      label: 'Energy Drain',
      icon: '🌀',
      cost: 65,
      drainRate: 15,       // hp/sec drained per vijand
      tickInterval: 100,   // ms tussen ticks (drainRate * tickInterval/1000 per tick)
      range: 160,
      maxTargets: 1,
      color: 0xaa00ff,
      upgrades: [
        { label: 'Drain +60%', cost: 70, stat: 'drainRate', mult: 1.6 },
        { label: 'Range +30%', cost: 60, stat: 'range',     mult: 1.3 },
        { label: 'Multi-drain', cost: 80, stat: 'maxTargets', value: 3 },
      ],
    },
    nova: {
      label: 'Nova Core',
      icon: '☀️',
      cost: 90,
      damage: 18,            // hp per tick per vijand (in midden)
      range: 160,            // straal van het brandgebied
      tickInterval: 150,     // ms tussen schade-ticks tijdens branden
      burnDuration: 6000,    // ms dat de nova core brandt voordat ie verdwijnt
      color: 0xffaa00,
      upgrades: [
        { label: 'Dmg +60%',    cost: 100, stat: 'damage',      mult: 1.6 },
        { label: 'Burn +40%',   cost: 90,  stat: 'burnDuration', mult: 1.4 },
        { label: 'Range +30%',  cost: 85,  stat: 'range',        mult: 1.3 },
      ],
    },
    pulsar: {
      label: 'Pulsar',
      icon: '💫',
      cost: 70,
      damage: 12,
      fireRate: 2200,
      range: 260,
      activeDuration: 10000, // ms actief voordat ie verdwijnt
      rotationSpeed: 90,
      color: 0xff88ff,
      upgrades: [
        { label: 'Dmg +50%',  cost: 75, stat: 'damage',       mult: 1.5 },
        { label: 'Rate +40%', cost: 70, stat: 'fireRate',      mult: 0.6 },
        { label: 'Active +40%', cost: 65, stat: 'activeDuration', mult: 1.4 },
      ],
    },
  },

  // Volgorde van vijandstiertes voor EMP-degradatie
  ENEMY_TIER_ORDER: ['swarm', 'scout', 'soldier', 'bomber', 'tank', 'boss'],

  // SPACE DEFENSES (placed in space — debuffers)
  SPACE_DEBUFF_DEFENSES: {
    slowfield: {
      label: 'Slow Field',
      icon: '🧊',
      cost: 45,
      range: 130,
      fireRate: 500,          // elke 500ms refreshed de slow
      activeDuration: 8000,   // 8 seconden actief
      slowFactor: 0.45,       // vijanden op 45% snelheid
      slowApplyTime: 1500,    // ms dat slow duurt na laatste tick
      color: 0x88ccff,
      upgrades: [
        { label: 'Slow +25%',   cost: 50, stat: 'slowFactor',    mult: 0.75 },
        { label: 'Range +30%',  cost: 45, stat: 'range',         mult: 1.3  },
        { label: 'Active +50%', cost: 55, stat: 'activeDuration', mult: 1.5 },
      ],
    },
    gravitrap: {
      label: 'Gravi-trap',
      icon: '🕳️',
      cost: 55,
      // Fase 1 — aantrekken
      range: 150,            // px: pull-range (ook orbitRange)
      pullSpeed: 45,         // px/sec waarmee vijanden naar orbit bewegen
      // Fase 2 — orbit (langzamer dan vortex)
      orbitRadius: 50,       // px: straal van de baan
      orbitSpeed: 0.6,       // rad/sec — bewust langzamer dan vortex (1.4)
      drainRate: 15,         // hp/sec while enemy is orbiting the trap
      tickInterval: 100,     // ms between damage ticks, same rhythm as Energy Drain
      activeDuration: 7000,  // ms totale levensduur
      color: 0x6600aa,
      upgrades: [
        { label: 'Range +30%',  cost: 60, stat: 'range',          mult: 1.3 },
        { label: 'Drain +60%',  cost: 70, stat: 'drainRate',      mult: 1.6 },
        { label: 'Active +4s',  cost: 55, stat: 'activeDuration', add: 4000 },
      ],
    },
    blocker: {
      label: 'Blocker',
      icon: '🪨',
      cost: 35,
      hitsAllowed: 1,      // vijanden die deze blocker kan opvangen (1 = verdwijnt na 1 hit)
      color: 0x88aaff,
      upgrades: [
        { label: '+1 hit',      cost: 40, stat: 'hitsAllowed', add: 1 },
        { label: '+2 hits',     cost: 70, stat: 'hitsAllowed', add: 2 },
        { label: 'HP boost',    cost: 55, stat: 'hitsAllowed', add: 3 },
      ],
    },
    vortex: {
      label: 'Vortex',
      icon: '🌪️',
      cost: 60,
      color: 0x00ffff,
      // Fase 1 — aantrekken
      pullRange: 180,        // px: vijanden binnen deze range worden aangetrokken
      pullSpeed: 50,         // px/sec waarmee vijanden naar orbit bewegen
      // Fase 2 — orbit
      orbitRadius: 55,       // px: straal van de baan waarop vijanden zweven
      orbitSpeed: 1.4,       // rad/sec van de cirkelbaan (rustig zweven)
      orbitDuration: 12000,  // ms dat vijanden in orbit blijven vóór ontploffing
      // Fase 3 — wegslingeren
      slingSpeed: 700,       // px/sec waarmee vijanden worden weggeslingerd
      upgrades: [
        { label: 'Range +30%',  cost: 55, stat: 'pullRange',     mult: 1.3 },
        { label: 'Orbit +5s',   cost: 60, stat: 'orbitDuration', add: 5000 },
        { label: 'Sling +50%',  cost: 70, stat: 'slingSpeed',    mult: 1.5 },
      ],
    },
    empdisruptor: {
      label: 'EMP Disruptor',
      icon: '⚡',
      cost: 70,
      range: 140,
      activeDuration: 1,      // eenmalig: vuurt één keer en verdwijnt
      triggerMinTier: 1,      // scout (tier 0) triggert NIET; soldier+ (tier 1+) wel
      color: 0xffff00,
      upgrades: [
        { label: 'Range +30%',  cost: 70, stat: 'range',        mult: 1.3 },
        { label: 'Radius +30%', cost: 75, stat: 'range',        mult: 1.3 },
        { label: 'CD -30%',     cost: 80, stat: 'activeDuration', value: 1 },
      ],
    },
    webspinner: {
      label: 'Web Spinner',
      icon: '🕷️',
      cost: 50,
      range: 200,
      fireRate: 1800,         // schiet netten op vijanden in range
      activeDuration: 10000,
      netSlowFactor: 0.6,     // elke extra net = nog 40% langzamer (cumulatief)
      netDuration: 4000,
      netDamagePerSec: 8,
      color: 0xccaaff,
      upgrades: [
        { label: 'Slow +30%',   cost: 55, stat: 'netSlowFactor', mult: 0.7  },
        { label: 'Range +30%',  cost: 50, stat: 'range',         mult: 1.3  },
        { label: 'Active +50%', cost: 55, stat: 'activeDuration', mult: 1.5 },
      ],
    },
  },

  // ── SPECIAL ACTIONS ──────────────────────────────────────
  SPECIAL_ACTIONS: {
    freeze: {
      label: 'Freeze',
      icon: '❄️',
      color: 0x88ccff,
      initialDelay: 30000,   // ms before first use
      cooldown: 60000,
      duration: 5000,        // freeze duration on enemies
      upgrades: [
        { label: 'Duration +3s', cost: 60, stat: 'duration', add: 3000 },
        { label: 'CD -20s', cost: 80, stat: 'cooldown', add: -20000 },
        { label: 'Dmg on thaw', cost: 100, stat: 'thawDamage', value: 30 },
      ],
    },
    shockwave: {
      label: 'Shockwave',
      icon: '💥',
      color: 0xff8800,
      initialDelay: 60000,
      cooldown: 90000,
      baseDamage: 60,
      maxDamage: 200,        // damage at planet surface
      upgrades: [
        { label: 'Dmg +50%', cost: 80, stat: 'baseDamage', mult: 1.5 },
        { label: 'CD -30s', cost: 100, stat: 'cooldown', add: -30000 },
        { label: 'Double wave', cost: 140, stat: 'doubleWave', value: true },
      ],
    },
    repair: {
      label: 'Repair',
      icon: '🔧',
      color: 0x00ff88,
      initialDelay: 90000,
      cooldown: 120000,
      repairAmount: 10,      // % shield restored
      upgrades: [
        { label: '+10% repair', cost: 80, stat: 'repairAmount', add: 10 },
        { label: 'CD -40s', cost: 100, stat: 'cooldown', add: -40000 },
        { label: 'Auto-repair', cost: 160, stat: 'autoRepair', value: 1 },
      ],
    },
  },

  // ── LAYOUT ────────────────────────────────────────────────
  LAYOUT: {
    BOTTOM_BAR_HEIGHT: 140,
    BOTTOM_BAR_Y: 1080 - 140,
    STATS_PANEL_X: 20,
    STATS_PANEL_Y: 20,
    STATS_PANEL_W: 240,
    STATS_PANEL_H: 90,
    WAVE_DISPLAY_X: 1920 - 20,
    WAVE_DISPLAY_Y: 30,
    PLANET_X: 960,
    PLANET_Y: 490,

    // 3 cubes — each shows exactly 1 defense option
    CUBE_A_X: 160,    // Soort A: planeet verdediging  (cyaan)
    CUBE_B_X: 420,    // Soort B: ruimte schade        (oranje)
    CUBE_C_X: 680,    // Soort C: ruimte debuff        (paars)
    CUBE_Y: 1010,
    CUBE_W: 220,      // button width
    CUBE_H: 110,      // button height

    // Special actions (right of cubes)
    SPECIAL_X: 980,
    SPECIAL_Y: 1010,

    // Upgrade / Remove buttons
    UPGRADE_BTN_X: 1680,
    REMOVE_BTN_X: 1850,
    ACTION_BTN_Y: 1010,
  },

  // ── CUBE THEME COLORS ─────────────────────────────────────
  CUBE_COLORS: {
    a: { border: 0x00eeff, label: '#00eeff', bg: 0x001a22, name: 'Planeet Verdediging' },
    b: { border: 0xff6600, label: '#ff8833', bg: 0x1f0a00, name: 'Ruimte Aanval' },
    c: { border: 0xcc44ff, label: '#dd77ff', bg: 0x150022, name: 'Ruimte Debuff' },
  },

  // ── COLORS / THEME ─────────────────────────────────────
  THEME: {
    BG_DEEP: 0x020818,
    BG_MID: 0x071530,
    PLANET_COLOR: 0x44aacc,
    PLANET_GLOW: 0x88ddff,
    ORBIT_COLOR: 0x00ccff,
    PANEL_BG: 0x0a1a2e,
    PANEL_BORDER: 0x00ccff,
    TEXT_PRIMARY: '#00ffff',
    TEXT_SECONDARY: '#88ccff',
    TEXT_WARN: '#ff8800',
    TEXT_DANGER: '#ff4444',
    TEXT_GOOD: '#00ff88',
    ENERGY_COLOR: '#ffff00',
    SHIELD_COLOR: '#00ff88',
    FONT_MAIN: '"Courier New", monospace',
    STAR_COLOR: 0xffffff,
    STAR_COUNT: 200,
  },

};

// Convenience: get enemy config with optional strength multiplier
CONFIG.getEnemyConfig = function(type, waveMultiplier = 1.0, strengthOverride = null) {
  const base = CONFIG.ENEMIES[type];
  if (!base) return null;
  const mult = (strengthOverride ?? 1.0) * CONFIG.TEST_ENEMY_STRENGTH_MULTIPLIER * waveMultiplier;
  return {
    ...base,
    hp: Math.round(base.hp * mult),
    damage: Math.round(base.damage * mult),
    speed: base.speed,   // speed doesn't scale with difficulty
  };
};

// ============================================================
//  DYNAMIC LAYOUT HELPER
//  Call CONFIG.layout(scene) anywhere to get all positions
//  computed for the current screen size.
//  The base design is 1920×1080. Everything scales proportionally.
// ============================================================
CONFIG.layout = function(scene) {
  const W = scene.scale.width;
  const H = scene.scale.height;

  const sx = W / 1920;
  const sy = H / 1080;
  const s  = Math.min(sx, sy);

  const BAR_H  = Math.round(130 * sy);
  const BAR_Y  = H - BAR_H;
  const CUBE_Y = BAR_Y + BAR_H * 0.5;
  const CUBE_W = Math.round(220 * sx);
  const CUBE_H = Math.round(110 * sy);

  const CUBE_A_X = Math.round(160 * sx);
  const CUBE_B_X = Math.round(420 * sx);
  const CUBE_C_X = Math.round(680 * sx);

  const SPECIAL_X = Math.round(980 * sx);

  const MARGIN    = 16;
  const BTN_W     = Math.round(160 * sx);
  const BTN_GAP   = Math.round(12 * sx);
  const REMOVE_BTN_X  = W - MARGIN - BTN_W / 2;
  const UPGRADE_BTN_X = REMOVE_BTN_X - BTN_W - BTN_GAP;

  const STATS_MARGIN = 16;
  const STATS_X = STATS_MARGIN;
  const STATS_Y = STATS_MARGIN;
  const STATS_W = Math.round(240 * sx);
  const STATS_H = Math.round(90  * sy);

  const SPEED_Y = STATS_Y + STATS_H + Math.round(22 * sy);

  const SPD_BTN_W = Math.round(64 * sx);
  const SPD_BTN_H = Math.round(30 * sy);
  const SPEED_BTN_BASE_X = STATS_MARGIN + SPD_BTN_W / 2;

  return {
    W, H, sx, sy, s,
    BAR_H, BAR_Y, CUBE_Y, CUBE_W, CUBE_H,
    CUBE_A_X, CUBE_B_X, CUBE_C_X,
    SPECIAL_X,
    UPGRADE_BTN_X, REMOVE_BTN_X, BTN_W,
    ACTION_BTN_Y: CUBE_Y,

    STATS_X, STATS_Y, STATS_W, STATS_H,
    SPEED_Y, SPEED_BTN_BASE_X, SPD_BTN_W, SPD_BTN_H,

    WAVE_X:  W - Math.round(20 * sx),
    WAVE_Y:  Math.round(30 * sy),

    PLANET_X: W * 0.5,
    PLANET_Y: BAR_Y * 0.47,
    PLANET_R: Math.round(110 * s),
    ORBIT_R:  Math.round(175 * s),
  };
};