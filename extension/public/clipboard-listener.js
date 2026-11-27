// Runs in the page's MAIN world so it can observe the game's own share actions.
// Automatic capture is armed by the isolated content script after completion;
// a manual Share/Copy interaction also enables a short capture window.

(() => {
  const RESULT_EVENT = 'daily-games-speedrun:game-result';
  const CAPTURE_EVENT = 'daily-games-speedrun:capture-result';
  const SHARE_WINDOW_MS = 2000;
  const AUTOMATIC_WINDOW_MS = 5000;
  let shareInteractionAt = 0;
  let automaticCaptureUntil = 0;
  let lastResult = '';
  let lastResultAt = 0;

  function noteShareInteraction(event) {
    const control = event.target?.closest?.(
      'button, a, [role="button"], input[type="button"], input[type="submit"]'
    );
    if (!control) return;
    const label = [
      control.innerText,
      control.textContent,
      control.title,
      control.getAttribute?.('aria-label'),
      control.getAttribute?.('data-testid'),
    ]
      .filter(Boolean)
      .join(' ');
    if (/\b(share|copy)\b/i.test(label)) {
      shareInteractionAt = Date.now();
    }
  }

  function shouldCapture() {
    const now = Date.now();
    return (
      now <= automaticCaptureUntil ||
      now - shareInteractionAt <= SHARE_WINDOW_MS
    );
  }

  function publishResult(resultText) {
    if (
      typeof resultText !== 'string' ||
      !resultText.trim() ||
      !shouldCapture()
    ) {
      return;
    }

    // Some games use more than one of the observed APIs for a single action.
    const now = Date.now();
    if (resultText === lastResult && now - lastResultAt < 1000) return;
    lastResult = resultText;
    lastResultAt = now;
    window.dispatchEvent(new CustomEvent(RESULT_EVENT, { detail: resultText }));
  }

  function selectedText() {
    const active = document.activeElement;
    if (
      active &&
      typeof active.value === 'string' &&
      typeof active.selectionStart === 'number' &&
      typeof active.selectionEnd === 'number'
    ) {
      return active.value.slice(active.selectionStart, active.selectionEnd);
    }
    return window.getSelection?.()?.toString() ?? '';
  }

  window.addEventListener(CAPTURE_EVENT, () => {
    automaticCaptureUntil = Date.now() + AUTOMATIC_WINDOW_MS;
  });
  document.addEventListener('pointerdown', noteShareInteraction, true);
  document.addEventListener('click', noteShareInteraction, true);

  try {
    const clipboard = navigator.clipboard;
    if (clipboard?.writeText) {
      const originalWriteText = clipboard.writeText;
      clipboard.writeText = new Proxy(originalWriteText, {
        apply(target, thisArg, args) {
          // Publish before awaiting: a programmatic Share click can produce the
          // correct text but still have its clipboard write denied by Chrome.
          publishResult(args[0]);
          return Reflect.apply(target, thisArg, args);
        },
      });
    }
  } catch (error) {
    console.warn(
      '[Daily Games Speedrun] Could not observe clipboard writes:',
      error
    );
  }

  try {
    if (navigator.share) {
      const originalShare = navigator.share;
      navigator.share = new Proxy(originalShare, {
        apply(target, thisArg, args) {
          const data = args[0] ?? {};
          if (typeof data.text === 'string') {
            const suffix =
              typeof data.url === 'string' && !data.text.includes(data.url)
                ? `\n${data.url}`
                : '';
            publishResult(data.text + suffix);
          }
          return Reflect.apply(target, thisArg, args);
        },
      });
    }
  } catch (error) {
    console.warn(
      '[Daily Games Speedrun] Could not observe native shares:',
      error
    );
  }

  try {
    if (document.execCommand) {
      const originalExecCommand = document.execCommand;
      document.execCommand = new Proxy(originalExecCommand, {
        apply(target, thisArg, args) {
          if (String(args[0]).toLowerCase() === 'copy') {
            publishResult(selectedText());
          }
          return Reflect.apply(target, thisArg, args);
        },
      });
    }
  } catch (error) {
    console.warn(
      '[Daily Games Speedrun] Could not observe legacy copies:',
      error
    );
  }

  // Also observe an actual copy event for browsers that allow the legacy write.
  window.addEventListener('copy', (event) => {
    const clipboardData = event.clipboardData;
    setTimeout(() => {
      publishResult(clipboardData?.getData('text/plain') || selectedText());
    }, 0);
  });
})();
