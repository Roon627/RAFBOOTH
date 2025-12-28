
const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  shutter: 'https://assets.mixkit.co/active_storage/sfx/544/544-preview.mp3',
  ghost: 'https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3',
  magic: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  pop: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3'
};

class SoundService {
  private muted: boolean = false;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.muted = localStorage.getItem('spooky_muted') === 'true';
    // Preload sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.load();
      this.audioCache.set(key, audio);
    });
  }

  setMuted(mute: boolean) {
    this.muted = mute;
    localStorage.setItem('spooky_muted', mute.toString());
  }

  isMuted() {
    return this.muted;
  }

  play(soundName: keyof typeof SOUNDS) {
    if (this.muted) return;
    
    const audio = this.audioCache.get(soundName);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio play blocked', e));
    }
  }
}

export const soundService = new SoundService();
