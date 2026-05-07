export type GameScreen = 'home' | 'create' | 'dashboard' | 'studio' | 'discography' | 'skills' | 'regions' | 'gigs' | 'platforms' | 'charts' | 'x' | 'google' | 'settings' | 'youtube' | 'plaques' | 'grammys';

export type AwardCategory = 'Artist of the Year' | 'Song of the Year' | 'Album of the Year' | 'Record of the Year' | 'Best Pop Album' | 'Best Country Album' | 'Best Rap Album';

export interface GrammysNominee {
  id: string; // release ID or artist name for AOTY
  title?: string;
  artist: string;
  isPlayer: boolean;
  type: 'Single' | 'Album' | 'Artist';
}

export interface GrammysCategoryResult {
  category: AwardCategory;
  nominees: GrammysNominee[];
  winnerId: string | null; // ID of the winning release or artist name
}

export interface GrammysHistoricalNomination {
  category: AwardCategory;
  nominee: GrammysNominee;
  won: boolean;
}

export interface GrammysYearHistory {
  year: number;
  nominations: GrammysHistoricalNomination[];
}

export interface GrammySubmission {
  category: AwardCategory;
  workId: string;
}

export interface GrammysState {
  year: number;
  stage: 'Closed' | 'Submission' | 'Nominations' | 'Ceremony' | 'Results';
  submittedReleaseIds?: string[];
  submissions: GrammySubmission[];
  results: GrammysCategoryResult[];
  history?: GrammysYearHistory[];
}

export type StartCapital = 'Broke ($0)' | 'Low ($1,000)' | 'Medium ($10,000)' | 'High ($100,000)';

export type ReleaseType = 'Single' | 'Album';
export type ReleaseStatus = 'Vaulted' | 'Published' | 'Scheduled';
export type Genre = 'Pop' | 'Kpop' | 'Rap' | 'Country';
export type Region = 'America' | 'Latin America' | 'Europe';

export interface Video {
  id: string;
  songId: string;
  title: string;
  type: 'MusicVideo';
  publishDate: string; // ISO string of game date
  views: number;
  budget: number;
  thumbnail?: string;
}

export interface BaseRelease {
  id: string;
  title: string;
  coverImage: string;
  type: ReleaseType;
  status: ReleaseStatus;
  releaseDate: string | null; // ISO string of game date, null if vaulted
  debutStreams?: number;
  lastDailyStreams?: {
    spotify: number;
    youtubeMusic?: number;
    total: number;
  };
  currentWeekStreams?: number;
  lastWeekStreams?: number;
  currentWeekSales?: number;
  lastWeekSales?: number;
  currentWeekRadio?: number;
  lastWeekRadio?: number;
  trend?: 'Flop' | 'Non-Hit' | 'Hit' | 'Mega Hit';
  streams: {
    spotify: number;
    appleMusic: number;
    amazonMusic: number;
    youtubeMusic: number;
    total: number;
  };
  sales: {
    physical: number;
    digital: number;
    total: number;
  };
  radioPlays: number;
}

export interface Song extends BaseRelease {
  type: 'Single';
  genre: Genre;
  collaborator: string;
  featuredArtistCost?: number;
  qualityModifier: number; // Impacted by hired staff
  isBSide?: boolean;
}

export interface Album extends BaseRelease {
  type: 'Album';
  trackIds: string[];
}

export type Release = Song | Album;

export interface Gig {
  id: string;
  name: string;
  region: Region;
  date: string; // ISO string
  cost: number;
  payout: number;
  popularityGain: number;
  completed: boolean;
}

export interface GameState {
  version: number;
  artist: {
    image: string;
    name: string;
    gender: string;
    country: string;
    capital: StartCapital;
    level: number;
    socialProfile?: {
      bio: string;
      bannerUrl: string;
      customTweets?: { id: string; content: string; date: number; likes: number; retweets: number; replies: number; mediaUrl?: string }[];
    };
    spotifyArtistPickId?: string;
  } | null;
  skills: {
    performance: number;
    production: number;
    songwriting: number;
    vocals: number;
    pop: number;
    kpop: number;
    rap: number;
    country: number;
  };
  popularity: {
    america: number;
    latinAmerica: number;
    europe: number;
  };
  stats: {
    money: number;
    ageInDays: number; // 0 means exactly 18 years old
    streams: number;
    sales: number;
    awards: number;
    skillPoints: number;
    youtubeSubscribers?: number;
    socialFollowers?: number;
  };
  time: {
    startDate: string; // ISO string 
    daysPassed: number;
  };
  releases: Release[];
  gigs: Gig[];
  grammys?: GrammysState;
  videos?: Video[];
  isGodMode?: boolean;
}

export interface DailyReportData {
  dailyStreams: number;
  dailySales: number;
  revenue: number;
  topSong: string | null;
  topAlbum: string | null;
}

