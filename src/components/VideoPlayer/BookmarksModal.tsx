import React, { useState } from 'react';
import { Bookmark } from '../../types';
import { X, Bookmark as BookmarkIcon, Plus, Trash2, Clock, Play } from 'lucide-react';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  currentTime: number;
  mediaId: string;
  onAddBookmark: (title: string, note?: string) => void;
  onDeleteBookmark: (id: string) => void;
  onSeekTo: (seconds: number) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  currentTime,
  mediaId,
  onAddBookmark,
  onDeleteBookmark,
  onSeekTo,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  if (!isOpen) return null;

  const currentMediaBookmarks = bookmarks.filter((b) => b.mediaId === mediaId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const title = titleInput.trim() || `Bookmark at ${formatTime(currentTime)}`;
    onAddBookmark(title, noteInput.trim() || undefined);
    setTitleInput('');
    setNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-lg">
            <BookmarkIcon className="w-5 h-5 fill-amber-400/20" />
            <span>Timestamp Bookmarks</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Bookmark Form */}
        <form onSubmit={handleCreate} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Bookmark Frame Timestamp</span>
            <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
              {formatTime(currentTime)}
            </span>
          </div>

          <input
            type="text"
            placeholder="Bookmark Label / Chapter Title..."
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <input
            type="text"
            placeholder="Optional Note or Key Takeaway..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-1 shadow-md shadow-amber-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Save Bookmark ({formatTime(currentTime)})</span>
          </button>
        </form>

        {/* Bookmarks List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-400">Saved Bookmarks ({currentMediaBookmarks.length})</span>
          {currentMediaBookmarks.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
              No bookmarks saved for this media item yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {currentMediaBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 transition-all"
                >
                  <div
                    onClick={() => {
                      onSeekTo(bm.timestamp);
                      onClose();
                    }}
                    className="flex flex-col flex-1 cursor-pointer overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mono text-cyan-400">{formatTime(bm.timestamp)}</span>
                      <span className="truncate">{bm.title}</span>
                    </div>
                    {bm.note && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{bm.note}</p>}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onSeekTo(bm.timestamp);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-500/30 text-xs flex items-center gap-1"
                      title="Seek to Timestamp"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[10px] hidden sm:inline">Jump</span>
                    </button>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900 transition-colors"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
