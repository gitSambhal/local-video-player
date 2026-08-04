import { AudioTrackInfo } from '../types';

export interface MkvUploadResult {
  fileId: string;
  streamUrl: string;
  audioTracks: AudioTrackInfo[];
  duration?: number;
}

/**
 * Uploads a local video/MKV file to the backend FFmpeg engine
 * to extract exact multi-audio stream metadata and enable real-time track switching.
 */
export function uploadAndInspectMkv(
  file: File,
  onProgress?: (percent: number) => void
): Promise<MkvUploadResult | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/mkv/upload', true);
    xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
    xhr.setRequestHeader('content-type', 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success && data.fileId) {
            const audioTracks: AudioTrackInfo[] = (data.audioTracks || []).map((t: any, idx: number) => ({
              id: idx,
              name: t.name || `Audio Stream ${idx + 1}`,
              lang: t.lang || '',
              default: idx === 0,
            }));

            resolve({
              fileId: data.fileId,
              streamUrl: data.streamUrl || `/api/mkv/stream/${data.fileId}`,
              audioTracks,
              duration: data.duration,
            });
            return;
          }
        } catch (e) {
          console.warn('Failed to parse MKV upload response:', e);
        }
      }
      resolve(null);
    };

    xhr.onerror = () => {
      console.warn('MKV upload network error');
      resolve(null);
    };

    xhr.ontimeout = () => {
      console.warn('MKV upload timeout');
      resolve(null);
    };

    xhr.send(file);
  });
}


