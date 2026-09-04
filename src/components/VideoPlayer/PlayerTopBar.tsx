import React from 'react';
import { MediaItem } from '../../types';
import {
  FolderOpen,
  Users,
  Maximize,
  Minimize,
  Keyboard,
  ArrowLeft,
  Bookmark,
  Tv,
} from 'lucide-react';

interface PlayerTopBarProps {
  media: MediaItem | null;
  isFullscreen: boolean;
  isP2PActive: boolean;
  p2pPeerCount: number;
  isMusicMode: boolean;
  onOpenLibrary: () => void;
  onOpenLiveTV?: () => void;
  onReturnHome?: () => void;
  onToggleMusicMode: () => void;
  onOpenP2PModal: () => void;
  onOpenVideoFilters: () => void;
  onOpenAudioEq: () => void;
  onOpenSubtitles: () => void;
  onOpenBookmarks: () => void;
  onOpenSnapshot: () => void;
  onOpenShortcuts: () => void;
  onTogglePip: () => void;
  onToggleFullscreen: () => void;
  availableAudioTracks?: any[];
  activeAudioTrackId?: number;
  onSelectAudioTrack?: (trackId: number) => void;
}

export const PlayerTopBar: React.FC<PlayerTopBarProps> = ({
  media,
  isFullscreen,
  isP2PActive,
  p2pPeerCount,
  onOpenLibrary,
  onOpenLiveTV,
  onReturnHome,
  onOpenP2PModal,
  onOpenBookmarks,
  onOpenShortcuts,
  onToggleFullscreen,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-3 sm:p-5 flex items-center justify-between transition-opacity duration-300 font-sans">
      {/* Left: YouTube / Netflix Style Back Arrow & Media Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 max-w-xl">
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="p-2 sm:p-2.5 rounded-full hover:bg-neutral-800/80 text-white transition-all flex items-center justify-center active:scale-95"
            title="Back to Browse Home"
          >
            <ArrowLeft className="w-5 h-5 text-red-600" />
          </button>
        )}

        <button
          onClick={onOpenLibrary}
          className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white transition-all flex items-center gap-2 group shadow-md"
          title="Open Media Library (Local, Samples, URLs)"
        >
          <FolderOpen className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold hidden sm:inline">Library</span>
        </button>

        {onOpenLiveTV && (
          <button
            onClick={onOpenLiveTV}
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white transition-all flex items-center gap-2 group shadow-md"
            title="Open Live TV Guide & Channel Health (Full View)"
          >
            <Tv className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold hidden sm:inline">Live TV</span>
          </button>
        )}

        <div className="overflow-hidden">
          <h1 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
            <span className="truncate">{media?.title || 'Video Stream'}</span>
            {media?.format && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-400 font-bold uppercase tracking-wider shrink-0">
                {media.format}
              </span>
            )}
          </h1>
          {media?.artist && <p className="text-[11px] text-neutral-400 truncate">{media.artist}</p>}
        </div>
      </div>

      {/* Right: Essential YouTube Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* P2P Sync Watch Room */}
        <button
          onClick={onOpenP2PModal}
          className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
            isP2PActive
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 shadow-lg shadow-emerald-950/50 animate-pulse'
              : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/80 text-neutral-300 hover:text-white'
          }`}
          title="P2P Watch Room Sync"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">{isP2PActive ? `Room (${p2pPeerCount})` : 'Sync Party'}</span>
        </button>

        {/* Bookmarks */}
        <button
          onClick={onOpenBookmarks}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white transition-all hidden sm:block"
          title="Bookmarks & Markers"
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white transition-all hidden lg:block"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95"
          title="Toggle Fullscreen Mode (F)"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

