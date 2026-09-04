import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, Tv, Volume2, VolumeX } from 'lucide-react';

interface HoverPreviewPlayerProps {
  streamUrl: string;
  fallbackLogo?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const HoverPreviewPlayer: React.FC<HoverPreviewPlayerProps> = ({
  streamUrl,
  fallbackLogo,
  onSuccess,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  useEffect(() => {
    let hls: Hls | null = null;
    let isSubscribed = true;
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setLoading(true);
    setHasError(false);

    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(streamUrl)}`;

    const handlePlaySuccess = () => {
      if (!isSubscribed) return;
      setLoading(false);
      setHasError(false);
      if (onSuccess) onSuccess();
    };

    const handlePlayFailure = () => {
      if (!isSubscribed) return;
      setLoading(false);
      setHasError(true);
      if (onError) onError();
    };

    // Stage 1: Try HLS Direct
    const tryHlsDirect = () => {
      if (!Hls.isSupported()) {
        tryVideoDirect();
        return;
      }

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!video) return;
        video.play().then(handlePlaySuccess).catch(tryHlsProxy);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (hls) {
            hls.destroy();
            hls = null;
          }
          tryHlsProxy();
        }
      });
    };

    // Stage 2: Try HLS Proxy
    const tryHlsProxy = () => {
      if (!isSubscribed) return;
      if (!Hls.isSupported()) {
        tryVideoDirect();
        return;
      }

      if (hls) {
        hls.destroy();
        hls = null;
      }

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(corsProxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!video) return;
        video.play().then(handlePlaySuccess).catch(tryVideoDirect);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (hls) {
            hls.destroy();
            hls = null;
          }
          tryVideoDirect();
        }
      });
    };

    // Stage 3: Try Video Native Direct
    const tryVideoDirect = () => {
      if (!isSubscribed || !video) return;
      video.src = streamUrl;
      video
        .play()
        .then(handlePlaySuccess)
        .catch(() => {
          tryVideoProxy();
        });
    };

    // Stage 4: Try Video Native Proxy
    const tryVideoProxy = () => {
      if (!isSubscribed || !video) return;
      video.src = corsProxyUrl;
      video
        .play()
        .then(handlePlaySuccess)
        .catch(handlePlayFailure);
    };

    const handlePlaying = () => {
      handlePlaySuccess();
    };

    video.addEventListener('playing', handlePlaying);

    // Initial Trigger
    const isM3u8 = streamUrl.toLowerCase().includes('.m3u8') || streamUrl.toLowerCase().includes('m3u8');
    if (isM3u8 && Hls.isSupported()) {
      tryHlsDirect();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      tryVideoDirect();
    } else if (Hls.isSupported()) {
      tryHlsDirect();
    } else {
      tryVideoDirect();
    }

    return () => {
      isSubscribed = false;
      video.removeEventListener('playing', handlePlaying);
      if (hls) {
        hls.destroy();
        hls = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [streamUrl]);

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
      {/* Video Element - Full Cover Edge to Edge */}
      <video
        ref={videoRef}
        muted={isMuted}
        playsInline
        autoPlay
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loading || hasError ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Loading Overlay */}
      {loading && !hasError && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-2 text-center">
          <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
          <span className="text-[9px] font-mono font-bold text-zinc-300">Tuning Stream...</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-zinc-950 p-2 flex flex-col items-center justify-center text-center">
          {fallbackLogo ? (
            <img src={fallbackLogo} alt="" className="max-h-8 max-w-full object-contain opacity-40" />
          ) : (
            <Tv className="w-5 h-5 text-zinc-700" />
          )}
          <span className="text-[9px] text-zinc-500 mt-1 font-medium">Stream Offline</span>
        </div>
      )}

      {/* Live Badge & Mute Toggle */}
      {!loading && !hasError && (
        <>
          <div className="absolute top-2 left-2 z-10 bg-rose-600/90 text-white font-black text-[8px] tracking-wider px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
            <span className="w-1 h-1 rounded-full bg-white" />
            <span>LIVE</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-2 right-2 z-10 bg-black/80 hover:bg-black text-white p-1 rounded-md transition-colors"
            title={isMuted ? 'Unmute preview' : 'Mute preview'}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-rose-400" />}
          </button>
        </>
      )}
    </div>
  );
};
