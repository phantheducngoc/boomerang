import { GamepadInput } from './gamepad.js';
import { TouchControls } from './touch-controls.js';
import { screenToWorld } from './camera.js';
import { emptyInput, RULES } from '/shared/config.js';

export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = {x:700,y:330};
    this.active = false;
    this.gamepad = new GamepadInput();
    this.touch = new TouchControls();
    this.source = 'keyboard';
    this.focused = document.hasFocus();
    window.addEventListener('focus',()=> { this.focused=true; });
    this.reset();
    window.addEventListener('keydown', event => {
      if (!this.canAct() || event.target.matches('input,button')) return;
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) event.preventDefault();
      this.source='keyboard';
      this.keys.add(event.code);
      if (event.code==='Space' && !event.repeat) {
        this.dash=true;
        this.chargeStart=null;
        this.throw=false;
      }
      if (event.code==='KeyF' && !event.repeat) this.strike=true;
      if (event.code==='KeyE' && !event.repeat) this.retrieve=true;
    });
    window.addEventListener('keyup',event=>this.keys.delete(event.code));
    window.addEventListener('blur',()=> { this.focused=false; this.reset(); });
    document.addEventListener('visibilitychange',()=>this.reset());
    canvas.addEventListener('contextmenu',event=>event.preventDefault());
    canvas.addEventListener('pointermove',event=>this.point(event));
    canvas.addEventListener('pointercancel',()=>this.reset());
    canvas.addEventListener('lostpointercapture',()=> { this.chargeStart=null; });
    canvas.addEventListener('pointerdown',event=> {
      if (!this.canAct() || this.touch.enabled) return;
      this.point(event);
      canvas.focus({preventScroll:true});
      if (event.button===2) { this.strike=true; return; }
      if (event.button!==0) return;
      this.chargeStart=performance.now();
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointerup',event=> {
      if (event.button!==0 || this.chargeStart===null) return;
      this.point(event);
      this.range=this.chargedRange();
      this.throw=this.canAct();
      this.chargeStart=null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });
  }

  canAct() { return this.active && this.focused && !document.hidden && !document.querySelector('dialog[open]'); }

  chargedRange() {
    const charge=this.chargeStart===null?0:Math.min(1,(performance.now()-this.chargeStart)/(RULES.chargeTime*1000));
    return RULES.minRange+(RULES.maxRange-RULES.minRange)*charge;
  }

  previewRange() {
    if (this.source==='gamepad') return this.gamepad.chargeStart!==null?this.gamepad.chargedRange():null;
    if (this.source==='touch') return this.touch.input.chargeStart!==null?this.touch.input.chargedRange():null;
    return this.chargeStart!==null?this.chargedRange():null;
  }

  point(event) {
    if (this.touch.enabled) return;
    this.source='keyboard';
    const box=this.canvas.getBoundingClientRect();
    const x=(event.clientX-box.left)/box.width*this.canvas.width;
    const y=(event.clientY-box.top)/box.height*this.canvas.height;
    this.pointerScreen = { x, y };
    this.pointer=screenToWorld(x,y,this.view);
  }

  reset() {
    this.gamepad.reset();
    this.touch.reset();
    this.keys.clear();
    this.throw=false;
    this.dash=false;
    this.strike=false;
    this.retrieve=false;
    this.chargeStart=null;
    this.range=RULES.minRange;
  }

  read(player) {
    if (this.pointerScreen) this.pointer = screenToWorld(this.pointerScreen.x, this.pointerScreen.y, this.view);
    if (!this.canAct() || !player?.alive) { this.reset(); return emptyInput(); }
    const pad=this.gamepad.read();
    const touch=this.touch.read();
    if (pad?.activity) this.source='gamepad';
    else if (touch?.activity) this.source='touch';
    else if (!pad && !touch) this.source='keyboard';
    const has=(...keys)=>keys.some(key=>this.keys.has(key));
    if (this.dash) { this.chargeStart=null; this.throw=false; }
    const input={x:Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),
      y:Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp')),
      aim:Math.atan2(this.pointer.y-player.y,this.pointer.x-player.x),
      throw:this.throw,charging:this.chargeStart!==null,recall:this.chargeStart!==null,dash:this.dash,strike:this.strike,retrieve:this.retrieve,range:this.range};
    this.throw=false;
    this.dash=false;
    this.strike=false;
    this.retrieve=false;
    if (this.source==='gamepad' && pad) {
      this.chargeStart=null;
      return { x:pad.x, y:pad.y, aim:pad.aim ?? player.aim ?? 0,
        throw:pad.throw, charging:pad.charging===true, recall:pad.recall===true, dash:pad.dash, strike:pad.strike, retrieve:false, range:pad.range };
    }
    if (this.source==='touch' && touch) {
      this.chargeStart=null;
      const moving=touch.x||touch.y;
      return { x:touch.x, y:touch.y, aim:touch.aim ?? (moving?Math.atan2(touch.y,touch.x):player.aim ?? 0),
        throw:touch.throw, charging:touch.charging===true, recall:touch.recall===true, dash:touch.dash, strike:touch.strike, retrieve:false, range:touch.range };
    }
    return input;
  }
}
