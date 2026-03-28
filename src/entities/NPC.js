const SPEEDS = { beach: 55, jungle: 80, volcano: 100, frozen: 40, space: 30 };

export class NPC {
  constructor(scene, x, y, islandType = 'beach') {
    this.scene      = scene;
    this.islandType = islandType;
    this.walkDir    = Math.random() < 0.5 ? 1 : -1;
    this.walkTimer  = 2 + Math.random() * 3;
    this.stepPhase  = Math.random() * Math.PI * 2;
    this.wobbleTime = Math.random() * 10;
    this.baseSpeed  = (SPEEDS[islandType] ?? 55) + Math.random() * 20;
    this.speed      = this.baseSpeed;
    this.isAngry    = false;
    this.angryTarget = null;
    this.isFallen   = false;
    this.fallTimer  = 0;
    this.minX       = -Infinity;
    this.maxX       = Infinity;

    this.physBody = scene.add.rectangle(x, y, 18, 55);
    scene.physics.add.existing(this.physBody);
    this.physBody.body.setMaxVelocityY(700);
    this.physBody.body.setCollideWorldBounds(true);
    this.physBody.setVisible(false);

    this.gfx = scene.add.graphics();
    this.gfx.setDepth(15);
  }

  knockDown() {
    if (this.isFallen) return;
    this.isFallen    = true;
    this.fallTimer   = 5;
    this.isAngry     = false;
    this.angryTarget = null;
    this.speed       = this.baseSpeed;
    this.physBody.body.setVelocityX(0);
  }

  giveUp() {
    this.isAngry     = false;
    this.angryTarget = null;
    this.speed       = this.baseSpeed;
    this.walkDir     = Math.random() < 0.5 ? 1 : -1;
    this.walkTimer   = 3 + Math.random() * 2;
    const t = this.scene.add.text(this.physBody.x, this.physBody.y - 65, '😤 ...fine.', {
      fontSize: '12px', fill: '#aaa', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(40);
    this.scene.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }

  makeAngry(target) {
    this.isAngry     = true;
    this.angryTarget = target;
    this.speed       = this.baseSpeed * 1.8;
    const t = this.scene.add.text(this.physBody.x, this.physBody.y - 70, '😤 HOW DARE', {
      fontSize: '13px', fill: '#FF2222', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(40);
    this.scene.tweens.add({ targets: t, y: t.y - 25, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.wobbleTime += dt;
    this.stepPhase  += dt * (this.islandType === 'frozen' ? 3 : this.islandType === 'space' ? 2 : 5);

    const onGround = this.physBody.body.blocked.down;

    if (this.isFallen) {
      this.fallTimer -= dt;
      this.physBody.body.setVelocityX(0);
      if (this.fallTimer <= 0) {
        this.isFallen  = false;
        this.walkTimer = 2 + Math.random() * 2;
      }
      this._draw();
      return;
    }

    // Enforce island bounds — reverse at edges
    const cx = this.physBody.x;
    if (cx <= this.minX && this.walkDir < 0) this.walkDir = 1;
    if (cx >= this.maxX && this.walkDir > 0) this.walkDir = -1;

    if (this.isAngry && this.angryTarget) {
      const dx = this.angryTarget.x - this.physBody.x;
      this.walkDir = dx > 0 ? 1 : -1;
      if (onGround) this.physBody.body.setVelocityX(this.walkDir * this.speed);
    } else {
      this.walkTimer -= dt;
      if (this.walkTimer <= 0) { this.walkDir *= -1; this.walkTimer = 2 + Math.random() * 3; }
      if (onGround) this.physBody.body.setVelocityX(this.walkDir * this.speed);
    }

    this._draw();
  }

  _draw() {
    const g  = this.gfx;
    g.clear();
    const x  = this.physBody.x;
    const y  = this.physBody.y;
    const t  = this.wobbleTime;
    const sp = this.stepPhase;

    if (this.isFallen) { this._drawFallen(g, x, y, t); return; }

    switch (this.islandType) {
      case 'frozen': this._drawPenguin(g, x, y, sp, t); break;
      case 'space':  this._drawAstronaut(g, x, y, sp, t); break;
      default:       this._drawDefault(g, x, y, sp, t); break;
    }
  }

  _drawFallen(g, x, y, t) {
    const skins = { beach: 0xFFDDCC, jungle: 0xFFCC88, volcano: 0xFF9966, frozen: 0xDDDDDD, space: 0xCCCCCC };
    const skin  = skins[this.islandType] ?? 0xFFDDCC;

    // Horizontal body
    g.lineStyle(2.5, 0x333333);
    g.lineBetween(x - 18, y + 20, x + 8, y + 20);

    // Head (to the right)
    g.fillStyle(skin);
    g.fillCircle(x + 19, y + 20, 11);
    g.strokeCircle(x + 19, y + 20, 11);

    // X eyes
    g.lineStyle(2, 0x333333);
    g.lineBetween(x + 14, y + 15, x + 19, y + 20);
    g.lineBetween(x + 19, y + 15, x + 14, y + 20);
    g.lineBetween(x + 19, y + 15, x + 24, y + 20);
    g.lineBetween(x + 24, y + 15, x + 19, y + 20);

    // Wavy panic mouth
    g.lineStyle(1.5, 0x333333);
    g.lineBetween(x + 15, y + 24, x + 17, y + 26);
    g.lineBetween(x + 17, y + 26, x + 21, y + 24);
    g.lineBetween(x + 21, y + 24, x + 23, y + 26);

    // Arms flopped out
    g.lineStyle(2.5, 0x333333);
    g.lineBetween(x - 4, y + 20, x - 6, y + 6);
    g.lineBetween(x - 4, y + 20, x - 6, y + 34);

    // Legs splayed
    g.lineBetween(x - 18, y + 20, x - 26, y + 11);
    g.lineBetween(x - 18, y + 20, x - 26, y + 29);

    // Rotating stars around head
    g.fillStyle(0xFFD700);
    for (let i = 0; i < 4; i++) {
      const a = t * 5 + (i * Math.PI / 2);
      g.fillCircle(x + 19 + Math.cos(a) * 18, y + 20 + Math.sin(a) * 9, 3);
    }
  }

  _drawDefault(g, x, y, sp, t) {
    const skins = { beach: 0xFFDDCC, jungle: 0xFFCC88, volcano: 0xFF9966 };
    const skin  = skins[this.islandType] ?? 0xFFDDCC;

    g.lineStyle(2.5, 0x333333);
    g.fillStyle(skin);
    g.fillCircle(x, y - 34, 11);
    g.strokeCircle(x, y - 34, 11);

    g.fillStyle(0x333333);
    g.fillCircle(x - 3, y - 36, 1.8);
    g.fillCircle(x + 3, y - 36, 1.8);

    if (this.isAngry) {
      g.lineStyle(2.5, 0xFF2222);
      g.lineBetween(x - 6, y - 42, x - 1, y - 39);
      g.lineBetween(x + 1, y - 39, x + 6, y - 42);
      g.lineBetween(x - 4, y - 28, x + 4, y - 30);
      g.lineStyle(2, 0xFF4444, 0.5);
      g.strokeCircle(x, y - 20, 22 + Math.sin(t * 10) * 3);
    } else {
      g.lineStyle(1.5, 0x333333);
      // Smug mouth (volcano NPCs look more tense)
      if (this.islandType === 'volcano') {
        g.lineBetween(x - 4, y - 29, x + 4, y - 29);
      } else {
        g.lineBetween(x - 3, y - 29, x, y - 27);
        g.lineBetween(x, y - 27, x + 4, y - 28);
      }
    }

    g.lineStyle(2.5, 0x333333);
    g.lineBetween(x, y - 23, x, y - 5);

    const armSwing = Math.sin(sp) * 10;
    g.lineBetween(x, y - 14, x - 13, y - 10 + armSwing);
    g.lineBetween(x, y - 14, x + 13, y - 10 - armSwing);

    const swL = Math.sin(sp) * 12;
    const swR = Math.sin(sp + Math.PI) * 12;
    g.lineBetween(x, y - 5, x - 7, y + 7);
    g.lineBetween(x - 7, y + 7, x - 7 + swL, y + 26);
    g.lineBetween(x, y - 5, x + 7, y + 7);
    g.lineBetween(x + 7, y + 7, x + 7 + swR, y + 26);

    g.lineStyle(2, 0x333333);
    const fd = this.walkDir > 0 ? 1 : -1;
    g.lineBetween(x - 7 + swL - 5, y + 26, x - 7 + swL + 5 * fd, y + 26);
    g.lineBetween(x + 7 + swR - 5, y + 26, x + 7 + swR + 5 * fd, y + 26);

    // Volcano NPCs are on fire!
    if (this.islandType === 'volcano') {
      const fh = 14 + Math.sin(t * 12) * 5;
      const fh2 = 10 + Math.sin(t * 9 + 1) * 4;
      g.fillStyle(0xFF6600, 0.85);
      g.fillTriangle(x - 8, y - 5, x, y - 5, x - 4, y - 5 - fh);
      g.fillTriangle(x + 2, y - 5, x + 10, y - 5, x + 6, y - 5 - fh2);
      g.fillStyle(0xFFCC00, 0.7);
      g.fillTriangle(x - 6, y - 5, x, y - 5, x - 3, y - 5 - fh * 0.6);
      g.fillTriangle(x + 3, y - 5, x + 9, y - 5, x + 6, y - 5 - fh2 * 0.6);
    }
  }

  _drawPenguin(g, x, y, sp, t) {
    // Round body (penguin-shaped)
    g.fillStyle(0x222222);
    g.fillEllipse(x, y, 26, 36);
    g.fillStyle(0xFFFFFF);
    g.fillEllipse(x, y + 2, 14, 22);

    // Head
    g.fillStyle(0x222222);
    g.fillCircle(x, y - 26, 13);
    // White face patch
    g.fillStyle(0xFFFFFF);
    g.fillEllipse(x, y - 24, 14, 14);
    // Eyes
    g.fillStyle(0x333333);
    g.fillCircle(x - 4, y - 26, 2.5);
    g.fillCircle(x + 4, y - 26, 2.5);
    // Beak
    g.fillStyle(0xFF8C00);
    g.fillTriangle(x - 3, y - 21, x + 3, y - 21, x, y - 17);

    if (this.isAngry) {
      g.lineStyle(2.5, 0xFF2222);
      g.lineBetween(x - 5, y - 33, x - 1, y - 30);
      g.lineBetween(x + 1, y - 30, x + 5, y - 33);
    }

    // Stubby flippers
    const fw = Math.sin(sp) * 8;
    g.fillStyle(0x222222);
    g.fillEllipse(x - 16, y - 8, 10, 18);
    g.fillEllipse(x + 16, y - 8, 10, 18);

    // Feet (waddling)
    const fwL = Math.sin(sp) * 6;
    const fwR = Math.sin(sp + Math.PI) * 6;
    g.fillStyle(0xFF8C00);
    g.fillEllipse(x - 6 + fwL, y + 18, 10, 6);
    g.fillEllipse(x + 6 + fwR, y + 18, 10, 6);
  }

  _drawAstronaut(g, x, y, sp, t) {
    // Suit body
    g.fillStyle(0xDDDDDD);
    g.fillEllipse(x, y, 24, 30);
    g.lineStyle(2, 0xAAAAAA);
    g.strokeCircle(x, y, 12);

    // Helmet (big dome)
    g.fillStyle(0xEEEEEE);
    g.fillCircle(x, y - 32, 16);
    g.fillStyle(0x88CCFF, 0.7);
    g.fillEllipse(x, y - 34, 22, 18); // visor
    g.lineStyle(2, 0x999999);
    g.strokeCircle(x, y - 32, 16);

    // Eyes through visor
    g.fillStyle(0x333333);
    g.fillCircle(x - 4, y - 33, 2);
    g.fillCircle(x + 4, y - 33, 2);

    if (this.isAngry) {
      g.lineStyle(2.5, 0xFF4444);
      g.lineBetween(x - 5, y - 38, x - 1, y - 35);
      g.lineBetween(x + 1, y - 35, x + 5, y - 38);
    }

    // Arms (floating slightly - low gravity feel)
    const armFloat = Math.sin(t * 1.5) * 5;
    g.lineStyle(4, 0xCCCCCC);
    g.lineBetween(x, y - 10, x - 18, y - 5 + armFloat);
    g.lineBetween(x, y - 10, x + 18, y - 5 - armFloat);

    // Legs (slow floaty steps)
    const legL = Math.sin(sp) * 10;
    const legR = Math.sin(sp + Math.PI) * 10;
    g.lineStyle(4, 0xCCCCCC);
    g.lineBetween(x, y + 10, x - 7, y + 20);
    g.lineBetween(x - 7, y + 20, x - 7 + legL, y + 30);
    g.lineBetween(x, y + 10, x + 7, y + 20);
    g.lineBetween(x + 7, y + 20, x + 7 + legR, y + 30);

    // Boots
    g.fillStyle(0x888888);
    g.fillRect(x - 12 + legL, y + 28, 10, 5);
    g.fillRect(x + 2 + legR, y + 28, 10, 5);

    // Oxygen pack on back
    g.fillStyle(0xAAAAAA);
    g.fillRect(x + 8, y - 12, 12, 20);
  }
}
