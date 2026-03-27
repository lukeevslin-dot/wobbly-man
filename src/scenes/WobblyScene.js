import Phaser from 'phaser';
import { Stickman } from '../entities/Stickman.js';
import { NPC } from '../entities/NPC.js';
import { BuildSystem } from '../systems/BuildSystem.js';

// ── World layout ──────────────────────────────────────────────────────────────
const GROUND_Y = 440;
const WORLD_W  = 16500;

// Island zones (start x)
const JUNGLE_X  = 3520;
const VOLCANO_X = 7400;
const FROZEN_X  = 10700;
const SPACE_X   = 13700;

// Gaps between islands
const GAPS = [
  { x: 3000,  w: 520,  type: 'water', msg: '🌊 WATER!\nBuild a boat, surfboard, or floaties to cross!',  fx: '💦' },
  { x: 6900,  w: 500,  type: 'lava',  msg: '🔥 LAVA!\nYou need to FLY over it! (jetpack, wings...)',      fx: '🔥' },
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
    this.attachmentText  = null;
    this.islandLabel     = null;
    this.scoreText       = null;
    this.msgText         = null;
    this.msgTimer        = 0;
    this.score           = 0;
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
  }

  create() {
    const H = this.scale.height;
    this.physics.world.setBounds(0, 0, WORLD_W, H * 2);

    this._buildBackgrounds(H);
    this._buildGrounds(H);
    this._buildScenery();
    this._buildGapVisuals(H);
    this._spawnClouds();

    // ── Static ground body (full world width) ─────────────
    const gObj = this.add.rectangle(WORLD_W / 2, GROUND_Y + 50, WORLD_W, 100);
    this.physics.add.existing(gObj, true);
    this.ground = gObj;

    // ── Player ─────────────────────────────────────────────
    this.stickman = new Stickman(this, 120, GROUND_Y - 30);
    this.physics.add.collider(this.stickman.physBody, this.ground);

    // ── NPCs (with solid colliders against player) ─────────
    const npcDefs = [
      { xs: [350,680,1050,1400,1780,2200,2600,2900],  type: 'beach'   },
      { xs: [3680,4100,4580,5050,5520,6000,6450],      type: 'jungle'  },
      { xs: [7600,8100,8600,9100,9600,10000],          type: 'volcano' },
      { xs: [10900,11350,11800,12250,12700],            type: 'frozen'  },
      { xs: [13900,14350,14800,15300,15750,16200],     type: 'space'   },
    ];
    for (const { xs, type } of npcDefs) {
      for (const nx of xs) {
        const npc = new NPC(this, nx, GROUND_Y - 28, type);
        this.physics.add.collider(npc.physBody, this.ground);
        // Solid collider between player and NPC — also handles catch/ram
        this.physics.add.collider(this.stickman.physBody, npc.physBody, () => {
          this._handlePlayerNPCCollision(npc);
        });
        this.npcs.push(npc);
      }
    }

    // ── Camera ─────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.startFollow(this.stickman.physBody, true, 0.08, 0.08);

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.planetCurveGfx = this.add.graphics().setScrollFactor(0).setDepth(90);

    this._createUI();
    this._showMsg('Welcome to Wobbly Beach!\nType anything in the box to build it.');
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
    for (const tx of [3600,3900,4250,4650,5050,5450,5850,6250,6550,6750]) this._drawJungleTree(tx);
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
    this._sign(GAPS[0].x - 20, '⚠ WATER AHEAD\nneed boat/floaties', 0xFFE082, 0x5D3A00);
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
    for (const [fx, fy] of [[GAPS[0].x+80,GROUND_Y+50],[GAPS[0].x+280,GROUND_Y+80],[GAPS[0].x+420,GROUND_Y+35]]) {
      wg.fillTriangle(fx, fy, fx+30, fy-8, fx+30, fy+8);
    }
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

    this.scoreText = this.add.text(W / 2, 12, '⭐ 0', {
      fontSize: '22px', fill: '#FFE44D', stroke: '#1a1a2a', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.add.text(12, H-90, '← → walk   SPACE jump/fly', {
      fontSize: '12px', fill: '#aaa', stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);

    this.attachmentText = this.add.text(W-10, 10, 'No attachments', {
      fontSize: '13px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'right',
    }).setOrigin(1,0).setScrollFactor(0).setDepth(100);

    this.msgText = this.add.text(W/2, H/2-70, '', {
      fontSize: '18px', fill: '#FFE44D', stroke: '#222', strokeThickness: 3,
      align: 'center', wordWrap: { width: 460 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.buildInputEl = document.createElement('input');
    this.buildInputEl.type = 'text';
    this.buildInputEl.placeholder = 'What to build? (boat, jetpack, fire suit, gravity boots...)';
    Object.assign(this.buildInputEl.style, {
      position:'fixed', left:'50%', transform:'translateX(-50%)',
      bottom:'11px', width:'400px', height:'34px',
      background:'rgba(10,10,30,0.92)', border:'2px solid #4a90e2',
      borderRadius:'6px', color:'#fff', padding:'0 10px',
      fontSize:'14px', outline:'none', zIndex:'1000',
    });
    document.body.appendChild(this.buildInputEl);

    this.buildBtnEl = document.createElement('button');
    this.buildBtnEl.textContent = '⚙ BUILD!';
    Object.assign(this.buildBtnEl.style, {
      position:'fixed', left:'calc(50% + 210px)', bottom:'11px',
      width:'80px', height:'34px', background:'#c0392b',
      border:'2px solid #922b21', borderRadius:'6px', color:'#fff',
      fontSize:'13px', fontWeight:'bold', cursor:'pointer', zIndex:'1000',
    });
    document.body.appendChild(this.buildBtnEl);

    this.buildBtnEl.addEventListener('click', () => this._handleBuild());
    this.buildInputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._handleBuild();
      e.stopPropagation();
    });
  }

  // ── Build ─────────────────────────────────────────────────

  _handleBuild() {
    const raw = this.buildInputEl.value.trim();
    if (!raw) return;
    this.buildInputEl.value = '';
    this.buildInputEl.blur();

    const item = this.buildSystem.interpret(raw);

    // Auto-replace: one item at a time
    this.attachments = [];
    this.stickman.clearAttachments();

    this.attachments.push(item);
    this.stickman.addAttachment(item);
    this._updateHUD();
    this._spawnBug(item);
    this._showMsg(`${item.emoji} ${item.name}!\n"${item.description}"`);
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
    if (!npc.isAngry && this._hasRammingItem()) {
      npc.makeAngry(this.stickman);
      this._showMsg('😤 They\'re FURIOUS!\nBuild something to escape!');
    } else if (npc.isAngry && this.catchCooldown <= 0) {
      this._triggerCaught(npc);
    }
  }

  _onBop(npc) {
    if ((npc._bopCooldown ?? 0) > 0) return;
    npc._bopCooldown = 1.5;

    // Bounce player up
    this.stickman.physBody.body.setVelocityY(-280);
    this._addScore(1);
    npc.giveUp();

    const pts = this.add.text(npc.physBody.x, npc.physBody.y - 50, '⭐ BOOP! +1', {
      fontSize: '16px', fill: '#FFE44D', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: pts, y: pts.y - 50, alpha: 0, duration: 900, onComplete: () => pts.destroy() });
  }

  _triggerCaught(npc) {
    this.catchCooldown = 2.5;
    this._addScore(-1);
    const dir = this.stickman.x > npc.physBody.x ? 1 : -1;
    this.stickman.physBody.body.setVelocityX(dir * 420);
    this.stickman.physBody.body.setVelocityY(-210);
    this.cameras.main.shake(380, 0.018);
    this.cameras.main.flash(220, 255, 60, 0);
    this._showMsg('😵 SMACKED!\nBuild something faster to escape!');
    this.time.delayedCall(1600, () => npc.giveUp());
    const stars = this.add.text(this.stickman.x, this.stickman.y-50, '💫 💫 💫', { fontSize:'18px' }).setOrigin(0.5).setDepth(70);
    this.tweens.add({ targets:stars, y:stars.y-40, alpha:0, duration:900, onComplete:()=>stars.destroy() });
  }

  // ── Per-frame checks ──────────────────────────────────────

  _checkGaps(dt) {
    this.gapWarnCooldown = Math.max(0, this.gapWarnCooldown - dt);
    const px = this.stickman.x;
    for (const gap of GAPS) {
      if (px > gap.x && px < gap.x + gap.w) {
        const canCross = gap.type === 'water'
          ? this.attachments.some(a => a.canFly || a.canSwim)
          : this.stickman.canFly;
        if (!canCross) {
          const pushDir = px < gap.x + gap.w / 2 ? -1 : 1;
          this.stickman.physBody.body.setVelocityX(pushDir * 340);
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
      if (!npc.isAngry) continue;
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

  _hasRammingItem() { return this.attachments.some(a => a.type==='wheels' && (a.speed??0)>=130); }
  _hasFastEscape()  { return this.stickman.canFly || this.stickman.moveSpeed > 250; }

  _addScore(n) {
    this.score += n;
    this.scoreText.setText(`⭐ ${this.score}`);
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

  // ── Update loop ──────────────────────────────────────────

  update(time, delta) {
    const dt = delta / 1000;

    this.stickman?.update(time, delta, this.cursors, this.spaceKey);
    for (const npc of this.npcs) {
      npc.update(time, delta);
      if ((npc._bopCooldown ?? 0) > 0) npc._bopCooldown -= dt;
    }

    // ── World wrap (planet loop) ──────────────────────────
    const px = this.stickman.physBody.x;
    if (px > WORLD_W - 50) {
      this.stickman.physBody.setPosition(80, this.stickman.physBody.y);
      this._showMsg('🌍 Around the planet!\nBack to Wobbly Beach!');
    } else if (px < 50) {
      this.stickman.physBody.setPosition(WORLD_W - 80, this.stickman.physBody.y);
    }

    this._checkGaps(dt);
    this._checkNPCGiveUp();
    this._checkEnvironment();
    this._checkIslandTransition();
    this._updateParticles(dt);
    this._drawPlanetCurve();

    if (this.catchCooldown > 0) this.catchCooldown -= dt;

    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0) this.msgText.setText('');
    }

    for (const c of this.clouds) {
      c.gfx.x += c.spd;
      if (c.gfx.x > WORLD_W + 200) c.gfx.x = -200;
    }
  }

  shutdown() {
    this.buildInputEl?.remove();
    this.buildBtnEl?.remove();
    this.buildInputEl = null;
    this.buildBtnEl   = null;
  }
}
