import * as T from "three";
import { tileOffset } from "../core/Scrolling";
/** Ocher canyon, steel viaducts, twin mine lanes and background trains. */
export class Canyon extends T.Group {
  tiles: T.Group[] = [];
  dummy = new T.Object3D();
  trains: T.InstancedMesh;
  cargo: T.InstancedMesh;
  clouds: T.InstancedMesh;
  constructor(mat: (c: number) => T.MeshStandardMaterial) {
    super();
    const base = new T.Mesh(new T.PlaneGeometry(140, 200), mat(0x6c5138));
    base.position.z = -1.2;
    this.add(base);
    for (let tile = 0; tile < 2; tile++) {
      const g = new T.Group();
      this.tiles.push(g);
      this.add(g);
      let seed = 449 + tile * 823;
      const rand = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const b = new Map<
        string,
        { geo: string; color: number; items: number[][] }
      >();
      const add = (
        geo: string,
        c: number,
        x: number,
        y: number,
        z: number,
        sx: number,
        sy: number,
        sz: number,
        rz = 0,
      ) => {
        const key = geo + c;
        if (!b.has(key)) b.set(key, { geo, color: c, items: [] });
        b.get(key)!.items.push([x, y, z, sx, sy, sz, rz]);
      };
      add("box", 0x382f2b, 0, 0, -0.97, 12, 56, 0.15);
      add("box", 0x51402f, 0, 0, -0.86, 9, 56, 0.15);
      for (const x of [-11, -3.8, 3.8, 11]) {
        add("box", 0x625e51, x, 0, -0.63, 1.8, 56, 0.15);
        for (const side of [-1, 1])
          add("box", 0x9da7a0, x + side * 0.5, 0, -0.34, 0.12, 56, 0.19);
        for (let y = -27.5; y < 28; y += 0.7)
          add("box", 0x3d3732, x, y, -0.48, 1.55, 0.17, 0.16);
      }
      // Visible amber mine corridors leave the central track-free lane accessible.
      for (const x of [-4, 4])
        for (let y = -27; y < 28; y += 3.5) {
          add("box", 0xb2884d, x - 1, y, -0.6, 0.09, 1.2, 0.03);
          add("box", 0xb2884d, x + 1, y, -0.6, 0.09, 1.2, 0.03);
        }
      for (let i = 0; i < 165; i++) {
        const y = rand() * 56 - 28,
          x = (rand() < 0.5 ? -1 : 1) * (6.2 + rand() * 28),
          r = 0.5 + rand() * 1.3;
        if (Math.abs(Math.abs(x) - 11) < 1.4) continue;
        const h = 1 + rand() * 3.5;
        add(
          "rock",
          i % 2 ? 0xa17c51 : 0x8a6242,
          x,
          y,
          -0.3,
          r * 1.6,
          r * 1.25,
          h,
          rand() * 6,
        );
        if (i % 3 === 0) {
          add(
            "rock",
            0xc59865,
            x + 0.15,
            y + 0.1,
            h * 0.4,
            r,
            r * 0.7,
            h * 0.4,
            rand() * 6,
          );
          add("box", 0x4f3f2f, x + 0.5, y - 0.6, -0.64, r * 2, r, 0.04);
        }
        if (i % 8 === 0) {
          add("box", 0x333f34, x, y, -0.1, 0.15, 0.15, 0.9);
          add("box", 0x3e5943, x + 0.2, y, 0.2, 0.35, 0.12, 0.12);
        }
      }
      for (const by of [-8, 20]) {
        add("box", 0x69736d, 0, by, -0.2, 28, 2.5, 0.5);
        for (const side of [-1, 1]) {
          add("box", 0xa4aca0, 0, by + side * 1.3, 0.28, 28, 0.13, 0.18);
          for (let x = -13; x < 14; x += 2) {
            add("box", 0x364b50, x, by + side * 1.3, 0.5, 0.15, 0.15, 1.3);
            add(
              "box",
              0x748b88,
              x + 0.45,
              by + side * 1.3,
              0.75,
              1.25,
              0.14,
              0.14,
              Math.PI / 6,
            );
            add("box", 0x344a4d, x, by, -0.6, 0.35, 3, 1);
          }
        }
      }
      // Railway depots and freight crates, deliberately outside the clear central corridor.
      for (const [x, y] of [
        [-6, 6],
        [6, -18],
        [-14, 23],
        [14, 3],
      ]) {
        add("box", 0x806b50, x, y, 0.1, 2.3, 3, 1.4);
        add("box", 0x405657, x, y, 0.86, 2.6, 3.3, 0.18);
        add("box", 0x89aaa0, x, y - 1.52, 0.4, 1.5, 0.04, 0.45);
        for (let i = 0; i < 3; i++) {
          add(
            "box",
            0x9c7447,
            x + (i - 1) * 0.6,
            y - 2.4,
            -0.25,
            0.5,
            0.5,
            0.6,
          );
          add(
            "box",
            0xd9b16a,
            x + (i - 1) * 0.6,
            y - 2.4,
            0.07,
            0.4,
            0.06,
            0.03,
          );
        }
      }
      const geos: Record<string, T.BufferGeometry> = {
        box: new T.BoxGeometry(1, 1, 1),
        rock: new T.CylinderGeometry(0.6, 1, 1, 7).rotateX(Math.PI / 2),
      };
      for (const { geo, color, items } of b.values()) {
        const m = new T.InstancedMesh(geos[geo], mat(color), items.length);
        items.forEach(([x, y, z, sx, sy, sz, rz], i) => {
          this.dummy.position.set(x, y, z);
          this.dummy.scale.set(sx, sy, sz);
          this.dummy.rotation.set(0, 0, rz);
          this.dummy.updateMatrix();
          m.setMatrixAt(i, this.dummy.matrix);
        });
        g.add(m);
      }
    }
    this.trains = new T.InstancedMesh(
      new T.BoxGeometry(1, 1, 1),
      mat(0x2b3b3f),
      8,
    );
    this.cargo = new T.InstancedMesh(
      new T.BoxGeometry(1, 1, 1),
      mat(0x967149),
      8,
    );
    this.trains.frustumCulled = this.cargo.frustumCulled = false;
    this.add(this.trains, this.cargo);
    this.clouds = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;void main(){float a=max(0.,1.-length(vUv*2.-1.));gl_FragColor=vec4(.85,.73,.57,a*a*.1);}",
      }),
      12,
    );
    this.clouds.frustumCulled = false;
    this.clouds.renderOrder = 40;
    this.add(this.clouds);
  }
  update(scroll: number, time: number, quality: number, visibleHeight = 28) {
    this.tiles.forEach((g, i) => {
      g.position.y = tileOffset(i, scroll);
      g.visible = Math.abs(g.position.y) < (56 + visibleHeight) / 2 + 2;
    });
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1,
        x = side * 11,
        y = ((time * (side < 0 ? 2.1 : -1.6) + (i % 4) * 3.2 + 80) % 80) - 40;
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.position.set(x, y, 0.05);
      this.dummy.scale.set(1.65, 2.7, 0.6);
      this.dummy.updateMatrix();
      this.trains.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.z = 0.55;
      this.dummy.scale.set(1.3, 2.3, 0.65);
      this.dummy.updateMatrix();
      this.cargo.setMatrixAt(i, this.dummy.matrix);
    }
    this.trains.instanceMatrix.needsUpdate =
      this.cargo.instanceMatrix.needsUpdate = true;
    this.clouds.count = Math.round(12 * quality);
    for (let i = 0; i < this.clouds.count; i++) {
      this.dummy.position.set(
        Math.sin(i * 7) * 25,
        ((i * 7 - time * 0.6 + 70) % 70) - 35,
        8.5,
      );
      this.dummy.rotation.set(0, 0, i);
      this.dummy.scale.set(6, 3, 1);
      this.dummy.updateMatrix();
      this.clouds.setMatrixAt(i, this.dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
  }
}
