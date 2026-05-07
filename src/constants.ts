export interface LevelRequirement {
  gigs: number;
  performance: number;
  vocals: number;
  songwriting: number;
  production: number;
  streams: number;
  sales: number;
}

export const LEVEL_REQUIREMENTS: Record<number, LevelRequirement> = {
  1: { gigs: 10, performance: 0, vocals: 0, songwriting: 0, production: 0, streams: 0, sales: 0 },
  2: { gigs: 25, performance: 10, vocals: 5, songwriting: 5, production: 10, streams: 0, sales: 0 },
  3: { gigs: 40, performance: 20, vocals: 15, songwriting: 15, production: 20, streams: 0, sales: 0 },
  4: { gigs: 60, performance: 35, vocals: 25, songwriting: 25, production: 35, streams: 0, sales: 0 },
  5: { gigs: 80, performance: 50, vocals: 40, songwriting: 40, production: 50, streams: 0, sales: 0 },
  6: { gigs: 100, performance: 60, vocals: 50, songwriting: 50, production: 60, streams: 1000000, sales: 10000 },
  7: { gigs: 120, performance: 75, vocals: 65, songwriting: 65, production: 75, streams: 5000000, sales: 50000 },
  8: { gigs: 150, performance: 85, vocals: 80, songwriting: 80, production: 85, streams: 25000000, sales: 250000 },
  9: { gigs: 200, performance: 95, vocals: 90, songwriting: 90, production: 95, streams: 100000000, sales: 1000000 },
  10: { gigs: 250, performance: 100, vocals: 100, songwriting: 100, production: 100, streams: 500000000, sales: 5000000 }
};

export const NPC_ARTISTS = [
  // Pop/Mainstream
  { name: 'Tyler Swift', basePoints: 450000, type: 'Pop' },
  { name: 'The Weekdy', basePoints: 420000, type: 'Pop' },
  { name: 'Ariana Venti', basePoints: 350000, type: 'Pop' },
  { name: 'Post Malon', basePoints: 280000, type: 'Pop' },
  { name: 'Ed Sheran', basePoints: 260000, type: 'Pop' },
  { name: 'Dua Lip', basePoints: 240000, type: 'Pop' },
  { name: 'Bili Elsh', basePoints: 200000, type: 'Pop' },
  { name: 'Justin Bebe', basePoints: 195000, type: 'Pop' },
  { name: 'Harry Stylus', basePoints: 190000, type: 'Pop' },
  { name: 'Katy Bear', basePoints: 185000, type: 'Pop' },
  { name: 'Bruno Marsbar', basePoints: 180000, type: 'Pop' },
  { name: 'Adeley', basePoints: 210000, type: 'Pop' },
  { name: 'Rihanna', basePoints: 205000, type: 'R&B' },
  { name: 'Maroon 6', basePoints: 150000, type: 'Pop' },
  { name: 'Shawn Mends', basePoints: 145000, type: 'Pop' },
  { name: 'Charlie Put', basePoints: 140000, type: 'Pop' },
  { name: 'Miley Syrups', basePoints: 160000, type: 'Pop' },
  { name: 'Selena Gomas', basePoints: 155000, type: 'Pop' },
  { name: 'Demi Lovat', basePoints: 120000, type: 'Pop' },
  { name: 'Oliva Rodrigo', basePoints: 220000, type: 'Pop' },
  { name: 'Doja Cat', basePoints: 215000, type: 'Rap' },
  { name: 'Sabrina Carpent', basePoints: 180000, type: 'Pop' },
  { name: 'Tate McRae', basePoints: 170000, type: 'Pop' },
  { name: 'Lizzo', basePoints: 140000, type: 'Pop' },
  { name: 'Lil Nas X', basePoints: 150000, type: 'Pop' },
  // Rap/Hip-Hop
  { name: 'Drank', basePoints: 400000, type: 'Rap' },
  { name: 'Kendrick Llama', basePoints: 300000, type: 'Rap' },
  { name: 'Travis Scat', basePoints: 190000, type: 'Rap' },
  { name: 'J. Cole', basePoints: 185000, type: 'Rap' },
  { name: 'Eminm', basePoints: 180000, type: 'Rap' },
  { name: 'Kanye West', basePoints: 195000, type: 'Rap' },
  { name: 'Future', basePoints: 175000, type: 'Rap' },
  { name: 'Lil Baby', basePoints: 160000, type: 'Rap' },
  { name: 'Lil Uzi Vert', basePoints: 150000, type: 'Rap' },
  { name: 'Playboi Carti', basePoints: 145000, type: 'Rap' },
  { name: '21 Savage', basePoints: 165000, type: 'Rap' },
  { name: 'Gunna', basePoints: 140000, type: 'Rap' },
  { name: 'Polo G', basePoints: 130000, type: 'Rap' },
  { name: 'JID', basePoints: 100000, type: 'Rap' },
  { name: 'Young Thug', basePoints: 110000, type: 'Rap' },
  { name: 'A$AP Rocky', basePoints: 120000, type: 'Rap' },
  { name: 'Mac Miller', basePoints: 105000, type: 'Rap' },
  { name: 'Megan Thee Stallion', basePoints: 135000, type: 'Rap' },
  { name: 'Cardi B', basePoints: 140000, type: 'Rap' },
  { name: 'Nicki Minaj', basePoints: 155000, type: 'Rap' },
  // Latin
  { name: 'Bad Bunny', basePoints: 380000, type: 'Latin' },
  { name: 'J Balvin', basePoints: 210000, type: 'Latin' },
  { name: 'Carol G', basePoints: 250000, type: 'Latin' },
  { name: 'Rosalia', basePoints: 190000, type: 'Latin' },
  { name: 'Maluma', basePoints: 160000, type: 'Latin' },
  { name: 'Rauw Alejandro', basePoints: 170000, type: 'Latin' },
  { name: 'Ozuna', basePoints: 150000, type: 'Latin' },
  { name: 'Shakira', basePoints: 195000, type: 'Latin' },
  { name: 'Peso Pluma', basePoints: 220000, type: 'Latin' },
  { name: 'Bizarrap', basePoints: 180000, type: 'Latin' },
  // K-pop
  { name: 'BTS (Band)', basePoints: 330000, type: 'Kpop' },
  { name: 'Blackpink', basePoints: 290000, type: 'Kpop' },
  { name: 'Stray Kids', basePoints: 150000, type: 'Kpop' },
  { name: 'Twice', basePoints: 140000, type: 'Kpop' },
  { name: 'Tomorrow X Together', basePoints: 120000, type: 'Kpop' },
  { name: 'Seventeen', basePoints: 160000, type: 'Kpop' },
  { name: 'NewJeans', basePoints: 180000, type: 'Kpop' },
  { name: 'Aespa', basePoints: 130000, type: 'Kpop' },
  { name: 'Fifty Fifty', basePoints: 90000, type: 'Kpop' },
  { name: 'IVE', basePoints: 100000, type: 'Kpop' },
  // Country
  { name: 'Morgan Walln', basePoints: 220000, type: 'Country' },
  { name: 'Luka Comb', basePoints: 180000, type: 'Country' },
  { name: 'Zach Bryan', basePoints: 190000, type: 'Country' },
  { name: 'Chris Stapleton', basePoints: 150000, type: 'Country' },
  { name: 'Carrie Underwoods', basePoints: 100000, type: 'Country' },
  { name: 'Kane Brown', basePoints: 110000, type: 'Country' },
  { name: 'Blake Shelton', basePoints: 95000, type: 'Country' },
  { name: 'Luke Bryan', basePoints: 90000, type: 'Country' },
  { name: 'Thomas Rhett', basePoints: 85000, type: 'Country' },
  { name: 'Bailey Zimmerman', basePoints: 80000, type: 'Country' },
  // R&B
  { name: 'SZA', basePoints: 210000, type: 'R&B' },
  { name: 'Frank Ocean', basePoints: 170000, type: 'R&B' },
  { name: 'Brent Faiyaz', basePoints: 120000, type: 'R&B' },
  { name: 'Summer Walker', basePoints: 110000, type: 'R&B' },
  { name: 'H.E.R.', basePoints: 100000, type: 'R&B' },
  { name: 'Kehlani', basePoints: 90000, type: 'R&B' },
  { name: 'Giveon', basePoints: 85000, type: 'R&B' },
  { name: 'Bryson Tiller', basePoints: 80000, type: 'R&B' },
  { name: 'Jhene Aiko', basePoints: 95000, type: 'R&B' },
  { name: 'Alicia Keys', basePoints: 75000, type: 'R&B' },
  // Rock/Alternative
  { name: 'Coldplay', basePoints: 200000, type: 'Rock' },
  { name: 'Imagine Dragons', basePoints: 180000, type: 'Rock' },
  { name: 'Arctic Monkeys', basePoints: 160000, type: 'Rock' },
  { name: 'The Killers', basePoints: 120000, type: 'Rock' },
  { name: 'Red Hot Chili Peppers', basePoints: 130000, type: 'Rock' },
  { name: 'Linkin Park', basePoints: 150000, type: 'Rock' },
  { name: 'Green Day', basePoints: 110000, type: 'Rock' },
  { name: 'Fall Out Boy', basePoints: 90000, type: 'Rock' },
  { name: 'Paramore', basePoints: 85000, type: 'Rock' },
  { name: 'Twenty One Pilots', basePoints: 100000, type: 'Rock' },
  // EDM/Dance
  { name: 'Calvin Harris', basePoints: 160000, type: 'Dance' },
  { name: 'David Guetta', basePoints: 150000, type: 'Dance' },
  { name: 'Martin Garrix', basePoints: 120000, type: 'Dance' },
  { name: 'Tiësto', basePoints: 110000, type: 'Dance' },
  { name: 'The Chainsmokers', basePoints: 130000, type: 'Dance' },
  { name: 'Zedd', basePoints: 100000, type: 'Dance' },
  { name: 'Kygo', basePoints: 90000, type: 'Dance' },
  { name: 'DJ Snake', basePoints: 115000, type: 'Dance' },
  { name: 'Marshmello', basePoints: 125000, type: 'Dance' },
  { name: 'Alan Walker', basePoints: 105000, type: 'Dance' }
];

export const NPC_SONG_TITLES = [
  "Midnight Rain", "Sunset Blvd", "Electric Love", "Heartbreak", "Lost in the City", 
  "Neon Lights", "Summer Breeze", "Dancing Alone", "Echoes", "Fading Away", 
  "Starry Night", "Ocean Waves", "Fire & Ice", "Golden Hour", "Silver Lining", 
  "Broken Glass", "Silent Whispers", "Wildfire", "Tidal Wave", "Desert Rose", 
  "Crystal Clear", "Velvet Sky", "Crimson Tide", "Shadows", "Mirage", "Oasis", 
  "Labyrinth", "Euphoria", "Nostalgia", "Serendipity", "Temptation", "Reckless", 
  "Wanderlust", "Reverie", "Enigma", "Paradox", "Infinity", "Eternity", "Baby", 
  "Toxic", "Bad Guy", "Lover", "Stay", "Heat Waves", "Blinding Lights", "Sugar"
];

export const NPC_ALBUM_TITLES = [
  "The Album", "Deluxe Edition", "Vol. 1", "Greatest Hits", "Unplugged", 
  "Live at Wembley", "Remixed", "Stripped", "The Collection", "B-Sides", 
  "The EP", "Lost Tapes", "Acoustic Sessions", "Summer Sampler", "Winter Stories"
];

const ADJECTIVES = [
  "Midnight", "Electric", "Neon", "Summer", "Silent", "Starry", "Golden", 
  "Silver", "Broken", "Wild", "Crystal", "Velvet", "Crimson", "Dark", 
  "Sweet", "Bitter", "Beautiful", "Endless", "Fading", "Lost", "Lonely"
];

const NOUNS = [
  "Rain", "Love", "City", "Breeze", "Echoes", "Night", "Waves", "Hour", 
  "Lining", "Glass", "Whispers", "Fire", "Tide", "Rose", "Sky", "Shadows", 
  "Mirage", "Oasis", "Heart", "Dream", "Memories"
];

const getNPCTitle = (seed: number, isAlbum: boolean) => {
  if (isAlbum) {
    const arr = NPC_ALBUM_TITLES;
    return arr[seed % arr.length];
  }
  const adj = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  // Occasional single word
  if (seed % 5 === 0) return noun;
  return `${adj} ${noun}`;
};

export const generateNPCSongs = (multiplier: number = 1, seed: number = 1) => {
  const songs: any[] = [];
  NPC_ARTISTS.forEach((npc, i) => {
    for (let j = 0; j < 4; j++) {
      // Stable base for this song to ensure consistency across weeks
      const basePseudo = Math.floor(Math.abs(Math.sin((i + 1) * (j + 1))) * 50000);
      // Small weekly fluctuation
      const weeklyFluctuation = Math.floor(Math.abs(Math.cos(seed * (i + j + 1))) * 15000);
      
      const titleSeed = Math.floor(Math.abs(Math.cos(i * 10 + j) * 1000));
      const title = getNPCTitle(titleSeed, false);
      
      songs.push({
        id: `${npc.name}-${j}-song`,
        title: `${title}`,
        artist: npc.name,
        points: Math.floor((npc.basePoints * 1.25 * (1 - j * 0.2) + basePseudo + weeklyFluctuation) * multiplier),
        type: 'Single' as const,
        isPlayer: false
      });
    }
  });
  return songs;
};

export const generateNPCAlbums = (multiplier: number = 1, seed: number = 1) => {
  const albums: any[] = [];
  NPC_ARTISTS.forEach((npc, i) => {
    for (let j = 0; j < 3; j++) {
      const basePseudo = Math.floor(Math.abs(Math.cos((i + 1) * (j + 1))) * 30000);
      const weeklyFluctuation = Math.floor(Math.abs(Math.sin(seed * (i + j + 1))) * 10000);
      
      const titleSeed = Math.floor(Math.abs(Math.sin(i * 10 + j) * 1000));
      const title = getNPCTitle(titleSeed, true);
      albums.push({
        id: `${npc.name}-${j}-album`,
        title: `${title}`,
        artist: npc.name,
        points: Math.floor((npc.basePoints * 0.8 * (1 - j * 0.25) + basePseudo + weeklyFluctuation) * multiplier),
        type: 'Album' as const,
        isPlayer: false
      });
    }
  });
  return albums;
};
