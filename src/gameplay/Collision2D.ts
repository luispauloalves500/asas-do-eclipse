export interface Circle {
  x: number;
  y: number;
  r: number;
  id: number;
}
export function overlaps(a: Circle, b: Circle) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.r + b.r) ** 2;
}
export function segmentDistance(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax,
    dy = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}
export class SpatialHash<T extends Circle> {
  cells = new Map<string, T[]>();
  constructor(public size = 2) {}
  clear() {
    this.cells.clear();
  }
  insert(e: T) {
    for (
      let x = Math.floor((e.x - e.r) / this.size);
      x <= Math.floor((e.x + e.r) / this.size);
      x++
    )
      for (
        let y = Math.floor((e.y - e.r) / this.size);
        y <= Math.floor((e.y + e.r) / this.size);
        y++
      ) {
        const k = `${x},${y}`;
        if (!this.cells.has(k)) this.cells.set(k, []);
        this.cells.get(k)!.push(e);
      }
  }
  query(e: Circle) {
    const found = new Set<T>();
    for (
      let x = Math.floor((e.x - e.r) / this.size);
      x <= Math.floor((e.x + e.r) / this.size);
      x++
    )
      for (
        let y = Math.floor((e.y - e.r) / this.size);
        y <= Math.floor((e.y + e.r) / this.size);
        y++
      )
        for (const n of this.cells.get(`${x},${y}`) || []) found.add(n);
    return found;
  }
}
