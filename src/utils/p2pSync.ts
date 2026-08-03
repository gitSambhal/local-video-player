type SyncCallback = (action: 'play' | 'pause' | 'seek' | 'timeUpdate', payload: { time: number; speed?: number }) => void;

class P2PSyncService {
  private channel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private callbacks: Set<SyncCallback> = new Set();

  public initRoom(roomId: string) {
    if (this.channel) {
      this.channel.close();
    }
    this.currentRoomId = roomId;
    this.channel = new BroadcastChannel(`vlcx_p2p_room_${roomId}`);

    this.channel.onmessage = (event) => {
      const { action, payload } = event.data;
      if (action && payload) {
        this.callbacks.forEach((cb) => cb(action, payload));
      }
    };
  }

  public sendAction(action: 'play' | 'pause' | 'seek' | 'timeUpdate', payload: { time: number; speed?: number }) {
    if (this.channel && this.currentRoomId) {
      this.channel.postMessage({ action, payload, senderId: Math.random().toString(36).substring(7) });
    }
  }

  public subscribe(cb: SyncCallback) {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  public leaveRoom() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.currentRoomId = null;
  }

  public getRoomId() {
    return this.currentRoomId;
  }
}

export const p2pSync = new P2PSyncService();
