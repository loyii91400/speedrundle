import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJsonPath = fileURLToPath(
  new URL('../package.json', import.meta.url)
);
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

for (const browser of ['chrome', 'firefox']) {
  const manifestPath = fileURLToPath(
    new URL(`../${browser}/manifest.json`, import.meta.url)
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`Synced browser manifests to version ${version}`);
