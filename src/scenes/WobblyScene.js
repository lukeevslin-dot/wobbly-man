import Phaser from 'phaser';
import { Stickman } from '../entities/Stickman.js';
import { NPC } from '../entities/NPC.js';
import { BuildSystem } from '../systems/BuildSystem.js';
import { Leaderboard } from '../services/Leaderboard.js';

// ── World layout ──────────────────────────────────────────────────────────────
const GROUND_Y = 440;
const WORLD_W  = 16500;

// Island zones (start x)
const JUNGLE_X  = 3900;
const VOLCANO_X = 7400;
const FROZEN_X  = 10700;
const SPACE_X   = 13700;

// Gaps between islands
const GAPS = [
  { x: 3000,  w: 900,  type: 'water', msg: '🌊 OCEAN!\nOnly a BOAT, SUBMARINE, or SWIM FINS can cross!',  fx: '💦' },
  { x: 6900,  w: 500,  type: 'lava',  msg: '🔥 LAVA!\nYou MUST FLY over it — jetpack, wings, fire boots!', fx: '🔥' },
  { x: 10200, w: 500,  type: 'chasm', msg: '❄️ ICY CHASM!\nNeed to FLY across!',                          fx: '❄️' },
  { x: 13200, w: 500,  type: 'void',  msg: '🚀 SPACE VOID!\nNeed a rocket, jetpack, or wings!',           fx: '💫' },
];

// Island metadata
const ISLANDS = {
  beach:   { label: '🏝  Wobbly Beach',    banner: '🏝 WOBBLY BEACH 🏝\nBack on familiar sand!',          sky: 0x87CEEB },
  jungle:  { label: '🌿  Jungle Jam',       banner: '🌿 JUNGLE JAM 🌿\nThe NPCs are faster here…',         sky: 0x1A3320 },
  volcano: { label: '🌋  Volcano Valley',   banner: '🌋 VOLCANO VALLEY 🌋\nHOT HOT HOT — they\'re angry!', sky: 0x2D0A00 },
  frozen:  { label: '🧊  Frozen Peaks',     banner: '🧊 FROZEN PEAKS 🧊\nSlippy! Build ice gear!',          sky: 0xC8E6F5 },
  space:   { label: '🚀  Space Junk',       banner: '🚀 SPACE JUNK 🚀\nLow gravity. High weirdness.',       sky: 0x000011 },
};

const NPC_BOUNDS = {
  beach:   { min: 80,             max: GAPS[0].x - 20 },
  jungle:  { min: JUNGLE_X + 20,  max: GAPS[1].x - 20 },
  volcano: { min: VOLCANO_X + 20, max: GAPS[2].x - 20 },
  frozen:  { min: FROZEN_X + 20,  max: GAPS[3].x - 20 },
  space:   { min: SPACE_X + 20,   max: WORLD_W - 80    },
};

function islandAt(x) {
  if (x < GAPS[0].x)               return 'beach';
  if (x >= JUNGLE_X  && x < GAPS[1].x) return 'jungle';
  if (x >= VOLCANO_X && x < GAPS[2].x) return 'volcano';
  if (x >= FROZEN_X  && x < GAPS[3].x) return 'frozen';
  if (x >= SPACE_X)                 return 'space';
  return null; // inside a gap
}

export default class WobblyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WobblyScene' });
    this.stickman        = null;
    this.npcs            = [];
    this.buildSystem     = new BuildSystem();
    this.attachments     = [];
    this.buildInputEl    = null;
    this.buildBtnEl      = null;
    this._buildBarEl     = null;
    this._micBtnEl       = null;
    this._speechRec      = null;
    this._micListening   = false;
    this.attachmentText  = null;
    this.islandLabel     = null;
    this.scoreText       = null;
    this.msgText         = null;
    this.msgTimer        = 0;
    this.score           = 125;
    this.clouds          = [];
    this.snowflakes      = [];
    this.currentIsland   = 'beach';
    this.gapWarnCooldown = 0;
    this.catchCooldown   = 0;
    this.waveGfx         = null;
    this.waveOffset      = 0;
    this.snowGfx         = null;
    this.emberGfx        = null;
    this.embers          = [];
    this.planetCurveGfx  = null;
    this._gameEnded      = false;
    this._inGameOver     = false;
    this.leaderboard     = null;
    this._lbText         = null;
    this.playerName      = 'Anonymous';
    this._gameStarted    = false;
    this._awaitingStart  = false;
    this._startUI        = [];
    this._fireDrainTimer = 0;
    this.mountains          = [];
    this.birds              = [];
    this.birdGfx            = null;
    this.birdHitCooldown    = 0;
    // Touch controls
    this._touchLeft         = false;
    this._touchRight        = false;
    this._touchJump         = false;
    this._touchJumpJustDown = false;
    this._touchBtnLeft      = null;
    this._touchBtnRight     = null;
    this._touchBtnJump      = null;
    // House pause
    this._house             = null;
    this._inHouse           = false;
    this._houseText         = null;
    this._doorHintText      = null;
    this._nearHouseDoor     = false;
    this._houseDoorConsumed = false;
    // Cat swarm
    this._cats              = [];
    this._catGfx            = null;
    // AT-AT laser system
    this._atatFireTimer     = 0;
    this._atatLasers        = [];
    this._laserGfx          = null;
    // Mountain ramp data
    this.mountainDefs       = [];
    this._playerMtnColliders = [];
  }

  create() {
    // ── Reset all mutable state so scene.restart() works ──────
    this._gameEnded      = false;
    this._inGameOver     = false;
    this._gameStarted    = false;
    this._awaitingStart  = false;
    this.score           = 125;
    this.attachments     = [];
    this.npcs            = [];
    this.clouds          = [];
    this.snowflakes      = [];
    this.embers          = [];
    this.mountains       = [];
    this.birds           = [];
    this.catchCooldown   = 0;
    this.gapWarnCooldown = 0;
    this.birdHitCooldown = 0;
    this.msgTimer        = 0;
    this.currentIsland   = 'beach';
    this._fireDrainTimer    = 0;
    this._touchLeft         = false;
    this._touchRight        = false;
    this._touchJump         = false;
    this._touchJumpJustDown = false;
    this._house             = null;
    this._inHouse           = false;
    this._nearHouseDoor     = false;
    this._houseDoorConsumed = false;
    this._doorHintText      = null;
    this._cats              = [];
    this._atatFireTimer     = 0;
    this._atatLasers        = [];
    this.mountainDefs       = [];
    this._playerMtnColliders = [];

    // Stop any active speech recognition
    if (this._speechRec) { try { this._speechRec.stop(); } catch (_) {} this._speechRec = null; }
    this._micListening = false;

    // Remove leftover DOM elements from previous run
    if (this._buildBarEl?.parentNode)   { this._buildBarEl.remove();   this._buildBarEl   = null; }
    if (this.buildInputEl?.parentNode)  { this.buildInputEl.remove();  this.buildInputEl  = null; }
    if (this.buildBtnEl?.parentNode)    { this.buildBtnEl.remove();    this.buildBtnEl    = null; }
    if (this._micBtnEl?.parentNode)     { this._micBtnEl.remove();     this._micBtnEl     = null; }
    if (this._touchBtnLeft?.parentNode) { this._touchBtnLeft.remove(); this._touchBtnLeft = null; }
    if (this._touchBtnRight?.parentNode){ this._touchBtnRight.remove();this._touchBtnRight= null; }
    if (this._touchBtnJump?.parentNode) { this._touchBtnJump.remove(); this._touchBtnJump = null; }

    const H = this.scale.height;
    this.physics.world.setBounds(0, 0, WORLD_W, H * 2);

    this._buildBackgrounds(H);
    this._buildGrounds(H);
    this._buildScenery();
    this._buildGapVisuals(H);
    this._spawnClouds();
    this._buildMountains(H);
    this._spawnBirds();

    // ── Static ground body (full world width) ─────────────
    const gObj = this.add.rectangle(WORLD_W / 2, GROUND_Y + 50, WORLD_W, 100);
    this.physics.add.existing(gObj, true);
    this.ground = gObj;

    // ── Player ─────────────────────────────────────────────
    this.stickman = new Stickman(this, 120, GROUND_Y - 30);
    this.physics.add.collider(this.stickman.physBody, this.ground);
    this._playerMtnColliders = [];
    for (const m of this.mountains) {
      const col = this.physics.add.collider(this.stickman.physBody, m);
      this._playerMtnColliders.push(col);
    }
    this._catGfx   = this.add.graphics().setDepth(26);
    this._laserGfx = this.add.graphics().setDepth(27);

    // ── NPCs (with solid colliders against player) ─────────
    const npcDefs = [
      { xs: [350,680,1050,1400,1780,2200,2600,2900],  type: 'beach'   },
      { xs: [4060,4480,4960,5430,5900,6380,6820],      type: 'jungle'  },
      { xs: [7600,8100,8600,9100,9600,10000],          type: 'volcano' },
      { xs: [10900,11350,11800,12250,12700],            type: 'frozen'  },
      { xs: [13900,14350,14800,15300,15750,16200],     type: 'space'   },
    ];
    for (const { xs, type } of npcDefs) {
      for (const nx of xs) {
        const npc = new NPC(this, nx, GROUND_Y - 28, type);
        const bounds = NPC_BOUNDS[type];
        if (bounds) { npc.minX = bounds.min; npc.maxX = bounds.max; }
        this.physics.add.collider(npc.physBody, this.ground);
        // Solid collider between player and NPC — also handles catch/ram
        this.physics.add.collider(this.stickman.physBody, npc.physBody, () => {
          this._handlePlayerNPCCollision(npc);
        });
        for (const m of this.mountains) this.physics.add.collider(npc.physBody, m);
        this.npcs.push(npc);
      }
    }

    // ── Camera ─────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.startFollow(this.stickman.physBody, true, 0.08, 0.08);

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.planetCurveGfx = this.add.graphics().setScrollFactor(0).setDepth(90);
    this.leaderboard    = new Leaderboard();

    this._createUI();
    this._initAudio();
    this._showStartScreen();
  }

  // ── World building ───────────────────────────────────────

  _buildBackgrounds(H) {
    // Per-island sky rectangles
    const sections = [
      [0,            GAPS[0].x,                    0x87CEEB],
      [GAPS[0].x,    GAPS[0].w,                    0x87CEEB], // water gap sky
      [JUNGLE_X,     GAPS[1].x - JUNGLE_X,         0x1A3320],
      [GAPS[1].x,    GAPS[1].w,                    0x1A0000], // lava gap sky
      [VOLCANO_X,    GAPS[2].x - VOLCANO_X,        0x2D0A00],
      [GAPS[2].x,    GAPS[2].w,                    0xC8E6F5], // chasm sky
      [FROZEN_X,     GAPS[3].x - FROZEN_X,         0xC8E6F5],
      [GAPS[3].x,    GAPS[3].w,                    0x000011], // void sky
      [SPACE_X,      WORLD_W - SPACE_X,            0x000011],
    ];
    for (const [sx, sw, col] of sections) {
      this.add.rectangle(sx + sw / 2, H / 2, sw, H, col).setDepth(-3);
    }

    // Sun (beach)
    this.add.circle(GAPS[0].x - 200, 70, 48, 0xFFD700).setDepth(-2);
    this.add.circle(GAPS[0].x - 200, 70, 44, 0xFFF176).setDepth(-2);

    // Volcano (background shape)
    const vg = this.add.graphics().setDepth(-2);
    const vx = VOLCANO_X + 1400;
    vg.fillStyle(0x1A0000);
    vg.fillTriangle(vx - 350, GROUND_Y, vx, 60, vx + 350, GROUND_Y);
    vg.fillStyle(0xFF4500, 0.7);
    vg.fillTriangle(vx - 60, 100, vx, 60, vx + 60, 100);
    vg.fillStyle(0xFF6600, 0.5);
    vg.fillEllipse(vx, 80, 80, 30);

    // Frozen mountains (background)
    const mg = this.add.graphics().setDepth(-2);
    mg.fillStyle(0xB0C4DE);
    for (const [mx, mh] of [[FROZEN_X+400,220],[FROZEN_X+800,280],[FROZEN_X+1200,200],[FROZEN_X+1600,260],[FROZEN_X+2000,230],[FROZEN_X+2400,250]]) {
      mg.fillTriangle(mx - 150, GROUND_Y, mx, GROUND_Y - mh, mx + 150, GROUND_Y);
      mg.fillStyle(0xFFFFFF);
      mg.fillTriangle(mx - 50, GROUND_Y - mh + 50, mx, GROUND_Y - mh, mx + 50, GROUND_Y - mh + 50);
      mg.fillStyle(0xB0C4DE);
    }

    // Earth (space background)
    const eg = this.add.graphics().setDepth(-2);
    eg.fillStyle(0x1E90FF);
    eg.fillCircle(SPACE_X + 1200, 120, 90);
    eg.fillStyle(0x228B22, 0.8);
    eg.fillEllipse(SPACE_X + 1170, 100, 70, 50);
    eg.fillEllipse(SPACE_X + 1230, 135, 50, 35);

    // Stars (space)
    const sg = this.add.graphics().setDepth(-2);
    sg.fillStyle(0xFFFFFF);
    for (let i = 0; i < 200; i++) {
      const sx = SPACE_X + Math.random() * (WORLD_W - SPACE_X);
      sg.fillCircle(sx, Math.random() * GROUND_Y, 1 + Math.random() * 1.5);
    }

    // Canopy light (jungle)
    const jg = this.add.graphics().setDepth(-2);
    jg.fillStyle(0x7DC97D, 0.06);
    for (let lx = JUNGLE_X; lx < GAPS[1].x; lx += 260) {
      jg.fillCircle(lx + 130, H / 3, 80 + Math.sin(lx * 0.01) * 30);
    }

    // Lava glow (volcano)
    const lg = this.add.graphics().setDepth(-2);
    lg.fillStyle(0xFF4500, 0.08);
    for (let lx = VOLCANO_X; lx < GAPS[2].x; lx += 300) {
      lg.fillCircle(lx + 150, GROUND_Y - 50, 120);
    }
  }

  _buildGrounds(H) {
    // Beach sand
    const sand = this.add.graphics();
    sand.fillStyle(0xF4D03F);
    sand.fillRect(0, GROUND_Y, GAPS[0].x, H - GROUND_Y);
    sand.fillStyle(0xE8C52A);
    sand.fillRect(0, GROUND_Y, GAPS[0].x, 8);
    sand.fillStyle(0xDEB887, 0.5);
    for (let i = 40; i < GAPS[0].x; i += 80) {
      sand.fillCircle(i + Math.sin(i) * 15, GROUND_Y + 14 + Math.cos(i * 0.7) * 6, 4);
    }

    // Jungle mud
    const mud = this.add.graphics();
    mud.fillStyle(0x4E342E);
    mud.fillRect(JUNGLE_X, GROUND_Y, GAPS[1].x - JUNGLE_X, H - GROUND_Y);
    mud.fillStyle(0x3E2723);
    mud.fillRect(JUNGLE_X, GROUND_Y, GAPS[1].x - JUNGLE_X, 8);
    mud.fillStyle(0x3E2723, 0.6);
    for (let i = 0; i < 7; i++) mud.fillEllipse(JUNGLE_X + 200 + i * 440, GROUND_Y + 20, 90, 16);

    // Volcano rock
    const rock = this.add.graphics();
    rock.fillStyle(0x3D3D3D);
    rock.fillRect(VOLCANO_X, GROUND_Y, GAPS[2].x - VOLCANO_X, H - GROUND_Y);
    rock.fillStyle(0x2E2E2E);
    rock.fillRect(VOLCANO_X, GROUND_Y, GAPS[2].x - VOLCANO_X, 8);
    // Lava cracks
    rock.lineStyle(3, 0xFF4500, 0.8);
    for (let cx = VOLCANO_X + 100; cx < GAPS[2].x; cx += 220) {
      rock.beginPath(); rock.moveTo(cx, GROUND_Y + 5);
      rock.lineTo(cx + 30, GROUND_Y + 20); rock.lineTo(cx + 15, GROUND_Y + 40);
      rock.strokePath();
    }

    // Frozen snow
    const snow = this.add.graphics();
    snow.fillStyle(0xECF0F1);
    snow.fillRect(FROZEN_X, GROUND_Y, GAPS[3].x - FROZEN_X, H - GROUND_Y);
    snow.fillStyle(0xFFFFFF);
    snow.fillRect(FROZEN_X, GROUND_Y, GAPS[3].x - FROZEN_X, 8);
    // Ice patches
    snow.fillStyle(0xADD8E6, 0.5);
    for (let i = 0; i < 8; i++) snow.fillEllipse(FROZEN_X + 150 + i * 360, GROUND_Y + 6, 120, 10);

    // Space floor
    const space = this.add.graphics();
    space.fillStyle(0x2C3E50);
    space.fillRect(SPACE_X, GROUND_Y, WORLD_W - SPACE_X, H - GROUND_Y);
    space.lineStyle(1, 0x3D5166, 0.6);
    for (let gx = SPACE_X; gx < WORLD_W; gx += 60) {
      space.lineBetween(gx, GROUND_Y, gx, H);
    }
    for (let gy = GROUND_Y; gy < H; gy += 60) {
      space.lineBetween(SPACE_X, gy, WORLD_W, gy);
    }
  }

  _buildScenery() {
    // Beach palms
    for (const px of [200,480,820,1200,1600,2050,2450,2850]) this._drawPalm(px);

    // Jungle trees + vines
    for (const tx of [3980,4320,4700,5100,5500,5900,6300,6650,6830]) this._drawJungleTree(tx);
    const vg = this.add.graphics();
    vg.lineStyle(3, 0x4CAF50, 0.75);
    for (let vx = JUNGLE_X + 100; vx < GAPS[1].x - 100; vx += 200) {
      vg.beginPath(); vg.moveTo(vx, GROUND_Y - 135);
      for (let i = 0; i <= 10; i++) vg.lineTo(vx + i * 8, GROUND_Y - 135 + Math.sin((i / 10) * Math.PI) * 65);
      vg.strokePath();
    }

    // Volcano boulders + lava rivers
    const bv = this.add.graphics();
    bv.fillStyle(0x555555);
    for (const [bx, bs] of [[7600,25],[8000,18],[8400,30],[8800,22],[9200,28],[9700,20],[10000,24]]) {
      bv.fillCircle(bx, GROUND_Y - bs, bs);
    }
    bv.fillStyle(0xFF4500, 0.9);
    for (const [lx, lw] of [[7800,80],[8500,120],[9300,90],[9900,70]]) {
      bv.fillRect(lx, GROUND_Y - 6, lw, 10);
    }

    // Frozen pine trees
    for (const tx of [10850,11200,11600,12000,12400,12800,13000]) this._drawPineTree(tx);

    // Space props
    const sp = this.add.graphics();
    sp.lineStyle(3, 0x4A90D9);
    for (const [sx, sy] of [[14000,GROUND_Y-80],[14800,GROUND_Y-100],[15600,GROUND_Y-70],[16100,GROUND_Y-90]]) {
      sp.strokeCircle(sx, sy, 20);
      sp.lineBetween(sx, sy + 20, sx, GROUND_Y);
      sp.lineBetween(sx - 40, sy, sx + 40, sy);
    }
    sp.fillStyle(0x4A90D9, 0.3);
    for (const [sx, sy] of [[14000,GROUND_Y-80],[14800,GROUND_Y-100],[15600,GROUND_Y-70],[16100,GROUND_Y-90]]) {
      sp.fillCircle(sx, sy, 20);
    }

    // Floating asteroids (purely visual)
    const ag = this.add.graphics();
    ag.fillStyle(0x7A6A5A);
    for (const [ax, ay, ar] of [[14200,150,22],[14900,200,16],[15400,130,28],[15900,180,18],[16200,160,20]]) {
      ag.fillCircle(ax, ay, ar);
      ag.fillStyle(0x5A4A3A);
      ag.fillCircle(ax + ar*0.3, ay - ar*0.2, ar*0.4);
      ag.fillStyle(0x7A6A5A);
    }

    // Island signs
    this._sign(GAPS[0].x - 20, '⚠ OCEAN AHEAD\nNeed BOAT/FINS/SUB', 0xFFE082, 0x5D3A00);
    this._sign(JUNGLE_X + 14,  '🌿 JUNGLE JAM\nGood luck!',          0xA5D6A7, 0x1B5E20);
    this._sign(GAPS[1].x - 20, '⚠ LAVA AHEAD\nneed to FLY',         0xFF8A65, 0x6D1A00);
    this._sign(VOLCANO_X + 14, '🌋 VOLCANO VALLEY\nStay moving!',    0xFF8A65, 0x6D1A00);
    this._sign(GAPS[2].x - 20, '⚠ ICY CHASM\nneed to FLY',          0xB3E5FC, 0x1A4A6A);
    this._sign(FROZEN_X + 14,  '🧊 FROZEN PEAKS\nSlippery!',         0xB3E5FC, 0x1A4A6A);
    this._sign(GAPS[3].x - 20, '⚠ SPACE VOID\nneed to FLY',         0x9E9E9E, 0x111111);
    this._sign(SPACE_X + 14,   '🚀 SPACE JUNK\nWeird gravity!',      0x9E9E9E, 0x111111);
    this._sign(WORLD_W - 80,   '→ LOOPS BACK\nto Beach!',             0x80D8FF, 0x0D47A1);
  }

  _buildGapVisuals(H) {
    // Water
    const wg = this.add.graphics().setDepth(1);
    wg.fillStyle(0x1565C0); wg.fillRect(GAPS[0].x, GROUND_Y, GAPS[0].w, H - GROUND_Y);
    wg.fillStyle(0xFF9800, 0.6);
    for (const [fx, fy] of [
      [GAPS[0].x+80,GROUND_Y+50],[GAPS[0].x+230,GROUND_Y+80],[GAPS[0].x+380,GROUND_Y+40],
      [GAPS[0].x+530,GROUND_Y+70],[GAPS[0].x+680,GROUND_Y+45],[GAPS[0].x+820,GROUND_Y+60],
    ]) {
      wg.fillTriangle(fx, fy, fx+30, fy-8, fx+30, fy+8);
    }
    // Whale silhouette in the deep
    wg.fillStyle(0x0D47A1, 0.4);
    wg.fillEllipse(GAPS[0].x + 450, GROUND_Y + 110, 160, 55);
    wg.fillTriangle(GAPS[0].x+525, GROUND_Y+110, GAPS[0].x+560, GROUND_Y+88, GAPS[0].x+560, GROUND_Y+132);
    this.waveGfx = this.add.graphics().setDepth(2);

    // Lava
    const lvg = this.add.graphics().setDepth(1);
    lvg.fillStyle(0xFF4500); lvg.fillRect(GAPS[1].x, GROUND_Y, GAPS[1].w, H - GROUND_Y);
    lvg.fillStyle(0xFF6600, 0.6); lvg.fillRect(GAPS[1].x, GROUND_Y, GAPS[1].w, 12);
    lvg.fillStyle(0xFFCC00, 0.4);
    for (let bx = GAPS[1].x + 30; bx < GAPS[1].x + GAPS[1].w; bx += 60) {
      lvg.fillCircle(bx, GROUND_Y + 20, 12 + Math.sin(bx) * 5);
    }

    // Icy chasm
    const ig = this.add.graphics().setDepth(1);
    ig.fillStyle(0x89CFF0); ig.fillRect(GAPS[2].x, GROUND_Y, GAPS[2].w, H - GROUND_Y);
    ig.fillStyle(0xADD8E6, 0.5); ig.fillRect(GAPS[2].x, GROUND_Y, GAPS[2].w, 10);
    ig.fillStyle(0xFFFFFF, 0.3);
    for (let sx = GAPS[2].x + 20; sx < GAPS[2].x + GAPS[2].w; sx += 50) {
      ig.fillTriangle(sx, GROUND_Y, sx + 20, GROUND_Y + 40, sx - 20, GROUND_Y + 40);
    }

    // Space void
    const svg = this.add.graphics().setDepth(1);
    svg.fillStyle(0x000005); svg.fillRect(GAPS[3].x, GROUND_Y, GAPS[3].w, H - GROUND_Y);
    svg.fillStyle(0xFFFFFF);
    for (let i = 0; i < 30; i++) {
      svg.fillCircle(GAPS[3].x + Math.random() * GAPS[3].w, Math.random() * GROUND_Y, 1.5);
    }
    // Animated ember/lava graphics
    this.emberGfx = this.add.graphics().setDepth(3);
    for (let i = 0; i < 15; i++) {
      this.embers.push({ x: GAPS[1].x + Math.random() * GAPS[1].w, y: GROUND_Y - Math.random() * 80, spd: 30 + Math.random() * 50 });
    }

    // Snowflake graphics
    this.snowGfx = this.add.graphics().setDepth(3);
    for (let i = 0; i < 40; i++) {
      this.snowflakes.push({
        x: FROZEN_X + Math.random() * (GAPS[3].x - FROZEN_X),
        y: Math.random() * GROUND_Y,
        spd: 25 + Math.random() * 40,
        sz: 1.5 + Math.random() * 2.5,
      });
    }
  }

  _buildMountains(H) {
    const mg = this.add.graphics().setDepth(0);

    // Mountain definitions: { cx, baseW, h, col, snow }
    const defs = this.mountainDefs = [
      // Beach mountains (brownish rocky)
      { cx:  680, baseW: 220, h: 115, col: 0x9E7B5A, snow: 0xFFFFFF },
      { cx: 1550, baseW: 260, h: 130, col: 0x967060, snow: 0xFFFFFF },
      { cx: 2550, baseW: 240, h: 120, col: 0xA0825A, snow: 0xFFFFFF },
      // Jungle mountains (mossy green)
      { cx: JUNGLE_X + 550,  baseW: 280, h: 135, col: 0x4A6040, snow: 0x88CC66 },
      { cx: JUNGLE_X + 1900, baseW: 300, h: 145, col: 0x3D5535, snow: 0x77BB55 },
      // Frozen peaks (icy blue-white)
      { cx: FROZEN_X + 650,  baseW: 300, h: 155, col: 0x8EB4D8, snow: 0xFFFFFF },
      { cx: FROZEN_X + 2050, baseW: 320, h: 160, col: 0x9DC0E0, snow: 0xFFFFFF },
    ];

    for (const def of defs) {
      const top = GROUND_Y - def.h;

      // Visual: mountain triangle
      mg.fillStyle(def.col);
      mg.fillTriangle(def.cx - def.baseW, GROUND_Y, def.cx, top, def.cx + def.baseW, GROUND_Y);
      mg.lineStyle(1.5, 0x443322, 0.45);
      mg.lineBetween(def.cx - def.baseW * 0.5, GROUND_Y, def.cx - def.baseW * 0.1, top + def.h * 0.35);
      mg.lineBetween(def.cx + def.baseW * 0.5, GROUND_Y, def.cx + def.baseW * 0.1, top + def.h * 0.35);
      // Snow cap
      const capH = def.h * 0.28;
      mg.fillStyle(def.snow, 0.92);
      mg.fillTriangle(def.cx - def.baseW * 0.32, top + capH * 2.2, def.cx, top - 4, def.cx + def.baseW * 0.32, top + capH * 2.2);

      // Physics wall: a plain rectangle with static physics — this is the reliable approach
      const wallW = Math.round(def.baseW * 1.6);
      const wallH = def.h;
      const wall  = this.add.rectangle(def.cx, GROUND_Y - wallH / 2, wallW, wallH);
      wall.setVisible(false);
      this.physics.add.existing(wall, true); // true = static body
      this.mountains.push(wall);
    }
  }

  _spawnBirds() {
    this.birdGfx = this.add.graphics().setDepth(25);
    const ZONE_BOUNDS = {
      beach:   { min: 80,            max: GAPS[0].x - 60 },
      jungle:  { min: JUNGLE_X + 50, max: GAPS[1].x - 60 },
      volcano: { min: VOLCANO_X +50, max: GAPS[2].x - 60 },
      frozen:  { min: FROZEN_X + 50, max: GAPS[3].x - 60 },
      space:   { min: SPACE_X + 50,  max: WORLD_W - 80    },
    };
    const birdDefs = [
      { x: 600,               y: 175, spd: 85,  zone: 'beach'   },
      { x: 1800,              y: 210, spd: 105, zone: 'beach'   },
      { x: 2500,              y: 155, spd: 125, zone: 'beach'   },
      { x: JUNGLE_X + 400,   y: 190, spd: 100, zone: 'jungle'  },
      { x: JUNGLE_X + 1600,  y: 165, spd: 120, zone: 'jungle'  },
      { x: VOLCANO_X + 500,  y: 185, spd: 145, zone: 'volcano' },
      { x: VOLCANO_X + 1500, y: 205, spd: 160, zone: 'volcano' },
      { x: FROZEN_X + 600,   y: 170, spd: 80,  zone: 'frozen'  },
      { x: FROZEN_X + 1900,  y: 195, spd: 90,  zone: 'frozen'  },
      { x: SPACE_X + 700,    y: 200, spd: 70,  zone: 'space'   },
      { x: SPACE_X + 1800,   y: 225, spd: 80,  zone: 'space'   },
    ];
    for (const def of birdDefs) {
      const b = ZONE_BOUNDS[def.zone];
      this.birds.push({
        x: def.x, y: def.y, spd: def.spd,
        dir: Math.random() < 0.5 ? 1 : -1,
        zone: def.zone, minX: b.min, maxX: b.max,
        wing: Math.random() * Math.PI * 2,
      });
    }
  }

  _updateBirds(dt) {
    const bg = this.birdGfx;
    bg.clear();
    for (const bird of this.birds) {
      bird.x += bird.spd * bird.dir * dt;
      bird.wing += dt * 7.5;
      if (bird.x < bird.minX) { bird.x = bird.minX; bird.dir = 1; }
      if (bird.x > bird.maxX) { bird.x = bird.maxX; bird.dir = -1; }
      const bx = bird.x, by = bird.y;
      const flap = Math.sin(bird.wing) * 13;
      const col = bird.zone === 'beach'   ? 0x445566
                : bird.zone === 'volcano' ? 0xCC4400
                : bird.zone === 'frozen'  ? 0xDDEEFF
                : bird.zone === 'space'   ? 0x7799AA
                : 0x335522; // jungle
      bg.lineStyle(3, col, 0.95);
      bg.beginPath();
      bg.moveTo(bx - 24 * (bird.dir < 0 ? -1 : 1), by - flap * 0.4);
      bg.lineTo(bx, by);
      bg.lineTo(bx + 24 * (bird.dir < 0 ? -1 : 1), by - flap * 0.4);
      bg.strokePath();
      bg.fillStyle(col, 1);
      bg.fillCircle(bx, by, 3.5);
    }
  }

  _checkBirdCollisions() {
    if (this.birdHitCooldown > 0) return;
    const onGround = this.stickman.physBody.body.blocked.down;
    if (onGround) return; // birds only hit airborne players
    const sx = this.stickman.x, sy = this.stickman.y;
    for (const bird of this.birds) {
      if (Math.abs(sx - bird.x) < 38 && Math.abs(sy - bird.y) < 38) {
        this._onBirdHit(bird);
        return;
      }
    }
  }

  _onBirdHit(bird) {
    this.birdHitCooldown = 5;
    const lostItem = this.attachments.length > 0 ? this.attachments[0] : null;
    this.attachments = [];
    this.stickman.clearAttachments();
    this._updateHUD();

    // Knock player tumbling
    this.stickman.physBody.body.setVelocityY(450);
    this.stickman.physBody.body.setVelocityX(this.stickman.facingRight ? -200 : 200);
    this.cameras.main.shake(350, 0.022);
    this.cameras.main.flash(200, 255, 200, 0);

    // Feather burst
    for (let i = 0; i < 7; i++) {
      const fx = bird.x + (Math.random() - 0.5) * 70;
      const fy = bird.y + (Math.random() - 0.5) * 45;
      const f = this.add.text(fx, fy, '🪶', { fontSize: '17px' }).setOrigin(0.5).setDepth(60);
      this.tweens.add({
        targets: f, x: fx + (Math.random() - 0.5) * 90, y: fy + 70 + Math.random() * 50,
        alpha: 0, duration: 1300 + Math.random() * 600,
        onComplete: () => f.destroy(),
      });
    }
    const hitTxt = this.add.text(bird.x, bird.y - 25, '🐦 BIRD STRIKE!', {
      fontSize: '20px', fill: '#FFE44D', stroke: '#222', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: hitTxt, y: hitTxt.y - 55, alpha: 0, duration: 1300, onComplete: () => hitTxt.destroy() });

    this._showMsg(lostItem
      ? `🐦 BIRD STRIKE! You lost your ${lostItem.name}!\nIt tumbled from the sky...`
      : '🐦 BIRD STRIKE! Watch the skies!');
  }

  _drawPalm(x) {
    const g = this.add.graphics();
    g.lineStyle(7, 0x8B5E3C);
    g.beginPath(); g.moveTo(x, GROUND_Y); g.lineTo(x+10, GROUND_Y-55); g.lineTo(x+6, GROUND_Y-95); g.strokePath();
    g.lineStyle(5, 0x2E7D32);
    for (const [dx,dy] of [[-42,-18],[38,-14],[-20,-38],[32,-38],[4,-48],[-10,-22],[20,-20]]) {
      g.lineBetween(x+6, GROUND_Y-95, x+6+dx, GROUND_Y-95+dy);
    }
    g.fillStyle(0x5D4037);
    g.fillCircle(x+4, GROUND_Y-93, 5); g.fillCircle(x+10, GROUND_Y-97, 4);
  }

  _drawJungleTree(x) {
    const g = this.add.graphics();
    g.fillStyle(0x3E2723); g.fillRect(x-9, GROUND_Y-130, 18, 130);
    g.lineStyle(1.5, 0x5D4037, 0.6);
    for (let yi = 0; yi < 130; yi += 18) g.lineBetween(x-9, GROUND_Y-130+yi, x+9, GROUND_Y-115+yi);
    for (const [yo,w,col] of [[0,70,0x1B5E20],[-35,58,0x2E7D32],[-65,46,0x388E3C],[-90,32,0x43A047]]) {
      g.fillStyle(col);
      g.fillTriangle(x, GROUND_Y-130+yo-w*0.6, x-w/2, GROUND_Y-130+yo, x+w/2, GROUND_Y-130+yo);
    }
    g.fillStyle(0xFF5722); g.fillCircle(x-12, GROUND_Y-145, 5); g.fillCircle(x+8, GROUND_Y-158, 4);
  }

  _drawPineTree(x) {
    const g = this.add.graphics();
    g.fillStyle(0x5D4037); g.fillRect(x-5, GROUND_Y-80, 10, 80);
    for (const [yo,w,col] of [[0,55,0x2E7D32],[-30,44,0x388E3C],[-55,32,0x43A047]]) {
      g.fillStyle(col);
      g.fillTriangle(x, GROUND_Y-80+yo-w*0.7, x-w/2, GROUND_Y-80+yo, x+w/2, GROUND_Y-80+yo);
    }
    // Snow cap
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillTriangle(x, GROUND_Y-80-55*0.7-10, x-18, GROUND_Y-80-55+8, x+18, GROUND_Y-80-55+8);
  }

  _sign(x, text, bgColor, textColor) {
    const g = this.add.graphics();
    g.fillStyle(0x6B3A1F); g.fillRect(x, GROUND_Y-90, 8, 90);
    g.fillStyle(bgColor);  g.fillRect(x-30, GROUND_Y-104, 72, 40);
    g.lineStyle(1.5, textColor); g.strokeRect(x-30, GROUND_Y-104, 72, 40);
    this.add.text(x-27, GROUND_Y-102, text, { fontSize: '9px', fill: `#${textColor.toString(16).padStart(6,'0')}`, lineSpacing: 1 });
  }

  _spawnClouds() {
    const beachClouds  = [100,320,600,950,1300,1700,2100,2500,2900].map(x => [x, 0xFFFFFF, 0.88]);
    const jungleClouds = [3700,4200,4800,5300,5900,6400].map(x => [x, 0xA5D6A7, 0.45]);
    const volcanoClouds = [7600,8200,8900,9500].map(x => [x, 0xFF6633, 0.3]);
    for (const [cx, col, a] of [...beachClouds, ...jungleClouds, ...volcanoClouds]) {
      const cy = 30 + Math.random() * 60;
      const s  = 0.7 + Math.random() * 0.5;
      const g  = this.add.graphics();
      g.fillStyle(col, a);
      g.fillCircle(0,0,30*s); g.fillCircle(32*s,-8*s,24*s);
      g.fillCircle(-24*s,-4*s,20*s); g.fillCircle(54*s,2*s,18*s);
      g.setPosition(cx, cy);
      this.clouds.push({ gfx: g, spd: 0.05 + Math.random() * 0.08 });
    }
  }

  // ── UI ────────────────────────────────────────────────────

  _createUI() {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W/2, H-28, W, 56, 0x0d0d1f, 0.88).setScrollFactor(0).setDepth(98);

    this.islandLabel = this.add.text(12, 12, '🏝  Wobbly Beach', {
      fontSize: '19px', fill: '#fff', stroke: '#1a2a1a', strokeThickness: 3, fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100);

    this.scoreText = this.add.text(W / 2, 10, '⭐ 125', {
      fontSize: '26px', fill: '#00FF88', stroke: '#1a1a2a', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.add.text(12, H-90, '← → walk   SPACE jump/fly', {
      fontSize: '12px', fill: '#aaa', stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);

    this.add.text(W - 6, H - 6, 'V 4.2', {
      fontSize: '11px', fill: '#555', stroke: '#000', strokeThickness: 1,
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(100);

    this.attachmentText = this.add.text(W-10, 10, 'No attachments', {
      fontSize: '13px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'right',
    }).setOrigin(1,0).setScrollFactor(0).setDepth(100);

    this.msgText = this.add.text(W/2, H/2-70, '', {
      fontSize: '18px', fill: '#FFE44D', stroke: '#222', strokeThickness: 3,
      align: 'center', wordWrap: { width: 460 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this._houseText = this.add.text(W/2, 48, '🏠 CLOCK PAUSED', {
      fontSize: '19px', fill: '#88FF44', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    this.buildInputEl = document.createElement('input');
    this.buildInputEl.type = 'text';
    this.buildInputEl.placeholder = 'What to build? (boat, jetpack, wings...)';
    // autocomplete/autocorrect off + 16px font stops iOS from auto-zooming on focus
    this.buildInputEl.setAttribute('autocomplete', 'off');
    this.buildInputEl.setAttribute('autocorrect', 'off');
    this.buildInputEl.setAttribute('autocapitalize', 'off');
    this.buildInputEl.setAttribute('spellcheck', 'false');
    Object.assign(this.buildInputEl.style, {
      flex:'1', minWidth:'0', height:'38px',
      background:'rgba(10,10,30,0.92)', border:'2px solid #4a90e2',
      borderRadius:'6px', color:'#fff', padding:'0 10px',
      fontSize:'16px', outline:'none',
    });

    this.buildBtnEl = document.createElement('button');
    this.buildBtnEl.textContent = '⚙ BUILD!';
    Object.assign(this.buildBtnEl.style, {
      flexShrink:'0', width:'80px', height:'38px', background:'#c0392b',
      border:'2px solid #922b21', borderRadius:'6px', color:'#fff',
      fontSize:'14px', fontWeight:'bold', cursor:'pointer',
    });

    // Mic button
    this._micBtnEl = document.createElement('button');
    this._micBtnEl.textContent = '🎤';
    this._micBtnEl.title = 'Speak to build';
    Object.assign(this._micBtnEl.style, {
      flexShrink:'0', width:'44px', height:'38px',
      background:'rgba(10,10,30,0.92)', border:'2px solid #4a90e2',
      borderRadius:'6px', color:'#fff', fontSize:'20px', cursor:'pointer',
      WebkitTapHighlightColor:'transparent',
    });
    // Inject pulse animation once
    if (!document.getElementById('mic-pulse-style')) {
      const s = document.createElement('style');
      s.id = 'mic-pulse-style';
      s.textContent = `@keyframes mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(220,50,50,0.6)}50%{box-shadow:0 0 0 9px rgba(220,50,50,0)}}.mic-on{animation:mic-pulse 0.9s ease-in-out infinite;border-color:#e74c3c!important;background:#c0392b!important;}`;
      document.head.appendChild(s);
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      this._micBtnEl.style.opacity = '0.35';
      this._micBtnEl.title = 'Speech not supported in this browser';
    } else {
      const onMic = e => { e.preventDefault(); e.stopPropagation(); this._toggleMic(); };
      this._micBtnEl.addEventListener('click', onMic);
      this._micBtnEl.addEventListener('touchend', onMic, { passive: false });
    }

    // Wrapper keeps input + button together and always on-screen
    this._buildBarEl = document.createElement('div');
    Object.assign(this._buildBarEl.style, {
      position:'fixed',
      bottom:'max(11px, calc(env(safe-area-inset-bottom, 0px) + 6px))',
      left:'50%', transform:'translateX(-50%)',
      width:'min(490px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px))',
      display:'flex', gap:'4px', zIndex:'1000',
    });
    this._buildBarEl.appendChild(this.buildInputEl);
    this._buildBarEl.appendChild(this._micBtnEl);
    this._buildBarEl.appendChild(this.buildBtnEl);
    document.body.appendChild(this._buildBarEl);

    this.buildBtnEl.addEventListener('click', () => this._handleBuild());
    this.buildInputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._handleBuild();
      e.stopPropagation();
    });

    this._createTouchControls();
  }

  // ── Touch controls ────────────────────────────────────────

  _createTouchControls() {
    const mk = (label, extraStyle) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        position: 'fixed', width: '68px', height: '68px',
        background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)',
        borderRadius: '14px', color: '#fff', fontSize: '30px',
        touchAction: 'none', webkitUserSelect: 'none', userSelect: 'none',
        zIndex: '1001', lineHeight: '68px', textAlign: 'center',
        padding: '0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        ...extraStyle,
      });
      return btn;
    };

    const safeB = 'max(62px, calc(env(safe-area-inset-bottom, 0px) + 62px))';
    const safeL = 'max(12px, calc(env(safe-area-inset-left, 0px) + 12px))';
    const safeR = 'max(12px, calc(env(safe-area-inset-right, 0px) + 12px))';
    this._touchBtnLeft  = mk('◀', { bottom: safeB, left: safeL });
    this._touchBtnRight = mk('▶', { bottom: safeB, left: `max(90px, calc(env(safe-area-inset-left, 0px) + 90px))` });
    this._touchBtnJump  = mk('▲', { bottom: safeB, right: safeR, width: '80px', height: '80px', fontSize: '34px', lineHeight: '80px' });

    const bind = (btn, onDown, onUp) => {
      const pd = e => e.preventDefault();
      btn.addEventListener('touchstart',  e => { pd(e); onDown(); }, { passive: false });
      btn.addEventListener('touchend',    e => { pd(e); onUp();   }, { passive: false });
      btn.addEventListener('touchcancel', e => { pd(e); onUp();   }, { passive: false });
      btn.addEventListener('mousedown',  onDown);
      btn.addEventListener('mouseup',    onUp);
      btn.addEventListener('mouseleave', onUp);
    };

    bind(this._touchBtnLeft,
      () => { this._touchLeft = true; },
      () => { this._touchLeft = false; });
    bind(this._touchBtnRight,
      () => { this._touchRight = true; },
      () => { this._touchRight = false; });
    bind(this._touchBtnJump,
      () => { this._touchJumpJustDown = true; this._touchJump = true; },
      () => { this._touchJump = false; });

    document.body.appendChild(this._touchBtnLeft);
    document.body.appendChild(this._touchBtnRight);
    document.body.appendChild(this._touchBtnJump);
  }

  // ── Microphone / speech-to-build ─────────────────────────

  _toggleMic() {
    if (this._micListening) {
      try { this._speechRec?.stop(); } catch (_) {}
      return;
    }
    if (!this._speechRec) this._initSpeech();
    try {
      this._speechRec.start();
    } catch (_) {
      // Already started or unavailable; reset state
      this._micListening = false;
      this._micBtnEl?.classList.remove('mic-on');
    }
  }

  _initSpeech() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      this._micListening = true;
      this._micBtnEl?.classList.add('mic-on');
      this._micBtnEl && (this._micBtnEl.textContent = '🔴');
      if (this.buildInputEl) {
        this.buildInputEl.value = '';
        this.buildInputEl.placeholder = '🎤 Listening…';
      }
    };

    rec.onresult = (event) => {
      const latest = event.results[event.results.length - 1];
      const text   = latest[0].transcript.trim();
      if (this.buildInputEl) this.buildInputEl.value = text;
      if (latest.isFinal && text) {
        // small delay so user sees what was heard before it builds
        this.time.delayedCall(180, () => this._handleBuild());
      }
    };

    const _reset = () => {
      this._micListening = false;
      this._micBtnEl?.classList.remove('mic-on');
      this._micBtnEl && (this._micBtnEl.textContent = '🎤');
      if (this.buildInputEl) this.buildInputEl.placeholder = 'What to build? (boat, jetpack, wings…)';
    };

    rec.onerror = (event) => {
      _reset();
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this._showMsg('🎤 Mic blocked!\nAllow microphone in browser settings.');
      }
      // 'no-speech', 'aborted', etc. are silently ignored
    };

    rec.onend = _reset;

    this._speechRec = rec;
  }

  // ── Build ─────────────────────────────────────────────────

  _handleBuild() {
    if (this._awaitingStart) { this._startGame(); return; }
    if (this._inGameOver) { this._handleNameSubmit(); return; }
    if (!this._gameStarted) return;
    const raw = this.buildInputEl.value.trim();
    if (!raw) return;
    this.buildInputEl.value = '';
    this.buildInputEl.blur();

    const item = this.buildSystem.interpret(raw);

    // Special non-attachment actions
    if (item.placesHouse) {
      this._placeHouse();
      this._showMsg(`${item.emoji} ${item.name}!\n"${item.description}"`);
      return;
    }
    if (item.catSwarm) {
      this._spawnCatSwarm();
      return;
    }

    // Auto-replace: one item at a time
    this.attachments = [];
    this.stickman.clearAttachments();

    this.attachments.push(item);
    this.stickman.addAttachment(item);
    this._updateHUD();
    this._spawnBug(item);
    this._showMsg(`${item.emoji} ${item.name}!\n"${item.description}"`);

    // Mountain colliders: car/truck can drive over (ramp boost), don't block them
    const hasCar = this._hasCarItem();
    for (const col of this._playerMtnColliders) col.active = !hasCar;
  }

  _showStartScreen() {
    this._awaitingStart = true;
    const W = this.scale.width, H = this.scale.height;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000011, 0.75)
      .setScrollFactor(0).setDepth(150);
    const title = this.add.text(W / 2, H / 2 - 110, '🌍 BAD WALKER', {
      fontSize: '36px', fill: '#FFE44D', stroke: '#1a1a2a', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    const sub = this.add.text(W / 2, H / 2 - 68, 'Bop NPCs. Don\'t get caught. Finish the planet.', {
      fontSize: '16px', fill: '#ccc', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);

    const lbHeader = this.add.text(W / 2, H / 2 - 32, '── HIGH SCORES ──', {
      fontSize: '13px', fill: '#FFE44D', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    const lbRows = this.add.text(W / 2, H / 2 - 14, 'Loading…', {
      fontSize: '13px', fill: '#aaa', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(151);
    this.leaderboard.getTop(5).then(rows => {
      if (!rows?.length) { lbRows.setText('(no scores yet)'); return; }
      lbRows.setText(rows.map((r, i) => `${i + 1}. ${r.name.substring(0, 12).padEnd(13)} ${r.score}`).join('\n'));
    });

    const prompt = this.add.text(W / 2, H - 60, '↓ Enter your name below and press START', {
      fontSize: '14px', fill: '#88aaff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);

    this._startUI = [overlay, title, sub, lbHeader, lbRows, prompt];

    this.buildInputEl.value = '';
    this.buildInputEl.placeholder = 'Enter your name…';
    this.buildBtnEl.textContent   = '▶ START';
    this.buildBtnEl.style.background  = '#1a5a1a';
    this.buildBtnEl.style.borderColor = '#0a3a0a';
    this.buildInputEl.focus();
  }

  _startGame() {
    this.playerName = (this.buildInputEl.value.trim() || 'Anonymous').substring(0, 20);
    this._awaitingStart = false;
    this._gameStarted   = true;

    for (const obj of this._startUI) obj.destroy();
    this._startUI = [];

    if (this._buildBarEl) this._buildBarEl.style.display = '';
    this.buildInputEl.value       = '';
    this.buildInputEl.placeholder = 'What to build? (boat, jetpack, fire suit, gravity boots…)';
    this.buildBtnEl.textContent   = '⚙ BUILD!';
    this.buildBtnEl.style.background  = '#c0392b';
    this.buildBtnEl.style.borderColor = '#922b21';
    this.buildInputEl.blur();

    this._showMsg(`Welcome, ${this.playerName}!\nBop NPCs, don't get caught, finish the planet!`);
  }

  _spawnBug(item) {
    const startX = this.cameras.main.scrollX - 90;
    const groundY = GROUND_Y - 10;
    const targetX = this.stickman.physBody.x;
    const bugGfx  = this.add.graphics().setDepth(55);
    const cargo   = this.add.text(startX, groundY-42, item.emoji, { fontSize:'30px' }).setOrigin(0.5,1).setDepth(57);
    const name    = this.add.text(startX, groundY-74, item.name, { fontSize:'15px', fill:'#FFE44D', stroke:'#1a1a1a', strokeThickness:3, fontStyle:'bold' }).setOrigin(0.5,1).setDepth(57);
    const badge   = this.add.text(startX, groundY-93, '📦 DELIVERY!', { fontSize:'12px', fill:'#fff', stroke:'#000', strokeThickness:2 }).setOrigin(0.5,1).setDepth(57);
    const proxy   = { x: startX };
    let frame = 0;
    this.tweens.add({
      targets: proxy, x: targetX, duration: 1800, ease: 'Linear',
      onUpdate: () => {
        frame++;
        const bx = proxy.x, ls = Math.sin(frame * 0.55) * 8;
        bugGfx.clear();
        bugGfx.fillStyle(0x8B5E3C); bugGfx.fillRect(bx-24, groundY-52, 48, 34);
        bugGfx.lineStyle(2.5,0x4A2E0A); bugGfx.strokeRect(bx-24, groundY-52, 48, 34);
        bugGfx.lineBetween(bx-24,groundY-52,bx+24,groundY-18); bugGfx.lineBetween(bx+24,groundY-52,bx-24,groundY-18);
        bugGfx.fillStyle(0x1a1a1a); bugGfx.fillEllipse(bx+2,groundY-5,42,20); bugGfx.fillCircle(bx-18,groundY-5,12);
        bugGfx.fillStyle(0x333333,0.6); bugGfx.fillEllipse(bx+5,groundY-10,26,10);
        bugGfx.fillStyle(0xFF4444); bugGfx.fillCircle(bx-24,groundY-9,4); bugGfx.fillCircle(bx-13,groundY-9,4);
        bugGfx.lineStyle(2,0x444444); bugGfx.lineBetween(bx-24,groundY-16,bx-33,groundY-32); bugGfx.lineBetween(bx-15,groundY-17,bx-18,groundY-34);
        bugGfx.fillStyle(0xFF4444); bugGfx.fillCircle(bx-33,groundY-32,3); bugGfx.fillCircle(bx-18,groundY-34,3);
        bugGfx.lineStyle(3,0x1a1a1a);
        for (let i=0;i<3;i++) { const lx=bx-5+i*12, ph=i%2===0?ls:-ls; bugGfx.lineBetween(lx,groundY-2,lx-14,groundY+10+ph); bugGfx.lineBetween(lx,groundY-2,lx+14,groundY+10-ph); }
        cargo.setX(bx); name.setX(bx); badge.setX(bx);
      },
      onComplete: () => {
        bugGfx.destroy(); cargo.destroy(); name.destroy(); badge.destroy();
        const poof = this.add.text(this.stickman.x, this.stickman.y-30, '💥', { fontSize:'44px' }).setOrigin(0.5).setDepth(60);
        const ok   = this.add.text(this.stickman.x, this.stickman.y-75, '✅ INSTALLED!', { fontSize:'19px', fill:'#00FF88', stroke:'#000', strokeThickness:3, fontStyle:'bold' }).setOrigin(0.5).setDepth(60);
        this.tweens.add({ targets:[poof,ok], y:'-=45', alpha:0, duration:900, onComplete:()=>{ poof.destroy(); ok.destroy(); } });
      },
    });
  }

  // ── Collision & Events ────────────────────────────────────

  _handlePlayerNPCCollision(npc) {
    const playerBottom = this.stickman.physBody.y + 30;
    const velY         = this.stickman.physBody.body.velocity.y;
    // Bop: player feet above NPC mid-point and moving downward (or just landing)
    if (playerBottom < npc.physBody.y && velY >= -20) {
      this._onBop(npc);
      return;
    }
    if (this._hasCarItem() && !npc.isFallen) {
      npc.knockDown();
      const splat = this.add.text(npc.physBody.x, npc.physBody.y - 30, '💥 BONK!', {
        fontSize: '16px', fill: '#FF9900', stroke: '#000', strokeThickness: 2, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: splat, y: splat.y - 35, alpha: 0, duration: 900, onComplete: () => splat.destroy() });
      return;
    }
    if (!npc.isAngry && this._hasRammingItem()) {
      npc.makeAngry(this.stickman);
      this._playAngry();
      this._showMsg('😤 They\'re FURIOUS!\nBuild something to escape!');
    } else if (npc.isAngry && this.catchCooldown <= 0) {
      this._triggerCaught(npc);
    }
  }

  _onBop(npc) {
    if (npc.isFallen || (npc._bopCooldown ?? 0) > 0) return;
    npc._bopCooldown = 5;

    this.stickman.physBody.body.setVelocityY(-280);
    this._addScore(3);
    this._playBop();
    npc.knockDown();

    const pts = this.add.text(npc.physBody.x, npc.physBody.y - 50, '+3 ⭐', {
      fontSize: '20px', fill: '#00FF88', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: pts, y: pts.y - 55, alpha: 0, duration: 1100, onComplete: () => pts.destroy() });
  }

  _triggerCaught(npc) {
    this.catchCooldown = 2.5;
    this._addScore(-5);
    const dir = this.stickman.x > npc.physBody.x ? 1 : -1;
    this.stickman.physBody.body.setVelocityX(dir * 420);
    this.stickman.physBody.body.setVelocityY(-210);
    this.cameras.main.shake(380, 0.018);
    this.cameras.main.flash(220, 255, 60, 0);
    this._showMsg('😵 SMACKED!\nBuild something faster to escape!');
    this.time.delayedCall(1600, () => npc.giveUp());
    const stars = this.add.text(this.stickman.x, this.stickman.y-50, '💫 💫 💫', { fontSize:'18px' }).setOrigin(0.5).setDepth(70);
    this.tweens.add({ targets:stars, y:stars.y-40, alpha:0, duration:900, onComplete:()=>stars.destroy() });
    const pen = this.add.text(this.stickman.x, this.stickman.y - 80, '-5 ⭐', {
      fontSize: '18px', fill: '#FF4444', stroke: '#000', strokeThickness: 2, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(70);
    this.tweens.add({ targets: pen, y: pen.y - 40, alpha: 0, duration: 900, onComplete: () => pen.destroy() });
  }

  // ── Per-frame checks ──────────────────────────────────────

  _checkGaps(dt) {
    this.gapWarnCooldown = Math.max(0, this.gapWarnCooldown - dt);
    const px = this.stickman.x;
    for (const gap of GAPS) {
      if (px > gap.x && px < gap.x + gap.w) {
        const canCross = gap.type === 'water'
          ? this.attachments.some(a => a.canSwim)
          : this.stickman.canFly;
        if (!canCross) {
          const atLeft = px < gap.x + gap.w / 2;
          this.stickman.physBody.setPosition(
            atLeft ? gap.x - 14 : gap.x + gap.w + 14,
            this.stickman.physBody.y,
          );
          this.stickman.physBody.body.setVelocityX(0);
          if (this.gapWarnCooldown <= 0) {
            this._showMsg(gap.msg);
            this.gapWarnCooldown = 3.5;
          }
          this._gapFx(px, gap.fx);
        }
      }
    }
  }

  _gapFx(x, emoji) {
    if (this._lastFxX && Math.abs(x - this._lastFxX) < 40) return;
    this._lastFxX = x;
    this.time.delayedCall(350, () => { this._lastFxX = null; });
    const s = this.add.text(x, GROUND_Y, emoji, { fontSize:'20px' }).setOrigin(0.5,1).setDepth(60);
    this.tweens.add({ targets:s, y:s.y-30, alpha:0, duration:500, onComplete:()=>s.destroy() });
  }

  _checkNPCGiveUp() {
    if (this.catchCooldown > 0) return;
    for (const npc of this.npcs) {
      if (!npc.isAngry || npc.isZombie) continue; // zombies never give up
      const dx = Math.abs(this.stickman.x - npc.physBody.x);
      if (dx > 560 || (this._hasFastEscape() && dx > 230)) npc.giveUp();
    }
  }

  _checkEnvironment() {
    const px = this.stickman.x;
    // Ice: slippery friction
    this.stickman.frictionFactor = (px >= FROZEN_X && px < GAPS[3].x) ? 0.97 : 0.75;
    // Space: low gravity
    this.stickman.physBody.body.setGravityY(px >= SPACE_X ? -480 : 0);
  }

  _checkIslandTransition() {
    const island = islandAt(this.stickman.x);
    if (island && island !== this.currentIsland) {
      this.currentIsland = island;
      const meta = ISLANDS[island];
      this.islandLabel.setText(meta.label);
      const banner = this.add.text(this.scale.width/2, this.scale.height/2-100, meta.banner, {
        fontSize:'26px', fill:'#FFE44D', stroke:'#1a3a1a', strokeThickness:4, fontStyle:'bold', align:'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      this.tweens.add({ targets:banner, y:banner.y-45, alpha:0, duration:2800, delay:600, onComplete:()=>banner.destroy() });
    }
  }

  _updateParticles(dt) {
    // Waves
    this.waveOffset += 0.045;
    const wg = this.waveGfx;
    wg.clear();
    wg.lineStyle(3, 0x90CAF9, 0.65);
    for (let wx = GAPS[0].x+18; wx < GAPS[0].x+GAPS[0].w-18; wx += 50) {
      const wy = GROUND_Y + 6 + Math.sin(wx * 0.05 + this.waveOffset) * 5;
      wg.beginPath(); wg.moveTo(wx, wy); wg.lineTo(wx+28, wy+3); wg.strokePath();
    }

    // Snowflakes
    const sg = this.snowGfx;
    sg.clear();
    sg.fillStyle(0xFFFFFF, 0.8);
    for (const f of this.snowflakes) {
      f.y += f.spd * dt;
      f.x += Math.sin(f.y * 0.03) * 0.4;
      if (f.y > GROUND_Y) { f.y = 0; f.x = FROZEN_X + Math.random() * (GAPS[3].x - FROZEN_X); }
      sg.fillCircle(f.x, f.y, f.sz);
    }

    // Lava embers
    const eg = this.emberGfx;
    eg.clear();
    for (const e of this.embers) {
      e.y -= e.spd * dt;
      if (e.y < GROUND_Y - 120) { e.y = GROUND_Y - 5; e.x = GAPS[1].x + Math.random() * GAPS[1].w; }
      const alpha = 1 - (GROUND_Y - e.y) / 120;
      eg.fillStyle(0xFF4500, alpha);
      eg.fillCircle(e.x, e.y, 3);
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  async _handleNameSubmit() {
    const name = (this.buildInputEl.value.trim() || 'Anonymous').substring(0, 20);
    this._inGameOver = false;
    if (this._buildBarEl) this._buildBarEl.style.display = 'none';
    if (this._lbText) this._lbText.setText('Submitting…');
    await this.leaderboard.submit(name, Math.round(this.score));
    const rows = await this.leaderboard.getTop(10);
    this._renderLeaderboard(rows, name);
    this._showPlayAgain();
  }

  _showPlayAgain() {
    const W = this.scale.width, H = this.scale.height;
    this.add.text(W / 2, H - 18, 'SPACE  to play again', {
      fontSize: '15px', fill: '#777', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(201);
    this.time.delayedCall(500, () => {
      this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    });
  }

  _renderLeaderboard(rows, myName) {
    if (!this._lbText?.scene) return;
    if (!rows?.length) {
      this._lbText.setText('  (no scores yet — be first!)');
      return;
    }
    const lines = rows.map((r, i) => {
      const rank  = `${i + 1}.`.padEnd(3);
      const name  = r.name.substring(0, 15).padEnd(16);
      const score = String(r.score).padStart(4);
      const you   = r.name === myName ? ' ◄' : '';
      return `${rank} ${name} ${score}${you}`;
    });
    this._lbText.setText(lines.join('\n'));
  }

  _hasRammingItem() { return this.attachments.some(a => a.type==='wheels' && (a.speed??0)>=130); }
  _hasFastEscape()  { return this.stickman.canFly || this.stickman.moveSpeed > 250; }
  _hasCarItem()     { return this.attachments.some(a => a.rams === true); }

  _checkNPCProximity() {
    for (const npc of this.npcs) {
      if (npc.isFallen || npc.isAngry) continue;
      const dx = Math.abs(this.stickman.x - npc.physBody.x);
      const dy = Math.abs(this.stickman.y - npc.physBody.y);
      if (dx < 170 && dy < 80) { npc.makeAngry(this.stickman); this._playAngry(); }
    }
  }

  _gameOver() {
    if (this._gameEnded) return;
    this._gameEnded = true;
    this._stopMusic();

    this.stickman.physBody.body.setVelocityX(0);
    this.cameras.main.shake(400, 0.012);

    const W = this.scale.width, H = this.scale.height;
    const finalScore = Math.round(this.score);

    const msg = finalScore >= 70 ? '🏆 Unstoppable! Fast AND boppy.'
      : finalScore >= 50  ? '⚡ Great run! Nice balance.'
      : finalScore >= 30  ? '👍 Solid. Keep moving next time.'
      : finalScore >= 10  ? '😬 Slow. The clock was hungry.'
      : finalScore >= 0   ? '😅 Just barely made it.'
      : '💀 The clock ate you alive.';

    // Overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000011, 0.92)
      .setScrollFactor(0).setDepth(200);

    // Title + score
    this.add.text(W / 2, 16, '🌍 PLANET COMPLETE!', {
      fontSize: '26px', fill: '#FFE44D', stroke: '#1a1a2a', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

    this.add.text(W / 2, 52, `${finalScore} ⭐    ${msg}`, {
      fontSize: '17px', fill: '#fff', stroke: '#000', strokeThickness: 2, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

    // Leaderboard header
    this.add.text(W / 2, 86, '─── LEADERBOARD ───', {
      fontSize: '14px', fill: '#FFE44D', stroke: '#000', strokeThickness: 2,
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

    // Leaderboard rows (populated async)
    this._lbText = this.add.text(W / 2, 108, 'Loading…', {
      fontSize: '14px', fill: '#ccc', stroke: '#000', strokeThickness: 1,
      fontFamily: 'monospace', align: 'left',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

    // Hide build UI — name was captured at game start
    if (this._buildBarEl) this._buildBarEl.style.display = 'none';

    // Auto-submit score and show leaderboard
    this.leaderboard.submit(this.playerName, Math.round(this.score)).then(() => {
      return this.leaderboard.getTop(10);
    }).then(rows => {
      this._renderLeaderboard(rows, this.playerName);
      this._showPlayAgain();
    });
  }

  _addScore(n) {
    this.score += n;
    this._updateScoreDisplay();
    // Brief scale pulse on event additions
    if (n !== 0) {
      this.tweens.add({ targets: this.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 90,
        yoyo: true, ease: 'Quad.easeOut' });
    }
  }

  _updateScoreDisplay() {
    const s = Math.round(this.score);
    const col = s > 70 ? '#00FF88' : s > 40 ? '#FFE44D' : s > 15 ? '#FF9900' : '#FF4444';
    this.scoreText.setText(`⭐ ${s}`);
    this.scoreText.setColor(col);
  }

  _drawPlanetCurve() {
    const W = this.scale.width;
    const scrollY = this.cameras.main.scrollY;
    const groundScreenY = GROUND_Y - scrollY;
    const R = 2500;
    this.planetCurveGfx.clear();
    this.planetCurveGfx.lineStyle(3, 0x1a3050, 0.28);
    this.planetCurveGfx.strokeCircle(W / 2, groundScreenY + R, R);
  }

  _showMsg(msg) { this.msgText.setText(msg); this.msgTimer = 4; }

  _updateHUD() {
    this.attachmentText.setText(
      this.attachments.length === 0 ? 'No attachments'
        : 'Carrying:\n' + this.attachments.map(a=>`${a.emoji} ${a.name}`).join('\n')
    );
  }

  _checkLavaBurn(dt) {
    const px = this.stickman.physBody.x;
    const onGround = this.stickman.physBody.body.blocked.down;
    const inLava = px > GAPS[1].x && px < GAPS[1].x + GAPS[1].w;
    if (inLava && onGround) {
      if (!this.stickman.onFire) {
        this.stickman.onFire = true;
        this._showMsg('🔥 LAVA BURNS!\nFLY to cross — build wings, jetpack, or fire boots!');
        this.cameras.main.flash(400, 255, 60, 0);
        this.cameras.main.shake(300, 0.025);
      }
      // Violently eject player from lava surface
      this.stickman.physBody.body.setVelocityY(-500);
      // Severe score drain: -15/sec while touching lava
      this.score -= dt * 15;
    } else if (!inLava) {
      this.stickman.onFire = false;
    }
    // Flying through lava zone still hurts a little
    if (this.stickman.onFire && !onGround) {
      this.score -= dt * 2;
    }
  }

  // ── Update loop ──────────────────────────────────────────

  update(time, delta) {
    if (this._gameEnded) return;
    if (!this._gameStarted) return;
    const dt = delta / 1000;

    // House door check BEFORE stickman processes space key
    this._checkHouseDoor();

    this.stickman?.update(time, delta, this.cursors, this.spaceKey);

    // ── Touch controls (applied after keyboard update) ────────
    if (this.stickman && !this.stickman.isFalling) {
      if (this._touchLeft) {
        this.stickman.physBody.body.setVelocityX(-this.stickman.moveSpeed);
        this.stickman.facingRight = false;
        this.stickman.isMoving = true;
      }
      if (this._touchRight) {
        this.stickman.physBody.body.setVelocityX(this.stickman.moveSpeed);
        this.stickman.facingRight = true;
        this.stickman.isMoving = true;
      }
    }
    if (this.stickman && this._touchJumpJustDown && !this._houseDoorConsumed) {
      this._touchJumpJustDown = false;
      if (this.stickman.physBody.body.blocked.down && !this.stickman.isFalling) {
        this.stickman.physBody.body.setVelocityY(this.stickman.jumpVelocity);
      }
    } else if (this._houseDoorConsumed) {
      this._touchJumpJustDown = false;
    }
    if (this.stickman && this._touchJump && this.stickman.canFly
        && !this.stickman.physBody.body.blocked.down && !this.stickman.isFalling) {
      const tdt = delta / 1000;
      const cur = this.stickman.physBody.body.velocity.y;
      this.stickman.physBody.body.setVelocityY(
        cur + (this.stickman.flySpeed - cur) * Math.min(tdt * 4, 1));
    }

    for (const npc of this.npcs) {
      npc.update(time, delta);
      if ((npc._bopCooldown ?? 0) > 0) npc._bopCooldown -= dt;
    }

    // ── Planet loop / game end ────────────────────────────
    const px = this.stickman.physBody.x;
    if (px > WORLD_W - 50) {
      this._gameOver();
      return;
    } else if (px < 50) {
      this.stickman.physBody.setPosition(WORLD_W - 80, this.stickman.physBody.y);
    }

    // Score counts down 1 point per second (paused while inside house)
    if (!this._inHouse) this.score -= dt;
    this._updateScoreDisplay();
    if (this._houseText) this._houseText.setVisible(this._inHouse);

    this._checkGaps(dt);
    this._checkLavaBurn(dt);
    this._checkNPCGiveUp();
    this._checkNPCProximity();
    this._checkEnvironment();
    this._checkIslandTransition();
    this._updateParticles(dt);
    this._updateBirds(dt);
    this._checkBirdCollisions();
    this._updateCats(dt);
    this._checkMountainRamps();
    this._updateATAT(dt);
    this._drawPlanetCurve();

    if (this.catchCooldown > 0)   this.catchCooldown -= dt;
    if (this.birdHitCooldown > 0) this.birdHitCooldown -= dt;

    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0) this.msgText.setText('');
    }

    for (const c of this.clouds) {
      c.gfx.x += c.spd;
      if (c.gfx.x > WORLD_W + 200) c.gfx.x = -200;
    }
  }

  // ── House / pause clock ─────────────────────────────────────

  _placeHouse() {
    if (this._house) {
      this._showMsg('🏠 House already built!\nWalk to the door and jump to enter/exit.');
      return;
    }
    const fd = this.stickman.facingRight ? 1 : -1;
    const hx = this.stickman.x + fd * 110;
    this._house = { x: hx, w: 90, gfx: this.add.graphics().setDepth(5) };
    this._drawHouseGraphic(this._house.gfx, hx);
    // Floating hint above the door
    this._doorHintText = this.add.text(hx, GROUND_Y - 85, '⬆ JUMP\nto enter', {
      fontSize: '13px', fill: '#FFE44D', stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5, 1).setDepth(91).setVisible(false);
    this._showMsg('🏠 House built!\nWalk to the door and jump ▲ to enter!');
  }

  _drawHouseGraphic(g, hx) {
    const hy = GROUND_Y, hw = 90, hh = 75;
    // Walls
    g.fillStyle(0xD2B48C, 1);
    g.fillRect(hx - hw/2, hy - hh, hw, hh);
    g.lineStyle(2, 0x8B6914);
    g.strokeRect(hx - hw/2, hy - hh, hw, hh);
    // Roof
    g.fillStyle(0xCC3333, 1);
    g.fillTriangle(hx - hw/2 - 8, hy - hh, hx, hy - hh - 38, hx + hw/2 + 8, hy - hh);
    g.lineStyle(2, 0x881111);
    g.lineBetween(hx - hw/2 - 8, hy - hh, hx, hy - hh - 38);
    g.lineBetween(hx, hy - hh - 38, hx + hw/2 + 8, hy - hh);
    // Door
    g.fillStyle(0x8B4513, 1);
    g.fillRect(hx - 12, hy - 36, 24, 36);
    g.lineStyle(1.5, 0x5A2D0C);
    g.strokeRect(hx - 12, hy - 36, 24, 36);
    g.fillStyle(0xFFCC66, 1);
    g.fillCircle(hx + 7, hy - 18, 3);
    // Left window
    g.fillStyle(0x99DDFF, 0.82);
    g.fillRect(hx - hw/2 + 9, hy - hh + 15, 20, 16);
    g.lineStyle(1.5, 0x8B6914);
    g.strokeRect(hx - hw/2 + 9, hy - hh + 15, 20, 16);
    g.lineBetween(hx - hw/2 + 19, hy - hh + 15, hx - hw/2 + 19, hy - hh + 31);
    g.lineBetween(hx - hw/2 + 9, hy - hh + 23, hx - hw/2 + 29, hy - hh + 23);
    // Right window
    g.fillStyle(0x99DDFF, 0.82);
    g.fillRect(hx + hw/2 - 29, hy - hh + 15, 20, 16);
    g.lineStyle(1.5, 0x8B6914);
    g.strokeRect(hx + hw/2 - 29, hy - hh + 15, 20, 16);
    g.lineBetween(hx + hw/2 - 19, hy - hh + 15, hx + hw/2 - 19, hy - hh + 31);
    g.lineBetween(hx + hw/2 - 29, hy - hh + 23, hx + hw/2 - 9, hy - hh + 23);
    // Chimney
    g.fillStyle(0x888888, 1);
    g.fillRect(hx + hw/2 - 26, hy - hh - 48, 14, 20);
    g.lineStyle(1.5, 0x666666);
    g.strokeRect(hx + hw/2 - 26, hy - hh - 48, 14, 20);
  }

  _checkHouseDoor() {
    this._houseDoorConsumed = false;
    if (!this._house) { this._nearHouseDoor = false; this._doorHintText?.setVisible(false); return; }

    const px = this.stickman.x;
    const onGround = this.stickman.physBody.body.blocked.down;
    this._nearHouseDoor = onGround && Math.abs(px - this._house.x) < 32;

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey) || this._touchJumpJustDown;

    if (this._nearHouseDoor && jumpPressed) {
      // Toggle entry/exit
      this._inHouse = !this._inHouse;
      this._houseDoorConsumed = true;
      if (this._touchJumpJustDown) this._touchJumpJustDown = false;
      this.stickman._suppressNextJump = true;
      this._doorHintText?.setVisible(false);
      this._showMsg(this._inHouse ? '🏠 Inside! Clock paused!' : '🏠 Back outside — clock running!');
    } else if (this._doorHintText) {
      const showHint = this._nearHouseDoor;
      this._doorHintText.setVisible(showHint);
      if (showHint) this._doorHintText.setText(this._inHouse ? '⬆ JUMP\nto exit' : '⬆ JUMP\nto enter');
    }
  }

  // ── Cat swarm ─────────────────────────────────────────────

  _spawnCatSwarm() {
    this._cats = [];
    for (let i = 0; i < 9; i++) {
      this._cats.push({
        x: this.stickman.x + (Math.random() - 0.5) * 80,
        y: GROUND_Y - 18,
        vx: (Math.random() - 0.5) * 200,
        vy: -80 - Math.random() * 120,
        target: null, phase: Math.random() * Math.PI * 2,
        done: false, groundTimer: 0,
      });
    }
    this._showMsg('🐱 CAT SWARM UNLEASHED!\nCats hunt birds and spread TOXOPLASMOSIS!');
  }

  _updateCats(dt) {
    if (this._cats.length === 0) { this._catGfx?.clear(); return; }
    const g = this._catGfx;
    g.clear();
    for (const cat of this._cats) {
      if (cat.done) continue;
      cat.phase += dt * 12;
      // gravity
      cat.vy += 400 * dt;
      cat.x  += cat.vx * dt;
      cat.y  += cat.vy * dt;
      if (cat.y >= GROUND_Y - 18) { cat.y = GROUND_Y - 18; cat.vy = 0; cat.groundTimer += dt; }

      // acquire target after settling
      if (cat.groundTimer > 0.3 && !cat.target) {
        let nearest = null, nearDist = Infinity;
        for (const bird of this.birds) {
          const d = Math.hypot(cat.x - bird.x, cat.y - bird.y);
          if (d < nearDist) { nearDist = d; nearest = { type: 'bird', ref: bird }; }
        }
        if (nearDist > 550) {
          for (const npc of this.npcs) {
            if (npc.isZombie || npc.isFallen) continue;
            const d = Math.hypot(cat.x - npc.physBody.x, cat.y - npc.physBody.y);
            if (d < nearDist) { nearDist = d; nearest = { type: 'npc', ref: npc }; }
          }
        }
        cat.target = nearest;
      }

      // chase
      if (cat.target) {
        const tx = cat.target.type === 'bird' ? cat.target.ref.x : cat.target.ref.physBody.x;
        const ty = cat.target.type === 'bird' ? cat.target.ref.y : cat.target.ref.physBody.y - 20;
        const dx = tx - cat.x, dy = ty - cat.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 35) {
          if (cat.target.type === 'bird') {
            const idx = this.birds.indexOf(cat.target.ref);
            if (idx !== -1) {
              this.birds.splice(idx, 1);
              const hit = this.add.text(cat.x, cat.y - 25, '🐱✨ POUNCE!', {
                fontSize: '14px', fill: '#FFE44D', stroke: '#000', strokeThickness: 2,
              }).setOrigin(0.5).setDepth(80);
              this.tweens.add({ targets: hit, y: hit.y - 35, alpha: 0, duration: 900, onComplete: () => hit.destroy() });
            }
          } else {
            cat.target.ref.makeZombie(this.stickman);
          }
          cat.done = true; continue;
        }
        const spd = cat.target.type === 'bird' ? 310 : 175;
        cat.vx = (dx / dist) * spd;
        // For birds: physics-based jump to reach target height (v = sqrt(2*g*h))
        if (cat.target.type === 'bird' && cat.y >= GROUND_Y - 22) {
          const h = Math.abs(ty - (GROUND_Y - 22)) + 40;
          cat.vy = -Math.sqrt(2 * 430 * h);
        }
      }
      this._drawCat(g, cat.x, cat.y, cat.phase, cat.vx >= 0);
    }
    this._cats = this._cats.filter(c => !c.done);
  }

  _drawCat(g, x, y, phase, facingRight) {
    const fd = facingRight ? 1 : -1;
    g.fillStyle(0xFF8844, 1);
    g.fillEllipse(x, y - 4, 20, 12);
    g.fillCircle(x + fd * 9, y - 7, 8);
    // ears
    const ex = x + fd * 9;
    g.fillTriangle(ex + fd * 1, y - 13, ex + fd * 5, y - 21, ex - fd * 2, y - 13);
    g.fillTriangle(ex + fd * 5, y - 13, ex + fd * 9, y - 21, ex + fd * 12, y - 13);
    // eyes
    g.fillStyle(0x333333, 1);
    g.fillCircle(ex + fd * 3, y - 8, 1.8);
    g.fillCircle(ex + fd * 6, y - 8, 1.8);
    // tail
    const tw = Math.sin(phase * 0.7) * 10;
    g.lineStyle(2.5, 0xFF8844);
    g.beginPath(); g.moveTo(x - fd * 8, y - 4); g.lineTo(x - fd * 17, y - 8 + tw); g.strokePath();
    // legs
    g.lineStyle(2, 0xCC6622);
    const ls = Math.sin(phase) * 5;
    g.lineBetween(x - 5, y,  x - 5 + ls,  y + 10);
    g.lineBetween(x - 1, y,  x - 1 - ls,  y + 10);
    g.lineBetween(x + 2, y,  x + 2 + ls,  y + 10);
    g.lineBetween(x + 6, y,  x + 6 - ls,  y + 10);
  }

  // ── Mountain ramps (for car/truck) ───────────────────────

  _checkMountainRamps() {
    if (!this._hasCarItem()) return;
    const body = this.stickman.physBody.body;
    if (!body.blocked.down) return;
    if (Math.abs(body.velocity.x) < 50) return;
    for (const def of this.mountainDefs) {
      const dx = Math.abs(this.stickman.x - def.cx);
      if (dx < def.baseW + 55) {
        body.setVelocityY(-510);
        this.cameras.main.shake(140, 0.009);
        const txt = this.add.text(this.stickman.x, this.stickman.y - 40, '🚛 RAMP!', {
          fontSize: '16px', fill: '#FF9900', stroke: '#000', strokeThickness: 2, fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(70);
        this.tweens.add({ targets: txt, y: txt.y - 45, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
        break;
      }
    }
  }

  // ── AT-AT laser system ────────────────────────────────────

  _updateATAT(dt) {
    if (!this.attachments.some(a => a.type === 'atat')) {
      this._laserGfx?.clear(); this._atatLasers = []; return;
    }
    this._atatFireTimer -= dt;
    if (this._atatFireTimer <= 0) { this._atatFireTimer = 2.5; this._fireATATLaser(); }
    this._atatLasers = this._atatLasers.filter(l => { l.age += dt; return l.age < 0.35; });
    const g = this._laserGfx;
    g.clear();
    for (const l of this._atatLasers) {
      const a = 1 - l.age / 0.35;
      g.lineStyle(3.5, 0xFF0066, a);     g.lineBetween(l.sx, l.sy, l.tx, l.ty);
      g.lineStyle(1.5, 0xFF88CC, a * 0.7); g.lineBetween(l.sx, l.sy, l.tx, l.ty);
    }
  }

  _fireATATLaser() {
    const range = 380;
    let nearest = null, nearDist = range;
    for (const npc of this.npcs) {
      if (npc.isFallen) continue;
      const dx = npc.physBody.x - this.stickman.x;
      if ((dx > 0) !== this.stickman.facingRight) continue;
      const d = Math.hypot(dx, npc.physBody.y - this.stickman.y);
      if (d < nearDist) { nearDist = d; nearest = npc; }
    }
    if (!nearest) return;
    nearest.knockDown();
    this._addScore(5);
    const fd = this.stickman.facingRight ? 1 : -1;
    const sx = this.stickman.x + fd * 58, sy = this.stickman.y - 50;
    const tx = nearest.physBody.x, ty = nearest.physBody.y - 25;
    this._atatLasers.push({ sx, sy, tx, ty, age: 0 });
    const pts = this.add.text(tx, ty - 30, '⚡ +5', {
      fontSize: '18px', fill: '#FF44FF', stroke: '#000', strokeThickness: 2, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: pts, y: pts.y - 45, alpha: 0, duration: 900, onComplete: () => pts.destroy() });
  }

  // ── Audio ─────────────────────────────────────────────────

  _initAudio() {
    try {
      this._ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    this._musicStopped  = false;
    this._musicTimeout  = null;
    this._musicStarted  = false;
    // Browsers require a user gesture before audio plays
    const unlock = () => {
      if (this._musicStarted) return;
      this._musicStarted = true;
      const resume = () => this._startMusic();
      this._ac.state === 'suspended' ? this._ac.resume().then(resume) : resume();
    };
    this.input.keyboard.on('keydown', unlock);
    this.input.on('pointerdown', unlock);
  }

  _startMusic() {
    // Simple 16-note melody: G A C E  A G E C  B D F# A  G E D C
    const melody = [392, 440, 523, 659,  440, 392, 330, 262,
                    494, 587, 740, 880,  784, 659, 587, 523];
    let step = 0;
    const beatMs = 380; // ~158 BPM
    const tick = () => {
      if (this._musicStopped) return;
      this._playMusicNote(melody[step % melody.length], beatMs / 1000 * 0.72);
      // Add a quiet bass pulse on beat 1 & 3 of each 4-beat group
      if (step % 4 === 0 || step % 4 === 2) {
        this._playMusicBass(melody[step % melody.length] / 2, beatMs / 1000 * 0.5);
      }
      step++;
      this._musicTimeout = setTimeout(tick, beatMs);
    };
    tick();
  }

  _stopMusic() {
    this._musicStopped = true;
    if (this._musicTimeout) { clearTimeout(this._musicTimeout); this._musicTimeout = null; }
  }

  _playMusicNote(freq, dur) {
    try {
      const ctx = this._ac;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  _playMusicBass(freq, dur) {
    try {
      const ctx = this._ac;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  _playBop() {
    try {
      const ctx = this._ac;
      if (!ctx) return;
      // Quick square-wave "boing": starts high, swoops down
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  _playAngry() {
    try {
      const ctx = this._ac;
      if (!ctx) return;
      // Two short sawtooth buzzes rising in pitch
      for (let i = 0; i < 2; i++) {
        const t = ctx.currentTime + i * 0.13;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180 + i * 60, t);
        osc.frequency.linearRampToValueAtTime(360 + i * 60, t + 0.09);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.11);
      }
    } catch (e) {}
  }

  shutdown() {
    this._stopMusic();
    if (this._speechRec) { try { this._speechRec.stop(); } catch (_) {} this._speechRec = null; }
    this._inGameOver    = false;
    this._awaitingStart = false;
    this._gameStarted   = false;
    this._lbText        = null;
    this.buildInputEl?.remove();
    this.buildBtnEl?.remove();
    this._micBtnEl?.remove();
    this.buildInputEl = null;
    this.buildBtnEl   = null;
    this._micBtnEl    = null;
  }
}
