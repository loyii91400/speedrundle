import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(
  new URL('../public/clipboard-listener.js', import.meta.url),
  'utf8'
);

function createHarness() {
  const documentListeners = {};
  const windowListeners = {};
  const results = [];
  const writes = [];
  const commands = [];
  let failWrites = false;
  const shareControl = {
    innerText: 'Share result',
    textContent: 'Share result',
    title: '',
    getAttribute: () => null,
  };
  const clipboard = {
    async writeText(text) {
      writes.push(text);
      if (failWrites) throw new Error('NotAllowedError');
      return 'written';
    },
  };
  const document = {
    activeElement: null,
    addEventListener(type, listener) {
      documentListeners[type] = listener;
    },
    execCommand(command) {
      commands.push(command);
      return true;
    },
  };
  const window = {
    addEventListener(type, listener) {
      windowListeners[type] = listener;
    },
    dispatchEvent(event) {
      if (event.type === 'speedrundle:game-result') results.push(event);
      windowListeners[event.type]?.(event);
    },
    getSelection: () => ({ toString: () => '' }),
  };
  const context = vm.createContext({
    console: { warn() {} },
    Date,
    Proxy,
    Reflect,
    navigator: { clipboard },
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
    document,
    window,
    setTimeout: (callback) => callback(),
  });
  vm.runInContext(source, context);

  return {
    clipboard,
    results,
    writes,
    commands,
    clickShare() {
      documentListeners.click({
        target: { closest: () => shareControl },
      });
    },
    armAutomaticCapture() {
      window.dispatchEvent({ type: 'speedrundle:capture-result' });
    },
    rejectClipboardWrites() {
      failWrites = true;
    },
    copy(text) {
      windowListeners.copy({
        clipboardData: { getData: () => text },
      });
    },
    execCopy(text) {
      document.activeElement = {
        value: text,
        selectionStart: 0,
        selectionEnd: text.length,
      };
      return document.execCommand('copy');
    },
  };
}

test('Clipboard API writes are ignored without a Share interaction', async () => {
  const harness = createHarness();
  assert.equal(await harness.clipboard.writeText('Unrelated text'), 'written');
  assert.deepEqual(harness.results, []);
});

test('a Share click captures the exact Clipboard API text', async () => {
  const harness = createHarness();
  const resultText = 'Wordle 1,234 4/6\n\n🟨⬛🟩';
  harness.clickShare();

  assert.equal(await harness.clipboard.writeText(resultText), 'written');
  assert.deepEqual(harness.writes, [resultText]);
  assert.equal(harness.results.length, 1);
  assert.equal(harness.results[0].type, 'speedrundle:game-result');
  assert.equal(harness.results[0].detail, resultText);
});

test('legacy copy events capture their text after a Share click', () => {
  const harness = createHarness();
  harness.clickShare();
  harness.copy('Connections\n🟨🟨🟨🟨');

  assert.equal(harness.results.length, 1);
  assert.equal(harness.results[0].detail, 'Connections\n🟨🟨🟨🟨');
});

test('automatic capture keeps the result when Chrome rejects the write', async () => {
  const harness = createHarness();
  harness.armAutomaticCapture();
  harness.rejectClipboardWrites();

  await assert.rejects(harness.clipboard.writeText('Bandle #123 3/9'));

  assert.equal(harness.results.length, 1);
  assert.equal(harness.results[0].detail, 'Bandle #123 3/9');
});

test('automatic capture reads execCommand selections before copying', () => {
  const harness = createHarness();
  const resultText = 'Wordle 1,234 X/6\n\n🟨🟨🟨🟨🟨';
  harness.armAutomaticCapture();

  assert.equal(harness.execCopy(resultText), true);

  assert.deepEqual(harness.commands, ['copy']);
  assert.equal(harness.results.length, 1);
  assert.equal(harness.results[0].detail, resultText);
});
