import React, { useState } from 'react';
import { GameState, Release, Song, Album, Video } from '../types';
import { ChevronRight, Play, MoreVertical, Disc, User } from 'lucide-react';

interface YouTubeMusicViewProps {
   gameState: GameState;
}

export function YouTubeMusicView({ gameState }: YouTubeMusicViewProps) {
    const publishedReleases = gameState.releases.filter(r => r.status === 'Published');
    const songs = publishedReleases.filter(r => r.type === 'Single') as Song[];
    const albums = publishedReleases.filter(r => r.type === 'Album') as Album[];
    const videos = gameState.videos || [];

    const getSongYTMusicStreams = (song: Song) => {
        const audioStreams = song.streams.youtubeMusic || 0;
        const mvViews = videos.filter(v => v.songId === song.id).reduce((acc, v) => acc + v.views, 0);
        return audioStreams + mvViews;
    };

    const getPlatformStreams = (release: Release): number => {
        if (release.type === 'Single') {
            return getSongYTMusicStreams(release as Song);
        } else if (release.type === 'Album') {
            const albumData = release as Album;
            return albumData.trackIds.reduce((sum, tid) => {
                const track = songs.find(s => s.id === tid);
                return sum + (track ? getSongYTMusicStreams(track) : 0);
            }, 0);
        }
        return 0;
    };

    const topSongs = [...songs].sort((a, b) => getSongYTMusicStreams(b) - getSongYTMusicStreams(a)).slice(0, 20);
    
    // Chunk top songs into columns of 4 for horizontal scrolling
    const topSongsChunks: Song[][] = [];
    for (let i = 0; i < topSongs.length; i += 4) {
        topSongsChunks.push(topSongs.slice(i, i + 4));
    }

    const formatViews = (views: number) => {
        if (views >= 1000000000) {
           return (views / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' B';
        } else if (views >= 1000000) {
           return (views / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' M';
        } else if (views >= 1000) {
           return (views / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' K';
        }
        return views.toLocaleString('en-US');
    };

    // calculate monthly listeners based on Daily Youtube Streams + Daily Audio Streams
    const calculateListeners = () => {
        let totalDailyYTStreams = 0;
        publishedReleases.forEach(r => {
           const dailyTotal = r.lastDailyStreams?.total || 0;
           totalDailyYTStreams += (dailyTotal * 0.1); // approx for youtubeMusic audio
        });
        
        let dailyYTViews = 0;
        videos.forEach(v => {
           // We can approximate their daily views. The game loop calculates daily views and adds them. 
           // Since we don't store 'lastDailyViews' for videos, we can guess based on its age.
           const ageDays = Math.max(1, Math.floor((new Date(gameState.time.startDate).getTime() + (gameState.time.daysPassed * 24*60*60*1000) - new Date(v.publishDate).getTime()) / (1000*3600*24)));
           dailyYTViews += (v.views / ageDays) * 0.5; // heuristic
        });

        const activeListeners = (totalDailyYTStreams + dailyYTViews) * 6.2;
        const totalPlatStreams = publishedReleases.reduce((sum, r) => sum + getPlatformStreams(r), 0);
        const legacyListeners = totalPlatStreams > 0 ? (Math.pow(totalPlatStreams, 0.65) * 0.8) : 0; 
        
        return Math.floor((activeListeners + legacyListeners) * (Math.random() * 0.05 + 0.95)) || 0;
    };

    const getSubscribers = () => {
        if (gameState.stats.youtubeSubscribers !== undefined) {
           return gameState.stats.youtubeSubscribers;
        }
        const totalPop = (gameState.popularity.america + gameState.popularity.europe + gameState.popularity.latinAmerica) / 3;
        return Math.floor(gameState.stats.streams * 0.05 + totalPop * 10000);
    };

    return (
        <div className="bg-[#030303] text-white min-h-screen font-sans pb-24 overflow-x-hidden">
            {/* Header Hero */}
            <div className="relative h-[24rem] md:h-[28rem] flex flex-col justify-end p-6 md:p-12 overflow-hidden shrink-0">
               {gameState.artist.image ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gameState.artist.image})` }}></div>
               ) : (
                  <div className="absolute inset-0 bg-[#121212] flex items-center justify-center">
                     <User className="w-32 h-32 text-white/10" />
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent"></div>
               <div className="relative z-10 flex flex-col items-start pt-[50%]">
                  <h1 className="text-4xl md:text-6xl font-black mb-1">{gameState.artist.name}</h1>
                  <p className="text-white/60 font-medium text-sm mb-4">{formatViews(calculateListeners())} monthly listeners</p>
                  
                  <div className="flex items-center w-full justify-between">
                     <button className="px-4 py-2 hover:bg-gray-200 bg-white text-black rounded-full font-medium text-sm transition-colors flex items-center gap-2">
                        Subscribe <span className="text-black/70">{formatViews(getSubscribers())}</span>
                     </button>
                     <div className="flex items-center gap-2">
                        <button className="w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center shrink-0">
                           <Disc className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 bg-white hover:scale-105 transition-transform rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-white/20">
                           <Play className="w-6 h-6 text-black fill-current ml-1" />
                        </button>
                     </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-6 mt-6 border-b border-white/10 w-full overflow-x-auto hide-scrollbar">
                     <button className="text-white font-medium text-sm pb-3 border-b-2 border-white shrink-0">Music</button>
                     <button className="text-white/60 font-medium text-sm pb-3 border-b-2 border-transparent shrink-0">Concerts</button>
                     <button className="text-white/60 font-medium text-sm pb-3 border-b-2 border-transparent shrink-0">Store</button>
                  </div>
               </div>
            </div>

            {/* Sections */}
            <div className="px-4 md:px-12 mt-6 flex flex-col gap-10">

                {/* Top Songs */}
                {topSongsChunks.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Top songs</h2>
                            <button className="px-3 py-1 border border-white/20 rounded-full text-xs font-medium hover:bg-white/10 transition-colors">Play all</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {topSongsChunks.map((chunk, i) => (
                                <div key={i} className="flex flex-col gap-2 min-w-[300px] md:min-w-[400px] w-[85vw] md:w-[400px] snap-start shrink-0">
                                    {chunk.map((song) => (
                                        <div key={song.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 group cursor-pointer transition-colors">
                                            <div className="w-12 h-12 bg-[#212121] rounded shrink-0 overflow-hidden relative">
                                                {song.coverImage ? <img src={song.coverImage} className="w-full h-full object-cover" /> : null}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Play className="w-5 h-5 text-white fill-current" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-medium truncate group-hover:underline">{song.title}</h3>
                                                <p className="text-white/60 text-[13px] truncate">{gameState.artist.name} • {formatViews(getSongYTMusicStreams(song))} streams</p>
                                            </div>
                                            <button className="p-2 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-all">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Albums */}
                {albums.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Albums</h2>
                            <ChevronRight className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {albums.map((album) => (
                                <div key={album.id} className="flex flex-col w-[160px] md:w-[200px] snap-start shrink-0 group cursor-pointer">
                                    <div className="w-full aspect-square bg-[#212121] rounded-md overflow-hidden relative mb-3">
                                        {album.coverImage ? <img src={album.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-16 md:mt-24" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-base truncate group-hover:underline">{album.title}</h3>
                                    <p className="text-white/60 text-sm truncate">{album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown'}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Singles */}
                {songs.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Singles & EPs</h2>
                            <ChevronRight className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {[...songs].reverse().map((song) => (
                                <div key={song.id} className="flex flex-col w-[160px] md:w-[200px] snap-start shrink-0 group cursor-pointer">
                                    <div className="w-full aspect-square bg-[#212121] rounded-md overflow-hidden relative mb-3">
                                        {song.coverImage ? <img src={song.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <Disc className="w-12 h-12 text-white/20 m-auto mt-16 md:mt-24" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-base truncate group-hover:underline">{song.title}</h3>
                                    <p className="text-white/60 text-sm truncate">{song.type === 'Single' ? 'Single' : 'EP'} • {song.releaseDate ? new Date(song.releaseDate).getFullYear() : ''}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl md:text-2xl font-bold">Videos</h2>
                            <ChevronRight className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                            {[...videos].reverse().map((video) => {
                                const song = songs.find(s => s.id === video.songId);
                                return (
                                    <div key={video.id} className="flex flex-col w-[260px] md:w-[320px] snap-start shrink-0 group cursor-pointer">
                                        <div className="w-full aspect-video bg-[#212121] rounded-md overflow-hidden relative mb-3">
                                            {video.thumbnail || song?.coverImage ? <img src={video.thumbnail || song?.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Play className="w-6 h-6 text-white fill-current ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="font-medium text-base truncate group-hover:underline">{video.title}</h3>
                                        <p className="text-white/60 text-sm truncate">{gameState.artist.name} • {formatViews(video.views)} views</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* About */}
                <section className="mb-12">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">About</h2>
                    <p className="text-white/60 mb-4">{gameState.stats.streams > 0 ? (gameState.stats.streams + videos.reduce((acc, v) => acc + v.views, 0)).toLocaleString('en-US') : 0} views</p>
                    <p className="text-white/80 leading-relaxed max-w-3xl">
                        {gameState.artist.name} is a singer, songwriter from {gameState.artist.country}. 
                        Debuted in {new Date(gameState.time.startDate).getFullYear()} and continues to grow their career in the music industry.
                    </p>
                </section>
            </div>
        </div>
    );
}
