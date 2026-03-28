const ITEM_DB = [
  // Flying
  { keywords: ['jetpack', 'jet pack'], name: 'Jetpack', emoji: '🚀', position: 'back', type: 'jetpack', canFly: true, flySpeed: -180, speed: 30, color: 0x888888, description: 'WHOOOOSH! Strapped to your back and ready to blast!' },
  { keywords: ['wings', 'wing', 'angel wings', 'bird wings'], name: 'Wings', emoji: '🪶', position: 'back', type: 'wings', canFly: true, flySpeed: -150, color: 0xFFFFFF, description: 'Magnificent feathery wings! Flap flap flap...' },
  { keywords: ['propeller', 'propeller hat', 'helicopter hat', 'beanie'], name: 'Propeller Hat', emoji: '🌀', position: 'head', type: 'propeller', canFly: true, flySpeed: -140, color: 0x888888, description: 'A dizzy propeller hat! Watch out for doorframes.' },
  { keywords: ['rocketship', 'rocket ship', 'spaceship', 'space ship', 'space rocket'], name: 'Rocketship', emoji: '🛸', position: 'back', type: 'jetpack', canFly: true, flySpeed: -220, speed: 80, color: 0xCCCCCC, description: 'An ENTIRE rocketship. Somehow it fits.' },
  { keywords: ['balloon', 'balloons', 'hot air balloon'], name: 'Balloons', emoji: '🎈', position: 'head', type: 'propeller', canFly: true, flySpeed: -120, color: 0xFF6699, description: 'A bunch of balloons. You float up... slowly.' },
  { keywords: ['magic carpet', 'flying carpet', 'carpet'], name: 'Magic Carpet', emoji: '🪄', position: 'feet', type: 'wheels', canFly: true, flySpeed: -160, speed: 100, color: 0x9900CC, description: 'A whole magic carpet! Zig zag zoom.' },

  // Speed / Ground
  { keywords: ['car', 'automobile', 'vehicle'], name: 'Car', emoji: '🚗', position: 'feet', type: 'wheels', subtype: 'car', speed: 160, rams: true, color: 0xFF2222, description: 'VROOM! Drives through everything! NPCs go flying!' },
  { keywords: ['wheels', 'wheel', 'tires', 'tyres'], name: 'Wheels', emoji: '⚙️', position: 'feet', type: 'wheels', speed: 100, color: 0x666666, description: 'Just... wheels. Bolted on.' },
  { keywords: ['skateboard', 'skate board', 'skate'], name: 'Skateboard', emoji: '🛹', position: 'feet', type: 'wheels', subtype: 'skateboard', speed: 130, color: 0x8B4513, description: 'Radical! Also extremely dangerous.' },
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
  { keywords: ['boat', 'ship', 'sailboat', 'canoe', 'kayak'], name: 'Boat', emoji: '⛵', position: 'feet', type: 'wheels', subtype: 'boat', speed: 70, canSwim: true, color: 0x8B4513, description: 'For nautical adventures! Also walks funny on land.' },
  { keywords: ['floaties', 'floaty', 'arm floaties', 'swim ring', 'inflatable', 'floatation'], name: 'Floaties', emoji: '🏊', position: 'back', type: 'wings', subtype: 'floaties', canSwim: true, speed: 30, color: 0xFF6699, description: 'Fashionable AND buoyant.' },
  { keywords: ['surfboard', 'surf board', 'surf'], name: 'Surfboard', emoji: '🏄', position: 'feet', type: 'wheels', subtype: 'boat', speed: 90, canSwim: true, color: 0xFF9900, description: 'Hang ten! Or trip over it. Probably trip.' },
  { keywords: ['swim fins', 'fins', 'flippers'], name: 'Swim Fins', emoji: '🦈', position: 'feet', type: 'wheels', subtype: 'fins', speed: 60, canSwim: true, color: 0x0088FF, description: 'Big rubbery flippers. Terrible on land. Great in water.' },
  { keywords: ['submarine', 'sub'], name: 'Submarine', emoji: '🤿', position: 'back', type: 'jetpack', subtype: 'submarine', canFly: true, canSwim: true, flySpeed: -120, speed: 50, color: 0xFFD700, description: 'A whole submarine. It also works on land somehow.' },

  // Volcano
  { keywords: ['fire suit', 'firesuit', 'heat suit', 'lava suit', 'heat shield'], name: 'Fire Suit', emoji: '🔥', position: 'back', type: 'jetpack', canFly: true, flySpeed: -160, speed: 40, color: 0xFF4500, description: 'Rated for up to 3000°C. Probably.' },
  { keywords: ['lava board', 'lavaboard', 'lava surfboard'], name: 'Lava Board', emoji: '🌋', position: 'feet', type: 'wheels', canFly: true, flySpeed: -150, speed: 80, canSwim: true, color: 0xFF6600, description: 'A board that hovers over lava. Very normal.' },
  { keywords: ['fire boots', 'fireboots', 'heat boots'], name: 'Fire Boots', emoji: '👢', position: 'feet', type: 'rockets', canFly: true, flySpeed: -140, speed: 70, jumpBoost: -80, color: 0xFF4500, description: 'Your feet are literally on fire. Still better than no shoes.' },

  // Frozen
  { keywords: ['snowmobile', 'snow mobile', 'snowcat'], name: 'Snowmobile', emoji: '🛷', position: 'feet', type: 'wheels', speed: 160, color: 0xADD8E6, description: 'VAROOM on the snow. Also slides everywhere.' },
  { keywords: ['ice skates', 'iceskates', 'figure skates'], name: 'Ice Skates', emoji: '⛸️', position: 'feet', type: 'wheels', speed: 120, color: 0x87CEEB, description: 'You go VERY fast. Stopping is someone else\'s problem.' },
  { keywords: ['sled', 'sledge', 'toboggan'], name: 'Sled', emoji: '🛷', position: 'feet', type: 'wheels', speed: 100, color: 0xD2691E, description: 'Great downhill. Useless uphill. Whoops.' },
  { keywords: ['snow boots', 'snowboots', 'snow shoes', 'snowshoes'], name: 'Snow Boots', emoji: '🥾', position: 'feet', type: 'springs', jumpBoost: -120, speed: 40, color: 0xFFFFFF, description: 'Big fluffy boots. You look ridiculous. You jump high.' },

  // Space
  { keywords: ['space boots', 'spaceboots', 'gravity boots', 'moon boots'], name: 'Gravity Boots', emoji: '🚀', position: 'feet', type: 'rockets', canFly: true, flySpeed: -100, speed: 50, jumpBoost: -150, color: 0x888888, description: 'These boots were made for floating.' },
  { keywords: ['rocket pack', 'rocketpack', 'booster pack'], name: 'Rocket Pack', emoji: '🛸', position: 'back', type: 'jetpack', canFly: true, flySpeed: -230, speed: 90, color: 0xCCCCCC, description: 'A massive rocket pack. You are basically a missile now.' },
  { keywords: ['laser legs', 'laser', 'lasers'], name: 'Laser Legs', emoji: '⚡', position: 'feet', type: 'wheels', speed: 220, color: 0xFF00FF, description: 'Laser-powered legs. Illegal in 14 star systems.' },

  // Jungle
  { keywords: ['vine', 'vine swing', 'liana', 'grapple', 'grappling hook'], name: 'Vine Swing', emoji: '🌿', position: 'back', type: 'wings', canFly: true, flySpeed: -155, speed: 40, color: 0x4CAF50, description: 'Swing through the jungle like a complete disaster.' },
  { keywords: ['machete', 'machette', 'sword'], name: 'Machete Legs', emoji: '🔪', position: 'feet', type: 'wheels', speed: 140, color: 0xC0C0C0, description: 'Machetes strapped to the legs. Fast AND terrifying.' },
  { keywords: ['monkey', 'monkey arms', 'monkey bars'], name: 'Monkey Arms', emoji: '🐒', position: 'back', type: 'wings', canFly: true, flySpeed: -130, speed: 60, color: 0x8B4513, description: 'Big floppy monkey arms. You swing now.' },

  // New items
  { keywords: ['hang glider', 'hangglider', 'glider'], name: 'Hang Glider', emoji: '🪂', position: 'back', type: 'wings', canFly: true, flySpeed: -135, speed: 70, color: 0xFF6600, description: 'A big colourful hang glider. Terrifying. Wonderful.' },
  { keywords: ['parachute', 'para', 'chute'], name: 'Parachute', emoji: '🪂', position: 'back', type: 'wings', canFly: true, flySpeed: -90, speed: 20, color: 0xFF9966, description: 'Floats down very slowly. Going up? Not so much.' },
  { keywords: ['hoverboard', 'hover board', 'hover'], name: 'Hoverboard', emoji: '🛹', position: 'feet', type: 'wheels', subtype: 'skateboard', canFly: true, flySpeed: -110, speed: 170, color: 0x00CCFF, description: 'HOVERING! Futuristic board. Unstoppable.' },
  { keywords: ['life raft', 'liferaft', 'raft', 'inflatable raft'], name: 'Life Raft', emoji: '🛟', position: 'feet', type: 'wheels', subtype: 'boat', canSwim: true, speed: 55, color: 0xFF6600, description: 'An orange inflatable raft. Slow but it floats!' },
  { keywords: ['water wings', 'armband', 'armbands', 'swimming aids'], name: 'Water Wings', emoji: '🏊', position: 'back', type: 'wings', subtype: 'floaties', canSwim: true, speed: 40, color: 0xFF88AA, description: 'Inflatable armbands. Yes, for adults too.' },
  { keywords: ['seaplane', 'sea plane', 'floatplane', 'float plane'], name: 'Seaplane', emoji: '✈️', position: 'back', type: 'jetpack', subtype: 'submarine', canFly: true, canSwim: true, flySpeed: -200, speed: 120, color: 0xCCDDFF, description: 'A seaplane. Works on water AND air. Zero dignity.' },
  { keywords: ['speedboat', 'speed boat', 'motorboat', 'motor boat'], name: 'Speedboat', emoji: '🚤', position: 'feet', type: 'wheels', subtype: 'boat', canSwim: true, speed: 180, color: 0xFFCC00, description: 'ZOOOOM across the water! Also bumpy on land.' },
  { keywords: ['duck', 'rubber duck', 'duck boat'], name: 'Rubber Duck', emoji: '🦆', position: 'feet', type: 'wheels', subtype: 'boat', canSwim: true, speed: 50, color: 0xFFEE00, description: 'A giant rubber duck. Slow but absolutely iconic.' },
  { keywords: ['umbrella', 'brolly', 'parasol'], name: 'Umbrella', emoji: '☂️', position: 'head', type: 'propeller', canFly: true, flySpeed: -100, speed: 30, color: 0xFF4488, description: 'Hold the umbrella and float gently! Like Mary Poppins but worse.' },
  { keywords: ['truck', 'lorry', 'big truck', 'monster truck'], name: 'Monster Truck', emoji: '🚛', position: 'feet', type: 'wheels', subtype: 'car', speed: 190, rams: true, color: 0x226622, description: 'ENORMOUS truck. Crushes everything. Even the camera fears it.' },
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
