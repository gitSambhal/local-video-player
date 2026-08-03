import { IPTVChannel, M3UPlaylist } from '../types';

/**
 * Parses raw M3U/M3U8 text into an array of IPTVChannel items
 */
export function parseM3U(text: string, baseUrl?: string): IPTVChannel[] {
  const lines = text.split(/\r?\n/);
  const channels: IPTVChannel[] = [];

  let currentInfo: Partial<IPTVChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Parse tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      if (logoMatch && logoMatch[1]) {
        currentInfo.logo = logoMatch[1];
      }

      // Parse group-title
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch && groupMatch[1]) {
        currentInfo.group = groupMatch[1];
      }

      // Parse tvg-id
      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      if (idMatch && idMatch[1]) {
        currentInfo.tvgId = idMatch[1];
      }

      // Parse tvg-language
      const langMatch = line.match(/tvg-language="([^"]*)"/i);
      if (langMatch && langMatch[1]) {
        currentInfo.language = langMatch[1];
      }

      // Parse tvg-country
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      if (countryMatch && countryMatch[1]) {
        currentInfo.country = countryMatch[1];
      }

      // Parse title (everything after the comma)
      const commaIndex = line.indexOf(',');
      if (commaIndex !== -1) {
        currentInfo.name = line.substring(commaIndex + 1).trim();
      } else {
        currentInfo.name = 'Live Channel';
      }
    } else if (!line.startsWith('#')) {
      // Stream or Playlist URL
      let streamUrl = line;

      // Resolve relative URL if baseUrl is provided
      if (
        baseUrl &&
        !streamUrl.startsWith('http://') &&
        !streamUrl.startsWith('https://') &&
        !streamUrl.startsWith('blob:')
      ) {
        try {
          streamUrl = new URL(streamUrl, baseUrl).href;
        } catch {
          // Keep as is
        }
      }

      if (
        streamUrl.startsWith('http://') ||
        streamUrl.startsWith('https://') ||
        streamUrl.startsWith('blob:')
      ) {
        const channelName =
          currentInfo?.name || streamUrl.split('/').pop()?.split('?')[0] || 'Channel';
        const isSubPlaylist =
          streamUrl.toLowerCase().endsWith('.m3u') ||
          (streamUrl.toLowerCase().includes('.m3u') && !streamUrl.toLowerCase().includes('.m3u8'));

        channels.push({
          id: `iptv-${channels.length + 1}-${Math.random().toString(36).substring(7)}`,
          name: channelName,
          url: streamUrl,
          logo: currentInfo?.logo,
          group: currentInfo?.group || 'General',
          tvgId: currentInfo?.tvgId,
          language: currentInfo?.language,
          country: currentInfo?.country,
          isPlaylist: isSubPlaylist,
        });
      }

      currentInfo = null;
    }
  }

  return channels;
}

/**
 * Helper to fetch content with CORS proxy fallbacks
 */
export async function fetchTextWithFallback(url: string): Promise<string> {
  // Direct fetch first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text.includes('#EXTM3U') || text.includes('#EXTINF') || text.includes('http')) {
        return text;
      }
    }
  } catch (err) {
    console.warn('Direct fetch failed for M3U URL, trying CORS proxies...', err);
  }

  // Fallback 1: corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      return text;
    }
  } catch (err) {
    console.warn('corsproxy.io failed, trying allorigins...', err);
  }

  // Fallback 2: allorigins.win
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      return text;
    }
  } catch (err) {
    console.warn('allorigins proxy failed:', err);
  }

  throw new Error(`Unable to fetch M3U playlist from "${url}". Please verify the URL or network access.`);
}

/**
 * Fetches and parses an M3U playlist URL (e.g. https://iptv-org.github.io/iptv/index.m3u)
 */
export async function fetchAndParseM3U(url: string): Promise<M3UPlaylist> {
  const text = await fetchTextWithFallback(url);
  let channels = parseM3U(text, url);

  // Check if playlist contains sub-playlists (e.g., index.m3u pointing to news.m3u, music.m3u, etc.)
  const subPlaylists = channels.filter((c) => c.isPlaylist);

  if (subPlaylists.length > 0 && channels.length < 30) {
    const fetchedChannels: IPTVChannel[] = [];
    // Limit to top 6 sub-playlists to avoid blocking
    const topSubPlaylists = subPlaylists.slice(0, 6);

    for (const sub of topSubPlaylists) {
      try {
        const subText = await fetchTextWithFallback(sub.url);
        const subParsed = parseM3U(subText, sub.url);
        subParsed.forEach((ch) => {
          ch.group = ch.group || sub.name || 'IPTV Channels';
          fetchedChannels.push(ch);
        });
      } catch (e) {
        console.warn('Could not load sub-playlist:', sub.url, e);
      }
    }

    if (fetchedChannels.length > 0) {
      channels = fetchedChannels;
    }
  }

  // Extract unique categories
  const categorySet = new Set<string>();
  channels.forEach((ch) => {
    if (ch.group) categorySet.add(ch.group);
  });

  const categories = Array.from(categorySet).sort();

  return {
    url,
    title: url.split('/').pop()?.split('?')[0] || 'IPTV Playlist',
    channels,
    categories,
  };
}
