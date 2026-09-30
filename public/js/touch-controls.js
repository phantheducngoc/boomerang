import { clampStick, TouchInput } from './touch-input.js';

export function touchPlayAvailable() {
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}

export class TouchControls {
  constructor(root = document.querySelector('#touch-controls')) {
    this.root = root;
    this.input = new TouchInput();
    this.enabled = Boolean(root) && touchPlayAvailable();
    if (!this.enabled) return;
    root.hidden = false;
    document.body.classList.add('touch-play');
    root.querySelectorAll('[data-stick]').forEach(stick => this.bindStick(stick));
    root.querySelectorAll('[data-action]').forEach(button => this.bindButton(button));
  }

  reset() {
    this.input.reset();
    this.root?.querySelectorAll('.touch-knob').forEach(knob => { knob.style.transform = ''; });
    this.root?.querySelectorAll('.is-held').forEach(button => button.classList.remove('is-held'));
  }

  read() {
    return this.enabled ? this.input.read() : null;
  }

  bindStick(stick) {
    const knob = stick.querySelector('.touch-knob');
    const aim = stick.dataset.stick === 'aim';
    const place = event => {
      const box = stick.getBoundingClientRect();
      const radius = Math.min(box.width, box.height) / 2 - 8;
      const vector = clampStick(event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2, radius);
      knob.style.transform = `translate(${vector.dx}px, ${vector.dy}px)`;
      if (aim) this.input.setAim(vector.x, vector.y);
      else this.input.setMove(vector.x, vector.y);
      this.input.touching = true;
    };
    const end = () => {
      knob.style.transform = '';
      if (aim) this.input.setAim(0, 0);
      else this.input.setMove(0, 0);
      this.input.touching = this.pointerDown();
    };
    this.track(stick, place, end);
  }

  bindButton(button) {
    const name = button.dataset.action;
    const press = () => {
      button.classList.add('is-held');
      this.input.setHeld(name, true);
      this.input.touching = true;
    };
    const release = () => {
      button.classList.remove('is-held');
      this.input.setHeld(name, false);
      this.input.touching = this.pointerDown();
    };
    this.track(button, press, release);
  }

  track(element, onMove, onEnd) {
    element.addEventListener('pointerdown', event => {
      event.preventDefault();
      onMove(event);
      try { element.setPointerCapture(event.pointerId); } catch { /* The press still counts if capture is unavailable. */ }
    });
    element.addEventListener('pointermove', event => {
      if (element.hasPointerCapture(event.pointerId)) onMove(event);
    });
    element.addEventListener('pointerup', onEnd);
    element.addEventListener('pointercancel', onEnd);
  }

  pointerDown() {
    return Boolean(this.root?.querySelector('.is-held')) || [...this.root.querySelectorAll('[data-stick]')].some(stick => stick.querySelector('.touch-knob').style.transform);
  }
}
