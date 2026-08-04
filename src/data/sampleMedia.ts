import { SampleMedia } from '../types';

export const SAMPLE_MEDIA_LIST: SampleMedia[] = [
  {
    title: 'NASA TV HD (24/7 Live Space Stream)',
    src: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-TV-HD/master.m3u8',
    type: 'hls',
    format: '24/7 Live HLS',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    description: 'Official 24/7 Live NASA Television stream featuring space station launches, spacewalks & science.',
    isLive: true,
  },
  {
    title: 'DW News English (24/7 Global Live News)',
    src: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    type: 'hls',
    format: '24/7 Live HLS',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
    description: '24/7 Deutsche Welle live international news & documentary broadcasts in English.',
    isLive: true,
  },
  {
    title: 'France 24 English (24/7 World News)',
    src: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
    type: 'hls',
    format: '24/7 Live HLS',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    description: '24/7 live international breaking news, business, and political coverage.',
    isLive: true,
  },
  {
    title: 'Red Bull TV (Extreme Sports & Live Events)',
    src: 'https://rbmn-live.akamaized.net/hls/live/591070/GEO_STATION_1/master.m3u8',
    type: 'hls',
    format: '24/7 Live HLS',
    thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80',
    description: 'Live action sports, outdoor adventures, music festivals & extreme culture.',
    isLive: true,
  },
  {
    title: 'Akamai HLS Adaptive Live Stream Test',
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'hls',
    format: 'HLS (.m3u8)',
    thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80',
    description: 'High Bitrate Multi-Quality HLS adaptive stream test link.',
    isLive: true,
  },
  {
    title: 'Tears of Steel (Multi-Audio HLS: EN, ES, FR, DE)',
    src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    type: 'hls',
    format: 'Multi-Audio HLS',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    description: 'Sci-Fi VFX test video featuring multiple audio tracks (English, Spanish, French, German).'
  },
  {
    title: 'Sintel Multi-Audio Stream (EN, DE, FR, ES)',
    src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    type: 'hls',
    format: 'Multi-Audio HLS',
    thumbnail: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80',
    description: 'Blender open fantasy film with multi-language audio track options.'
  },
  {
    title: 'Big Buck Bunny (4K Ultra HD)',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video',
    format: 'MP4 1080p',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    description: 'Blender Foundation open movie trailer. Classic animation test file.'
  },
  {
    title: 'For Bigger Blazes (Action Clip)',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    format: 'MP4 Web',
    thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    description: 'Chromecast sample video clip with fast motion and vibrant colors.'
  },
  {
    title: 'Lo-Fi Chillbeats (Cyberpunk Night)',
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    type: 'audio',
    format: 'MP3 Audio',
    artist: 'Chillout Soundscapes',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    description: 'Ambient lo-fi track perfect for testing Music Mode visualizer & equalizer.'
  }
];
