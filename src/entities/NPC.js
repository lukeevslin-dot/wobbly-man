export class NPC {
  constructor(scene, x, y) {
    this.scene = scene;
    this.walkDir = Math.random() < 0.5 ? 1 : -1;
    this.walkTimer = 2 + Math.random() * 3;
    this.stepPhase = Math.random() * Math.PI * 2;
    this.wobbleTime = Math.random() * 10;
    this.baseSpeed = 55 + Math.random() * 20;
    this.speed = this.baseSpeed;
    this.isAngry = false;
    this.angryTarget = null;

    // Physics body
    this.physBody = scene.add.rectangle(x, y, 18, 55);
    scene.physics.add.existing(this.physBody);
    this.physBody.body.setMaxVelocityY(700);
    this.physBody.body.setCollideWorldBounds(true);
    this.physBody.setVisible(false);

    this.gfx = scene.add.graphics();
    this.gfx.setDepth(15);
  }

  makeAngry(target) {
    this.isAngry = true;
    this.angryTarget = target;
    this.speed = 145;

    const text = this.scene.add.text(this.physBody.x, this.physBody.y - 70, '😤 HOW DARE', {
      fontSize: '13px', fill: '#FF2222', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(40);
    this.scene.tweens.add({
      targets: text, y: text.y - 25, alpha: 0, duration: 1200,
      onComplete: () => text.destroy(),
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.wobbleTime += dt;
    this.stepPhase += dt * 5;

    const onGround = this.physBody.body.blocked.down;

    if (this.isAngry && this.angryTarget) {
      const dx = this.angryTarget.x - this.physBody.x;
      this.walkDir = dx > 0 ? 1 : -1;
      if (onGround) this.physBody.body.setVelocityX(this.walkDir * this.speed);
    } else {
      this.walkTimer -= dt;
      if (this.walkTimer <= 0) {
        this.walkDir *= -1;
        this.walkTimer = 2 + Math.random() * 3;
      }
      if (onGround) this.physBody.body.setVelocityX(this.walkDir * this.speed);
    }

    this._draw();
  }

  _draw() {
    const g = this.gfx;
    g.clear();

    const x = this.physBody.x;
    const y = this.physBody.y;
    const t = this.wobbleTime;
    const sp = this.stepPhase;

    // Smug smooth walking (contrast to player's disaster)
    g.lineStyle(2.5, 0x333333);
    g.fillStyle(0xFFDDCC);
    g.fillCircle(x, y - 34, 11);
    g.strokeCircle(x, y - 34, 11);

    // Eyes
    g.fillStyle(0x333333);
    g.fillCircle(x - 3, y - 36, 1.8);
    g.fillCircle(x + 3, y - 36, 1.8);

    if (this.isAngry) {
      // Angry eyebrows
      g.lineStyle(2.5, 0xFF2222);
      g.lineBetween(x - 6, y - 42, x - 1, y - 39);
      g.lineBetween(x + 1, y - 39, x + 6, y - 42);
      // Angry mouth
      g.lineBetween(x - 4, y - 28, x + 4, y - 30);
      // Red aura pulse
      g.lineStyle(2, 0xFF4444, 0.5);
      g.strokeCircle(x, y - 20, 22 + Math.sin(t * 10) * 3);
    } else {
      // Smug half-smile
      g.lineStyle(1.5, 0x333333);
      g.lineBetween(x - 3, y - 29, x, y - 27);
      g.lineBetween(x, y - 27, x + 4, y - 28);
    }

    // Body
    g.lineStyle(2.5, 0x333333);
    g.lineBetween(x, y - 23, x, y - 5);

    // Arms — smooth confident swing (vs player's flailing)
    const armSwing = Math.sin(sp) * 10;
    g.lineBetween(x, y - 14, x - 13, y - 10 + armSwing);
    g.lineBetween(x, y - 14, x + 13, y - 10 - armSwing);

    // Legs — perfectly smooth, infuriatingly graceful
    const swingL = Math.sin(sp) * 12;
    const swingR = Math.sin(sp + Math.PI) * 12;
    g.lineBetween(x, y - 5, x - 7, y + 7);
    g.lineBetween(x - 7, y + 7, x - 7 + swingL, y + 26);
    g.lineBetween(x, y - 5, x + 7, y + 7);
    g.lineBetween(x + 7, y + 7, x + 7 + swingR, y + 26);

    // Feet
    g.lineStyle(2, 0x333333);
    const fd = this.walkDir > 0 ? 1 : -1;
    g.lineBetween(x - 7 + swingL - 5, y + 26, x - 7 + swingL + 5 * fd, y + 26);
    g.lineBetween(x + 7 + swingR - 5, y + 26, x + 7 + swingR + 5 * fd, y + 26);
  }
}
