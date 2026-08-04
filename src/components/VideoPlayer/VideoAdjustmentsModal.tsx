import React from 'react';
import { VideoFilters, AspectRatioMode } from '../../types';
import { X, Sliders, Ratio, Sun, RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-neutral-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <Sliders className="w-5 h-5 text-red-500" />
            <span>Video Controls & Aspect Ratio</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector Grid */}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
            <Ratio className="w-4 h-4 text-red-500" />
            <span>Aspect Ratio & Pan-Scan</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ASPECT_RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => onUpdateAspectRatio(opt.mode)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  aspectRatio === opt.mode
                    ? 'bg-red-950/80 border-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                }`}
              >
                <span className="text-xs font-bold font-mono">{opt.label}</span>
                <span className="text-[10px] text-neutral-400 leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual FX Sliders */}
        <div className="flex flex-col gap-4 border-t border-neutral-800 pt-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Color & Filter Enhancements</span>
            </div>
            <button
              onClick={onResetFilters}
              className="text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1 bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brightness */}
            <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Brightness</span>
                <span className="font-mono text-red-500 font-bold">{filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => onUpdateFilters({ ...filters, brightness: Number(e.target.value) })}
                className="accent-red-600 bg-neutral-800"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Contrast</span>
                <span className="font-mono text-red-500 font-bold">{filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => onUpdateFilters({ ...filters, contrast: Number(e.target.value) })}
                className="accent-red-600 bg-neutral-800"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Saturation</span>
                <span className="font-mono text-red-500 font-bold">{filters.saturate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturate}
                onChange={(e) => onUpdateFilters({ ...filters, saturate: Number(e.target.value) })}
                className="accent-red-600 bg-neutral-800"
              />
            </div>

            {/* Hue Rotate */}
            <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Hue Rotate</span>
                <span className="font-mono text-red-500 font-bold">{filters.hueRotate}deg</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={filters.hueRotate}
                onChange={(e) => onUpdateFilters({ ...filters, hueRotate: Number(e.target.value) })}
                className="accent-red-600 bg-neutral-800"
              />
            </div>

            {/* Blur */}
            <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Blur</span>
                <span className="font-mono text-red-500 font-bold">{filters.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.blur}
                onChange={(e) => onUpdateFilters({ ...filters, blur: Number(e.target.value) })}
                className="accent-red-600 bg-neutral-800"
              />
            </div>

            {/* Grayscale */}
            <div className="flex flex-col gap-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Grayscale</span>
                <span className="font-mono text-red-500 font-bold">{filters.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.grayscale}
                onChange={(e) => onUpdateFilters({ ...filters, grayscale: Number(e.target.value) })}
                className="accent-red-600 bg-neutral-800"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
