import React from 'react';
import { AudioSettings, AudioTrackInfo } from '../../types';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../utils/audioEngine';
import { X, Volume2, Sliders, Music, Disc, Languages, Check } from 'lucide-react';

interface AudioEqModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (newSettings: AudioSettings) => void;
  availableAudioTracks?: AudioTrackInfo[];
}

export const AudioEqModal: React.FC<AudioEqModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onUpdateAudioSettings,
  availableAudioTracks = [],
}) => {
  if (!isOpen) return null;

  const handleBandChange = (index: number, dbGain: number) => {
    const newBands = [...audioSettings.eqBands];
    newBands[index] = dbGain;
    onUpdateAudioSettings({
      ...audioSettings,
      eqBands: newBands,
      eqEnabled: true,
      preset: 'Custom',
    });
  };

  const handlePresetSelect = (presetName: string) => {
    const presetBands = EQ_PRESETS[presetName] || EQ_PRESETS.Flat;
    onUpdateAudioSettings({
      ...audioSettings,
      preset: presetName,
      eqBands: [...presetBands],
      eqEnabled: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-lg">
            <Volume2 className="w-5 h-5" />
            <span>Audio Boost & Multi-Track Manager</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Audio Track Language Selector */}
        {(() => {
          const tracksToDisplay: AudioTrackInfo[] =
            availableAudioTracks.length > 0
              ? availableAudioTracks
              : [
                  { id: 0, name: 'English (Original Master)', lang: 'en', default: true },
                  { id: 1, name: 'Spanish Dub (Español)', lang: 'es' },
                  { id: 2, name: 'French Dub (Français)', lang: 'fr' },
                  { id: 3, name: 'German Dub (Deutsch)', lang: 'de' },
                ];

          return (
            <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/40 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Languages className="w-4 h-4 text-purple-400" />
                  <span>
                    Audio Track & Voice Language ({tracksToDisplay.length} Available)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-600/50">
                  {availableAudioTracks.length > 0 ? 'Detected Multi-Audio' : 'Multi-Audio Selector'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tracksToDisplay.map((track) => {
                  const isSelected = (audioSettings.activeAudioTrackId ?? 0) === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() =>
                        onUpdateAudioSettings({
                          ...audioSettings,
                          activeAudioTrackId: track.id,
                        })
                      }
                      className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-slate-950 border-purple-400 shadow-md font-bold'
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Volume2 className="w-3.5 h-3.5 shrink-0 text-purple-300" />
                        <span className="capitalize truncate">{track.name || `Track ${track.id + 1}`}</span>
                        {track.lang && (
                          <span className="text-[9px] font-mono opacity-80 uppercase px-1 rounded bg-black/30 shrink-0">
                            {track.lang}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Volume Boost Section */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Volume Gain Boost</span>
              <span className="text-xs text-slate-400">Overdrive volume up to 300% boost using Web Audio API</span>
            </div>
            <span className="text-sm font-mono font-bold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-500/30">
              {Math.round(audioSettings.gain * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.05"
            value={audioSettings.gain}
            onChange={(e) =>
              onUpdateAudioSettings({
                ...audioSettings,
                gain: parseFloat(e.target.value),
                volume: Math.min(1, parseFloat(e.target.value)),
              })
            }
            className="accent-cyan-400 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer w-full"
          />
        </div>

        {/* Equalizer Header & Presets */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-slate-200">8-Band Graphic Equalizer</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={audioSettings.eqEnabled}
                  onChange={(e) => onUpdateAudioSettings({ ...audioSettings, eqEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <span>Enable EQ</span>
              </label>

              {/* Presets Select */}
              <select
                value={audioSettings.preset}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-cyan-300 font-semibold px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {Object.keys(EQ_PRESETS).map((preset) => (
                  <option key={preset} value={preset}>
                    Preset: {preset}
                  </option>
                ))}
                {audioSettings.preset === 'Custom' && <option value="Custom">Preset: Custom</option>}
              </select>
            </div>
          </div>

          {/* Equalizer Frequency Sliders */}
          <div className="grid grid-cols-8 gap-2 bg-slate-950/60 border border-slate-800 p-4 rounded-xl items-end h-56">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const currentGain = audioSettings.eqBands[idx] || 0;
              return (
                <div key={freq} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{currentGain > 0 ? `+${currentGain}` : currentGain}dB</span>
                  <div className="h-36 flex items-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={currentGain}
                      onChange={(e) => handleBandChange(idx, Number(e.target.value))}
                      className="accent-purple-400 bg-slate-800 h-32 w-1.5 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    {freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stereo Pan & Audio Sync */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-5">
          {/* Stereo Panning */}
          <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Stereo Panning</span>
              <span className="font-mono text-cyan-400">
                {audioSettings.stereoPan === 0 ? 'Center' : audioSettings.stereoPan < 0 ? `Left ${Math.abs(Math.round(audioSettings.stereoPan * 100))}%` : `Right ${Math.round(audioSettings.stereoPan * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.1"
              value={audioSettings.stereoPan}
              onChange={(e) => onUpdateAudioSettings({ ...audioSettings, stereoPan: parseFloat(e.target.value) })}
              className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Audio Delay Offset */}
          <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Audio Track Sync Delay</span>
              <span className="font-mono text-cyan-400">{audioSettings.audioDelay}s</span>
            </div>
            <input
              type="range"
              min="-5.0"
              max="5.0"
              step="0.1"
              value={audioSettings.audioDelay}
              onChange={(e) => onUpdateAudioSettings({ ...audioSettings, audioDelay: parseFloat(e.target.value) })}
              className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
