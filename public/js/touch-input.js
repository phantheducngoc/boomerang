import { RULES } from '../../shared/config.js';

export function clampStick(dx, dy, radius) {
  const length = Math.hypot(dx, dy);
  const dead = radius * 0.18;
  if (length <= dead || radius <= 0) return { dx: 0, dy: 0, x: 0, y: 0 };
  const capped = Math.min(length, radius);
  const scale = capped / length;
  const strength = Math.min(1, (capped - dead) / (radius - dead));
  return { dx: dx * scale, dy: dy * scale, x: dx / length * strength, y: dy / length * strength };
}

export class TouchInput {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.move = { x: 0, y: 0 };
    this.aim = null;
    this.held = { throw: false, dash: false, strike: false };
    this.reset();
  }

  reset() {
    this.chargeStart = null;
    this.previous = { throw: false, dash: false, strike: false };
    this.armed = false;
    this.move = { x: 0, y: 0 };
    this.touching = false;
  }

  setMove(x, y) {
    this.move = { x, y };
    if (x || y) this.aim = Math.atan2(y, x);
  }

  setHeld(name, held) {
    this.held[name] = held;
  }

  chargedRange() {
    const amount = this.chargeStart === null ? 0 : Math.min(1, (this.now() - this.chargeStart) / (RULES.chargeTime * 1000));
    return RULES.minRange + (RULES.maxRange - RULES.minRange) * amount;
  }

  read() {
    const buttons = this.held;
    const result = {
      x: this.move.x, y: this.move.y, aim: this.aim, throw: false, dash: false, strike: false,
      range: RULES.minRange, charging: false, recall: false, activity: this.touching
    };
    if (!this.armed) {
      this.armed = !buttons.throw && !buttons.dash && !buttons.strike;
      this.previous = { ...buttons };
      return result;
    }
    result.dash = buttons.dash && !this.previous.dash;
    result.strike = buttons.strike && !this.previous.strike;
    if (result.dash) this.chargeStart = null;
    if (buttons.throw && !this.previous.throw) this.chargeStart = this.now();
    if (!buttons.throw && this.previous.throw && this.chargeStart !== null) {
      result.throw = true;
      result.range = this.chargedRange();
      this.chargeStart = null;
    }
    result.charging = this.chargeStart !== null;
    result.recall = result.charging;
    result.activity = this.touching || result.dash || result.strike || result.throw || result.charging;
    this.previous = { ...buttons };
    return result;
  }
}
