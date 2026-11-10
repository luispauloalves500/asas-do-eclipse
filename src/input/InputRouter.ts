export interface Commands {
  x: number;
  y: number;
  special: boolean;
  bomb: boolean;
}
export class InputRouter {
  keys = new Set<string>();
  special = false;
  bomb = false;
  pointer: { id: number; x: number; y: number } | null = null;
  dragX = 0;
  dragY = 0;
  padButtons: boolean[] = [];
  pointerDriven = false;
  pointerEngaged = false;
  constructor(
    private stage: HTMLElement,
    private pause: () => void,
  ) {
    window.addEventListener("keydown", (e) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "Shift",
          "Escape",
        ].includes(e.key)
      )
        e.preventDefault();
      if (!e.repeat) {
        if (["Escape", "p", "P"].includes(e.key)) this.pause();
        if (e.key === "Shift") this.special = true;
        if (e.key.toLowerCase() === "e") this.bomb = true;
      }
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener("keyup", (e) =>
      this.keys.delete(e.key.toLowerCase()),
    );
    window.addEventListener("blur", () => this.clear());
    stage.addEventListener("pointerdown", (e) => {
      if (e.button === 2) {
        e.preventDefault();
        this.special = true;
        return;
      }
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", (e) => {
      if (!this.pointer || this.pointer.id !== e.pointerId) return;
      const scale = 28 / stage.clientHeight;
      this.pointerEngaged = true;
      this.dragX += (e.clientX - this.pointer.x) * scale;
      this.dragY -= (e.clientY - this.pointer.y) * scale;
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
    });
    const end = () => {
      this.pointer = null;
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", () => {
      end();
      this.dragX = this.dragY = 0;
    });
    stage.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  clear() {
    this.keys.clear();
    this.pointerEngaged = this.pointerDriven = false;
    this.special = this.bomb = false;
    this.pointer = null;
    this.dragX = this.dragY = 0;
  }
  consumeDrag(dx: number, dy: number, x: number, y: number) {
    if (!this.pointerDriven) return;
    this.dragX -= dx;
    this.dragY -= dy;
    if (
      Math.hypot(this.dragX, this.dragY) < 0.002 &&
      Math.hypot(dx, dy) < 0.0002
    ) {
      this.pointerEngaged = false;
      this.dragX = this.dragY = 0;
    }
    if ((x >= 6.86 && this.dragX > 0) || (x <= -6.86 && this.dragX < 0))
      this.dragX = 0;
    if ((y >= 6.66 && this.dragY > 0) || (y <= -11.66 && this.dragY < 0))
      this.dragY = 0;
  }
  sample(_dt: number, speed: number): Commands {
    const k = this.keys;
    let x =
        Number(k.has("d") || k.has("arrowright")) -
        Number(k.has("a") || k.has("arrowleft")),
      y =
        Number(k.has("w") || k.has("arrowup")) -
        Number(k.has("s") || k.has("arrowdown"));
    const pad = navigator.getGamepads?.()[0];
    if (pad) {
      const dead = (v: number) =>
        Math.abs(v) < 0.14 ? 0 : ((Math.abs(v) - 0.14) / 0.86) * Math.sign(v);
      x +=
        dead(pad.axes[0] || 0) +
        (pad.buttons[15]?.pressed ? 1 : 0) -
        (pad.buttons[14]?.pressed ? 1 : 0);
      y -= dead(pad.axes[1] || 0);
      y +=
        (pad.buttons[12]?.pressed ? 1 : 0) - (pad.buttons[13]?.pressed ? 1 : 0);
      for (const [i, action] of [
        [0, "special"],
        [1, "bomb"],
        [9, "pause"],
      ] as const) {
        if (pad.buttons[i]?.pressed && !this.padButtons[i]) {
          if (action === "pause") this.pause();
          else this[action] = true;
        }
        this.padButtons[i] = !!pad.buttons[i]?.pressed;
      }
    }
    // Preserve accumulated relative travel until actual simulated movement consumes it.
    // Fast pointer events must not disappear between fixed ticks.
    if (Math.hypot(x, y) > 0.05) {
      this.pointerEngaged = false;
      this.dragX = this.dragY = 0;
    }
    this.pointerDriven = this.pointerEngaged;
    if (this.pointerDriven) {
      x = (this.dragX * 10) / speed;
      y = (this.dragY * 10) / speed;
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    const result = { x, y, special: this.special, bomb: this.bomb };
    this.special = this.bomb = false;
    return result;
  }
}
