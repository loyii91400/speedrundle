import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

function browserFiles(browser) {
  return {
    name: `${browser}-extension-files`,
    generateBundle() {
      for (const file of ['background.js', 'manifest.json']) {
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: readFileSync(
            new URL(`./${browser}/${file}`, import.meta.url)
          ),
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const browser = mode === 'firefox' ? 'firefox' : 'chrome';

  return {
    plugins: [svelte(), tailwindcss(), browserFiles(browser)],
    build: {
      outDir: `dist/${browser}`,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: 'index.html',
        },
      },
    },
  };
});
