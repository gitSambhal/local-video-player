import { SubtitleCue } from '../types';

/**
 * Parses SRT or WebVTT subtitle text content into structured SubtitleCue items.
 */
export function parseSubtitleText(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  let idCounter = 1;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIndex = 0;
    // Skip WEBVTT header or block index line if numeric
    if (lines[0].toUpperCase().startsWith('WEBVTT') || lines[0].startsWith('NOTE')) {
      continue;
    }
    if (/^\d+$/.test(lines[0].trim())) {
      timeLineIndex = 1;
    }

    if (lines.length <= timeLineIndex) continue;

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(
      /(\d{1,2}:)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}):(\d{2})[,.](\d{3})/
    );

    if (match) {
      const startTime = parseTimestamp(
        match[1] || '00:',
        match[2],
        match[3],
        match[4]
      );
      const endTime = parseTimestamp(
        match[5] || '00:',
        match[6],
        match[7],
        match[8]
      );

      const textLines = lines.slice(timeLineIndex + 1).join('\n').trim();
      // Remove basic HTML tags if present like <i>, <b>
      const cleanText = textLines.replace(/<[^>]*>/g, '');

      if (cleanText) {
        cues.push({
          id: `cue-${idCounter++}`,
          startTime,
          endTime,
          text: cleanText,
        });
      }
    }
  }

  return cues;
}

function parseTimestamp(
  hoursStr: string,
  minsStr: string,
  secsStr: string,
  msStr: string
): number {
  const hours = parseInt(hoursStr.replace(':', ''), 10) || 0;
  const mins = parseInt(minsStr, 10) || 0;
  const secs = parseInt(secsStr, 10) || 0;
  const ms = parseInt(msStr, 10) || 0;

  return hours * 3600 + mins * 60 + secs + ms / 1000;
}

/**
 * Converts SubtitleCue items to VTT Blob URL for native HTML5 video <track>
 */
export function generateVTTBlobUrl(cues: SubtitleCue[]): string {
  let vttString = 'WEBVTT\n\n';
  for (const cue of cues) {
    vttString += `${formatVttTime(cue.startTime)} --> ${formatVttTime(cue.endTime)}\n${cue.text}\n\n`;
  }
  const blob = new Blob([vttString], { type: 'text/vtt;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function formatVttTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (num: number, size = 2) => String(num).padStart(size, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}
