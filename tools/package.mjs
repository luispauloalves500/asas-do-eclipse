import { copyFile, mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
await mkdir("release", { recursive: true });
await copyFile("dist-single/index.html", "release/asas-do-eclipse-m01.html");
await copyFile("ASSET_LICENSES.md", "dist/THIRD_PARTY_NOTICES.txt");
await writeFile(
  "dist/LEIA-ME.txt",
  "ASAS DO ECLIPSE — M01 v0.2.0\nSirva esta pasta por HTTP, inclusive em subpastas.\nPara abrir sem servidor, use release/asas-do-eclipse-m01.html.\nWASD/setas: mover; Shift: raio; E: bomba; Esc/P: pausa.\nArraste mouse/toque para mover.\n",
);
execFileSync("python3", [
  "-c",
  `import pathlib,zipfile
root=pathlib.Path('dist')
with zipfile.ZipFile('release/asas-do-eclipse-dist.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in root.rglob('*'):
  if f.is_file():z.write(f,f.relative_to(root))
`,
]);
console.log(
  "release/asas-do-eclipse-m01.html + release/asas-do-eclipse-dist.zip",
);
