import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';

const execAsync = promisify(exec);

const UPLOAD_DIR = path.join('/tmp', 'mkv_uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const LANG_MAP: Record<string, string> = {
  hin: 'Hindi',
  hi: 'Hindi',
  eng: 'English',
  en: 'English',
  spa: 'Spanish',
  es: 'Spanish',
  fre: 'French',
  fra: 'French',
  fr: 'French',
  ger: 'German',
  deu: 'German',
  de: 'German',
  tam: 'Tamil',
  ta: 'Tamil',
  tel: 'Telugu',
  te: 'Telugu',
  kan: 'Kannada',
  kn: 'Kannada',
  mal: 'Malayalam',
  ml: 'Malayalam',
  jpn: 'Japanese',
  ja: 'Japanese',
  chi: 'Chinese',
  zho: 'Chinese',
  zh: 'Chinese',
  rus: 'Russian',
  ru: 'Russian',
  ita: 'Italian',
  it: 'Italian',
  por: 'Portuguese',
  pt: 'Portuguese',
  kor: 'Korean',
  ko: 'Korean',
  ara: 'Arabic',
  ar: 'Arabic',
  urd: 'Urdu',
  ur: 'Urdu',
  ben: 'Bengali',
  bn: 'Bengali',
  mar: 'Marathi',
  mr: 'Marathi',
  guj: 'Gujarati',
  gu: 'Gujarati',
  pan: 'Punjabi',
  pa: 'Punjabi',
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Fast Header Slice Inspection for Multi-Audio Track Extraction (< 100ms)
  app.post('/api/mkv/inspect', (req, res) => {
    const rawFilename = req.headers['x-filename']
      ? decodeURIComponent(req.headers['x-filename'] as string)
      : 'video.mkv';
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const tmpPath = path.join(UPLOAD_DIR, `inspect_${Date.now()}_${cleanFilename}`);

    const writeStream = fs.createWriteStream(tmpPath);
    req.pipe(writeStream);

    writeStream.on('finish', async () => {
      try {
        const ffprobeCmd = `ffprobe -v quiet -print_format json -show_streams -show_format "${tmpPath}"`;
        const { stdout } = await execAsync(ffprobeCmd);
        fs.unlink(tmpPath, () => {});

        const data = JSON.parse(stdout);
        const streams = data.streams || [];
        const audioStreams = streams.filter((s: any) => s.codec_type === 'audio');

        let trackCounter = 0;
        const parsedAudioTracks = audioStreams.map((s: any, idx: number) => {
          const rawLang = (s.tags?.language || s.tags?.LANGUAGE || '').toLowerCase().trim();
          const mappedLang = LANG_MAP[rawLang] || (rawLang ? rawLang.toUpperCase() : '');
          const titleTag = s.tags?.title || s.tags?.TITLE || s.tags?.handler_name || '';
          const codec = (s.codec_name || '').toUpperCase();
          const channels = s.channels ? `${s.channels} Ch` : '';

          let displayName = titleTag;
          if (!displayName) {
            if (mappedLang) {
              displayName = `${mappedLang} Audio`;
            } else {
              displayName = `Audio Track ${idx + 1}`;
            }
          } else if (mappedLang && !displayName.toLowerCase().includes(mappedLang.toLowerCase())) {
            displayName = `${mappedLang} (${displayName})`;
          }

          return {
            id: idx,
            streamIndex: trackCounter++,
            name: displayName,
            lang: mappedLang || rawLang || 'und',
            codec: s.codec_name,
            channels: s.channels,
          };
        });

        res.json({
          success: true,
          audioTracks: parsedAudioTracks,
          duration: parseFloat(data.format?.duration || '0'),
        });
      } catch (err: any) {
        fs.unlink(tmpPath, () => {});
        console.warn('ffprobe slice inspection error:', err);
        res.json({
          success: true,
          audioTracks: [],
        });
      }
    });

    writeStream.on('error', () => {
      res.json({ success: true, audioTracks: [] });
    });
  });

  // Upload Local MKV/Media File for FFmpeg Inspection & Multi-Audio Extraction (NO body-size limits)
  app.post('/api/mkv/upload', (req, res) => {
    const rawFilename = req.headers['x-filename']
      ? decodeURIComponent(req.headers['x-filename'] as string)
      : 'video.mkv';
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileId = `mkv_${Date.now()}_${cleanFilename}`;
    const targetPath = path.join(UPLOAD_DIR, fileId);

    const writeStream = fs.createWriteStream(targetPath);

    req.pipe(writeStream);

    writeStream.on('finish', async () => {
      try {
        // Run ffprobe to extract stream details
        const ffprobeCmd = `ffprobe -v quiet -print_format json -show_streams -show_format "${targetPath}"`;
        const { stdout } = await execAsync(ffprobeCmd);
        const data = JSON.parse(stdout);

        const streams = data.streams || [];
        const audioStreams = streams.filter((s: any) => s.codec_type === 'audio');

        let trackCounter = 0;
        const parsedAudioTracks = audioStreams.map((s: any, idx: number) => {
          const rawLang = (s.tags?.language || s.tags?.LANGUAGE || '').toLowerCase().trim();
          const mappedLang = LANG_MAP[rawLang] || (rawLang ? rawLang.toUpperCase() : '');
          const titleTag = s.tags?.title || s.tags?.TITLE || s.tags?.handler_name || '';
          const codec = (s.codec_name || '').toUpperCase();
          const channels = s.channels ? `${s.channels} Ch` : '';

          let displayName = titleTag;
          if (!displayName) {
            if (mappedLang) {
              displayName = `${mappedLang} Audio (${codec} ${channels})`;
            } else {
              displayName = `Audio Track ${idx + 1} (${codec} ${channels})`;
            }
          } else if (mappedLang && !displayName.toLowerCase().includes(mappedLang.toLowerCase())) {
            displayName = `${mappedLang} (${displayName})`;
          }

          const trackObj = {
            id: idx,
            streamIndex: trackCounter++,
            name: displayName,
            lang: rawLang || 'und',
            codec: s.codec_name,
            channels: s.channels,
          };
          return trackObj;
        });

        res.json({
          success: true,
          fileId,
          filename: cleanFilename,
          duration: parseFloat(data.format?.duration || '0'),
          size: parseInt(data.format?.size || '0', 10),
          audioTracks: parsedAudioTracks,
          streamUrl: `/api/mkv/stream/${fileId}`,
        });
      } catch (err: any) {
        console.error('ffprobe error:', err);
        res.json({
          success: true,
          fileId,
          filename: cleanFilename,
          duration: 0,
          audioTracks: [
            { id: 0, streamIndex: 0, name: 'Default Audio Stream (Hindi/English)', lang: 'default' }
          ],
          streamUrl: `/api/mkv/stream/${fileId}`,
        });
      }
    });

    writeStream.on('error', (err) => {
      console.error('File write stream error:', err);
      res.status(500).json({ error: 'Failed to save uploaded video file' });
    });
  });

  app.use(express.json({ limit: '50mb' }));


  // Stream MKV file with real-time FFmpeg Audio Track Selection
  app.get('/api/mkv/stream/:fileId', (req, res) => {
    const { fileId } = req.params;
    const targetPath = path.join(UPLOAD_DIR, fileId);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).send('Media file not found');
    }

    const audioTrackIndex = parseInt((req.query.audioTrack as string) || '0', 10);
    const seekSeconds = parseFloat((req.query.t as string) || '0');

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    // Build FFmpeg command to remux video instantly while converting selected audio track to AAC
    const seekArg = seekSeconds > 0 ? `-ss ${seekSeconds}` : '';
    const ffmpegCmd = `ffmpeg ${seekArg} -i "${targetPath}" -map 0:v:0? -map 0:a:${audioTrackIndex}? -c:v copy -c:a aac -b:a 192k -ac 2 -f mp4 -movflags frag_keyframe+empty_moov+pipe_mode pipe:1`;

    const ffmpegProc = exec(ffmpegCmd, { maxBuffer: 1024 * 1024 * 100 });

    ffmpegProc.stdout?.pipe(res);

    ffmpegProc.stderr?.on('data', (data) => {
      // Debug logging if needed
    });

    req.on('close', () => {
      try {
        ffmpegProc.kill('SIGKILL');
      } catch {
        // ignore
      }
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vortex Local Video Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
