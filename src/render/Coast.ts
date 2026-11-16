import * as T from "three";
import { tileOffset } from "../core/Scrolling";
/** M04 Costa das Cinzas: animated grey sea with foam, docks, cranes, cliffs, a harbour, a lighthouse and stranded ships. */
export const SHORE_X = 6.9;
export class Coast extends T.Group {
  tiles: T.Group[] = [];
  dummy = new T.Object3D();
  clouds: T.InstancedMesh;
  time = { value: 0 };
  scroll = { value: 0 };
  beams: T.Mesh[] = [];
  constructor(mat: (c: number) => T.MeshStandardMaterial) {
    super();
    const base = new T.Mesh(new T.PlaneGeometry(160, 200), mat(0x3a3936));
    base.position.z = -1.3;
    this.add(base);
    const seaMat = new T.ShaderMaterial({
      uniforms: {
        uTime: this.time,
        uScroll: this.scroll,
        uShore: { value: SHORE_X },
      },
      vertexShader:
        "varying vec2 p;void main(){p=(modelMatrix*vec4(position,1.)).xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `uniform float uTime;uniform float uScroll;uniform float uShore;varying vec2 p;
void main(){vec2 q=vec2(p.x,p.y+uScroll);
float w=sin(q.y*2.1+sin(q.x*1.3+uTime*.7)*1.2+uTime*1.6)*.5+.5;
float c2=pow(.5+.5*sin(q.x*1.9+sin(q.y*.7+uTime*.4)*2.)*sin(q.y*1.6-uTime*.5+sin(q.x*.8)),2.);
float glint=pow(max(0.,sin(q.x*6.+q.y*1.7+uTime*2.3)*sin(q.y*4.3-uTime*1.1)),24.);
float shoreD=uShore+sin(q.y*.9)*.25+sin(q.y*2.7+uTime)*.08-p.x;
float mole=abs(p.x+uShore+.35)-.55-sin(q.y*1.7)*.12;
float moleFoam=smoothstep(.6,0.,mole)*(.5+.5*sin(q.y*5.+uTime*2.6))*step(.0,sin(q.y*.55+1.3)+.35);
float open=smoothstep(-uShore,-uShore-6.,p.x);
float caps=pow(max(0.,sin(q.x*1.7+sin(q.y*.8+uTime)*1.5)*sin(q.y*1.3-uTime*.9+q.x*.4)),10.)*open*1.6;
float foam=smoothstep(.55,0.,shoreD)*(.55+.45*sin(q.y*6.+uTime*3.));
float band=smoothstep(.12,.0,abs(shoreD-.9-sin(uTime*1.3+q.y*.4)*.25))*.5;
vec3 deep=vec3(.12,.20,.23),mid=vec3(.20,.31,.33);
vec3 col=mix(deep,mid,w*.55+c2*.6);
col=mix(col,vec3(.36,.37,.36),smoothstep(3.,uShore,p.x)*.35);
col=mix(col,vec3(.07,.13,.17),open*.55);
col+=glint*.12+vec3(.85,.9,.88)*(foam*.55+band*.35+moleFoam*.5+caps*.35);
gl_FragColor=vec4(col,1.);}`,
    });
    for (let tile = 0; tile < 2; tile++) {
      const g = new T.Group();
      this.tiles.push(g);
      this.add(g);
      const sea = new T.Mesh(new T.PlaneGeometry(SHORE_X + 60.3, 56.2), seaMat);
      sea.position.set((SHORE_X + 0.3 - 60) / 2, 0, -0.9);
      g.add(sea);
      let seed = 911 + tile * 577;
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
      // West: a broken breakwater (mole) separates the channel from the open, ash-grey sea.
      for (let y = -27.5; y < 28; y += 0.9) {
        if (Math.sin(y * 0.55 + 1.3) < -0.35) continue;
        add(
          "rock",
          rand() < 0.5 ? 0x4c4d49 : 0x5f5f59,
          -(SHORE_X + 0.35) + (rand() - 0.5) * 0.4,
          y,
          -0.55,
          0.7 + rand() * 0.4,
          0.55,
          0.6 + rand() * 0.5,
          rand() * 6,
        );
        if (rand() < 0.3)
          add(
            "box",
            0x8a8f86,
            -(SHORE_X + 0.35),
            y,
            0.05,
            0.6,
            0.6,
            0.35,
            rand(),
          );
      }
      // Sea stacks rising from the open water.
      for (let i = 0; i < 14; i++) {
        const y = rand() * 56 - 28,
          x = -(SHORE_X + 13 + rand() * 20),
          r = 1.2 + rand() * 2,
          hgt = 2.5 + rand() * 4;
        add(
          "rock",
          i % 2 ? 0x46443f : 0x55524b,
          x,
          y,
          hgt / 2 - 1,
          r * 1.3,
          r,
          hgt,
          rand() * 6,
        );
        add(
          "rock",
          0x6e6a60,
          x + 0.3,
          y + 0.2,
          hgt - 0.7,
          r * 0.8,
          r * 0.6,
          0.5,
          rand() * 6,
        );
        add("cyl", 0xd3dcd6, x, y, -0.86, r * 1.45, r * 1.15, 0.03);
      }
      // Stranded ships run aground in the shallows, tilted, with foam collars.
      for (const sy of [-12, 13]) {
        const y = sy + tile * 5,
          x = -(SHORE_X + 4.4 + rand() * 2),
          tilt = 0.45 + rand() * 0.4;
        add("cyl", 0xd3dcd6, x, y, -0.86, 1.6, 3.2, 0.03, tilt);
        add("ship", 0x3e2f2a, x, y, -0.35, 1.6, 5.2, 1.0, tilt);
        add("box", 0x6b2f27, x, y, 0.05, 1.35, 4.6, 0.08, tilt);
        add(
          "box",
          0x8e938c,
          x - Math.sin(tilt) * 1.0,
          y + Math.cos(tilt) * 1.0,
          0.55,
          0.9,
          1.2,
          0.7,
          tilt,
        );
        add(
          "cyl",
          0x2b2b29,
          x + Math.sin(tilt) * 0.7,
          y - Math.cos(tilt) * 0.7,
          0.55,
          0.22,
          0.22,
          0.8,
        );
        add("box", 0x1f2424, x + 0.5, y - 1.8, -0.3, 0.05, 0.05, 1.8, tilt);
      }
      for (const side of [1]) {
        // Quay wall, concrete apron, rails and bollards.
        add("box", 0x2c2e2d, side * (SHORE_X + 0.25), 0, -0.55, 0.5, 56, 0.9);
        add("box", 0x6c6c66, side * (SHORE_X + 1.6), 0, -0.5, 2.2, 56, 0.4);
        add("box", 0x51524e, side * (SHORE_X + 3.4), 0, -0.6, 1.6, 56, 0.3);
        for (const dx of [1.2, 2.0])
          add("box", 0x9a9a8d, side * (SHORE_X + dx), 0, -0.28, 0.06, 56, 0.05);
        for (let y = -27.5; y < 28; y += 1.6) {
          add(
            "cyl",
            0x26292a,
            side * (SHORE_X + 0.42),
            y,
            -0.05,
            0.12,
            0.12,
            0.25,
          );
          add(
            "box",
            0x494a46,
            side * (SHORE_X + 1.6),
            y,
            -0.29,
            2.1,
            0.04,
            0.02,
          );
        }
        // Piers jutting into the water at intervals (outside the torpedo lanes' core).
        for (const py of [-18, 6]) {
          const y = py + side * 4 + tile * 3;
          add(
            "box",
            0x5b4a3a,
            side * (SHORE_X - 0.9),
            y,
            -0.42,
            1.8,
            1.1,
            0.12,
          );
          for (const k of [-0.45, 0.45]) {
            add(
              "cyl",
              0x3a2f27,
              side * (SHORE_X - 1.6),
              y + k,
              -0.75,
              0.1,
              0.1,
              0.7,
            );
            add(
              "cyl",
              0x3a2f27,
              side * (SHORE_X - 0.4),
              y + k,
              -0.75,
              0.1,
              0.1,
              0.7,
            );
          }
        }
        // Containers stacked on the apron.
        for (let i = 0; i < 9; i++) {
          const y = -26 + i * 6.2 + rand() * 1.5,
            x = side * (SHORE_X + 3.3 + rand() * 0.4);
          const colors = [0x8a3d32, 0x2f5d6b, 0x9a7b3a, 0x50604a];
          for (let lvl = 0; lvl < 1 + Math.floor(rand() * 3); lvl++) {
            add(
              "box",
              colors[(i + lvl) % 4],
              x,
              y,
              -0.25 + lvl * 0.5,
              1.1,
              2.4,
              0.48,
              rand() * 0.06,
            );
            add(
              "box",
              0x1f2324,
              x,
              y,
              -0.25 + lvl * 0.5 + 0.25,
              1.12,
              2.42,
              0.02,
            );
          }
        }
        // Gantry cranes.
        for (const cy of [-14, 11]) {
          const y = cy + side * 3,
            x = side * (SHORE_X + 1.6);
          for (const lx of [-0.9, 0.9]) {
            add("box", 0xb5772f, x + lx, y - 0.6, 1.0, 0.16, 0.16, 3.0);
            add("box", 0xb5772f, x + lx, y + 0.6, 1.0, 0.16, 0.16, 3.0);
          }
          add("box", 0xc98a3a, x - side * 1.0, y, 2.6, 5.6, 0.3, 0.3);
          add("box", 0x2b2f30, x + side * 0.4, y, 2.35, 0.7, 0.7, 0.45);
          add("box", 0x2b2f30, x - side * 2.8, y, 1.8, 0.05, 0.05, 1.5);
          add("box", 0xd9d0b4, x - side * 2.8, y, 1.05, 0.5, 0.35, 0.12);
        }
        // Warehouses and harbour blocks.
        for (let i = 0; i < 6; i++) {
          const y = -25 + i * 9.4 + rand() * 2,
            x = side * (SHORE_X + 5.6 + rand() * 1.2),
            w = 1.8 + rand() * 1.2,
            h = 3 + rand() * 2.5,
            z = 0.6 + rand() * 1.4;
          add(
            "box",
            0x1d1f1f,
            x + 0.5,
            y - 0.6,
            -0.55,
            w * 1.15,
            h * 1.15,
            0.04,
          );
          add("box", 0x6a675e, x, y, z / 2 - 0.5, w, h, z);
          add("box", 0x3b3e3c, x, y, z - 0.45, w * 1.05, h * 1.05, 0.12);
          for (let k = 0; k < 3; k++)
            add(
              "box",
              0xe1c27a,
              x - w / 2 - 0.01,
              y - h / 3 + (k * h) / 3,
              z * 0.55 - 0.5,
              0.03,
              0.22,
              0.12,
            );
        }
        // Cliffs: tall dark rock bands behind the harbour.
        for (let i = 0; i < 26; i++) {
          const y = rand() * 56 - 28,
            x = side * (SHORE_X + 9 + rand() * 18),
            r = 1.4 + rand() * 2.4,
            hgt = 2 + rand() * 4;
          add(
            "rock",
            i % 3 ? 0x4b4944 : 0x5d5a52,
            x,
            y,
            hgt / 2 - 1,
            r * 1.5,
            r * 1.1,
            hgt,
            rand() * 6,
          );
          add(
            "rock",
            0x77736a,
            x - side * 0.3,
            y + 0.2,
            hgt - 0.6,
            r * 0.9,
            r * 0.6,
            0.5,
            rand() * 6,
          );
          if (i % 2)
            add("box", 0x2f3a2f, x, y - r * 0.5, hgt - 0.3, r * 0.9, 0.25, 0.2);
        }
      }
      // The Farol: lighthouse on the western cliff (one per tile, alternating side).
      const fx = -(SHORE_X + 9.5),
        fy = tile ? -6 : 16;
      add("rock", 0x55524b, fx, fy, 0.5, 3.2, 2.6, 3.0, 0.4);
      add("cyl", 0xd8d4c6, fx, fy, 3.2, 0.55, 0.55, 3.6);
      for (const z of [2.2, 3.4])
        add("cyl", 0xa8392f, fx, fy, z, 0.58, 0.58, 0.4);
      add("cyl", 0x2b2f30, fx, fy, 5.1, 0.7, 0.7, 0.18);
      add("cyl", 0xf4e7b8, fx, fy, 5.45, 0.42, 0.42, 0.5);
      add("cyl", 0x2b2f30, fx, fy, 5.8, 0.5, 0.5, 0.15);
      const beam = new T.Mesh(
        new T.PlaneGeometry(1, 1),
        new T.MeshBasicMaterial({
          color: 0xfff1b8,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        }),
      );
      beam.position.set(fx, fy, 5.45);
      beam.userData.cx = fx;
      beam.userData.cy = fy;
      beam.renderOrder = 41;
      this.beams.push(beam);
      g.add(beam);
      const geos: Record<string, T.BufferGeometry> = {
        box: new T.BoxGeometry(1, 1, 1),
        cyl: new T.CylinderGeometry(1, 1, 1, 10).rotateX(Math.PI / 2),
        rock: new T.CylinderGeometry(0.55, 1, 1, 7).rotateX(Math.PI / 2),
        ship: (() => {
          const s = new T.Shape();
          s.moveTo(0, -0.5);
          s.lineTo(0.5, -0.25);
          s.lineTo(0.5, 0.5);
          s.lineTo(-0.5, 0.5);
          s.lineTo(-0.5, -0.25);
          s.closePath();
          return new T.ExtrudeGeometry(s, {
            depth: 1,
            bevelEnabled: false,
          }).translate(0, 0, -0.5);
        })(),
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
    this.clouds = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;void main(){float a=max(0.,1.-length(vUv*2.-1.));gl_FragColor=vec4(.55,.55,.53,a*a*.16);}",
      }),
      16,
    );
    this.clouds.frustumCulled = false;
    this.clouds.renderOrder = 40;
    this.add(this.clouds);
  }
  /** approach 0..1 scales scenery only (≤6%); the gameplay camera never changes, so no projectile is hidden. */
  update(
    scroll: number,
    time: number,
    quality: number,
    visibleHeight = 28,
    approach = 0,
  ) {
    this.time.value = time;
    this.scroll.value = scroll;
    this.scale.setScalar(1 + 0.06 * Math.max(0, Math.min(1, approach)));
    this.tiles.forEach((g, i) => {
      g.position.y = tileOffset(i, scroll);
      g.visible = Math.abs(g.position.y) < (56 + visibleHeight) / 2 + 4;
    });
    for (const beam of this.beams) {
      const a = time * 0.9;
      beam.rotation.z = a;
      beam.scale.set(16, 0.9, 1);
      beam.position.x = beam.userData.cx + Math.cos(a) * 8;
      beam.position.y = beam.userData.cy + Math.sin(a) * 8;
    }
    this.clouds.count = Math.round(16 * quality);
    for (let i = 0; i < this.clouds.count; i++) {
      this.dummy.position.set(
        Math.sin(i * 5.3) * 24,
        ((i * 6.3 - time * 0.9 + 70) % 70) - 35,
        8.5,
      );
      this.dummy.rotation.set(0, 0, i * 0.7);
      this.dummy.scale.set(7 + (i % 3) * 2, 3 + (i % 2), 1);
      this.dummy.updateMatrix();
      this.clouds.setMatrixAt(i, this.dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
  }
}
