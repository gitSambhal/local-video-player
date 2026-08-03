import React, { useState } from 'react';
import { X, Users, Copy, Check, Radio, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface P2PSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoomId: string | null;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  peerCount: number;
}

export const P2PSyncModal: React.FC<P2PSyncModalProps> = ({
  isOpen,
  onClose,
  activeRoomId,
  onJoinRoom,
  onLeaveRoom,
  peerCount,
}) => {
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateNewRoom = () => {
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(newId);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoomCode.trim()) {
      onJoinRoom(inputRoomCode.trim().toUpperCase());
      setInputRoomCode('');
    }
  };

  const handleCopyCode = () => {
    if (activeRoomId) {
      navigator.clipboard.writeText(activeRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-lg">
            <Users className="w-5 h-5" />
            <span>P2P Watch Room Sync</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Status */}
        {activeRoomId ? (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
                  Active P2P Sync Room
                </span>
                <span className="text-[11px] font-mono bg-emerald-900/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {peerCount} {peerCount === 1 ? 'Peer Connected' : 'Peers Connected'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">Room Code</span>
                  <span className="text-lg font-bold text-slate-100 tracking-wider">{activeRoomId}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Open another tab or share code to sync Play, Pause, Seek, and timestamps instantly with zero latency!
              </p>
            </div>

            <button
              onClick={onLeaveRoom}
              className="p-3 rounded-xl bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-400 font-semibold text-xs transition-colors"
            >
              Disconnect / Leave Watch Room
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Create a local P2P sync room to watch videos in sync across tabs or devices. Actions like play, pause, and seek will automatically reflect for all connected peers.
            </p>

            {/* Create Room */}
            <button
              onClick={handleCreateNewRoom}
              className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all transform hover:scale-[1.02]"
            >
              <Users className="w-4 h-4" />
              <span>Create New Watch Sync Room</span>
            </button>

            <div className="flex items-center gap-2 text-slate-500 my-1">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] uppercase tracking-wider font-semibold">or Join Room</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Join Room Form */}
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-character Room Code..."
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono flex-1 uppercase tracking-wider"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Join
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
