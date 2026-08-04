import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space / K', action: 'Play / Pause Video' },
  { key: 'F', action: 'Toggle Fullscreen Mode' },
  { key: 'M', action: 'Mute / Unmute Audio' },
  { key: 'Left / Right Arrow', action: 'Seek -5s / +5s' },
  { key: 'Up / Down Arrow', action: 'Volume Gain Up / Down (+5%)' },
  { key: 'J / L', action: 'Seek -10s / +10s' },
  { key: '[ / ]', action: 'Decrease / Increase Playback Speed' },
  { key: 'C', action: 'Cycle Aspect Ratio (Fit, 16:9, 4:3, etc.)' },
  { key: 'V', action: 'Toggle Subtitles On / Off' },
  { key: 'B', action: 'Cycle Equalizer Presets' },
  { key: 'S', action: 'Take Video Snapshot Screenshot' },
  { key: 'Z', action: 'Toggle A-B Segment Repeat Loop' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 text-yellow-400 font-semibold text-lg">
              <Keyboard className="w-5 h-5" />
              <span>Vortex Keyboard Shortcuts</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Vortex Local Video Player • Created by Suhail Akhtar</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="grid grid-cols-1 gap-2">
          {SHORTCUTS.map((sc) => (
            <div
              key={sc.key}
              className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.action}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-cyan-300 font-mono rounded-md shadow-sm font-semibold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Modal Footer Credits */}
        <div className="pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500 font-medium">
          Designed & Developed by <strong className="text-slate-300">Suhail Akhtar</strong>
        </div>
      </div>
    </div>
  );
};
