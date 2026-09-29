import { boomerangReady } from '/shared/config.js';
import { createGame, createPlayer, stepGame } from '/shared/game.js';
import { updateBots } from '/shared/bots.js';
import { botLevel } from '/shared/bot-levels.js';
import { ArenaRenderer } from './renderer.js';
import { InputController } from './input.js';
import { $, showScreen, renderHUD } from './ui.js';

export class GameSession {
  constructor(connection,audio) {
    this.connection=connection;
    this.audio=audio;
    this.renderer=new ArenaRenderer($('game'));
    this.input=new InputController($('game'));
    this.input.view=this.renderer.view;
    this.state=null;
    this.mode=null;
    this.accumulator=0;
    this.last=0;
    this.hudAt=0;
    this.previousPhase=null;
    this.lastEvent=0;
    this.frame=this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  startPractice(profile) {
    this.mode='practice';
    this.id='local';
    this.profile=profile;
    this.difficulty=botLevel(profile.difficulty);
    this.state=createGame([createPlayer('local',profile.name,profile.character),
      createPlayer('bot1','Watermelon','peach',true),createPlayer('bot2','Sushi','lilac',true),
      createPlayer('bot3','Banana','gold',true)]);
    for (const player of this.state.players) {
      if (player.bot) player.difficulty=this.difficulty;
    }
    this.state.players[0].invincible=profile.invincible===true;
    this.activate();
  }

  accept(state,host) {
    const first=this.mode!=='online';
    const restart=this.state?.phase==='finished' && state.phase==='countdown';
    this.mode='online';
    this.id=this.connection.id;
    this.host=host;
    this.state=state;
    if (first || restart) this.activate();
  }

  activate() {
    this.renderer.reset();
    this.lastEvent=0;
    this.accumulator=0;
    this.input.reset();
    this.input.active=true;
    showScreen('game-screen');
    $('game').focus({preventScroll:true});
    $('match-label').textContent=this.mode==='practice'?`SOLO PRACTICE · ${this.difficulty.toUpperCase()} · 3 BOTS`:'PRIVATE GARDEN · FIRST TO 5';
    if (this.mode==='practice' && this.profile.invincible) $('match-label').textContent+=' · NO DEATH';
  }

  stop() { this.mode=null; this.state=null; this.input.active=false; this.input.reset(); }

  frame(timestamp) {
    const elapsed=Math.min((timestamp-this.last)/1000,.1);
    this.last=timestamp;
    if (this.state && this.mode) {
      this.accumulator+=elapsed;
      while (this.accumulator>=1/30) {
        const player=this.state.players.find(item=>item.id===this.id);
        if (this.state.phase!=='playing') this.input.reset();
        const input=this.input.read(player);
        this.aim=input.aim;
        if (this.state.phase==='playing' && player?.alive) {
          if (input.throw && boomerangReady(this.state)) this.audio.play('throw');
          if (input.strike && player.strikeCooldown<=0) this.audio.play('dash');
          if (input.dash && player.dashCooldown<=0) this.audio.play('dash');
        }
        if (this.mode==='practice') {
          player.input=input;
          updateBots(this.state,timestamp/1000);
          stepGame(this.state,1/30);
        } else this.connection.send({type:'input',...input});
        this.accumulator-=1/30;
      }
      this.renderer.render(this.state,timestamp/1000,this.id,this.aim,this.input.previewRange());
      if (this.state.events.some(event=>event.id>this.lastEvent)) {
        this.audio.play('hit');
        this.lastEvent=Math.max(...this.state.events.map(event=>event.id));
      }
      if (this.state.phase==='finished' && this.previousPhase!=='finished') this.audio.play('win');
      this.previousPhase=this.state.phase;
      if (timestamp-this.hudAt>80) {
        renderHUD(this.state,this.id,this.mode==='practice'||this.host===this.id);
        $('connection-label').textContent=this.mode==='practice'?'LOCAL PLAY':`${this.connection.latency} MS · CONNECTED`;
        this.hudAt=timestamp;
      }
    }
    requestAnimationFrame(this.frame);
  }
}
