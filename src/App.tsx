import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Search, Upload, User, Image as ImageIcon, MapPin, Music, DollarSign, Calendar as CalendarIcon, Award, Activity, Menu, Save, Loader2, Mic, Disc, Zap, Globe, Ticket, Settings as SettingsIcon, Trophy, BarChart3 } from 'lucide-react';
import { GameState, GameScreen, StartCapital, DailyReportData, Song, Album, Gig } from './types';
import { LEVEL_REQUIREMENTS, NPC_ARTISTS } from './constants';
import { generateNominees, pickWinner } from './grammyUtils';
import { DashboardView } from './components/DashboardView';
import { StudioView } from './components/StudioView';
import { DiscographyView } from './components/DiscographyView';
import { SkillsView } from './components/SkillsView';
import { RegionPopularityView } from './components/RegionPopularityView';
import { GigsView } from './components/GigsView';
import { PlatformsView } from './components/PlatformsView';
import { ChartsView } from './components/ChartsView';
import { XView } from './components/XView';
import { GoogleView } from './components/GoogleView';
import { YouTubeView } from './components/YouTubeView';
import { SettingsView } from './components/SettingsView';
import { PlaquesView } from './components/PlaquesView';
import { GrammysView } from './components/GrammysView';

const INITIAL_DATE = "2024-01-01T00:00:00.000Z";
const STARTING_AGE_YEARS = 18;
const CAPITAL_MAP: Record<StartCapital, number> = {
  'Broke ($0)': 0,
  'Low ($1,000)': 1000,
  'Medium ($10,000)': 10000,
  'High ($100,000)': 100000,
};

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [isLoadingNextDay, setIsLoadingNextDay] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  useEffect(() => {
    // Stop auto advancing if we navigate away from dashboard
    if (screen !== 'dashboard') {
      setIsAutoAdvancing(false);
    }
  }, [screen]);

  useEffect(() => {
    if (isAutoAdvancing && !isLoadingNextDay && screen === 'dashboard') {
      const timer = setTimeout(() => {
        handleNextDay();
      }, 50); // Small interval between auto skips
      return () => clearTimeout(timer);
    }
  }, [isAutoAdvancing, isLoadingNextDay, screen]);

  // --- Handlers ---

  const handleStartNew = () => {
    setScreen('create');
  };

  const handleLoadSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.version) {
            setGameState(json);
            setScreen('dashboard');
          } else {
            alert("Invalid save file format!");
          }
        } catch (err) {
          alert("Error parsing save file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveGame = () => {
    if (!gameState) return;
    const blob = new Blob([JSON.stringify(gameState)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `musician_simulator_${gameState.artist?.name.replace(/\s+/g, '_')}_save.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNextDay = () => {
    if (!gameState || isLoadingNextDay) return;
    setIsLoadingNextDay(true);

    const isAutoSkip = isAutoAdvancing;

    // Use a very short timeout for auto-advance, otherwise use the normal simulation delay
    setTimeout(() => {
      let dailyStreams = 0;
      let dailySales = 0;
      let revenue = 0;
      let topSong: string | null = null;
      let topAlbum: string | null = null;
      let maxSongStreams = -1;
      let maxAlbumStreams = -1;

      const currentDateObj = new Date(gameState.time.startDate);
      currentDateObj.setDate(currentDateObj.getDate() + gameState.time.daysPassed + 1);

      const artistLevel = gameState.artist?.level || 0;
      const levelMultiplier = 1 + (artistLevel * 0.4); // max ~ 5 at level 10, ~40 at level 99

      const prodSkill = (gameState.skills.production || 1) / 100;
      const vocalSkill = (gameState.skills.vocals || 1) / 100;
      const swSkill = (gameState.skills.songwriting || 1) / 100;
      const perfSkill = (gameState.skills.performance || 1) / 100;

      let workingReleases = [...(gameState.releases || [])];
      const newlyPublishedAlbumIds = new Set<string>();

      // First pass: trigger Scheduled to Published
      workingReleases = workingReleases.map(r => {
        if (r.status === 'Scheduled' && r.releaseDate && new Date(r.releaseDate) <= currentDateObj) {
           if (r.type === 'Album') newlyPublishedAlbumIds.add((r as Album).id);
           return { ...r, status: 'Published' };
        }
        return r;
      });

      // Find all tracks in Published albums
      const publishedAlbumTracks = new Map<string, string>(); // trackId -> albumReleaseDate
      workingReleases.forEach(r => {
         if (r.type === 'Album' && r.status === 'Published' && r.releaseDate) {
            (r as Album).trackIds.forEach(id => publishedAlbumTracks.set(id, r.releaseDate!));
         }
      });

      // Second pass: publish tracks belonging to newly/already published albums
      workingReleases = workingReleases.map(r => {
         if (r.type === 'Single' && r.status !== 'Published' && publishedAlbumTracks.has(r.id)) {
            // It's a B-Side that hasn't been individually published
            return { 
                ...r, 
                status: 'Published', 
                releaseDate: publishedAlbumTracks.get(r.id) || currentDateObj.toISOString(), 
                isBSide: true 
            } as Song;
         }
         return r;
      });

      const updatedReleases = workingReleases.map(release => {
        let currentStatus = release.status;

        if (currentStatus === 'Published') {
            const isSong = release.type === 'Single';
            const genreMultiplier = isSong 
              ? 1 + ((gameState.skills[(release as Song).genre.toLowerCase() as keyof GameState['skills']] || 10) / 100)
              : 1.2; // Max 2.0

            const totalPop = gameState.popularity ? (gameState.popularity.america + gameState.popularity.latinAmerica + gameState.popularity.europe) : 0;
            const popBoost = 1 + (totalPop / 40); // Max 8.5
            
            const qualityMod = isSong ? ((release as Song).qualityModifier || 1) : 2; // Typically 1 to 4

            // Hit Factor (Deterministic per-song based on title)
            const hash = release.title ? release.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
            const baseHitFactor = (hash % 100) / 100;
            
            // Trend Factor: Shift probabilities based on level, popularity, and quality.
            // Max shift around +0.20 for top tier players.
            let trendShift = ((artistLevel / 10) * 0.05) + ((popBoost / 8.5) * 0.10) + ((qualityMod / 4) * 0.05);
            
            // User requested Level 10 singles to be significantly easier to Hit (but not necessarily Mega Hit)
            if (isSong && artistLevel >= 10) {
               trendShift += 0.25; // Significant boost to reach the "Hit" threshold (0.85)
            }

            const intrinsicHitFactor = Math.min(0.99, baseHitFactor + trendShift);
            
            // Introduce more variance for normal songs so they don't all get the same streams
            let hitMultiplier = 0.4 + (intrinsicHitFactor * 0.8); // 0.4 to 1.2 for normal songs
            let currentTrend: 'Flop' | 'Non-Hit' | 'Hit' | 'Mega Hit' = 'Non-Hit';

            if (intrinsicHitFactor > 0.95) {
                hitMultiplier = 3.5 + (intrinsicHitFactor * 2); // Massive hit
                currentTrend = 'Mega Hit';
            } else if (intrinsicHitFactor > 0.85) {
                hitMultiplier = 2.0 + (intrinsicHitFactor); // Big hit
                currentTrend = 'Hit';
            } else if (intrinsicHitFactor < 0.15) {
                hitMultiplier = 0.2 + (intrinsicHitFactor); // Flop
                currentTrend = 'Flop';
            }

            let isBSide = false;
            if (isSong && (release as Song).isBSide) {
               isBSide = true;
               
               const bSideViralChance = (hash % 100) / 100; // 0 to 0.99
               // Nerf: Only ~10% chance for a B-side to remain a Mega Hit, and ~20% for a Hit
               if (intrinsicHitFactor > 0.95 && bSideViralChance > 0.90) {
                   hitMultiplier = 3.5 + (intrinsicHitFactor * 2); 
                   currentTrend = 'Mega Hit';
               } else if (intrinsicHitFactor > 0.85 && bSideViralChance > 0.80) {
                   hitMultiplier = 2.0 + (intrinsicHitFactor); 
                   currentTrend = 'Hit';
               } else if (intrinsicHitFactor < 0.15) {
                   hitMultiplier = 0.2 * 0.15;
                   currentTrend = 'Flop';
               } else {
                   hitMultiplier *= 0.15; // Normal B-side nerf
                   currentTrend = 'Non-Hit';
               }
            }

            const hitLongevity = Math.max(1, hitMultiplier);
            const longevityMultiplier = (qualityMod * 0.5) + (artistLevel * 0.15) + (hitLongevity * 0.5); // Usually 1.5 to ~5

            const daysSinceRelease = release.releaseDate ? Math.max(0, Math.floor((currentDateObj.getTime() - new Date(release.releaseDate).getTime()) / (1000 * 3600 * 24))) : 0;

            // --- DECAY LOGIC REFINED ---
            // 1. Initial Hype (Steep drop-off in the first 2-4 weeks)
            const initialHypeHalfLife = 10 + (longevityMultiplier * 2); // e.g. 13 to 20 days
            let initialHypeCurve = Math.exp(-daysSinceRelease / initialHypeHalfLife);
            
            // 2. Secondary Run (Slower decay for the next few months)
            const secondaryHalfLife = 45 + (longevityMultiplier * 10); // e.g. 60 to 95 days
            let secondaryCurve = 0.4 * Math.exp(-daysSinceRelease / secondaryHalfLife);
            
            // Mass Streaming Debut Boost (Fanbase Power)
            // Fanbase streams massive numbers in the first week, especially first 3 days, irrespective of trend.
            if (daysSinceRelease <= 7) {
               // Max fandomPower ~33 at level 99 and 100% popularity in all regions
               const fandomPower = 1 + (popBoost / 1.2) + (artistLevel / 4);
               // Smooth curve dropping from 1.0 to close to 0 over a week
               const debutCurve = Math.exp(-(daysSinceRelease * daysSinceRelease) / 10); 
               
               let debutMultiplier = fandomPower * debutCurve;
               if (isBSide && currentTrend !== 'Mega Hit' && currentTrend !== 'Hit') {
                   // B-sides get a smaller debut push
                   debutMultiplier *= 0.4;
               }
               initialHypeCurve *= Math.max(1, debutMultiplier);
            }
            
            // 3. Catalog Tail (Slow burn)
            // Reduced to prevent old songs from being too overpowered
            const tailHalfLife = (150 + (artistLevel * 20)) * longevityMultiplier; 
            const catalogBase = isBSide && (currentTrend === 'Non-Hit' || currentTrend === 'Flop') ? 0.002 : 0.015; 
            const tailCurve = catalogBase * Math.exp(-daysSinceRelease / tailHalfLife);
            
            let decayFactor = initialHypeCurve + secondaryCurve + tailCurve;

            // --- STABILITY FLOOR (The "Legacy Effect") ---
            // Prevents massive artists from dropping to zero, giving a realistic floor
            let floorPercentage = artistLevel >= 10 ? 0.015 + (intrinsicHitFactor * 0.015) : (artistLevel * 0.0015); 
            
            // Significant Nerf for B-Sides: Very low floor unless it's a hit
            if (isBSide && (currentTrend === 'Non-Hit' || currentTrend === 'Flop')) {
                floorPercentage *= 0.15; // Raised from 0.02 to avoid dropping to hundreds of streams
            }

            decayFactor = Math.max(floorPercentage, decayFactor);

            // Radio logic ... remains but with higher longevity
            const peakRadioDay = 30 + (intrinsicHitFactor * 50); // Peaks slightly later and stays longer
            const radioWidth = 45 + (hitLongevity * 15);
            
            const distance = Math.abs(daysSinceRelease - peakRadioDay);
            const radioCurve = Math.exp(-(distance * distance) / (radioWidth * radioWidth));
            
            const radioMaxHit = hitMultiplier * qualityMod * (1 + artistLevel * 0.2);
            let dailyRadio = (isBSide && (currentTrend === 'Non-Hit' || currentTrend === 'Flop'))
                ? 0 // Normal B-sides get no radio
                : Math.floor(radioCurve * radioMaxHit * 15 * popBoost * (Math.random() * 0.4 + 0.8));

            // Recurrent Radio (Catalog play after peak)
            if (daysSinceRelease > peakRadioDay && dailyRadio < (radioMaxHit * 2)) {
               const recurrentFactor = (hitMultiplier > 2 ? 0.05 : 0.01) * radioMaxHit * popBoost;
               dailyRadio = Math.max(dailyRadio, Math.floor(recurrentFactor * (Math.random() * 0.5 + 0.7)));
            }

            const oldTotalRadio = typeof release.radioPlays === 'number' ? release.radioPlays : 0;
            const updatedRadio = oldTotalRadio + dailyRadio;
            const radioBoost = 1 + (Math.log10(dailyRadio + 1) * 0.8); // Slightly smoother boost

            // Smooth daily fluctuations & Weekend boost
            const fluctuationSeed = (daysSinceRelease + hash) % 10;
            const smoothFluctuation = 0.95 + (Math.sin(fluctuationSeed) * 0.05); // +/- 5% wobble
            const isWeekend = currentDateObj.getDay() === 0 || currentDateObj.getDay() === 6;
            const weekendBoost = isWeekend ? 1.05 : 1.0;
            
            let featBoost = 1;
            if (isSong && (release as Song).featuredArtistCost) {
                const fCost = (release as Song).featuredArtistCost || 0;
                featBoost += Math.log10(fCost / 500 + 1) * 0.6;
            }
            
            // Streams logic
            const baseStreams = ((hash % 16000) + 4000) + (Math.random() * 8000); // 4k to 28k base with randomization
            
            let rawStreamsTotal = baseStreams * 
                Math.pow(qualityMod, 1.4) *  // max ~7
                genreMultiplier *            // max 2
                popBoost *                   // max 8.5
                levelMultiplier *            // max ~5 at level 10
                hitMultiplier *              // max 4.5
                featBoost *                  // boost from featured artist
                (1 + (prodSkill + vocalSkill + swSkill)/3) * // max 2
                (1 + radioBoost * 0.15) *     // radio adds up
                decayFactor *                
                smoothFluctuation *
                weekendBoost;

            if (!isSong) {
                // Albums themselves don't generate massive standalone "pseudo streams" because the sum of tracks usually defines it.
                // But for gameplay simplicity on the backend, we assign the album a "bundled stream value" that is roughly sum of tracks.
                // We assume an album has ~10 tracks. Lead single (1x), B-sides (9 * 0.15 = 1.35x). Total = 2.35x of a single.
                rawStreamsTotal *= 2.35;
            }

            // Apply global softcap log function if streams get into astronomical ranges for some reason (God Mode)
            if (rawStreamsTotal > 15000000) {
                 rawStreamsTotal = 15000000 + Math.pow(rawStreamsTotal - 15000000, 0.65); 
            }
            
            let dStreamsTotal = Math.floor(rawStreamsTotal);

            // Occasional viral spike (0.5% chance per day after day 10)
            if (daysSinceRelease > 10 && Math.random() < 0.005) {
                dStreamsTotal = Math.floor(dStreamsTotal * 4); // single day viral boost
            }

            // Sales logic based on contemporary industry standards where sales are a fraction of stream engagement
            const digitalSaleRate = isSong ? 0.0002 : 0.0015; // e.g. 20M streams -> 4k single sales. 10M album streams -> 15k digital album sales
            const physicalSaleRate = isSong ? 0.00005 : 0.003; 
            
            const newDigitalSales = Math.floor(dStreamsTotal * digitalSaleRate * qualityMod * (isWeekend ? 1.2 : 0.9) * (1 + (hash%20)/100)); // slight variance
            const newPhysicalSales = Math.floor(dStreamsTotal * physicalSaleRate * qualityMod * Math.max(0.5, (gameState.popularity?.america || 10)/50) * (1 + (hash%30)/100));
            
            const totalNewSales = newDigitalSales + newPhysicalSales;
            dailySales += totalNewSales;
            const salesRev = (newDigitalSales * 0.99 + newPhysicalSales * (isSong ? 4.99 : 14.99)) * 0.25; // 25% artist cut
            const streamingRev = dStreamsTotal * 0.00007; // Extra hard payout: $0.00007 per stream (100k streams = $7)
            
            revenue += salesRev + streamingRev;
            
            // Occasional viral spike (1% chance per day)
            // (Moved to top before dStreamsTotal calculation)
            dailyStreams += dStreamsTotal;

            if (release.type === 'Single' && dStreamsTotal > maxSongStreams) {
                maxSongStreams = dStreamsTotal;
                topSong = release.title;
            } else if (release.type === 'Album' && dStreamsTotal > maxAlbumStreams) {
                maxAlbumStreams = dStreamsTotal;
                topAlbum = release.title;
            }
            
            const oldTotal = typeof release.streams === 'number' ? release.streams : (release.streams?.total || 0);
            const oldSpotify = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.4) : (release.streams?.spotify || 0);
            const oldApple = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.25) : (release.streams?.appleMusic || 0);
            const oldAmazon = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.25) : (release.streams?.amazonMusic || 0);
            const oldYoutube = typeof release.streams === 'number' ? Math.floor(oldTotal * 0.1) : (release.streams?.youtubeMusic || 0);

            const oldPhysical = release.sales?.physical || 0;
            const oldDigital = release.sales?.digital || 0;
            const oldTotalSales = release.sales?.total || 0;

            // Dynamic Platform Splitting (Per-song base with daily random jitter)
            // Create strong bias per song so Lagu A leans Spotify, Lagu B leans Apple Music
            const spBase = 0.25 + ((hash % 30) / 100); // 25% - 54%
            const apBase = 0.15 + (((hash * 7) % 25) / 100); // 15% - 39%
            const amBase = 0.10 + (((hash * 13) % 20) / 100); // 10% - 29%
            
            // Add daily random noise so it doesn't stay perfectly mathematically correlated
            const spPerc = Math.max(0.1, spBase + (Math.random() * 0.08 - 0.04));
            const apPerc = Math.max(0.05, apBase + (Math.random() * 0.06 - 0.03));
            const amPerc = Math.max(0.05, amBase + (Math.random() * 0.06 - 0.03));
            
            const totalPerc = spPerc + apPerc + amPerc;
            // Leave ~5-15% for YouTube
            const targetTotal = Math.max(0.85, 1.0 - (Math.random() * 0.1 + 0.05));
            const sf = targetTotal / totalPerc;
            
            const sp = Math.floor(dStreamsTotal * spPerc * sf);
            const ap = Math.floor(dStreamsTotal * apPerc * sf);
            const am = Math.floor(dStreamsTotal * amPerc * sf);
            const yt = Math.max(0, dStreamsTotal - sp - ap - am);

            let newCurrentWeekStreams = release.currentWeekStreams || 0;
            let newLastWeekStreams = release.lastWeekStreams || 0;
            let newCurrentWeekSales = release.currentWeekSales || 0;
            let newLastWeekSales = release.lastWeekSales || 0;
            let newCurrentWeekRadio = release.currentWeekRadio || 0;
            let newLastWeekRadio = release.lastWeekRadio || 0;
            
            // Provide a starting point if it just released
            if (daysSinceRelease === 0) {
               newLastWeekStreams = dStreamsTotal * 7; 
               newLastWeekSales = totalNewSales * 7;
               newLastWeekRadio = dailyRadio * 7;
            }

            // If it's chart reset day (e.g. tracking week ends)
            // gameState.time.daysPassed represents the day that just happened. If it's a multiple of 7, 
            // a week has concluded. We push the accumulated current week to last week BEFORE adding today's streams.
            if (gameState.time.daysPassed > 0 && gameState.time.daysPassed % 7 === 0) {
                 newLastWeekStreams = newCurrentWeekStreams; 
                 newCurrentWeekStreams = 0; 
                 
                 newLastWeekSales = newCurrentWeekSales;
                 newCurrentWeekSales = 0;

                 newLastWeekRadio = newCurrentWeekRadio;
                 newCurrentWeekRadio = 0;
            }
            
            newCurrentWeekStreams += dStreamsTotal;
            newCurrentWeekSales += totalNewSales;
            newCurrentWeekRadio += dailyRadio;

            return {
              ...release,
              trend: currentTrend,
              status: currentStatus,
              radioPlays: updatedRadio,
              debutStreams: daysSinceRelease === 0 ? dStreamsTotal : release.debutStreams,
              sales: {
                physical: oldPhysical + newPhysicalSales,
                digital: oldDigital + newDigitalSales,
                total: oldTotalSales + totalNewSales
              },
              lastDailyStreams: {
                spotify: sp,
                youtubeMusic: yt,
                total: dStreamsTotal
              },
              currentWeekStreams: newCurrentWeekStreams,
              lastWeekStreams: newLastWeekStreams,
              currentWeekSales: newCurrentWeekSales,
              lastWeekSales: newLastWeekSales,
              currentWeekRadio: newCurrentWeekRadio,
              lastWeekRadio: newLastWeekRadio,
              streams: {
                spotify: oldSpotify + sp,
                appleMusic: oldApple + ap,
                amazonMusic: oldAmazon + am,
                youtubeMusic: oldYoutube + yt,
                total: oldTotal + dStreamsTotal
              }
            };
        }

        return {
           ...release,
           status: currentStatus
        };
      });

      let gigPayouts = 0;
      let newAmériquePop = gameState.popularity?.america || 0;
      let newLatinPop = gameState.popularity?.latinAmerica || 0;
      let newEuropePop = gameState.popularity?.europe || 0;
      
      const updatedGigs = (gameState.gigs || []).map(gig => {
        if (!gig.completed && new Date(gig.date) <= currentDateObj) {
           gigPayouts += gig.payout;
           if (gig.region === 'America') newAmériquePop = Math.min(100, newAmériquePop + gig.popularityGain);
           else if (gig.region === 'Latin America') newLatinPop = Math.min(100, newLatinPop + gig.popularityGain);
           else if (gig.region === 'Europe') newEuropePop = Math.min(100, newEuropePop + gig.popularityGain);
           return { ...gig, completed: true };
        }
        return gig;
      });

      revenue += gigPayouts; // Streaming revenue was already added per-release above

      let dailyYoutubeViews = 0;
      const updatedVideos = (gameState.videos || []).map(video => {
         const linkedSong = updatedReleases.find(r => r.id === video.songId) as Song;
         let ytDaily = 0;
         const daysSincePublished = Math.max(0, Math.floor((currentDateObj.getTime() - new Date(video.publishDate).getTime()) / (1000 * 3600 * 24)));
         
         if (linkedSong) {
            const baseYTStreams = linkedSong.lastDailyStreams?.youtubeMusic || 0;
            const budgetBoost = 1 + (Math.log10(Math.max(1, (video.budget || 5000) / 1000))) * 0.2;
            
            let mvHype = 1.0;
            if (daysSincePublished < 14) {
               mvHype = 3.0 - (daysSincePublished * 0.15); // Starts high, decays
            } else {
               mvHype = 0.5 + Math.exp(-daysSincePublished / 60);
            }
            ytDaily = Math.floor(baseYTStreams * 2.5 * budgetBoost * mvHype); 
         } else {
             ytDaily = Math.floor(2000 * Math.exp(-daysSincePublished / 20));
         }

         ytDaily = Math.floor(ytDaily * (0.8 + Math.random() * 0.4));
         if (ytDaily < 0) ytDaily = 0;
         dailyYoutubeViews += ytDaily;
         
         return {
            ...video,
            views: (video.views || 0) + ytDaily
         };
      });

      const ytSubscriberGain = Math.floor(dailyYoutubeViews * 0.005 * (0.5 + Math.random()));
      const globalPop = newAmériquePop + newLatinPop + newEuropePop;
      const baseFollowerGain = (globalPop * 10) + Math.floor(dailyStreams * 0.002);
      const socialFollowerGain = Math.floor(baseFollowerGain * (0.8 + Math.random() * 0.4));

      setGameState(prev => {
        if (!prev) return prev;
        
        const nextDaysPassed = prev.time.daysPassed + 1;
        const reachedNextWeek = nextDaysPassed % 7 === 0;
        
        // Level Up Logic
        let currentLvl = prev.artist?.level || 0;
        
        const nextStreams = prev.stats.streams + dailyStreams;
        const nextSales = (prev.stats.sales || 0) + dailySales;
        const completedGigsCount = updatedGigs.filter(g => g.completed).length;

        while (currentLvl < 10) {
           const req = LEVEL_REQUIREMENTS[currentLvl + 1];
           if (!req) break;
           
           if (
              completedGigsCount >= req.gigs &&
              prev.skills.performance >= req.performance &&
              prev.skills.vocals >= req.vocals &&
              prev.skills.songwriting >= req.songwriting &&
              prev.skills.production >= req.production &&
              nextStreams >= req.streams &&
              nextSales >= req.sales
           ) {
              currentLvl++;
           } else {
              break;
           }
        }

        const currentGrammys = prev.grammys || { 
          year: currentDateObj.getFullYear(), 
          stage: 'Closed' as const, 
          submissions: [], 
          results: [] 
        };
        let nextGrammys = { ...currentGrammys };

        const month = currentDateObj.getMonth(); // 0 = Jan
        const day = currentDateObj.getDate();

        if (month === 0) {
           nextGrammys.stage = 'Submission';
        } else if (month === 1) {
           if (day < 15) {
              if (nextGrammys.stage === 'Submission' || nextGrammys.stage === 'Closed') {
                 nextGrammys.stage = 'Nominations';
                 // Generate nominees if they don't exist for this year
                 if (nextGrammys.results.length === 0) {
                    nextGrammys.results = generateNominees(prev, nextGrammys.year);
                 }
              }
           } else {
              if (nextGrammys.stage === 'Nominations') {
                 nextGrammys.stage = 'Ceremony';
                 // Pick winners
                 nextGrammys.results = nextGrammys.results.map(cat => ({
                    ...cat,
                    winnerId: pickWinner(cat, prev)
                 }));
                 
                 // Update total awards count if player won
                 const playerWins = nextGrammys.results.filter(cat => {
                    const winnerNominee = cat.nominees.find(n => n.id === cat.winnerId);
                    return winnerNominee?.isPlayer;
                 }).length;
                 
                 if (playerWins > 0) {
                    // We increment stats.awards in the next section
                 }
              }
           }
        } else if (month === 2) {
           nextGrammys.stage = 'Results';
        } else {
           if (nextGrammys.stage === 'Results') {
              // Save player nominations to history before resetting
              const playerNominationsThisYear: any[] = [];
              currentGrammys.results.forEach(cat => {
                 const playerNom = cat.nominees.find(n => n.isPlayer);
                 if (playerNom) {
                    playerNominationsThisYear.push({
                       category: cat.category,
                       nominee: playerNom,
                       won: cat.winnerId === playerNom.id
                    });
                 }
              });

              let nextHistory = currentGrammys.history ? [...currentGrammys.history] : [];
              if (playerNominationsThisYear.length > 0) {
                 nextHistory.push({
                    year: currentGrammys.year,
                    nominations: playerNominationsThisYear
                 });
              }

              nextGrammys = {
                year: currentDateObj.getFullYear() + 1,
                stage: 'Closed',
                submissions: [],
                results: [],
                history: nextHistory
              };
           }
        }

        // Count player wins to update stats
        let totalPlayerWinsAtCeremony = 0;
        let newCustomTweets = [...(prev.artist?.socialProfile?.customTweets || [])];
        if (currentGrammys.stage === 'Nominations' && nextGrammys.stage === 'Ceremony') {
           const winningCats = nextGrammys.results.filter(cat => {
              const winnerNominee = cat.nominees.find(n => n.id === cat.winnerId);
              return winnerNominee?.isPlayer;
           });
           totalPlayerWinsAtCeremony = winningCats.length;
           
           if (totalPlayerWinsAtCeremony > 0) {
              const categoriesStr = winningCats.map(c => c.category).join(", ");
              newCustomTweets = [{
                 id: `grammy-win-${nextGrammys.year}`,
                 content: `I JUST WON ${totalPlayerWinsAtCeremony} GRAMMYs! (${categoriesStr}). Thank you so much to all my fans and the Academy! 🏆✨ #Grammys`,
                 date: nextDaysPassed,
                 likes: 120000 + (totalPlayerWinsAtCeremony * 40000),
                 retweets: 45000 + (totalPlayerWinsAtCeremony * 15000),
                 replies: 8000,
                 mediaUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop'
              }, ...newCustomTweets];
           }
        }

        return {
          ...prev,
          artist: prev.artist ? { 
            ...prev.artist, 
            level: currentLvl,
            socialProfile: prev.artist.socialProfile ? {
              ...prev.artist.socialProfile,
              customTweets: newCustomTweets
            } : prev.artist.socialProfile
          } : null,
          popularity: {
             america: newAmériquePop,
             latinAmerica: newLatinPop,
             europe: newEuropePop
          },
          stats: {
            ...prev.stats,
            money: prev.stats.money + revenue,
            streams: prev.stats.streams + dailyStreams,
            sales: (prev.stats.sales || 0) + dailySales,
            awards: prev.stats.awards + totalPlayerWinsAtCeremony,
            ageInDays: prev.stats.ageInDays + 1,
            skillPoints: prev.stats.skillPoints + (reachedNextWeek ? 250 : 0),
            youtubeSubscribers: Math.floor((prev.stats.youtubeSubscribers || 0) + ytSubscriberGain),
            socialFollowers: Math.floor((prev.stats.socialFollowers || 0) + socialFollowerGain)
          },
          time: {
            ...prev.time,
            daysPassed: nextDaysPassed
          },
          releases: updatedReleases,
          gigs: updatedGigs,
          videos: updatedVideos,
          grammys: nextGrammys
        };
      });

      // Do not show the daily report popup if auto-advancing
      if (!isAutoSkip) {
        setDailyReport({
          dailyStreams,
          dailySales,
          revenue,
          topSong,
          topAlbum
        });
      }
      setIsLoadingNextDay(false);
    }, isAutoSkip ? 100 : 1500); 
  };

  const handleCreateArtist = (artistData: GameState['artist']) => {
    if (!artistData) return;
    const initialMoney = CAPITAL_MAP[artistData.capital];
    
    setGameState({
      version: 1,
      artist: {
        ...artistData,
        level: 0
      },
      stats: {
        money: initialMoney,
        ageInDays: 0,
        streams: 0,
        sales: 0,
        awards: 0,
        skillPoints: 0
      },
      skills: {
        performance: 10,
        production: 10,
        songwriting: 10,
        vocals: 10,
        pop: 10,
        kpop: 10,
        rap: 10,
        country: 10
      },
      popularity: {
        america: 0,
        latinAmerica: 0,
        europe: 0
      },
      time: {
        startDate: INITIAL_DATE,
        daysPassed: 0
      },
      releases: [],
      gigs: [],
      grammys: {
        year: new Date(INITIAL_DATE).getFullYear() + 1,
        stage: 'Closed',
        submissions: [],
        results: []
      }
    });
    setScreen('dashboard');
  };

  // --- Calculations ---
  
  const getCurrentDate = () => {
    if (!gameState) return new Date();
    const d = new Date(gameState.time.startDate);
    d.setDate(d.getDate() + gameState.time.daysPassed);
    return d;
  };

  const currentAgeYears = gameState ? Math.floor(STARTING_AGE_YEARS + (gameState.stats.ageInDays / 365.25)) : 18;

  // --- Screens ---

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10 text-center w-full max-w-xl">
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
               <div className="relative w-28 h-28 bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl backdrop-blur-xl group">
                 <div className="absolute inset-0 bg-white/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Music className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
               </div>
            </div>
            
            <h1 className="text-6xl sm:text-8xl font-black tracking-[ -0.08em] uppercase text-white mb-4 leading-none">
              MUSICIAN<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">SIMULATOR</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mt-6">
               <div className="h-px w-12 bg-white/10" />
               <p className="text-white/40 font-black tracking-[0.4em] text-[10px] uppercase">Est. 2024 • System v1.4</p>
               <div className="h-px w-12 bg-white/10" />
            </div>
          </div>

          <div className="space-y-4 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <button 
              onClick={handleStartNew}
              className="w-full h-16 flex items-center justify-center gap-4 bg-white text-black hover:bg-white/90 active:scale-95 font-black tracking-widest text-sm rounded-2xl transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Play className="w-5 h-5 fill-current" />
              START LEGACY
            </button>
            <label className="w-full h-16 flex items-center justify-center gap-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-black tracking-widest text-sm rounded-2xl transition-all cursor-pointer group">
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              RELOAD DATA
              <input type="file" accept=".json" className="hidden" onChange={handleLoadSave} />
            </label>
          </div>
        </div>

        <div className="absolute bottom-10 text-[10px] font-black tracking-[0.5em] text-white/20 uppercase animate-pulse">
          Select Operation Mode
        </div>
      </div>
    );
  }

  if (screen === 'create') {
    return <CreateArtistScreen onSubmit={handleCreateArtist} />;
  }

  // Dashboard Screen
  const currentDate = getCurrentDate();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthYearStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dateDayStr = currentDate.toLocaleDateString('en-US', { day: '2-digit' });

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans overflow-hidden relative flex flex-col">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Top Navigation & Stats Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-black/40 backdrop-blur-md border-b border-white/10 gap-4 md:gap-0">
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6">
          {/* Burger Menu (Mobile only toggles sidebar in standard view, but let's keep it functional or visual) */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all md:hidden"
          >
             <span className="text-3xl font-light leading-none">=</span>
          </button>
          <div className="hidden md:flex w-12 h-12 items-center justify-center bg-white/5 border border-white/20 rounded-lg cursor-default">
            <span className="text-3xl font-light leading-none text-white/40">=</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tighter italic text-purple-400">MUSICIAN SIMULATOR</h1>
        </div>

        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto pb-2 md:pb-0">
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Current Balance</span>
            <span className="text-xl md:text-2xl font-mono text-green-400">${gameState?.stats.money.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Artist Age</span>
            <span className="text-xl md:text-2xl font-mono">{currentAgeYears} <span className="text-sm text-white/60">yrs</span></span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] uppercase tracking-widest text-white/40">Total Streams</span>
             <span className="text-xl md:text-2xl font-mono text-blue-400">{gameState?.stats.streams.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 shrink-0"></div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] uppercase tracking-widest text-white/40">Awards</span>
             <span className="text-xl md:text-2xl font-mono text-yellow-500">{gameState?.stats.awards}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 flex flex-col md:grid md:grid-cols-12 gap-6 p-4 md:p-8 overflow-y-auto">
        
        {/* Sidebar / Side Menu Area */}
        <div className={`col-span-3 flex-col gap-4 ${sidebarOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-6">Active View</h3>
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => { setScreen('dashboard'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'dashboard' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => { setScreen('studio'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'studio' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Mic className="w-4 h-4" />
                Create Project
              </button>
              <button 
                onClick={() => { setScreen('discography'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'discography' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Disc className="w-4 h-4" />
                Discography
              </button>
              <button 
                onClick={() => { setScreen('skills'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'skills' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Zap className="w-4 h-4" />
                Skill Tree
              </button>
              <button 
                onClick={() => { setScreen('regions'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'regions' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Globe className="w-4 h-4" />
                Region Popularity
              </button>
              <button 
                onClick={() => { setScreen('gigs'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'gigs' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Ticket className="w-4 h-4" />
                Book Gigs
              </button>
              <button 
                onClick={() => { setScreen('platforms'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'platforms' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className="w-4 h-4" />
                Platforms
              </button>
              <button 
                onClick={() => { setScreen('charts'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'charts' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <BarChart3 className="w-4 h-4" />
                Charts
              </button>
              <button 
                onClick={() => { setScreen('grammys'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'grammys' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Trophy className="w-4 h-4" />
                Grammys
              </button>
              <button 
                onClick={() => { setScreen('plaques'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'plaques' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Award className="w-4 h-4" />
                Plaques
              </button>
              <button 
                onClick={() => { setScreen('google'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'google' ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Search className="w-4 h-4" />
                Web Search
              </button>
              <button 
                onClick={() => { setScreen('youtube'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'youtube' ? 'bg-red-600/20 text-red-200 border border-red-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Play className="w-4 h-4" />
                YouTube
              </button>
              <button 
                onClick={() => { setScreen('x'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'x' ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
                X (Social)
              </button>
              
              <div className="h-px bg-white/10 my-2" />
              
              <button 
                onClick={() => { setScreen('settings'); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${screen === 'settings' ? 'bg-gray-600/20 text-gray-200 border border-gray-500/30' : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings & Redeem
              </button>
            </nav>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mt-auto">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Save Management</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSaveGame} className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-xs uppercase tracking-tighter transition-colors">Download Save</button>
              <label className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-xs uppercase tracking-tighter text-center flex items-center justify-center cursor-pointer transition-colors">
                Load Save
                <input type="file" accept=".json" className="hidden" onChange={handleLoadSave} />
              </label>
            </div>
          </div>
        </div>

        {/* Central Interface */}
        {screen !== 'x' && screen !== 'google' && screen !== 'youtube' && (
          <div className="col-span-9 flex flex-col h-full bg-black/20 border border-white/5 rounded-3xl overflow-hidden relative min-h-[400px]">
             {screen === 'dashboard' && <DashboardView gameState={gameState} setGameState={setGameState} dateDayStr={dateDayStr} dayName={dayName} monthYearStr={monthYearStr} handleNextDay={handleNextDay} isLoadingNextDay={isLoadingNextDay} currentAgeYears={currentAgeYears} isAutoAdvancing={isAutoAdvancing} setIsAutoAdvancing={setIsAutoAdvancing} />}
             {screen === 'studio' && <StudioView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'discography' && <DiscographyView gameState={gameState!} />}
             {screen === 'skills' && <SkillsView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'regions' && <RegionPopularityView gameState={gameState!} />}
             {screen === 'gigs' && <GigsView gameState={gameState!} setGameState={setGameState} currentDate={currentDate} />}
             {screen === 'platforms' && <PlatformsView gameState={gameState!} setGameState={setGameState as any} />}
             {screen === 'charts' && <ChartsView gameState={gameState!} onClose={() => setScreen('dashboard')} />}
             {screen === 'settings' && <SettingsView gameState={gameState!} setGameState={setGameState} />}
             {screen === 'plaques' && <PlaquesView gameState={gameState!} />}
             {screen === 'grammys' && <GrammysView gameState={gameState!} setGameState={setGameState} />}
          </div>
        )}
      </main>

      {screen === 'youtube' && (
        <div className="fixed inset-0 z-[60] bg-black text-white w-full h-full overflow-hidden flex justify-center">
           <YouTubeView gameState={gameState!} setGameState={setGameState} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {screen === 'x' && (
        <div className="fixed inset-0 z-[60] bg-black text-white w-full h-full overflow-hidden flex justify-center">
           <XView gameState={gameState!} setGameState={setGameState} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {screen === 'google' && (
        <div className="fixed inset-0 z-[60] bg-white text-black w-full h-full overflow-hidden flex justify-center">
           <GoogleView gameState={gameState!} onClose={() => setScreen('dashboard')} />
        </div>
      )}

      {/* Loading Overlay (Optional whole page blocker) */}
      {isLoadingNextDay && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                <span className="text-white font-mono text-sm uppercase tracking-widest animate-pulse">Simulating Time...</span>
            </div>
        </div>
      )}



      {/* Daily Report Modal Overlay */}
      {dailyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#050507] border border-white/10 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(192,132,252,0.1)]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>

             <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 mb-6 text-center">DAILY REPORT</h2>

             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Daily Streams</span>
                   <span className="text-2xl font-mono text-blue-400">+{dailyReport.dailyStreams.toLocaleString()}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Daily Sales</span>
                   <span className="text-2xl font-mono text-purple-400">+{dailyReport.dailySales.toLocaleString()}</span>
                </div>
                <div className="col-span-2 lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Revenue</span>
                   <span className="text-2xl font-mono text-green-400">+${dailyReport.revenue.toFixed(2)}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Top Song</span>
                   <span className="text-sm font-medium text-white line-clamp-1">{dailyReport.topSong || 'None'}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                   <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Top Album</span>
                   <span className="text-sm font-medium text-white line-clamp-1">{dailyReport.topAlbum || 'None'}</span>
                </div>
             </div>

             <button 
               onClick={() => setDailyReport(null)}
               className="w-full h-14 bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest text-sm rounded-xl transition-all uppercase"
             >
               Continue
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Create Artist Screen Component ---

function CreateArtistScreen({ onSubmit }: { onSubmit: (data: GameState['artist']) => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [country, setCountry] = useState('United States');
  const [capital, setCapital] = useState<StartCapital>('Medium ($10,000)');
  const [imageContent, setImageContent] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit to 2MB to keep save file reasonable
        alert("Image too large. Please use an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter an artist name.");
    onSubmit({
      name,
      gender,
      country,
      capital,
      level: 1,
      image: imageContent
    });
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-white py-12 relative overflow-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl">
        <div className="p-10">
          <h2 className="text-2xl font-bold tracking-tighter italic text-purple-400 mb-2">ARTIST PROFILE</h2>
          <p className="text-white/40 mb-8 text-sm">Configure the base identity for your simulation.</p>

          <form onSubmit={handleCreate} className="space-y-6">
            
            {/* Image Upload */}
            <div className="flex flex-col items-center mb-8">
              <label className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-black/40 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/10 transition-colors relative group">
                {imageContent ? (
                  <>
                    <img src={imageContent} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                       <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 text-white/40">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Portrait</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Moniker / Artist Name</label>
              <input 
                type="text" 
                maxLength={40}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Lil Code, The Devs"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Gender Identity</label>
                <select 
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all appearance-none font-mono"
                >
                  <option className="bg-zinc-900">Male</option>
                  <option className="bg-zinc-900">Female</option>
                  <option className="bg-zinc-900">Non-Binary</option>
                  <option className="bg-zinc-900">Band / Group</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Origin Country</label>
                <select 
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all appearance-none font-mono"
                >
                  <option className="bg-zinc-900">United States</option>
                  <option className="bg-zinc-900">United Kingdom</option>
                  <option className="bg-zinc-900">Indonesia</option>
                  <option className="bg-zinc-900">South Korea</option>
                  <option className="bg-zinc-900">Japan</option>
                  <option className="bg-zinc-900">Canada</option>
                  <option className="bg-zinc-900">Australia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Starting Capital</label>
              <select 
                value={capital}
                onChange={e => setCapital(e.target.value as StartCapital)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:bg-white/5 transition-all appearance-none font-mono"
              >
                <option value="Broke ($0)" className="bg-zinc-900">Broke ($0) - "Hard Mode"</option>
                <option value="Low ($1,000)" className="bg-zinc-900">Low ($1,000) - "Indie Beginner"</option>
                <option value="Medium ($10,000)" className="bg-zinc-900">Medium ($10,000) - "Trust Fund Kid"</option>
                <option value="High ($100,000)" className="bg-zinc-900">High ($100,000) - "Industry Plant"</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full h-16 mt-6 bg-white text-black font-black text-lg tracking-widest rounded-xl hover:bg-purple-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 uppercase group"
            >
              INITIALIZE <Play className="w-5 h-5 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

