<script lang="ts">
	import type { ChatMessage } from '$lib/features/chat/types';
	import { chat } from '$lib/features/chat/store.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { formatDistanceToNow } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';
	import { records } from '$lib/features/records/store.svelte';
	import ContinueRecordModal from '$lib/components/record/ContinueRecordModal.svelte';
	
	let { message }: { message: ChatMessage } = $props();
	
	let isEditing = $state(false);
	let editText = $state('');
	let showContinue = $state(false);

	
	const isOwn = $derived(message.senderId === auth.user?.id);
	const canEdit = $derived(chat.canEdit(message));
	const isEditingThis = $derived(chat.editingMessageId === message.id);
	const isOperational = $derived(message.messageType === 'operational');

	const canContinue = $derived.by(() => {
		if (!isOperational || !message.recordId) return false;
		if (!auth.isManager) {
			// TODO: بررسی دقیق‌تر — آیا Role فعلی در Record است؟
			// فعلاً فرض: همه می‌توانند
		}
		return true;
	});
	
	function startEdit() {
		editText = message.content;
		chat.startEdit(message.id);
	}
	
	async function saveEdit() {
		if (!editText.trim() || editText === message.content) {
			chat.cancelEdit();
			return;
		}
		try {
			await chat.saveEdit(message.id, editText);
		} catch {
			// خطا نمایش داده شد
		}
	}
	
	function cancelEdit() {
		chat.cancelEdit();
	}
	
	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('fa-IR', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openContinue() {
			showContinue = true;
		}
</script>

<div
	class="group flex gap-2 px-4 py-1 transition"
	class:flex-row-reverse={isOwn}
>
	<!-- Avatar -->
	<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
		{message.senderName.charAt(0)}
	</div>
	
	<!-- Message -->
	<div class="flex max-w-[75%] flex-col" class:items-end={isOwn}>
		<!-- Sender Name (فقط برای دیگران) -->
		{#if !isOwn}
			<div class="mb-0.5 text-xs font-medium text-gray-500">
				{message.senderName}
			</div>
		{/if}
		
		<!-- Bubble -->
		{#if isEditingThis}
			<!-- Edit Mode -->
			<div class="w-full">
				<textarea
					bind:value={editText}
					rows="3"
					class="w-full rounded-lg border border-blue-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
					autofocus
				></textarea>
				<div class="mt-1 flex gap-1">
					<button
						onclick={saveEdit}
						class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
					>
						ذخیره
					</button>
					<button
						onclick={cancelEdit}
						class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
					>
						انصراف
					</button>
				</div>
			</div>
		{:else}
			<!-- Normal Message -->
			{#if isOperational}
				<!-- Operational Message با دکمه Continue -->
				<div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 px-3 py-2 text-sm shadow-sm ring-1 ring-blue-100">
					<div class="mb-1 flex items-center gap-1 text-xs font-medium text-blue-700">
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14 2 14 8 20 8"></polyline>
						</svg>
						<span>عملیاتی</span>
					</div>
					
					<p class="whitespace-pre-wrap break-words text-gray-800">{message.content}</p>
					
					<div class="mt-1 flex items-center justify-between gap-1 text-[10px] text-gray-500">
						<span>{formatTime(message.createdAt)}</span>
						{#if message.editedAt}
							<span>· ویرایش‌شده</span>
						{/if}
					</div>
					
					{#if canContinue}
						<button
							onclick={openContinue}
							class="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M5 12h14"></path>
								<path d="M12 5l7 7-7 7"></path>
							</svg>
							<span>ادامه این رکورد</span>
						</button>
					{/if}
				</div>
			{:else}

			<div
				class="rounded-2xl px-3 py-2 text-sm shadow-sm"
				class:bg-blue-600={isOwn}
				class:text-white={isOwn}
				class:bg-white={!isOwn}
				class:text-gray-800={!isOwn}
				class:opacity-60={message.status === 'pending'}
			>
				<p class="whitespace-pre-wrap break-words">{message.content}</p>
				
				<div
					class="mt-1 flex items-center gap-1 text-[10px]"
					class:text-blue-100={isOwn}
					class:text-gray-400={!isOwn}
				>
					<span>{formatTime(message.createdAt)}</span>
					{#if message.editedAt}
						<span>· ویرایش‌شده</span>
					{/if}
					{#if message.status === 'pending'}
						<span>· در حال ارسال</span>
					{/if}
					{#if message.status === 'failed'}
						<span class="text-red-300">· ناموفق</span>
					{/if}
				</div>
			</div>
			{/if}

			<!-- Continue Record Modal -->
			{#if showContinue && message.recordId}
				<ContinueRecordModal
					recordId={message.recordId}
					onClose={() => (showContinue = false)}
				/>
			{/if}

			<!-- Edit Button (Hover) -->
			{#if canEdit}
				<button
					onclick={startEdit}
					class="mt-0.5 text-[10px] text-gray-400 opacity-0 transition group-hover:opacity-100 hover:text-blue-600"
				>
					ویرایش
				</button>
			{/if}
		{/if}
	</div>
</div>