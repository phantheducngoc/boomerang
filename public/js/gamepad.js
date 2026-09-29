import { RULES } from '../../shared/config.js';

function stick(axes, index) {
  const x = Number.isFinite(axes[index]) ? axes[index] : 0;
  const y = Number.isFinite(axes[index + 1]) ? axes[index + 1] : 0;
  const length = Math.hypot(x, y);
  if (length <= 0.2) return { x: 0, y: 0 };
  const strength = Math.min(1, (length - 0.2) / 0.8);
  return { x: x / length * strength, y: y / length * strength };
}

export class GamepadInput {
  constructor(getPads = () => navigator.getGamepads?.() || [], now = () => performance.now()) {
    this.getPads = getPads;
    this.now = now;
    this.index = null;
    this.aim = null;
    this.reset();
  }

  pads() {
    try { return Array.from(this.getPads()).filter(pad => pad?.connected); }
    catch { return []; }
  }

  status() {
    const pads = this.pads();
    if (pads.some(pad => pad.mapping === 'standard')) return 'Controller connected · LS move/aim · RS override · Y throw/recall · A/R dash · X/B strike';
    if (pads.length) return 'Controller layout unsupported · use a standard-mapped gamepad or keyboard';
    return 'Controller: connect by USB or Bluetooth, then press a button · use localhost or HTTPS';
  }

  reset() {
    this.chargeStart = null;
    this.previous = { throw: false, dash: false, strike: false };
    this.armed = false;
  }

  chargedRange() {
    const amount = this.chargeStart === null ? 0 : Math.min(1, (this.now() - this.chargeStart) / (RULES.chargeTime * 1000));
    return RULES.minRange + (RULES.maxRange - RULES.minRange) * amount;
  }

  read() {
    const pads = this.pads().filter(pad => pad.mapping === 'standard');
    const pad = pads.find(item => item.index === this.index) || pads[0];
    if (!pad) { this.index = null; this.reset(); return null; }
    if (this.index !== pad.index) { this.reset(); this.aim = null; this.index = pad.index; }
    const pressed = index => Boolean(pad.buttons[index]?.pressed || pad.buttons[index]?.value > 0.5);
    const buttons = { throw: pressed(3), dash: pressed(0) || pressed(5), strike: pressed(2) || pressed(1) };
    const move = stick(pad.axes, 0);
    const look = stick(pad.axes, 2);
    if (look.x || look.y) this.aim = Math.atan2(look.y, look.x);
    else if (move.x || move.y) this.aim = Math.atan2(move.y, move.x);
    const result = { ...move, aim: this.aim, throw: false, dash: false, strike: false,
      range: RULES.minRange, activity: Boolean(move.x || move.y || look.x || look.y) };
    // Require a neutral button state after reconnect, blur, or a round transition.
    if (!this.armed) {
      this.armed = !Object.values(buttons).some(Boolean);
      this.previous = buttons;
      return result;
    }
    result.activity ||= Object.values(buttons).some(Boolean) || Object.values(this.previous).some(Boolean);
    result.dash = buttons.dash && !this.previous.dash;
    result.strike = buttons.strike && !this.previous.strike;
    if (buttons.throw && !this.previous.throw) this.chargeStart = this.now();
    if (result.dash) this.chargeStart = null;
    if (!buttons.throw && this.previous.throw && this.chargeStart !== null) {
      result.throw = true;
      result.range = this.chargedRange();
      this.chargeStart = null;
    }
    result.charging = this.chargeStart !== null;
    result.recall = result.charging;
    this.previous = buttons;
    return result;
  }
}
