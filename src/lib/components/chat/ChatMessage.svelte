<script lang="ts">
	import type { ChatMessage } from '$lib/features/chat/types';
	import { chat } from '$lib/features/chat/store.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import ContinueRecordModal from '$lib/components/record/ContinueRecordModal.svelte';
	
	let { message }: { message: ChatMessage } = $props();
	
	let isEditing = $state(false);
	let editText = $state('');
	let showContinue = $state(false);
	
	const isOwn = $derived(message.senderId === auth.user?.id);
	const canEdit = $derived(chat.canEdit(message));
	const isEditingThis = $derived(chat.editingMessageId === message.id);
	const isOperational = $derived(message.messageType === 'operational');
	const isSystem = $derived(message.messageType === 'system');
	
	// ⭐ آیا کاربر می‌تواند این Record را ادامه دهد؟
	const canContinue = $derived.by(() => {
		if (!isOperational || !message.recordId) return false;
		if (message.recordStatus === 'completed') return false;
		if (message.recordStatus === 'cancelled') return false;
		
		// Manager همیشه می‌تواند
		if (auth.isManager) return true;
		
		// فقط اگر Next Role = Role فعلی
		if (message.nextRoleSlug && message.nextRoleSlug === auth.role?.slug) {
			return true;
		}
		
		// اگر Next Role ندارد، اجازه بده
		if (!message.nextRoleSlug) return true;
		
		return false;
	});
	
	// ⭐ آیا این پیام مربوط به Role من است؟
	const isForMe = $derived(
		message.nextRoleSlug === auth.role?.slug && !auth.isManager
	);
	
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
		} catch {}
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
	
	function statusLabel(status: string | null): string {
		switch (status) {
			case 'waiting': return 'در انتظار';
			case 'in_progress': return 'در جریان';
			case 'completed': return 'تکمیل‌شده';
			case 'cancelled': return 'لغو‌شده';
			default: return '';
		}
	}
	
	function statusColor(status: string | null): string {
		switch (status) {
			case 'waiting': return 'bg-yellow-100 text-yellow-700';
			case 'in_progress': return 'bg-blue-100 text-blue-700';
			case 'completed': return 'bg-green-100 text-green-700';
			case 'cancelled': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
</script>

<!-- ⭐ System Message -->
{#if isSystem}
	<div class="my-3 flex justify-center">
		<div class="rounded-full bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
			{message.content}
		</div>
	</div>
{:else}
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
			{#if !isOwn}
				<div class="mb-0.5 text-xs font-medium text-gray-500">
					{message.senderName}
				</div>
			{/if}
			
			{#if isEditingThis}
				<!-- Edit Mode -->
				<div class="w-full">
					<textarea
						bind:value={editText}
						rows="3"
						class="w-full rounded-lg border border-blue-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
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
			{:else if isOperational}
				<!-- ⭐ Operational Message -->
				<div
					class="overflow-hidden rounded-2xl shadow-sm ring-1 transition"
					class:ring-blue-300={isForMe}
					class:ring-blue-100={!isForMe}
					class:bg-gradient-to-br={true}
					class:from-blue-50={isForMe}
					class:to-indigo-50={isForMe}
					class:from-gray-50={!isForMe}
					class:to-blue-50={!isForMe}
				>
					<!-- Header -->
					<div class="flex items-center justify-between border-b border-blue-100 px-3 py-1.5">
						<div class="flex items-center gap-1 text-xs font-medium text-blue-700">
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14 2 14 8 20 8"></polyline>
							</svg>
							<span>عملیاتی</span>
						</div>
						{#if message.referenceCode}
							<span class="font-mono text-[10px] text-blue-600" dir="ltr">
								{message.referenceCode}
							</span>
						{/if}
					</div>
					
					<!-- Content -->
					<div class="px-3 py-2">
						<p class="whitespace-pre-wrap break-words text-sm text-gray-800">
							{message.content}
						</p>
					</div>
					
					<!-- ⭐ Footer: Next Role + Status -->
					{#if message.nextRoleName || message.recordStatus}
						<div class="border-t border-blue-100 bg-white/50 px-3 py-2">
							<div class="flex flex-wrap items-center gap-2 text-xs">
								{#if message.nextRoleName}
									<span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
										<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M5 12h14"></path>
											<path d="M12 5l7 7-7 7"></path>
										</svg>
										<span>مرحله بعد: {message.nextRoleName}</span>
									</span>
								{/if}
								{#if message.recordStatus}
									<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium {statusColor(message.recordStatus)}">
										{statusLabel(message.recordStatus)}
									</span>
								{/if}
							</div>
						</div>
					{/if}
					
					<!-- Footer: Time + Continue -->
					<div class="flex items-center justify-between border-t border-blue-100 px-3 py-1.5">
						<span class="text-[10px] text-gray-500">
							{formatTime(message.createdAt)}
							{#if message.editedAt}
								· ویرایش‌شده
							{/if}
						</span>
						
						{#if canContinue}
							<button
								onclick={() => (showContinue = true)}
								class="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-medium text-white transition hover:bg-blue-700"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M5 12h14"></path>
									<path d="M12 5l7 7-7 7"></path>
								</svg>
								ادامه
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Normal Message -->
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
					</div>
				</div>
				
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
{/if}

<!-- Continue Modal -->
{#if showContinue && message.recordId}
	<ContinueRecordModal
		recordId={message.recordId}
		onClose={() => (showContinue = false)}
	/>
{/if}