import React, { useState } from 'react';
import { GameState, Release, Album } from '../types';
import { Music, Disc, BarChart3, Calendar } from 'lucide-react';
import { AlbumCardView } from './AlbumCardView';
import { ReleaseStatsPopup } from './ReleaseStatsPopup';
import { AlbumSalesChart } from './AlbumSalesChart';

interface DiscographyViewProps {
  gameState: GameState;
}

export function DiscographyView({ gameState }: DiscographyViewProps) {
  const releases = gameState.releases || [];
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [statsPopupRelease, setStatsPopupRelease] = useState<Release | null>(null);
  const [activeTab, setActiveTab] = useState<'Published' | 'Unreleased'>('Published');
  const [showAlbumSalesChart, setShowAlbumSalesChart] = useState(false);

  const albums = releases.filter(r => r.type === 'Album');
  const allAlbumTrackIds = new Set(albums.flatMap(a => (a as Album).trackIds));
  
  const standaloneSingles = releases.filter(r => r.type === 'Single' && !allAlbumTrackIds.has(r.id));
  const albumTracks = releases.filter(r => r.type === 'Single' && allAlbumTrackIds.has(r.id));

  const sectionsByStatus = {
    Published: {
      Albums: albums.filter(r => r.status === 'Published'),
      Singles: standaloneSingles.filter(r => r.status === 'Published'),
      'Album Tracks': albumTracks.filter(r => r.status === 'Published'),
    },
    Unreleased: {
      'Scheduled': releases.filter(r => r.status === 'Scheduled'),
      'The Vault': releases.filter(r => r.status === 'Vaulted'),
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8 space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase">Discography</h2>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button 
            onClick={() => setShowAlbumSalesChart(true)}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all bg-blue-500/20 text-blue-300 hover:text-white mr-2 flex items-center gap-2"
          >
            <BarChart3 className="w-3 h-3" />
            Albums Sales Chart
          </button>
          <button 
            onClick={() => setActiveTab('Published')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Published' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Published
          </button>
          <button 
            onClick={() => setActiveTab('Unreleased')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Unreleased' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Unreleased
          </button>
        </div>
      </div>
      
      {releases.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/40 py-20">
           <Disc className="w-16 h-16 mb-4 opacity-20" />
           <p className="font-mono text-sm uppercase tracking-widest">No releases yet. Head to the Studio.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {activeTab === 'Published' ? (
            <>
              <ReleaseSection 
                title="Major Albums" 
                items={sectionsByStatus.Published.Albums} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
              <ReleaseSection 
                title="Standalone Singles" 
                items={sectionsByStatus.Published.Singles} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
              <details className="group">
                <summary className="text-xs font-bold tracking-widest uppercase text-white/30 mb-4 cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center group-open:rotate-180 transition-transform">▼</div>
                  View Album Tracks ({sectionsByStatus.Published['Album Tracks'].length})
                </summary>
                <div className="mt-4">
                  <ReleaseSection 
                    title="" 
                    items={sectionsByStatus.Published['Album Tracks']} 
                    onSelectAlbum={setSelectedAlbum} 
                    onShowStats={setStatsPopupRelease} 
                    isSmall={true}
                  />
                </div>
              </details>
            </>
          ) : (
            <>
              <ReleaseSection 
                title="Scheduled for Release" 
                items={sectionsByStatus.Unreleased.Scheduled} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
              <ReleaseSection 
                title="The Vault" 
                items={sectionsByStatus.Unreleased['The Vault']} 
                onSelectAlbum={setSelectedAlbum} 
                onShowStats={setStatsPopupRelease} 
              />
            </>
          )}
        </div>
      )}

      {selectedAlbum && (
        <AlbumCardView album={selectedAlbum} gameState={gameState} onClose={() => setSelectedAlbum(null)} />
      )}
      
      {statsPopupRelease && (
        <ReleaseStatsPopup release={statsPopupRelease} gameState={gameState} onClose={() => setStatsPopupRelease(null)} />
      )}

      {showAlbumSalesChart && (
        <AlbumSalesChart gameState={gameState} onClose={() => setShowAlbumSalesChart(false)} />
      )}
    </div>
  );
}

function ReleaseSection({ title, items, onSelectAlbum, onShowStats, isSmall }: { title: string, items: Release[], onSelectAlbum: (a: Album) => void, onShowStats: (r: Release) => void, isSmall?: boolean }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
       {title && <h3 className="text-xs font-bold tracking-widest uppercase text-purple-400/80 mb-4 flex items-center gap-2">
         <div className="h-[1px] flex-1 bg-purple-400/20"></div>
         {title}
         <div className="h-[1px] w-8 bg-purple-400/20"></div>
       </h3>}
       <div className={`grid grid-cols-1 ${isSmall ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
         {items.map(item => (
           <div 
             key={item.id} 
             onClick={() => onShowStats(item)}
             className={`bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl flex gap-4 items-center group hover:bg-white/5 hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden ${isSmall ? 'opacity-60 scale-95 hover:opacity-100 hover:scale-100' : ''}`}
           >
              {/* Subtle accent line */}
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/0 group-hover:bg-purple-500 transition-colors"></div>

              <div className={`${isSmall ? 'w-10 h-10' : 'w-16 h-16'} shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center shadow-lg relative`}>
                 {item.coverImage ? (
                   <img src={item.coverImage || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                 ) : (
                   <Music className="w-6 h-6 text-white/20" />
                 )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                 <span className={`font-bold ${isSmall ? 'text-xs' : 'text-sm'} tracking-wide truncate`}>{item.title}</span>
                 <span className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-2 mt-1">
                   {item.type === 'Album' ? <Disc className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                   {item.type}
                 </span>
                 
                 {!isSmall && (
                   <div className="flex flex-col gap-0.5 mt-2">
                     <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40">Streams</span>
                        <span className="text-blue-400">{(item.streams as any).total !== undefined ? (item.streams as any).total.toLocaleString() : typeof item.streams === 'number' ? (item.streams as number).toLocaleString() : '0'}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40">Sales</span>
                        <span className="text-purple-400">{item.sales?.total?.toLocaleString() || '0'}</span>
                     </div>
                   </div>
                 )}

                 {item.status === 'Scheduled' && item.releaseDate && (
                    <span className="text-[10px] text-yellow-400 font-mono mt-2 flex items-center gap-1 leading-none uppercase">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(item.releaseDate).toLocaleDateString()}
                    </span>
                 )}
                 {item.type === 'Album' && item.status === 'Published' && (
                    <button 
                       onClick={(e) => { e.stopPropagation(); onSelectAlbum(item as Album); }}
                       className="mt-3 bg-purple-600/10 hover:bg-purple-600/30 text-purple-200 border border-purple-500/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-[10px] font-bold uppercase tracking-widest w-full"
                    >
                       <BarChart3 className="w-3 h-3" />
                       Album Card
                    </button>
                 )}
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}
