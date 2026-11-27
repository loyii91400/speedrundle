import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const browser = process.argv[2];
if (!['chrome', 'firefox'].includes(browser)) {
  console.error('Usage: node scripts/zip-build.mjs <chrome|firefox>');
  process.exit(1);
}

const buildDirectory = fileURLToPath(
  new URL(`../dist/${browser}/`, import.meta.url)
);
if (!existsSync(buildDirectory)) {
  console.error(
    `Missing dist/${browser}/. Run npm run build:${browser} before zipping.`
  );
  process.exit(1);
}

const files = {};

function collectFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(path);
    } else if (entry.isFile()) {
      const archivePath = relative(buildDirectory, path).split(sep).join('/');
      files[archivePath] = readFileSync(path);
    }
  }
}

collectFiles(buildDirectory);
if (!files['manifest.json']) {
  throw new Error(`dist/${browser}/manifest.json is missing`);
}

const outputName = `daily-games-speedrun-${browser}.zip`;
const archive = zipSync(files, { level: 9 });
writeFileSync(new URL(`../dist/${outputName}`, import.meta.url), archive);
console.log(
  `Created dist/${outputName} (${(archive.length / 1024).toFixed(1)} kB)`
);
