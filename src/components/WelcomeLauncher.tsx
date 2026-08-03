import React, { useState } from 'react';
import { MediaItem, SampleMedia } from '../types';
import { SAMPLE_MEDIA_LIST } from '../data/sampleMedia';
import {
  Upload,
  Link,
  Tv,
  Radio,
  Sparkles,
  Play,
  Clock,
  Volume2,
  FileVideo,
  Languages,
  Film,
  Music,
  Globe,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface WelcomeLauncherProps {
  onSelectMedia: (media: MediaItem) => void;
  onOpenIPTV: (initialUrl?: string) => void;
  recentMedia: MediaItem[];
  onRemoveRecent: (id: string) => void;
  onClearRecents: () => void;
}

export const WelcomeLauncher: React.FC<WelcomeLauncherProps> = ({
  onSelectMedia,
  onOpenIPTV,
  recentMedia,
  onRemoveRecent,
  onClearRecents,
}) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const isM3u = file.name.endsWith('.m3u') || file.name.endsWith('.m3u8');
    if (isM3u) {
      onOpenIPTV();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const isAudio = file.type.startsWith('audio');
    const mediaItem: MediaItem = {
      id: `file-${Date.now()}`,
      title: file.name,
      src: objectUrl,
      type: 'file',
      fileType: file.type,
      format: isAudio ? 'AUDIO' : file.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: file.size,
      addedAt: Date.now(),
      isAudioOnly: isAudio,
    };
    onSelectMedia(mediaItem);
  };

  const handleStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    const src = streamUrl.trim();
    const isM3uPlaylist = src.includes('.m3u') || src.includes('iptv') || src.includes('index.m3u');

    if (isM3uPlaylist && !src.endsWith('.m3u8')) {
      onOpenIPTV(src);
      return;
    }

    const isHls = src.includes('.m3u8') || src.includes('.m3u');
    const isAudio = src.endsWith('.mp3') || src.endsWith('.wav') || src.endsWith('.flac');

    const mediaItem: MediaItem = {
      id: `url-${Date.now()}`,
      title: streamTitle.trim() || src.split('/').pop()?.split('?')[0] || 'Stream Link',
      src,
      type: 'url',
      format: isHls ? 'HLS Stream' : isAudio ? 'AUDIO' : 'MP4/Web',
      addedAt: Date.now(),
      isAudioOnly: isAudio,
      isLive: isHls,
    };
    onSelectMedia(mediaItem);
    setStreamUrl('');
    setStreamTitle('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col gap-8 my-auto py-6">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide shadow-lg shadow-cyan-950/50">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>VLC Web Engine & Multi-Track IPTV Player</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Open File or <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">Stream Link</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Select a media file from your device, paste an HLS stream / M3U playlist, or pick a video with <strong className="text-cyan-300">multi-audio tracks</strong> to get started.
          </p>
        </div>

        {/* Core Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Drag & Drop / Local File Upload */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative group bg-slate-900/80 backdrop-blur-md border ${
              isDragging ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-cyan-500/60'
            } rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between gap-4`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Local Storage
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                Browse & Open Local Media
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Drag and drop or select video files (.mp4, .mkv, .webm, .avi), audio tracks (.mp3, .flac), or .m3u playlists.
              </p>
            </div>

            <label className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/60 transition-all transform active:scale-[0.98]">
              <FileVideo className="w-4 h-4" />
              <span>Choose Media File...</span>
              <input
                type="file"
                accept="video/*,audio/*,.m3u,.m3u8,.mp4,.mkv,.webm,.mp3,.wav,.flac"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {/* Card 2: Stream URL & M3U Link Input */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-700/50 shadow-inner">
                <Link className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Network Stream
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-100">Play URL or M3U Stream</h2>
              <p className="text-xs text-slate-400 mt-1">
                Paste any live HTTP/HLS stream link (.m3u8), direct video URL, or M3U IPTV index URL.
              </p>
            </div>

            <form onSubmit={handleStreamSubmit} className="flex flex-col gap-2">
              <input
                type="url"
                required
                placeholder="https://example.com/live/stream.m3u8..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Open Stream / M3U Link</span>
              </button>
            </form>
          </div>
        </div>

        {/* Section: IPTV Channels & Multi-Audio Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action: Open IPTV Browser */}
          <div
            onClick={() => onOpenIPTV('https://iptv-org.github.io/iptv/index.m3u')}
            className="group cursor-pointer bg-gradient-to-br from-slate-900/90 to-cyan-950/30 border border-cyan-800/40 hover:border-cyan-400 p-5 rounded-2xl transition-all shadow-lg flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                <Tv className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                IPTV Live Channels Index
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Browse thousands of open TV channels (News, Movies, Music, Sports) via global M3U playlists.
              </p>
            </div>
          </div>

          {/* Featured Multi-Audio 1 */}
          <div
            onClick={() => {
              onSelectMedia({
                id: 'sample-multi-1',
                title: 'Tears of Steel (Multi-Audio HLS: EN, ES, FR, DE)',
                src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
                type: 'sample',
                format: 'Multi-Audio HLS',
                addedAt: Date.now(),
                thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
                description: 'Sci-Fi test video with 4 selectable audio tracks (English, Spanish, French, German).',
              });
            }}
            className="group cursor-pointer bg-gradient-to-br from-slate-900/90 to-purple-950/30 border border-purple-800/40 hover:border-purple-400 p-5 rounded-2xl transition-all shadow-lg flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-950 text-purple-400 border border-purple-700/50">
                <Languages className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-700/60 font-bold">
                4 Audio Tracks
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                Tears of Steel (Multi-Audio)
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Switch dynamically between English, Spanish, French & German voice tracks.
              </p>
            </div>
          </div>

          {/* Featured Multi-Audio 2 */}
          <div
            onClick={() => {
              onSelectMedia({
                id: 'sample-multi-2',
                title: 'Sintel Multi-Audio Stream (EN, DE, FR, ES)',
                src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
                type: 'sample',
                format: 'Multi-Audio HLS',
                addedAt: Date.now(),
                thumbnail: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80',
                description: 'Fantasy quest film with multi-language HLS audio track selection.',
              });
            }}
            className="group cursor-pointer bg-gradient-to-br from-slate-900/90 to-teal-950/30 border border-teal-800/40 hover:border-teal-400 p-5 rounded-2xl transition-all shadow-lg flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-teal-950 text-teal-400 border border-teal-700/50">
                <Volume2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-700/60 font-bold">
                Multi-Lang
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                Sintel Fantasy (Multi-Audio)
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Test audio track switching with multi-channel sound and language options.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Sample Media Catalog */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Sample Media & Test Videos
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">1-Click Instant Load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_MEDIA_LIST.map((sample, idx) => (
              <div
                key={idx}
                onClick={() =>
                  onSelectMedia({
                    id: `sample-${idx}`,
                    title: sample.title,
                    src: sample.src,
                    type: 'sample',
                    format: sample.format,
                    addedAt: Date.now(),
                    thumbnail: sample.thumbnail,
                    description: sample.description,
                  })
                }
                className="group bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all shadow-md"
              >
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-700/60"
                />
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                    {sample.title}
                  </span>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{sample.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-950 text-cyan-300 border border-slate-700 font-semibold">
                      {sample.format}
                    </span>
                    {sample.title.toLowerCase().includes('multi-audio') && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-950 text-purple-300 font-semibold">
                        Multi-Audio
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-slate-950 transition-all shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Recent History */}
        {recentMedia.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Recently Opened</h2>
              </div>
              <button
                onClick={onClearRecents}
                className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Recents</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {recentMedia.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="group shrink-0 w-44 bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-2.5 flex flex-col gap-2 cursor-pointer transition-all shadow-md relative"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-950/80 text-slate-400 hover:text-rose-400 transition-colors z-10"
                    title="Remove from recents"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <div className="w-full h-20 rounded-lg bg-slate-950 overflow-hidden relative">
                    <img
                      src={
                        item.thumbnail ||
                        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center">
                      <div className="p-2 rounded-full bg-cyan-500/90 text-slate-950 shadow-md transform group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
