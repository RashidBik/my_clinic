<script lang="ts">
	import ChatMessage from './ChatMessage.svelte';
	import ChatDateSeparator from './ChatDateSeparator.svelte';
	import { chat } from '$lib/features/chat/store.svelte';
	import { isSameDay } from 'date-fns-jalali';
	
	const messages = $derived(chat.messages);
	
	// گروه‌بندی: نمایش Date Separator وقتی روز عوض می‌شود
	const grouped = $derived.by(() => {
		const result: Array<
			{ type: 'date'; date: Date } | { type: 'message'; message: typeof messages[0] }
		> = [];
		
		let lastDate: Date | null = null;
		
		for (const message of messages) {
			const msgDate = new Date(message.createdAt);
			
			if (!lastDate || !isSameDay(lastDate, msgDate)) {
				result.push({ type: 'date', date: msgDate });
				lastDate = msgDate;
			}
			
			result.push({ type: 'message', message });
		}
		
		return result;
	});
</script>

<div class="space-y-1 py-4">
	{#each grouped as item}
		{#if item.type === 'date'}
			<ChatDateSeparator date={item.date} />
		{:else}
			<ChatMessage message={item.message} />
		{/if}
	{/each}
</div>