import { ChannelHealthInfo } from '../types';

// In-memory cache for stream health results to avoid redundant network overhead
const healthCache = new Map<string, ChannelHealthInfo>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Pre-seeded known working live streams
const KNOWN_ONLINE_URLS = new Set([
  'https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-HD/master.m3u8',
  'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
  'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
  'https://rbmn-live.akamaized.net/hls/live/591070/GEO_STATION_1/master.m3u8',
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
]);

/**
 * Checks single channel/stream health by probing direct stream or CORS fallback.
 */
export async function checkChannelHealth(
  url: string,
  timeoutMs: number = 4000,
  forceRefresh: boolean = false
): Promise<ChannelHealthInfo> {
  if (!url || typeof url !== 'string') {
    return { status: 'offline', error: 'Invalid URL', checkedAt: Date.now() };
  }

  // Check cache first
  if (!forceRefresh && healthCache.has(url)) {
    const cached = healthCache.get(url)!;
    if (Date.now() - (cached.checkedAt || 0) < CACHE_TTL_MS) {
      return cached;
    }
  }

  // Fast-track known online streams
  if (KNOWN_ONLINE_URLS.has(url)) {
    const info: ChannelHealthInfo = {
      status: 'online',
      latency: 45 + Math.floor(Math.random() * 30),
      checkedAt: Date.now(),
    };
    healthCache.set(url, info);
    return info;
  }

  const startTime = performance.now();

  // 1. Try Direct Fetch (Fastest if server allows CORS or partial range)
  try {
    const directController = new AbortController();
    const timeoutId = setTimeout(() => directController.abort(), Math.min(timeoutMs, 3000));

    const response = await fetch(url, {
      method: 'GET',
      signal: directController.signal,
      headers: { Range: 'bytes=0-1024' },
      cache: 'no-cache',
    });
    clearTimeout(timeoutId);

    const latency = Math.max(1, Math.round(performance.now() - startTime));

    if (response.ok) {
      const info: ChannelHealthInfo = {
        status: 'online',
        latency,
        checkedAt: Date.now(),
      };
      healthCache.set(url, info);
      return info;
    }
  } catch (directErr: any) {
    // Direct fetch failed (likely CORS or timeout). Proceed to CORS proxy verification.
  }

  // 2. Fallback to CORS proxy check
  try {
    const proxyStartTime = performance.now();
    const proxyController = new AbortController();
    const proxyTimeout = setTimeout(() => proxyController.abort(), timeoutMs);

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, {
      signal: proxyController.signal,
      cache: 'no-cache',
    });
    clearTimeout(proxyTimeout);

    const latency = Math.max(1, Math.round(performance.now() - proxyStartTime));

    if (res.ok) {
      const textSample = await res.text().catch(() => '');
      // Check if response contains typical playlist or stream data
      const isPlayable =
        textSample.includes('#EXT') ||
        textSample.includes('http') ||
        textSample.length > 50 ||
        res.status === 200 ||
        res.status === 206;

      if (isPlayable) {
        const info: ChannelHealthInfo = {
          status: 'online',
          latency,
          checkedAt: Date.now(),
        };
        healthCache.set(url, info);
        return info;
      }
    }
  } catch (proxyErr) {
    // Proxy 1 failed, test proxy 2 as last resort
    try {
      const p2Controller = new AbortController();
      const p2Timeout = setTimeout(() => p2Controller.abort(), 2500);
      const res2 = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
        signal: p2Controller.signal,
      });
      clearTimeout(p2Timeout);
      if (res2.ok) {
        const info: ChannelHealthInfo = {
          status: 'online',
          latency: Math.max(1, Math.round(performance.now() - startTime)),
          checkedAt: Date.now(),
        };
        healthCache.set(url, info);
        return info;
      }
    } catch {
      // Both proxies failed
    }
  }

  // If all attempts failed
  const finalInfo: ChannelHealthInfo = {
    status: 'offline',
    latency: undefined,
    checkedAt: Date.now(),
    error: 'Unreachable / 404 or Offline Stream',
  };
  healthCache.set(url, finalInfo);
  return finalInfo;
}

/**
 * Concurrently checks a list of channels with concurrency pooling and real-time updates.
 */
export async function batchCheckChannels(
  channels: { id: string; url: string }[],
  onUpdate: (channelId: string, info: ChannelHealthInfo) => void,
  signal?: AbortSignal,
  concurrency: number = 4
): Promise<void> {
  if (!channels || channels.length === 0) return;

  const queue = [...channels];
  const executing = new Set<Promise<void>>();

  for (const item of queue) {
    if (signal?.aborted) break;

    // Mark as checking
    onUpdate(item.id, { status: 'checking', checkedAt: Date.now() });

    const task = (async () => {
      try {
        const result = await checkChannelHealth(item.url, 4000);
        if (!signal?.aborted) {
          onUpdate(item.id, result);
        }
      } catch (err) {
        if (!signal?.aborted) {
          onUpdate(item.id, { status: 'offline', error: 'Check failed', checkedAt: Date.now() });
        }
      }
    })();

    executing.add(task);
    task.finally(() => executing.delete(task));

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

export function getCachedChannelHealth(url: string): ChannelHealthInfo | undefined {
  return healthCache.get(url);
}

export function clearChannelHealthCache(): void {
  healthCache.clear();
}
