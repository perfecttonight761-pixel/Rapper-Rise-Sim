import { GameState, GrammysNominee, GrammysCategoryResult, AwardCategory } from './types';
import { NPC_ARTISTS, generateNPCSongs, generateNPCAlbums } from './constants';

export function generateNominees(gameState: GameState, year: number): GrammysCategoryResult[] {
  const previousYear = year - 1;
  
  // Filter player releases from previous year
  const playerReleases = gameState.releases.filter(r => {
    if (!r.releaseDate || r.status !== 'Published') return false;
    return new Date(r.releaseDate).getFullYear() === previousYear;
  });

  const playerSingles = playerReleases.filter(r => r.type === 'Single');
  const playerAlbums = playerReleases.filter(r => r.type === 'Album');

  // Generate NPC data from "previous year" (using a fixed seed for that year)
  const npcSingles = generateNPCSongs(1.1, previousYear);
  const npcAlbums = generateNPCAlbums(1.1, previousYear);

  const categories: AwardCategory[] = [
    'Artist of the Year',
    'Song of the Year',
    'Album of the Year',
    'Record of the Year',
    'Best Pop Album',
    'Best Country Album',
    'Best Rap Album'
  ];

  const submissions = gameState.grammys?.submissions || [];

  const getSubmittedWork = (catName: AwardCategory, type: 'Single' | 'Album' | 'Artist') => {
    const sub = submissions.find(s => s.category === catName);
    if (!sub) return null;
    if (type === 'Artist' && sub.workId === 'artist') {
       return { id: gameState.artist?.name || 'Player', title: undefined, artist: gameState.artist?.name || 'Player', isPlayer: true, type: 'Artist' as const };
    }
    const release = playerReleases.find(r => r.id === sub.workId && (type === 'Single' ? r.type === 'Single' : (r.type === 'Studio Album' || r.type === 'EP')));
    if (release) {
       return { id: release.id, title: release.title, artist: gameState.artist?.name || 'Player', isPlayer: true, type };
    }
    return null;
  };

  const results: GrammysCategoryResult[] = categories.map(category => {
    let pool: GrammysNominee[] = [];

    switch (category) {
      case 'Artist of the Year': {
        const pSub = getSubmittedWork('Artist of the Year', 'Artist');
        if (pSub) pool.push(pSub);
        NPC_ARTISTS.slice(0, 15).forEach(npc => {
           pool.push({ id: npc.name, artist: npc.name, isPlayer: false, type: 'Artist' });
        });
        break;
      }
      case 'Song of the Year':
      case 'Record of the Year': {
        const pSub = getSubmittedWork(category, 'Single');
        if (pSub) pool.push(pSub);
        npcSingles.forEach(s => pool.push({ id: s.id, title: s.title, artist: s.artist, isPlayer: false, type: 'Single' }));
        break;
      }
      case 'Album of the Year': {
        const pSub = getSubmittedWork('Album of the Year', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album' }));
        break;
      }
      case 'Best Pop Album': {
        const pSub = getSubmittedWork('Best Pop Album', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.filter(a => {
           const npc = NPC_ARTISTS.find(n => n.name === a.artist);
           return npc?.type === 'Pop' || npc?.type === 'Kpop';
        }).forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album' }));
        break;
      }
      case 'Best Rap Album': {
        const pSub = getSubmittedWork('Best Rap Album', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.filter(a => {
           const npc = NPC_ARTISTS.find(n => n.name === a.artist);
           return npc?.type === 'Rap';
        }).forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album' }));
        break;
      }
      case 'Best Country Album': {
        const pSub = getSubmittedWork('Best Country Album', 'Album');
        if (pSub) pool.push(pSub);
        npcAlbums.filter(a => {
           const npc = NPC_ARTISTS.find(n => n.name === a.artist);
           return npc?.type === 'Country';
        }).forEach(a => pool.push({ id: a.id, title: a.title, artist: a.artist, isPlayer: false, type: 'Album' }));
        break;
      }
    }

    // Rank the pool and take top 5, but limit Player to exactly 1
    // Valuation function - strict
    const getValuation = (nom: GrammysNominee) => {
       if (nom.isPlayer) {
          const release = gameState.releases.find(r => r.id === nom.id);
          if (nom.type === 'Artist') {
             return gameState.stats.streams / 3000000 + (gameState.artist?.level || 0) * 10;
          }
          if (release) {
             const streams = typeof release.streams === 'number' ? release.streams : (release.streams as any).total;
             const quality = (release as any).qualityModifier || 5;
             return (streams / 1200000) + Math.pow(quality, 1.8) * 6; // high quality > sheer streams
          }
       } else {
          const npc = NPC_ARTISTS.find(n => n.name === nom.artist);
          const base = npc?.basePoints || 100000;
          if (nom.type === 'Artist') return base / 1000;
          const npcItem = [...npcSingles, ...npcAlbums].find(i => i.id === nom.id);
          const points = npcItem?.points || 100000;
          // Random quality for NPCs [7-11]
          const quality = 7 + (nom.id.charCodeAt(0) % 5); 
          return (points / 1000) + Math.pow(quality, 1.8) * 6.5; // match player scale roughly but favor npcs more to tighten
       }
       return 0;
    };

    let scoredPool = pool.map(p => ({ ...p, score: getValuation(p) }));
    
    // Enforce 1 max Player nomination per category
    const playerNoms = scoredPool.filter(p => p.isPlayer).sort((a, b) => b.score - a.score);
    if (playerNoms.length > 1) {
       // Keep the first one, remove the rest from scoredPool
       const disallowedIds = new Set(playerNoms.slice(1).map(p => p.id));
       scoredPool = scoredPool.filter(p => !disallowedIds.has(p.id));
    }

    const nominees = scoredPool
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score, ...rest }: any) => rest);

    return {
      category,
      nominees,
      winnerId: null
    };
  });

  return results;
}

export function pickWinner(categoryResult: GrammysCategoryResult, gameState: GameState): string {
  // Winner selection based on tight performance + quality logic
  const nominees = categoryResult.nominees;
  
  const getNomineeFinalScore = (nom: GrammysNominee) => {
     let score = 0;
     if (nom.isPlayer) {
        const release = gameState.releases.find(r => r.id === nom.id);
        if (nom.type === 'Artist') {
           score = (gameState.stats.streams / 40000000) + (gameState.artist?.level || 0) * 10;
        } else if (release) {
           const streams = typeof release.streams === 'number' ? release.streams : (release.streams as any).total;
           const quality = (release as any).qualityModifier || 5;
           // Quality provides exponential benefits to winning, tighter now
           score = (streams / 3500000) + Math.pow(quality, 2.1) * 3;
        }
     } else {
        const npc = NPC_ARTISTS.find(n => n.name === nom.artist);
        const base = npc?.basePoints || 100000;
        if (nom.type === 'Artist') {
           score = (base / 5000);
        } else {
           const points = base * 1.5; // abstract "total success"
           const quality = 8 + (nom.id.charCodeAt(0) % 4); // 8 to 11
           score = (points / 15000) + Math.pow(quality, 2.1) * 3;
        }
     }
     
     // Add a bit of "jury randomness", make it sway a lot 
     // (so even mega hits can sometimes lose to highly praised jury darlings)
     const juryRandom = (Math.random() * 40) - 5;
     return score + juryRandom;
  };

  const scored = nominees.map(nom => ({
    id: nom.id,
    finalScore: getNomineeFinalScore(nom)
  }));

  const winner = scored.sort((a, b) => b.finalScore - a.finalScore)[0];
  return winner.id;
}
