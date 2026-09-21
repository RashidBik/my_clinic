<script lang="ts">
	import { chat } from '$lib/features/chat/store.svelte';
	
	const typing = $derived(chat.typingUsers);
</script>

{#if typing.length > 0}
	<div class="flex items-center gap-2 px-4 py-1 text-xs text-gray-500">
		<div class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
			<div class="flex gap-0.5">
				<span class="h-1 w-1 animate-bounce rounded-full bg-gray-500" style="animation-delay: 0ms"></span>
				<span class="h-1 w-1 animate-bounce rounded-full bg-gray-500" style="animation-delay: 150ms"></span>
				<span class="h-1 w-1 animate-bounce rounded-full bg-gray-500" style="animation-delay: 300ms"></span>
			</div>
		</div>
		{#if typing.length === 1}
			<span>{typing[0].roleSlug} در حال نوشتن...</span>
		{:else}
			<span>{typing.length} نفر در حال نوشتن...</span>
		{/if}
	</div>
{/if}