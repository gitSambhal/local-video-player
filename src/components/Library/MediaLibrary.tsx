import React, { useState } from 'react';
import { MediaItem } from '../../types';
import { SAMPLE_MEDIA_LIST } from '../../data/sampleMedia';
import { IPTVManager } from './IPTVManager';
import {
  FolderOpen,
  Upload,
  Link as LinkIcon,
  Play,
  Film,
  Music,
  Trash2,
  Clock,
  Sparkles,
  Search,
  X,
  Tv,
} from 'lucide-react';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  recentMedia: MediaItem[];
  currentMediaId?: string;
  onSelectMedia: (media: MediaItem) => void;
  onRemoveRecent: (id: string) => void;
  onClearRecents: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  isOpen,
  onClose,
  recentMedia,
  currentMediaId,
  onSelectMedia,
  onRemoveRecent,
  onClearRecents,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'recents' | 'iptv' | 'url' | 'upload'>('iptv');
  const [urlInput, setUrlInput] = useState('');
  const [urlTitleInput, setUrlTitleInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [iptvUrlOverride, setIptvUrlOverride] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const isM3u = file.name.endsWith('.m3u') || file.name.endsWith('.m3u8');
      if (isM3u) {
        setActiveTab('iptv');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const isAudio = file.type.startsWith('audio');
      const mediaItem: MediaItem & { fileObj?: File } = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: file.name,
        src: objectUrl,
        type: 'file',
        fileType: file.type,
        format: file.name.split('.').pop()?.toUpperCase() || (isAudio ? 'AUDIO' : 'VIDEO'),
        size: file.size,
        addedAt: Date.now(),
        isAudioOnly: isAudio,
        fileObj: file,
      };
      onSelectMedia(mediaItem);
    });
    if (activeTab !== 'iptv') {
      onClose();
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const src = urlInput.trim();
    const isM3uPlaylist = src.includes('.m3u') || src.includes('iptv') || src.includes('index.m3u');

    if (isM3uPlaylist && !src.endsWith('.m3u8')) {
      setIptvUrlOverride(src);
      setActiveTab('iptv');
      return;
    }

    const isHls = src.includes('.m3u8') || src.includes('.m3u');
    const isAudio = src.endsWith('.mp3') || src.endsWith('.wav') || src.endsWith('.flac');

    const mediaItem: MediaItem = {
      id: `url-${Date.now()}`,
      title: urlTitleInput.trim() || src.split('/').pop()?.split('?')[0] || 'Stream Link',
      src,
      type: 'url',
      format: isHls ? 'HLS Stream' : isAudio ? 'AUDIO' : 'MP4/Web',
      addedAt: Date.now(),
      isAudioOnly: isAudio,
      isLive: isHls,
    };
    onSelectMedia(mediaItem);
    setUrlInput('');
    setUrlTitleInput('');
    onClose();
  };

  const filteredSamples = SAMPLE_MEDIA_LIST.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden p-6 shadow-2xl text-neutral-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <FolderOpen className="w-5 h-5 text-red-500" />
            <span>Media Library & Live Catalog</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('iptv')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'iptv'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>IPTV Live Channels</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'samples'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sample Movies</span>
          </button>

          <button
            onClick={() => setActiveTab('recents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'recents'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recent History ({recentMedia.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'url'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Network URL</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'upload'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Open Local File</span>
          </button>
        </div>

        {/* Tab: IPTV Channels */}
        {activeTab === 'iptv' && (
          <IPTVManager
            initialUrl={iptvUrlOverride || 'https://iptv-org.github.io/iptv/index.m3u'}
            onSelectChannel={(media) => {
              onSelectMedia(media);
              onClose();
            }}
            onClose={onClose}
          />
        )}

        {/* Tab 1: Sample Media Catalog */}
        {activeTab === 'samples' && (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-1">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sample movies, trailers & HLS streams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSamples.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectMedia({
                      id: `sample-${idx}`,
                      title: sample.title,
                      src: sample.src,
                      type: 'sample',
                      format: sample.format,
                      addedAt: Date.now(),
                      thumbnail: sample.thumbnail,
                      artist: sample.artist,
                      isAudioOnly: sample.type === 'audio',
                    });
                    onClose();
                  }}
                  className="group bg-neutral-950 hover:bg-neutral-800/90 border border-neutral-800 hover:border-neutral-600 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col shadow-md"
                >
                  <div className="relative h-28 bg-black overflow-hidden">
                    <img
                      src={sample.thumbnail}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2 bg-neutral-900/90 text-neutral-300 font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-700 font-semibold">
                      {sample.format}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="text-xs font-bold text-neutral-200 group-hover:text-red-400 transition-colors line-clamp-1">
                      {sample.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{sample.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Recent History */}
        {activeTab === 'recents' && (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Played Media Files ({recentMedia.length})</span>
              {recentMedia.length > 0 && (
                <button
                  onClick={onClearRecents}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {recentMedia.length === 0 ? (
              <div className="text-xs text-neutral-500 text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                No recent playback history found. Open a local movie or sample video!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentMedia.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-neutral-950 hover:bg-neutral-800/90 border rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${
                      currentMediaId === item.id ? 'border-red-600 bg-red-950/20' : 'border-neutral-800'
                    }`}
                  >
                    <div
                      onClick={() => {
                        onSelectMedia(item);
                        onClose();
                      }}
                      className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden"
                    >
                      {item.isAudioOnly ? (
                        <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-red-950 border border-red-800/50 text-red-500 flex items-center justify-center shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-neutral-200 truncate">{item.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                          <span>{item.format}</span>
                          <span>•</span>
                          <span>{new Date(item.addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectMedia(item);
                          onClose();
                        }}
                        className="p-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play</span>
                      </button>

                      <button
                        onClick={() => onRemoveRecent(item.id)}
                        className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Direct URL */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4 bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-200">Video / Audio Stream URL</span>
              <span className="text-[11px] text-neutral-400">Supports direct MP4, WebM, OGG, HLS (.m3u8), or live stream links</span>
            </div>

            <input
              type="url"
              required
              placeholder="https://example.com/video.mp4 or stream.m3u8..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 font-mono"
            />

            <input
              type="text"
              placeholder="Optional Video Title..."
              value={urlTitleInput}
              onChange={(e) => setUrlTitleInput(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
            />

            <button
              type="submit"
              className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all active:scale-[0.99]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Load Stream & Play</span>
            </button>
          </form>
        )}

        {/* Tab 4: Local File Selection */}
        {activeTab === 'upload' && (
          <div className="flex flex-col gap-4">
            <label className="border-2 border-dashed border-neutral-700 hover:border-red-600 bg-neutral-950 hover:bg-neutral-900 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center">
              <Upload className="w-10 h-10 text-red-500 animate-bounce" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-neutral-100">Select Local Video / Audio File</span>
                <span className="text-xs text-neutral-400">Supports MP4, MKV, WebM, AVI, MOV, MP3, WAV, FLAC</span>
              </div>
              <input type="file" multiple accept="video/*,audio/*,.mkv,.avi" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
