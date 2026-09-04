import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IPTVChannel, M3UPlaylist, MediaItem, ChannelHealthInfo, ChannelHealthStatus } from '../../types';
import { fetchAndParseM3U, parseM3U } from '../../utils/m3uParser';
import {
  checkChannelHealth,
  batchCheckChannels,
  getCachedChannelHealth,
} from '../../utils/channelHealth';
import {
  Radio,
  Search,
  Sparkles,
  Loader2,
  Play,
  AlertCircle,
  Tv,
  RefreshCw,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  Activity,
  Wifi,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Zap,
  Check,
  StopCircle,
  Globe,
  Tag,
} from 'lucide-react';

interface IPTVManagerProps {
  onSelectChannel: (media: MediaItem) => void;
  onBack?: () => void;
  onClose?: () => void;
  currentPlayingMedia?: MediaItem | null;
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
    name: 'IPTV-Org Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    desc: 'Live sports broadcasts, racing, outdoor sports, and events.',
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
    name: 'IPTV-Org Entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    desc: 'General entertainment, lifestyle, reality TV, and variety shows.',
  },
  {
    name: 'IPTV-Org Documentary',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    desc: 'Science, history, nature, space, and wildlife channels.',
  },
  {
    name: 'IPTV-Org Animation & Kids',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    desc: 'Animated cartoons, anime, and family entertainment.',
  },
  {
    name: 'IPTV-Org English TV',
    url: 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    desc: 'All open English language channels from around the world.',
  },
  {
    name: 'IPTV-Org United States',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    desc: 'Open United States TV & local broadcast channels.',
  },
  {
    name: 'IPTV-Org United Kingdom',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    desc: 'United Kingdom TV & news channels.',
  },
  {
    name: 'IPTV-Org India',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    desc: 'India TV, news, regional & entertainment broadcasts.',
  },
];

type HealthFilter = 'all' | 'online' | 'offline' | 'untested';
type SortOption = 'health-first' | 'latency' | 'name' | 'category';
type ViewMode = 'grid' | 'list';

export const IPTVManager: React.FC<IPTVManagerProps> = ({
  onSelectChannel,
  onBack,
  onClose,
  currentPlayingMedia,
  initialUrl,
}) => {
  const [playlistUrl, setPlaylistUrl] = useState<string>(
    initialUrl || 'https://iptv-org.github.io/iptv/index.m3u'
  );
  const [playlist, setPlaylist] = useState<M3UPlaylist | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and views
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('health-first');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Channel health storage: map channel id/url -> ChannelHealthInfo
  const [healthMap, setHealthMap] = useState<Record<string, ChannelHealthInfo>>({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ checked: number; total: number }>({ checked: 0, total: 0 });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Playlist
  const loadPlaylist = async (url: string) => {
    // Cancel any active scan
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsScanning(false);
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchAndParseM3U(url);
      setPlaylist(result);
      setSelectedCategory('All');
      setSearchQuery('');

      // Populate pre-cached health statuses if any
      const initialHealth: Record<string, ChannelHealthInfo> = {};
      result.channels.forEach((ch) => {
        const cached = getCachedChannelHealth(ch.url);
        if (cached) {
          initialHealth[ch.id] = cached;
        }
      });
      setHealthMap(initialHealth);

      // Automatically auto-check top visible channels (first 15 channels) for immediate feedback!
      setTimeout(() => {
        autoScanTopChannels(result.channels.slice(0, 15));
      }, 300);
    } catch (err: any) {
      console.error('Failed to load IPTV playlist:', err);
      setError(err?.message || 'Failed to fetch M3U playlist. Check the URL or CORS access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist(playlistUrl);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scan a small set of top channels without locking UI
  const autoScanTopChannels = async (channelsToScan: IPTVChannel[]) => {
    const unverified = channelsToScan.filter((c) => !healthMap[c.id]);
    if (unverified.length === 0) return;

    for (const ch of unverified) {
      try {
        setHealthMap((prev) => ({
          ...prev,
          [ch.id]: { status: 'checking', checkedAt: Date.now() },
        }));
        const health = await checkChannelHealth(ch.url, 3500);
        setHealthMap((prev) => ({
          ...prev,
          [ch.id]: health,
        }));
      } catch {
        setHealthMap((prev) => ({
          ...prev,
          [ch.id]: { status: 'offline', error: 'Probe error', checkedAt: Date.now() },
        }));
      }
    }
  };

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

        // Auto-check top channels
        setTimeout(() => {
          autoScanTopChannels(channels.slice(0, 15));
        }, 300);
      } catch (err: any) {
        setError('Failed to parse uploaded M3U file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Re-check single channel health
  const handleCheckSingleChannel = async (channel: IPTVChannel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setHealthMap((prev) => ({
      ...prev,
      [channel.id]: { status: 'checking', checkedAt: Date.now() },
    }));

    try {
      const health = await checkChannelHealth(channel.url, 4000, true);
      setHealthMap((prev) => ({
        ...prev,
        [channel.id]: health,
      }));
    } catch {
      setHealthMap((prev) => ({
        ...prev,
        [channel.id]: { status: 'offline', error: 'Probe failed', checkedAt: Date.now() },
      }));
    }
  };

  // Batch check visible / filtered channels
  const handleBatchScanHealth = async () => {
    if (isScanning) {
      // Stop current scan
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsScanning(false);
      return;
    }

    if (!playlist || filteredChannels.length === 0) return;

    // Scan up to 50 channels at a time to prevent browser flooding
    const targetChannels = filteredChannels.slice(0, 50);
    setIsScanning(true);
    setScanProgress({ checked: 0, total: targetChannels.length });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let count = 0;
    try {
      await batchCheckChannels(
        targetChannels.map((c) => ({ id: c.id, url: c.url })),
        (channelId, info) => {
          setHealthMap((prev) => ({
            ...prev,
            [channelId]: info,
          }));
          if (info.status !== 'checking') {
            count++;
            setScanProgress({ checked: count, total: targetChannels.length });
          }
        },
        controller.signal,
        4
      );
    } catch (err) {
      console.warn('Batch scan interrupted', err);
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleChannelClick = (channel: IPTVChannel) => {
    const health = healthMap[channel.id];
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
    if (onBack) onBack();
    else if (onClose) onClose();
  };

  // Calculate health counters
  const healthStats = useMemo(() => {
    if (!playlist) return { online: 0, offline: 0, checking: 0, untested: 0, total: 0 };
    let online = 0;
    let offline = 0;
    let checking = 0;
    let untested = 0;

    playlist.channels.forEach((ch) => {
      const h = healthMap[ch.id];
      if (!h || h.status === 'untested') {
        untested++;
      } else if (h.status === 'online') {
        online++;
      } else if (h.status === 'offline') {
        offline++;
      } else if (h.status === 'checking') {
        checking++;
      }
    });

    return {
      online,
      offline,
      checking,
      untested,
      total: playlist.channels.length,
    };
  }, [playlist, healthMap]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    if (!playlist) return [];

    return playlist.channels.filter((ch) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        ch.name.toLowerCase().includes(q) ||
        (ch.group && ch.group.toLowerCase().includes(q)) ||
        (ch.language && ch.language.toLowerCase().includes(q)) ||
        (ch.country && ch.country.toLowerCase().includes(q));

      // 2. Category
      const matchesCategory = selectedCategory === 'All' || ch.group === selectedCategory;

      // 3. Health Filter
      const h = healthMap[ch.id]?.status || 'untested';
      let matchesHealth = true;
      if (healthFilter === 'online') matchesHealth = h === 'online';
      else if (healthFilter === 'offline') matchesHealth = h === 'offline';
      else if (healthFilter === 'untested') matchesHealth = h === 'untested';

      return matchesSearch && matchesCategory && matchesHealth;
    });
  }, [playlist, searchQuery, selectedCategory, healthFilter, healthMap]);

  // Sort channels
  const sortedChannels = useMemo(() => {
    const list = [...filteredChannels];

    list.sort((a, b) => {
      const healthA = healthMap[a.id];
      const healthB = healthMap[b.id];

      if (sortOption === 'health-first') {
        // Online > Checking > Untested > Offline
        const priority = (h?: ChannelHealthInfo) => {
          if (!h || h.status === 'untested') return 2;
          if (h.status === 'online') return 1;
          if (h.status === 'checking') return 3;
          return 4; // offline
        };
        const prioA = priority(healthA);
        const prioB = priority(healthB);
        if (prioA !== prioB) return prioA - prioB;
        // Secondary sort: lower latency first
        if (healthA?.status === 'online' && healthB?.status === 'online') {
          return (healthA.latency || 999) - (healthB.latency || 999);
        }
        return a.name.localeCompare(b.name);
      }

      if (sortOption === 'latency') {
        const latA = healthA?.latency ?? 9999;
        const latB = healthB?.latency ?? 9999;
        return latA - latB;
      }

      if (sortOption === 'category') {
        const catA = a.group || '';
        const catB = b.group || '';
        if (catA !== catB) return catA.localeCompare(catB);
        return a.name.localeCompare(b.name);
      }

      // Name (A-Z)
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [filteredChannels, healthMap, sortOption]);

  return (
    <div className="min-h-screen bg-[#0d0d10] text-neutral-100 flex flex-col font-sans select-none selection:bg-red-600 selection:text-white">
      {/* Sticky Full-Page Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          {(onBack || onClose) && (
            <button
              onClick={onBack || onClose}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white flex items-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95 group"
              title={currentPlayingMedia ? 'Back to Video Player' : 'Back to Home'}
            >
              <ArrowLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>{currentPlayingMedia ? 'Back to Video' : 'Back to Home'}</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-950/60 font-black">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Live TV Guide & Channels
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/70 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  HEALTH MONITOR
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Open global IPTV catalog with real-time stream status, ping diagnostics, & CORS proxy failover
              </p>
            </div>
          </div>
        </div>

        {/* Header Right: Batch Scanner & Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          {playlist && (
            <button
              onClick={handleBatchScanHealth}
              disabled={filteredChannels.length === 0}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                isScanning
                  ? 'bg-amber-600/90 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
              title="Test ping and availability for visible channels"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Scanning... ({scanProgress.checked}/{scanProgress.total})</span>
                  <span className="sm:hidden">{scanProgress.checked}/{scanProgress.total}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Probe Channel Health</span>
                  <span className="sm:hidden">Health Check</span>
                </>
              )}
            </button>
          )}

          {currentPlayingMedia && (
            <button
              onClick={onBack || onClose}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">Playing: {currentPlayingMedia.title.slice(0, 16)}...</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Full-Page Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6 flex-1">
        {/* 1. M3U Input & Presets Bar */}
      <div className="bg-neutral-950/90 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-3 shadow-xl">
        <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Radio className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              placeholder="Paste M3U Playlist URL (e.g., https://iptv-org.github.io/iptv/index.m3u)..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 font-mono transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shrink-0 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Load Playlist</span>
          </button>
        </form>

        {/* Preset Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-neutral-400 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-500" /> Presets:
          </span>
          {PRESET_PLAYLISTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPlaylistUrl(preset.url);
                loadPlaylist(preset.url);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium shrink-0 transition-all border ${
                playlistUrl === preset.url
                  ? 'bg-red-950/80 border-red-600 text-white font-bold shadow-sm'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
              }`}
              title={preset.desc}
            >
              {preset.name}
            </button>
          ))}
          <label className="px-3 py-1.5 rounded-lg text-[11px] font-medium shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 cursor-pointer transition-all">
            <span>Upload .m3u</span>
            <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500 bg-neutral-950/60 rounded-2xl border border-neutral-800 shadow-xl">
          <Loader2 className="w-9 h-9 animate-spin" />
          <span className="text-sm font-bold text-neutral-200">Parsing IPTV M3U Channels & Categories...</span>
          <span className="text-xs text-neutral-500">Connecting to stream sources and preparing health probes</span>
        </div>
      )}

      {/* 3. Error State */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>Playlist Loading Failed</span>
          </div>
          <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
          <button
            onClick={() => loadPlaylist(playlistUrl)}
            className="self-start px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md mt-1"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* 4. Main Channels Dashboard with Live Health Diagnostics */}
      {!loading && !error && playlist && (
        <div className="flex flex-col gap-3.5">
          {/* Channel Health Overview Bar */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
            {/* Left: Health Statistics Counters */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <Tv className="w-4 h-4 text-red-500" />
                <span className="font-bold text-neutral-200">{playlist.channels.length} Total</span>
              </div>

              {/* Working Channels Badge */}
              <button
                onClick={() => setHealthFilter(healthFilter === 'online' ? 'all' : 'online')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
                  healthFilter === 'online'
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold shadow-sm shadow-emerald-950'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-emerald-400'
                }`}
                title="Filter to only working streams"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-bold">{healthStats.online} Online</span>
              </button>

              {/* Offline Badge */}
              <button
                onClick={() => setHealthFilter(healthFilter === 'offline' ? 'all' : 'offline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
                  healthFilter === 'offline'
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 font-bold shadow-sm'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-rose-400'
                }`}
                title="Filter to offline streams"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{healthStats.offline} Offline</span>
              </button>

              {/* Untested Badge */}
              {healthStats.untested > 0 && (
                <span className="text-[11px] text-neutral-400 px-2 py-1 bg-neutral-900/60 rounded-lg border border-neutral-800/80 hidden sm:inline-block">
                  {healthStats.untested} Untested
                </span>
              )}
            </div>

            {/* Right: Health Scanner Button & Progress */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchScanHealth}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                  isScanning
                    ? 'bg-amber-600 hover:bg-amber-700 text-black'
                    : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-100 hover:border-emerald-500/60'
                }`}
                title="Test streams health to find working channels"
              >
                {isScanning ? (
                  <>
                    <StopCircle className="w-3.5 h-3.5 text-black" />
                    <span>Stop Scan ({scanProgress.checked}/{scanProgress.total})</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Scan Channel Health</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 5. Search, Filter, View Mode & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800">
            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search channel name, group, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Health Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <button
                onClick={() => setHealthFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  healthFilter === 'all'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHealthFilter('online')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  healthFilter === 'online'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                    : 'bg-neutral-900 text-emerald-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Working Only</span>
              </button>
              <button
                onClick={() => setHealthFilter('offline')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  healthFilter === 'offline'
                    ? 'bg-rose-700 text-white shadow-sm'
                    : 'bg-neutral-900 text-rose-400 hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Offline</span>
              </button>
            </div>

            {/* Sorting & View Mode Toggle */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1 text-xs">
                <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="health-first" className="bg-neutral-900 text-white">
                    Healthy First (Online)
                  </option>
                  <option value="latency" className="bg-neutral-900 text-white">
                    Fastest Ping
                  </option>
                  <option value="name" className="bg-neutral-900 text-white">
                    Name (A-Z)
                  </option>
                  <option value="category" className="bg-neutral-900 text-white">
                    Category Group
                  </option>
                </select>
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Detailed Table / List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 6. Category Filter Chips */}
          {playlist.categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-white text-black font-extrabold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                All Categories ({playlist.channels.length})
              </button>
              {playlist.categories.map((cat, idx) => {
                const count = playlist.channels.filter((c) => c.group === cat).length;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                      selectedCategory === cat
                        ? 'bg-white text-black font-extrabold border-white'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* 7. Channels Display: Grid Mode or List Mode */}
          {sortedChannels.length === 0 ? (
            <div className="text-center py-16 text-xs text-neutral-500 bg-neutral-950/40 rounded-2xl border border-neutral-800 flex flex-col items-center gap-2">
              <Tv className="w-8 h-8 text-neutral-700" />
              <p className="font-semibold text-neutral-400">No IPTV channels match your active filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setHealthFilter('all');
                }}
                className="mt-1 px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedChannels.slice(0, 150).map((ch) => {
                const health = healthMap[ch.id];
                const status = health?.status || 'untested';

                return (
                  <div
                    key={ch.id}
                    onClick={() => handleChannelClick(ch)}
                    className={`group relative bg-neutral-900/90 hover:bg-neutral-800 border rounded-2xl p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:scale-[1.01] ${
                      status === 'online'
                        ? 'border-neutral-800 hover:border-emerald-500/60'
                        : status === 'offline'
                        ? 'border-neutral-800/80 hover:border-rose-500/50 opacity-80'
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {/* Top Row: Channel Logo + Call Sign + Health Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-10 h-10 rounded-xl object-contain bg-neutral-950 border border-neutral-800 p-1 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neutral-950 to-neutral-800 border border-neutral-700 text-red-500 flex items-center justify-center shrink-0 shadow-inner font-bold text-xs">
                            {ch.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex flex-col overflow-hidden">
                          <h4 className="text-xs font-bold text-neutral-100 group-hover:text-red-400 transition-colors truncate">
                            {ch.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-300 font-mono border border-neutral-800 truncate max-w-[120px]">
                              {ch.group || 'Live TV'}
                            </span>
                            {ch.country && (
                              <span className="uppercase px-1 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold">
                                {ch.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Health Indicator Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {status === 'online' && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-[10px] font-bold shadow-sm shadow-emerald-950">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span>WORKING</span>
                            {health?.latency && (
                              <span className="font-mono opacity-80 font-normal">
                                {health.latency}ms
                              </span>
                            )}
                          </div>
                        )}

                        {status === 'offline' && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-600/70 text-rose-300 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>OFFLINE</span>
                          </div>
                        )}

                        {status === 'checking' && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[10px] font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Testing...</span>
                          </div>
                        )}

                        {status === 'untested' && (
                          <button
                            onClick={(e) => handleCheckSingleChannel(ch, e)}
                            className="px-2 py-0.5 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 text-[10px] font-semibold transition-all flex items-center gap-1"
                            title="Click to check if this channel is working"
                          >
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            <span>Test Ping</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Protocol tag + Quick Re-probe + Watch Live CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px]">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span className="font-mono text-neutral-400">HLS LIVE</span>
                        {ch.language && <span className="uppercase">{ch.language}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick Re-probe Button */}
                        <button
                          onClick={(e) => handleCheckSingleChannel(ch, e)}
                          className="p-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                          title="Re-test channel health"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>

                        <div className="px-3 py-1 rounded-xl bg-red-600/90 group-hover:bg-red-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all">
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST / BROADCAST TABLE VIEW */
            <div className="flex flex-col bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-neutral-950 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <div className="col-span-1">Status</div>
                <div className="col-span-6 sm:col-span-5">Channel Name & Stream</div>
                <div className="col-span-3 hidden sm:block">Category</div>
                <div className="col-span-2 hidden sm:block text-right">Ping / Latency</div>
                <div className="col-span-5 sm:col-span-1 text-right">Action</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-neutral-800/60 max-h-[55vh] overflow-y-auto">
                {sortedChannels.slice(0, 150).map((ch, idx) => {
                  const health = healthMap[ch.id];
                  const status = health?.status || 'untested';

                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleChannelClick(ch)}
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-neutral-800/80 cursor-pointer transition-colors text-xs"
                    >
                      {/* Status Column */}
                      <div className="col-span-1 flex items-center">
                        {status === 'online' && (
                          <div className="relative flex h-3 w-3" title={`Online (${health?.latency || 0}ms)`}>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                          </div>
                        )}
                        {status === 'offline' && (
                          <div className="w-3 h-3 rounded-full bg-rose-600" title="Offline / Unreachable" />
                        )}
                        {status === 'checking' && (
                          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" title="Testing stream..." />
                        )}
                        {status === 'untested' && (
                          <div className="w-3 h-3 rounded-full bg-neutral-700" title="Not tested yet" />
                        )}
                      </div>

                      {/* Name & Logo Column */}
                      <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 overflow-hidden">
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-7 h-7 rounded-lg object-contain bg-neutral-950 p-0.5 shrink-0 border border-neutral-800"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-neutral-950 text-red-500 font-bold text-[10px] flex items-center justify-center shrink-0 border border-neutral-800">
                            TV
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-bold text-neutral-100 truncate hover:text-red-400 transition-colors">
                            {ch.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate font-mono">
                            {ch.url.split('/')[2] || 'Live HLS Stream'}
                          </span>
                        </div>
                      </div>

                      {/* Category Column */}
                      <div className="col-span-3 hidden sm:flex items-center gap-1.5 overflow-hidden">
                        <span className="px-2 py-0.5 rounded-lg bg-neutral-950 text-neutral-300 font-medium text-[11px] border border-neutral-800 truncate">
                          {ch.group || 'Live'}
                        </span>
                        {ch.country && (
                          <span className="text-[10px] uppercase font-bold text-neutral-500">
                            {ch.country}
                          </span>
                        )}
                      </div>

                      {/* Latency / Ping Column */}
                      <div className="col-span-2 hidden sm:flex items-center justify-end font-mono text-[11px]">
                        {status === 'online' ? (
                          <span className="text-emerald-400 font-semibold">{health?.latency || 45} ms</span>
                        ) : status === 'offline' ? (
                          <span className="text-rose-500">Unreachable</span>
                        ) : status === 'checking' ? (
                          <span className="text-amber-400">Pinging...</span>
                        ) : (
                          <button
                            onClick={(e) => handleCheckSingleChannel(ch, e)}
                            className="text-neutral-500 hover:text-neutral-200 text-[10px] underline"
                          >
                            Check
                          </button>
                        )}
                      </div>

                      {/* Action Play Button */}
                      <div className="col-span-5 sm:col-span-1 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleCheckSingleChannel(ch, e)}
                          className="p-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                          title="Re-test channel health"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <div className="p-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </main>

      {/* Sticky Bottom Bar if Media is Playing */}
      {currentPlayingMedia && (
        <div className="sticky bottom-0 z-40 bg-neutral-950/95 border-t border-neutral-800 px-4 sm:px-8 py-3 backdrop-blur-md flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Stream in Background</span>
              <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">{currentPlayingMedia.title}</p>
            </div>
          </div>
          <button
            onClick={onBack || onClose}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Return to Video</span>
          </button>
        </div>
      )}
    </div>
  );
};
