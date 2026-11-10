import * as T from "three";
import type { StageId } from "../data/stages";
/** Four instanced calls: cloud shadows, road traffic/civilians, lamps and wind streaks. */
export class Atmosphere extends T.Group {
  shadows: T.InstancedMesh;
  decor: T.InstancedMesh;
  lamps: T.InstancedMesh;
  wind: T.InstancedMesh;
  dummy = new T.Object3D();
  color = new T.Color();
  constructor() {
    super();
    this.shadows = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;void main(){float a=max(0.,1.-length((vUv-.5)*2.));gl_FragColor=vec4(.015,.03,.05,a*a*.18);}",
      }),
      12,
    );
    this.decor = new T.InstancedMesh(
      new T.BoxGeometry(1, 1, 1),
      new T.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        flatShading: true,
      }),
      80,
    );
    this.lamps = new T.InstancedMesh(
      new T.SphereGeometry(1, 6, 4),
      new T.MeshBasicMaterial({ color: 0xffd195 }),
      48,
    );
    this.wind = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.MeshBasicMaterial({
        color: 0xbcecff,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      }),
      24,
    );
    for (const m of [this.shadows, this.decor, this.lamps, this.wind]) {
      m.frustumCulled = false;
      this.add(m);
    }
  }
  set(
    m: T.InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rot = 0,
  ) {
    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(0, 0, rot);
    this.dummy.scale.set(sx, sy, sz);
    this.dummy.updateMatrix();
    m.setMatrixAt(i, this.dummy.matrix);
  }
  update(
    scroll: number,
    time: number,
    stage: StageId,
    quality: number,
    bossWind = 0,
  ) {
    this.shadows.count = Math.round(12 * quality);
    for (let i = 0; i < this.shadows.count; i++)
      this.set(
        this.shadows,
        i,
        Math.sin(i * 14.1 + time * 0.018) * 29,
        ((i * 11 - scroll * 0.43 + 80) % 80) - 40,
        0.12,
        9 + (i % 3) * 3,
        4 + (i % 4),
        1,
        0.2,
      );
    let n = 0,
      l = 0;
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1,
        x = side * (i < 8 ? 6.4 : 12.5),
        y = ((i * 9 - scroll + (i % 2 ? 1 : -1) * time * 0.55 + 160) % 80) - 40;
      this.set(this.decor, n, x, y, 0.25, 0.5, 0.85, 0.35);
      this.decor.setColorAt(
        n++,
        this.color.set(stage === "M02" ? 0x836a4c : 0x43696c),
      );
      this.set(this.decor, n, x, y + 0.08, 0.5, 0.4, 0.34, 0.16);
      this.decor.setColorAt(n++, this.color.set(0x9eb7af));
      for (const dx of [-0.15, 0.15])
        this.set(
          this.lamps,
          l++,
          x + dx,
          y + (side < 0 ? -0.4 : 0.4),
          0.42,
          0.05,
          0.055,
          0.04,
        );
    }
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1,
        x = side * (5.5 + (i % 3) * 0.22),
        y =
          ((i * 4.1 - scroll + Math.sin(time * 0.7 + i) * 0.16 + 160) % 80) -
          40;
      this.set(this.decor, n, x, y, 0.22, 0.12, 0.16, 0.4);
      this.decor.setColorAt(
        n++,
        this.color.set(i % 3 === 0 ? 0xdfb35d : 0x71847b),
      );
      this.set(this.decor, n, x, y, 0.46, 0.12, 0.12, 0.12);
      this.decor.setColorAt(n++, this.color.set(0xd4bd9a));
    }
    this.decor.count = n;
    this.lamps.count = l;
    this.decor.instanceMatrix.needsUpdate = true;
    if (this.decor.instanceColor) this.decor.instanceColor.needsUpdate = true;
    this.lamps.instanceMatrix.needsUpdate = true;
    this.shadows.instanceMatrix.needsUpdate = true;
    this.wind.visible = stage === "M03";
    this.wind.count = Math.round(24 * quality);
    for (let i = 0; i < this.wind.count; i++) {
      const strength = Math.abs(bossWind) > 0.1 ? bossWind : 1;
      this.set(
        this.wind,
        i,
        (((time * (2 + Math.abs(strength) * 2) + i * 3.8 + 80) % 48) - 24) *
          Math.sign(strength),
        Math.sin(i * 15.4) * 17,
        7.8,
        1.2 + (i % 4) * 0.45,
        0.022,
        1,
        -0.12,
      );
    }
    this.wind.instanceMatrix.needsUpdate = true;
  }
}
