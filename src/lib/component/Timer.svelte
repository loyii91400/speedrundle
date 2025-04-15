<script>
  let {
    initialTime = 0, // Initial time in milliseconds
    autoStart = false,
  } = $props();

  let time = $state(initialTime);
  let intervalId = $state(null);
  let isRunning = $state(false);
  let isPaused = $state(false);

  const hours = $derived(Math.floor(time / 3600000));
  const minutes = $derived(Math.floor((time % 3600000) / 60000));
  const seconds = $derived(Math.floor((time % 60000) / 1000));
  const milliseconds = $derived(time % 1000);

  function getFormattedTime() {
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
  }

  function start() {
    if (!isRunning) {
      intervalId = setInterval(() => {
        if (!isPaused) {
          time += 10;
        }
      }, 10);
      isRunning = true;
    }
  }

  function stop() {
    if (isRunning && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      isRunning = false;
    }
  }

  function reset() {
    stop();
    time = initialTime;
  }

  function pause() {
    if (isRunning && intervalId) {
      isPaused = true;
    }
  }

  function resume() {
    if (isRunning && intervalId) {
      isPaused = false;
    }
  }

  function getTime() {
    return time;
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

<div class="timer">
  {#if hours > 0}
    <span class="hours text-4xl text-green-600"
      >{hours.toString().padStart(2, '0')}:</span
    >
  {/if}
  <span class="minutes text-4xl text-green-600"
    >{minutes.toString().padStart(2, '0')}:</span
  >
  <span class="seconds text-4xl text-green-600"
    >{seconds.toString().padStart(2, '0')}</span
  >
  <span class="milliseconds text-green-700"
    >.{milliseconds.toString().padStart(3, '0')}</span
  >
</div>
