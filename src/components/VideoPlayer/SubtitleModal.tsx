import React from 'react';
import { SubtitleSettings, SubtitleTrack } from '../../types';
import { parseSubtitleText } from '../../utils/srtParser';
import { X, Subtitles, Upload, FileText, Check, Plus } from 'lucide-react';

interface SubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitleSettings: SubtitleSettings;
  subtitleTracks: SubtitleTrack[];
  onUpdateSubtitleSettings: (settings: SubtitleSettings) => void;
  onAddSubtitleTrack: (track: SubtitleTrack) => void;
}

const SUBTITLE_COLORS = ['#FFFFFF', '#FFE600', '#00FFFF', '#00FF66', '#FF007A', '#FF9900'];

export const SubtitleModal: React.FC<SubtitleModalProps> = ({
  isOpen,
  onClose,
  subtitleSettings,
  subtitleTracks,
  onUpdateSubtitleSettings,
  onAddSubtitleTrack,
}) => {
  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-lg">
            <Subtitles className="w-5 h-5" />
            <span>Subtitle & Closed Caption Manager</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Toggle & Load Custom File */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-sm font-semibold text-slate-200">Enable Subtitles Overlay</span>
            <input
              type="checkbox"
              checked={subtitleSettings.enabled}
              onChange={(e) => onUpdateSubtitleSettings({ ...subtitleSettings, enabled: e.target.checked })}
              className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          {/* Upload SRT/VTT File button */}
          <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-950/40 hover:bg-cyan-950/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center">
            <Upload className="w-6 h-6 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">Load Subtitle File (.srt, .vtt, .sub, .ass)</span>
            <span className="text-[10px] text-slate-400">Click to browse or drag local subtitle file here</span>
            <input type="file" accept=".srt,.vtt,.sub,.ass" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Tracks Selector */}
        {subtitleTracks.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400">Available Tracks</span>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              <button
                onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, activeTrackId: null })}
                className={`p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-colors ${
                  subtitleSettings.activeTrackId === null
                    ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>None / Off</span>
                {subtitleSettings.activeTrackId === null && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              {subtitleTracks.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, activeTrackId: tr.id, enabled: true })}
                  className={`p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-colors ${
                    subtitleSettings.activeTrackId === tr.id
                      ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>{tr.label} ({tr.cues?.length || 0} cues)</span>
                  </div>
                  {subtitleSettings.activeTrackId === tr.id && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtitle Sync & Style Customization */}
        <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
          <span className="text-xs font-semibold text-slate-400">Subtitle Sync & Typography</span>

          {/* Sync Delay */}
          <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Subtitle Sync Delay</span>
              <span className="font-mono text-cyan-400">{subtitleSettings.delay > 0 ? `+${subtitleSettings.delay}` : subtitleSettings.delay}s</span>
            </div>
            <input
              type="range"
              min="-5.0"
              max="5.0"
              step="0.1"
              value={subtitleSettings.delay}
              onChange={(e) => onUpdateSubtitleSettings({ ...subtitleSettings, delay: parseFloat(e.target.value) })}
              className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Font Size & Bottom Offset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Font Size</span>
                <span className="font-mono text-cyan-400">{subtitleSettings.fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="42"
                value={subtitleSettings.fontSize}
                onChange={(e) => onUpdateSubtitleSettings({ ...subtitleSettings, fontSize: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Vertical Offset</span>
                <span className="font-mono text-cyan-400">{subtitleSettings.bottomOffset}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                value={subtitleSettings.bottomOffset}
                onChange={(e) => onUpdateSubtitleSettings({ ...subtitleSettings, bottomOffset: Number(e.target.value) })}
                className="accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Colors Palette & Background Opacity */}
          <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300">Text Color Palette</span>
            <div className="flex items-center gap-3">
              {SUBTITLE_COLORS.map((clr) => (
                <button
                  key={clr}
                  onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, color: clr })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    subtitleSettings.color === clr ? 'scale-110 border-cyan-400 ring-2 ring-cyan-500/50' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: clr }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
