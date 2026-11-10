import * as T from "three";
import { Models } from "./Models";
import { Canyon } from "./Canyon";
import type { StageId } from "../data/stages";
import { Terrain } from "./Terrain";
import { Particles } from "./Particles";
import { Quality } from "./Quality";
import { viewport } from "../core/Viewport";
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
  serpent: T.Group;
  canyon: Canyon;
  convoyMeshes = new Map<number, T.Group>();
  mineRings: T.InstancedMesh;
  stageId: StageId = "M01";
  menuShip: T.Group;
  shadow: T.Mesh;
  terrain: Terrain;
  models: Models;
  particles: Particles;
  quality = new Quality();
  vignette: T.Mesh;
  groundShadows: T.InstancedMesh;
  lastShots = 0;
  lastHP = 100;
  lastBossHP = 600;
  trailTime = 0;
  shake = 0;
  metrics = viewport(window.innerWidth, window.innerHeight);
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
    this.models = new Models((color) => this.material(color));
    this.terrain = new Terrain((color) => this.material(color));
    this.scene.add(this.terrain);
    this.canyon = new Canyon((color) => this.material(color));
    this.canyon.visible = false;
    this.scene.add(this.canyon);
    this.particles = new Particles(this.scene);
    this.groundShadows = new T.InstancedMesh(
      new T.CircleGeometry(1, 16),
      new T.MeshBasicMaterial({
        color: 0x071e25,
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
      }),
      80,
    );
    this.groundShadows.frustumCulled = false;
    this.scene.add(this.groundShadows);
    this.vignette = new T.Mesh(
      new T.PlaneGeometry(1, 1),
      new T.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { uField: { value: new T.Vector2(1, 1) } },
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "uniform vec2 uField;varying vec2 vUv;void main(){vec2 d=abs(vUv-.5)*2.;float a=max(smoothstep(uField.x-.04,uField.x+.14,d.x),smoothstep(uField.y-.04,uField.y+.14,d.y));float vignette=smoothstep(.4,1.35,length(d))*.16;gl_FragColor=vec4(.015,.04,.055,a*.45+vignette);}",
      }),
    );
    this.vignette.position.z = 15;
    this.vignette.renderOrder = 75;
    this.scene.add(this.vignette);
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
    this.serpent = this.models.serpent();
    this.serpent.visible = false;
    this.scene.add(this.serpent);
    const bg = new T.CircleGeometry(0.19, 10),
      material = new T.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
    this.bullets = new T.InstancedMesh(bg, material, 600);
    this.outlines = new T.InstancedMesh(
      bg,
      new T.MeshBasicMaterial({
        color: 0x08101b,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
      600,
    );
    this.rims = new T.InstancedMesh(
      bg,
      new T.MeshBasicMaterial({
        color: 0xffe6bd,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
      600,
    );
    for (const m of [this.bullets, this.outlines, this.rims]) {
      m.instanceMatrix.setUsage(T.DynamicDrawUsage);
      m.frustumCulled = false;
      this.scene.add(m);
    }
    this.outlines.renderOrder = 100;
    this.rims.renderOrder = 101;
    this.bullets.renderOrder = 102;
    this.mineRings = new T.InstancedMesh(
      new T.RingGeometry(0.35, 0.48, 4),
      new T.MeshBasicMaterial({
        color: 0xffc080,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
      600,
    );
    this.mineRings.renderOrder = 103;
    this.mineRings.frustumCulled = false;
    this.scene.add(this.mineRings);
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
          emissive: [0x60e9df, 0x65edec, 0xff9870, 0xe8b66a].includes(color)
            ? color
            : 0x000000,
          emissiveIntensity: 0.35,
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
    return this.models.ship();
  }
  enemy(e: Enemy) {
    return this.models.enemy(e.kind);
  }
  makeBoss() {
    return this.models.boss();
  }
  setStage(id: StageId) {
    this.stageId = id;
    this.terrain.visible = id === "M01";
    this.canyon.visible = id === "M02";
  }
  setMenu(menu: boolean) {
    if (this.menu === menu) return;
    this.menu = menu;
    this.resize();
  }
  resize() {
    const w = window.innerWidth,
      h = window.innerHeight;
    this.metrics = viewport(w, h);
    this.host.style.width = `${w}px`;
    this.host.style.height = `${h}px`;
    this.renderer.setSize(w, h);
    const worldWidth = this.menu ? (28 * w) / h : this.metrics.worldWidth,
      worldHeight = this.menu ? 28 : this.metrics.worldHeight;
    this.camera.left = -worldWidth / 2;
    this.camera.right = worldWidth / 2;
    this.camera.top = worldHeight / 2;
    this.camera.bottom = -worldHeight / 2;
    this.camera.updateProjectionMatrix();
    this.vignette.scale.set(worldWidth, worldHeight, 1);
    (this.vignette.material as T.ShaderMaterial).uniforms.uField.value.set(
      16 / worldWidth,
      28 / worldHeight,
    );
  }
  animateShip(ship: T.Group, vx: number, vy: number) {
    for (const side of [-1, 1]) {
      const wing = ship.getObjectByName(side < 0 ? "wingLeft" : "wingRight");
      if (wing) {
        wing.rotation.y = side * 0.07 + vx * 0.015;
        wing.rotation.x = vy * 0.008;
      }
      const exhaust = ship.getObjectByName("exhaust" + side);
      if (exhaust)
        exhaust.scale.y =
          0.8 +
          Math.sin(this.menuTime * 44 + side) * 0.12 +
          Math.abs(vy) * 0.05;
      const nav = ship.getObjectByName("nav" + side);
      if (nav) nav.visible = Math.sin(this.menuTime * 2 + side) > -0.6;
    }
  }
  lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
  render(world: World | null, alpha: number, delta: number) {
    this.menuTime += Math.min(delta, 0.1);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.scale.setScalar(1);
    const visualDt = world?.state === "dying" ? delta * 0.2 : delta;
    if (this.quality.sample(delta)) {
      this.renderer.setPixelRatio(
        Math.min(devicePixelRatio, 1.5) * this.quality.level,
      );
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    this.particles.quality = this.quality.level;
    (this.stageId === "M02" ? this.canyon : this.terrain).update(
      world && !this.menu ? world.scroll : this.menuTime * 0.55,
      this.menuTime,
      this.quality.level,
      this.menu ? 28 : this.metrics.worldHeight,
    );
    this.vignette.visible = !this.menu;
    this.groundShadows.visible = !this.menu;
    this.shake = Math.max(0, this.shake - visualDt * 0.18);
    const sx = Math.sin(this.menuTime * 83) * this.shake,
      sy = Math.cos(this.menuTime * 71) * this.shake;
    this.camera.position.set(sx, sy, 50);
    this.camera.lookAt(sx, sy, 0);
    this.menuShip.visible = this.menu;
    this.shadow.visible = !this.menu && !!world && world.player.hp > 0;
    this.player.visible = !this.menu && !!world && world.player.hp > 0;
    this.boss.visible = !this.menu && !!world?.boss && !world.boss.cars;
    this.serpent.visible = !this.menu && !!world?.boss?.cars;
    if (this.menu) {
      this.menuShip.position.set(
        Math.max(3, this.camera.right * 0.36),
        -0.3,
        3,
      );
      this.menuShip.scale.setScalar(3.5);
      this.animateShip(this.menuShip, 0, 0);
      this.menuShip.rotation.set(
        0.28,
        Math.sin(this.menuTime * 0.3) * 0.16,
        -0.38 + Math.sin(this.menuTime * 0.2) * 0.04,
      );
    }
    if (world && !this.menu) {
      const p = world.player;
      this.player.position.set(
        this.lerp(p.px, p.x, alpha),
        this.lerp(p.py, p.y, alpha),
        6,
      );
      this.animateShip(this.player, p.vx, p.vy);
      this.shadow.position.set(
        this.player.position.x + 0.6,
        this.player.position.y - 0.55,
        0.15,
      );
      this.player.rotation.set(
        (p.vy / 8.2) * 0.14,
        (-p.vx / 8.2) * 0.314,
        -p.vx * 0.014,
      );
      this.player.visible =
        p.hp > 0 && !(p.invul > 0 && Math.floor(this.menuTime * 12) % 2 === 0);
      if (world.boss?.cars) {
        const b = world.boss;
        this.serpent.position.set(0, 0, 2.5);
        for (const [i, c] of b.cars!.entries()) {
          const node = this.serpent.getObjectByName("car" + i)!;
          node.position.set(
            this.lerp(c.px, c.x, alpha),
            this.lerp(c.py, c.y, alpha),
            Math.sin(this.menuTime * 3 + i) * 0.08,
          );
          node.getObjectByName("intact")!.visible = c.hp > 0;
          node.getObjectByName("wreck")!.visible = c.hp <= 0;
          if (i < 3) {
            const next = b.cars![i + 1],
              joint = this.serpent.getObjectByName("joint" + i)!;
            joint.position.set((c.x + next.x) / 2, (c.y + next.y) / 2, 0.5);
            joint.rotation.z = Math.atan2(next.y - c.y, next.x - c.x);
            joint.scale.x = Math.hypot(next.x - c.x, next.y - c.y);
            joint.visible = c.hp > 0 && next.hp > 0;
            joint.getObjectByName("weakpoint")!.scale.x = 1 / joint.scale.x;
          }
        }
        this.serpent.visible = b.deathTime < 3.2;
      } else if (world.boss) {
        const b = world.boss;
        this.boss.position.set(b.x, this.lerp(b.py, b.y, alpha), 2.5);
        this.boss.getObjectByName("leftWreck")!.visible = b.left <= 0;
        this.boss.getObjectByName("rightWreck")!.visible = b.right <= 0;
        if (b.hp < this.lastBossHP && b.hp > 0) {
          this.particles.emit(0, b.y, 10, 0xffffff, 1, 0.07);
        }
        this.lastBossHP = b.hp;
        this.boss.getObjectByName("left")!.visible = b.left > 0;
        this.boss.getObjectByName("right")!.visible = b.right > 0;
        this.boss
          .getObjectByName("core")!
          .scale.setScalar(1 + Math.sin(this.menuTime * 8) * 0.04);
        this.boss.rotation.z = b.dead ? Math.sin(b.deathTime * 15) * 0.02 : 0;
        this.boss.visible = b.deathTime < 3.2;
      }
      this.syncConvoys(world, alpha);
      this.syncEnemies(world, alpha);
      this.syncObjects(world, alpha);
      this.syncLasers(world);
      this.syncEffects(world);
      let shadowCount = 0;
      for (const e of world.enemies) {
        this.dummy.position.set(e.x + 0.4, e.y - 0.4, 0.13);
        this.dummy.scale.set(e.r * 1.4, e.r * 0.8, 1);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.groundShadows.setMatrixAt(shadowCount++, this.dummy.matrix);
      }
      this.groundShadows.count = shadowCount;
      this.groundShadows.instanceMatrix.needsUpdate = true;
      this.trailTime += visualDt;
      if (p.hp > 0 && this.trailTime > 0.035) {
        this.trailTime = 0;
        for (const x of [-0.39, 0.39])
          this.particles.emit(
            p.x + x,
            p.y - 1.2,
            5.9,
            0x76cfd0,
            0.14,
            0.38,
            -p.vx * 0.04,
            -1.8,
          );
      }
      if (world.shots !== this.lastShots) {
        this.particles.emit(p.x, p.y + 1.1, 10, 0xe7ffff, 0.42, 0.055);
        this.lastShots = world.shots;
      }
      if (p.hp < this.lastHP) {
        this.particles.emit(p.x, p.y, 10, 0xb7faff, 1.5, 0.12);
        this.shake = Math.max(this.shake, 0.035);
      }
      this.lastHP = p.hp;
      let count = 0,
        mineCount = 0;
      for (const b of world.pool.items) {
        if (!b.active) continue;
        const x = this.lerp(b.px, b.x, alpha),
          y = this.lerp(b.py, b.y, alpha);
        this.dummy.position.set(x, y, 12.1);
        this.dummy.rotation.set(
          0,
          0,
          b.style === "mine" ? this.menuTime * 2 : 0,
        );
        const size = b.style === "wide" ? 1.8 : b.style === "mine" ? 1.5 : 1;
        this.dummy.scale.set(
          b.friendly ? 0.58 : size,
          b.friendly ? 1.5 : size,
          1,
        );
        if (b.style === "mine") {
          this.dummy.position.z = 12.3;
          const saved = this.dummy.scale.clone();
          this.dummy.scale.setScalar(
            b.arm > 0 ? 1.3 + Math.sin(this.menuTime * 20) * 0.15 : 1,
          );
          this.dummy.updateMatrix();
          this.mineRings.setMatrixAt(mineCount++, this.dummy.matrix);
          this.dummy.scale.copy(saved);
          this.dummy.position.z = 12.1;
        }
        this.dummy.updateMatrix();
        this.bullets.setMatrixAt(count, this.dummy.matrix);
        this.bullets.setColorAt(
          count,
          this.colors.set(
            b.friendly
              ? C.cyan
              : b.style === "mine" && b.arm > 0
                ? 0xffce83
                : 0xff785e,
          ),
        );
        this.dummy.position.z = 12;
        this.dummy.scale.multiplyScalar(1.35);
        this.dummy.updateMatrix();
        this.rims.setMatrixAt(count, this.dummy.matrix);
        this.dummy.position.z = 11.95;
        this.dummy.scale.multiplyScalar(1.4);
        this.dummy.updateMatrix();
        this.outlines.setMatrixAt(count, this.dummy.matrix);
        count++;
      }
      this.mineRings.count = mineCount;
      this.mineRings.visible = true;
      this.mineRings.instanceMatrix.needsUpdate = true;
      for (const m of [this.bullets, this.rims, this.outlines]) {
        m.visible = true;
        m.count = count;
        m.instanceMatrix.needsUpdate = true;
      }
      if (this.bullets.instanceColor)
        this.bullets.instanceColor.needsUpdate = true;
      this.beam.visible = p.beam > 0;
      this.beam.position.set(p.x, (p.y + 15) / 2, 11);
      this.beam.scale.set(0.8, 15 - p.y, 1);
    } else {
      for (const m of [
        this.bullets,
        this.rims,
        this.outlines,
        this.beam,
        this.mineRings,
      ])
        m.visible = false;
      for (const maps of [
        this.convoyMeshes,
        this.enemyMeshes,
        this.rescueMeshes,
        this.pickupMeshes,
        this.laserMeshes,
        this.fxMeshes,
      ])
        for (const m of maps.values()) m.visible = false;
    }
    this.particles.points.visible = this.particles.debris.visible = !this.menu;
    this.particles.update(
      visualDt,
      this.metrics.scale * this.renderer.getPixelRatio(),
    );
    this.renderer.render(this.scene, this.camera);
    this.renderCalls = this.renderer.info.render.calls;
  }
  syncConvoys(w: World, a: number) {
    const ids = new Set(w.convoys.map((c) => c.id));
    for (const [id, m] of this.convoyMeshes)
      if (!ids.has(id)) {
        this.scene.remove(m);
        this.releaseUnique(m);
        this.convoyMeshes.delete(id);
      }
    for (const c of w.convoys) {
      let m = this.convoyMeshes.get(c.id);
      if (!m) {
        m = this.models.convoy();
        this.convoyMeshes.set(c.id, m);
        this.scene.add(m);
      }
      m.visible = true;
      m.position.set(c.x, this.lerp(c.py, c.y, a), 2.2);
      m.getObjectByName("ammo")!.visible = c.hp > 0;
      m.getObjectByName("wreck")!.visible = c.hp <= 0;
    }
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
        ["E05", "E06", "E07"].includes(e.kind) ? 2.1 : 6,
      );
      m.rotation.z = e.kind === "E02" ? Math.cos(e.age * 1.7) * 0.15 : 0;
      if (m.userData.hp !== undefined && e.hp < m.userData.hp)
        this.particles.emit(e.x, e.y, 10, 0xffedbf, 0.7, 0.075);
      m.userData.hp = e.hp;
      const turret = m.getObjectByName("turret");
      if (turret) {
        const angle = Math.atan2(e.aimX - e.x, -(e.aimY - e.y));
        turret.rotation.z = -angle;
      }
      if (e.state === "ATTACK" && m.userData.state !== "ATTACK")
        this.particles.emit(e.x, e.y - 0.8, 10, 0xffba7f, 0.55, 0.08);
      m.userData.state = e.state;
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
        if (w.stageId === "M02") {
          this.box(m, 0, 0, -0.2, 2, 1.8, 0.2, 0x695e4b);
          for (const x of [-0.8, 0.8])
            this.box(m, x, 0, 0, 0.15, 1.7, 0.3, 0xad9672);
        }
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
      m.position.set(r.x, this.lerp(r.py, r.y, a), 3);
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
          m.add(this.ring(0.48, 0xffd695, 0.025));
          const halo = new T.Mesh(
            new T.CircleGeometry(0.7, 24),
            new T.MeshBasicMaterial({
              color: 0xffbb69,
              transparent: true,
              opacity: 0.13,
              depthWrite: false,
            }),
          );
          halo.position.z = -0.1;
          m.add(halo);
        } else {
          this.box(m, 0, 0, 0, 0.75, 0.75, 0.2, 0xf1f0d7);
          this.box(m, 0, 0, 0.2, 0.16, 0.55, 0.05, 0x299c93);
          this.box(m, 0, 0, 0.21, 0.55, 0.16, 0.05, 0x299c93);
        }
        this.pickupMeshes.set(p.id, m);
        this.scene.add(m);
      }
      m.visible = p.life > 3 || Math.floor(p.life * 5) % 2 === 0;
      m.position.set(this.lerp(p.px, p.x, a), this.lerp(p.py, p.y, a), 9.5);
      m.rotation.z = this.menuTime * 0.8;
      m.scale.setScalar(1 + Math.sin(this.menuTime * 4) * 0.07);
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
        m.renderOrder = 96;
        this.laserMeshes.set(l.id, m);
        this.scene.add(m);
      }
      const firing = l.age > l.warn + 0.15;
      const len = Math.hypot(l.tx - l.x, l.ty - l.y);
      m.visible = true;
      m.position.set((l.x + l.tx) / 2, (l.y + l.ty) / 2, 11.4);
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
        m = this.ring(1, parseInt(f.color.slice(1), 16), 0.09);
        this.particles.burst(
          f.x,
          f.y,
          Math.min(f.size, 2),
          parseInt(f.color.slice(1), 16),
        );
        if (f.size > 1.4) this.shake = Math.max(this.shake, 0.025);
        this.fxMeshes.set(f.id, m);
        this.scene.add(m);
      }
      m.visible = true;
      m.position.set(f.x, f.y, 9.8);
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
    this.particles.clear();
    this.lastShots = 0;
    this.lastHP = 100;
    this.lastBossHP = 600;
    this.shake = 0;
    for (const map of [
      this.convoyMeshes,
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
