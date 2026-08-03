import React from 'react';
import { VideoFilters, AspectRatioMode } from '../../types';
import { X, Sliders, Ratio, Sun, Eye, Contrast, Palette, RefreshCw } from 'lucide-react';

interface VideoAdjustmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VideoFilters;
  aspectRatio: AspectRatioMode;
  onUpdateFilters: (newFilters: VideoFilters) => void;
  onUpdateAspectRatio: (mode: AspectRatioMode) => void;
  onResetFilters: () => void;
}

const ASPECT_RATIO_OPTIONS: { mode: AspectRatioMode; label: string; desc: string }[] = [
  { mode: 'fit', label: 'Fit (Default)', desc: 'Fit entire video without cropping' },
  { mode: 'fill', label: 'Fill / Crop', desc: 'Expand to fill canvas space' },
  { mode: 'stretch', label: 'Stretch', desc: 'Stretch pixels to fill container' },
  { mode: '16:9', label: '16:9 Widescreen', desc: 'Standard HD aspect ratio' },
  { mode: '4:3', label: '4:3 Classic', desc: 'Standard TV aspect ratio' },
  { mode: '21:9', label: '21:9 Cinema', desc: 'Ultra-wide cinematic ratio' },
  { mode: '1:1', label: '1:1 Square', desc: 'Square 1:1 format' },
];

export const VideoAdjustmentsModal: React.FC<VideoAdjustmentsModalProps> = ({
  isOpen,
  onClose,
  filters,
  aspectRatio,
  onUpdateFilters,
  onUpdateAspectRatio,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-lg">
            <Sliders className="w-5 h-5" />
            <span>Video Controls & FX</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector Grid */}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Ratio className="w-4 h-4 text-cyan-400" />
            <span>Aspect Ratio & Pan-Scan</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ASPECT_RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => onUpdateAspectRatio(opt.mode)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  aspectRatio === opt.mode
                    ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/50'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                }`}
              >
                <span className="text-xs font-bold font-mono">{opt.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual FX Sliders */}
        <div className="flex flex-col gap-4 border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Color & Filter Enhancements</span>
            </div>
            <button
              onClick={onResetFilters}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brightness */}
            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Brightness</span>
                <span className="font-mono text-cyan-400">{filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={filters.brightness}
                onChange={(e) => onUpdateFilters({ ...filters, brightness: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Contrast</span>
                <span className="font-mono text-cyan-400">{filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={filters.contrast}
                onChange={(e) => onUpdateFilters({ ...filters, contrast: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Saturation</span>
                <span className="font-mono text-cyan-400">{filters.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => onUpdateFilters({ ...filters, saturation: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Hue Rotate */}
            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Hue Shift</span>
                <span className="font-mono text-cyan-400">{filters.hueRotate}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={filters.hueRotate}
                onChange={(e) => onUpdateFilters({ ...filters, hueRotate: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Invert */}
            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Invert Color</span>
                <span className="font-mono text-cyan-400">{filters.invert}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.invert}
                onChange={(e) => onUpdateFilters({ ...filters, invert: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Deinterlace Scanlines filter */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Deinterlace Scanlines</span>
                <span className="text-[10px] text-slate-500">CRT scanline sharpening effect</span>
              </div>
              <input
                type="checkbox"
                checked={filters.deinterlace}
                onChange={(e) => onUpdateFilters({ ...filters, deinterlace: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
