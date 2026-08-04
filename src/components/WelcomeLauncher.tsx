import React, { useState } from 'react';
import { MediaItem } from '../types';
import { SAMPLE_MEDIA_LIST } from '../data/sampleMedia';
import {
  Upload,
  Link as LinkIcon,
  Tv,
  Play,
  Clock,
  Volume2,
  Languages,
  Film,
  Trash2,
  Search,
  Plus,
  Info,
  ChevronRight,
  ShieldCheck,
  Check,
  Sparkles,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'home' | 'movies' | 'iptv' | 'multiaudio' | 'myList'>('home');
  const [showUrlModal, setShowUrlModal] = useState(false);

  // Hero item fallback (default to Tears of Steel or top recent)
  const heroMedia: MediaItem = recentMedia[0] || {
    id: 'hero-1',
    title: 'Tears of Steel (Multi-Audio Special Edition)',
    src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    type: 'sample',
    format: 'Multi-Audio HLS',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    description: 'In a dystopian future, a group of scientists and soldiers gather at Oude Kerk in Amsterdam to stage a desperate rescue attempt using quantum time anchors and multi-channel audio synthesis.',
  };

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
    const mediaItem: MediaItem & { fileObj?: File } = {
      id: `file-${Date.now()}`,
      title: file.name,
      src: objectUrl,
      type: 'file',
      fileType: file.type,
      format: isAudio ? 'AUDIO' : file.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: file.size,
      addedAt: Date.now(),
      isAudioOnly: isAudio,
      fileObj: file,
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
      title: streamTitle.trim() || src.split('/').pop()?.split('?')[0] || 'Network Stream',
      src,
      type: 'url',
      format: isHls ? 'HLS Stream' : isAudio ? 'AUDIO' : 'MP4 Web',
      addedAt: Date.now(),
      isAudioOnly: isAudio,
      isLive: isHls,
    };
    onSelectMedia(mediaItem);
    setStreamUrl('');
    setStreamTitle('');
    setShowUrlModal(false);
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

  const filteredSamples = SAMPLE_MEDIA_LIST.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[#141414] text-neutral-100 font-sans selection:bg-red-600 selection:text-white relative overflow-x-hidden"
    >
      {/* Netflix Top Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/60 to-transparent px-4 sm:px-12 py-3.5 flex items-center justify-between transition-all duration-300 backdrop-blur-sm">
        {/* Left: Netflix Red Logo & Category Tabs */}
        <div className="flex items-center gap-6 sm:gap-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveCategory('home')}>
            <span className="text-red-600 font-black text-2xl sm:text-3xl tracking-tighter uppercase font-serif drop-shadow-md">
              VORTEX
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded hidden sm:inline-block">
              NETFLIX UI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-300">
            <button
              onClick={() => setActiveCategory('home')}
              className={`transition-colors hover:text-white ${activeCategory === 'home' ? 'text-white font-bold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveCategory('movies')}
              className={`transition-colors hover:text-white ${activeCategory === 'movies' ? 'text-white font-bold' : ''}`}
            >
              Sample Movies
            </button>
            <button
              onClick={() => onOpenIPTV('https://iptv-org.github.io/iptv/index.m3u')}
              className="transition-colors hover:text-white flex items-center gap-1.5"
            >
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span>Live IPTV</span>
            </button>
            <button
              onClick={() => setActiveCategory('multiaudio')}
              className={`transition-colors hover:text-white flex items-center gap-1.5 ${activeCategory === 'multiaudio' ? 'text-white font-bold' : ''}`}
            >
              <Languages className="w-3.5 h-3.5 text-red-500" />
              <span>Multi-Audio</span>
            </button>
            {recentMedia.length > 0 && (
              <button
                onClick={() => setActiveCategory('myList')}
                className={`transition-colors hover:text-white ${activeCategory === 'myList' ? 'text-white font-bold' : ''}`}
              >
                My Recents ({recentMedia.length})
              </button>
            )}
          </div>
        </div>

        {/* Right: Search, Upload Local, Stream URL, Profile Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Titles, audio tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-900/90 border border-neutral-700/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 w-44 lg:w-60 transition-all"
            />
          </div>

          {/* Open Stream URL Modal trigger */}
          <button
            onClick={() => setShowUrlModal(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Play Stream / M3U Link"
          >
            <LinkIcon className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden lg:inline">Stream URL</span>
          </button>

          {/* Upload File Button */}
          <label className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/50 transition-all transform active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Movie</span>
            <input
              type="file"
              accept="video/*,audio/*,.m3u,.m3u8,.mp4,.mkv,.webm,.mp3,.wav,.flac"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Profile Avatar */}
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-red-700 to-red-500 text-white font-black text-xs flex items-center justify-center border border-red-400/50 shadow-md">
            S
          </div>
        </div>
      </nav>

      {/* Hero Billboard Feature Banner (Netflix style) */}
      <div className="relative w-full h-[65vh] sm:h-[75vh] flex items-end pb-12 sm:pb-16 px-4 sm:px-12 z-10 overflow-hidden">
        {/* Background Image & Vignette Gradients */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={
              heroMedia.thumbnail ||
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80'
            }
            alt={heroMedia.title}
            className="w-full h-full object-cover object-center opacity-65 scale-105"
          />
          {/* Netflix Top & Bottom Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-[#141414]/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl flex flex-col gap-3.5 animate-fade-in">
          {/* Netflix N Badge */}
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-black text-xl tracking-tighter font-serif">N</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-300">
              FEATURED STREAM • DUAL AUDIO
            </span>
          </div>

          {/* Hero Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-xl">
            {heroMedia.title}
          </h1>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-300 font-medium">
            <span className="text-emerald-400 font-bold">99% Match</span>
            <span className="px-1.5 py-0.5 rounded border border-neutral-600 text-[10px] font-mono text-neutral-300">
              16+
            </span>
            <span className="px-1.5 py-0.5 rounded border border-neutral-600 text-[10px] font-mono text-neutral-300">
              4K Ultra HD
            </span>
            <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700/60 text-[10px] font-bold">
              Multi-Language Dubbed
            </span>
            <span>2024</span>
          </div>

          {/* Hero Description */}
          <p className="text-xs sm:text-sm text-neutral-300/90 line-clamp-3 leading-relaxed drop-shadow-md">
            {heroMedia.description ||
              'High-fidelity media playback with embedded multi-audio stream extraction, custom HLS streaming engine, and subtitle controls.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onSelectMedia(heroMedia)}
              className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-md bg-white hover:bg-neutral-200 text-black font-extrabold text-sm flex items-center gap-2.5 shadow-xl transition-all transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current text-black" />
              <span>Play Now</span>
            </button>

            <label className="px-5 py-2.5 sm:py-3 rounded-md bg-neutral-800/80 hover:bg-neutral-700/90 border border-neutral-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg backdrop-blur-md cursor-pointer transition-all transform active:scale-95">
              <Upload className="w-4 h-4 text-red-500" />
              <span>Open Local Movie</span>
              <input
                type="file"
                accept="video/*,audio/*,.m3u,.m3u8,.mp4,.mkv,.webm,.mp3,.wav,.flac"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </label>

            <button
              onClick={() => onOpenIPTV('https://iptv-org.github.io/iptv/index.m3u')}
              className="px-4 py-2.5 sm:py-3 rounded-md bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-all hidden sm:flex"
            >
              <Tv className="w-4 h-4 text-red-500" />
              <span>Live TV Index</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Local File Banner */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md border-4 border-dashed border-red-600 flex flex-col items-center justify-center p-8 animate-fade-in text-center">
          <Upload className="w-16 h-16 text-red-500 animate-bounce mb-4" />
          <h2 className="text-2xl font-black text-white">Drop Your Video File Here</h2>
          <p className="text-sm text-neutral-400 max-w-md mt-2">
            Supports .mp4, .mkv, .webm, .avi, multi-audio MKV streams, .m3u playlists, and audio files.
          </p>
        </div>
      )}

      {/* Main Content Rows (Netflix Style Carousels) */}
      <div className="relative z-20 px-4 sm:px-12 -mt-8 flex flex-col gap-10 pb-20">
        {/* ROW 1: Continue Watching / Recent History */}
        {recentMedia.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span>Continue Watching</span>
              </h2>
              <button
                onClick={onClearRecents}
                className="text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none">
              {recentMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="group relative shrink-0 w-52 sm:w-60 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30 hover:border-neutral-600 hover:shadow-2xl"
                >
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-neutral-400 hover:text-red-500 transition-colors z-20 opacity-0 group-hover:opacity-100"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-full h-32 bg-neutral-950 relative overflow-hidden">
                    <img
                      src={
                        item.thumbnail ||
                        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Netflix Bottom Progress Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                      <div className="h-full bg-red-600 w-2/3" />
                    </div>
                  </div>

                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-xs font-bold text-neutral-100 truncate group-hover:text-red-400 transition-colors">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                      <span className="font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-300 uppercase">
                        {item.format || 'MEDIA'}
                      </span>
                      <span>Resume</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROW 2: Trending Now on Vortex (Sample Movie Catalog) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              <span>Trending Now on Vortex</span>
            </h2>
            <span className="text-xs text-neutral-500">Sample Catalog</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {filteredSamples.map((sample, idx) => (
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
                className="group relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30 hover:border-neutral-600 hover:shadow-2xl flex flex-col"
              >
                {/* Poster Thumbnail */}
                <div className="w-full h-40 sm:h-48 bg-neutral-950 relative overflow-hidden">
                  <img
                    src={sample.thumbnail}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Multi-Audio Badge */}
                  {sample.title.toLowerCase().includes('multi-audio') && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white shadow-md">
                      DUAL AUDIO
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5 bg-neutral-900 flex-1 justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-100 group-hover:text-red-400 transition-colors line-clamp-1">
                      {sample.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-950 text-neutral-300 border border-neutral-800 font-semibold">
                      {sample.format}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold ml-auto">98% Match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3: IPTV Live TV & Global Channels */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 text-red-500 border border-red-800/50 flex items-center justify-center shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live IPTV Channel Explorer</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Stream 10,000+ open global TV channels (Sports, News, Movies, Music) via M3U playlist indexing.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenIPTV('https://iptv-org.github.io/iptv/index.m3u')}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg transition-all active:scale-95"
          >
            <Tv className="w-4 h-4" />
            <span>Launch IPTV Guide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stream URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-neutral-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <LinkIcon className="w-4 h-4 text-red-500" />
                <span>Open Stream or M3U Playlist URL</span>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStreamSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-300">Stream or Playlist Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/stream.m3u8 or .mp4"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-300">Stream Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. My Favorite Movie"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Stream</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black/90 px-4 sm:px-12 py-8 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 relative">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span>Vortex Player • Netflix Redesign</span>
        </div>
        <div>
          Designed & Built with ❤️ by <strong className="text-neutral-300 font-bold">Suhail Akhtar</strong>
        </div>
      </footer>
    </div>
  );
};
