import Phaser from 'phaser';
import { Stickman } from '../entities/Stickman.js';
import { NPC } from '../entities/NPC.js';
import { BuildSystem } from '../systems/BuildSystem.js';

const WORLD_W = 3200;
const GROUND_Y = 440; // top surface of ground

export default class WobblyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WobblyScene' });
    this.stickman = null;
    this.npcs = [];
    this.ground = null;
    this.buildSystem = new BuildSystem();
    this.attachments = [];
    this.buildInputEl = null;
    this.buildBtnEl = null;
    this.attachmentText = null;
    this.msgText = null;
    this.msgTimer = 0;
    this.clouds = [];
  }

  create() {
    const H = this.scale.height; // 540

    // Physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_W, H * 2);

    // ── Background ──────────────────────────────────────────
    // Sky gradient (top half lighter)
    this.add.rectangle(WORLD_W / 2, H / 2, WORLD_W, H, 0x87CEEB);

    // Sun
    this.add.circle(WORLD_W - 300, 70, 48, 0xFFD700);
    this.add.circle(WORLD_W - 300, 70, 44, 0xFFF176); // highlight

    // Clouds
    this._spawnClouds();

    // ── Ground ──────────────────────────────────────────────
    // Sand graphic
    const sandGfx = this.add.graphics();
    sandGfx.fillStyle(0xF4D03F);
    sandGfx.fillRect(0, GROUND_Y, WORLD_W, H - GROUND_Y);
    // Slightly darker strip at top for depth
    sandGfx.fillStyle(0xE8C52A);
    sandGfx.fillRect(0, GROUND_Y, WORLD_W, 8);
    // Pebble dots
    sandGfx.fillStyle(0xDEB887, 0.5);
    for (let i = 40; i < WORLD_W; i += 80) {
      sandGfx.fillCircle(i + Math.sin(i) * 20, GROUND_Y + 15 + Math.cos(i * 0.7) * 8, 4);
    }

    // Ocean strip at the very bottom behind sand
    this.add.rectangle(WORLD_W / 2, H - 10, WORLD_W, 30, 0x1E90FF).setDepth(-1);

    // Static ground body
    const groundObj = this.add.rectangle(WORLD_W / 2, GROUND_Y + 50, WORLD_W, 100);
    this.physics.add.existing(groundObj, true);
    this.ground = groundObj;

    // ── Scenery ─────────────────────────────────────────────
    this._createScenery();

    // ── Player ──────────────────────────────────────────────
    this.stickman = new Stickman(this, 120, GROUND_Y - 30);
    this.physics.add.collider(this.stickman.physBody, this.ground);

    // ── NPCs ────────────────────────────────────────────────
    const npcXs = [350, 680, 1050, 1400, 1780, 2200, 2600, 2950];
    for (const nx of npcXs) {
      const npc = new NPC(this, nx, GROUND_Y - 28);
      this.physics.add.collider(npc.physBody, this.ground);
      this.npcs.push(npc);
    }

    // NPC ramming is handled in update() via distance check

    // ── Camera ──────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.startFollow(this.stickman.physBody, true, 0.08, 0.08);

    // ── Controls ────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── UI ──────────────────────────────────────────────────
    this._createUI();

    // Welcome message
    this._showMsg('Welcome to Wobbly Beach!\nType something in the box below to build it.');
  }

  // ── Helpers ───────────────────────────────────────────────

  _hasRammingItem() {
    return this.attachments.some(a =>
      a.type === 'wheels' && (a.speed ?? 0) >= 130
    );
  }

  _spawnClouds() {
    const positions = [100, 320, 600, 950, 1300, 1700, 2100, 2500, 2900];
    for (const cx of positions) {
      const cy = 30 + Math.random() * 60;
      const s = 0.7 + Math.random() * 0.6;
      const g = this.add.graphics();
      g.fillStyle(0xFFFFFF, 0.88);
      g.fillCircle(0, 0, 30 * s);
      g.fillCircle(32 * s, -8 * s, 24 * s);
      g.fillCircle(-24 * s, -4 * s, 20 * s);
      g.fillCircle(54 * s, 2 * s, 18 * s);
      g.setPosition(cx, cy);
      this.clouds.push({ gfx: g, spd: 0.08 + Math.random() * 0.08 });
    }
  }

  _createScenery() {
    const palmXs = [200, 480, 820, 1200, 1600, 2050, 2450, 2850, 3100];
    for (const px of palmXs) this._drawPalm(px, GROUND_Y);

    // Sign at the far right
    const sg = this.add.graphics();
    sg.fillStyle(0x6B3A1F);
    sg.fillRect(3090, GROUND_Y - 85, 8, 85);
    sg.fillStyle(0xDEB887);
    sg.fillRect(3068, GROUND_Y - 95, 60, 32);
    this.add.text(3072, GROUND_Y - 92, 'NEXT\nISLAND →', {
      fontSize: '11px', fill: '#4A2500', lineSpacing: 1,
    });
  }

  _drawPalm(x, groundY) {
    const g = this.add.graphics();
    // Trunk
    g.lineStyle(7, 0x8B5E3C);
    g.beginPath();
    g.moveTo(x, groundY);
    g.lineTo(x + 10, groundY - 55);
    g.lineTo(x + 6, groundY - 95);
    g.strokePath();

    // Leaves
    const leaves = [
      [-42, -18], [38, -14], [-20, -38], [32, -38], [4, -48], [-10, -22], [20, -20],
    ];
    g.lineStyle(5, 0x2E7D32);
    for (const [dx, dy] of leaves) {
      g.lineBetween(x + 6, groundY - 95, x + 6 + dx, groundY - 95 + dy);
    }

    // Coconuts
    g.fillStyle(0x5D4037);
    g.fillCircle(x + 4, groundY - 93, 5);
    g.fillCircle(x + 10, groundY - 97, 4);
  }

  _createUI() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Bottom bar background
    this.add.rectangle(W / 2, H - 28, W, 56, 0x0d0d1f, 0.88)
      .setScrollFactor(0).setDepth(98);

    // Island label
    this.add.text(12, 12, '🏝  Wobbly Beach', {
      fontSize: '19px', fill: '#fff',
      stroke: '#1a2a1a', strokeThickness: 3, fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100);

    // Controls hint
    this.add.text(12, H - 90, '← → walk   SPACE jump/fly', {
      fontSize: '12px', fill: '#aaa', stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);

    // Attachments HUD (top right)
    this.attachmentText = this.add.text(W - 10, 10, 'No attachments', {
      fontSize: '13px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Message text (centre)
    this.msgText = this.add.text(W / 2, H / 2 - 70, '', {
      fontSize: '18px', fill: '#FFE44D', stroke: '#222', strokeThickness: 3,
      align: 'center', wordWrap: { width: 460 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // DOM: text input
    this.buildInputEl = document.createElement('input');
    this.buildInputEl.type = 'text';
    this.buildInputEl.placeholder = 'What do you want to build? (jetpack, spring legs, car...)';
    Object.assign(this.buildInputEl.style, {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: '11px',
      width: '380px',
      height: '34px',
      background: 'rgba(10,10,30,0.92)',
      border: '2px solid #4a90e2',
      borderRadius: '6px',
      color: '#fff',
      padding: '0 10px',
      fontSize: '14px',
      outline: 'none',
      zIndex: '1000',
    });
    document.body.appendChild(this.buildInputEl);

    // DOM: build button
    this.buildBtnEl = document.createElement('button');
    this.buildBtnEl.textContent = '⚙ BUILD!';
    Object.assign(this.buildBtnEl.style, {
      position: 'fixed',
      left: 'calc(50% + 200px)',
      bottom: '11px',
      width: '80px',
      height: '34px',
      background: '#c0392b',
      border: '2px solid #922b21',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: 'pointer',
      zIndex: '1000',
    });
    document.body.appendChild(this.buildBtnEl);

    this.buildBtnEl.addEventListener('click', () => this._handleBuild());
    this.buildInputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._handleBuild();
      e.stopPropagation(); // don't fire game keys through the input
    });
  }

  _handleBuild() {
    const raw = this.buildInputEl.value.trim();
    if (!raw) return;
    this.buildInputEl.value = '';

    const item = this.buildSystem.interpret(raw);

    if (this.attachments.length > 0) {
      const keep = window.confirm(
        `You already have:\n${this.attachments.map(a => `${a.emoji} ${a.name}`).join('\n')}\n\nStack ${item.emoji} ${item.name} ON TOP?\n[OK = stack  |  Cancel = replace]`
      );
      if (!keep) {
        this.attachments = [];
        this.stickman.clearAttachments();
      }
    }

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
    const cargo   = this.add.text(startX, groundY - 42, item.emoji, { fontSize: '30px' })
                      .setOrigin(0.5, 1).setDepth(57);
    const nameTag = this.add.text(startX, groundY - 74, item.name, {
      fontSize: '15px', fill: '#FFE44D', stroke: '#1a1a1a', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(57);
    const badge   = this.add.text(startX, groundY - 93, '📦 DELIVERY!', {
      fontSize: '12px', fill: '#fff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(57);

    const proxy = { x: startX };
    let frame = 0;

    this.tweens.add({
      targets: proxy, x: targetX, duration: 1800, ease: 'Linear',
      onUpdate: () => {
        frame++;
        const bx = proxy.x;
        const legSwing = Math.sin(frame * 0.55) * 8;

        bugGfx.clear();

        // Crate strapped to back
        bugGfx.fillStyle(0x8B5E3C);
        bugGfx.fillRect(bx - 24, groundY - 52, 48, 34);
        bugGfx.lineStyle(2.5, 0x4A2E0A);
        bugGfx.strokeRect(bx - 24, groundY - 52, 48, 34);
        bugGfx.lineBetween(bx - 24, groundY - 52, bx + 24, groundY - 18);
        bugGfx.lineBetween(bx + 24, groundY - 52, bx - 24, groundY - 18);

        // Bug body
        bugGfx.fillStyle(0x1a1a1a);
        bugGfx.fillEllipse(bx + 2, groundY - 5, 42, 20);
        // Head
        bugGfx.fillCircle(bx - 18, groundY - 5, 12);
        // Shell shine
        bugGfx.fillStyle(0x333333, 0.6);
        bugGfx.fillEllipse(bx + 5, groundY - 10, 26, 10);
        // Eyes
        bugGfx.fillStyle(0xFF4444);
        bugGfx.fillCircle(bx - 24, groundY - 9, 4);
        bugGfx.fillCircle(bx - 13, groundY - 9, 4);
        // Antennae
        bugGfx.lineStyle(2, 0x444444);
        bugGfx.lineBetween(bx - 24, groundY - 16, bx - 33, groundY - 32);
        bugGfx.lineBetween(bx - 15, groundY - 17, bx - 18, groundY - 34);
        bugGfx.fillStyle(0xFF4444);
        bugGfx.fillCircle(bx - 33, groundY - 32, 3);
        bugGfx.fillCircle(bx - 18, groundY - 34, 3);
        // 6 legs (alternating up/down)
        bugGfx.lineStyle(3, 0x1a1a1a);
        for (let i = 0; i < 3; i++) {
          const lx = bx - 5 + i * 12;
          const phase = i % 2 === 0 ? legSwing : -legSwing;
          bugGfx.lineBetween(lx, groundY - 2, lx - 14, groundY + 10 + phase);
          bugGfx.lineBetween(lx, groundY - 2, lx + 14, groundY + 10 - phase);
        }

        cargo.setX(bx);
        nameTag.setX(bx);
        badge.setX(bx);
      },
      onComplete: () => {
        bugGfx.destroy();
        cargo.destroy();
        nameTag.destroy();
        badge.destroy();

        const poof = this.add.text(this.stickman.x, this.stickman.y - 30, '💥', { fontSize: '44px' })
          .setOrigin(0.5).setDepth(60);
        const installed = this.add.text(this.stickman.x, this.stickman.y - 75, '✅ INSTALLED!', {
          fontSize: '19px', fill: '#00FF88', stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({
          targets: [poof, installed], y: '-=45', alpha: 0, duration: 900,
          onComplete: () => { poof.destroy(); installed.destroy(); },
        });
      },
    });
  }

  _showMsg(msg) {
    this.msgText.setText(msg);
    this.msgTimer = 4;
  }

  _updateHUD() {
    if (this.attachments.length === 0) {
      this.attachmentText.setText('No attachments');
    } else {
      this.attachmentText.setText(
        'Carrying:\n' + this.attachments.map(a => `${a.emoji} ${a.name}`).join('\n')
      );
    }
  }

  // ── Update ────────────────────────────────────────────────

  update(time, delta) {
    const dt = delta / 1000;

    this.stickman?.update(time, delta, this.cursors, this.spaceKey);
    for (const npc of this.npcs) npc.update(time, delta);

    // Ramming check: if player has a fast wheeled item and walks into an NPC, they get angry
    if (this._hasRammingItem()) {
      for (const npc of this.npcs) {
        if (!npc.isAngry) {
          const dx = Math.abs(this.stickman.x - npc.physBody.x);
          const dy = Math.abs(this.stickman.y - npc.physBody.y);
          if (dx < 28 && dy < 45) {
            npc.makeAngry(this.stickman);
            this._showMsg('😤 They\'re FURIOUS!\nBuild something to escape!');
          }
        }
      }
    }

    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0) this.msgText.setText('');
    }

    // Drift clouds
    for (const c of this.clouds) {
      c.gfx.x += c.spd;
      if (c.gfx.x > WORLD_W + 200) c.gfx.x = -200;
    }
  }

  shutdown() {
    this.buildInputEl?.remove();
    this.buildBtnEl?.remove();
    this.buildInputEl = null;
    this.buildBtnEl = null;
  }
}
