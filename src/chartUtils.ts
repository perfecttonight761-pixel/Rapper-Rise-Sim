import { GameState } from './types';
import { generateNPCSongs, generateNPCAlbums } from './constants';

export const computeCharts = (gameState: GameState) => {
    const today = new Date(gameState.time.startDate);
    today.setDate(today.getDate() + gameState.time.daysPassed);
    
    // Simulate updating once a week
    const currentWeekNumber = Math.max(1, Math.floor(gameState.time.daysPassed / 7)); 
    const previousWeekNumber = Math.max(1, currentWeekNumber - 1);

    const currentWeekFluctuation = 1 + (Math.sin(currentWeekNumber / 10) * 0.05);
    const prevWeekFluctuation = 1 + (Math.sin(previousWeekNumber / 10) * 0.05);
    
    const npcSingles = generateNPCSongs(currentWeekFluctuation, currentWeekNumber);
    const npcAlbums = generateNPCAlbums(currentWeekFluctuation, currentWeekNumber);
    const npcSinglesPrev = generateNPCSongs(prevWeekFluctuation, previousWeekNumber);
    const npcAlbumsPrev = generateNPCAlbums(prevWeekFluctuation, previousWeekNumber);

    const publishedReleases = gameState.releases.filter(r => r.status === 'Published' && r.releaseDate);

    const generatePlayerItems = (isPrevWeek: boolean) => {
      return publishedReleases.map(r => {
        // Correctly selection between current week and previous week data
        let weeklyStreams = isPrevWeek ? (r.lastWeekStreams ?? 0) : (r.currentWeekStreams ?? 0);
        let weeklySales = isPrevWeek ? (r.lastWeekSales ?? 0) : (r.currentWeekSales ?? 0);
        let weeklyRadio = isPrevWeek ? (r.lastWeekRadio ?? 0) : (r.currentWeekRadio ?? 0);

        // If it's the current week and we don't have accumulated stats yet (very new release), 
        // fallback to estimating from daily
        if (!isPrevWeek && !r.currentWeekStreams && r.lastDailyStreams?.total) {
             weeklyStreams = r.lastDailyStreams.total * 7;
             weeklySales = r.sales?.total || 0;
             weeklyRadio = r.currentWeekRadio || 0;
        }

        const totalPop = (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) || 1;
        const probAmerica = gameState.popularity.america / totalPop;
        const probLatin = gameState.popularity.latinAmerica / totalPop;
        const probEurope = gameState.popularity.europe / totalPop;

        let basePoints = 0;
        let activity = 0;
        let albums = 0;

        if (r.type === 'Single') {
           basePoints = (weeklyStreams / 250) + (weeklySales * 1.5) + (weeklyRadio / 500);
           activity = (weeklyStreams / 100) + (weeklySales * 1.5) + (weeklyRadio / 100);
           albums = weeklySales;
        } else {
           basePoints = (weeklyStreams / 350) + (weeklySales * 2) + (weeklyRadio / 1000);
           activity = (weeklyStreams / 150) + (weeklySales * 2) + (weeklyRadio / 200);
           albums = weeklySales * 1.2;
        }

        return {
          id: r.id,
          title: r.title,
          artist: gameState.artist?.name || 'You',
          type: r.type,
          isPlayer: true,
          coverImage: r.coverImage,
          points: basePoints,
          computedTotal: basePoints,
          activity,
          albums,
          regionalPoints: {
             america: basePoints * probAmerica * 1.2,
             latinAmerica: basePoints * probLatin * 1.1,
             europe: basePoints * probEurope * 1.1,
             global: basePoints
          }
        };
      });
    };

    const playerItems = generatePlayerItems(false);
    const playerItemsPrev = generatePlayerItems(true);

    const npcItemsObj = (items: any[], weekNum: number) => {
        return items.map((npc) => {
            const isLatin = npc.artist === 'Bad Bunny' || npc.artist === 'J Balvin' || npc.artist === 'Carol G' || npc.artist === 'Rosalia';
            const isKpop = npc.artist === 'BTS (Band)' || npc.artist === 'Blackpink' || npc.artist === 'Stray Kids';
            const isEuro = npc.artist === 'Dua Lip' || npc.artist === 'Ed Sheran' || npc.artist === 'Adeley';
            const isCountry = npc.artist === 'Morgan Walln' || npc.artist === 'Luka Comb' || npc.artist === 'Zach Bryan';
            
            let popAm = isLatin ? 0.2 : isKpop ? 0.3 : isEuro ? 0.3 : isCountry ? 0.9 : 0.6;
            let popLat = isLatin ? 0.8 : isKpop ? 0.2 : isEuro ? 0.1 : isCountry ? 0.05 : 0.2;
            let popEur = isLatin ? 0.2 : isKpop ? 0.3 : isEuro ? 0.8 : isCountry ? 0.05 : 0.4;

            const reEntryHash = (npc.id.charCodeAt(0) + npc.artist.charCodeAt(0) + weekNum) % 15;
            const isReEntry = reEntryHash === 0;

            return {
                id: npc.id,
                title: npc.title,
                artist: npc.artist,
                type: npc.type,
                isPlayer: false,
                coverImage: `https://picsum.photos/seed/${encodeURIComponent(npc.id + npc.artist)}/200/200`,
                points: npc.points,
                computedTotal: npc.points,
                activity: npc.points * 1.2,
                albums: npc.type === 'Album' ? npc.points * 0.35 : 0,
                isReEntrySim: isReEntry,
                regionalPoints: {
                    america: npc.points * popAm,
                    latinAmerica: npc.points * popLat,
                    europe: npc.points * popEur,
                    global: npc.points
                }
            };
        });
    };

    const npcsS = npcItemsObj(npcSingles, currentWeekNumber);
    const npcsA = npcItemsObj(npcAlbums, currentWeekNumber);
    const npcsSPrev = npcItemsObj(npcSinglesPrev, previousWeekNumber);
    const npcsAPrev = npcItemsObj(npcAlbumsPrev, previousWeekNumber);

    const getFullCharts = (pItems: any[], nS: any[], nA: any[]) => {
       const allS = [...pItems.filter((p: any) => p.type === 'Single'), ...nS];
       const allA = [...pItems.filter((p: any) => p.type === 'Album'), ...nA];
       return {
          Hot100: [...allS].sort((a,b) => b.regionalPoints.america - a.regionalPoints.america).slice(0, 100),
          Global200Single: [...allS].sort((a,b) => b.regionalPoints.global - a.regionalPoints.global).slice(0, 200),
          Global200Album: [...allA].sort((a,b) => b.regionalPoints.global - a.regionalPoints.global).slice(0, 200),
          RegionAmerica: [...allS].sort((a,b) => b.regionalPoints.america - a.regionalPoints.america).slice(0, 100),
          RegionLatinAmerica: [...allS].sort((a,b) => b.regionalPoints.latinAmerica - a.regionalPoints.latinAmerica).slice(0, 100),
          RegionEurope: [...allS].sort((a,b) => b.regionalPoints.europe - a.regionalPoints.europe).slice(0, 100),
       };
    };

    const currentCharts = getFullCharts(playerItems, npcsS, npcsA);
    const previousCharts = getFullCharts(playerItemsPrev, npcsSPrev, npcsAPrev);

    const chartsWithMovement: Record<keyof ReturnType<typeof getFullCharts>, any[]> = {} as any;
    
    (Object.keys(currentCharts) as Array<keyof ReturnType<typeof getFullCharts>>).forEach(chartKey => {
       const currList = currentCharts[chartKey];
       const prevList = previousCharts[chartKey];
       const chartLimit = chartKey.includes('200') ? 200 : 100;
       
       chartsWithMovement[chartKey] = currList.map((item, index) => {
          const prevIndex = prevList.findIndex((p: any) => p.id === item.id);
          let movement = 0; 
          let isNew = false;
          
          if (prevIndex === -1) {
             isNew = true;
          } else {
             movement = prevIndex - index;
          }

          const hashStr = item.id + item.title;
          let hash = 0;
          for(let i = 0; i < hashStr.length; i++) hash = Math.imul(31, hash) + hashStr.charCodeAt(i) | 0;
          const randomWeekVal = Math.abs(hash % 20) + 1;
          const randomPeakOffset = Math.abs(hash % 8);

          // If tracking week is exactly the same (daysPassed < 7), all is "NEW" or same as baseline
          // But to make it feel alive, we use currentWeekNumber to increment years/weeks
          const wks = isNew ? 1 : (randomWeekVal + currentWeekNumber);
          const pPeak = isNew ? (index + 1) : Math.max(1, Math.min(index + 1, Math.abs(hash % 10) + 1));

          return { 
            ...item, 
            movement, 
            isNew, 
            isReEntry: isNew ? (!!item.isReEntrySim) : false, 
            lastPos: prevIndex !== -1 ? (prevIndex + 1 > chartLimit ? 'NEW' : prevIndex + 1) : 'NEW',
            peak: isNew ? (index + 1) : pPeak, 
            weeksOnChart: wks,
            peakPos: pPeak
          };
       });
    });

    return { charts: chartsWithMovement, today };
};
