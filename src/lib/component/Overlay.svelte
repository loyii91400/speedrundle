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
      class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow-lg p-8 relative min-w-[300px] w-[90%] max-h-[80vh] overflow-y-auto"
    >
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-black dark:hover:text-white text-2xl leading-none p-2 transition-colors"
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
