import * as T from "three";
/** Two seamless 56-unit tiles; all environmental detail uses instanced primitive batches. */
export class Terrain extends T.Group {
  time = { value: 0 };
  tiles: T.Group[] = [];
  clouds: T.InstancedMesh;
  dummy = new T.Object3D();
  constructor(mat: (c: number) => T.MeshStandardMaterial) {
    super();
    const ground = new T.Mesh(new T.PlaneGeometry(140, 200), mat(0x304a3d));
    ground.position.z = -1.1;
    this.add(ground);
    for (let tile = 0; tile < 2; tile++) {
      const g = new T.Group();
      this.tiles.push(g);
      this.add(g);
      let seed = 237;
      const rnd = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const batches = new Map<
        string,
        { color: number; geo: string; items: number[][] }
      >();
      const add = (
        geo: string,
        color: number,
        x: number,
        y: number,
        z: number,
        sx: number,
        sy: number,
        sz: number,
        rz = 0,
        rx = 0,
      ) => {
        const key = geo + color;
        if (!batches.has(key)) batches.set(key, { geo, color, items: [] });
        batches.get(key)!.items.push([x, y, z, sx, sy, sz, rz, rx]);
      };
      const riverX = (y: number) => Math.sin((y * Math.PI) / 28) * 1.5;
      const vertices: number[] = [],
        uvs: number[] = [],
        idx: number[] = [];
      for (let i = 0; i <= 112; i++) {
        const y = -28 + i * 0.5,
          c = riverX(y);
        vertices.push(c - 2.55, y, -0.82, c + 2.55, y, -0.82);
        uvs.push(0, i / 112, 1, i / 112);
        if (i < 112) {
          const j = i * 2;
          idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
        }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      geo.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const water = new T.ShaderMaterial({
        uniforms: { uTime: this.time },
        vertexShader:
          "varying vec2 vUv; varying vec2 p; void main(){vUv=uv;p=(modelMatrix*vec4(position,1.)).xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `uniform float uTime;varying vec2 vUv;varying vec2 p;void main(){float a=sin(p.y*5.+sin(p.x*3.+uTime)*.5+uTime*2.2);float b=pow(max(0.,sin(p.x*8.+sin(p.y*.7-uTime)*.35)),18.);float edge=smoothstep(.08,.0,vUv.x)+smoothstep(.92,1.,vUv.x);vec3 c=mix(vec3(.035,.20,.24),vec3(.08,.35,.37),.5+a*.22);c+=b*.035+edge*.17;gl_FragColor=vec4(c,1.);}`,
      });
      g.add(new T.Mesh(geo, water));
      for (let y = -27; y < 28; y += 1.7) {
        const c = riverX(y);
        for (const side of [-1, 1]) {
          const x = c + side * (2.7 + rnd() * 0.3);
          add(
            "rock",
            0x707968,
            x,
            y + (rnd() - 0.5) * 0.6,
            -0.55,
            0.45 + rnd() * 0.3,
            0.7,
            0.45,
            rnd() * 4,
          );
          add(
            "box",
            0x476649,
            x + side * 0.4,
            y,
            -0.77,
            0.85,
            1.7,
            0.15,
            rnd() * 0.1,
          );
        }
      }
      // Roads, dashed markings, drainage lines.
      for (const x of [-7.2, 7.2]) {
        add("box", 0x3d4b47, x, 0, -0.66, 1.6, 56, 0.12);
        for (let y = -27; y < 28; y += 2.5) {
          add("box", 0xa5aa86, x, y, -0.58, 0.065, 0.9, 0.02);
          add("box", 0x253f3a, x + 0.86, y, -0.59, 0.1, 2.5, 0.08);
        }
      }
      for (let i = 0; i < 190; i++) {
        const y = rnd() * 56 - 28,
          x = (rnd() < 0.5 ? -1 : 1) * (4.1 + rnd() * 28),
          s = 0.35 + rnd() * 0.8;
        if (Math.abs(Math.abs(x) - 7.2) < 1.2) continue;
        if (i % 5 === 0) {
          const w = 0.7 + rnd() * 1.4,
            h = 0.8 + rnd() * 1.7,
            z = 0.45 + rnd() * 1.9;
          add(
            "box",
            0x162f30,
            x + 0.35,
            y - 0.45,
            -0.58,
            w * 1.3,
            h * 1.3,
            0.06,
          );
          add(
            "box",
            0x7b8070,
            x,
            y,
            z / 2 - 0.65,
            w,
            h,
            z,
            rnd() * 0.17,
            0.055,
          );
          add("box", 0x3b514b, x, y, z - 0.6, w * 0.83, h * 0.76, 0.12);
          add("box", 0x8a8b77, x - w * 0.43, y, z - 0.44, 0.12, h, 0.32);
          add("box", 0x8a8b77, x + w * 0.43, y, z - 0.44, 0.12, h, 0.32);
          for (let j = 0; j < 3; j++) {
            add(
              "box",
              0x263b3b,
              x - w * 0.24 + j * w * 0.25,
              y - h * 0.46,
              z * 0.55 - 0.65,
              0.14,
              0.04,
              0.25,
            );
            add(
              "rock",
              0x676f60,
              x + (rnd() - 0.5) * 2,
              y + (rnd() - 0.5) * 2,
              -0.5,
              0.3,
              0.35,
              0.25,
              rnd() * 4,
            );
          }
        } else if (i % 5 === 1) {
          add("rock", 0x6c7662, x, y, -0.22, s, s * 1.2, s * 0.9, rnd() * 6);
          add(
            "rock",
            0x89917a,
            x + 0.2,
            y + 0.2,
            -0.1,
            s * 0.5,
            s * 0.6,
            s * 0.5,
            rnd() * 6,
          );
        } else {
          const h = 1.3 + rnd() * 1.4;
          add(
            "box",
            0x18352e,
            x + 0.3,
            y - 0.45,
            -0.61,
            s * 1.5,
            s * 0.95,
            0.035,
            rnd(),
          );
          add(
            "trunk",
            0x5c5943,
            x,
            y,
            h * 0.2 - 0.7,
            s * 0.14,
            s * 0.14,
            h * 0.7,
          );
          add(
            "tree",
            i % 2 ? 0x3f6750 : 0x52735a,
            x,
            y,
            h * 0.45 - 0.3,
            s,
            s,
            h,
            0,
          );
          add(
            "tree",
            0x648565,
            x,
            y,
            h * 0.65 - 0.18,
            s * 0.65,
            s * 0.65,
            h * 0.65,
            0,
          );
        }
      }
      // A road bridge with ribs, damaged deck, pylons and amber lamps.
      const by = -7;
      add("box", 0x777e6e, 0, by, -0.18, 17, 2.15, 0.55);
      add("box", 0x3b4a47, 0, by, 0.12, 17, 1.65, 0.12);
      for (const side of [-1, 1]) {
        add("box", 0xa5a78d, 0, by + side * 1.05, 0.3, 17, 0.13, 0.45);
        for (let x = -8; x < 9; x += 2) {
          add("box", 0x535e54, x, by + side * 1.05, 0.7, 0.15, 0.15, 0.8);
          add("box", 0xe1b86c, x, by + side * 1.05, 1.1, 0.12, 0.12, 0.12);
        }
      }
      for (let x = -7; x < 8; x += 1.5)
        add("box", 0x303f3c, x, by, -0.3, 0.18, 2.6, 0.8);
      // Dam: five spillway gates, buttresses and service buildings.
      const dy = 18;
      add("box", 0x90917a, 0, dy, -0.08, 12, 2.7, 0.9);
      for (let x = -5; x <= 5; x += 2) {
        add("box", 0x364d4a, x, dy - 0.5, 0.43, 1.15, 1.5, 0.35);
        add("box", 0xa4a28b, x + 0.68, dy, 0.62, 0.28, 3.1, 0.7);
        add("box", 0x7c958a, x, dy - 1.7, -0.56, 0.9, 1.4, 0.08);
        add("box", 0xe1b86c, x, dy + 1.26, 0.52, 0.35, 0.14, 0.12);
      }
      for (const x of [-8.8, 8.8]) {
        add("box", 0x777c6b, x, dy, 0.5, 2.4, 3, 2.2);
        add("box", 0x303f3f, x, dy, 1.65, 2.1, 2.7, 0.2);
        add("box", 0xadd5bf, x, dy - 1.51, 0.85, 1.7, 0.02, 0.3);
      }
      const geometries: Record<string, T.BufferGeometry> = {
        box: new T.BoxGeometry(1, 1, 1),
        rock: new T.DodecahedronGeometry(1, 0),
        tree: new T.ConeGeometry(1, 1, 6).rotateX(Math.PI / 2),
        trunk: new T.CylinderGeometry(1, 1, 1, 6).rotateX(Math.PI / 2),
      };
      for (const { color, geo, items } of batches.values()) {
        const m = new T.InstancedMesh(
          geometries[geo],
          mat(color),
          items.length,
        );
        items.forEach(([x, y, z, sx, sy, sz, rz, rx], i) => {
          this.dummy.position.set(x, y, z);
          this.dummy.scale.set(sx, sy, sz);
          this.dummy.rotation.set(rx, 0, rz);
          this.dummy.updateMatrix();
          m.setMatrixAt(i, this.dummy.matrix);
        });
        g.add(m);
      }
    }
    const cloudGeo = new T.PlaneGeometry(1, 1),
      cloudMat = new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {},
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float a=max(0.,1.-length(p));gl_FragColor=vec4(.68,.79,.73,pow(a,2.)*.15);}",
      });
    this.clouds = new T.InstancedMesh(cloudGeo, cloudMat, 24);
    this.clouds.frustumCulled = false;
    this.clouds.renderOrder = 40;
    this.add(this.clouds);
  }
  update(scroll: number, time: number, quality: number, visibleHeight = 28) {
    this.time.value = time;
    this.tiles.forEach((g, i) => {
      g.position.y = ((((i * 56 - scroll + 28) % 112) + 112) % 112) - 28;
      g.visible = Math.abs(g.position.y) < (56 + visibleHeight) / 2 + 2;
    });
    this.clouds.count = Math.round(24 * quality);
    for (let i = 0; i < this.clouds.count; i++) {
      const x = Math.sin(i * 4.77) * 29 + Math.sin(time * 0.025) * 2;
      const y = ((i * 7.11 - time * 0.55 + 70) % 70) - 35;
      this.dummy.position.set(x, y, 8.5);
      this.dummy.scale.set(5 + (i % 4) * 1.4, 2 + (i % 3), 1);
      this.dummy.rotation.set(0, 0, Math.sin(i) * 0.4);
      this.dummy.updateMatrix();
      this.clouds.setMatrixAt(i, this.dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
  }
}
