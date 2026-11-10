import * as T from "three";
/** Shared animated title/hangar backdrop, never a second renderer. */
export class Presentation extends T.Group {
  clouds: T.InstancedMesh;
  port = new T.Group();
  dummy = new T.Object3D();
  constructor(mat: (c: number) => T.MeshStandardMaterial) {
    super();
    const sky = new T.Mesh(
      new T.PlaneGeometry(180, 120),
      new T.ShaderMaterial({
        depthWrite: false,
        vertexShader:
          "varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 p;void main(){float h=smoothstep(-16.,22.,p.y);vec3 c=mix(vec3(.46,.58,.59),vec3(.025,.12,.22),h);float sun=exp(-length(p-vec2(18.,5.))*.11);c+=vec3(.46,.28,.10)*sun;gl_FragColor=vec4(c,1.);}",
      }),
    );
    sky.position.z = -10;
    this.add(sky);
    this.clouds = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader:
          "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p*vec2(1.,1.5));float a=smoothstep(1.,.15,r)*(.65+.2*sin(p.x*12.));gl_FragColor=vec4(.75,.84,.84,a*.35);}",
      }),
      24,
    );
    this.clouds.frustumCulled = false;
    this.add(this.clouds);
    const platform = new T.Mesh(
      new T.CylinderGeometry(4.5, 5, 0.5, 12).rotateX(Math.PI / 2),
      mat(0x2b454d),
    );
    platform.position.z = -2.5;
    this.port.add(platform);
    for (const r of [3.2, 4.15]) {
      const ring = new T.Mesh(
        new T.RingGeometry(r - 0.025, r, 64),
        new T.MeshBasicMaterial({
          color: 0x71c9c9,
          transparent: true,
          opacity: 0.55,
        }),
      );
      ring.position.z = -2.22;
      this.port.add(ring);
    }
    const geo = new T.BoxGeometry(1, 1, 1);
    for (const side of [-1, 1])
      for (const y of [-2, 2]) {
        const p = new T.Mesh(geo, mat(0x24414e));
        p.position.set(side * 4.2, y, -0.7);
        p.scale.set(0.32, 0.32, 3);
        this.port.add(p);
        const lamp = new T.Mesh(
          new T.SphereGeometry(0.12, 8, 5),
          new T.MeshBasicMaterial({ color: 0xffd18b }),
        );
        lamp.position.set(side * 4.2, y, 0.86);
        this.port.add(lamp);
      }
    this.add(this.port);
  }
  update(time: number, x: number, y: number, hangar: boolean) {
    this.port.position.set(x, y, 0);
    this.port.rotation.z = hangar ? 0 : -0.16;
    for (let i = 0; i < 24; i++) {
      this.dummy.position.set(
        ((i * 13.17 + time * (0.4 + (i % 3) * 0.15) + 90) % 100) - 50,
        Math.sin(i * 12.3) * 18,
        -7 + (i % 3) * 0.6,
      );
      this.dummy.rotation.set(0, 0, Math.sin(i) * 0.3);
      this.dummy.scale.set(12 + (i % 4) * 4, 3 + (i % 3), 1);
      this.dummy.updateMatrix();
      this.clouds.setMatrixAt(i, this.dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
  }
}
