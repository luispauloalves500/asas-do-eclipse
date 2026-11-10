import * as T from "three";
import type { World, Enemy, Laser } from "../gameplay/World";
const C = {
  cyan: 0x65edec,
  amber: 0xffbb5c,
  silver: 0xc6d8d6,
  navy: 0x193944,
  red: 0xc43b45,
  dark: 0x18292c,
};
export class Renderer {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.OrthographicCamera(-8, 8, 14, -14, 0.1, 150);
  player: T.Group;
  boss: T.Group;
  menuShip: T.Group;
  shadow: T.Mesh;
  terrain = new T.Group();
  enemyMeshes = new Map<number, T.Group>();
  rescueMeshes = new Map<number, T.Group>();
  pickupMeshes = new Map<number, T.Group>();
  laserMeshes = new Map<number, T.Group>();
  fxMeshes = new Map<number, T.Mesh>();
  bullets: T.InstancedMesh;
  outlines: T.InstancedMesh;
  rims: T.InstancedMesh;
  beam: T.Mesh;
  menu = true;
  dummy = new T.Object3D();
  colors = new T.Color();
  matCache = new Map<number, T.MeshStandardMaterial>();
  geoCache = new Map<string, T.BufferGeometry>();
  menuTime = 0;
  renderCalls = 0;
  disposedEnemies: T.Group[] = [];
  constructor(public host: HTMLElement) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x0a1b24);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    host.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight(0xb8e7e4, 0x1e2523, 2.4));
    const light = new T.DirectionalLight(0xffe1b7, 3.5);
    light.position.set(-8, 8, 18);
    this.scene.add(light);
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);
    this.buildTerrain();
    this.scene.add(this.terrain);
    this.shadow = new T.Mesh(
      new T.CircleGeometry(1, 18),
      new T.MeshBasicMaterial({
        color: 0x061d24,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    this.shadow.scale.set(1, 0.65, 1);
    this.scene.add(this.shadow);
    this.player = this.ship();
    this.scene.add(this.player);
    this.menuShip = this.ship();
    this.scene.add(this.menuShip);
    this.boss = this.makeBoss();
    this.boss.visible = false;
    this.scene.add(this.boss);
    const bg = new T.CircleGeometry(0.19, 10),
      material = new T.MeshBasicMaterial({ color: 0xffffff });
    this.bullets = new T.InstancedMesh(bg, material, 600);
    this.outlines = new T.InstancedMesh(
      bg,
      new T.MeshBasicMaterial({ color: 0x08101b }),
      600,
    );
    this.rims = new T.InstancedMesh(
      bg,
      new T.MeshBasicMaterial({ color: 0xffe6bd }),
      600,
    );
    for (const m of [this.bullets, this.outlines, this.rims]) {
      m.instanceMatrix.setUsage(T.DynamicDrawUsage);
      m.frustumCulled = false;
      this.scene.add(m);
    }
    this.beam = new T.Mesh(
      new T.PlaneGeometry(1, 1),
      new T.MeshBasicMaterial({
        color: 0x9bffff,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    this.beam.position.z = 5;
    this.scene.add(this.beam);
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }
  material(color: number) {
    if (!this.matCache.has(color))
      this.matCache.set(
        color,
        new T.MeshStandardMaterial({
          color,
          roughness: 0.65,
          metalness: 0.35,
          flatShading: true,
        }),
      );
    return this.matCache.get(color)!;
  }
  box(
    group: T.Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    rotation = 0,
  ) {
    let geo = this.geoCache.get("box");
    if (!geo) {
      geo = new T.BoxGeometry(1, 1, 1);
      this.geoCache.set("box", geo);
    }
    const m = new T.Mesh(geo, this.material(color));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.rotation.z = rotation;
    group.add(m);
    return m;
  }
  cylinder(
    group: T.Group,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    color: number,
    vertical = true,
  ) {
    const key = "cyl";
    let geo = this.geoCache.get(key);
    if (!geo) {
      geo = new T.CylinderGeometry(1, 1, 1, 8);
      this.geoCache.set(key, geo);
    }
    const m = new T.Mesh(geo, this.material(color));
    m.position.set(x, y, z);
    m.scale.set(r, h, r);
    if (vertical) m.rotation.x = Math.PI / 2;
    group.add(m);
    return m;
  }
  wing(g: T.Group, points: number[][], color: number, z = 0.2) {
    const shape = new T.Shape();
    points.forEach((p, i) =>
      i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1]),
    );
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.03,
      bevelSegments: 1,
      steps: 1,
    });
    const m = new T.Mesh(geo, this.material(color));
    m.position.z = z;
    g.add(m);
    return m;
  }
  ship() {
    const g = new T.Group();
    this.wing(
      g,
      [
        [0, 1.2],
        [0.28, 0.45],
        [0.26, -0.9],
        [0, -1.15],
        [-0.26, -0.9],
        [-0.28, 0.45],
      ],
      C.silver,
      0.35,
    );
    this.wing(
      g,
      [
        [-0.2, 0.4],
        [-1.25, -0.45],
        [-1.15, -0.7],
        [-0.12, -0.3],
      ],
      C.navy,
      0.2,
    );
    this.wing(
      g,
      [
        [0.2, 0.4],
        [1.25, -0.45],
        [1.15, -0.7],
        [0.12, -0.3],
      ],
      C.navy,
      0.2,
    );
    this.wing(
      g,
      [
        [-0.16, -0.55],
        [-0.75, -1],
        [-0.55, -1.1],
        [0.55, -1.1],
        [0.75, -1],
        [0.16, -0.55],
      ],
      C.silver,
      0.28,
    );
    for (const x of [-0.75, 0.75]) {
      this.box(g, x, -0.52, 0.42, 0.18, 0.46, 0.12, C.cyan);
      this.cylinder(g, x * 0.65, -0.85, 0.28, 0.14, 0.7, C.navy, false);
      this.box(g, x * 0.65, -1.2, 0.28, 0.12, 0.25, 0.12, C.amber);
    }
    this.box(g, 0, 0.28, 0.61, 0.23, 0.62, 0.18, 0x153341);
    this.box(g, 0, 0.5, 0.72, 0.14, 0.23, 0.04, C.cyan);
    this.box(g, 0, -0.5, 0.6, 0.08, 0.5, 0.12, C.amber);
    const hit = new T.Mesh(
      new T.RingGeometry(0.08, 0.13, 20),
      new T.MeshBasicMaterial({ color: C.cyan }),
    );
    hit.position.z = 0.88;
    g.add(hit);
    return g;
  }
  enemy(e: Enemy) {
    const g = new T.Group();
    if (e.kind === "E01" || e.kind === "E02") {
      const s = e.kind === "E02" ? 1.15 : 1;
      this.wing(
        g,
        [
          [0, -0.85],
          [0.25, -0.2],
          [1, 0.45],
          [0.8, 0.7],
          [0.15, 0.35],
          [0, 0.75],
          [-0.15, 0.35],
          [-0.8, 0.7],
          [-1, 0.45],
          [-0.25, -0.2],
        ],
        C.red,
        0.2,
      );
      this.box(g, 0, 0, 0.44, 0.35, 1.05, 0.35, 0x502731);
      this.box(g, 0, -0.3, 0.65, 0.2, 0.25, 0.1, 0xffba83);
      g.scale.setScalar(s);
    } else if (e.kind === "E05") {
      for (const x of [-0.65, 0.65])
        this.box(g, x, 0, 0.15, 0.4, 1.8, 0.35, 0x111e23);
      this.box(g, 0, 0, 0.3, 1.1, 1.5, 0.48, 0x75504d);
      this.cylinder(g, 0, 0, 0.7, 0.52, 0.4, C.red);
      for (const x of [-0.23, 0.23])
        this.cylinder(g, x, -0.65, 0.75, 0.095, 1.2, 0x2c222b, false);
      this.box(g, 0, 0.4, 0.66, 0.7, 0.15, 0.1, 0xff7865);
    } else {
      this.cylinder(g, 0, 0, 0.18, 0.9, 0.4, 0x383d3d);
      this.cylinder(g, 0, 0, 0.65, 0.4, 0.65, C.red);
      for (const x of [-0.55, 0.55]) {
        this.box(g, x, 0, 0.75, 0.16, 0.6, 0.3, 0x8f6360);
        this.box(g, x, -0.3, 1, 0.22, 0.25, 0.2, 0xff9575);
      }
      this.cylinder(g, 0, 0, 1, 0.3, 0.2, 0xff403e);
    }
    return g;
  }
  makeBoss() {
    const g = new T.Group();
    for (const x of [-3.1, 3.1]) {
      this.box(g, x, 0, 0.2, 1.1, 4.3, 0.7, 0x111c24);
      for (let y = -1.5; y <= 1.5; y += 0.6)
        this.box(g, x, y, 0.7, 1.15, 0.15, 0.15, 0x565554);
    }
    this.wing(
      g,
      [
        [-2.7, -1.8],
        [2.7, -1.8],
        [3, 1.5],
        [2.5, 2],
        [-2.5, 2],
        [-3, 1.5],
      ],
      0x5c343e,
      0.5,
    );
    this.box(g, 0, 0.8, 0.8, 2.1, 2.7, 0.7, 0x8f4948);
    for (const x of [-2.6, 2.6]) {
      const part = new T.Group();
      part.name = x < 0 ? "left" : "right";
      part.position.x = x;
      part.position.y = -0.4;
      this.cylinder(part, 0, 0, 1, 0.85, 0.6, 0xc4514b);
      this.cylinder(part, 0, -1.0, 1.2, 0.22, 2, 0x242b32, false);
      this.box(part, 0, 0, 1.4, 0.6, 0.45, 0.14, 0xffaa78);
      g.add(part);
    }
    const core = new T.Group();
    core.name = "core";
    this.cylinder(core, 0, 0, 1.4, 0.8, 0.4, 0x4d212e);
    this.cylinder(core, 0, 0, 1.65, 0.5, 0.18, 0xff674f);
    for (let i = 0; i < 4; i++)
      this.box(
        core,
        Math.cos((i * Math.PI) / 2) * 0.68,
        Math.sin((i * Math.PI) / 2) * 0.68,
        1.65,
        0.18,
        0.18,
        0.1,
        0xffc085,
      );
    g.add(core);
    return g;
  }
  buildTerrain() {
    const ground = this.box(this.terrain, 0, 0, -1, 100, 180, 0.3, 0x213b36);
    ground.name = "sol";
    // One continuous meandering river, baked geometry, no external art.
    const vertices: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 140; i++) {
      const y = -70 + i;
      const c = Math.sin(y * 0.095) * 1.5;
      vertices.push(c - 2.6, y, -0.78, c + 2.6, y, -0.78);
      if (i < 140) {
        const j = i * 2;
        indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const river = new T.Mesh(geo, this.material(0x174b59));
    this.terrain.add(river);
    const batches = new Map<
      number,
      {
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        rot: number;
      }[]
    >();
    let seed = 43;
    const rnd = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const add = (
      c: number,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      rot = 0,
    ) => {
      if (!batches.has(c)) batches.set(c, []);
      batches.get(c)!.push({ x, y, z, sx, sy, sz, rot });
    };
    for (let i = 0; i < 170; i++) {
      const y = rnd() * 112 - 56,
        x = (rnd() < 0.5 ? -1 : 1) * (4 + rnd() * 19),
        s = 0.4 + rnd() * 1.2;
      if (i % 3 === 0) {
        add(0x52615a, x, y, -0.1, s, s * 1.4, 0.6 + rnd() * 1.6, rnd() * 0.4);
        add(0x2e4545, x + 0.1, y, 0.6, s * 0.8, s * 0.8, 0.1);
      } else {
        add(0x294b3d, x, y, -0.4, s * 1.5, s * 1.4, 0.6, rnd());
        add(0x39634c, x, y, 0.05, s * 0.7, s * 0.7, 1, rnd());
      }
    }
    for (const x of [-6.8, 6.8]) {
      add(0x374745, x, 0, -0.6, 1.5, 140, 0.15);
      for (let y = -65; y < 70; y += 3)
        add(0x77877a, x, y, -0.5, 0.08, 1, 0.04);
    }
    for (const y of [-40, -4, 34]) {
      add(0x59635c, 0, y, -0.45, 17, 2.8, 0.4);
      for (const side of [-1, 1])
        add(0xa3aaa0, 0, y + side * 1.35, -0.1, 17, 0.12, 0.5);
      for (let x = -8; x <= 8; x += 2)
        add(0x263c3c, x, y, -0.2, 0.12, 2.5, 0.45);
    }
    // Dam gates and amber beacon strip.
    add(0x7c8072, 0, 20, -0.15, 13, 3, 0.7);
    for (let x = -5; x <= 5; x += 2) {
      add(0x20383a, x, 19.7, 0.3, 0.9, 2, 0.2);
      add(0xffbc65, x, 18.4, 0.2, 0.4, 0.12, 0.1);
    }
    for (const [color, items] of batches) {
      const batch = new T.InstancedMesh(
        new T.BoxGeometry(1, 1, 1),
        this.material(color),
        items.length,
      );
      items.forEach((it, i) => {
        this.dummy.position.set(it.x, it.y, it.z);
        this.dummy.scale.set(it.sx, it.sy, it.sz);
        this.dummy.rotation.set(0, 0, it.rot);
        this.dummy.updateMatrix();
        batch.setMatrixAt(i, this.dummy.matrix);
      });
      this.terrain.add(batch);
    }
  }
  setMenu(menu: boolean) {
    if (this.menu === menu) return;
    this.menu = menu;
    this.resize();
  }
  resize() {
    const w = this.menu
        ? window.innerWidth
        : Math.min(window.innerWidth, (window.innerHeight * 16) / 28),
      h = this.menu ? window.innerHeight : (w * 28) / 16;
    this.host.style.width = `${w}px`;
    this.host.style.height = `${h}px`;
    this.renderer.setSize(w, h);
    this.camera.left = (-14 * w) / h;
    this.camera.right = (14 * w) / h;
    this.camera.top = 14;
    this.camera.bottom = -14;
    this.camera.updateProjectionMatrix();
  }
  lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
  render(world: World | null, alpha: number, delta: number) {
    this.menuTime += Math.min(delta, 0.1);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.scale.setScalar(1);
    this.terrain.position.y =
      ((world && !this.menu ? world.scroll : this.menuTime * 0.55) % 56) - 28;
    this.menuShip.visible = this.menu;
    this.shadow.visible = !this.menu && !!world && world.player.hp > 0;
    this.player.visible = !this.menu && !!world && world.player.hp > 0;
    this.boss.visible = !this.menu && !!world?.boss;
    if (this.menu) {
      this.menuShip.position.set(
        Math.max(3, this.camera.right * 0.36),
        -0.3,
        3,
      );
      this.menuShip.scale.setScalar(3.2);
      this.menuShip.rotation.set(
        0.12,
        Math.sin(this.menuTime * 0.3) * 0.16,
        -0.38 + Math.sin(this.menuTime * 0.2) * 0.04,
      );
    }
    if (world && !this.menu) {
      const p = world.player;
      this.player.position.set(
        this.lerp(p.px, p.x, alpha),
        this.lerp(p.py, p.y, alpha),
        1.3,
      );
      this.shadow.position.set(
        this.player.position.x + 0.35,
        this.player.position.y - 0.4,
        0.08,
      );
      this.player.rotation.set(
        (p.vy / 8.2) * 0.14,
        (-p.vx / 8.2) * 0.314,
        -p.vx * 0.014,
      );
      this.player.visible =
        p.hp > 0 && !(p.invul > 0 && Math.floor(this.menuTime * 12) % 2 === 0);
      if (world.boss) {
        const b = world.boss;
        this.boss.position.set(b.x, this.lerp(b.py, b.y, alpha), 0.1);
        this.boss.getObjectByName("left")!.visible = b.left > 0;
        this.boss.getObjectByName("right")!.visible = b.right > 0;
        this.boss
          .getObjectByName("core")!
          .scale.setScalar(1 + Math.sin(this.menuTime * 8) * 0.04);
        this.boss.rotation.z = b.dead ? Math.sin(b.deathTime * 15) * 0.02 : 0;
        this.boss.visible = b.deathTime < 3.2;
      }
      this.syncEnemies(world, alpha);
      this.syncObjects(world, alpha);
      this.syncLasers(world);
      this.syncEffects(world);
      let count = 0;
      for (const b of world.pool.items) {
        if (!b.active) continue;
        const x = this.lerp(b.px, b.x, alpha),
          y = this.lerp(b.py, b.y, alpha);
        this.dummy.position.set(x, y, 5.1);
        this.dummy.scale.set(b.friendly ? 0.58 : 1, b.friendly ? 1.5 : 1, 1);
        this.dummy.updateMatrix();
        this.bullets.setMatrixAt(count, this.dummy.matrix);
        this.bullets.setColorAt(
          count,
          this.colors.set(b.friendly ? C.cyan : 0xff785e),
        );
        this.dummy.position.z = 5;
        this.dummy.scale.multiplyScalar(1.35);
        this.dummy.updateMatrix();
        this.rims.setMatrixAt(count, this.dummy.matrix);
        this.dummy.position.z = 4.95;
        this.dummy.scale.multiplyScalar(1.4);
        this.dummy.updateMatrix();
        this.outlines.setMatrixAt(count, this.dummy.matrix);
        count++;
      }
      for (const m of [this.bullets, this.rims, this.outlines]) {
        m.visible = true;
        m.count = count;
        m.instanceMatrix.needsUpdate = true;
      }
      if (this.bullets.instanceColor)
        this.bullets.instanceColor.needsUpdate = true;
      this.beam.visible = p.beam > 0;
      this.beam.position.set(p.x, (p.y + 15) / 2, 4.8);
      this.beam.scale.set(0.8, 15 - p.y, 1);
    } else {
      for (const m of [this.bullets, this.rims, this.outlines, this.beam])
        m.visible = false;
      for (const maps of [
        this.enemyMeshes,
        this.rescueMeshes,
        this.pickupMeshes,
        this.laserMeshes,
        this.fxMeshes,
      ])
        for (const m of maps.values()) m.visible = false;
    }
    this.renderer.render(this.scene, this.camera);
    this.renderCalls = this.renderer.info.render.calls;
  }
  syncEnemies(w: World, a: number) {
    const live = new Set(w.enemies.map((e) => e.id));
    for (const [id, m] of this.enemyMeshes)
      if (!live.has(id)) {
        this.scene.remove(m);
        this.enemyMeshes.delete(id);
        this.releaseUnique(m);
      }
    for (const e of w.enemies) {
      let m = this.enemyMeshes.get(e.id);
      if (!m) {
        m = this.enemy(e);
        this.enemyMeshes.set(e.id, m);
        this.scene.add(m);
      }
      m.visible = true;
      m.position.set(
        this.lerp(e.px, e.x, a),
        this.lerp(e.py, e.y, a),
        e.kind === "E05" || e.kind === "E06" ? 0.05 : 1,
      );
      m.rotation.z = e.kind === "E02" ? Math.cos(e.age * 1.7) * 0.15 : 0;
      const s = e.state === "TELEGRAPH" ? 1 + Math.sin(e.age * 20) * 0.025 : 1;
      m.scale.setScalar(s);
    }
  }
  ring(radius: number, color: number, width = 0.06) {
    return new T.Mesh(
      new T.RingGeometry(radius - width, radius, 40),
      new T.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
  }
  syncObjects(w: World, a: number) {
    const rescueIds = new Set(
      w.rescues.filter((r) => r.active).map((r) => r.id),
    );
    for (const [id, m] of this.rescueMeshes)
      if (!rescueIds.has(id)) {
        this.scene.remove(m);
        this.rescueMeshes.delete(id);
        this.releaseUnique(m);
      }
    for (const r of w.rescues) {
      if (!r.active) continue;
      let m = this.rescueMeshes.get(r.id);
      if (!m) {
        m = new T.Group();
        m.add(this.ring(1.5, C.amber));
        this.box(m, 0, 0, 0.3, 0.6, 0.8, 0.3, 0xe8c38c);
        this.box(m, 0, 0, 0.5, 0.15, 0.6, 0.1, C.navy);
        this.box(m, 0, 0, 0.51, 0.5, 0.15, 0.1, C.navy);
        const arc = this.ring(1.35, C.cyan, 0.12);
        arc.name = "progress";
        m.add(arc);
        this.rescueMeshes.set(r.id, m);
        this.scene.add(m);
      }
      m.visible = true;
      m.position.set(r.x, this.lerp(r.py, r.y, a), 1);
      m.getObjectByName("progress")!.scale.setScalar(
        Math.max(0.01, r.progress),
      );
    }
    const pickupIds = new Set(w.pickups.map((p) => p.id));
    for (const [id, m] of this.pickupMeshes)
      if (!pickupIds.has(id)) {
        this.scene.remove(m);
        this.pickupMeshes.delete(id);
        this.releaseUnique(m);
      }
    for (const p of w.pickups) {
      let m = this.pickupMeshes.get(p.id);
      if (!m) {
        m = new T.Group();
        if (p.kind === "scrap") {
          this.box(m, 0, 0, 0, 0.35, 0.35, 0.2, C.amber, Math.PI / 4);
          m.add(this.ring(0.32, 0xffd695, 0.025));
        } else {
          this.box(m, 0, 0, 0, 0.75, 0.75, 0.2, 0xf1f0d7);
          this.box(m, 0, 0, 0.2, 0.16, 0.55, 0.05, 0x299c93);
          this.box(m, 0, 0, 0.21, 0.55, 0.16, 0.05, 0x299c93);
        }
        this.pickupMeshes.set(p.id, m);
        this.scene.add(m);
      }
      m.visible = p.life > 3 || Math.floor(p.life * 5) % 2 === 0;
      m.position.set(this.lerp(p.px, p.x, a), this.lerp(p.py, p.y, a), 3);
      m.rotation.z = this.menuTime * 0.8;
    }
  }
  syncLasers(w: World) {
    const ids = new Set(w.lasers.map((l) => l.id));
    for (const [id, m] of this.laserMeshes)
      if (!ids.has(id)) {
        this.scene.remove(m);
        this.laserMeshes.delete(id);
        this.releaseUnique(m);
      }
    for (const l of w.lasers) {
      let m = this.laserMeshes.get(l.id);
      if (!m) {
        m = new T.Group();
        const plane = new T.Mesh(
          new T.PlaneGeometry(1, 1),
          new T.MeshBasicMaterial({
            color: 0xffb882,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          }),
        );
        m.add(plane);
        this.laserMeshes.set(l.id, m);
        this.scene.add(m);
      }
      const firing = l.age > l.warn + 0.15;
      const len = Math.hypot(l.tx - l.x, l.ty - l.y);
      m.visible = true;
      m.position.set((l.x + l.tx) / 2, (l.y + l.ty) / 2, 4.4);
      m.rotation.z = -Math.atan2(l.tx - l.x, l.ty - l.y);
      m.scale.set(firing ? l.width : 0.045, len, 1);
      const mat = (m.children[0] as T.Mesh).material as T.MeshBasicMaterial;
      mat.color.setHex(firing ? 0xffd6ae : 0xff6a55);
      mat.opacity = firing ? 0.92 : 0.55 + Math.sin(this.menuTime * 22) * 0.25;
    }
  }
  syncEffects(w: World) {
    const ids = new Set(w.fx.map((f) => f.id));
    for (const [id, m] of this.fxMeshes)
      if (!ids.has(id)) {
        this.scene.remove(m);
        m.geometry.dispose();
        (m.material as T.Material).dispose();
        this.fxMeshes.delete(id);
      }
    for (const f of w.fx) {
      let m = this.fxMeshes.get(f.id);
      if (!m) {
        m = this.ring(1, parseInt(f.color.slice(1), 16), 0.12);
        this.fxMeshes.set(f.id, m);
        this.scene.add(m);
      }
      m.visible = true;
      m.position.set(f.x, f.y, 3.8);
      m.scale.setScalar(0.1 + (f.age / f.life) * f.size);
      (m.material as T.MeshBasicMaterial).opacity = (1 - f.age / f.life) * 0.75;
    }
  }
  releaseUnique(g: T.Object3D) {
    g.traverse((o) => {
      if (o instanceof T.Mesh) {
        if (![...this.geoCache.values()].includes(o.geometry))
          o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats)
          if (
            ![...this.matCache.values()].includes(m as T.MeshStandardMaterial)
          )
            m.dispose();
      }
    });
  }
  clearSession() {
    for (const map of [
      this.enemyMeshes,
      this.rescueMeshes,
      this.pickupMeshes,
      this.laserMeshes,
      this.fxMeshes,
    ]) {
      for (const m of map.values()) {
        this.scene.remove(m);
        this.releaseUnique(m);
      }
      map.clear();
    }
  }
}
