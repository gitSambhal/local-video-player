import React, { useState } from 'react';
import { X, Camera, Download, Image as ImageIcon, Sparkles, Check } from 'lucide-react';

interface SnapshotGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeSnapshot: () => string | null;
  videoTitle?: string;
}

export const SnapshotGifModal: React.FC<SnapshotGifModalProps> = ({
  isOpen,
  onClose,
  onTakeSnapshot,
  videoTitle = 'video',
}) => {
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCapture = () => {
    const url = onTakeSnapshot();
    if (url) {
      setSnapshotUrl(url);
    }
  };

  const handleDownload = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_frame_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-rose-400 font-semibold text-lg">
            <Camera className="w-5 h-5" />
            <span>Frame Snapshot Capture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capture Action */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleCapture}
            className="p-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all transform hover:scale-[1.02]"
          >
            <Camera className="w-5 h-5" />
            <span>Capture High-Res Frame Snapshot</span>
          </button>

          {/* Preview Image */}
          {snapshotUrl ? (
            <div className="flex flex-col gap-3">
              <div className="border border-slate-700 rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-72">
                <img src={snapshotUrl} alt="Snapshot Preview" className="max-h-72 object-contain" />
              </div>

              <button
                onClick={handleDownload}
                className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG Image</span>
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <ImageIcon className="w-8 h-8 opacity-40" />
              <span>Click button above to freeze & capture full-resolution frame</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
