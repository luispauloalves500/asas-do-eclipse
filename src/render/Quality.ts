/** Changes presentation only; no projectile or simulation budget is altered. */
export class Quality {
  level = 1;
  average = 1 / 60;
  elapsed = 0;
  sample(dt: number) {
    if (dt <= 0 || dt > 0.25) return false;
    this.average = this.average * 0.97 + dt * 0.03;
    this.elapsed += dt;
    if (this.elapsed > 3 && this.average > 1 / 32 && this.level > 0.55) {
      this.level = Math.max(0.55, this.level * 0.8);
      this.elapsed = 0;
      return true;
    }
    return false;
  }
}
