/**
 * Vortex Live TV Portal & Channel Directory
 * Developed by Suhail Akhtar (https://suhail.top)
 *
 * Professional, minimal television interface with fast stream diagnostics,
 * live hover stream preview, multi-dimensional filtering & customizable page sizes.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IPTVChannel, M3UPlaylist, MediaItem, ChannelHealthInfo } from '../../types';
import { fetchAndParseM3U, parseM3U } from '../../utils/m3uParser';
import {
  batchCheckChannels,
  getCachedChannelHealth,
  markChannelOnline,
  markChannelOffline,
} from '../../utils/channelHealth';
import { HoverPreviewPlayer } from './HoverPreviewPlayer';
import {
  Radio,
  Search,
  Sparkles,
  Loader2,
  Play,
  Tv,
  RefreshCw,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  XCircle,
  ArrowLeft,
  Grid,
  List,
  RotateCcw,
  ArrowUpDown,
  Layers,
  Filter,
} from 'lucide-react';

interface IPTVManagerProps {
  onSelectChannel: (media: MediaItem, allChannels?: MediaItem[], currentIndex?: number) => void;
  onBack?: () => void;
  onClose?: () => void;
  currentPlayingMedia?: MediaItem | null;
  initialUrl?: string;
}

interface PlaylistPreset {
  id: string;
  name: string;
  url: string;
  icon: string;
  badge?: string;
  desc: string;
}

const PRESET_PLAYLISTS: PlaylistPreset[] = [
  {
    id: 'main',
    name: 'Worldwide Index',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    icon: '🌐',
    badge: 'Global',
    desc: 'Global open IPTV television networks.',
  },
  {
    id: 'news',
    name: '24/7 Global News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    icon: '📰',
    badge: 'Live',
    desc: 'International news and live broadcasts.',
  },
  {
    id: 'sports',
    name: 'Sports Broadcasts',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    icon: '⚽',
    badge: 'Live',
    desc: 'Live sports, racing, and athletics.',
  },
  {
    id: 'music',
    name: 'Music TV',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    icon: '🎵',
    desc: '24/7 music videos and live sets.',
  },
  {
    id: 'movies',
    name: 'Movies & Cinema',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    icon: '🎬',
    desc: 'Cinema channels and entertainment.',
  },
  {
    id: 'entertainment',
    name: 'General TV',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    icon: '🎭',
    desc: 'Variety shows and general television.',
  },
  {
    id: 'documentary',
    name: 'Science & Docs',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    icon: '🦁',
    desc: 'Science, wildlife, and history channels.',
  },
  {
    id: 'english',
    name: 'English Channels',
    url: 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    icon: '🗣️',
    badge: 'Language',
    desc: 'English language broadcasts worldwide.',
  },
  {
    id: 'us',
    name: 'United States',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    icon: '🇺🇸',
    badge: 'Country',
    desc: 'United States television networks.',
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    icon: '🇬🇧',
    badge: 'Country',
    desc: 'UK television networks and BBC feeds.',
  },
  {
    id: 'in',
    name: 'India TV',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    icon: '🇮🇳',
    badge: 'Country',
    desc: 'Indian national & regional television.',
  },
];

const FAVORITES_STORAGE_KEY = 'vortex_favorite_iptv_urls';
const PAGE_SIZE_STORAGE_KEY = 'vortex_tv_page_size';

type HealthFilter = 'all' | 'online' | 'offline' | 'untested';
type ViewMode = 'grid' | 'list';
type SortOption = 'default' | 'name-asc' | 'name-desc' | 'online-first' | 'fastest-ping';

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

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Hover Channel Live Stream Preview
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Customizable Page Size (Default 24)
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 24;
    } catch {
      return 24;
    }
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Health Diagnostics
  const [healthMap, setHealthMap] = useState<Record<string, ChannelHealthInfo>>({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ checked: number; total: number }>({ checked: 0, total: 0 });

  // Source drawer
  const [isSourceOpen, setIsSourceOpen] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keyboard navigation (/ to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFavorite = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    try {
      localStorage.setItem(PAGE_SIZE_STORAGE_KEY, newSize.toString());
    } catch {
      // Ignore
    }
  };

  const handleMouseEnterChannel = (channelId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredChannelId(channelId);
    }, 180);
  };

  const handleMouseLeaveChannel = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredChannelId(null);
  };

  // Load M3U Playlist
  const loadPlaylist = async (url: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsScanning(false);
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const result = await fetchAndParseM3U(url);
      setPlaylist(result);
      setSelectedCategory('All');
      setSelectedCountry('All');
      setSelectedLanguage('All');
      setSearchQuery('');

      // Populate pre-cached health statuses immediately
      const initialHealth: Record<string, ChannelHealthInfo> = {};
      result.channels.forEach((ch) => {
        const cached = getCachedChannelHealth(ch.url);
        if (cached) {
          initialHealth[ch.id] = cached;
        }
      });
      setHealthMap(initialHealth);

      // Background probe top page channels
      setTimeout(() => {
        fastProbeTopChannels(result.channels.slice(0, pageSize));
      }, 50);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live M3U feed. Please verify connection.');
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
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Rapid background check for visible page channels with 32 workers
  const fastProbeTopChannels = async (channelsToScan: IPTVChannel[]) => {
    const unverified = channelsToScan.filter((c) => !healthMap[c.id]);
    if (unverified.length === 0) return;

    const batch = unverified.map((c) => ({ id: c.id, url: c.url }));
    batchCheckChannels(
      batch,
      (channelId, info) => {
        setHealthMap((prev) => ({
          ...prev,
          [channelId]: info,
        }));
      },
      undefined,
      32
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

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
        setIsSourceOpen(false);

        setTimeout(() => {
          fastProbeTopChannels(channels.slice(0, pageSize));
        }, 50);
      } catch {
        setError('Failed to parse M3U file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Batch probe filtered page channels with 32 parallel workers
  const handleBatchScanHealth = async () => {
    if (isScanning) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsScanning(false);
      return;
    }

    if (!playlist || filteredChannels.length === 0) return;

    const targetChannels = filteredChannels.slice(0, Math.min(pageSize * 2, 96));
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
        32
      );
    } catch {
      // Stopped
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleChannelClick = (channel: IPTVChannel, indexInFiltered: number) => {
    const mediaItem: MediaItem = {
      id: channel.id,
      title: channel.name,
      src: channel.url,
      type: 'url',
      format: 'Live TV',
      addedAt: Date.now(),
      thumbnail:
        channel.logo ||
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
      group: channel.group || 'Live TV',
      isLive: true,
    };

    const allMediaItems: MediaItem[] = filteredChannels.map((c) => ({
      id: c.id,
      title: c.name,
      src: c.url,
      type: 'url',
      format: 'Live TV',
      addedAt: Date.now(),
      thumbnail:
        c.logo ||
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
      group: c.group || 'Live TV',
      isLive: true,
    }));

    onSelectChannel(mediaItem, allMediaItems, indexInFiltered);
  };

  // Derive Countries & Languages
  const availableCountries = useMemo(() => {
    if (!playlist) return [];
    const set = new Set<string>();
    playlist.channels.forEach((c) => {
      if (c.country) set.add(c.country.toUpperCase());
    });
    return Array.from(set).sort();
  }, [playlist]);

  const availableLanguages = useMemo(() => {
    if (!playlist) return [];
    const set = new Set<string>();
    playlist.channels.forEach((c) => {
      if (c.language) set.add(c.language.toLowerCase());
    });
    return Array.from(set).sort();
  }, [playlist]);

  const categoryCounts = useMemo(() => {
    if (!playlist) return {};
    const map: Record<string, number> = {};
    playlist.channels.forEach((c) => {
      const group = c.group || 'General';
      map[group] = (map[group] || 0) + 1;
    });
    return map;
  }, [playlist]);

  // Comprehensive Multi-dimensional Filter & Sorting logic
  const filteredChannels = useMemo(() => {
    if (!playlist) return [];

    let result = playlist.channels.filter((ch) => {
      if (onlyFavorites && !favorites.has(ch.url)) return false;

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const match =
          ch.name.toLowerCase().includes(q) ||
          (ch.group && ch.group.toLowerCase().includes(q)) ||
          (ch.country && ch.country.toLowerCase().includes(q)) ||
          (ch.language && ch.language.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedCategory !== 'All' && ch.group !== selectedCategory) return false;
      if (selectedCountry !== 'All' && ch.country?.toUpperCase() !== selectedCountry.toUpperCase()) return false;
      if (selectedLanguage !== 'All' && ch.language?.toLowerCase() !== selectedLanguage.toLowerCase()) return false;

      const h = healthMap[ch.id]?.status || 'untested';
      if (healthFilter === 'online' && h !== 'online') return false;
      if (healthFilter === 'offline' && h !== 'offline') return false;
      if (healthFilter === 'untested' && h !== 'untested') return false;

      return true;
    });

    if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'online-first') {
      result = [...result].sort((a, b) => {
        const hA = healthMap[a.id]?.status === 'online' ? 0 : 1;
        const hB = healthMap[b.id]?.status === 'online' ? 0 : 1;
        return hA - hB;
      });
    } else if (sortBy === 'fastest-ping') {
      result = [...result].sort((a, b) => {
        const latA = healthMap[a.id]?.latency ?? 9999;
        const latB = healthMap[b.id]?.latency ?? 9999;
        return latA - latB;
      });
    }

    return result;
  }, [
    playlist,
    searchQuery,
    selectedCategory,
    selectedCountry,
    selectedLanguage,
    healthFilter,
    onlyFavorites,
    favorites,
    healthMap,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedCountry !== 'All' ||
    selectedLanguage !== 'All' ||
    healthFilter !== 'all' ||
    onlyFavorites ||
    sortBy !== 'default';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCountry('All');
    setSelectedLanguage('All');
    setHealthFilter('all');
    setOnlyFavorites(false);
    setSortBy('default');
    setCurrentPage(1);
  };

  useEffect(() => {
    if (filteredChannels.length > 0) {
      const start = (currentPage - 1) * pageSize;
      const pageChannels = filteredChannels.slice(start, start + pageSize);
      fastProbeTopChannels(pageChannels);
    }
  }, [currentPage, pageSize, filteredChannels]);

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / pageSize));
  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredChannels.length);

  const onlineCount = useMemo(() => {
    return Object.values(healthMap).filter((h: ChannelHealthInfo) => h?.status === 'online').length;
  }, [healthMap]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-14 bg-[#09090b]/90 border-b border-zinc-800/80 px-4 lg:px-8 flex items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {(onBack || onClose || currentPlayingMedia) && (
            <button
              onClick={onBack || onClose}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
              <span>{currentPlayingMedia ? 'Player' : 'Back'}</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-950/40">
              <Tv className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">Vortex TV</span>
              <span className="text-[10px] text-zinc-400 font-medium leading-tight hidden sm:block">
                Open Television Portal
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search channels, languages, country..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-900/80 border border-zinc-800/90 focus:border-rose-500 rounded-lg pl-9 pr-12 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
              /
            </span>
          )}
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSourceOpen(!isSourceOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSourceOpen
                ? 'bg-rose-950/60 border-rose-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Sources</span>
          </button>

          {playlist && (
            <button
              onClick={handleBatchScanHealth}
              disabled={filteredChannels.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                isScanning
                  ? 'bg-amber-600 text-black animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">
                    ({scanProgress.checked}/{scanProgress.total})
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Probe Health</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Sources Drawer */}
      {isSourceOpen && (
        <div className="bg-[#0c0c0e] border-b border-zinc-800/80 px-4 lg:px-8 py-4 flex flex-col gap-3 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Sparkles className="w-3.5 h-3.5" /> M3U Television Stream Index
            </span>
            <button onClick={() => setIsSourceOpen(false)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="Paste custom M3U / M3U8 URL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
            />
            <button
              onClick={() => {
                if (playlistUrl) loadPlaylist(playlistUrl);
                setIsSourceOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Feed</span>
            </button>
            <label className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upload M3U</span>
              <input type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Preset Sources */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {PRESET_PLAYLISTS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setPlaylistUrl(preset.url);
                  loadPlaylist(preset.url);
                  setIsSourceOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border flex items-center gap-1.5 transition-all ${
                  playlistUrl === preset.url
                    ? 'bg-rose-950/80 border-rose-600 text-white font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Navigation Bar */}
      {playlist && playlist.categories.length > 0 && (
        <div className="bg-[#0b0b0d] border-b border-zinc-800/60 px-4 lg:px-8 py-2 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setSelectedCategory('All');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            All Channels ({playlist.channels.length})
          </button>

          {playlist.categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-rose-950/80 border-rose-600 text-white font-bold'
                    : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <span>{cat}</span>
                {categoryCounts[cat] && (
                  <span className="text-[10px] font-mono text-zinc-500">({categoryCounts[cat]})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Secondary Multi-Filter & Controls Toolbar */}
      <div className="px-4 lg:px-8 py-2.5 bg-[#0d0d10] border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Chips & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Working Online Only Chip */}
          <button
            onClick={() => {
              setHealthFilter(healthFilter === 'online' ? 'all' : 'online');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all border ${
              healthFilter === 'online'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
            {onlineCount > 0 && <span className="font-mono text-[10px]">({onlineCount})</span>}
          </button>

          {/* Favorites Filter */}
          <button
            onClick={() => {
              setOnlyFavorites(!onlyFavorites);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all border ${
              onlyFavorites
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:text-amber-300'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Favorites ({favorites.size})</span>
          </button>

          {/* Country Selector */}
          {availableCountries.length > 0 && (
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className={`bg-zinc-900 border text-zinc-300 rounded-full px-3 py-1 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer ${
                selectedCountry !== 'All' ? 'border-rose-500 bg-rose-950/40 text-white font-bold' : 'border-zinc-800'
              }`}
            >
              <option value="All">All Countries ({availableCountries.length})</option>
              {availableCountries.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          )}

          {/* Language Selector */}
          {availableLanguages.length > 0 && (
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              className={`bg-zinc-900 border text-zinc-300 rounded-full px-3 py-1 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer ${
                selectedLanguage !== 'All' ? 'border-rose-500 bg-rose-950/40 text-white font-bold' : 'border-zinc-800'
              }`}
            >
              <option value="All">All Languages ({availableLanguages.length})</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          )}

          {/* Sorting */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1">
            <ArrowUpDown className="w-3 h-3 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-zinc-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="default" className="bg-zinc-900">Default Order</option>
              <option value="name-asc" className="bg-zinc-900">Name (A–Z)</option>
              <option value="name-desc" className="bg-zinc-900">Name (Z–A)</option>
              <option value="online-first" className="bg-zinc-900">Online First</option>
              <option value="fastest-ping" className="bg-zinc-900">Lowest Ping</option>
            </select>
          </div>
        </div>

        {/* Page Size & View Mode */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="hidden sm:inline font-medium">Page Size:</span>
            <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              {[12, 24, 48, 96, 200].map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    pageSize === size ? 'bg-rose-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Bar & Range Info */}
      <div className="px-4 lg:px-8 py-2 bg-[#09090b] border-b border-zinc-800/40 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center gap-1.5">
          {filteredChannels.length > 0 && (
            <span className="font-semibold text-zinc-300 mr-2">
              Showing <span className="text-white font-mono">{startIndex}–{endIndex}</span> of{' '}
              <span className="text-white font-mono">{filteredChannels.length}</span> channels
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px]">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-rose-400">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-rose-950/80 border border-rose-800 text-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
              Cat: {selectedCategory}
              <button onClick={() => setSelectedCategory('All')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCountry !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px]">
              Country: {selectedCountry}
              <button onClick={() => setSelectedCountry('All')} className="hover:text-rose-400">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedLanguage !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px]">
              Lang: {selectedLanguage.toUpperCase()}
              <button onClick={() => setSelectedLanguage('All')} className="hover:text-rose-400">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 ml-2 underline"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-white text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px]">
              Page <span className="font-bold text-white">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-white text-xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid View / Directory Content */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1700px] w-full mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-xs font-semibold">Tuning channels and verifying stream reachability...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/30 border border-rose-800/80 rounded-2xl p-6 text-center max-w-lg mx-auto flex flex-col items-center gap-3">
            <XCircle className="w-8 h-8 text-rose-500" />
            <p className="text-xs font-semibold text-rose-200">{error}</p>
            <button
              onClick={() => loadPlaylist(playlistUrl)}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-24 text-zinc-500 flex flex-col items-center gap-2">
            <Tv className="w-10 h-10 stroke-1 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-400">No channels found matching current criteria.</p>
            <button onClick={resetAllFilters} className="text-xs text-rose-500 hover:underline font-bold">
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5'
                : 'flex flex-col gap-2'
            }
          >
            {paginatedChannels.map((channel, idx) => {
              const globalIndex = (currentPage - 1) * pageSize + idx;
              const health = healthMap[channel.id];
              const isFav = favorites.has(channel.url);
              const isHovered = hoveredChannelId === channel.id;

              if (viewMode === 'list') {
                return (
                  <div
                    key={channel.id}
                    onMouseEnter={() => handleMouseEnterChannel(channel.id)}
                    onMouseLeave={handleMouseLeaveChannel}
                    onClick={() => handleChannelClick(channel, globalIndex)}
                    className="group bg-[#121215] hover:bg-[#17171c] border border-zinc-800/60 hover:border-zinc-700 rounded-xl p-2.5 flex items-center justify-between gap-4 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-20 aspect-video rounded-lg bg-zinc-950 border border-zinc-800/80 shrink-0 flex items-center justify-center relative overflow-hidden">
                        {isHovered ? (
                          <HoverPreviewPlayer
                            streamUrl={channel.url}
                            fallbackLogo={channel.logo}
                            onSuccess={() => {
                              markChannelOnline(channel.url, 16);
                              setHealthMap((prev) => ({
                                ...prev,
                                [channel.id]: { status: 'online', latency: 16, checkedAt: Date.now() },
                              }));
                            }}
                            onError={() => {
                              markChannelOffline(channel.url, 'Stream Offline');
                              setHealthMap((prev) => ({
                                ...prev,
                                [channel.id]: { status: 'offline', error: 'Stream Offline', checkedAt: Date.now() },
                              }));
                            }}
                          />
                        ) : channel.logo ? (
                          <div className="w-full h-full p-1 flex items-center justify-center bg-zinc-950">
                            <img
                              src={channel.logo}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <Tv className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                          {channel.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          {channel.group && <span className="truncate">{channel.group}</span>}
                          {channel.country && (
                            <span className="font-mono bg-black px-1 py-0.2 rounded border border-zinc-800 uppercase">
                              {channel.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {health?.status === 'online' ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {health.latency ? `${health.latency}ms` : 'Online'}
                        </span>
                      ) : health?.status === 'checking' ? (
                        <span className="text-[10px] text-amber-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </span>
                      ) : health?.status === 'offline' ? (
                        <span className="text-[10px] text-rose-500">Offline</span>
                      ) : null}

                      <button
                        onClick={(e) => toggleFavorite(channel.url, e)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          isFav ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Grid Card View (Full Edge-to-Edge 16:9 Media Banner, No Inner Black Bars)
              return (
                <div
                  key={channel.id}
                  onMouseEnter={() => handleMouseEnterChannel(channel.id)}
                  onMouseLeave={handleMouseLeaveChannel}
                  onClick={() => handleChannelClick(channel, globalIndex)}
                  className="group bg-[#121215] hover:bg-[#16161b] border border-zinc-800/60 hover:border-zinc-700 rounded-2xl flex flex-col cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/80 overflow-hidden"
                >
                  {/* Full Edge-to-Edge 16:9 Media Preview Banner */}
                  <div className="w-full aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800/50">
                    {/* Overlaid Badges */}
                    <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
                      <span className="text-[9px] font-mono font-bold bg-black/80 text-zinc-200 px-2 py-0.5 rounded-md backdrop-blur-md border border-zinc-700/60 truncate max-w-[70%] shadow-sm">
                        {channel.group || 'Live TV'}
                      </span>

                      <button
                        onClick={(e) => toggleFavorite(channel.url, e)}
                        className={`p-1.5 rounded-md backdrop-blur-md transition-colors pointer-events-auto ${
                          isFav
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-600/60'
                            : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-zinc-100 border border-zinc-800/80'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Media Content / Hover Preview */}
                    {isHovered ? (
                      <HoverPreviewPlayer
                        streamUrl={channel.url}
                        fallbackLogo={channel.logo}
                        onSuccess={() => {
                          markChannelOnline(channel.url, 16);
                          setHealthMap((prev) => ({
                            ...prev,
                            [channel.id]: { status: 'online', latency: 16, checkedAt: Date.now() },
                          }));
                        }}
                        onError={() => {
                          markChannelOffline(channel.url, 'Stream Offline');
                          setHealthMap((prev) => ({
                            ...prev,
                            [channel.id]: { status: 'offline', error: 'Stream Offline', checkedAt: Date.now() },
                          }));
                        }}
                      />
                    ) : (
                      <>
                        {channel.logo ? (
                          <div className="w-full h-full p-2.5 flex items-center justify-center bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black">
                            <img
                              src={channel.logo}
                              alt=""
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
                            <Tv className="w-8 h-8 text-zinc-700" />
                          </div>
                        )}

                        {/* Hover Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Card Info Details */}
                  <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between bg-[#121215] group-hover:bg-[#16161b] transition-colors">
                    <h3 className="text-xs font-bold text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-1">
                      {channel.name}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      {channel.country ? (
                        <span className="font-mono uppercase text-zinc-400 font-semibold">{channel.country}</span>
                      ) : (
                        <span className="text-zinc-500">HD Feed</span>
                      )}

                      {health?.status === 'online' ? (
                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {health.latency ? `${health.latency}ms` : 'Online'}
                        </span>
                      ) : health?.status === 'checking' ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        </span>
                      ) : health?.status === 'offline' ? (
                        <span className="text-rose-500 font-medium">Offline</span>
                      ) : (
                        <span className="text-zinc-500">Live</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-[#09090b] px-4 lg:px-8 py-3 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          <span>Vortex TV • v1.6.0</span>
        </div>
        <div>
          Created by{' '}
          <a
            href="https://suhail.top"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 font-bold hover:text-white underline transition-colors"
          >
            Suhail Akhtar
          </a>
        </div>
      </footer>
    </div>
  );
};
