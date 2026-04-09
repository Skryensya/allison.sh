import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const outdir = path.join(root, 'public', 'client');
const manifestPath = path.join(root, 'src', 'generated', 'client-modules.json');

await rm(outdir, { recursive: true, force: true });

const result = await build({
  absWorkingDir: root,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  sourcemap: false,
  metafile: true,
  outdir,
  entryNames: '[name]-[hash]',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  tsconfig: path.join(root, 'tsconfig.json'),
  entryPoints: [
    'src/scripts/base-client.ts',
    'src/scripts/folder-shapes-client.ts',
    'src/scripts/project-folder-stack-client.ts',
    'src/scripts/avatar-client.ts',
  ],
});

const manifest = {};
for (const [input, output] of Object.entries(result.metafile.outputs)) {
  if (!output.entryPoint) continue;
  const entryName = path.basename(output.entryPoint, path.extname(output.entryPoint));
  manifest[entryName] = `/${path.relative(path.join(root, 'public'), path.join(root, input)).replace(/\\/g, '/')}`;
}

await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log('Built client modules to public/client');
console.log(`Wrote ${path.relative(root, manifestPath)}`);
