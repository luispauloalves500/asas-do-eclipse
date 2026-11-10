import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { EnemyKind } from "../data/enemies";
const P = {
  white: 0xc1d5cf,
  edge: 0x617e80,
  dark: 0x142a35,
  cyan: 0x60e9df,
  gold: 0xe8b66a,
  red: 0xa83a43,
  plate: 0x653e45,
  black: 0x17242b,
  hot: 0xff9870,
};
/** Original primitive kit. Static details merge by material; wings/turrets stay articulated. */
export class Models {
  constructor(private mat: (color: number) => T.MeshStandardMaterial) {}
  mesh(
    g: T.Group,
    geo: T.BufferGeometry,
    color: number,
    x = 0,
    y = 0,
    z = 0,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const m = new T.Mesh(geo, this.mat(color));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    g.add(m);
    return m;
  }
  box(
    g: T.Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rz = 0,
  ) {
    return this.mesh(
      g,
      new T.BoxGeometry(1, 1, 1),
      c,
      x,
      y,
      z,
      w,
      h,
      d,
      0,
      0,
      rz,
    );
  }
  cyl(
    g: T.Group,
    c: number,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    axis = "z",
    top = 1,
  ) {
    return this.mesh(
      g,
      new T.CylinderGeometry(top, 1, 1, 10),
      c,
      x,
      y,
      z,
      r,
      h,
      r,
      axis === "z" ? Math.PI / 2 : 0,
    );
  }
  ball(
    g: T.Group,
    c: number,
    x: number,
    y: number,
    z: number,
    xs: number,
    ys: number,
    zs: number,
  ) {
    return this.mesh(g, new T.SphereGeometry(1, 10, 6), c, x, y, z, xs, ys, zs);
  }
  plate(g: T.Group, c: number, points: number[][], z: number, depth = 0.12) {
    const shape = new T.Shape();
    points.forEach((p, i) =>
      i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1]),
    );
    shape.closePath();
    return this.mesh(
      g,
      new T.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.045,
        bevelSize: 0.04,
        bevelSegments: 1,
        steps: 1,
      }),
      c,
      0,
      0,
      z,
    );
  }
  group(root: T.Group, name: string, x = 0, y = 0, z = 0) {
    const g = new T.Group();
    g.name = name;
    g.userData.dynamic = true;
    g.position.set(x, y, z);
    root.add(g);
    return g;
  }
  glow(
    g: T.Group,
    name: string,
    x: number,
    y: number,
    z: number,
    color: number,
    size = 0.08,
  ) {
    const node = this.group(g, name, x, y, z);
    const m = new T.Mesh(
      new T.SphereGeometry(size, 8, 5),
      new T.MeshBasicMaterial({ color }),
    );
    node.add(m);
    return node;
  }
  batch(g: T.Group) {
    const groups = new Map<T.Material, T.BufferGeometry[]>();
    for (const child of [...g.children]) {
      if (child instanceof T.Group) {
        this.batch(child);
        continue;
      }
      if (
        !(child instanceof T.Mesh) ||
        !(child.material instanceof T.MeshStandardMaterial)
      )
        continue;
      child.updateMatrix();
      let geo = child.geometry.clone().applyMatrix4(child.matrix);
      if (geo.index) {
        const indexed = geo;
        geo = geo.toNonIndexed();
        indexed.dispose();
      }
      if (!groups.has(child.material)) groups.set(child.material, []);
      groups.get(child.material)!.push(geo);
      child.geometry.dispose();
      g.remove(child);
    }
    for (const [material, geos] of groups) {
      const merged = mergeGeometries(geos, false);
      if (merged) g.add(new T.Mesh(merged, material));
      for (const geo of geos) geo.dispose();
    }
    return g;
  }
  ship() {
    const g = new T.Group();
    this.plate(
      g,
      P.white,
      [
        [0, 1.22],
        [0.24, 0.65],
        [0.28, -0.65],
        [0.16, -1.05],
        [-0.16, -1.05],
        [-0.28, -0.65],
        [-0.24, 0.65],
      ],
      0.28,
      0.2,
    );
    this.ball(g, P.white, 0, 0.12, 0.55, 0.24, 0.85, 0.19);
    this.cyl(g, P.edge, 0, -0.61, 0.46, 0.17, 0.65, "y", 0.8);
    this.ball(g, P.dark, 0, 0.41, 0.72, 0.19, 0.46, 0.15);
    this.ball(g, 0x31858c, 0, 0.48, 0.76, 0.135, 0.32, 0.12);
    for (const x of [-0.16, 0.16])
      this.box(g, P.edge, x, 0.42, 0.8, 0.035, 0.68, 0.04);
    this.box(g, P.white, 0, 0.65, 0.82, 0.32, 0.04, 0.04);
    this.box(g, P.gold, 0, 0.08, 0.79, 0.035, 0.36, 0.025);
    this.box(g, P.dark, 0, -0.42, 0.66, 0.18, 0.32, 0.045);
    for (let i = 0; i < 4; i++)
      this.box(g, P.edge, 0, -0.38 - i * 0.055, 0.7, 0.18, 0.018, 0.035);
    for (const sign of [-1, 1]) {
      const wing = this.group(
        g,
        sign < 0 ? "wingLeft" : "wingRight",
        sign * 0.18,
        -0.1,
        0.3,
      );
      this.plate(
        wing,
        P.dark,
        [
          [0, 0.43],
          [sign * 1.1, -0.35],
          [sign * 1.05, -0.66],
          [sign * 0.12, -0.38],
        ],
        0,
        0.09,
      );
      this.plate(
        wing,
        P.white,
        [
          [sign * 0.04, 0.31],
          [sign * 0.94, -0.32],
          [sign * 0.8, -0.46],
          [sign * 0.11, -0.25],
        ],
        0.11,
        0.05,
      );
      this.box(
        wing,
        P.gold,
        sign * 0.69,
        -0.31,
        0.24,
        0.06,
        0.37,
        0.025,
        -sign * 0.65,
      );
      this.box(
        wing,
        P.cyan,
        sign * 0.88,
        -0.43,
        0.23,
        0.23,
        0.055,
        0.03,
        -sign * 0.25,
      );
      this.box(wing, P.edge, sign * 0.5, -0.3, 0.05, 0.16, 0.65, 0.18);
      this.cyl(wing, P.dark, sign * 0.52, -0.3, 0.12, 0.08, 0.68, "y");
      this.glow(
        wing,
        "nav" + sign,
        sign * 1.06,
        -0.51,
        0.25,
        sign < 0 ? P.cyan : P.gold,
        0.045,
      );
      this.plate(
        g,
        P.white,
        [
          [sign * 0.08, -0.64],
          [sign * 0.65, -1.02],
          [sign * 0.55, -1.12],
          [sign * 0.09, -0.93],
        ],
        0.45,
        0.07,
      );
      this.cyl(g, P.edge, sign * 0.39, -0.67, 0.33, 0.17, 0.66, "y");
      this.cyl(g, P.dark, sign * 0.39, -1.01, 0.33, 0.145, 0.08, "y");
      this.glow(g, "engine" + sign, sign * 0.39, -1.065, 0.33, P.cyan, 0.105);
      const exhaust = this.group(g, "exhaust" + sign, sign * 0.39, -1.15, 0.33);
      this.mesh(
        exhaust,
        new T.ConeGeometry(0.11, 0.5, 8),
        P.cyan,
        0,
        -0.18,
        0,
        1,
        1,
        1,
        0,
        0,
        Math.PI,
      );
    }
    this.box(g, P.edge, 0, -0.72, 0.83, 0.07, 0.48, 0.4);
    this.box(g, P.gold, 0, -0.75, 1.03, 0.08, 0.26, 0.04);
    const hit = new T.Mesh(
      new T.RingGeometry(0.065, 0.105, 20),
      new T.MeshBasicMaterial({ color: P.cyan, depthTest: false }),
    );
    hit.position.z = 1.12;
    hit.renderOrder = 70;
    g.add(hit);
    return this.batch(g);
  }
  enemy(kind: EnemyKind) {
    const g = new T.Group();
    if (kind === "E01" || kind === "E02") {
      const wide = kind === "E01" ? 1 : 1.2;
      this.plate(
        g,
        P.red,
        kind === "E01"
          ? [
              [0, -0.9],
              [0.22, -0.2],
              [wide, 0.42],
              [0.86, 0.68],
              [0.1, 0.32],
              [0, 0.72],
              [-0.1, 0.32],
              [-0.86, 0.68],
              [-wide, 0.42],
              [-0.22, -0.2],
            ]
          : [
              [0, -1],
              [0.3, -0.28],
              [1.12, -0.1],
              [1.18, 0.65],
              [0.76, 0.48],
              [0.24, 0.13],
              [0, 0.85],
              [-0.24, 0.13],
              [-0.76, 0.48],
              [-1.18, 0.65],
              [-1.12, -0.1],
              [-0.3, -0.28],
            ],
        0.2,
        0.15,
      );
      this.ball(g, P.plate, 0, -0.02, 0.49, 0.22, 0.65, 0.22);
      this.ball(g, P.black, 0, -0.32, 0.64, 0.17, 0.29, 0.11);
      this.glow(g, "eye", 0, -0.5, 0.7, P.hot, 0.09);
      for (const x of [-0.55, 0.55]) {
        this.box(g, P.black, x, 0.2, 0.37, 0.2, 0.5, 0.2);
        this.box(g, P.hot, x, 0.03, 0.5, 0.12, 0.1, 0.035);
        this.box(g, 0x922c39, x, 0.38, 0.57, 0.14, 0.2, 0.09);
        this.cyl(g, P.black, x, -0.22, 0.34, 0.065, 0.55, "y");
      }
      if (kind === "E02") {
        for (const x of [-0.87, 0.87]) {
          this.cyl(g, P.black, x, 0.3, 0.58, 0.3, 0.12);
          this.cyl(g, P.red, x, 0.3, 0.68, 0.22, 0.06);
          this.box(g, P.edge, x, 0.3, 0.74, 0.48, 0.035, 0.025);
        }
      } else this.box(g, P.plate, 0, 0.51, 0.65, 0.09, 0.38, 0.3);
    } else if (kind === "E05") {
      for (const x of [-0.68, 0.68]) {
        this.box(g, P.black, x, 0, 0.2, 0.38, 1.8, 0.45);
        for (let y = -0.7; y < 0.9; y += 0.28)
          this.box(g, P.edge, x, y, 0.44, 0.4, 0.08, 0.08);
      }
      this.plate(
        g,
        P.plate,
        [
          [-0.55, -0.8],
          [0.55, -0.8],
          [0.65, 0.6],
          [0.4, 0.85],
          [-0.4, 0.85],
          [-0.65, 0.6],
        ],
        0.35,
        0.3,
      );
      for (const x of [-0.46, 0.46])
        this.box(g, P.red, x, 0, 0.73, 0.15, 1.1, 0.12);
      const turret = this.group(g, "turret");
      this.cyl(turret, P.black, 0, 0.08, 0.79, 0.51, 0.18);
      this.cyl(turret, P.red, 0, 0.08, 0.98, 0.43, 0.3);
      this.box(turret, P.plate, 0, -0.1, 1.16, 0.55, 0.42, 0.2);
      for (const x of [-0.2, 0.2]) {
        this.cyl(turret, P.black, x, -0.62, 1.03, 0.085, 1.1, "y");
        this.cyl(turret, P.edge, x, -1.08, 1.03, 0.11, 0.22, "y");
      }
      this.glow(turret, "sight", 0, -0.15, 1.3, P.hot, 0.065);
      for (const x of [-0.35, 0.35])
        this.box(g, P.hot, x, 0.62, 0.77, 0.12, 0.1, 0.05);
    } else {
      this.cyl(g, P.black, 0, 0, 0.22, 0.94, 0.4);
      this.cyl(g, P.edge, 0, 0, 0.48, 0.74, 0.16);
      this.cyl(g, P.plate, 0, 0, 0.92, 0.37, 0.8);
      this.cyl(g, P.red, 0, 0, 1.37, 0.52, 0.2);
      const turret = this.group(g, "turret");
      for (const x of [-0.6, 0.6]) {
        this.box(turret, P.red, x, 0, 1.32, 0.22, 0.65, 0.4);
        this.box(turret, P.black, x, -0.38, 1.4, 0.19, 0.45, 0.22);
        this.glow(turret, "lens" + x, x, -0.62, 1.4, P.hot, 0.1);
      }
      this.cyl(turret, P.black, 0, 0, 1.62, 0.36, 0.2);
      this.glow(turret, "lens", 0, 0, 1.8, P.hot, 0.22);
      this.box(g, P.edge, 0, 0.4, 1.8, 0.035, 0.035, 1.1);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        this.box(
          g,
          P.red,
          Math.cos(a) * 0.62,
          Math.sin(a) * 0.62,
          0.6,
          0.16,
          0.16,
          0.35,
        );
      }
    }
    return this.batch(g);
  }
  boss() {
    const g = new T.Group();
    for (const x of [-3.05, 3.05]) {
      this.box(g, P.black, x, 0, 0.35, 1.1, 4.6, 0.8);
      for (let y = -1.85; y < 2; y += 0.46) {
        this.cyl(g, P.edge, x, y, 0.4, 0.38, 0.95, "y");
        this.box(g, P.plate, x, y, 0.83, 1.16, 0.13, 0.18);
      }
      this.box(g, P.black, x, 0, 0.87, 0.68, 4.2, 0.16);
    }
    this.plate(
      g,
      P.plate,
      [
        [-2.65, -1.9],
        [2.65, -1.9],
        [2.8, 1.4],
        [2.2, 2.15],
        [-2.2, 2.15],
        [-2.8, 1.4],
      ],
      0.6,
      0.48,
    );
    for (const x of [-1.8, 1.8]) {
      this.box(g, P.red, x, 0.2, 1.25, 1.05, 2.4, 0.35);
      for (let y = -0.7; y < 1.4; y += 0.48)
        this.box(g, 0x8e4b4c, x, y, 1.47, 0.9, 0.36, 0.07);
    }
    const cab = this.group(g, "cab");
    this.box(cab, P.red, 0, 1.5, 1.35, 1.65, 1.25, 0.9);
    this.box(cab, P.black, 0, 1.32, 1.85, 1.37, 0.62, 0.15);
    for (const x of [-0.4, 0.4])
      this.box(cab, 0x688080, x, 1.32, 1.95, 0.56, 0.48, 0.04);
    this.box(cab, P.edge, 0, 1.55, 2.03, 1.7, 0.12, 0.12);
    this.box(cab, P.edge, 0, 2.05, 1.66, 1.75, 0.16, 0.45);
    for (const x of [-0.65, 0.65]) {
      this.box(cab, P.hot, x, 1.97, 1.28, 0.22, 0.12, 0.13);
      this.cyl(cab, P.black, x, 1.7, 2.2, 0.08, 0.6, "y");
    }
    for (const side of [-1, 1]) {
      const x = side * 2.6,
        part = this.group(g, side < 0 ? "left" : "right", x, -0.4, 0.1);
      this.cyl(part, P.black, 0, 0, 1.1, 0.95, 0.35);
      this.cyl(part, P.red, 0, 0, 1.47, 0.78, 0.45);
      this.plate(
        part,
        0xb35b55,
        [
          [-0.6, -0.4],
          [0.6, -0.4],
          [0.7, 0.3],
          [0.4, 0.6],
          [-0.4, 0.6],
          [-0.7, 0.3],
        ],
        1.66,
        0.14,
      );
      this.cyl(part, P.black, 0, -0.82, 1.61, 0.22, 1.8, "y");
      this.cyl(part, P.edge, 0, -1.55, 1.61, 0.28, 0.28, "y");
      for (const n of [-0.25, 0.25])
        this.box(part, P.plate, n, -0.6, 1.79, 0.12, 0.8, 0.15);
      this.glow(part, "sight", 0, -0.12, 1.99, P.hot, 0.12);
      const wreck = this.group(
        g,
        side < 0 ? "leftWreck" : "rightWreck",
        x,
        -0.4,
        0.1,
      );
      this.cyl(wreck, P.black, 0, 0, 1.05, 0.87, 0.15);
      for (let i = 0; i < 4; i++)
        this.box(
          wreck,
          P.edge,
          ((i % 2) - 0.5) * 0.75,
          (Math.floor(i / 2) - 0.5) * 0.65,
          1.19,
          0.35,
          0.45,
          0.12,
          i * 0.5,
        );
      this.glow(wreck, "ember", 0, 0, 1.25, 0xff6b35, 0.18);
      wreck.visible = false;
    }
    const core = this.group(g, "core");
    this.cyl(core, P.black, 0, -0.2, 1.35, 0.93, 0.48);
    this.cyl(core, P.plate, 0, -0.2, 1.62, 0.78, 0.2);
    this.cyl(core, P.hot, 0, -0.2, 1.77, 0.48, 0.13);
    this.cyl(core, P.gold, 0, -0.2, 1.87, 0.22, 0.08);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      this.box(
        core,
        P.edge,
        Math.cos(a) * 0.76,
        -0.2 + Math.sin(a) * 0.76,
        1.82,
        0.18,
        0.24,
        0.2,
        a,
      );
    }
    this.box(g, P.black, 0, -1.55, 1.15, 1.7, 0.52, 0.3);
    for (let x = -0.65; x < 0.8; x += 0.22)
      this.box(g, P.edge, x, -1.55, 1.35, 0.08, 0.4, 0.07);
    return this.batch(g);
  }
}
