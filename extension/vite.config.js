import { readFileSync } from 'node:fs';
import { defineConfig, normalizePath } from 'vite';
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

function firefoxSvelteTemplates() {
  return {
    name: 'firefox-svelte-templates',
    transform(code, id) {
      if (
        !normalizePath(id).endsWith(
          '/svelte/src/internal/client/dom/reconciler.js'
        )
      ) {
        return null;
      }

      // Svelte only passes compiler-generated markup here, but store lint still
      // flags the variable assignment. Parse it in an inert document instead.
      const assignment = 'elem.innerHTML = html;';
      if (!code.includes(assignment)) {
        throw new Error(
          'Svelte template parsing changed; update firefoxSvelteTemplates.'
        );
      }

      return {
        code: code.replace(
          assignment,
          `var parsed = new DOMParser().parseFromString(
		'<template>' + html + '</template>',
		'text/html'
	);
	elem.content.append(parsed.querySelector('template').content);`
        ),
        map: null,
      };
    },
  };
}

export default defineConfig(({ mode }) => {
  const browser = mode === 'firefox' ? 'firefox' : 'chrome';

  return {
    plugins: [
      svelte(),
      tailwindcss(),
      browserFiles(browser),
      ...(browser === 'firefox' ? [firefoxSvelteTemplates()] : []),
    ],
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
