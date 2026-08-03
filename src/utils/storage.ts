import { MediaItem, Bookmark, SubtitleSettings, VideoFilters, AudioSettings, AspectRatioMode } from '../types';

const STORAGE_KEYS = {
  RECENT_MEDIA: 'vlcx_recent_media',
  PLAYLISTS: 'vlcx_playlists',
  BOOKMARKS: 'vlcx_bookmarks',
  VIDEO_FILTERS: 'vlcx_video_filters',
  AUDIO_SETTINGS: 'vlcx_audio_settings',
  SUBTITLE_SETTINGS: 'vlcx_subtitle_settings',
  ASPECT_RATIO: 'vlcx_aspect_ratio',
  PLAYBACK_SPEED: 'vlcx_speed',
  DARK_MODE: 'vlcx_dark_mode',
};

export function getRecentMedia(): MediaItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_MEDIA);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecentMedia(media: MediaItem) {
  try {
    const list = getRecentMedia().filter((item) => item.id !== media.id);
    list.unshift(media);
    // Keep top 30 recents
    localStorage.setItem(STORAGE_KEYS.RECENT_MEDIA, JSON.stringify(list.slice(0, 30)));
  } catch (err) {
    console.warn('Failed to save recent media:', err);
  }
}

export function removeRecentMedia(mediaId: string): MediaItem[] {
  try {
    const list = getRecentMedia().filter((item) => item.id !== mediaId);
    localStorage.setItem(STORAGE_KEYS.RECENT_MEDIA, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function clearRecentMedia() {
  localStorage.removeItem(STORAGE_KEYS.RECENT_MEDIA);
}

export function getBookmarks(mediaId?: string): Bookmark[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    const all: Bookmark[] = data ? JSON.parse(data) : [];
    if (mediaId) {
      return all.filter((b) => b.mediaId === mediaId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveBookmark(bookmark: Bookmark) {
  try {
    const all = getBookmarks();
    all.push(bookmark);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(all));
  } catch (err) {
    console.warn('Failed to save bookmark:', err);
  }
}

export function deleteBookmark(id: string) {
  try {
    const all = getBookmarks().filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(all));
  } catch (err) {
    console.warn('Failed to delete bookmark:', err);
  }
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 20,
  color: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  bottomOffset: 40,
  delay: 0,
  enabled: true,
  activeTrackId: null,
};

export function getSubtitleSettings(): SubtitleSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUBTITLE_SETTINGS);
    return data ? { ...DEFAULT_SUBTITLE_SETTINGS, ...JSON.parse(data) } : DEFAULT_SUBTITLE_SETTINGS;
  } catch {
    return DEFAULT_SUBTITLE_SETTINGS;
  }
}

export function saveSubtitleSettings(settings: SubtitleSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBTITLE_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save subtitle settings:', err);
  }
}

export const DEFAULT_VIDEO_FILTERS: VideoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  invert: 0,
  sepia: 0,
  blur: 0,
  deinterlace: false,
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  volume: 1.0,
  gain: 1.0,
  muted: false,
  eqEnabled: false,
  eqBands: [0, 0, 0, 0, 0, 0, 0, 0],
  preset: 'Flat',
  audioDelay: 0,
  stereoPan: 0,
};
