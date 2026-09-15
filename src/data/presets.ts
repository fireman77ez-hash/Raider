import type { RaidPreset } from '../types/raid';

export const RAID_PRESETS: RaidPreset[] = [
  {
    id: 'destiny2-salvations-edge',
    game: 'Destiny 2',
    category: 'The Final Shape',
    title: "Salvation's Edge",
    difficulty: 'Master Difficulty',
    defaultRoles: [
      { name: 'Ad-Clear / Runner', emoji: '⚡', needed: 2 },
      { name: 'DPS / Well of Radiance', emoji: '🔥', needed: 2 },
      { name: 'Dissector / Mechanics', emoji: '👁️', needed: 2 },
    ],
    voiceChannel: '🔊 Discord Voice: Raid Alpha',
    requirements: '2005+ Power Level • Overload & Unstoppable weapons • Know mechanics (KWTD)',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
    colorHex: '#5865F2', // Discord Blurple
  },
  {
    id: 'wow-undermine',
    game: 'World of Warcraft',
    category: 'The War Within',
    title: 'Liberation of Undermine',
    difficulty: 'Heroic (AOTC Run)',
    defaultRoles: [
      { name: 'Tanks', emoji: '🛡️', needed: 2 },
      { name: 'Healers', emoji: '💚', needed: 4 },
      { name: 'Ranged DPS', emoji: '🏹', needed: 7 },
      { name: 'Melee DPS', emoji: '⚔️', needed: 7 },
    ],
    voiceChannel: '🔊 Comms: Guild Raid Hall',
    requirements: 'ilvl 625+ • Full Enchants & Phials • DBM / BigWigs required • Discord required',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&auto=format&fit=crop&q=80',
    colorHex: '#ED4245', // Crimson
  },
  {
    id: 'ffxiv-savage',
    game: 'Final Fantasy XIV',
    category: 'Dawntrail',
    title: 'AAC Light-heavyweight M4S',
    difficulty: 'Savage (Enrage to Clear)',
    defaultRoles: [
      { name: 'Main Tank / Off Tank', emoji: '🛡️', needed: 2 },
      { name: 'Pure / Barrier Healer', emoji: '✨', needed: 2 },
      { name: 'Melee DPS', emoji: '⚔️', needed: 2 },
      { name: 'Phys Ranged / Caster', emoji: '🔮', needed: 2 },
    ],
    voiceChannel: '🔊 Voice: Static Room 2',
    requirements: 'BiS Food & Grade 2 Pots • Seen Enrage / Clean Phase 2 • Hector Strats',
    bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
    colorHex: '#9B59B6', // Amethyst
  },
  {
    id: 'pokemongo-legendary',
    game: 'Pokémon GO',
    category: '5-Star Mega Raid',
    title: 'Mega Rayquaza / Primal Groudon',
    difficulty: 'Tier 5 Mega Raid',
    defaultRoles: [
      { name: 'Ice / Water Attackers', emoji: '❄️', needed: 4 },
      { name: 'Dragon / Fairy DPS', emoji: '🐲', needed: 3 },
      { name: 'Remote Pass Raiders', emoji: '🎟️', needed: 5 },
    ],
    voiceChannel: '🔊 Local Gym Meetup / Campfire',
    requirements: 'Level 35+ • Top Ice counters (Mamoswine/Glaceon) • Be ready at hatch time',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=200&auto=format&fit=crop&q=80',
    colorHex: '#57F287', // Emerald Green
  },
  {
    id: 'rust-oil-rig',
    game: 'Rust',
    category: 'Monument Takeover',
    title: 'Large Oil Rig & Heavy Scientists',
    difficulty: 'High Danger PvP/PvE',
    defaultRoles: [
      { name: 'Boat / Mini Pilot', emoji: '🚁', needed: 1 },
      { name: 'Heavy Scientist Breachers', emoji: '💥', needed: 3 },
      { name: 'Crane Sniper / Lookout', emoji: '🎯', needed: 2 },
    ],
    voiceChannel: '🔊 Discord: Rust Clan Comms',
    requirements: 'Bring Red Keycard, Fuse, 300+ 5.56, 15 Meds, Full Metal/Roadsign kit',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
    colorHex: '#FEE75C', // Gold
  },
  {
    id: 'helldivers2-superhelldive',
    game: 'Helldivers 2',
    category: 'Galactic War Order',
    title: 'Super Helldive (Level 10)',
    difficulty: 'Difficulty 10: Super Helldive',
    defaultRoles: [
      { name: 'Anti-Tank / Heavy Specialist', emoji: '🚀', needed: 2 },
      { name: 'Crowd Control / Sentry Support', emoji: '🛡️', needed: 1 },
      { name: 'Objective Scout / Stealth', emoji: '🏃', needed: 1 },
    ],
    voiceChannel: '🔊 Comms: Super Destroyer Bridge',
    requirements: 'Level 50+ • Anti-Armor stratagems equipped • Reinforce responsibly • Mic preferred',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&auto=format&fit=crop&q=80',
    colorHex: '#FFA800', // Hazard Orange
  },
];
