import { stages, type StageId, type Stage } from "../data/stages";
import {
  createSerpent,
  updateSerpent,
  hitSerpent,
  type BossCar,
} from "./SerpentController";
import { enemies, type EnemyKind } from "../data/enemies";
import { BulletPool } from "./EntityPool";
import {
  SpatialHash,
  overlaps,
  segmentDistance,
  type Circle,
} from "./Collision2D";
import { rescueProgress } from "./RescueSystem";
import type { Commands } from "../input/InputRouter";
import type { Save } from "../persistence/SaveStore";
export interface Enemy extends Circle {
  kind: EnemyKind;
  px: number;
  py: number;
  hp: number;
  age: number;
  originX: number;
  state: string;
  timer: number;
  aimX: number;
  aimY: number;
  active: boolean;
}
export interface Pickup {
  id: number;
  x: number;
  y: number;
  px: number;
  py: number;
  kind: "scrap" | "repair";
  life: number;
  value: number;
  active: boolean;
}
export interface Rescue {
  id: number;
  x: number;
  y: number;
  px: number;
  py: number;
  progress: number;
  active: boolean;
  age: number;
  rescued: boolean;
}
export interface Fx {
  id: number;
  x: number;
  y: number;
  age: number;
  life: number;
  size: number;
  color: string;
}
export interface Laser {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  width: number;
  age: number;
  warn: number;
  duration: number;
  source: string;
  owner: number;
  active: boolean;
  lock: number;
}
export interface Convoy extends Circle {
  px: number;
  py: number;
  hp: number;
  active: boolean;
  age: number;
}
export interface Boss {
  x: number;
  y: number;
  py: number;
  hp: number;
  left: number;
  right: number;
  phase: number;
  invul: number;
  age: number;
  cycle: number;
  dead: boolean;
  deathTime: number;
  cars?: BossCar[];
  attackIndex?: number;
}
export interface Target extends Circle {
  type: "enemy" | "core" | "left" | "right" | "car" | "convoy";
  carIndex?: number;
  convoy?: Convoy;
  enemy?: Enemy;
}
export class World {
  mission: Stage;
  convoyIndex = 0;
  convoys: Convoy[] = [];
  ammoDestroyed = 0;
  ammoEscaped = 0;
  positionHistory: { time: number; x: number; y: number }[] = [];
  time = 0;
  scroll = 0;
  state: "playing" | "dying" | "victory" | "defeat" = "playing";
  deathTime = 0;
  id = 1;
  seed = 1627;
  waveIndex = 0;
  rescueIndex = 0;
  repairSpawned = false;
  player = {
    id: 0,
    x: 0,
    y: -9,
    px: 0,
    py: -9,
    vx: 0,
    vy: 0,
    r: 0.33,
    hp: 100,
    maxHp: 100,
    invul: 0,
    fire: 0,
    bombs: 2,
    specials: 2,
    beam: 0,
  };
  speed: number;
  damage: number;
  magnet: number;
  pool = new BulletPool();
  enemies: Enemy[] = [];
  pickups: Pickup[] = [];
  rescues: Rescue[] = [];
  lasers: Laser[] = [];
  fx: Fx[] = [];
  boss: Boss | null = null;
  targets = new SpatialHash<Target>();
  hostiles = new SpatialHash<import("./EntityPool").Bullet>();
  events: string[] = [];
  score = 0;
  combo = 1;
  comboTimer = 0;
  maxCombo = 1;
  scrap = 0;
  rescued = 0;
  kills = 0;
  spawned = 0;
  shots = 0;
  hits = 0;
  damageTaken = 0;
  parts = 0;
  lastDamage = "";
  message = "";
  messageTime = 0;
  damageLog: { time: number; source: string; entityId: number }[] = [];
  constructor(
    save: Save,
    public debug = false,
    public stageId: StageId = "M01",
  ) {
    this.mission = stages[stageId];
    this.speed = 8.2 * (1 + 0.03 * save.upgrades.motor);
    this.damage = 10 * (1 + 0.1 * save.upgrades.canhao);
    this.magnet = 1.575 + 0.35 * save.upgrades.ima;
    this.say(
      stageId === "M01"
        ? "Lina: Arkan ainda tem gente no solo. Não vamos abandonar ninguém."
        : "Suri: a ferrovia corta o cânion. Precisamos dos técnicos e dos dados desse comboio.",
      8,
    );
  }
  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  say(text: string, seconds = 2) {
    this.message = text;
    this.messageTime = seconds;
  }
  effect(x: number, y: number, size = 1, color = "#ffc075") {
    this.fx.push({ id: this.id++, x, y, age: 0, life: 0.55, size, color });
    if (this.fx.length > 90) this.fx.shift();
  }
  productive(points: number) {
    this.score += Math.round(points * this.combo);
    this.combo = Math.min(5, this.combo + 0.2);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = 4;
  }
  spawnEnemy(kind: EnemyKind, x: number, y = 16) {
    const d = enemies[kind];
    this.enemies.push({
      id: this.id++,
      kind,
      x,
      y,
      px: x,
      py: y,
      r: d.r,
      hp: d.hp,
      age: 0,
      originX: x,
      state: "SPAWN",
      timer: 0.6,
      aimX: 0,
      aimY: -12,
      active: true,
    });
    this.spawned++;
  }
  spawnPickup(kind: "scrap" | "repair", x: number, y: number, value = 10) {
    this.pickups.push({
      id: this.id++,
      x,
      y,
      px: x,
      py: y,
      kind,
      life: 14,
      value,
      active: true,
    });
  }
  startBoss() {
    this.enemies = [];
    this.convoys = [];
    this.pool.clear(true);
    if (this.stageId === "M02") {
      this.lasers = [];
      this.boss = createSerpent();
      this.say(
        "NÓX • SERPENTE DE FERRO — juntas e reator são pontos fracos.",
        5,
      );
      this.events.push("laser");
      return;
    }
    this.lasers = [];
    this.boss = {
      x: 0,
      y: 18,
      py: 18,
      hp: 600,
      left: 200,
      right: 200,
      phase: 1,
      invul: 1.5,
      age: 0,
      cycle: 1,
      dead: false,
      deathTime: 0,
    };
    this.say("NÓX • GÁRGULA-01 — desarme os canhões laterais.", 5);
    this.events.push("laser");
  }
  jumpBoss() {
    this.time = this.mission.bossEntryAtSeconds;
    this.convoyIndex = this.mission.convoys?.length || 0;
    this.waveIndex = this.mission.waves.length;
    this.rescueIndex = 3;
    this.repairSpawned = true;
    this.startBoss();
  }
  tick(dt: number, c: Commands) {
    if (this.state === "victory" || this.state === "defeat") return;
    if (this.state === "dying") {
      this.deathTime += dt;
      this.animate(dt * 0.18);
      if (this.deathTime >= 0.55) this.state = "defeat";
      return;
    }
    if (this.boss?.dead) {
      this.boss.deathTime += dt;
      this.animate(dt);
      if (
        Math.floor(this.boss.deathTime * 7) >
        Math.floor((this.boss.deathTime - dt) * 7)
      )
        this.effect(
          (this.random() - 0.5) * 6,
          8 + (this.random() - 0.5) * 3,
          1.7,
        );
      if (this.boss.deathTime >= 3.5) this.state = "victory";
      return;
    }
    this.time += dt;
    this.scroll += this.mission.scrollSpeed * dt;
    this.animate(dt);
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = Math.max(1, this.combo - dt * 0.5);
    this.positionHistory.push({
      time: this.time,
      x: this.player.x,
      y: this.player.y,
    });
    while (this.positionHistory.length > 120) this.positionHistory.shift();
    this.director();
    this.movePlayer(dt, c);
    this.updateConvoys(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updateLasers(dt);
    this.updatePickups(dt);
    this.updateRescues(dt);
  }
  animate(dt: number) {
    for (const f of this.fx) f.age += dt;
    this.fx = this.fx.filter((f) => f.age < f.life);
  }
  director() {
    while (
      this.waveIndex < this.mission.waves.length &&
      this.time >= this.mission.waves[this.waveIndex].atSeconds
    ) {
      const w = this.mission.waves[this.waveIndex++];
      for (let i = 0; i < w.count; i++) {
        const x =
          w.count === 1
            ? -4
            : (i - (w.count - 1) / 2) *
              (["E05", "E06", "E07", "E08"].includes(w.enemy) ? 8 : 2.3);
        this.spawnEnemy(
          w.enemy as EnemyKind,
          x,
          16 + Math.abs(i - (w.count - 1) / 2) * 1.2,
        );
      }
    }
    while (
      this.rescueIndex < this.mission.rescues.length &&
      this.time >= this.mission.rescues[this.rescueIndex].atSeconds
    ) {
      const r = this.mission.rescues[this.rescueIndex++];
      this.rescues.push({
        id: this.id++,
        x: r.laneX,
        y: 10,
        px: r.laneX,
        py: 10,
        progress: 0,
        active: true,
        age: 0,
        rescued: false,
      });
      this.say("SIGNAL CIVIL • aproxime-se e mantenha 1,5 s no círculo.", 5);
    }
    if (!this.repairSpawned && this.time >= this.mission.repairAtSeconds) {
      this.repairSpawned = true;
      this.spawnPickup("repair", 2, 11, 25);
      this.say("Kit de reparo à direita • +25 de integridade.", 4);
    }
    while (
      this.convoyIndex < (this.mission.convoys?.length || 0) &&
      this.time >= this.mission.convoys![this.convoyIndex].atSeconds
    ) {
      const c = this.mission.convoys![this.convoyIndex++];
      this.convoys.push({
        id: this.id++,
        x: c.laneX,
        y: 17,
        px: c.laneX,
        py: 17,
        r: 0.9,
        hp: 80,
        active: true,
        age: 0,
      });
      this.say("Suri: vagão de munição marcado. Destrua-o antes que fuja!", 5);
    }
    if (this.stageId === "M02") {
      if (this.time > 195 && this.time < 195.04)
        this.say(
          "Suri: os Semeadores minam os trilhos. O centro do cânion continua livre.",
          6,
        );
      if (this.time > 306 && this.time < 306.04)
        this.say(
          "Suri: último depósito à frente. Depois vem a Serpente de Ferro.",
          5,
        );
    }
    if (!this.boss && this.time >= this.mission.bossEntryAtSeconds)
      this.startBoss();
    if (this.time > 6 && this.time < 6.04)
      this.say("WASD / SETAS • mova-se. O disparo é automático.", 6);
    if (this.time > 19 && this.time < 19.04)
      this.say(
        "SHIFT • Raio Lança    E • Bomba de Pulso. Duas cargas de cada.",
        7,
      );
    if (this.time > 35 && this.time < 35.04)
      this.say("Contato hostil à frente. O ponto ciano é sua hitbox.", 5);
  }
  movePlayer(dt: number, c: Commands) {
    const p = this.player;
    p.px = p.x;
    p.py = p.y;
    p.invul = Math.max(0, p.invul - dt);
    p.beam = Math.max(0, p.beam - dt);
    const approach = (v: number, target: number, a: number) =>
      v + Math.max(-a, Math.min(a, target - v));
    p.vx = approach(p.vx, c.x * this.speed, (c.x ? 35 : 40) * dt);
    p.vy = approach(p.vy, c.y * this.speed, (c.y ? 35 : 40) * dt);
    p.x = Math.max(-7.2 + p.r, Math.min(7.2 - p.r, p.x + p.vx * dt));
    p.y = Math.max(-12 + p.r, Math.min(7 - p.r, p.y + p.vy * dt));
    p.fire -= dt;
    if (p.fire <= 0) {
      p.fire += 1 / 6;
      this.pool.spawn(p.x, p.y + 1, 0, 25, true, this.damage, "Canhão Aurora");
      this.shots++;
      this.events.push("shot");
    }
    if (c.special && p.specials > 0 && p.beam <= 0) {
      p.specials--;
      p.beam = 1.2;
      this.events.push("laser");
      this.say("RAIO LANÇA • perfuração ativa");
    }
    if (c.bomb && p.bombs > 0) {
      p.bombs--;
      this.pool.clear(true);
      for (const e of this.enemies)
        if (e.active && Math.hypot(e.x - p.x, e.y - p.y) < 14)
          this.hitEnemy(e, 100);
      if (this.boss && Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < 24) {
        if (this.boss.cars) {
          for (let i = 0; i < 4; i++) this.hitCar(i, 80);
        } else {
          this.hitBoss("left", 80);
          this.hitBoss("right", 80);
          this.hitBoss("core", 80);
        }
      }
      this.effect(p.x, p.y, 8, "#7cf3ff");
      this.events.push("bomb");
      this.say("BOMBA DE PULSO • projéteis eliminados");
    }
  }
  updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (!e.active) continue;
      const d = enemies[e.kind];
      e.px = e.x;
      e.py = e.y;
      e.age += dt;
      e.y -= d.speed * dt;
      if (e.kind === "E02") e.x = e.originX + Math.sin(e.age * 1.7) * 1.3;
      if (e.kind === "E03") e.x = e.originX + Math.sin(e.age * 0.9) * 1.1;
      e.timer -= dt;
      if (e.y > 12) {
        e.state = "FORMATION";
        continue;
      }
      if (e.state === "SPAWN" || e.state === "FORMATION") {
        e.state = "ACQUIRE_TARGET";
        e.timer = 0.15;
      }
      if (e.timer <= 0) {
        switch (e.state) {
          case "ACQUIRE_TARGET":
          case "RECOVER":
            e.state = "TELEGRAPH";
            e.timer = d.warning;
            e.aimX = this.player.x;
            e.aimY = this.player.y;
            if (e.kind === "E03") {
              const old = this.pastPosition(0.65);
              e.aimX = old.x;
              e.aimY = old.y;
              this.addLaser(
                e.x,
                e.y,
                e.aimX,
                e.aimY,
                0.02,
                0.6,
                0,
                "Raptor • mira passada",
                e.id,
              );
            }
            if (e.kind === "E06") {
              this.addLaser(
                e.x,
                e.y,
                e.aimX,
                e.aimY,
                0.48,
                1.2,
                0.8,
                d.name,
                e.id,
              );
              this.events.push("laser");
            }
            break;
          case "TELEGRAPH":
            e.state = "ATTACK";
            e.timer = e.kind === "E06" ? 0.8 : 0.12;
            if (e.kind !== "E06") this.enemyFire(e);
            break;
          case "ATTACK":
            e.state = "RECOVER";
            e.timer = d.recover;
            break;
        }
      }
      if (e.y < -17) {
        e.active = false;
        e.state = "RETREAT";
      } else if (overlaps(e, this.player))
        this.hurt(20, d.name + " (contato)", e.id);
    }
    this.enemies = this.enemies.filter((e) => e.active);
  }
  enemyFire(e: Enemy) {
    const d = enemies[e.kind];
    if (e.kind === "E01") {
      this.pool.spawn(e.x, e.y - 0.7, 0, -8, false, d.damage, d.name);
    } else if (e.kind === "E02") {
      for (const dx of [-0.55, 0.55])
        this.pool.spawn(
          e.x + dx,
          e.y - 0.4,
          dx * 0.6,
          -7,
          false,
          d.damage,
          d.name,
        );
    } else if (e.kind === "E03") {
      const dx = e.aimX - e.x,
        dy = e.aimY - e.y,
        len = Math.hypot(dx, dy) || 1;
      this.pool.spawn(
        e.x,
        e.y - 0.7,
        (dx / len) * 10,
        (dy / len) * 10,
        false,
        d.damage,
        d.name,
      );
    } else if (e.kind === "E07") {
      for (const lane of [-6, -3, 3, 6]) {
        const dx = lane - e.x,
          dy = -18 - e.y,
          len = Math.hypot(dx, dy) || 1;
        const b = this.pool.spawn(
          e.x,
          e.y - 0.6,
          (dx / len) * 6.5,
          (dy / len) * 6.5,
          false,
          d.damage,
          d.name,
        );
        b.style = "wide";
        b.r = 0.34;
      }
    } else if (e.kind === "E08") {
      this.spawnMine(e.x < 0 ? -4 : 4, e.y - 0.6, e.id, d.name);
    } else {
      const dx = e.aimX - e.x,
        dy = e.aimY - e.y,
        len = Math.hypot(dx, dy) || 1;
      for (const side of [-0.45, 0.45])
        this.pool.spawn(
          e.x + side,
          e.y,
          (dx / len) * 8,
          (dy / len) * 8,
          false,
          d.damage,
          d.name,
        );
    }
  }
  addLaser(
    x: number,
    y: number,
    tx: number,
    ty: number,
    width: number,
    warn: number,
    duration: number,
    source: string,
    owner: number,
  ) {
    const dx = tx - x,
      dy = ty - y,
      len = Math.hypot(dx, dy) || 1;
    this.lasers.push({
      id: this.id++,
      x,
      y,
      tx: x + (dx / len) * 40,
      ty: y + (dy / len) * 40,
      width,
      age: 0,
      warn,
      duration,
      source,
      owner,
      active: true,
      lock: 0,
    });
  }
  updateBoss(dt: number) {
    const b = this.boss;
    if (!b || b.dead) return;
    if (b.cars) {
      updateSerpent(this, dt);
      return;
    }
    b.py = b.y;
    b.age += dt;
    b.y = Math.max(6.5, b.y - 2.8 * dt);
    b.invul = Math.max(0, b.invul - dt);
    if (b.y > 6.5) return;
    if (b.invul > 0) return;
    b.cycle -= dt;
    if (b.phase === 1 && b.cycle <= 0.45 && b.cycle + dt > 0.45)
      this.addLaser(b.x, b.y - 1, b.x, -15, 0.02, 0.45, 0, "Aviso Gárgula", -1);
    if (b.cycle <= 0) {
      if (b.phase === 1) {
        for (const angle of [-0.3, 0, 0.3])
          this.pool.spawn(
            b.x,
            b.y - 1,
            Math.sin(angle) * 7,
            -Math.cos(angle) * 7,
            false,
            20,
            "Gárgula • leque",
          );
        b.cycle = 2.2;
      } else if (b.phase === 2) {
        for (const [x, hp, owner] of [
          [-2.6, b.left, -2],
          [2.6, b.right, -3],
        ])
          if (hp > 0)
            this.addLaser(
              x,
              b.y - 1,
              x,
              -15,
              0.65,
              0.9,
              0.75,
              "Gárgula • rail AA",
              owner,
            );
        for (const a of [-0.28, 0.28])
          this.pool.spawn(
            0,
            b.y - 1,
            Math.sin(a) * 7,
            -Math.cos(a) * 7,
            false,
            22,
            "Gárgula • leque",
          );
        b.cycle = b.left && b.right ? 3.2 : 4.2;
        this.events.push("laser");
      } else {
        this.addLaser(
          0,
          b.y - 1,
          0,
          -15,
          1.15,
          1.2,
          1,
          "Gárgula • laser central",
          -1,
        );
        for (const [x, hp] of [
          [-2.6, b.left],
          [2.6, b.right],
        ])
          if (hp > 0)
            for (const a of [-0.2, 0.2])
              this.pool.spawn(
                x,
                b.y - 1,
                Math.sin(a) * 7,
                -Math.cos(a) * 7,
                false,
                22,
                "Gárgula • canhão lateral",
              );
        b.cycle = 4.2;
        this.events.push("laser");
      }
    }
    if (overlaps({ id: -1, x: b.x, y: b.y, r: 1.45 }, this.player))
      this.hurt(35, "Gárgula (casco)", -1);
  }
  updateLasers(dt: number) {
    for (const l of this.lasers) {
      l.age += dt;
      if (
        l.owner > 0 &&
        !this.enemies.some((e) => e.id === l.owner && e.active)
      )
        l.active = false;
      if (l.owner === -2 && (this.boss?.left || 0) <= 0) l.active = false;
      if (l.owner === -3 && (this.boss?.right || 0) <= 0) l.active = false;
      if (
        l.duration > 0 &&
        l.age >= l.warn + 0.15 &&
        l.age <= l.warn + 0.15 + l.duration &&
        l.active &&
        segmentDistance(this.player.x, this.player.y, l.x, l.y, l.tx, l.ty) <
          this.player.r + l.width / 2
      )
        this.hurt(l.owner > 0 ? 32 : 38, l.source, l.owner);
      if (l.age > l.warn + 0.15 + l.duration) l.active = false;
    }
    this.lasers = this.lasers.filter((l) => l.active);
  }
  buildTargets() {
    this.targets.clear();
    for (const e of this.enemies)
      if (e.active)
        this.targets.insert({
          id: e.id,
          x: e.x,
          y: e.y,
          r: e.r,
          type: "enemy",
          enemy: e,
        });
    for (const c of this.convoys)
      if (c.active && c.hp > 0)
        this.targets.insert({ ...c, type: "convoy", convoy: c });
    const b = this.boss;
    if (b?.cars && !b.dead) {
      b.cars.forEach((c, i) => {
        if (c.hp > 0)
          this.targets.insert({
            id: c.id,
            x: c.x,
            y: c.y,
            r: c.r,
            type: "car",
            carIndex: i,
          });
      });
      for (let i = 1; i < b.cars.length; i++) {
        const a = b.cars[i - 1],
          c = b.cars[i];
        if (a.hp > 0 && c.hp > 0)
          this.targets.insert({
            id: -120 - i,
            x: (a.x + c.x) / 2,
            y: (a.y + c.y) / 2,
            r: 0.35,
            type: "car",
            carIndex: i,
          });
      }
      return;
    }
    if (b && !b.dead) {
      if (b.left > 0)
        this.targets.insert({
          id: -2,
          x: -2.6,
          y: b.y - 0.4,
          r: 1,
          type: "left",
        });
      if (b.right > 0)
        this.targets.insert({
          id: -3,
          x: 2.6,
          y: b.y - 0.4,
          r: 1,
          type: "right",
        });
      this.targets.insert({ id: -1, x: 0, y: b.y, r: 1.4, type: "core" });
    }
  }
  updateProjectiles(dt: number) {
    this.buildTargets();
    this.hostiles.clear();
    for (const b of this.pool.items) {
      if (!b.active) continue;
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      b.arm = Math.max(0, b.arm - dt);
      if (b.life <= 0 || b.y > 19 || b.y < -18 || Math.abs(b.x) > 13) {
        b.active = false;
        continue;
      }
      if (b.friendly) {
        for (const t of this.targets.query(b)) {
          if (overlaps(b, t)) {
            b.active = false;
            this.hits++;
            if (t.convoy) this.hitConvoy(t.convoy, b.damage);
            else if (t.type === "car") this.hitCar(t.carIndex!, b.damage);
            else if (t.enemy) this.hitEnemy(t.enemy, b.damage);
            else this.hitBoss(t.type as "left" | "right" | "core", b.damage);
            break;
          }
        }
      } else if (b.arm <= 0) this.hostiles.insert(b);
    }
    for (const b of this.hostiles.query(this.player))
      if (b.active && overlaps(b, this.player)) {
        b.active = false;
        this.hurt(b.damage, b.source, b.id);
      }
    if (this.player.beam > 0) {
      for (const e of this.enemies)
        if (
          e.active &&
          e.y > this.player.y &&
          Math.abs(e.x - this.player.x) < e.r + 0.45
        )
          this.hitEnemy(e, 150 * dt);
      const boss = this.boss;
      for (const c of this.convoys)
        if (
          c.hp > 0 &&
          c.y > this.player.y &&
          Math.abs(c.x - this.player.x) < c.r + 0.45
        )
          this.hitConvoy(c, 150 * dt);
      if (boss?.cars && !boss.dead) {
        boss.cars.forEach((c, i) => {
          if (
            c.hp > 0 &&
            c.y > this.player.y &&
            Math.abs(c.x - this.player.x) < c.r + 0.45
          )
            this.hitCar(i, 150 * dt);
        });
      } else if (boss && !boss.dead) {
        for (const [kind, x] of [
          ["left", -2.6],
          ["right", 2.6],
          ["core", 0],
        ] as const)
          if (Math.abs(x - this.player.x) < (kind === "core" ? 1.4 : 1) + 0.45)
            this.hitBoss(kind, 150 * dt);
      }
    }
  }
  hitEnemy(e: Enemy, damage: number) {
    if (!e.active) return;
    e.hp -= damage;
    if (e.hp <= 0) {
      e.active = false;
      e.state = "DEATH";
      this.kills++;
      this.productive(enemies[e.kind].score);
      this.effect(e.x, e.y, e.kind === "E05" ? 1.5 : 1);
      this.events.push("explosion");
      this.spawnPickup(
        "scrap",
        e.x,
        e.y,
        e.kind === "E05" || e.kind === "E06" ? 20 : 10,
      );
    }
  }
  hitBoss(part: "left" | "right" | "core", damage: number) {
    const b = this.boss;
    if (b?.cars) {
      if (part === "core") this.hitCar(0, damage);
      return;
    }
    if (!b || b.dead || b.invul > 0 || b[part === "core" ? "hp" : part] <= 0)
      return;
    const key = part === "core" ? "hp" : part;
    b[key] = Math.max(0, b[key] - damage);
    if (part !== "core" && b[key] <= 0) {
      this.parts++;
      this.productive(600);
      this.effect(part === "left" ? -2.6 : 2.6, b.y, 2);
      this.events.push("explosion");
      this.say("CANHÃO DESTRUÍDO • padrão lateral desativado");
    }
    if (b.hp <= 0) {
      this.defeatBoss();
      this.say("CORREDOR LIBERADO • Arkan está livre!", 5);
      return;
    }
    const phase = b.hp <= 180 ? 3 : b.hp <= 390 ? 2 : 1;
    if (phase !== b.phase) {
      b.phase = phase;
      b.invul = 0.9;
      b.cycle = 1.5;
      this.pool.clear(true);
      this.lasers = [];
      this.say(
        `GÁRGULA-01 • FASE ${phase} — blindagem em transição (0,9 s)`,
        2,
      );
      this.events.push("laser");
    }
  }
  defeatBoss() {
    const b = this.boss;
    if (!b || b.dead) return;
    b.dead = true;
    this.player.invul = 999;
    this.pool.clear();
    this.lasers = [];
    this.enemies = [];
    this.convoys = [];
    this.productive(10000);
    this.splashCollect();
    this.events.push("win");
  }
  hitCar(index: number, damage: number) {
    if (this.boss?.cars) hitSerpent(this, index, damage);
  }
  pastPosition(seconds: number) {
    return (
      this.positionHistory.find((p) => p.time >= this.time - seconds) || {
        x: this.player.x,
        y: this.player.y,
      }
    );
  }
  spawnMine(x: number, y: number, owner: number, source: string) {
    const b = this.pool.spawn(x, y, 0, -0.85, false, 20, source + " • mina");
    b.style = "mine";
    b.r = 0.3;
    b.arm = 0.6;
    b.life = 18;
    b.owner = owner;
    return b;
  }
  updateConvoys(dt: number) {
    for (const c of this.convoys) {
      c.px = c.x;
      c.py = c.y;
      c.y -= 1.3 * dt;
      c.age += dt;
      if (c.y < -18) {
        c.active = false;
        if (c.hp > 0) this.ammoEscaped++;
      }
    }
    this.convoys = this.convoys.filter((c) => c.active);
  }
  hitConvoy(c: Convoy, damage: number) {
    if (!c.active || c.hp <= 0) return;
    c.hp = Math.max(0, c.hp - damage);
    if (c.hp === 0) {
      this.ammoDestroyed++;
      this.productive(750);
      this.scrap += 40;
      this.effect(c.x, c.y, 2);
      this.events.push("explosion");
      this.say("VAGÃO DE MUNIÇÃO DESTRUÍDO • +40 sucatas");
    }
  }
  splashCollect() {
    for (const p of this.pickups)
      if (p.active && p.kind === "scrap") {
        this.scrap += p.value;
        p.active = false;
      }
  }
  hurt(damage: number, source: string, id: number) {
    const p = this.player;
    if (p.invul > 0 || this.state !== "playing" || this.boss?.dead) return;
    p.hp = Math.max(0, p.hp - damage);
    p.invul = 0.85;
    this.damageTaken += damage;
    this.combo = 1;
    this.lastDamage = source;
    this.damageLog.push({ time: this.time, source, entityId: id });
    this.events.push("hit");
    this.effect(p.x, p.y, 0.7, "#7cf3ff");
    if (p.hp <= 0) {
      this.state = "dying";
      this.effect(p.x, p.y, 2.5);
      this.events.push("explosion");
    }
  }
  updatePickups(dt: number) {
    for (const p of this.pickups) {
      if (!p.active) continue;
      p.px = p.x;
      p.py = p.y;
      p.life -= dt;
      p.y -= 0.7 * dt;
      const dx = this.player.x - p.x,
        dy = this.player.y - p.y,
        d = Math.hypot(dx, dy);
      if (d < this.magnet + (p.kind === "repair" ? 0.25 : 0)) {
        const speed = Math.min(11, 2 + d * 5);
        p.x += (dx / (d || 1)) * Math.min(speed * dt, d);
        p.y += (dy / (d || 1)) * Math.min(speed * dt, d);
      }
      if (d < 0.5) {
        p.active = false;
        if (p.kind === "scrap") this.scrap += p.value;
        else this.player.hp = Math.min(100, this.player.hp + 25);
        this.events.push("pickup");
      }
      if (p.life <= 0 || p.y < -16) p.active = false;
    }
    this.pickups = this.pickups.filter((p) => p.active);
  }
  updateRescues(dt: number) {
    for (const r of this.rescues) {
      if (!r.active) continue;
      r.px = r.x;
      r.py = r.y;
      r.age += dt;
      r.y -= 0.72 * dt;
      r.progress = rescueProgress(
        r.progress,
        Math.hypot(this.player.x - r.x, this.player.y - r.y) <= 1.5,
        dt,
      );
      if (r.progress >= 1) {
        r.active = false;
        r.rescued = true;
        this.rescued++;
        this.productive(500);
        this.scrap += 30;
        this.effect(r.x, r.y, 1.8, "#7cf3ff");
        this.events.push("rescue");
        this.say("RESGATE CONCLUÍDO • +30 sucatas");
      }
      if (r.y < -14 || r.age > 34) {
        r.active = false;
        this.say("Sinal perdido. A missão continua.");
      }
    }
  }
  get elimination() {
    return this.spawned ? this.kills / this.spawned : 0;
  }
  get accuracy() {
    return this.shots ? Math.min(1, this.hits / this.shots) : 0;
  }
  get segment() {
    if (this.stageId === "M02")
      return this.boss
        ? "CONFRONTO • SERPENTE DE FERRO"
        : this.time < 105
          ? "CÂNION • INTERCEPTADORES"
          : this.time < 200
            ? "FERROVIA • BATERIAS ARPÃO"
            : "DEPÓSITOS • MINAS E RESGATES";
    return this.boss
      ? "CONFRONTO • GÁRGULA-01"
      : this.time < 40
        ? "APROXIMAÇÃO • ARKAN"
        : this.time < 120
          ? "CONTATO • ESQUADRÃO NÓX"
          : this.time < 210
            ? "OPERAÇÃO • RESGATE DE SINAL"
            : "DEFESA • TORRES ANTIAÉREAS";
  }
}
