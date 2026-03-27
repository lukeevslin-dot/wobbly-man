const ITEM_DB = [
  // Flying
  { keywords: ['jetpack', 'jet pack'], name: 'Jetpack', emoji: '🚀', position: 'back', type: 'jetpack', canFly: true, flySpeed: -180, speed: 30, color: 0x888888, description: 'WHOOOOSH! Strapped to your back and ready to blast!' },
  { keywords: ['wings', 'wing', 'angel wings', 'bird wings'], name: 'Wings', emoji: '🪶', position: 'back', type: 'wings', canFly: true, flySpeed: -150, color: 0xFFFFFF, description: 'Magnificent feathery wings! Flap flap flap...' },
  { keywords: ['propeller', 'propeller hat', 'helicopter hat', 'beanie'], name: 'Propeller Hat', emoji: '🌀', position: 'head', type: 'propeller', canFly: true, flySpeed: -140, color: 0x888888, description: 'A dizzy propeller hat! Watch out for doorframes.' },
  { keywords: ['rocketship', 'rocket ship', 'spaceship', 'space ship', 'space rocket'], name: 'Rocketship', emoji: '🛸', position: 'back', type: 'jetpack', canFly: true, flySpeed: -220, speed: 80, color: 0xCCCCCC, description: 'An ENTIRE rocketship. Somehow it fits.' },
  { keywords: ['balloon', 'balloons', 'hot air balloon'], name: 'Balloons', emoji: '🎈', position: 'head', type: 'propeller', canFly: true, flySpeed: -120, color: 0xFF6699, description: 'A bunch of balloons. You float up... slowly.' },
  { keywords: ['magic carpet', 'flying carpet', 'carpet'], name: 'Magic Carpet', emoji: '🪄', position: 'feet', type: 'wheels', canFly: true, flySpeed: -160, speed: 100, color: 0x9900CC, description: 'A whole magic carpet! Zig zag zoom.' },

  // Speed / Ground
  { keywords: ['car', 'automobile', 'vehicle'], name: 'Car', emoji: '🚗', position: 'feet', type: 'wheels', speed: 160, color: 0xFF2222, description: 'VROOM! Wheels instead of feet. Sort of.' },
  { keywords: ['wheels', 'wheel', 'tires', 'tyres'], name: 'Wheels', emoji: '⚙️', position: 'feet', type: 'wheels', speed: 100, color: 0x666666, description: 'Just... wheels. Bolted on.' },
  { keywords: ['skateboard', 'skate board', 'skate'], name: 'Skateboard', emoji: '🛹', position: 'feet', type: 'wheels', speed: 130, color: 0x8B4513, description: 'Radical! Also extremely dangerous.' },
  { keywords: ['rollerblades', 'roller blades', 'skates', 'rollerskates', 'roller skates'], name: 'Rollerblades', emoji: '⛸️', position: 'feet', type: 'wheels', speed: 140, color: 0x0066FF, description: "Now you're zooming! And can't stop." },
  { keywords: ['motorcycle', 'motorbike', 'motocycle'], name: 'Motorcycle', emoji: '🏍️', position: 'feet', type: 'wheels', speed: 200, color: 0x222222, description: 'BRAP BRAP! Maximum speed. Minimum dignity.' },
  { keywords: ['rocket boots', 'rocket', 'boosters', 'rocket shoes'], name: 'Rocket Boots', emoji: '🔥', position: 'feet', type: 'rockets', speed: 60, jumpBoost: -100, color: 0xFF4444, description: 'Rockets on the feet! Higher jumps. Also on fire.' },
  { keywords: ['horse', 'pony', 'horselegs', 'horse legs'], name: 'Horse Legs', emoji: '🐎', position: 'feet', type: 'wheels', speed: 180, jumpBoost: -80, color: 0xCC8844, description: 'Clip clop clip clop! You gallop now.' },
  { keywords: ['jetski', 'jet ski', 'waterjet'], name: 'Jet Ski', emoji: '🚤', position: 'feet', type: 'wheels', speed: 150, canSwim: true, color: 0x0099FF, description: 'ON LAND?! Yes. Also water.' },

  // Jump
  { keywords: ['spring legs', 'springs', 'spring', 'pogo', 'pogo stick', 'spring feet'], name: 'Spring Legs', emoji: '🌱', position: 'feet', type: 'springs', jumpBoost: -200, color: 0x00CC44, description: 'BOING! These legs have OPINIONS about jumping.' },
  { keywords: ['bouncy boots', 'bouncy shoes', 'bounce boots', 'bouncy'], name: 'Bouncy Boots', emoji: '👟', position: 'feet', type: 'springs', jumpBoost: -170, color: 0xFF9900, description: 'Every step is a surprise.' },
  { keywords: ['trampoline', 'bouncer', 'trampoline feet'], name: 'Trampoline Feet', emoji: '🎪', position: 'feet', type: 'springs', jumpBoost: -220, color: 0xFF6600, description: 'Your feet ARE a trampoline now.' },

  // Water
  { keywords: ['boat', 'ship', 'sailboat', 'canoe', 'kayak'], name: 'Boat', emoji: '⛵', position: 'feet', type: 'wheels', speed: 70, canSwim: true, color: 0x8B4513, description: 'For nautical adventures! Also walks funny on land.' },
  { keywords: ['floaties', 'floaty', 'arm floaties', 'swim ring', 'inflatable', 'floatation'], name: 'Floaties', emoji: '🏊', position: 'back', type: 'wings', canSwim: true, speed: 30, color: 0xFF6699, description: 'Fashionable AND buoyant.' },
  { keywords: ['surfboard', 'surf board', 'surf'], name: 'Surfboard', emoji: '🏄', position: 'feet', type: 'wheels', speed: 90, canSwim: true, color: 0xFF9900, description: 'Hang ten! Or trip over it. Probably trip.' },
];

export class BuildSystem {
  interpret(rawInput) {
    const input = rawInput.toLowerCase().trim();

    // Check all keyword lists
    for (const item of ITEM_DB) {
      for (const kw of item.keywords) {
        if (input === kw || input.includes(kw) || kw.includes(input)) {
          const { keywords, ...rest } = item;
          return { ...rest };
        }
      }
    }

    // Creative fallback
    return this.generateCreative(rawInput);
  }

  generateCreative(input) {
    const bases = [
      { position: 'feet', type: 'wheels', speed: 80 + Math.random() * 80 },
      { position: 'back', type: 'jetpack', canFly: true, flySpeed: -130 - Math.random() * 60 },
      { position: 'feet', type: 'springs', jumpBoost: -100 - Math.random() * 120 },
      { position: 'head', type: 'propeller', canFly: true, flySpeed: -120 - Math.random() * 50 },
      { position: 'back', type: 'wings', canFly: true, flySpeed: -140 - Math.random() * 40 },
    ];
    const base = bases[Math.floor(Math.random() * bases.length)];
    const color = Math.floor(Math.random() * 0xFFFFFF);

    const descriptions = [
      `A ${input}! Nobody really knows how it works, but here we are.`,
      `Behold: THE ${input.toUpperCase()}! Probably does something.`,
      `A genuine ${input}, attached with duct tape and optimism.`,
      `Is that a ${input}? On a stickman? Absolutely.`,
      `The ${input} has been installed. Warranty void.`,
    ];

    const emojis = ['⚙️', '🔩', '💡', '🎈', '🪄', '🎪', '🌀', '💫', '🎯', '🎲', '🧪', '🔮'];

    return {
      name: input.charAt(0).toUpperCase() + input.slice(1),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      color,
      ...base,
    };
  }
}
