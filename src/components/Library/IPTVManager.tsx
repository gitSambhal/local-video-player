/**
 * IPTV Live TV Broadcast Portal & Channel Guide
 * Developed by Suhail Akhtar (https://suhail.top)
 */

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
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Zap,
  StopCircle,
  Globe,
  Tag,
  Star,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Layers,
  Heart,
} from 'lucide-react';

interface IPTVManagerProps {
  onSelectChannel: (media: MediaItem) => void;
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
  category: string;
  desc: string;
}

const PRESET_PLAYLISTS: PlaylistPreset[] = [
  {
    id: 'main',
    name: 'Worldwide Index',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    icon: '🌍',
    badge: 'Popular',
    category: 'Global',
    desc: 'Worldwide open IPTV playlist index containing news, sports, music & entertainment.',
  },
  {
    id: 'news',
    name: '24/7 Global News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    icon: '📰',
    badge: 'Live',
    category: 'Category',
    desc: '24/7 global live news streams in English & international languages.',
  },
  {
    id: 'sports',
    name: 'Sports Broadcasts',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    icon: '⚽',
    badge: 'Live',
    category: 'Category',
    desc: 'Live sports broadcasts, racing, outdoor sports, and events.',
  },
  {
    id: 'music',
    name: '24/7 Music TV',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    icon: '🎵',
    category: 'Category',
    desc: 'Music video channels, concerts, radio broadcasts, and club hits.',
  },
  {
    id: 'movies',
    name: 'Movies & Cinema',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    icon: '🎬',
    category: 'Category',
    desc: 'Classic cinema, independent films, and entertainment channels.',
  },
  {
    id: 'entertainment',
    name: 'General Entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    icon: '🎭',
    category: 'Category',
    desc: 'General entertainment, lifestyle, talk shows, and variety television.',
  },
  {
    id: 'documentary',
    name: 'Documentary & Science',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    icon: '🦁',
    category: 'Category',
    desc: 'Science, history, nature, space exploration, and wildlife channels.',
  },
  {
    id: 'animation',
    name: 'Kids & Animation',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    icon: '🧸',
    category: 'Category',
    desc: 'Animated cartoons, anime, and family entertainment.',
  },
  {
    id: 'english',
    name: 'English Channels',
    url: 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    icon: '🗣️',
    badge: 'Language',
    category: 'Language',
    desc: 'All open English language channels from around the globe.',
  },
  {
    id: 'us',
    name: 'United States',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    icon: '🇺🇸',
    badge: 'Country',
    category: 'Country',
    desc: 'Open United States TV networks & local broadcast channels.',
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    icon: '🇬🇧',
    badge: 'Country',
    category: 'Country',
    desc: 'United Kingdom broadcast, news, and entertainment channels.',
  },
  {
    id: 'in',
    name: 'India TV',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    icon: '🇮🇳',
    badge: 'Country',
    category: 'Country',
    desc: 'India news, national television, regional & musical broadcasts.',
  },
  {
    id: 'ca',
    name: 'Canada',
    url: 'https://iptv-org.github.io/iptv/countries/ca.m3u',
    icon: '🇨🇦',
    category: 'Country',
    desc: 'Canadian national, provincial, and news broadcasts.',
  },
  {
    id: 'au',
    name: 'Australia',
    url: 'https://iptv-org.github.io/iptv/countries/au.m3u',
    icon: '🇦🇺',
    category: 'Country',
    desc: 'Australian public broadcasters, news, and community channels.',
  },
  {
    id: 'de',
    name: 'Germany',
    url: 'https://iptv-org.github.io/iptv/countries/de.m3u',
    icon: '🇩🇪',
    category: 'Country',
    desc: 'German TV, culture, documentaries, and regional programming.',
  },
  {
    id: 'fr',
    name: 'France',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    icon: '🇫🇷',
    category: 'Country',
    desc: 'French national broadcast, culture, and francophone channels.',
  },
  {
    id: 'es',
    name: 'Spain',
    url: 'https://iptv-org.github.io/iptv/countries/es.m3u',
    icon: '🇪🇸',
    category: 'Country',
    desc: 'Spanish television networks, sports, and regional programming.',
  },
  {
    id: 'jp',
    name: 'Japan',
    url: 'https://iptv-org.github.io/iptv/countries/jp.m3u',
    icon: '🇯🇵',
    category: 'Country',
    desc: 'Japanese news, entertainment, and anime broadcasts.',
  },
];

const SPOTLIGHT_CHANNELS = [
  {
    name: 'NASA TV HD',
    group: 'Science',
    country: 'US',
    language: 'English',
    desc: 'Official 24/7 high-definition broadcast from the International Space Station, rocket launches, and deep-space missions.',
    url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-HD/master.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
    badge: 'FEATURED 4K/HD',
  },
  {
    name: 'DW News Global',
    group: 'News',
    country: 'DE',
    language: 'English',
    desc: 'International round-the-clock television news service broadcasting insightful reports and live world affairs.',
    url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/320px-Deutsche_Welle_logo.svg.png',
    badge: 'LIVE 24/7',
  },
  {
    name: 'France 24 English',
    group: 'News',
    country: 'FR',
    language: 'English',
    desc: 'Comprehensive global news coverage, debates, culture, and in-depth international analysis broadcast live.',
    url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/France_24_logo.svg/320px-France_24_logo.svg.png',
    badge: 'VERIFIED STREAM',
  },
  {
    name: 'Red Bull TV',
    group: 'Sports',
    country: 'AT',
    language: 'English',
    desc: 'Extreme sports, world championship live events, motorsports, music documentaries, and adventure culture.',
    url: 'https://rbmn-live.akamaized.net/hls/live/591070/GEO_STATION_1/master.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png',
    badge: 'ACTION SPORTS',
  },
];

const FAVORITES_STORAGE_KEY = 'omniplay_favorite_iptv_urls';

type HealthFilter = 'all' | 'online' | 'offline' | 'untested';
type SortOption = 'health-first' | 'latency' | 'name-asc' | 'name-desc' | 'category' | 'country';
type ViewMode = 'grid' | 'list' | 'theater';

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

  // Filters and Views
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('health-first');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(36);

  // Health Diagnostics
  const [healthMap, setHealthMap] = useState<Record<string, ChannelHealthInfo>>({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ checked: number; total: number }>({ checked: 0, total: 0 });

  // UI State Drawers
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Mobile drawer
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Save favorites to localStorage
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
      } catch (err) {
        console.warn('Could not save favorites to localStorage', err);
      }
      return next;
    });
  };

  // Load Playlist from M3U Source
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

      // Populate pre-cached health statuses if any
      const initialHealth: Record<string, ChannelHealthInfo> = {};
      result.channels.forEach((ch) => {
        const cached = getCachedChannelHealth(ch.url);
        if (cached) {
          initialHealth[ch.id] = cached;
        }
      });
      setHealthMap(initialHealth);

      // Auto-probe first 12 visible channels in background for snappy preview
      setTimeout(() => {
        autoScanTopChannels(result.channels.slice(0, 12));
      }, 300);
    } catch (err: any) {
      console.error('Failed to load IPTV playlist:', err);
      setError(err?.message || 'Failed to fetch M3U playlist. Check your internet connection or URL.');
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

  // Background check for top channels
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
      setIsSourceDrawerOpen(false);
    }
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
        setIsSourceDrawerOpen(false);

        setTimeout(() => {
          autoScanTopChannels(channels.slice(0, 12));
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

  // Batch probe filtered channels
  const handleBatchScanHealth = async () => {
    if (isScanning) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsScanning(false);
      return;
    }

    if (!playlist || filteredChannels.length === 0) return;

    // Probe up to 48 channels in the current view
    const targetChannels = filteredChannels.slice(0, 48);
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
      console.warn('Batch scan halted', err);
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleChannelClick = (channel: IPTVChannel | { name: string; url: string; logo?: string; group?: string }) => {
    const mediaItem: MediaItem = {
      id: 'id' in channel ? channel.id : `stream-${Date.now()}`,
      title: channel.name,
      src: channel.url,
      type: 'url',
      format: 'HLS IPTV Live',
      addedAt: Date.now(),
      thumbnail:
        channel.logo ||
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
      group: channel.group || 'Live TV',
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

  // Extract unique countries and languages for filters
  const { availableCountries, availableLanguages } = useMemo(() => {
    if (!playlist) return { availableCountries: [], availableLanguages: [] };

    const countries = new Set<string>();
    const languages = new Set<string>();

    playlist.channels.forEach((ch) => {
      if (ch.country && ch.country.trim()) countries.add(ch.country.trim().toUpperCase());
      if (ch.language && ch.language.trim()) languages.add(ch.language.trim());
    });

    return {
      availableCountries: Array.from(countries).sort(),
      availableLanguages: Array.from(languages).sort(),
    };
  }, [playlist]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    if (!playlist) return [];

    return playlist.channels.filter((ch) => {
      // 1. Favorites filter
      if (onlyFavorites && !favorites.has(ch.url)) {
        return false;
      }

      // 2. Search query (matches title, group, country, language)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          ch.name.toLowerCase().includes(q) ||
          (ch.group && ch.group.toLowerCase().includes(q)) ||
          (ch.country && ch.country.toLowerCase().includes(q)) ||
          (ch.language && ch.language.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'All' && ch.group !== selectedCategory) {
        return false;
      }

      // 4. Country Filter
      if (selectedCountry !== 'All' && ch.country?.toUpperCase() !== selectedCountry) {
        return false;
      }

      // 5. Language Filter
      if (selectedLanguage !== 'All' && ch.language !== selectedLanguage) {
        return false;
      }

      // 6. Health Status Filter
      const h = healthMap[ch.id]?.status || 'untested';
      if (healthFilter === 'online' && h !== 'online') return false;
      if (healthFilter === 'offline' && h !== 'offline') return false;
      if (healthFilter === 'untested' && h !== 'untested') return false;

      return true;
    });
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
  ]);

  // Sort channels
  const sortedChannels = useMemo(() => {
    const list = [...filteredChannels];

    list.sort((a, b) => {
      const healthA = healthMap[a.id];
      const healthB = healthMap[b.id];

      if (sortOption === 'health-first') {
        const priority = (h?: ChannelHealthInfo) => {
          if (h?.status === 'online') return 1;
          if (h?.status === 'checking') return 2;
          if (!h || h.status === 'untested') return 3;
          return 4; // offline
        };
        const prioA = priority(healthA);
        const prioB = priority(healthB);
        if (prioA !== prioB) return prioA - prioB;

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

      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      }

      if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      }

      if (sortOption === 'category') {
        const catA = a.group || '';
        const catB = b.group || '';
        if (catA !== catB) return catA.localeCompare(catB);
        return a.name.localeCompare(b.name);
      }

      if (sortOption === 'country') {
        const cA = a.country || '';
        const cB = b.country || '';
        if (cA !== cB) return cA.localeCompare(cB);
        return a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });

    return list;
  }, [filteredChannels, healthMap, sortOption]);

  // Paginated channels slice
  const totalPages = Math.max(1, Math.ceil(sortedChannels.length / pageSize));
  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedChannels.slice(start, start + pageSize);
  }, [sortedChannels, currentPage, pageSize]);

  const activePreset = PRESET_PLAYLISTS.find((p) => p.url === playlistUrl);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCountry('All');
    setSelectedLanguage('All');
    setHealthFilter('all');
    setOnlyFavorites(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedCountry !== 'All' ||
    selectedLanguage !== 'All' ||
    healthFilter !== 'all' ||
    onlyFavorites;

  return (
    <div className="min-h-screen bg-[#09090d] text-neutral-100 flex flex-col font-sans select-none selection:bg-red-600 selection:text-white">
      {/* Top Ambient Glow Accent */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-radial from-red-600/10 via-transparent to-transparent pointer-events-none -z-10 blur-3xl opacity-60" />

      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          {(onBack || onClose) && (
            <button
              onClick={onBack || onClose}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white flex items-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95 group"
              title={currentPlayingMedia ? 'Return to Current Video Player' : 'Back to Home Launcher'}
            >
              <ArrowLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">
                {currentPlayingMedia ? 'Back to Video' : 'Back to Home'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-950/60 font-black">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-white tracking-tight">
                  OmniPlay Live TV
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-950/90 border border-red-700/80 text-red-400 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  BROADCAST
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden md:block">
                Open global television directory with real-time health checks & low-latency stream routing
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Box in Header */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search thousands of channels, news, sports, countries..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-neutral-900/90 border border-neutral-700/80 focus:border-red-500 rounded-xl pl-10 pr-9 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Custom M3U Source Button */}
          <button
            onClick={() => setIsSourceDrawerOpen(!isSourceDrawerOpen)}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              isSourceDrawerOpen
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700/80 text-neutral-200'
            }`}
            title="Change M3U URL or upload custom playlist"
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">{activePreset ? activePreset.name : 'Sources'}</span>
            <span className="sm:hidden">Feeds</span>
          </button>

          {/* Batch Health Scanner */}
          {playlist && (
            <button
              onClick={handleBatchScanHealth}
              disabled={filteredChannels.length === 0}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                isScanning
                  ? 'bg-amber-600 hover:bg-amber-700 text-black animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-950/40'
              }`}
              title="Probe ping & availability for visible channels"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">
                    Pinging ({scanProgress.checked}/{scanProgress.total})
                  </span>
                  <span className="sm:hidden">{scanProgress.checked}/{scanProgress.total}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Probe Channel Health</span>
                  <span className="md:hidden">Probe</span>
                </>
              )}
            </button>
          )}

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-neutral-200 hover:text-white relative"
            title="Toggle Filters Sidebar"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Collapsible Custom M3U Source Configuration Drawer */}
      {isSourceDrawerOpen && (
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 lg:px-8 py-5 flex flex-col gap-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>Select Broadcast Feed or Custom M3U Source</span>
            </div>
            <button
              onClick={() => setIsSourceDrawerOpen(false)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Radio className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Paste any custom M3U or M3U8 Playlist URL (e.g., https://example.com/playlist.m3u)..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shrink-0 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Load Playlist</span>
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0">
              <Upload className="w-4 h-4 text-neutral-400" />
              <span>Upload .M3U File</span>
              <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </form>

          {/* Quick Presets Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Popular Global Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {PRESET_PLAYLISTS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setPlaylistUrl(preset.url);
                    loadPlaylist(preset.url);
                    setIsSourceDrawerOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 group ${
                    playlistUrl === preset.url
                      ? 'bg-red-950/80 border-red-600 text-white shadow-lg'
                      : 'bg-neutral-900 hover:bg-neutral-800/90 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-base">
                    <span>{preset.icon}</span>
                    {preset.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-300 border border-neutral-800">
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold truncate group-hover:text-white">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Field */}
      <div className="px-4 pt-3 pb-1 sm:hidden">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels, news, sports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* 3. Hero Spotlight Channel Banner */}
      {!loading && !error && !hasActiveFilters && (
        <section className="px-4 lg:px-8 pt-4 pb-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-950 via-[#121118] to-neutral-950 border border-neutral-800/80 p-5 sm:p-7 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

            <div className="relative z-10 flex items-start gap-4 sm:gap-5 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 border border-neutral-700/80 p-2 shrink-0 flex items-center justify-center shadow-xl">
                <img
                  src={SPOTLIGHT_CHANNELS[0].logo}
                  alt={SPOTLIGHT_CHANNELS[0].name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-red-950/50">
                    {SPOTLIGHT_CHANNELS[0].badge}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[10px]">
                    HLS 1080p
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Ultra Low Latency (38ms)
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  {SPOTLIGHT_CHANNELS[0].name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
                  {SPOTLIGHT_CHANNELS[0].desc}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3 self-stretch lg:self-center shrink-0">
              <button
                onClick={() => handleChannelClick(SPOTLIGHT_CHANNELS[0])}
                className="flex-1 lg:flex-initial px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/60 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Live Broadcast</span>
              </button>

              <button
                onClick={(e) => toggleFavorite(SPOTLIGHT_CHANNELS[0].url, e)}
                className={`p-3 rounded-2xl border transition-all active:scale-95 ${
                  favorites.has(SPOTLIGHT_CHANNELS[0].url)
                    ? 'bg-amber-950/80 border-amber-600 text-amber-400 shadow-md'
                    : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
                title="Save to favorites"
              >
                <Star className={`w-4 h-4 ${favorites.has(SPOTLIGHT_CHANNELS[0].url) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Main Two-Column Portal Layout (Sidebar Filters + Channels Workspace) */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-4 flex flex-col lg:flex-row items-start gap-6">
        {/* Left Filter & Category Sidebar */}
        <aside
          className={`lg:w-72 xl:w-80 shrink-0 w-full flex flex-col gap-5 ${
            isSidebarOpen ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Quick Health Status Filters */}
          <div className="bg-neutral-950/90 rounded-2xl border border-neutral-800/90 p-4 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-500" /> Stream Health
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                {playlist ? `${playlist.channels.length} Streams` : 'Loading...'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => {
                  setHealthFilter('all');
                  setOnlyFavorites(false);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-all ${
                  healthFilter === 'all' && !onlyFavorites
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5" />
                  <span>All Channels</span>
                </div>
                <span className="font-mono text-[11px] opacity-80">{healthStats.total}</span>
              </button>

              <button
                onClick={() => {
                  setHealthFilter('online');
                  setOnlyFavorites(false);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-all border ${
                  healthFilter === 'online' && !onlyFavorites
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-emerald-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Working (Online)</span>
                </div>
                <span className="font-mono text-[11px] font-bold">{healthStats.online}</span>
              </button>

              <button
                onClick={() => {
                  setOnlyFavorites(true);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-all border ${
                  onlyFavorites
                    ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Favorites Saved</span>
                </div>
                <span className="font-mono text-[11px] font-bold">{favorites.size}</span>
              </button>

              <button
                onClick={() => {
                  setHealthFilter('offline');
                  setOnlyFavorites(false);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-all border ${
                  healthFilter === 'offline' && !onlyFavorites
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Offline / Down</span>
                </div>
                <span className="font-mono text-[11px] opacity-80">{healthStats.offline}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Drawer */}
          {playlist && playlist.categories.length > 0 && (
            <div className="bg-neutral-950/90 rounded-2xl border border-neutral-800/90 p-4 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-red-500" /> Categories
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {playlist.categories.length} Topics
                </span>
              </div>

              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-white text-black font-extrabold shadow-sm'
                      : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] font-mono opacity-80">{playlist.channels.length}</span>
                </button>

                {playlist.categories.map((cat, idx) => {
                  const count = playlist.channels.filter((c) => c.group === cat).length;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        selectedCategory === cat
                          ? 'bg-red-600 text-white font-bold shadow-sm'
                          : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="truncate max-w-[170px]">{cat}</span>
                      <span className="text-[10px] font-mono opacity-80">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Region & Language Selectors */}
          {playlist && (availableCountries.length > 0 || availableLanguages.length > 0) && (
            <div className="bg-neutral-950/90 rounded-2xl border border-neutral-800/90 p-4 flex flex-col gap-3 shadow-xl">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-red-500" /> Region & Language
              </span>

              {/* Country Select */}
              {availableCountries.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="All">All Countries ({availableCountries.length})</option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Language Select */}
              {availableLanguages.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="All">All Languages ({availableLanguages.length})</option>
                    {availableLanguages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Preset Playlists Switcher in Sidebar */}
          <div className="bg-neutral-950/90 rounded-2xl border border-neutral-800/90 p-4 flex flex-col gap-2.5 shadow-xl">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-red-500" /> Curated TV Feeds
            </span>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {PRESET_PLAYLISTS.slice(0, 8).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setPlaylistUrl(preset.url);
                    loadPlaylist(preset.url);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all ${
                    playlistUrl === preset.url
                      ? 'bg-neutral-800 text-white font-bold border border-red-600/70'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.name}</span>
                  </span>
                  {preset.badge && (
                    <span className="text-[9px] px-1.5 rounded bg-neutral-900 text-neutral-400">
                      {preset.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Main Channel Workspace */}
        <main className="flex-1 flex flex-col gap-4 w-full min-w-0">
          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500 bg-neutral-950/70 rounded-3xl border border-neutral-800 shadow-2xl">
              <Loader2 className="w-10 h-10 animate-spin" />
              <span className="text-sm font-bold text-neutral-200">Loading IPTV Channels & Broadcast Feeds...</span>
              <span className="text-xs text-neutral-500">Resolving stream addresses and running initial health diagnostics</span>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-5 rounded-3xl bg-red-950/40 border border-red-900/80 text-red-300 text-xs flex flex-col gap-3 shadow-2xl">
              <div className="flex items-center gap-2 font-bold text-sm text-red-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span>Could Not Load Playlist</span>
              </div>
              <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => loadPlaylist(playlistUrl)}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Retry Loading
                </button>
                <button
                  onClick={() => {
                    const fallback = 'https://iptv-org.github.io/iptv/index.m3u';
                    setPlaylistUrl(fallback);
                    loadPlaylist(fallback);
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
                >
                  Use Default Worldwide Index
                </button>
              </div>
            </div>
          )}

          {/* Channels Directory Workspace */}
          {!loading && !error && playlist && (
            <>
              {/* Workspace Action & Sort Toolbar */}
              <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
                {/* Active Filter Chips & Summary */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-white">
                    {sortedChannels.length} {sortedChannels.length === 1 ? 'Channel' : 'Channels'}
                  </span>

                  {onlyFavorites && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-600/70 text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                      <Star className="w-3 h-3 fill-current" /> Favorites Only
                      <button onClick={() => setOnlyFavorites(false)} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {healthFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                      Status: {healthFilter.toUpperCase()}
                      <button onClick={() => setHealthFilter('all')} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {selectedCategory !== 'All' && (
                    <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1 text-[11px]">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('All')} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {selectedCountry !== 'All' && (
                    <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold flex items-center gap-1 text-[11px]">
                      Country: {selectedCountry}
                      <button onClick={() => setSelectedCountry('All')} className="hover:text-white">✕</button>
                    </span>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-red-400 hover:text-red-300 font-bold underline ml-1"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Right: Sorting, View Mode & Per-Page Controls */}
                <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto flex-wrap">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs shadow-sm">
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="health-first" className="bg-neutral-900 text-white">
                        Healthy First (Online)
                      </option>
                      <option value="latency" className="bg-neutral-900 text-white">
                        Fastest Ping Latency
                      </option>
                      <option value="name-asc" className="bg-neutral-900 text-white">
                        Name (A → Z)
                      </option>
                      <option value="name-desc" className="bg-neutral-900 text-white">
                        Name (Z → A)
                      </option>
                      <option value="category" className="bg-neutral-900 text-white">
                        Category Group
                      </option>
                      <option value="country" className="bg-neutral-900 text-white">
                        Country
                      </option>
                    </select>
                  </div>

                  {/* Page Size Selector */}
                  <div className="hidden sm:flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1 text-xs text-neutral-400">
                    <span className="text-[10px]">Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value={24} className="bg-neutral-900 text-white">24</option>
                      <option value={36} className="bg-neutral-900 text-white">36</option>
                      <option value={72} className="bg-neutral-900 text-white">72</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${
                        viewMode === 'grid'
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Bento Grid View"
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
                      title="Broadcast EPG List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('theater')}
                      className={`p-1.5 rounded-lg transition-all ${
                        viewMode === 'theater'
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Wide Cinematic Cards"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Channel Display Container */}
              {paginatedChannels.length === 0 ? (
                <div className="text-center py-20 text-xs text-neutral-400 bg-neutral-950/40 rounded-3xl border border-neutral-800/80 flex flex-col items-center gap-3 shadow-xl">
                  <Tv className="w-10 h-10 text-neutral-700" />
                  <p className="text-sm font-bold text-neutral-300">No channels match your current filters</p>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    Try searching for another keyword or reset the category and health filters.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* 1. BENTO GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {paginatedChannels.map((ch) => {
                    const health = healthMap[ch.id];
                    const status = health?.status || 'untested';
                    const isFav = favorites.has(ch.url);

                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleChannelClick(ch)}
                        className={`group relative bg-neutral-900/90 hover:bg-neutral-800/95 border rounded-2xl p-4 flex flex-col justify-between gap-3.5 cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:scale-[1.01] ${
                          status === 'online'
                            ? 'border-neutral-800 hover:border-emerald-500/70'
                            : status === 'offline'
                            ? 'border-neutral-800/80 hover:border-rose-500/50 opacity-85'
                            : 'border-neutral-800 hover:border-red-600/50'
                        }`}
                      >
                        {/* Top: Logo, Call Sign, Group & Favorite Star */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            {ch.logo ? (
                              <img
                                src={ch.logo}
                                alt={ch.name}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-11 h-11 rounded-xl object-contain bg-neutral-950 border border-neutral-800 p-1 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-neutral-950 to-neutral-800 border border-neutral-700/80 text-red-500 flex items-center justify-center shrink-0 shadow-inner font-black text-xs">
                                {ch.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="flex flex-col overflow-hidden">
                              <h3 className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-red-400 transition-colors truncate">
                                {ch.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-300 font-mono border border-neutral-800 truncate max-w-[130px]">
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

                          {/* Star Button */}
                          <button
                            onClick={(e) => toggleFavorite(ch.url, e)}
                            className={`p-1.5 rounded-xl border transition-all active:scale-90 shrink-0 ${
                              isFav
                                ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                                : 'bg-neutral-950/70 border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700'
                            }`}
                            title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Middle: Stream Address & Health Status */}
                        <div className="flex items-center justify-between text-[11px]">
                          {status === 'online' && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-[10px] font-bold shadow-sm shadow-emerald-950">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              <span>WORKING</span>
                              {health?.latency && (
                                <span className="font-mono opacity-90 font-semibold">{health.latency}ms</span>
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
                              className="px-2 py-0.5 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-400 hover:text-neutral-200 text-[10px] font-semibold transition-all flex items-center gap-1"
                              title="Click to check if this channel is online"
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              <span>Test Ping</span>
                            </button>
                          )}

                          <span className="text-[10px] text-neutral-500 font-mono">
                            {ch.language ? ch.language.toUpperCase() : 'HLS LIVE'}
                          </span>
                        </div>

                        {/* Bottom Row: Probe CTA & Play Action */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-neutral-800/80 text-xs">
                          <button
                            onClick={(e) => handleCheckSingleChannel(ch, e)}
                            className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors flex items-center gap-1 text-[11px]"
                            title="Re-test channel ping"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="text-[10px]">Ping</span>
                          </button>

                          <div className="px-3.5 py-1.5 rounded-xl bg-red-600 group-hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Watch</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'list' ? (
                /* 2. DETAILED EPG TABLE VIEW */
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-950 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    <div className="col-span-1">Health</div>
                    <div className="col-span-6 sm:col-span-5">Channel & Protocol</div>
                    <div className="col-span-3 hidden sm:block">Group & Region</div>
                    <div className="col-span-2 hidden sm:block text-right">Ping (Latency)</div>
                    <div className="col-span-5 sm:col-span-1 text-right">Action</div>
                  </div>

                  <div className="divide-y divide-neutral-800/60">
                    {paginatedChannels.map((ch) => {
                      const health = healthMap[ch.id];
                      const status = health?.status || 'untested';
                      const isFav = favorites.has(ch.url);

                      return (
                        <div
                          key={ch.id}
                          onClick={() => handleChannelClick(ch)}
                          className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-neutral-800/80 cursor-pointer transition-colors text-xs"
                        >
                          <div className="col-span-1 flex items-center">
                            {status === 'online' && (
                              <div className="relative flex h-3 w-3" title={`Online (${health?.latency || 0}ms)`}>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                              </div>
                            )}
                            {status === 'offline' && (
                              <div className="w-3 h-3 rounded-full bg-rose-600" title="Offline" />
                            )}
                            {status === 'checking' && (
                              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            )}
                            {status === 'untested' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" title="Untested" />
                            )}
                          </div>

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
                                {ch.url.split('/')[2] || 'HLS Live Stream'}
                              </span>
                            </div>
                          </div>

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
                                Test
                              </button>
                            )}
                          </div>

                          <div className="col-span-5 sm:col-span-1 flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => toggleFavorite(ch.url, e)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isFav
                                  ? 'bg-amber-950 border-amber-600 text-amber-400'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
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
              ) : (
                /* 3. THEATER CINEMATIC CARDS VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedChannels.map((ch) => {
                    const health = healthMap[ch.id];
                    const status = health?.status || 'untested';
                    const isFav = favorites.has(ch.url);

                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleChannelClick(ch)}
                        className="group bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-red-600/70 rounded-3xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all shadow-xl hover:shadow-2xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3.5 overflow-hidden">
                            {ch.logo ? (
                              <img
                                src={ch.logo}
                                alt={ch.name}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-14 h-14 rounded-2xl object-contain bg-neutral-950 border border-neutral-800 p-2 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 text-red-500 flex items-center justify-center shrink-0 font-black text-sm">
                                {ch.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="flex flex-col overflow-hidden">
                              <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors truncate">
                                {ch.name}
                              </h3>
                              <span className="text-xs text-neutral-400 font-medium truncate mt-0.5">
                                {ch.group || 'Live TV Broadcast'}
                              </span>
                              <div className="flex items-center gap-2 mt-1.5">
                                {ch.country && (
                                  <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-300 font-bold text-[10px]">
                                    {ch.country}
                                  </span>
                                )}
                                <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[160px]">
                                  {ch.url}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => toggleFavorite(ch.url, e)}
                            className={`p-2 rounded-xl border transition-all ${
                              isFav
                                ? 'bg-amber-950 border-amber-500 text-amber-400'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            {status === 'online' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/70 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Working ({health?.latency || 42}ms)
                              </span>
                            ) : status === 'offline' ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-600 text-rose-300 text-[10px] font-bold">
                                Offline
                              </span>
                            ) : (
                              <button
                                onClick={(e) => handleCheckSingleChannel(ch, e)}
                                className="px-2.5 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-semibold flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 text-amber-400" /> Test Ping
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleChannelClick(ch)}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play Stream</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls Bar */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950/90 border border-neutral-800 rounded-2xl px-5 py-3.5 shadow-xl mt-2">
                  <span className="text-xs text-neutral-400">
                    Showing <span className="font-bold text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-bold text-white">
                      {Math.min(currentPage * pageSize, sortedChannels.length)}
                    </span>{' '}
                    of <span className="font-bold text-white">{sortedChannels.length}</span> channels
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 disabled:opacity-40 disabled:pointer-events-none transition-all"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-200">
                      <span>Page</span>
                      <span className="text-red-500">{currentPage}</span>
                      <span>of {totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 disabled:opacity-40 disabled:pointer-events-none transition-all"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 5. Sticky Bottom Bar if Background Video is Currently Playing */}
      {currentPlayingMedia && (
        <div className="sticky bottom-0 z-40 bg-neutral-950/95 border-t border-neutral-800 px-4 lg:px-8 py-3 backdrop-blur-md flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Active Stream in Background
              </span>
              <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                {currentPlayingMedia.title}
              </p>
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

      {/* 6. Footer with Developer Attribution */}
      <footer className="mt-auto border-t border-neutral-800/60 bg-neutral-950 py-4 px-4 text-center text-xs text-neutral-500">
        <p>
          OmniPlay TV Broadcast Guide • Created by{' '}
          <a
            href="https://suhail.top"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white underline font-semibold transition-colors"
          >
            Suhail Akhtar
          </a>
        </p>
      </footer>
    </div>
  );
};
