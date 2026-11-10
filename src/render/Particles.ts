import * as T from "three";
interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  size: number;
  color: T.Color;
  smoke: boolean;
}
/** Bounded, reusable sparks/smoke/trails and instanced debris: two draw calls. */
export class Particles {
  points: T.Points;
  debris: T.InstancedMesh;
  items: Particle[];
  chunks: Particle[];
  dummy = new T.Object3D();
  seed = 55;
  quality = 1;
  position = new Float32Array(600 * 3);
  color = new Float32Array(600 * 3);
  size = new Float32Array(600);
  opacity = new Float32Array(600);
  soft = new Float32Array(600);
  constructor(scene: T.Scene) {
    const make = (): Particle => ({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      life: 1,
      size: 1,
      color: new T.Color(),
      smoke: false,
    });
    this.items = Array.from({ length: 600 }, make);
    this.chunks = Array.from({ length: 80 }, make);
    const geo = new T.BufferGeometry();
    for (const [key, array, n] of [
      ["position", this.position, 3],
      ["color", this.color, 3],
      ["aSize", this.size, 1],
      ["aOpacity", this.opacity, 1],
      ["aSoft", this.soft, 1],
    ] as const)
      geo.setAttribute(
        key,
        new T.BufferAttribute(array, n).setUsage(T.DynamicDrawUsage),
      );
    const mat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: { uScale: { value: 25 } },
      vertexShader:
        "attribute float aSize;attribute float aOpacity;attribute float aSoft;uniform float uScale;varying vec3 vColor;varying float vAlpha;varying float vSoft;void main(){vColor=color;vAlpha=aOpacity;vSoft=aSoft;gl_PointSize=aSize*uScale;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 vColor;varying float vAlpha;varying float vSoft;void main(){float r=length(gl_PointCoord*2.-1.);if(r>1.)discard;gl_FragColor=vec4(vColor,vAlpha*pow(1.-r,mix(.6,2.,vSoft)));}",
    });
    this.points = new T.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 50;
    scene.add(this.points);
    this.debris = new T.InstancedMesh(
      new T.BoxGeometry(1, 1, 1),
      new T.MeshStandardMaterial({
        color: 0xa49371,
        roughness: 0.8,
        flatShading: true,
      }),
      80,
    );
    this.debris.frustumCulled = false;
    scene.add(this.debris);
  }
  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  emit(
    x: number,
    y: number,
    z: number,
    color: number,
    size: number,
    life: number,
    vx = 0,
    vy = 0,
    smoke = false,
  ) {
    const p = this.items.find((p) => !p.active);
    if (!p) return;
    Object.assign(p, {
      active: true,
      x,
      y,
      z,
      vx,
      vy,
      vz: 0,
      age: 0,
      life,
      size,
      smoke,
    });
    p.color.setHex(color);
  }
  burst(x: number, y: number, size: number, color: number) {
    this.emit(x, y, 9, 0xffe5ae, Math.min(size, 2) * 0.9, 0.14);
    this.emit(x, y, 8.95, 0xff9854, Math.min(size, 2) * 1.15, 0.24);
    for (let i = 0; i < Math.round(24 * this.quality); i++) {
      const a = this.random() * Math.PI * 2,
        v = (1 + this.random() * 4) * size;
      this.emit(
        x,
        y,
        9,
        color,
        0.08 + this.random() * 0.12,
        0.3 + this.random() * 0.4,
        Math.cos(a) * v,
        Math.sin(a) * v,
      );
    }
    for (let i = 0; i < Math.round(7 * this.quality); i++)
      this.emit(
        x + (this.random() - 0.5) * size,
        y + (this.random() - 0.5) * size,
        8.8,
        0x4c514a,
        0.5 + this.random() * 0.7,
        0.8 + this.random() * 0.7,
        (this.random() - 0.5) * 0.8,
        0.5,
        true,
      );
    for (let i = 0; i < Math.round(7 * this.quality); i++) {
      const p = this.chunks.find((p) => !p.active);
      if (!p) break;
      const a = this.random() * 6.28;
      Object.assign(p, {
        active: true,
        x,
        y,
        z: 7.8,
        age: 0,
        life: 0.6 + this.random() * 0.6,
        size: 0.07 + this.random() * 0.1,
        vx: Math.cos(a) * size * 3,
        vy: Math.sin(a) * size * 3,
        vz: 2 + this.random() * 2,
      });
    }
  }
  update(dt: number, pixelScale: number) {
    (this.points.material as T.ShaderMaterial).uniforms.uScale.value =
      pixelScale;
    let count = 0;
    for (const p of this.items) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const t = p.age / p.life;
      this.position.set([p.x, p.y, p.z], count * 3);
      this.color.set([p.color.r, p.color.g, p.color.b], count * 3);
      this.size[count] = p.size * (p.smoke ? 1 + t * 1.7 : 1);
      this.opacity[count] = (1 - t) * (p.smoke ? 0.34 : 1);
      this.soft[count] = p.smoke ? 1 : 0;
      count++;
    }
    this.points.geometry.setDrawRange(0, count);
    for (const a of Object.values(this.points.geometry.attributes))
      a.needsUpdate = true;
    count = 0;
    for (const p of this.chunks) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 8 * dt;
      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.rotation.set(p.age * 6, p.age * 8, p.age * 4);
      this.dummy.scale.set(p.size, p.size * 0.7, p.size * 0.8);
      this.dummy.updateMatrix();
      this.debris.setMatrixAt(count++, this.dummy.matrix);
    }
    this.debris.count = count;
    this.debris.instanceMatrix.needsUpdate = true;
  }
  clear() {
    for (const p of [...this.items, ...this.chunks]) p.active = false;
    this.debris.count = 0;
    this.points.geometry.setDrawRange(0, 0);
  }
}
