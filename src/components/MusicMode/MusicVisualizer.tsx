import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../utils/audioEngine';
import { MediaItem } from '../../types';
import { Disc, Music, Sparkles, Activity, Play, Pause } from 'lucide-react';

interface MusicVisualizerProps {
  media: MediaItem | null;
  isPlaying: boolean;
  onTogglePlay?: () => void;
}

export const MusicVisualizer: React.FC<MusicVisualizerProps> = ({ media, isPlaying, onTogglePlay }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'circular' | 'particles'>('bars');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    let rotationAngle = 0;

    // Particle system for 'particles' mode
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color: `hsl(${Math.random() * 60 + 180}, 90%, 65%)`,
    }));

    const render = () => {
      // Fit canvas size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Get frequency data from Web Audio engine
      audioEngine.getFrequencyData(dataArray);

      // Calculate average volume energy
      const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

      ctx.fillStyle = 'rgba(8, 12, 22, 0.35)';
      ctx.fillRect(0, 0, width, height);

      if (visualMode === 'bars') {
        const barWidth = (width / dataArray.length) * 1.2;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * (height * 0.7);

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#3b82f6');
          gradient.addColorStop(1, '#a855f7');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 3, barHeight);

          // Top particle highlight
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, height - barHeight - 4, barWidth - 3, 2);

          x += barWidth;
        }
      } else if (visualMode === 'circular') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.22 + (avg / 255) * 20;

        rotationAngle += 0.005;

        // Draw outer glow circle
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);

        const numPoints = dataArray.length;
        const angleStep = (Math.PI * 2) / numPoints;

        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const amp = (dataArray[i] / 255) * 60;
          const r = radius + amp;
          const angle = i * angleStep;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0284c7';
        ctx.stroke();

        ctx.restore();
      } else if (visualMode === 'particles') {
        const speedMultiplier = 1 + (avg / 255) * 2.5;

        particles.forEach((p) => {
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + (avg / 255) * 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
        });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualMode]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden p-6 select-none">
      {/* Background Visualizer Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Floating Center Album / Music Card */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center animate-fade-in">
        {/* Animated Spinning Vinyl Disk with Play/Pause button */}
        <div className="relative group cursor-pointer" onClick={onTogglePlay}>
          <div
            className={`w-40 h-40 rounded-full border-4 border-slate-800 shadow-2xl flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950 overflow-hidden relative ${
              isPlaying ? 'animate-spin [animation-duration:8s]' : ''
            }`}
          >
            {media?.thumbnail ? (
              <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover opacity-80" />
            ) : (
              <Disc className="w-20 h-20 text-purple-400 opacity-60" />
            )}
            <div className="absolute w-10 h-10 rounded-full bg-slate-950 border-2 border-purple-400 flex items-center justify-center z-10">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
            </div>
          </div>

          <div className="absolute inset-0 rounded-full bg-slate-950/40 group-hover:bg-slate-950/60 transition-colors flex items-center justify-center">
            <div className="p-3 rounded-full bg-purple-600/90 text-white shadow-xl transform group-hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </div>
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-slate-100 truncate max-w-[280px]">{media?.title || 'Lo-Fi Chillbeats'}</h2>
          <p className="text-xs text-purple-300 font-medium">{media?.artist || 'Ambient Soundscapes'}</p>
        </div>

        {/* Visualizer Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setVisualMode('bars')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visualMode === 'bars' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Bars</span>
          </button>
          <button
            onClick={() => setVisualMode('circular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visualMode === 'circular' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Circular</span>
          </button>
          <button
            onClick={() => setVisualMode('particles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visualMode === 'particles' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cosmos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
