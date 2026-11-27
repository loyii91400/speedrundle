<script>
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  /**
   * @type {{ isOpen?: boolean, onClose?: () => void, children?: import('svelte').Snippet }}
   */
  let { isOpen = false, onClose = () => {}, children } = $props();

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }

  /** @param {MouseEvent} event */
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
    onclick={handleBackdropClick}
  >
    <div
      role="dialog"
      aria-modal="true"
      class="relative max-h-[80vh] min-w-[300px] w-[90%] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <button
        class="absolute top-2 right-2 p-2 text-2xl leading-none text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        onclick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div class="mt-2">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
