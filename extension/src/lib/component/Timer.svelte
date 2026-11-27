<script>
  let {
    initialTime = 0, // Initial time in milliseconds
    autoStart = false,
  } = $props();

  // Drift-free timing: instead of accumulating `setInterval` ticks (which
  // fire late and lose time), we keep the timestamp the current segment
  // started and derive elapsed time from Date.now(). The interval below
  // only refreshes the display.
  let baseTime = initialTime; // ms accumulated before the current segment
  /** @type {number | null} */
  let startStamp = null; // Date.now() when the current segment started
  /** @type {ReturnType<typeof setInterval> | null} */
  let intervalId = null;

  let time = $state(initialTime);
  let isRunning = $state(false);
  let isPaused = $state(false);

  const hours = $derived(Math.floor(time / 3600000));
  const minutes = $derived(Math.floor((time % 3600000) / 60000));
  const seconds = $derived(Math.floor((time % 60000) / 1000));
  const milliseconds = $derived(time % 1000);

  // Current elapsed time even between display ticks, so splits are exact.
  function currentTime() {
    return startStamp != null ? baseTime + (Date.now() - startStamp) : time;
  }

  /**
   * @param {number} millisecondsTotal
   */
  function format(millisecondsTotal) {
    const h = Math.floor(millisecondsTotal / 3600000);
    const m = Math.floor((millisecondsTotal % 3600000) / 60000);
    const s = Math.floor((millisecondsTotal % 60000) / 1000);
    const ms = millisecondsTotal % 1000;
    const tail = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    return h > 0 ? `${h.toString().padStart(2, '0')}:${tail}` : tail;
  }

  function getFormattedTime() {
    return format(currentTime());
  }

  function tick() {
    if (startStamp != null) {
      time = baseTime + (Date.now() - startStamp);
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    isPaused = false;
    startStamp = Date.now();
    intervalId = setInterval(tick, 16);
  }

  function stop() {
    if (!isRunning) return;
    tick();
    baseTime = time;
    startStamp = null;
    if (intervalId != null) clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
  }

  function reset() {
    stop();
    baseTime = initialTime;
    time = initialTime;
    isPaused = false;
  }

  function pause() {
    if (!isRunning || isPaused) return;
    tick();
    baseTime = time;
    startStamp = null;
    isPaused = true;
  }

  function resume() {
    if (!isRunning || !isPaused) return;
    isPaused = false;
    startStamp = Date.now();
  }

  function getTime() {
    return currentTime();
  }

  function getIsRunning() {
    return isRunning;
  }

  function getIsPaused() {
    return isPaused;
  }

  $effect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  });

  export {
    start,
    stop,
    reset,
    pause,
    resume,
    getTime,
    getFormattedTime,
    getIsRunning,
    getIsPaused,
  };
</script>

<div class="timer font-mono tabular-nums">
  {#if hours > 0}
    <span class="hours text-4xl font-semibold text-green-600"
      >{hours.toString().padStart(2, '0')}:</span
    >
  {/if}
  <span class="minutes text-4xl font-semibold text-green-600"
    >{minutes.toString().padStart(2, '0')}:</span
  >
  <span class="seconds text-4xl font-semibold text-green-600"
    >{seconds.toString().padStart(2, '0')}</span
  >
  <span class="milliseconds text-green-700 dark:text-green-600"
    >.{milliseconds.toString().padStart(3, '0')}</span
  >
</div>
