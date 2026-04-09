import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const outdir = path.join(root, 'public', 'client');

await rm(outdir, { recursive: true, force: true });

await build({
  absWorkingDir: root,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  sourcemap: false,
  outdir,
  entryNames: '[name]',
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

console.log('Built client modules to public/client');
