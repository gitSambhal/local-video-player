import React, { useState, useEffect } from 'react';
import { IPTVChannel, M3UPlaylist, MediaItem } from '../../types';
import { fetchAndParseM3U, parseM3U } from '../../utils/m3uParser';
import { Radio, Search, Sparkles, Loader2, Play, AlertCircle, Tv, RefreshCw, Layers } from 'lucide-react';

interface IPTVManagerProps {
  onSelectChannel: (media: MediaItem) => void;
  onClose?: () => void;
  initialUrl?: string;
}

const PRESET_PLAYLISTS = [
  {
    name: 'IPTV-Org Main Index',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    desc: 'Worldwide open IPTV playlist index containing news, music, & entertainment.',
  },
  {
    name: 'IPTV-Org News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    desc: '24/7 global live news streams in English & international languages.',
  },
  {
    name: 'IPTV-Org Music',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    desc: 'Live music video channels, concerts, and radio broadcasts.',
  },
  {
    name: 'IPTV-Org Movies & Series',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    desc: 'Classic cinema, independent films, and entertainment channels.',
  },
  {
    name: 'IPTV-Org Animation & Kids',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    desc: 'Animated cartoons, anime, and family entertainment.',
  },
];

export const IPTVManager: React.FC<IPTVManagerProps> = ({ onSelectChannel, onClose, initialUrl }) => {
  const [playlistUrl, setPlaylistUrl] = useState<string>(initialUrl || 'https://iptv-org.github.io/iptv/index.m3u');
  const [playlist, setPlaylist] = useState<M3UPlaylist | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const loadPlaylist = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAndParseM3U(url);
      setPlaylist(result);
      if (result.categories.length > 0) {
        setSelectedCategory('All');
      }
    } catch (err: any) {
      console.error('Failed to load IPTV playlist:', err);
      setError(err?.message || 'Failed to fetch M3U playlist. Check the URL or CORS access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist(playlistUrl);
  }, []);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistUrl.trim()) {
      loadPlaylist(playlistUrl.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const channels = parseM3U(text);
        const categories = Array.from(new Set(channels.map((c) => c.group || 'General'))).sort();
        setPlaylist({
          url: file.name,
          title: file.name,
          channels,
          categories,
        });
      } catch (err: any) {
        setError('Failed to parse uploaded M3U file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleChannelClick = (channel: IPTVChannel) => {
    const mediaItem: MediaItem = {
      id: channel.id,
      title: channel.name,
      src: channel.url,
      type: 'url',
      format: 'HLS IPTV Live',
      addedAt: Date.now(),
      thumbnail:
        channel.logo ||
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
      group: channel.group,
      isLive: true,
    };
    onSelectChannel(mediaItem);
    if (onClose) onClose();
  };

  const filteredChannels = (playlist?.channels || []).filter((ch) => {
    const matchesSearch =
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ch.group && ch.group.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || ch.group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-1">
      {/* M3U Input & Presets */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Radio className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              placeholder="Paste M3U Playlist URL (e.g., https://iptv-org.github.io/iptv/index.m3u)..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Load Playlist</span>
          </button>
        </form>

        {/* Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Presets:
          </span>
          {PRESET_PLAYLISTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPlaylistUrl(preset.url);
                loadPlaylist(preset.url);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all border ${
                playlistUrl === preset.url
                  ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
              title={preset.desc}
            >
              {preset.name}
            </button>
          ))}
          <label className="px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer">
            <span>Upload .m3u</span>
            <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-cyan-400 bg-slate-950/40 rounded-xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-semibold text-slate-300">Fetching & parsing IPTV M3U channels...</span>
          <span className="text-[11px] text-slate-500">Connecting to stream sources & organizing categories</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Playlist Loading Failed</span>
          </div>
          <p className="text-[11px] text-rose-400/90">{error}</p>
          <button
            onClick={() => loadPlaylist(playlistUrl)}
            className="self-start px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg text-[11px] font-semibold transition-all mt-1"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Channels View */}
      {!loading && !error && playlist && (
        <div className="flex flex-col gap-3">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                {playlist.channels.length} Live Channels Available
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search channel name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Category Chips */}
          {playlist.categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-cyan-600 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All ({playlist.channels.length})
              </button>
              {playlist.categories.map((cat, idx) => {
                const count = playlist.channels.filter((c) => c.group === cat).length;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-600 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredChannels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-xs text-slate-500">
                No IPTV channels match your search filter.
              </div>
            ) : (
              filteredChannels.slice(0, 150).map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => handleChannelClick(ch)}
                  className="group bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-md"
                >
                  <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                        className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-700/50 p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-700/40 text-cyan-400 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                        {ch.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-mono">
                          {ch.group || 'Live'}
                        </span>
                        {ch.language && <span className="uppercase">{ch.language}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-slate-950 transition-all shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
