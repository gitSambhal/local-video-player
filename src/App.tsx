import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MediaItem,
  VideoFilters,
  AspectRatioMode,
  AudioSettings,
  SubtitleSettings,
  SubtitleTrack,
  SubtitleCue,
  Bookmark,
  ABRepeatState,
  AudioTrackInfo,
} from './types';
import {
  getRecentMedia,
  saveRecentMedia,
  removeRecentMedia,
  clearRecentMedia,
  getBookmarks,
  saveBookmark,
  deleteBookmark,
  getSubtitleSettings,
  saveSubtitleSettings,
  DEFAULT_VIDEO_FILTERS,
  DEFAULT_AUDIO_SETTINGS,
} from './utils/storage';
import { p2pSync } from './utils/p2pSync';
import { uploadAndInspectMkv } from './utils/mkvUploader';

import { CanvasPlayer } from './components/VideoPlayer/CanvasPlayer';
import { PlayerTopBar } from './components/VideoPlayer/PlayerTopBar';
import { PlayerControls } from './components/VideoPlayer/PlayerControls';

import { VideoAdjustmentsModal } from './components/VideoPlayer/VideoAdjustmentsModal';
import { AudioEqModal } from './components/VideoPlayer/AudioEqModal';
import { SubtitleModal } from './components/VideoPlayer/SubtitleModal';
import { BookmarksModal } from './components/VideoPlayer/BookmarksModal';
import { SnapshotGifModal } from './components/VideoPlayer/SnapshotGifModal';
import { P2PSyncModal } from './components/P2PRoom/P2PSyncModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { MediaLibrary } from './components/Library/MediaLibrary';
import { IPTVManager } from './components/Library/IPTVManager';
import { MusicVisualizer } from './components/MusicMode/MusicVisualizer';
import { WelcomeLauncher } from './components/WelcomeLauncher';

export default function App() {
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('fit');
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isMusicMode, setIsMusicMode] = useState<boolean>(false);

  // Live TV Specific Launch State (Default to Live TV Portal)
  const [isLiveTvActive, setIsLiveTvActive] = useState<boolean>(true);
  const [liveTvUrl, setLiveTvUrl] = useState<string>('https://iptv-org.github.io/iptv/index.m3u');

  // Playlist Channel Zapping State
  const [playlistChannels, setPlaylistChannels] = useState<MediaItem[]>([]);
  const [currentChannelIndex, setCurrentChannelIndex] = useState<number>(-1);

  // Settings & Filter states
  const [videoFilters, setVideoFilters] = useState<VideoFilters>(DEFAULT_VIDEO_FILTERS);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(getSubtitleSettings());
  const [availableAudioTracks, setAvailableAudioTracks] = useState<AudioTrackInfo[]>([]);
  const [mkvAnalysisStatus, setMkvAnalysisStatus] = useState<string | null>(null);

  // Subtitles & Bookmarks
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleCues, setActiveSubtitleCues] = useState<SubtitleCue[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [abRepeat, setAbRepeat] = useState<ABRepeatState>({ enabled: false, pointA: null, pointB: null });

  // P2P Room State
  const [p2pRoomId, setP2pRoomId] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState<number>(1);

  // Modal Visibility States
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isVideoFiltersOpen, setIsVideoFiltersOpen] = useState<boolean>(false);
  const [isAudioEqOpen, setIsAudioEqOpen] = useState<boolean>(false);
  const [isSubtitlesOpen, setIsSubtitlesOpen] = useState<boolean>(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState<boolean>(false);
  const [isP2POpen, setIsP2POpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // HUD Auto-hide controls state
  const [showHud, setShowHud] = useState<boolean>(true);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const snapshotFnRef = useRef<(() => string | null) | null>(null);

  // Load Recents and Bookmarks on mount
  useEffect(() => {
    setRecentMedia(getRecentMedia());
    setBookmarks(getBookmarks());
  }, []);

  // Handle channel selection and playlist zapping
  const handleSelectMedia = async (
    media: MediaItem,
    allChannels?: MediaItem[],
    indexInPlaylist?: number,
    rawFile?: File
  ) => {
    setCurrentMedia(media);
    saveRecentMedia(media);
    setRecentMedia(getRecentMedia());
    setIsPlaying(true);
    setIsLiveTvActive(false);

    if (allChannels && allChannels.length > 0) {
      setPlaylistChannels(allChannels);
      setCurrentChannelIndex(indexInPlaylist !== undefined ? indexInPlaylist : 0);
    }

    if (media.isAudioOnly) {
      setIsMusicMode(true);
    }

    const targetFile = rawFile || (media as any).fileObj;
    if (targetFile && targetFile instanceof File) {
      const ext = targetFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'mkv' || ext === 'mp4' || ext === 'avi' || ext === 'webm') {
        setMkvAnalysisStatus('Preparing audio streams & multi-language track engine...');
      }

      try {
        const res = await uploadAndInspectMkv(targetFile, (percent) => {
          setMkvAnalysisStatus(`Processing video audio streams (${percent}%)...`);
        });

        if (res && res.audioTracks && res.audioTracks.length > 0) {
          setAvailableAudioTracks(res.audioTracks);
          const updatedMedia: MediaItem = {
            ...media,
            mkvFileId: res.fileId,
            mkvStreamUrl: res.streamUrl,
            detectedAudioTracks: res.audioTracks,
          };
          setCurrentMedia(updatedMedia);
          setMkvAnalysisStatus(null);
        } else {
          setMkvAnalysisStatus(null);
        }
      } catch (err) {
        console.warn('MKV multi-audio inspection error:', err);
        setMkvAnalysisStatus(null);
      }
    } else if (media.detectedAudioTracks && media.detectedAudioTracks.length > 0) {
      setAvailableAudioTracks(media.detectedAudioTracks);
      setMkvAnalysisStatus(null);
    } else {
      setAvailableAudioTracks([]);
      setMkvAnalysisStatus(null);
    }
  };

  // TV Channel Zapping (Next / Previous)
  const handleZapChannel = (direction: 'next' | 'prev') => {
    if (!playlistChannels || playlistChannels.length === 0 || currentChannelIndex < 0) return;

    let nextIndex = direction === 'next' ? currentChannelIndex + 1 : currentChannelIndex - 1;
    if (nextIndex >= playlistChannels.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = playlistChannels.length - 1;

    const nextChannel = playlistChannels[nextIndex];
    if (nextChannel) {
      setCurrentChannelIndex(nextIndex);
      setCurrentMedia(nextChannel);
      setIsPlaying(true);
      saveRecentMedia(nextChannel);
      setRecentMedia(getRecentMedia());
    }
  };

  // Sync active subtitle cues
  useEffect(() => {
    if (!subtitleSettings.enabled || !subtitleSettings.activeTrackId) {
      setActiveSubtitleCues([]);
      return;
    }

    const activeTrack = subtitleTracks.find((t) => t.id === subtitleSettings.activeTrackId);
    if (!activeTrack || !activeTrack.cues) {
      setActiveSubtitleCues([]);
      return;
    }

    const targetTime = currentTime + subtitleSettings.delay;
    const matchingCues = activeTrack.cues.filter(
      (cue) => targetTime >= cue.startTime && targetTime <= cue.endTime
    );
    setActiveSubtitleCues(matchingCues);
  }, [currentTime, subtitleSettings, subtitleTracks]);

  // Handle A-B Segment Loop Check
  useEffect(() => {
    if (abRepeat.enabled && abRepeat.pointA !== null && abRepeat.pointB !== null) {
      if (currentTime >= abRepeat.pointB) {
        if (videoRef.current) {
          videoRef.current.currentTime = abRepeat.pointA;
        }
      }
    }
  }, [currentTime, abRepeat]);

  // P2P Room sync subscription
  useEffect(() => {
    const unsubscribe = p2pSync.subscribe((action, payload) => {
      if (action === 'play') {
        setIsPlaying(true);
      } else if (action === 'pause') {
        setIsPlaying(false);
      } else if (action === 'seek' && videoRef.current) {
        videoRef.current.currentTime = payload.time;
      }
    });
    return () => unsubscribe();
  }, []);

  // HUD Auto-hide timer logic
  const handleMouseMove = () => {
    setShowHud(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    if (isPlaying) {
      hudTimeoutRef.current = setTimeout(() => {
        setShowHud(false);
      }, 3500);
    }
  };

  // Keyboard Shortcuts Handler (Includes PageUp/PageDown for TV Channel Zapping)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setAudioSettings((prev) => ({ ...prev, muted: !prev.muted }));
          break;
        case 'arrowleft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5);
          break;
        case 'arrowright':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5);
          break;
        case 'pageup':
          e.preventDefault();
          handleZapChannel('next');
          break;
        case 'pagedown':
          e.preventDefault();
          handleZapChannel('prev');
          break;
        case 'arrowup':
          e.preventDefault();
          setAudioSettings((prev) => {
            const newGain = Math.min(3.0, prev.gain + 0.1);
            return { ...prev, gain: newGain, volume: Math.min(1, newGain) };
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setAudioSettings((prev) => {
            const newGain = Math.max(0, prev.gain - 0.1);
            return { ...prev, gain: newGain, volume: Math.min(1, newGain) };
          });
          break;
        case 'c':
          e.preventDefault();
          cycleAspectRatio();
          break;
      }
    },
    [currentTime, duration, playlistChannels, currentChannelIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const cycleAspectRatio = () => {
    const modes: AspectRatioMode[] = ['fit', 'fill', 'stretch', '16:9', '4:3', '21:9', '1:1'];
    const idx = modes.indexOf(aspectRatio);
    const next = modes[(idx + 1) % modes.length];
    setAspectRatio(next);
  };

  const toggleAbRepeat = () => {
    if (!abRepeat.enabled) {
      setAbRepeat({ enabled: true, pointA: currentTime, pointB: null });
    } else if (abRepeat.pointA !== null && abRepeat.pointB === null) {
      setAbRepeat((prev) => ({ ...prev, pointB: currentTime }));
    } else {
      setAbRepeat({ enabled: false, pointA: null, pointB: null });
    }
  };

  const handleFrameStep = (direction: 'prev' | 'next') => {
    if (!videoRef.current) return;
    const frameTime = 1 / 30;
    setIsPlaying(false);
    videoRef.current.currentTime =
      direction === 'next'
        ? Math.min(duration, videoRef.current.currentTime + frameTime)
        : Math.max(0, videoRef.current.currentTime - frameTime);
  };

  const handleAddBookmark = (title: string, note?: string) => {
    if (!currentMedia) return;
    const newBm: Bookmark = {
      id: `bm-${Date.now()}`,
      mediaId: currentMedia.id,
      timestamp: currentTime,
      title,
      note,
      createdAt: Date.now(),
    };
    saveBookmark(newBm);
    setBookmarks(getBookmarks());
  };

  const handleDeleteBookmark = (id: string) => {
    deleteBookmark(id);
    setBookmarks(getBookmarks());
  };

  const handleJoinP2PRoom = (roomId: string) => {
    setP2pRoomId(roomId);
    p2pSync.initRoom(roomId);
    setPeerCount(2);
  };

  const handleLeaveP2PRoom = () => {
    p2pSync.leaveRoom();
    setP2pRoomId(null);
    setPeerCount(1);
  };

  if (isLiveTvActive) {
    return (
      <IPTVManager
        initialUrl={liveTvUrl}
        currentPlayingMedia={currentMedia}
        onSelectChannel={(media, allChannels, currentIndex) => {
          handleSelectMedia(media, allChannels, currentIndex);
        }}
        onBack={currentMedia ? () => setIsLiveTvActive(false) : undefined}
        onClose={currentMedia ? () => setIsLiveTvActive(false) : undefined}
      />
    );
  }

  if (!currentMedia) {
    return (
      <WelcomeLauncher
        onSelectMedia={handleSelectMedia}
        onOpenIPTV={(initialUrl) => {
          if (initialUrl) setLiveTvUrl(initialUrl);
          setIsLiveTvActive(true);
        }}
        recentMedia={recentMedia}
        onRemoveRecent={(id) => {
          removeRecentMedia(id);
          setRecentMedia(getRecentMedia());
        }}
        onClearRecents={() => {
          clearRecentMedia();
          setRecentMedia([]);
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-black text-neutral-100 flex flex-col font-sans overflow-hidden select-none"
    >
      {/* Top Bar HUD */}
      <div className={`transition-opacity duration-300 ${showHud ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-40 relative`}>
        <PlayerTopBar
          media={currentMedia}
          isFullscreen={!!document.fullscreenElement}
          isP2PActive={!!p2pRoomId}
          p2pPeerCount={peerCount}
          isMusicMode={isMusicMode}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenLiveTV={() => setIsLiveTvActive(true)}
          onReturnHome={() => setIsLiveTvActive(true)}
          onToggleMusicMode={() => setIsMusicMode(!isMusicMode)}
          onOpenP2PModal={() => setIsP2POpen(true)}
          onOpenVideoFilters={() => setIsVideoFiltersOpen(true)}
          onOpenAudioEq={() => setIsAudioEqOpen(true)}
          onOpenSubtitles={() => setIsSubtitlesOpen(true)}
          onOpenBookmarks={() => setIsBookmarksOpen(true)}
          onOpenSnapshot={() => setIsSnapshotOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onTogglePip={() => {
            if (videoRef.current && document.pictureInPictureEnabled) {
              videoRef.current.requestPictureInPicture().catch(() => {});
            }
          }}
          onToggleFullscreen={toggleFullscreen}
          availableAudioTracks={availableAudioTracks}
          activeAudioTrackId={audioSettings.activeAudioTrackId}
          onSelectAudioTrack={(trackId) =>
            setAudioSettings((prev) => ({ ...prev, activeAudioTrackId: trackId }))
          }
        />
      </div>

      {/* Main Canvas View */}
      <div className="relative flex-1 w-full h-full">
        {mkvAnalysisStatus && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 backdrop-blur-md border border-red-500/50 text-red-200 px-4 py-2 rounded-full shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>{mkvAnalysisStatus}</span>
          </div>
        )}

        <div className={`w-full h-full ${isMusicMode ? 'opacity-0 pointer-events-none absolute inset-0' : 'block'}`}>
          <CanvasPlayer
            media={currentMedia}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            videoFilters={videoFilters}
            aspectRatio={aspectRatio}
            audioSettings={audioSettings}
            subtitleSettings={subtitleSettings}
            activeSubtitleCues={activeSubtitleCues}
            onTimeUpdate={(cTime, dur) => {
              setCurrentTime(cTime);
              setDuration(dur);
            }}
            onEnded={() => {
              if (playlistChannels.length > 0) {
                handleZapChannel('next');
              } else if (isLooping && videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
              } else {
                setIsPlaying(false);
              }
            }}
            onTogglePlay={() => {
              const nextState = !isPlaying;
              setIsPlaying(nextState);
              if (p2pRoomId) p2pSync.sendAction(nextState ? 'play' : 'pause', { time: currentTime });
            }}
            onVolumeChange={(newVol, newGain) => setAudioSettings((prev) => ({ ...prev, volume: newVol, gain: newGain }))}
            onBrightnessChange={(newBrightness) => setVideoFilters((prev) => ({ ...prev, brightness: newBrightness }))}
            onSeekChange={(newTime) => {
              if (videoRef.current) videoRef.current.currentTime = newTime;
              setCurrentTime(newTime);
              if (p2pRoomId) p2pSync.sendAction('seek', { time: newTime });
            }}
            videoRef={videoRef}
            containerRef={containerRef}
            onRegisterSnapshotFn={(fn) => {
              snapshotFnRef.current = fn;
            }}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenLiveTV={() => setIsLiveTvActive(true)}
            onReturnHome={() => setIsLiveTvActive(true)}
            onAudioTracksUpdate={(tracks, activeId) => {
              setAvailableAudioTracks(tracks);
              if (audioSettings.activeAudioTrackId === undefined) {
                setAudioSettings((prev) => ({ ...prev, activeAudioTrackId: activeId }));
              }
            }}
          />
        </div>

        {isMusicMode && (
          <div className="absolute inset-0 z-10 w-full h-full">
            <MusicVisualizer
              media={currentMedia}
              isPlaying={isPlaying}
              onTogglePlay={() => {
                const nextState = !isPlaying;
                setIsPlaying(nextState);
                if (p2pRoomId) p2pSync.sendAction(nextState ? 'play' : 'pause', { time: currentTime });
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls HUD */}
      <div className={`transition-opacity duration-300 ${showHud ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={audioSettings.volume}
          gain={audioSettings.gain}
          muted={audioSettings.muted}
          playbackSpeed={playbackSpeed}
          abRepeat={abRepeat}
          isLooping={isLooping}
          aspectRatio={aspectRatio}
          videoFilters={videoFilters}
          audioSettings={audioSettings}
          subtitleSettings={subtitleSettings}
          subtitleTracks={subtitleTracks}
          availableAudioTracks={availableAudioTracks}
          isFullscreen={!!document.fullscreenElement}
          onTogglePlay={() => {
            const nextState = !isPlaying;
            setIsPlaying(nextState);
            if (p2pRoomId) p2pSync.sendAction(nextState ? 'play' : 'pause', { time: currentTime });
          }}
          onSeek={(seconds) => {
            if (videoRef.current) videoRef.current.currentTime = seconds;
            setCurrentTime(seconds);
            if (p2pRoomId) p2pSync.sendAction('seek', { time: seconds });
          }}
          onVolumeChange={(vol, gain) => setAudioSettings((prev) => ({ ...prev, volume: vol, gain }))}
          onToggleMute={() => setAudioSettings((prev) => ({ ...prev, muted: !prev.muted }))}
          onSpeedChange={(spd) => setPlaybackSpeed(spd)}
          onToggleAbRepeat={toggleAbRepeat}
          onToggleLooping={() => setIsLooping(!isLooping)}
          onCycleAspectRatio={cycleAspectRatio}
          onUpdateAspectRatio={setAspectRatio}
          onFrameStep={handleFrameStep}
          onUpdateFilters={setVideoFilters}
          onResetFilters={() => setVideoFilters(DEFAULT_VIDEO_FILTERS)}
          onUpdateAudioSettings={setAudioSettings}
          onUpdateSubtitleSettings={(stg) => {
            setSubtitleSettings(stg);
            saveSubtitleSettings(stg);
          }}
          onAddSubtitleTrack={(tr) => setSubtitleTracks((prev) => [...prev, tr])}
          onSelectAudioTrack={(trackId) =>
            setAudioSettings((prev) => ({ ...prev, activeAudioTrackId: trackId }))
          }
          onTogglePip={() => {
            if (videoRef.current && document.pictureInPictureEnabled) {
              videoRef.current.requestPictureInPicture().catch(() => {});
            }
          }}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      {/* Modals & Dialogs */}
      <MediaLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        recentMedia={recentMedia}
        currentMediaId={currentMedia?.id}
        onSelectMedia={handleSelectMedia}
        onRemoveRecent={(id) => {
          removeRecentMedia(id);
          setRecentMedia(getRecentMedia());
        }}
        onClearRecents={() => {
          clearRecentMedia();
          setRecentMedia([]);
        }}
        onOpenLiveTV={(url) => {
          if (url) setLiveTvUrl(url);
          setIsLiveTvActive(true);
        }}
      />

      <VideoAdjustmentsModal
        isOpen={isVideoFiltersOpen}
        onClose={() => setIsVideoFiltersOpen(false)}
        filters={videoFilters}
        aspectRatio={aspectRatio}
        onUpdateFilters={setVideoFilters}
        onUpdateAspectRatio={setAspectRatio}
        onResetFilters={() => setVideoFilters(DEFAULT_VIDEO_FILTERS)}
      />

      <AudioEqModal
        isOpen={isAudioEqOpen}
        onClose={() => setIsAudioEqOpen(false)}
        audioSettings={audioSettings}
        onUpdateAudioSettings={setAudioSettings}
        availableAudioTracks={availableAudioTracks}
      />

      <SubtitleModal
        isOpen={isSubtitlesOpen}
        onClose={() => setIsSubtitlesOpen(false)}
        subtitleSettings={subtitleSettings}
        subtitleTracks={subtitleTracks}
        onUpdateSubtitleSettings={(stg) => {
          setSubtitleSettings(stg);
          saveSubtitleSettings(stg);
        }}
        onAddSubtitleTrack={(track) => setSubtitleTracks((prev) => [...prev, track])}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        currentTime={currentTime}
        mediaId={currentMedia?.id || ''}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onSeekTo={(sec) => {
          if (videoRef.current) videoRef.current.currentTime = sec;
          setCurrentTime(sec);
        }}
      />

      <SnapshotGifModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        onTakeSnapshot={() => (snapshotFnRef.current ? snapshotFnRef.current() : null)}
        videoTitle={currentMedia?.title}
      />

      <P2PSyncModal
        isOpen={isP2POpen}
        onClose={() => setIsP2POpen(false)}
        activeRoomId={p2pRoomId}
        onJoinRoom={handleJoinP2PRoom}
        onLeaveRoom={handleLeaveP2PRoom}
        peerCount={peerCount}
      />

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
