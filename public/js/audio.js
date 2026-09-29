export class GameAudio {
  constructor() { this.enabled=false; this.context=null; }
  toggle() {
    this.enabled=!this.enabled;
    if (this.enabled) {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      this.context.resume();
      this.play('select');
    }
    return this.enabled;
  }
  play(kind) {
    if (!this.enabled || !this.context) return;
    const ctx=this.context;
    const notes={select:[520,780,.09],throw:[650,180,.16],dash:[180,420,.12],hit:[260,80,.22],win:[440,880,.45]};
    const [from,to,duration]=notes[kind] || notes.select;
    const oscillator=ctx.createOscillator();
    const gain=ctx.createGain();
    oscillator.type=kind==='hit'?'triangle':'sine';
    oscillator.frequency.setValueAtTime(from,ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(to,ctx.currentTime+duration);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.07,ctx.currentTime+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime+duration);
  }
}
