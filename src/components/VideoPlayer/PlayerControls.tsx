import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Subtitles,
  Languages,
  Gauge,
  Ratio,
  Sliders,
  Sun,
  Repeat,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  PictureInPicture2,
  Maximize,
  Minimize,
  RefreshCw,
} from 'lucide-react';
import {
  ABRepeatState,
  AspectRatioMode,
  VideoFilters,
  AudioSettings,
  SubtitleSettings,
  SubtitleTrack,
  AudioTrackInfo,
} from '../../types';
import { EQ_PRESETS } from '../../utils/audioEngine';
import { parseSubtitleText } from '../../utils/srtParser';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  gain: number;
  muted: boolean;
  playbackSpeed: number;
  abRepeat: ABRepeatState;
  isLooping: boolean;
  aspectRatio: AspectRatioMode;
  videoFilters: VideoFilters;
  audioSettings: AudioSettings;
  subtitleSettings: SubtitleSettings;
  subtitleTracks: SubtitleTrack[];
  availableAudioTracks: AudioTrackInfo[];
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number, gain: number) => void;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleAbRepeat: () => void;
  onToggleLooping: () => void;
  onCycleAspectRatio: () => void;
  onUpdateAspectRatio: (mode: AspectRatioMode) => void;
  onFrameStep: (direction: 'prev' | 'next') => void;
  onUpdateFilters: (filters: VideoFilters) => void;
  onResetFilters: () => void;
  onUpdateAudioSettings: (settings: AudioSettings) => void;
  onUpdateSubtitleSettings: (settings: SubtitleSettings) => void;
  onAddSubtitleTrack: (track: SubtitleTrack) => void;
  onSelectAudioTrack: (trackId: number) => void;
  onTogglePip: () => void;
  onToggleFullscreen: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0];

const ASPECT_RATIO_OPTIONS: { mode: AspectRatioMode; label: string }[] = [
  { mode: 'fit', label: 'Fit (Default)' },
  { mode: 'fill', label: 'Fill / Crop' },
  { mode: 'stretch', label: 'Stretch' },
  { mode: '16:9', label: '16:9 Widescreen' },
  { mode: '4:3', label: '4:3 Standard' },
  { mode: '21:9', label: '21:9 Cinema' },
  { mode: '1:1', label: '1:1 Square' },
];

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  gain,
  muted,
  playbackSpeed,
  abRepeat,
  isLooping,
  aspectRatio,
  videoFilters,
  audioSettings,
  subtitleSettings,
  subtitleTracks,
  availableAudioTracks,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleAbRepeat,
  onToggleLooping,
  onCycleAspectRatio,
  onUpdateAspectRatio,
  onFrameStep,
  onUpdateFilters,
  onResetFilters,
  onUpdateAudioSettings,
  onUpdateSubtitleSettings,
  onAddSubtitleTrack,
  onSelectAudioTrack,
  onTogglePip,
  onToggleFullscreen,
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'main' | 'speed' | 'audio' | 'subtitles' | 'aspect' | 'filters' | 'eq' | 'loop'>('main');
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(e.clientX - rect.left);
    setHoverTime(pos * duration);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const cues = parseSubtitleText(text);
        const newTrack: SubtitleTrack = {
          id: `track-${Date.now()}`,
          label: file.name.replace(/\.[^/.]+$/, ''),
          language: 'Custom',
          cues,
          isCustom: true,
        };
        onAddSubtitleTrack(newTrack);
        onUpdateSubtitleSettings({
          ...subtitleSettings,
          enabled: true,
          activeTrackId: newTrack.id,
        });
      }
    };
    reader.readAsText(file);
  };

  const activeTrackObj = availableAudioTracks.find((t) => t.id === audioSettings.activeAudioTrackId);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent p-3 sm:p-5 flex flex-col gap-2.5 transition-all duration-300 font-sans">
      {/* YouTube Style Scrubber & Hover Timestamp Preview */}
      <div
        className="relative group/scrubber cursor-pointer py-1.5"
        ref={scrubberRef}
        onMouseMove={handleScrubberMouseMove}
        onMouseLeave={() => setHoverTime(null)}
        onClick={handleScrubberClick}
      >
        {/* Hover Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-9 transform -translate-x-1/2 bg-neutral-900 border border-neutral-700 text-red-500 font-bold text-xs px-2.5 py-1 rounded shadow-2xl pointer-events-none font-mono"
            style={{ left: `${hoverPos}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Track Line */}
        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden relative group-hover/scrubber:h-2.5 transition-all duration-200">
          {/* A-B Loop highlights */}
          {abRepeat.pointA !== null && duration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-amber-500/40 border-l border-amber-400 z-10"
              style={{
                left: `${(abRepeat.pointA / duration) * 100}%`,
                width: abRepeat.pointB !== null ? `${((abRepeat.pointB - abRepeat.pointA) / duration) * 100}%` : '100%',
              }}
            />
          )}

          {/* Played Red Progress Bar */}
          <div
            className="h-full bg-red-600 relative transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full shadow-lg scale-0 group-hover/scrubber:scale-100 transition-transform border border-white" />
          </div>
        </div>
      </div>

      {/* Main YouTube Controls Bar */}
      <div className="flex items-center justify-between gap-2 text-neutral-200">
        {/* Left Controls: Play/Pause, Rewind/Forward, Volume & Time */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className="p-2 sm:p-2.5 rounded-full hover:bg-neutral-800/80 text-white transition-all transform active:scale-95"
            title="Play/Pause (Space / K)"
          >
            {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />}
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition-all"
            title="Rewind 10s (Left Arrow / J)"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
            className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition-all"
            title="Fast Forward 10s (Right Arrow / L)"
          >
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Volume Group */}
          <div className="flex items-center gap-1.5 group/vol px-1 py-1 rounded-full hover:bg-neutral-900/60 transition-all">
            <button onClick={onToggleMute} className="p-1 text-neutral-300 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="3.0"
              step="0.05"
              value={muted ? 0 : gain}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onVolumeChange(Math.min(1, val), val);
              }}
              className="w-14 sm:w-20 accent-red-600 bg-neutral-800 h-1 rounded-lg appearance-none cursor-pointer"
              title={`Volume: ${Math.round(gain * 100)}%`}
            />
          </div>

          {/* Timestamp Display */}
          <div className="text-xs sm:text-sm font-mono tracking-tight text-neutral-300 ml-1 font-semibold">
            <span className="text-white">{formatTime(currentTime)}</span>
            <span className="text-neutral-500 mx-1">/</span>
            <span className="text-neutral-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls: Subtitles (CC), Audio Track, Settings Gear, PiP & Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Subtitles (CC) Button */}
          <button
            onClick={() =>
              onUpdateSubtitleSettings({
                ...subtitleSettings,
                enabled: !subtitleSettings.enabled,
              })
            }
            className={`p-2 rounded-xl transition-all relative ${
              subtitleSettings.enabled
                ? 'text-red-500 bg-red-950/60 border border-red-800/60 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Toggle Subtitles (C)"
          >
            <Subtitles className="w-4 h-4 sm:w-5 sm:h-5" />
            {subtitleSettings.enabled && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Languages Button (Shown when multiple audio streams exist) */}
          {availableAudioTracks.length > 1 && (
            <button
              onClick={() => {
                setShowSettings(true);
                setActiveSubMenu('audio');
              }}
              className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-all flex items-center gap-1 text-xs font-semibold"
              title="Select Dubbed Audio Track / Language"
            >
              <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span className="hidden md:inline truncate max-w-[100px]">
                {activeTrackObj ? activeTrackObj.name : 'Audio'}
              </span>
            </button>
          )}

          {/* YouTube-Style Settings Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setActiveSubMenu('main');
              }}
              className={`p-2 rounded-xl transition-all ${
                showSettings
                  ? 'text-white bg-neutral-800 border border-neutral-700 rotate-45'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
              title="Settings (Speed, Audio, Subtitles, Aspect, Colors)"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200" />
            </button>

            {/* YouTube-Style In-Place Compact Floating Settings Popover */}
            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />

                <div className="absolute bottom-12 right-0 bg-neutral-950/95 border border-neutral-800 rounded-2xl shadow-2xl p-2.5 z-50 w-72 backdrop-blur-2xl animate-fade-in text-neutral-100 flex flex-col gap-1 max-h-[75vh] overflow-y-auto font-sans">
                  {/* MAIN SETTINGS MENU */}
                  {activeSubMenu === 'main' && (
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5 border-b border-neutral-800/80 mb-1">
                        Player Settings
                      </div>

                      {/* Playback Speed */}
                      <button
                        onClick={() => setActiveSubMenu('speed')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Gauge className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Playback Speed</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400 font-mono text-[11px]">
                          <span>{playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed}x`}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      </button>

                      {/* Audio Languages (if multiple tracks exist) */}
                      {availableAudioTracks.length > 0 && (
                        <button
                          onClick={() => setActiveSubMenu('audio')}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Languages className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Audio Language</span>
                          </div>
                          <div className="flex items-center gap-1 text-neutral-400 text-[11px] truncate max-w-[110px]">
                            <span className="truncate">{activeTrackObj ? activeTrackObj.name : 'Default'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          </div>
                        </button>
                      )}

                      {/* Subtitles & SRT */}
                      <button
                        onClick={() => setActiveSubMenu('subtitles')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Subtitles className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Subtitles / SRT</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400 text-[11px]">
                          <span>{subtitleSettings.enabled ? 'On' : 'Off'}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      </button>

                      {/* Aspect Ratio */}
                      <button
                        onClick={() => setActiveSubMenu('aspect')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Ratio className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Aspect Ratio</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400 uppercase text-[11px]">
                          <span>{aspectRatio}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      </button>

                      {/* Video Filters / Colors */}
                      <button
                        onClick={() => setActiveSubMenu('filters')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Brightness & Colors</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      </button>

                      {/* Audio EQ */}
                      <button
                        onClick={() => setActiveSubMenu('eq')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sliders className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Audio Equalizer</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400 text-[11px]">
                          <span>{audioSettings.eqPreset}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      </button>

                      {/* Loop Controls */}
                      <button
                        onClick={() => setActiveSubMenu('loop')}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/70 text-xs text-neutral-200 hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Repeat className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Loop & A-B Repeat</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    </div>
                  )}

                  {/* SUBMENU: PLAYBACK SPEED */}
                  {activeSubMenu === 'speed' && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveSubMenu('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white font-semibold border-b border-neutral-800 mb-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Playback Speed</span>
                      </button>
                      {SPEED_OPTIONS.map((spd) => (
                        <button
                          key={spd}
                          onClick={() => {
                            onSpeedChange(spd);
                            setShowSettings(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                            playbackSpeed === spd
                              ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                              : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                          }`}
                        >
                          <span>{spd}x {spd === 1.0 ? '(Normal)' : ''}</span>
                          {playbackSpeed === spd && <Check className="w-3.5 h-3.5 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SUBMENU: AUDIO LANGUAGES */}
                  {activeSubMenu === 'audio' && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveSubMenu('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white font-semibold border-b border-neutral-800 mb-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Audio Language Tracks</span>
                      </button>
                      {availableAudioTracks.map((track) => {
                        const isSelected = audioSettings.activeAudioTrackId === track.id;
                        return (
                          <button
                            key={track.id}
                            onClick={() => {
                              onSelectAudioTrack(track.id);
                              setShowSettings(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                              isSelected
                                ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                                : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{track.name || `Track ${track.id + 1}`}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* SUBMENU: SUBTITLES */}
                  {activeSubMenu === 'subtitles' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setActiveSubMenu('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white font-semibold border-b border-neutral-800"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Subtitles & SRT</span>
                      </button>

                      {/* Enable Toggle */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-xs font-semibold text-neutral-200">Subtitles Overlay</span>
                        <input
                          type="checkbox"
                          checked={subtitleSettings.enabled}
                          onChange={(e) =>
                            onUpdateSubtitleSettings({
                              ...subtitleSettings,
                              enabled: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                        />
                      </div>

                      {/* Load Custom SRT */}
                      <label className="border border-dashed border-neutral-700 hover:border-red-600 bg-neutral-900/60 p-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs text-neutral-300 hover:text-white">
                        <Upload className="w-3.5 h-3.5 text-red-500" />
                        <span>Load .SRT / .VTT Subtitle File</span>
                        <input type="file" accept=".srt,.vtt,.sub,.ass" onChange={handleSrtUpload} className="hidden" />
                      </label>

                      {/* Track List */}
                      {subtitleTracks.length > 0 && (
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase px-1">Tracks</span>
                          <button
                            onClick={() =>
                              onUpdateSubtitleSettings({ ...subtitleSettings, activeTrackId: null })
                            }
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                              subtitleSettings.activeTrackId === null ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span>Off</span>
                            {subtitleSettings.activeTrackId === null && <Check className="w-3.5 h-3.5 text-red-500" />}
                          </button>
                          {subtitleTracks.map((tr) => (
                            <button
                              key={tr.id}
                              onClick={() =>
                                onUpdateSubtitleSettings({ ...subtitleSettings, enabled: true, activeTrackId: tr.id })
                              }
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs truncate ${
                                subtitleSettings.activeTrackId === tr.id ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{tr.label}</span>
                              {subtitleSettings.activeTrackId === tr.id && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBMENU: ASPECT RATIO */}
                  {activeSubMenu === 'aspect' && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveSubMenu('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white font-semibold border-b border-neutral-800 mb-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Aspect Ratio</span>
                      </button>
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <button
                          key={opt.mode}
                          onClick={() => {
                            onUpdateAspectRatio(opt.mode);
                            setShowSettings(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                            aspectRatio === opt.mode
                              ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                              : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {aspectRatio === opt.mode && <Check className="w-3.5 h-3.5 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SUBMENU: VIDEO FILTERS & COLOR */}
                  {activeSubMenu === 'filters' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                        <button
                          onClick={() => setActiveSubMenu('main')}
                          className="flex items-center gap-1.5 px-2 text-xs text-neutral-400 hover:text-white font-semibold"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Brightness & Filters</span>
                        </button>
                        <button
                          onClick={onResetFilters}
                          className="p-1 text-[10px] text-neutral-400 hover:text-red-400 flex items-center gap-1"
                          title="Reset"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>

                      {/* Brightness */}
                      <div className="flex flex-col gap-1 px-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-300">Brightness</span>
                          <span className="font-mono text-red-500">{videoFilters.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={videoFilters.brightness}
                          onChange={(e) => onUpdateFilters({ ...videoFilters, brightness: Number(e.target.value) })}
                          className="accent-red-600 bg-neutral-800 h-1 rounded"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="flex flex-col gap-1 px-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-300">Contrast</span>
                          <span className="font-mono text-red-500">{videoFilters.contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={videoFilters.contrast}
                          onChange={(e) => onUpdateFilters({ ...videoFilters, contrast: Number(e.target.value) })}
                          className="accent-red-600 bg-neutral-800 h-1 rounded"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="flex flex-col gap-1 px-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-300">Saturation</span>
                          <span className="font-mono text-red-500">{videoFilters.saturate}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={videoFilters.saturate}
                          onChange={(e) => onUpdateFilters({ ...videoFilters, saturate: Number(e.target.value) })}
                          className="accent-red-600 bg-neutral-800 h-1 rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUBMENU: AUDIO EQUALIZER */}
                  {activeSubMenu === 'eq' && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveSubMenu('main')}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white font-semibold border-b border-neutral-800 mb-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Audio Equalizer Presets</span>
                      </button>
                      {Object.keys(EQ_PRESETS).map((presetKey) => (
                        <button
                          key={presetKey}
                          onClick={() => {
                            onUpdateAudioSettings({
                              ...audioSettings,
                              eqPreset: presetKey,
                              eqGains: EQ_PRESETS[presetKey],
                            });
                            setShowSettings(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs capitalize transition-colors ${
                            audioSettings.eqPreset === presetKey
                              ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                              : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                          }`}
                        >
                          <span>{presetKey}</span>
                          {audioSettings.eqPreset === presetKey && <Check className="w-3.5 h-3.5 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SUBMENU: LOOP & REPEAT */}
                  {activeSubMenu === 'loop' && (
                    <div className="flex flex-col gap-2 p-1">
                      <button
                        onClick={() => setActiveSubMenu('main')}
                        className="flex items-center gap-1.5 px-1 py-1 text-xs text-neutral-400 hover:text-white font-semibold border-b border-neutral-800 mb-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Loop & A-B Repeat</span>
                      </button>

                      <button
                        onClick={onToggleLooping}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border ${
                          isLooping ? 'bg-neutral-800 text-white font-bold border-neutral-700' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span>Repeat Video (Loop)</span>
                        {isLooping && <Check className="w-3.5 h-3.5 text-red-500" />}
                      </button>

                      <button
                        onClick={onToggleAbRepeat}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border ${
                          abRepeat.enabled ? 'bg-amber-950/80 border-amber-500/60 text-amber-300' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span>
                          {abRepeat.pointA === null
                            ? 'Start A-B Segment Loop'
                            : abRepeat.pointB === null
                            ? 'Set Point B'
                            : 'Clear A-B Loop'}
                        </span>
                        <Repeat className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Picture-in-Picture Button */}
          <button
            onClick={onTogglePip}
            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-all hidden sm:block"
            title="Picture-in-Picture"
          >
            <PictureInPicture2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}
