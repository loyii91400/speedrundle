import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const extensionDirectory = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const { name, version } = JSON.parse(
  readFileSync(join(extensionDirectory, 'package.json'), 'utf8')
);

const excludedDirectories = new Set([
  '.git',
  '.idea',
  '.svelte-kit',
  '.vscode',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

function isExcludedFile(fileName) {
  const lowerName = fileName.toLowerCase();
  const isEnvironmentFile =
    fileName === '.env' ||
    (fileName.startsWith('.env.') && fileName !== '.env.example');

  return (
    isEnvironmentFile ||
    fileName === '.DS_Store' ||
    lowerName === 'thumbs.db' ||
    lowerName === 'desktop.ini' ||
    lowerName.endsWith('.local') ||
    lowerName.endsWith('.log') ||
    lowerName.endsWith('.zip') ||
    lowerName.endsWith('.xpi') ||
    lowerName.endsWith('.crx')
  );
}

const files = Object.create(null);

function collectFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) {
        collectFiles(join(directory, entry.name));
      }
      continue;
    }

    if (!entry.isFile() || isExcludedFile(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    const archivePath = relative(projectRoot, absolutePath)
      .split(sep)
      .join('/');
    files[archivePath] = readFileSync(absolutePath);
  }
}

collectFiles(projectRoot);

const requiredFiles = [
  'README.md',
  'SOURCE_SUBMISSION.md',
  'extension/package.json',
  'extension/package-lock.json',
  'extension/vite.config.js',
  'extension/scripts/package-source.mjs',
  'website/src/lib/data/games.json',
  'website/scripts/sync-links.mjs',
];
const missingFiles = requiredFiles.filter(
  (fileName) => !Object.hasOwn(files, fileName)
);

if (missingFiles.length > 0) {
  throw new Error(`Source archive is incomplete: ${missingFiles.join(', ')}`);
}

const outputDirectory = join(extensionDirectory, 'dist');
const outputPath = join(outputDirectory, `${name}-source-v${version}.zip`);
mkdirSync(outputDirectory, { recursive: true });

const archive = zipSync(files, { level: 9 });
writeFileSync(outputPath, archive);

const displayPath = relative(projectRoot, outputPath).split(sep).join('/');
console.log(
  `Created ${displayPath} (${(archive.length / 1024).toFixed(1)} KiB, ${
    Object.keys(files).length
  } files)`
);
