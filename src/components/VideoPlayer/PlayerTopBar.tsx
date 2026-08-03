import React from 'react';
import { MediaItem, AudioTrackInfo } from '../../types';
import {
  FolderOpen,
  Music,
  Users,
  SlidersHorizontal,
  Volume2,
  Subtitles,
  Bookmark,
  Camera,
  PictureInPicture2,
  Maximize,
  Minimize,
  Sparkles,
  Keyboard,
  Settings,
  Home,
  Languages,
} from 'lucide-react';

interface PlayerTopBarProps {
  media: MediaItem | null;
  isFullscreen: boolean;
  isP2PActive: boolean;
  p2pPeerCount: number;
  isMusicMode: boolean;
  onOpenLibrary: () => void;
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
  availableAudioTracks?: AudioTrackInfo[];
  activeAudioTrackId?: number;
}

export const PlayerTopBar: React.FC<PlayerTopBarProps> = ({
  media,
  isFullscreen,
  isP2PActive,
  p2pPeerCount,
  isMusicMode,
  onOpenLibrary,
  onReturnHome,
  onToggleMusicMode,
  onOpenP2PModal,
  onOpenVideoFilters,
  onOpenAudioEq,
  onOpenSubtitles,
  onOpenBookmarks,
  onOpenSnapshot,
  onOpenShortcuts,
  onTogglePip,
  onToggleFullscreen,
  availableAudioTracks = [],
  activeAudioTrackId = 0,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent p-4 flex items-center justify-between transition-opacity duration-300">
      {/* Left: Home Launcher Button, Library Button & Title */}
      <div className="flex items-center gap-2 max-w-xl">
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shadow-md"
            title="Return to Home Launcher Screen"
          >
            <Home className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold hidden sm:inline">Home</span>
          </button>
        )}

        <button
          onClick={onOpenLibrary}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/30 border border-slate-700/60 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-400 transition-all flex items-center gap-2 group shadow-md"
          title="Open Media Library & Files"
        >
          <FolderOpen className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold hidden sm:inline">Channels & Library</span>
        </button>

        <div className="overflow-hidden ml-1">
          <h1 className="text-sm sm:text-base font-semibold text-slate-100 truncate flex items-center gap-2">
            <span>{media?.title || 'No Media Selected'}</span>
            {media?.format && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-wide shrink-0">
                {media.format}
              </span>
            )}
            {availableAudioTracks.length > 1 && (
              <button
                onClick={onOpenAudioEq}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/90 border border-purple-500/50 text-purple-300 flex items-center gap-1 shrink-0 hover:border-purple-300 transition-colors"
                title="Change Audio Track"
              >
                <Languages className="w-3 h-3 text-purple-400" />
                <span>Audio ({availableAudioTracks.length})</span>
              </button>
            )}
          </h1>
          {media?.artist && <p className="text-xs text-slate-400 truncate">{media.artist}</p>}
        </div>
      </div>

      {/* Right: Modern Action Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* P2P Sync Watch Room */}
        <button
          onClick={onOpenP2PModal}
          className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
            isP2PActive
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 shadow-lg shadow-emerald-950/50 animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-emerald-400'
          }`}
          title="P2P Watch Room Sync"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">{isP2PActive ? `Room (${p2pPeerCount})` : 'P2P Sync'}</span>
        </button>

        {/* Music Mode Toggle */}
        <button
          onClick={onToggleMusicMode}
          className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
            isMusicMode
              ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-lg shadow-purple-950/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-purple-400'
          }`}
          title="Music Mode & Audio Visualizer"
        >
          <Music className="w-4 h-4 text-purple-400" />
          <span className="hidden md:inline">Music Mode</span>
        </button>

        {/* Video Adjustments & Filters */}
        <button
          onClick={onOpenVideoFilters}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-all"
          title="Video Filters, Aspect Ratio & Zoom"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Audio Tracks & Languages Selector Button */}
        <button
          onClick={onOpenAudioEq}
          className="p-2 px-2.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-500/80 text-purple-200 flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg shadow-purple-950/60"
          title="Switch Audio Tracks & Languages"
        >
          <Languages className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">
            {availableAudioTracks.length > 0 ? `Audio (${availableAudioTracks.length})` : 'Audio Track'}
          </span>
        </button>

        {/* Audio Boost & Equalizer */}
        <button
          onClick={onOpenAudioEq}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-all"
          title="Volume Boost & Equalizer"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Subtitles Manager */}
        <button
          onClick={onOpenSubtitles}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-all"
          title="Subtitles & Sync"
        >
          <Subtitles className="w-4 h-4" />
        </button>

        {/* Bookmarks */}
        <button
          onClick={onOpenBookmarks}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-amber-400 transition-all"
          title="Bookmark Timestamps"
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* Screenshot / GIF Capture */}
        <button
          onClick={onOpenSnapshot}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-rose-400 transition-all"
          title="Take Snapshot / GIF Clip"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Keyboard Hotkeys */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-yellow-400 transition-all hidden lg:block"
          title="Keyboard Shortcuts Guide"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* PiP */}
        <button
          onClick={onTogglePip}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-all"
          title="Picture-in-Picture Mode"
        >
          <PictureInPicture2 className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 transition-all"
          title="Fullscreen Toggle (F)"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
