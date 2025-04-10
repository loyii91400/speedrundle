<script>
import { fade } from 'svelte/transition';
import { onMount } from 'svelte';

export let isOpen = false;
export let onClose = () => {};

function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
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
<div 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
>
    <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow-lg p-8 relative min-w-[300px] w-[90%] max-h-[60vh] overflow-y-auto">
        <button 
            class="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl leading-none p-2 transition-colors"
            on:click={onClose}
        >
            ×
        </button>
        <div class="mt-2">
            <slot></slot>
        </div>
    </div>
</div>
{/if}
