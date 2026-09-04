import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  MediaItem,
  VideoFilters,
  AspectRatioMode,
  SubtitleSettings,
  SubtitleCue,
  GestureState,
  AudioSettings,
  AudioTrackInfo,
} from '../../types';
import { audioEngine } from '../../utils/audioEngine';
import { Play, Pause, Sun, Volume2, FastForward, Rewind, ZoomIn, Radio, AlertTriangle, RefreshCw, ShieldAlert, Home, ArrowLeft } from 'lucide-react';

interface CanvasPlayerProps {
  media: MediaItem | null;
  isPlaying: boolean;
  playbackSpeed: number;
  videoFilters: VideoFilters;
  aspectRatio: AspectRatioMode;
  audioSettings: AudioSettings;
  subtitleSettings: SubtitleSettings;
  activeSubtitleCues: SubtitleCue[];
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onTogglePlay: () => void;
  onVolumeChange: (newVol: number, newGain: number) => void;
  onBrightnessChange: (newBrightness: number) => void;
  onSeekChange: (newTime: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onRegisterSnapshotFn?: (fn: () => string | null) => void;
  onOpenLibrary?: () => void;
  onOpenLiveTV?: () => void;
  onReturnHome?: () => void;
  onAudioTracksUpdate?: (tracks: AudioTrackInfo[], currentTrackId: number) => void;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  media,
  isPlaying,
  playbackSpeed,
  videoFilters,
  aspectRatio,
  audioSettings,
  subtitleSettings,
  activeSubtitleCues,
  onTimeUpdate,
  onEnded,
  onTogglePlay,
  onVolumeChange,
  onBrightnessChange,
  onSeekChange,
  videoRef,
  containerRef,
  onRegisterSnapshotFn,
  onOpenLibrary,
  onOpenLiveTV,
  onReturnHome,
  onAudioTracksUpdate,
}) => {
  const hlsRef = useRef<Hls | null>(null);
  const [gestureState, setGestureState] = useState<GestureState | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stream state & CORS Proxy fallbacks
  const [streamError, setStreamError] = useState<string | null>(null);
  const [proxyIndex, setProxyIndex] = useState<number>(0); // 0: Direct, 1: corsproxy.io, 2: allorigins.win, 3: thingproxy

  // Ripple effect states
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  // Drag state for gesture controls
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; type: 'volume' | 'brightness' | 'seek'; startVal: number }>({
    x: 0,
    y: 0,
    type: 'volume',
    startVal: 0,
  });

  const lastClickTimeRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset error & proxy mode when media source changes
  useEffect(() => {
    setStreamError(null);
    setProxyIndex(0);
  }, [media?.src]);

  // Compute proxied stream URL
  const getProxiedUrl = (url: string, index: number) => {
    if (!url) return '';
    if (index === 1) return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    if (index === 2) return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    if (index === 3) return `https://thingproxy.freeboard.io/fetch/${url}`;
    return url;
  };

  // Initialize HLS or HTML5 Video
  useEffect(() => {
    const videoNode = videoRef.current;
    if (!videoNode || !media) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls =
      media.type === 'hls' ||
      media.src.includes('.m3u8') ||
      media.src.includes('.m3u') ||
      media.src.includes('m3u') ||
      media.format?.toLowerCase().includes('hls') ||
      !!media.isLive;

    const sourceUrl = getProxiedUrl(media.src, proxyIndex);

    const syncAudioTracks = () => {
      if (!onAudioTracksUpdate) return;

      if (media?.detectedAudioTracks && media.detectedAudioTracks.length > 0) {
        onAudioTracksUpdate(media.detectedAudioTracks, audioSettings.activeAudioTrackId ?? 0);
        return;
      }

      let tracks: AudioTrackInfo[] = [];

      if (hlsRef.current && hlsRef.current.audioTracks && hlsRef.current.audioTracks.length > 0) {
        tracks = hlsRef.current.audioTracks.map((t: any, idx: number) => ({
          id: idx,
          name: t.name || t.lang || `Audio Track ${idx + 1}`,
          lang: t.lang || t.name || '',
          groupId: t.groupId,
          default: t.default,
        }));
        onAudioTracksUpdate(tracks, hlsRef.current.audioTrack >= 0 ? hlsRef.current.audioTrack : 0);
        return;
      }

      const nativeAudioTracks = (videoNode as any).audioTracks;
      if (nativeAudioTracks && nativeAudioTracks.length > 0) {
        tracks = Array.from(nativeAudioTracks).map((t: any, idx: number) => ({
          id: idx,
          name: t.label || t.language || `Audio Track ${idx + 1}`,
          lang: t.language || '',
          default: t.enabled,
        }));
        const activeIdx = Array.from(nativeAudioTracks).findIndex((t: any) => t.enabled);
        onAudioTracksUpdate(tracks, activeIdx >= 0 ? activeIdx : 0);
        return;
      }

      // If no multi-stream manifests found, send empty array so UI provides Channel Modes
      onAudioTracksUpdate([], audioSettings.activeAudioTrackId ?? 0);
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
      });

      hls.loadSource(sourceUrl);
      hls.attachMedia(videoNode);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamError(null);
        if (isPlaying) {
          videoNode.play().catch(() => {});
        }
        syncAudioTracks();
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        syncAudioTracks();
      });

      hls.on(Hls.Events.AUDIO_TRACK_LOADED, () => {
        syncAudioTracks();
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        syncAudioTracks();
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
        syncAudioTracks();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network Error, trying recovery...', data);
              if (proxyIndex === 0) {
                console.log('Auto-trying CORS Proxy 1 for stream:', media.src);
                setProxyIndex(1);
              } else if (proxyIndex === 1) {
                console.log('Auto-trying CORS Proxy 2 for stream:', media.src);
                setProxyIndex(2);
              } else {
                setStreamError('Network / CORS Error: Stream URL could not be loaded or source server is offline.');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media Error, recovering...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS Error:', data);
              setStreamError('Stream Error: Playback format not supported or manifest unparseable.');
              break;
          }
        }
      });
    } else {
      videoNode.src = sourceUrl;
      videoNode.load();
      if (isPlaying) {
        videoNode.play().catch(() => {});
      }
      syncAudioTracks();
    }

    // Attach Web Audio engine for >100% boost and Equalizer
    const setupAudioEngine = () => {
      audioEngine.init(videoNode);
      audioEngine.resume();
      audioEngine.setGain(audioSettings.gain);
      audioEngine.setAudioTrackMode(audioSettings.activeAudioTrackId ?? 0);
      if (audioSettings.eqEnabled) {
        audioEngine.setEqBands(audioSettings.eqBands);
      }
    };

    videoNode.oncanplay = setupAudioEngine;
    videoNode.onplay = setupAudioEngine;
    videoNode.onloadedmetadata = setupAudioEngine;
    if (videoNode.readyState >= 1) {
      setupAudioEngine();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [media?.src, proxyIndex]);

  // Sync play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      audioEngine.resume();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Sync active audio track selection
  useEffect(() => {
    const trackId = audioSettings.activeAudioTrackId;
    if (trackId === undefined || trackId < 0) return;

    // 1. Reload backend MKV FFmpeg stream if playing local uploaded MKV
    if (media?.mkvFileId && videoRef.current) {
      const video = videoRef.current;
      const currentPos = video.currentTime || 0;
      const currentSrc = video.src || '';
      const targetParam = `audioTrack=${trackId}`;

      if (!currentSrc.includes(targetParam)) {
        const newSrc = `/api/mkv/stream/${media.mkvFileId}?audioTrack=${trackId}&t=${Math.floor(currentPos)}`;
        video.src = newSrc;
        video.load();
        if (isPlaying) {
          video.play().catch(() => {});
        }
      }
    }

    // 2. Sync HLS audio track if available in stream manifest
    if (hlsRef.current && hlsRef.current.audioTracks && hlsRef.current.audioTracks.length > trackId) {
      if (hlsRef.current.audioTrack !== trackId) {
        hlsRef.current.audioTrack = trackId;
      }
    }

    // 3. Sync Native HTML5 video element audio tracks if available
    if (videoRef.current) {
      const nativeTracks = (videoRef.current as any).audioTracks;
      if (nativeTracks && nativeTracks.length > trackId) {
        for (let i = 0; i < nativeTracks.length; i++) {
          nativeTracks[i].enabled = i === trackId;
        }
      }
    }

    // 4. Apply real-time Web Audio Engine acoustic frequency profile
    audioEngine.setAudioTrackMode(trackId);
  }, [audioSettings.activeAudioTrackId, media?.mkvFileId]);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync Audio Settings (Volume & Gain)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = audioSettings.muted ? 0 : Math.min(1, audioSettings.volume);
    }
    audioEngine.setGain(audioSettings.gain);
    if (audioSettings.eqEnabled) {
      audioEngine.setEqBands(audioSettings.eqBands);
    }
    audioEngine.setStereoPan(audioSettings.stereoPan);
  }, [audioSettings]);

  // Snapshot function registration
  useEffect(() => {
    if (onRegisterSnapshotFn) {
      onRegisterSnapshotFn(() => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return null;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
      });
    }
  }, [onRegisterSnapshotFn]);

  // Show temporary HUD gesture badge
  const showGesture = useCallback((type: 'volume' | 'brightness' | 'seek' | 'zoom', value: number, label: string) => {
    setGestureState({ activeGesture: type, value, label });
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => {
      setGestureState(null);
    }, 1200);
  }, []);

  // Handle double tap / click ripple & action
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !videoRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relativeX = x / rect.width;

    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;

    if (timeDiff < 300) {
      // Double click detected!
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

      if (relativeX < 0.4) {
        // Double click left: Rewind 10s
        const newTime = Math.max(0, videoRef.current.currentTime - 10);
        onSeekChange(newTime);
        addRipple(x, y, '-10s');
        showGesture('seek', newTime, `-10s Rewind`);
      } else if (relativeX > 0.6) {
        // Double click right: Fast forward 10s
        const newTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
        onSeekChange(newTime);
        addRipple(x, y, '+10s');
        showGesture('seek', newTime, `+10s Fast-Forward`);
      } else {
        // Double click center: Toggle Fullscreen or Play/Pause
        onTogglePlay();
      }
      lastClickTimeRef.current = 0;
      return;
    }

    lastClickTimeRef.current = now;

    // Set up dragging for gestures
    isDraggingRef.current = true;
    let gestureType: 'volume' | 'brightness' | 'seek' = 'volume';
    let startVal = 0;

    if (relativeX < 0.4) {
      gestureType = 'brightness';
      startVal = videoFilters.brightness;
    } else if (relativeX > 0.6) {
      gestureType = 'volume';
      startVal = audioSettings.gain * 100;
    } else {
      gestureType = 'seek';
      startVal = videoRef.current.currentTime;
    }

    dragStartRef.current = { x, y, type: gestureType, startVal };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current || !videoRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaY = dragStartRef.current.y - (e.clientY - rect.top);
    const deltaX = (e.clientX - rect.left) - dragStartRef.current.x;

    if (dragStartRef.current.type === 'brightness') {
      const change = (deltaY / rect.height) * 200;
      const newB = Math.min(200, Math.max(10, Math.round(dragStartRef.current.startVal + change)));
      onBrightnessChange(newB);
      showGesture('brightness', newB, `Brightness: ${newB}%`);
    } else if (dragStartRef.current.type === 'volume') {
      const change = (deltaY / rect.height) * 300;
      const newGain = Math.min(3.0, Math.max(0, (dragStartRef.current.startVal + change) / 100));
      const newVol = Math.min(1, newGain);
      onVolumeChange(newVol, newGain);
      showGesture('volume', Math.round(newGain * 100), `Volume Boost: ${Math.round(newGain * 100)}%`);
    } else if (dragStartRef.current.type === 'seek' && Math.abs(deltaX) > 20) {
      const seekDelta = (deltaX / rect.width) * (videoRef.current.duration || 100);
      const targetTime = Math.min(
        videoRef.current.duration || 0,
        Math.max(0, dragStartRef.current.startVal + seekDelta)
      );
      showGesture('seek', targetTime, `Seek: ${formatTime(targetTime)}`);
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current && dragStartRef.current.type === 'seek' && gestureState?.activeGesture === 'seek') {
      onSeekChange(gestureState.value);
    }
    isDraggingRef.current = false;
  };

  // Wheel gesture for volume / brightness
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;

    if (relativeX < 0.4) {
      const delta = e.deltaY < 0 ? 5 : -5;
      const newB = Math.min(200, Math.max(10, videoFilters.brightness + delta));
      onBrightnessChange(newB);
      showGesture('brightness', newB, `Brightness: ${newB}%`);
    } else if (relativeX > 0.6) {
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newGain = Math.min(3.0, Math.max(0, Number((audioSettings.gain + delta).toFixed(2))));
      const newVol = Math.min(1, newGain);
      onVolumeChange(newVol, newGain);
      showGesture('volume', Math.round(newGain * 100), `Volume: ${Math.round(newGain * 100)}%`);
    }
  };

  const addRipple = (x: number, y: number, text: string) => {
    const newId = Date.now();
    setRipples((prev) => [...prev, { id: newId, x, y, text }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newId));
    }, 800);
  };

  // Compute CSS Filter string for futuristic video enhancement
  const computeFilterCss = (): string => {
    const { brightness, contrast, saturation, hueRotate, invert, sepia, blur } = videoFilters;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) invert(${invert}%) sepia(${sepia}%) blur(${blur}px)`;
  };

  // Aspect ratio class or style object
  const getAspectRatioStyle = (): React.CSSProperties => {
    switch (aspectRatio) {
      case 'fill':
        return { objectFit: 'cover' };
      case 'stretch':
        return { objectFit: 'fill' };
      case '16:9':
        return { objectFit: 'contain', aspectRatio: '16/9' };
      case '4:3':
        return { objectFit: 'contain', aspectRatio: '4/3' };
      case '21:9':
        return { objectFit: 'contain', aspectRatio: '21/9' };
      case '1:1':
        return { objectFit: 'contain', aspectRatio: '1/1' };
      case 'fit':
      default:
        return { objectFit: 'contain' };
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer group"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          onTimeUpdate(v.currentTime, v.duration || 0);
        }}
        onPlay={() => audioEngine.resume()}
        onEnded={onEnded}
        onError={() => {
          if (!streamError) {
            setStreamError('Playback Error: The video format or stream URL could not be loaded.');
          }
        }}
        playsInline
        className="w-full h-full transition-all duration-150"
        style={{
          ...getAspectRatioStyle(),
          filter: computeFilterCss(),
        }}
      />

      {/* Deinterlace / Scanlines overlay filter if enabled */}
      {videoFilters.deinterlace && (
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-30 bg-repeat"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.6) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
            backgroundSize: '100% 4px, 6px 100%',
          }}
        />
      )}

      {/* Gesture Feedback Floating Badge */}
      {gestureState && (
        <div className="absolute z-30 inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-200 px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
            {gestureState.activeGesture === 'volume' && (
              <>
                <Volume2 className="w-10 h-10 text-cyan-400 animate-pulse" />
                <div className="text-xl font-semibold tracking-wide">{gestureState.label}</div>
                <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, (gestureState.value / 300) * 100)}%` }}
                  />
                </div>
              </>
            )}

            {gestureState.activeGesture === 'brightness' && (
              <>
                <Sun className="w-10 h-10 text-amber-400 animate-pulse" />
                <div className="text-xl font-semibold tracking-wide">{gestureState.label}</div>
                <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-75"
                    style={{ width: `${Math.min(100, (gestureState.value / 200) * 100)}%` }}
                  />
                </div>
              </>
            )}

            {gestureState.activeGesture === 'seek' && (
              <>
                {gestureState.label.includes('-') ? (
                  <Rewind className="w-10 h-10 text-emerald-400 animate-pulse" />
                ) : (
                  <FastForward className="w-10 h-10 text-emerald-400 animate-pulse" />
                )}
                <div className="text-xl font-semibold tracking-wide">{gestureState.label}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ripple Animations on Double Tap */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute z-20 pointer-events-none flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-ping"
          style={{ left: ripple.x, top: ripple.y }}
        >
          <div className="w-20 h-20 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            {ripple.text}
          </div>
        </div>
      ))}

      {/* Stream Error & CORS Proxy Retry Overlay */}
      {streamError && (
        <div className="absolute z-30 inset-0 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in font-sans">
          <div className="max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-neutral-100">
            <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 border border-red-800/80 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-neutral-100">Live Stream / Video Error</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{streamError}</p>
              <div className="text-[11px] text-neutral-500 mt-1">
                Current mode: {proxyIndex === 0 ? 'Direct Stream' : `CORS Proxy ${proxyIndex}`}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center mt-2 w-full">
              {onReturnHome && (
                <button
                  onClick={onReturnHome}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all transform active:scale-95"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Back Home</span>
                </button>
              )}

              <button
                onClick={() => setProxyIndex((prev) => (prev + 1) % 4)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-neutral-700"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                <span>Switch Proxy (Mode {(proxyIndex + 1) % 4})</span>
              </button>

              {(onOpenLiveTV || onOpenLibrary) && (
                <button
                  onClick={onOpenLiveTV || onOpenLibrary}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md active:scale-95"
                >
                  Browse Working Channels
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtitle Overlay Rendering */}
      {subtitleSettings.enabled && activeSubtitleCues.length > 0 && (
        <div
          className="absolute z-20 w-full text-center px-8 pointer-events-none transition-all duration-150"
          style={{
            bottom: `${subtitleSettings.bottomOffset}px`,
          }}
        >
          {activeSubtitleCues.map((cue) => (
            <div key={cue.id} className="inline-block my-1">
              <span
                className="px-3 py-1 rounded-md leading-relaxed inline-block max-w-4xl tracking-wide font-medium shadow-lg"
                style={{
                  fontSize: `${subtitleSettings.fontSize}px`,
                  color: subtitleSettings.color,
                  backgroundColor: hexToRgba(subtitleSettings.backgroundColor, subtitleSettings.backgroundOpacity),
                }}
              >
                {cue.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
