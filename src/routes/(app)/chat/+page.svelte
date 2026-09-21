<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { chat } from '$lib/features/chat/store.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import ChatMessageList from '$lib/components/chat/ChatMessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatTypingIndicator from '$lib/components/chat/ChatTypingIndicator.svelte';
	
	let scrollEl: HTMLDivElement | undefined = $state();
	let previousScrollHeight = 0;
	let previousMessageCount = 0;
	
	const connectionStatus = $derived(chat.connectionStatus);
	const isLoading = $derived(chat.isLoading);
	
	// ═══════════════════════════════════════════════
	// Init
	// ═══════════════════════════════════════════════
	onMount(async () => {
		await chat.init();
	});
	
	onDestroy(() => {
		chat.disconnect();
	});
	
	// ═══════════════════════════════════════════════
	// Auto Scroll
	// ═══════════════════════════════════════════════
	$effect(() => {
		const count = chat.messages.length;
		if (!scrollEl) return;
		
		if (count > previousMessageCount) {
			// پیام جدید اضافه شد
			const newMessages = count - previousMessageCount;
			const isNearBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 200;
			
			if (isNearBottom || previousMessageCount === 0) {
				// اسکرول به پایین
				requestAnimationFrame(() => {
					scrollEl!.scrollTop = scrollEl!.scrollHeight;
				});
			}
		}
		
		previousMessageCount = count;
	});
	
	// ═══════════════════════════════════════════════
	// Infinite Scroll (Load More)
	// ═══════════════════════════════════════════════
	async function handleScroll() {
		if (!scrollEl) return;
		
		if (scrollEl.scrollTop < 100 && chat.hasMore && !chat.isLoadingMore) {
			previousScrollHeight = scrollEl.scrollHeight;
			
			await chat.loadMore();
			
			// حفظ موقعیت اسکرول
			requestAnimationFrame(() => {
				if (scrollEl) {
					const newScrollHeight = scrollEl.scrollHeight;
					scrollEl.scrollTop = newScrollHeight - previousScrollHeight;
				}
			});
		}
	}
</script>

<svelte:head>
	<title>گفتگو — {auth.organization?.name || 'کلینیک'}</title>
</svelte:head>

<div class="flex h-screen flex-col bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class="flex items-center justify-between px-4 py-3">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
				</div>
				<div>
					<h1 class="text-base font-bold text-gray-900">
						{auth.organization?.name || 'کلینیک'}
					</h1>
					<div class="flex items-center gap-1.5 text-xs">
						<div
							class="h-1.5 w-1.5 rounded-full"
							class:bg-green-500={connectionStatus === 'connected'}
							class:bg-yellow-500={connectionStatus === 'connecting'}
							class:bg-red-500={connectionStatus === 'disconnected'}
						></div>
						<span class="text-gray-500">
							{connectionStatus === 'connected' ? 'آنلاین' :
							 connectionStatus === 'connecting' ? 'در حال اتصال' : 'آفلاین'}
						</span>
					</div>
				</div>
			</div>
			
			<a
				href="/profile"
				class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200"
			>
				{auth.user?.name?.charAt(0) || '?'}
			</a>
		</div>
	</header>
	
	<!-- Messages -->
	<div
		bind:this={scrollEl}
		onscroll={handleScroll}
		class="flex-1 overflow-y-auto"
	>
		<div class="mx-auto max-w-3xl">
			{#if isLoading}
				<div class="flex items-center justify-center py-8">
					<div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
				</div>
			{:else if chat.messages.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-center">
					<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
						<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
						</svg>
					</div>
					<h3 class="text-lg font-bold text-gray-900">شروع گفتگو</h3>
					<p class="mt-1 text-sm text-gray-500">
						اولین پیام را ارسال کنید
					</p>
				</div>
			{:else}
				{#if chat.isLoadingMore}
					<div class="flex justify-center py-2">
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
					</div>
				{/if}
				
				<ChatMessageList />
			{/if}
		</div>
	</div>
	
	<!-- Typing Indicator -->
	<ChatTypingIndicator />
	
	<!-- Input -->
	<ChatInput />
</div>