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
  Repeat,
  Sparkles,
  Maximize2,
  Gauge,
  Ratio,
} from 'lucide-react';
import { ABRepeatState, AspectRatioMode } from '../../types';

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
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number, gain: number) => void;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleAbRepeat: () => void;
  onToggleLooping: () => void;
  onCycleAspectRatio: () => void;
  onFrameStep: (direction: 'prev' | 'next') => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0];

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
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleAbRepeat,
  onToggleLooping,
  onCycleAspectRatio,
  onFrameStep,
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
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

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-4 flex flex-col gap-3 transition-all duration-300">
      {/* Progress Scrubber & Hover Preview */}
      <div className="relative group/scrubber cursor-pointer py-2" ref={scrubberRef} onMouseMove={handleScrubberMouseMove} onMouseLeave={() => setHoverTime(null)} onClick={handleScrubberClick}>
        {/* Hover Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-9 transform -translate-x-1/2 bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-xs px-2.5 py-1 rounded-md shadow-xl pointer-events-none font-mono"
            style={{ left: `${hoverPos}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Track Line */}
        <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden relative border border-slate-700/50 group-hover/scrubber:h-3 transition-all">
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

          {/* Played Progress Bar */}
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 relative transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/scrubber:scale-100 transition-transform border border-cyan-500" />
          </div>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-slate-200">
        {/* Left: Playback & Time Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Skip Back 10s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/50 transition-all"
            title="Rewind 10s (Left Arrow / J)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-950/60 transition-all transform hover:scale-105 active:scale-95"
            title="Play/Pause (Space / K)"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/50 transition-all"
            title="Fast Forward 10s (Right Arrow / L)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Frame Step Backward */}
          <button
            onClick={() => onFrameStep('prev')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700/50 transition-all hidden sm:block"
            title="Previous Frame (1/30s)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Frame Step Forward */}
          <button
            onClick={() => onFrameStep('next')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700/50 transition-all hidden sm:block"
            title="Next Frame (1/30s)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timestamp Display */}
          <div className="text-xs sm:text-sm font-mono tracking-tight text-slate-300 ml-1">
            <span className="text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Sound, Speed, Loop & Aspect Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Volume Boost Slider */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
            <button onClick={onToggleMute} className="text-slate-300 hover:text-cyan-400 transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
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
              className="w-16 sm:w-24 accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              title={`Volume Boost: ${Math.round(gain * 100)}%`}
            />
            <span className="text-[11px] font-mono text-cyan-400 min-w-[35px] text-right">
              {Math.round(gain * 100)}%
            </span>
          </div>

          {/* Playback Speed Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="p-2 px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-cyan-400 border border-slate-700/50 flex items-center gap-1 transition-all"
              title="Playback Speed"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{playbackSpeed}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-11 right-0 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-40 flex flex-col gap-1 min-w-[100px] backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1 font-semibold">Speed</div>
                {SPEED_OPTIONS.map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      onSpeedChange(spd);
                      setShowSpeedMenu(false);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg text-left transition-colors font-mono ${
                      playbackSpeed === spd
                        ? 'bg-cyan-600/30 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400'
                    }`}
                  >
                    {spd}x {spd === 1.0 ? '(Normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* A-B Loop Button */}
          <button
            onClick={onToggleAbRepeat}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 ${
              abRepeat.enabled
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/50 text-slate-400 hover:text-amber-400'
            }`}
            title="A-B Segment Loop (Z)"
          >
            <Repeat className="w-4 h-4" />
            <span className="text-[10px] hidden xl:inline">
              {abRepeat.pointA === null ? 'A-B Loop' : abRepeat.pointB === null ? 'Loop A' : 'Loop A-B'}
            </span>
          </button>

          {/* Aspect Ratio Cycle Quick Button */}
          <button
            onClick={onCycleAspectRatio}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/50 transition-all flex items-center gap-1 text-xs font-mono"
            title={`Aspect Ratio: ${aspectRatio.toUpperCase()} (Press C)`}
          >
            <Ratio className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] uppercase font-bold hidden sm:inline">{aspectRatio}</span>
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
