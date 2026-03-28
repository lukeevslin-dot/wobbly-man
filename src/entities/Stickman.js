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

    // State
    this.onFire = false;

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

    // On fire!
    if (this.onFire) {
      const fh = 18 + Math.sin(t * 14) * 6;
      const fh2 = 14 + Math.sin(t * 10 + 2) * 5;
      g.fillStyle(0xFF4500, 0.9);
      g.fillTriangle(-10, 30, 2, 30, -4, 30 - fh);
      g.fillTriangle(2, 30, 14, 30, 8, 30 - fh2);
      g.fillStyle(0xFFCC00, 0.75);
      g.fillTriangle(-8, 30, 0, 30, -4, 30 - fh * 0.65);
      g.fillTriangle(3, 30, 12, 30, 8, 30 - fh2 * 0.65);
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
          if (att.subtype === 'boat') {
            // ── Boat hull ─────────────────────────────────────
            const hw = 50, hh = 18;
            const hx = wx - hw / 2, hy = fy - hh + 4;
            // Hull body
            ag.fillStyle(att.color ?? 0x8B4513, 1);
            ag.fillRoundedRect(hx, hy, hw, hh, { tl: 2, tr: 2, bl: 10, br: 10 });
            ag.lineStyle(2, 0x4A2000);
            ag.strokeRoundedRect(hx, hy, hw, hh, { tl: 2, tr: 2, bl: 10, br: 10 });
            // Deck stripe
            ag.lineStyle(3, 0xFFFFFF, 0.6);
            ag.lineBetween(hx + 5, hy + 5, hx + hw - 5, hy + 5);
            // Bow + stern curves
            ag.fillStyle(att.color ?? 0x8B4513, 0.6);
            ag.fillTriangle(hx - 6, fy, hx + 4, hy, hx + 12, fy);
            ag.fillTriangle(hx + hw - 12, fy, hx + hw - 4, hy, hx + hw + 6, fy);
            // Wake lines
            ag.lineStyle(1.5, 0x99CCFF, 0.5);
            ag.lineBetween(hx - 8, fy + 3, hx + hw + 8, fy + 3);
            ag.lineBetween(hx - 4, fy + 7, hx + hw + 4, fy + 7);

          } else if (att.subtype === 'fins') {
            // ── Swim fins (flippers) ─────────────────────────
            const fd = this.facingRight ? 1 : -1;
            const flipL = [wx - 16, wx - 8];
            const flipR = [wx + 8,  wx + 16];
            for (const [fx1, fx2] of [flipL, flipR]) {
              ag.fillStyle(att.color ?? 0x0088FF, 0.9);
              // Long flat flipper blade
              ag.fillTriangle(fx1, fy, fx2, fy, (fx1 + fx2) / 2 + fd * 26, fy + 5);
              ag.fillRect(fx1, fy - 8, fx2 - fx1, 10);
              ag.lineStyle(1.5, 0x005599);
              ag.strokeTriangle(fx1, fy, fx2, fy, (fx1 + fx2) / 2 + fd * 26, fy + 5);
              ag.strokeRect(fx1, fy - 8, fx2 - fx1, 10);
              // Strap
              ag.lineStyle(2, 0x003388, 0.8);
              ag.lineBetween(fx1 + 2, fy - 4, fx2 - 2, fy - 4);
            }

          } else if (att.subtype === 'car') {
            // ── Car body ─────────────────────────────────────
            const cw = 54, ch = 22;
            const bx = wx - cw / 2, by = fy - ch - 8;
            // Body
            ag.fillStyle(att.color ?? 0xFF2222, 1);
            ag.fillRoundedRect(bx, by, cw, ch, 5);
            ag.lineStyle(2, 0x882200);
            ag.strokeRoundedRect(bx, by, cw, ch, 5);
            // Cabin / roof
            ag.fillStyle(att.color ?? 0xFF2222, 1);
            ag.fillRoundedRect(bx + 8, by - 14, cw - 16, 16, 4);
            ag.lineStyle(1.5, 0x882200);
            ag.strokeRoundedRect(bx + 8, by - 14, cw - 16, 16, 4);
            // Windows
            ag.fillStyle(0x99DDFF, 0.8);
            ag.fillRoundedRect(bx + 10, by - 12, 14, 12, 2);
            ag.fillRoundedRect(bx + 28, by - 12, 14, 12, 2);
            // Wheels
            for (const wx2 of [bx + 8, bx + cw - 12]) {
              ag.fillStyle(0x222222, 1);
              ag.fillCircle(wx2 + 2, fy, 9);
              ag.lineStyle(2, 0x444444);
              ag.strokeCircle(wx2 + 2, fy, 9);
              ag.lineStyle(2, 0x888888);
              ag.lineBetween(wx2 + 2, fy - 6, wx2 + 2, fy + 6);
              ag.lineBetween(wx2 - 4, fy, wx2 + 8, fy);
            }
          } else if (att.subtype === 'skateboard') {
            // ── Skateboard ───────────────────────────────────
            const bw = 52, bh = 7;
            // Deck
            ag.fillStyle(att.color ?? 0x8B4513, 1);
            ag.fillRoundedRect(wx - bw / 2, fy - bh, bw, bh, 3);
            ag.lineStyle(1.5, 0x4A2000);
            ag.strokeRoundedRect(wx - bw / 2, fy - bh, bw, bh, 3);
            // Grip tape pattern
            ag.lineStyle(1, 0x000000, 0.35);
            for (let tx = wx - bw / 2 + 5; tx < wx + bw / 2 - 3; tx += 7) {
              ag.lineBetween(tx, fy - bh + 1, tx + 3, fy - 1);
            }
            // Trucks (metal bars)
            ag.lineStyle(3, 0x999999);
            ag.lineBetween(wx - bw / 2 + 6, fy, wx - bw / 2 + 18, fy);
            ag.lineBetween(wx + bw / 2 - 18, fy, wx + bw / 2 - 6, fy);
            // 4 wheels
            for (const wx2 of [wx - bw / 2 + 6, wx - bw / 2 + 16, wx + bw / 2 - 18, wx + bw / 2 - 8]) {
              ag.fillStyle(0x333333, 1);
              ag.fillCircle(wx2, fy, 5);
              ag.lineStyle(1.5, 0x666666);
              ag.strokeCircle(wx2, fy, 5);
            }
          } else {
            // ── Generic wheels ───────────────────────────────
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
          }

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
        if (att.subtype === 'floaties') {
          // ── Inflatable arm floaties ─────────────────────────
          const col = att.color ?? 0xFF6699;
          // Left armband
          ag.fillStyle(col, 0.92);
          ag.fillEllipse(wx - 26, wy - 10, 20, 14);
          ag.lineStyle(2, 0xCC3366);
          ag.strokeEllipse(wx - 26, wy - 10, 20, 14);
          // Right armband
          ag.fillStyle(col, 0.92);
          ag.fillEllipse(wx + 26, wy - 10, 20, 14);
          ag.lineStyle(2, 0xCC3366);
          ag.strokeEllipse(wx + 26, wy - 10, 20, 14);
          // Shine dots
          ag.fillStyle(0xFFFFFF, 0.5);
          ag.fillCircle(wx - 29, wy - 13, 3);
          ag.fillCircle(wx + 23, wy - 13, 3);

        } else if (att.subtype === 'submarine') {
          // ── Submarine ───────────────────────────────────────
          const col = att.color ?? 0xFFD700;
          const sx = wx + 6, sy = wy - 5;
          // Main hull (horizontal ellipse)
          ag.fillStyle(col, 1);
          ag.fillEllipse(sx + 14, sy, 52, 22);
          ag.lineStyle(2, 0x886600);
          ag.strokeEllipse(sx + 14, sy, 52, 22);
          // Conning tower
          ag.fillStyle(col, 1);
          ag.fillRect(sx + 8, sy - 20, 14, 12);
          ag.lineStyle(1.5, 0x886600);
          ag.strokeRect(sx + 8, sy - 20, 14, 12);
          // Periscope
          ag.lineStyle(3, 0x886600);
          ag.lineBetween(sx + 12, sy - 20, sx + 12, sy - 32);
          ag.lineBetween(sx + 12, sy - 32, sx + 18, sy - 32);
          // Porthole
          ag.fillStyle(0x99DDFF, 0.8);
          ag.fillCircle(sx + 22, sy, 5);
          ag.lineStyle(1.5, 0x886600);
          ag.strokeCircle(sx + 22, sy, 5);
          // Propeller
          const pa = this.wobbleTime * 8;
          ag.lineStyle(3, 0x775500);
          ag.lineBetween(sx + 39, sy, sx + 39 + Math.cos(pa) * 7, sy + Math.sin(pa) * 7);
          ag.lineBetween(sx + 39, sy, sx + 39 + Math.cos(pa + Math.PI) * 7, sy + Math.sin(pa + Math.PI) * 7);

        } else if (att.type === 'jetpack') {
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
