export class Stickman {
  constructor(scene, x, y) {
    this.scene = scene;
    this.attachments = [];

    // Animation state
    this.wobbleTime = 0;
    this.stepPhase = 0;
    this.isFalling = false;
    this.fallAngle = 0;
    this.fallDuration = 0;
    this.fallCooldown = 2;
    this.facingRight = true;
    this.isMoving = false;

    // Stats
    this.moveSpeed = 110;
    this.jumpVelocity = -420;
    this.canFly = false;
    this.flySpeed = -200;
    this.frictionFactor = 0.75; // scene can override for ice

    // Physics body (invisible rectangle)
    this.physBody = scene.add.rectangle(x, y, 22, 60);
    scene.physics.add.existing(this.physBody);
    this.physBody.body.setMaxVelocityY(700);
    this.physBody.body.setCollideWorldBounds(true);
    this.physBody.setVisible(false);

    // Drawing layers
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(20);
    this.attachGfx = scene.add.graphics();
    this.attachGfx.setDepth(19);
  }

  get x() { return this.physBody.x; }
  get y() { return this.physBody.y; }

  clearAttachments() {
    this.attachments = [];
    this._recalcStats();
  }

  addAttachment(item) {
    this.attachments.push(item);
    this._recalcStats();
  }

  _recalcStats() {
    this.moveSpeed = 110;
    this.jumpVelocity = -420;
    this.canFly = false;
    this.flySpeed = -200;
    for (const a of this.attachments) {
      if (a.speed)     this.moveSpeed += a.speed;
      if (a.jumpBoost) this.jumpVelocity += a.jumpBoost;
      if (a.canFly)  { this.canFly = true; }
      if (a.flySpeed)  this.flySpeed = Math.min(this.flySpeed, a.flySpeed);
    }
  }

  update(time, delta, cursors, spaceKey) {
    const dt = delta / 1000;
    const body = this.physBody.body;
    const onGround = body.blocked.down;

    this.wobbleTime += dt;

    // If fallen, wait it out
    if (this.isFalling) {
      this.fallDuration -= dt;
      body.setVelocityX(0);
      if (this.fallDuration <= 0) {
        this.isFalling = false;
        this.fallCooldown = 3 + Math.random() * 2;
      }
      this._draw(onGround);
      return;
    }

    // Random trip while moving on ground
    if (onGround) {
      this.fallCooldown -= dt;
      if (this.fallCooldown <= 0 && this.isMoving && Math.random() < 0.004) {
        this._triggerFall();
        this._draw(onGround);
        return;
      }
    }

    // Horizontal movement
    this.isMoving = false;
    if (cursors.left.isDown) {
      body.setVelocityX(-this.moveSpeed);
      this.facingRight = false;
      this.isMoving = true;
    } else if (cursors.right.isDown) {
      body.setVelocityX(this.moveSpeed);
      this.facingRight = true;
      this.isMoving = true;
    } else {
      body.setVelocityX(body.velocity.x * this.frictionFactor);
    }

    // Jump
    if (Phaser.Input.Keyboard.JustDown(spaceKey) && onGround) {
      body.setVelocityY(this.jumpVelocity);
    }

    // Fly (hold space while airborne)
    if (this.canFly && spaceKey.isDown && !onGround) {
      const target = this.flySpeed;
      const cur = body.velocity.y;
      body.setVelocityY(cur + (target - cur) * Math.min(dt * 4, 1));
    }

    // Step cycle
    if (this.isMoving && onGround) this.stepPhase += dt * 7;

    this._draw(onGround);
  }

  _triggerFall() {
    this.isFalling = true;
    this.fallAngle = (this.facingRight ? 1 : -1) * (Math.PI / 2);
    this.fallDuration = 1.2 + Math.random() * 0.8;
    this.fallCooldown = 4;
    this.physBody.body.setVelocityX(0);

    const scream = this.scene.add.text(this.x, this.y - 55, '😱', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(40);
    this.scene.tweens.add({
      targets: scream, y: scream.y - 35, alpha: 0, duration: 700,
      onComplete: () => scream.destroy(),
    });
  }

  _draw(onGround) {
    const x = this.physBody.x;
    const y = this.physBody.y;

    // Body tilt
    const wobble = this.isFalling
      ? this.fallAngle
      : Math.sin(this.wobbleTime * 2.3) * 0.1;

    this.gfx.clear();
    this.gfx.setPosition(x, y);
    this.gfx.setRotation(wobble);

    this._drawBody(this.gfx, onGround);
    this._drawAttachments(x, y);
  }

  // All coords relative to (0,0) = physics body centre
  _drawBody(g, onGround) {
    const t = this.wobbleTime;
    const fallen = this.isFalling;

    // --- Head ---
    g.lineStyle(2.5, 0x222222, 1);
    g.fillStyle(0xFFCC99, 1);
    g.fillCircle(0, -38, 13);
    g.strokeCircle(0, -38, 13);

    // Eyes
    g.fillStyle(0x333333);
    if (fallen) {
      // X eyes when fallen
      g.lineStyle(2, 0x333333);
      g.lineBetween(-6, -42, -2, -38); g.lineBetween(-6, -38, -2, -42);
      g.lineBetween(2, -42, 6, -38);  g.lineBetween(2, -38, 6, -42);
    } else {
      g.fillCircle(-4, -40, 2.5);
      g.fillCircle(4, -40, 2.5);
    }

    // Mouth
    g.lineStyle(2, 0x333333);
    if (fallen) {
      // Wavy panic mouth
      g.beginPath();
      g.moveTo(-5, -31); g.lineTo(-2, -28); g.lineTo(2, -31); g.lineTo(5, -28);
      g.strokePath();
    } else {
      // Determined line (not great at smiling either)
      g.lineBetween(-4, -31, 4, -31);
    }

    // --- Body ---
    g.lineStyle(3, 0x222222);
    g.lineBetween(0, -25, 0, 5);

    // --- Arms (wobbly flailing) ---
    const aw1 = Math.sin(t * 5.1) * 18;
    const aw2 = Math.sin(t * 4.3 + 1.5) * 18;
    g.lineBetween(0, -15, -22, -10 + aw1);
    g.lineBetween(0, -15,  22, -10 - aw2);
    g.fillStyle(0xFFCC99);
    g.fillCircle(-22, -10 + aw1, 4);
    g.fillCircle( 22, -10 - aw2, 4);

    // --- Legs ---
    if (fallen) {
      // Splayed out legs
      g.lineStyle(3, 0x222222);
      g.lineBetween(0, 5,  16, 15); g.lineBetween(16, 15,  26,  5);
      g.lineBetween(0, 5, -13, 18); g.lineBetween(-13, 18, -23,  8);
    } else if (this.isMoving) {
      // Walking - deliberately wonky
      const sp = this.stepPhase;
      // Occasionally both legs go the same direction (wrong)
      const wrongDir = Math.sin(t * 0.7) > 0.75;
      const swingL = Math.sin(sp) * 18;
      const swingR = wrongDir ? Math.sin(sp) * 16 : Math.sin(sp + Math.PI) * 18;
      const kwL = Math.sin(t * 9.0 + 0.5) * 4;
      const kwR = Math.sin(t * 7.3 + 2.0) * 4;

      g.lineStyle(3, 0x222222);
      // Left leg: hip -> knee -> foot
      g.lineBetween(0, 5, -8 + kwL, 17);
      g.lineBetween(-8 + kwL, 17, -8 + swingL + kwL, 30);
      // Right leg
      g.lineBetween(0, 5, 8 + kwR, 17);
      g.lineBetween(8 + kwR, 17, 8 + swingR + kwR, 30);

      // Feet
      g.lineStyle(3, 0x333333);
      const fd = this.facingRight ? 1 : -1;
      const lFootX = -8 + swingL + kwL;
      const rFootX =  8 + swingR + kwR;
      g.lineBetween(lFootX - 5, 30, lFootX + 7 * fd, 30);
      g.lineBetween(rFootX - 5, 30, rFootX + 7 * fd, 30);
    } else {
      // Standing still - slight sway
      const sw = Math.sin(t * 3) * 3;
      g.lineStyle(3, 0x222222);
      g.lineBetween(0, 5, -8 + sw, 17); g.lineBetween(-8 + sw, 17, -8, 30);
      g.lineBetween(0, 5,  8 - sw, 17); g.lineBetween( 8 - sw, 17,  8, 30);
      g.lineStyle(3, 0x333333);
      g.lineBetween(-14, 30, -2, 30);
      g.lineBetween(  2, 30, 14, 30);
    }
  }

  _drawAttachments(wx, wy) {
    const ag = this.attachGfx;
    ag.clear();

    for (const att of this.attachments) {
      ag.lineStyle(2, att.color ?? 0xFF6B6B);

      if (att.position === 'feet') {
        const fy = wy + 30; // bottom of physics body = foot level

        if (att.type === 'wheels') {
          ag.fillStyle(att.color ?? 0xCC0000, 0.5);
          ag.fillCircle(wx - 10, fy, 10);
          ag.fillCircle(wx + 10, fy, 10);
          ag.lineStyle(3, att.color ?? 0xCC0000);
          ag.strokeCircle(wx - 10, fy, 10);
          ag.strokeCircle(wx + 10, fy, 10);
          ag.lineStyle(2, att.color ?? 0xCC0000);
          ag.lineBetween(wx - 10, fy - 10, wx - 10, fy + 10);
          ag.lineBetween(wx - 20, fy,      wx,      fy);
          ag.lineBetween(wx + 10, fy - 10, wx + 10, fy + 10);
          ag.lineBetween(wx,      fy,      wx + 20, fy);

        } else if (att.type === 'rockets') {
          ag.fillStyle(att.color ?? 0xFF4444);
          ag.fillRect(wx - 17, fy - 16, 10, 18);
          ag.fillRect(wx +  7, fy - 16, 10, 18);
          // Nose cones
          ag.fillTriangle(wx - 17, fy - 16, wx - 7, fy - 16, wx - 12, fy - 27);
          ag.fillTriangle(wx +  7, fy - 16, wx + 17, fy - 16, wx + 12, fy - 27);
          // Flames (animated)
          const fl = 8 + Math.sin(this.wobbleTime * 20) * 5;
          ag.fillStyle(0xFF8C00, 0.9);
          ag.fillTriangle(wx - 17, fy + 2, wx - 7, fy + 2, wx - 12, fy + 2 + fl);
          ag.fillTriangle(wx +  7, fy + 2, wx + 17, fy + 2, wx + 12, fy + 2 + fl);

        } else if (att.type === 'springs') {
          ag.lineStyle(3, att.color ?? 0x00CC44);
          for (let i = 0; i < 4; i++) {
            ag.lineBetween(wx - 14 + i * 3, fy - 10 + i * 4, wx - 11 + i * 3, fy - 6 + i * 4);
            ag.lineBetween(wx +  7 + i * 3, fy - 10 + i * 4, wx + 10 + i * 3, fy - 6 + i * 4);
          }
        }

      } else if (att.position === 'back') {
        if (att.type === 'jetpack') {
          ag.fillStyle(att.color ?? 0x666666);
          ag.fillRect(wx + 8, wy - 20, 17, 30);
          ag.lineStyle(2, 0x444444);
          ag.strokeRect(wx + 8, wy - 20, 17, 30);
          ag.fillStyle(0x444444);
          ag.fillRect(wx + 10, wy + 10, 5, 8);
          ag.fillRect(wx + 18, wy + 10, 5, 8);
          if (this.canFly) {
            const fh = 10 + Math.sin(this.wobbleTime * 15) * 5;
            ag.fillStyle(0xFF8C00, 0.9);
            ag.fillTriangle(wx + 10, wy + 18, wx + 15, wy + 18, wx + 12, wy + 18 + fh);
            ag.fillTriangle(wx + 18, wy + 18, wx + 23, wy + 18, wx + 20, wy + 18 + fh);
          }

        } else if (att.type === 'wings') {
          const flap = Math.sin(this.wobbleTime * 6) * 18;
          ag.fillStyle(0xFFFFFF, 0.9);
          ag.lineStyle(2, 0xCCCCCC);
          ag.fillTriangle(wx - 8, wy - 12, wx - 38, wy - 18 - flap, wx - 8, wy + 10);
          ag.lineBetween(wx - 8, wy - 12, wx - 38, wy - 18 - flap);
          ag.lineBetween(wx - 38, wy - 18 - flap, wx - 8, wy + 10);
          ag.fillTriangle(wx + 8, wy - 12, wx + 38, wy - 18 - flap, wx + 8, wy + 10);
          ag.lineBetween(wx + 8, wy - 12, wx + 38, wy - 18 - flap);
          ag.lineBetween(wx + 38, wy - 18 - flap, wx + 8, wy + 10);
        }

      } else if (att.position === 'head') {
        const hx = wx;
        const hy = wy - 38; // head centre
        if (att.type === 'propeller') {
          ag.fillStyle(att.color ?? 0x888888);
          ag.fillRect(hx - 2, hy - 24, 4, 10);
          const angle = this.wobbleTime * 9;
          ag.lineStyle(5, att.color ?? 0x888888);
          for (let i = 0; i < 3; i++) {
            const a = angle + (i * Math.PI * 2) / 3;
            ag.lineBetween(hx, hy - 14, hx + Math.cos(a) * 22, hy - 14 + Math.sin(a) * 6);
          }
        }
      }
    }
  }

  destroy() {
    this.gfx.destroy();
    this.attachGfx.destroy();
    this.physBody.destroy();
  }
}
