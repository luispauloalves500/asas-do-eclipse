import * as T from "three";
import { tileOffset } from "../core/Scrolling";
export class Mountains extends T.Group {
  tiles: T.Group[] = [];
  rotors: { root: T.Group; blades: T.Group; localY: number; tile: T.Group }[] =
    [];
  dummy = new T.Object3D();
  clouds: T.InstancedMesh;
  constructor(mat: (c: number) => T.MeshStandardMaterial) {
    super();
    const floor = new T.Mesh(new T.PlaneGeometry(140, 200), mat(0x435763));
    floor.position.z = -1.1;
    this.add(floor);
    for (let tile = 0; tile < 2; tile++) {
      const group = new T.Group();
      this.tiles.push(group);
      this.add(group);
      let seed = 615 + tile * 927;
      const rand = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const batches = new Map<number, number[][]>();
      const add = (
        c: number,
        x: number,
        y: number,
        z: number,
        sx: number,
        sy: number,
        sz: number,
      ) => {
        if (!batches.has(c)) batches.set(c, []);
        batches.get(c)!.push([x, y, z, sx, sy, sz]);
      };
      for (let i = 0; i < 90; i++) {
        const x = (i % 2 ? 1 : -1) * (10 + rand() * 23),
          y = rand() * 56 - 28,
          r = 2 + rand() * 3,
          h = 3 + rand() * 5;
        add(i % 2 ? 0x647d8a : 0x526d80, x, y, h * 0.3, r, r * 0.8, h);
        add(0xc6d6d6, x, y, h * 0.65, r * 0.48, r * 0.4, h * 0.4);
      }
      const cone = new T.ConeGeometry(1, 1, 5).rotateX(Math.PI / 2);
      for (const [c, items] of batches) {
        const m = new T.InstancedMesh(cone, mat(c), items.length);
        items.forEach(([x, y, z, sx, sy, sz], i) => {
          this.dummy.position.set(x, y, z);
          this.dummy.scale.set(sx, sy, sz);
          this.dummy.rotation.set(0, 0, i * 0.73);
          this.dummy.updateMatrix();
          m.setMatrixAt(i, this.dummy.matrix);
        });
        group.add(m);
      }
      const box = new T.BoxGeometry(1, 1, 1);
      const boxes = new Map<number, number[][]>();
      const build = (
        g: T.Group,
        c: number,
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        rz = 0,
      ) => {
        if (g === group) {
          if (!boxes.has(c)) boxes.set(c, []);
          boxes.get(c)!.push([x, y, z, w, h, d, rz]);
          return;
        }
        const m = new T.Mesh(box, mat(c));
        m.position.set(x, y, z);
        m.scale.set(w, h, d);
        m.rotation.z = rz;
        g.add(m);
      };
      for (const [x, y] of [
        [-5.4, 10],
        [5.4, -16],
      ]) {
        build(group, 0x344b59, x, y, 0.1, 2.3, 3.3, 1.2);
        build(group, 0x91a5aa, x, y, 0.78, 2.6, 3.5, 0.2);
        build(group, 0x253c4b, x, y - 1.8, 0.35, 2, 1.1, 0.4);
        build(group, 0xffca86, x, y - 1.7, 0.64, 0.8, 0.09, 0.05);
        for (const side of [-1, 1]) {
          build(group, 0x253c4b, x + side * 1.3, y, 0.96, 0.1, 3.6, 0.18);
          for (const dy of [-1.4, 1.4])
            build(
              group,
              0x79e7e2,
              x + side * 1.19,
              y + dy,
              1.02,
              0.13,
              0.2,
              0.08,
            );
        }
        for (let i = 0; i < 4; i++)
          build(
            group,
            0x344b59,
            x + 0.65,
            y - 0.75 + i * 0.34,
            0.92,
            0.65,
            0.12,
            0.06,
          );
        build(group, 0x5b7785, x - 0.74, y - 0.55, 1.1, 0.58, 1.35, 0.5);
        build(group, 0x1e394a, x - 0.74, y - 0.55, 1.38, 0.45, 0.85, 0.08);
        build(group, 0x91a5aa, x + 1, y + 1.1, 1.48, 0.12, 0.12, 1.3);
        build(group, 0xefbc78, x + 1, y + 1.1, 2.17, 0.2, 0.2, 0.12);
        const root = new T.Group();
        root.position.set(x, y + 2, 1);
        group.add(root);
        build(root, 0x38515d, 0, 0, 0.1, 0.6, 0.6, 1.3);
        const blades = new T.Group();
        blades.position.z = 0.9;
        root.add(blades);
        for (let i = 0; i < 3; i++)
          build(
            blades,
            0x90b7bd,
            Math.cos((i * Math.PI * 2) / 3) * 1.4,
            Math.sin((i * Math.PI * 2) / 3) * 1.4,
            0,
            3.6,
            0.16,
            0.1,
            (i * Math.PI * 2) / 3,
          );
        this.rotors.push({ root, blades, localY: y + 2, tile: group });
      }
      for (const y of [-6, 22]) {
        build(group, 0x819698, 0, y, -0.32, 18, 1.25, 0.3);
        for (const side of [-1, 1])
          build(group, 0xc3d1cc, 0, y + side * 0.65, 0.05, 18, 0.08, 0.25);
      }
      for (const [color, items] of boxes) {
        const mesh = new T.InstancedMesh(box, mat(color), items.length);
        items.forEach(([x, y, z, w, h, d, rz], i) => {
          this.dummy.position.set(x, y, z);
          this.dummy.scale.set(w, h, d);
          this.dummy.rotation.set(0, 0, rz);
          this.dummy.updateMatrix();
          mesh.setMatrixAt(i, this.dummy.matrix);
        });
        group.add(mesh);
      }
    }
    this.clouds = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float a=max(0.,1.-length(p));gl_FragColor=vec4(.72,.83,.9,a*a*.22);}",
      }),
      24,
    );
    this.clouds.renderOrder = 40;
    this.clouds.frustumCulled = false;
    this.add(this.clouds);
  }
  update(scroll: number, time: number, _quality: number, visibleHeight = 28) {
    this.tiles.forEach((g, i) => {
      g.position.y = tileOffset(i, scroll);
      g.visible = Math.abs(g.position.y) < (56 + visibleHeight) / 2 + 3;
    });
    for (const r of this.rotors) r.blades.rotation.z = time * 0.9;
    this.clouds.count = Math.round(24 * _quality);
    for (let i = 0; i < this.clouds.count; i++) {
      this.dummy.position.set(
        Math.sin(i * 4.71) * 27 + Math.sin(time * 0.04 + i) * 2,
        ((i * 7.13 - time * 0.8 + 80) % 80) - 40,
        8.5,
      );
      this.dummy.scale.set(7 + (i % 4) * 1.3, 3 + (i % 3), 1);
      this.dummy.rotation.set(0, 0, i * 0.37);
      this.dummy.updateMatrix();
      this.clouds.setMatrixAt(i, this.dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
  }
}
