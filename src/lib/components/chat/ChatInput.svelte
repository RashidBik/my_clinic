<script lang="ts">
	import { chat } from '$lib/features/chat/store.svelte';
	import TemplateButton from './TemplateButton.svelte';

	
	let text = $state('');
	let textareaEl: HTMLTextAreaElement | undefined = $state();
	let isComposing = false;
	
	const isSending = $derived(chat.isSending);
	
	async function handleSend() {
		const trimmed = text.trim();
		if (!trimmed || isSending) return;
		
		text = '';
		resizeTextarea();
		
		try {
			await chat.send(trimmed);
		} catch {
			// بازگرداندن متن در صورت خطا
			text = trimmed;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		// اگر در حال تایپ فارسی با IME هستیم، Enter را نگیر
		if (isComposing) return;
		
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
	
	function handleInput() {
		resizeTextarea();
		chat.notifyTyping();
	}
	
	function resizeTextarea() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + 'px';
	}
</script>

<div class="border-t bg-white p-3">
	<div class="mx-auto flex max-w-2xl items-end gap-2">
		<TemplateButton />
		<textarea
			bind:this={textareaEl}
			bind:value={text}
			oninput={handleInput}
			onkeydown={handleKeydown}
			oncompositionstart={() => isComposing = true}
			oncompositionend={() => isComposing = false}
			placeholder="پیام خود را بنویسید..."
			rows="1"
			disabled={isSending}
			class="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
			style="max-height: 120px;"
		></textarea>
		
		<button
			onclick={handleSend}
			disabled={isSending || !text.trim()}
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="ارسال"
		>
			{#if isSending}
				<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="22" y1="2" x2="11" y2="13"></line>
					<path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
				</svg>
			{/if}
		</button>
	</div>
</div>