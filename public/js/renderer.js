import { drawGarden, drawAllCover } from './art/garden.js';
import { GrassPatches } from './art/grass.js';
import { drawCharacter } from './art/characters.js';
import { drawStrike } from './art/strike.js';
import { WeaponTrails } from './art/weapon-trail.js';
import { droppedHeight } from '/shared/obstacle-bounce.js';
import { drawWeaponWind } from './art/weapon-wind.js';
import { drawAimArrow } from './art/aim-arrow.js';
import { drawRecallRing } from './art/recall-ring.js';
import { DashTrails } from './art/dash-trail.js';
import { smoothFacing } from './art/turning.js';
import { KickImpacts } from './art/kick-impact.js';
import { WaterSplashes } from './art/water-splash.js';
import { heldWeaponCount } from '/shared/weapon-inventory.js';
import { boomerang, BOOMERANG_SCALE, ellipse, line } from './art/shapes.js';
import { applyCamera, keepSpriteUpright, updateCamera, WATER_BLEED } from './camera.js';
import { boomerangReady, CHARACTERS, RULES, WORLD } from '/shared/config.js';

function characterColor(state, playerId) {
  const player = state.players.find(item => item.id === playerId);
  return CHARACTERS.find(item => item.id === player?.character)?.color || '#f8d47d';
}

export class ArenaRenderer {
  constructor(canvas, preview = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.preview = preview;
    this.view = { zoom: 1 };
    if (!preview) {
      canvas.width = WORLD.width;
      canvas.height = WORLD.height;
    }
    this.positions = new Map();
    this.grass = new GrassPatches();
    this.weaponTrails = new WeaponTrails();
    this.dashTrails = new DashTrails();
    this.kickImpacts = new KickImpacts();
    this.waterSplashes = new WaterSplashes();
    this.particles = [];
    this.lastEvent = 0;
    this.background = document.createElement('canvas');
    this.background.width = WORLD.width + WATER_BLEED * 2;
    this.background.height = WORLD.height + WATER_BLEED * 2;
    const bg = this.background.getContext('2d');
    bg.translate(WATER_BLEED, WATER_BLEED);
    drawGarden(bg);
  }

  reset() { this.positions.clear(); this.grass.reset(); this.weaponTrails.reset(); this.dashTrails.reset(); this.kickImpacts.reset(); this.waterSplashes.reset(); this.particles = []; this.lastEvent = 0; }

  render(state, time, localId, aim, range = null) {
    const ctx = this.ctx;
    if (!this.preview) {
      if (state.phase !== 'playing') this.view.zoom = 1;
      else updateCamera(this.view, state.projectiles, Math.max(0, time - (this.cameraTime ?? time)));
      this.cameraTime = time;
    }
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle = '#5297a1';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.globalAlpha=1;
    if (this.preview) {
      const sx=1000/WORLD.width, sy=660/WORLD.height;
      ctx.scale(sx,sy);
    }
    applyCamera(ctx, this.view);
    ctx.drawImage(this.background, -WATER_BLEED, -WATER_BLEED);
    this.grass.update(state.phase === 'playing' ? state.players : [], time);
    this.grass.drawShadows(ctx);
    drawAllCover(ctx,state.brokenObstacles);
    if (this.preview) {
      const sx=WORLD.width/1000, sy=WORLD.height/660;
      line(ctx,[[213*sx,300*sy],[240*sx,270*sy],[280*sx,266*sy]],'#f7f9e7',3);
      line(ctx,[[740*sx,352*sy],[768*sx,324*sy],[780*sx,291*sy]],'#f7f9e7',3);
      boomerang(ctx,240*sx,270*sy,time*2,1.1,characterColor(state,'a'));
      boomerang(ctx,754*sx,333*sy,-time*2,.9,characterColor(state,'b'));
    }
    const armed=boomerangReady(state);
    if (state.phase !== 'playing') this.weaponTrails.reset();
    this.weaponTrails.draw(ctx, armed ? state.projectiles : [], time);
    if (state.phase !== 'playing') this.dashTrails.reset();
    this.dashTrails.draw(ctx, state.phase === 'playing' ? state.players : [], time);
    // Interleave foliage and characters by their ground position so front leaves occlude bodies.
    const sorted = [
      ...state.players.map(player => ({ y: player.y, player })),
      ...this.grass.stems.map(stem => ({ y: stem.y, stem }))
    ].sort((a,b)=>a.y-b.y);
    for (const item of sorted) {
      if (item.stem) { this.grass.drawStem(ctx, item.stem, time); continue; }
      const player = item.player;
      const previous = this.positions.get(player.id) || {x:player.x,y:player.y};
      // Start once per elimination on the render clock, including between network updates.
      // A living state clears the timestamp for the next round or respawn.
      if (player.alive) previous.defeatAt = null;
      else previous.defeatAt ??= time;
      const snap = Math.hypot(previous.x-player.x,previous.y-player.y)>150 || state.phase==='countdown';
      const follow = snap || player.strikeLungeDistance > 0 ? 1 : .45;
      previous.x += (player.x-previous.x)*follow;
      previous.y += (player.y-previous.y)*follow;
      this.positions.set(player.id,previous);
      const display = {...player,x:previous.x,y:previous.y};
      const mine = player.id===localId;
      if (mine && aim != null) display.aim=aim;
      const desired=player.strikeTime>0?player.strikeAim:display.aim ?? player.facing ?? Math.PI/2;
      const turnDt=previous.turnTime==null?0:Math.min(0.1,Math.max(0,time-previous.turnTime));
      previous.facing=previous.facing==null || snap || player.strikeTime>0
        ? desired : smoothFacing(previous.facing,desired,turnDt);
      previous.turnTime=time;
      const canAim = mine && armed && heldWeaponCount(state, player) > 0;
      if (canAim && state.phase==='playing') drawAimArrow(ctx,display,range);
      if (canAim && player.alive && range!==null) {
        ctx.save();
        ctx.translate(display.x,display.y+44);
        keepSpriteUpright(ctx);
        ctx.fillStyle='#306d56';
        ctx.font='bold 12px sans-serif';
        ctx.textAlign='center';
        ctx.fillText(`POWER ${Math.round((range-RULES.minRange)/(RULES.maxRange-RULES.minRange)*100)}% · RANGE ${Math.round(range)}`,0,0);
        ctx.restore();
      }
      if (!player.fallen) {
        drawCharacter(ctx,display,time,{mine,weapon:armed ? heldWeaponCount(state,player) : 0,
          label:!this.preview,scale:this.preview?1.16:1,facing:previous.facing,camera:true,
          defeatElapsed: previous.defeatAt == null ? 0 : time - previous.defeatAt});
      drawStrike(ctx,display,state.brokenObstacles);
      }
    }
    ctx.globalAlpha=1;
    for (const weapon of armed ? state.projectiles : []) {
      const grounded=weapon.mode==='grounded';
      const deflected=weapon.mode==='deflected';
      const height=deflected?droppedHeight(weapon):grounded?0:12;
      ellipse(ctx,weapon.x,weapon.y+8,13,6,'#4f653126');
      drawRecallRing(ctx,weapon,time,height);
      ctx.save();
      ctx.translate(weapon.x,weapon.y-height);
      keepSpriteUpright(ctx);
      if (weapon.mode === 'flying') drawWeaponWind(ctx, time);
      boomerang(ctx,0,0,grounded && (!weapon.recalling || weapon.recallWindup>0)?weapon.angle:time*(deflected?10:22),BOOMERANG_SCALE,
        characterColor(state, weapon.owner));
      ctx.restore();
      if (grounded && (weapon.owner===localId || weapon.sharedPickup)) {
        ctx.save();
        ctx.translate(weapon.x,weapon.y+27);
        keepSpriteUpright(ctx);
        ctx.fillStyle='#8b6046'; ctx.textAlign='center'; ctx.font='bold 11px sans-serif';
        ctx.fillText(weapon.blocked?'BLOCKED · CHANGE ANGLE':weapon.sharedPickup?'ANYONE CAN PICK UP':'HOLD THROW TO RECALL',0,0);
        ctx.restore();
      }
    }
    for (const event of state.events || []) {
      if (event.id<=this.lastEvent) continue;
      this.lastEvent=event.id;
      if (event.type==='kick' || event.type==='clash' || event.type==='weapon-impact') {
        this.kickImpacts.add(event,time); continue;
      }
      if (event.type==='fall') { this.waterSplashes.add(event,time); continue; }
      const color=event.type==='crate'?'#b97558':
        CHARACTERS.find(item=>item.id===event.color)?.color || '#efd07b';
      for (let i=0;i<16;i++) this.particles.push({x:event.x,y:event.y,angle:i/16*Math.PI*2,
        born:time,color,speed:40+(i%5)*25});
    }
    this.waterSplashes.draw(ctx,time);
    this.kickImpacts.draw(ctx,time);
    this.particles=this.particles.filter(particle=>time-particle.born<.7);
    for (const particle of this.particles) {
      const age=time-particle.born;
      ctx.globalAlpha=1-age/.7;
      ellipse(ctx,particle.x+Math.cos(particle.angle)*age*particle.speed,
        particle.y+Math.sin(particle.angle)*age*particle.speed,4,4,particle.color);
    }
    ctx.restore();
  }
}
