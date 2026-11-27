# Firefox source-code submission

Upload two separate archives when submitting the extension to addons.mozilla.org:

- **Add-on code:** `extension/dist/daily-games-speedrun-firefox.zip`
- **Source code:** `extension/dist/daily-games-speedrun-source-v<version>.zip`

The source archive contains the original project files. It excludes dependencies, build output,
browser archives, local environment files, and editor metadata. Do not submit `extension/dist/` as
source code: its bundled and minified files are build output.

## Build environment

The reference build environment is:

- 64-bit Windows 11
- Git Bash
- Node.js `v24.18.0`
- npm `11.16.0`

Use these exact versions to reproduce the reference build. Later Node.js and npm versions may work,
but they are not the reference environment. No global Vite, Svelte, Tailwind CSS, or other build-tool
installation is required. Network access is required to download the locked npm dependencies.

### Install Node.js and npm

1. Install the 64-bit Windows Node.js `v24.18.0` release from <https://nodejs.org/>.
2. Open Git Bash and verify the installed versions:

   ```sh
   node --version
   npm --version
   ```

3. If the npm version is not `11.16.0`, install that version:

   ```sh
   npm install --global npm@11.16.0
   ```

## Build the Firefox add-on from source

1. Extract the source-code ZIP into a new directory.
2. Open Git Bash in the extracted project root.
3. Install the exact dependency versions from the lockfile and run the Firefox build:

   ```sh
   cd extension
   npm ci
   npm run build:firefox
   ```

`npm run build:firefox` executes both required build steps:

```sh
vite build --mode firefox
node scripts/zip-build.mjs firefox
```

Vite compiles the original Svelte components, processes Tailwind CSS, bundles the JavaScript modules,
and minifies the production assets. Custom plugins in `extension/vite.config.js` emit the Firefox
`manifest.json` and `background.js`, and apply the documented Firefox-specific Svelte runtime
transformation. The second command packages the generated files with `fflate`.

The commands create:

- Unpacked add-on: `extension/dist/firefox/`
- Add-on ZIP: `extension/dist/daily-games-speedrun-firefox.zip`

To verify the reproduction, compare the **extracted file contents** of the generated add-on ZIP with
the submitted add-on. ZIP archive bytes and timestamps do not need to be identical.

## Create the source-code ZIP

From the original project checkout, run:

```sh
cd extension
npm ci
npm run package:source
```

The packaging script uses the existing `fflate` development dependency and creates:

```text
extension/dist/daily-games-speedrun-source-v<version>.zip
```

The archive includes the extension and website source, original static assets, tests, build scripts,
package manifests and lockfiles, Prettier and Vite configuration, and both README files. It excludes:

- `.git/`, `.vscode/`, and `.idea/`
- `node_modules/`, `dist/`, `build/`, `.svelte-kit/`, and `coverage/`
- Existing `.zip`, `.xpi`, and `.crx` archives
- Log files, `.local` files, and OS metadata files
- `.env` and `.env.*` files, except `.env.example`

Inspect the archive before uploading it, particularly if the checkout contains untracked local files.

## Original source for generated catalogue files

`website/src/lib/data/games.json` is the original, human-maintained game catalogue.
`website/scripts/sync-links.mjs` generates the checked-in `extension/public/links.json` and updates
the content-script match lists in both browser manifests. Both the original catalogue and its
generator are included in the source archive.

The website dependencies are **not** required for the normal extension build because these derived
files are checked in. If the game catalogue changes, regenerate them before building the extension:

```sh
cd website
npm ci
npm run sync:links
```

Then return to `extension/` and run `npm run build:firefox` as documented above. The website itself is
not part of the packaged browser extension.
