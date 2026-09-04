export interface MediaItem {
  id: string;
  title: string;
  src: string;
  type: 'file' | 'url' | 'sample';
  fileType?: string; // e.g., 'video/mp4', 'application/x-mpegURL', 'audio/mp3'
  format?: string; // 'MP4', 'HLS', 'WEBM', 'MP3', etc.
  duration?: number;
  size?: number;
  addedAt: number;
  thumbnail?: string;
  artist?: string;
  description?: string;
  isAudioOnly?: boolean;
  subtitles?: SubtitleTrack[];
  logo?: string;
  group?: string;
  isLive?: boolean;
  mkvFileId?: string;
  mkvStreamUrl?: string;
  detectedAudioTracks?: AudioTrackInfo[];
}

export type ChannelHealthStatus = 'online' | 'offline' | 'checking' | 'untested';

export interface ChannelHealthInfo {
  status: ChannelHealthStatus;
  latency?: number; // in milliseconds
  checkedAt?: number;
  error?: string;
}

export interface IPTVChannel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  language?: string;
  country?: string;
  isPlaylist?: boolean;
  health?: ChannelHealthInfo;
}

export interface M3UPlaylist {
  url: string;
  title: string;
  channels: IPTVChannel[];
  categories: string[];
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src?: string; // blob URL or text data
  cues?: SubtitleCue[];
  isCustom?: boolean;
}

export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleSettings {
  fontSize: number; // in px
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  bottomOffset: number; // in % or px
  delay: number; // in seconds (+/-)
  enabled: boolean;
  activeTrackId: string | null;
}

export interface VideoFilters {
  brightness: number; // 0 to 200, default 100
  contrast: number; // 0 to 200, default 100
  saturation: number; // 0 to 200, default 100
  hueRotate: number; // 0 to 360, default 0
  invert: number; // 0 to 100, default 0
  sepia: number; // 0 to 100, default 0
  blur: number; // 0 to 10, default 0
  deinterlace: boolean; // SVG sharpening/scanlines effect
}

export type AspectRatioMode = 'fit' | 'fill' | 'stretch' | '16:9' | '4:3' | '21:9' | '1:1';

export interface AudioTrackInfo {
  id: number;
  name: string;
  lang?: string;
  groupId?: string;
  default?: boolean;
}

export interface AudioSettings {
  volume: number; // 0 to 1
  gain: number; // 1.0 to 3.0 (100% to 300% boost!)
  muted: boolean;
  eqEnabled: boolean;
  eqBands: number[]; // 6 bands: [60, 170, 310, 600, 1000, 3000, 6000, 12000] gain values in dB (-12 to +12)
  preset: string;
  audioDelay: number; // in seconds (-5 to +5)
  stereoPan: number; // -1 (left) to 1 (right)
  activeAudioTrackId?: number;
}

export interface Bookmark {
  id: string;
  mediaId: string;
  timestamp: number;
  title: string;
  note?: string;
  createdAt: number;
  thumbnail?: string;
}

export interface ABRepeatState {
  enabled: boolean;
  pointA: number | null;
  pointB: number | null;
}

export interface P2PRoomState {
  roomId: string;
  isHost: boolean;
  connectedPeers: number;
  syncedTime: number;
  isPlaying: boolean;
}

export interface GestureState {
  activeGesture: 'volume' | 'brightness' | 'seek' | 'zoom' | null;
  value: number;
  label: string;
}

export interface SampleMedia {
  title: string;
  src: string;
  type: 'video' | 'hls' | 'audio';
  format: string;
  thumbnail: string;
  artist?: string;
  description: string;
  isLive?: boolean;
}
