import Phaser from 'phaser';
import WobblyScene from './scenes/WobblyScene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#87CEEB',
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [WobblyScene],
};

new Phaser.Game(config);
