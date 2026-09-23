<script lang="ts">
	import { onMount } from 'svelte';
	import { inventory } from '$lib/features/inventory/store.svelte';
	import type { InventoryItem } from '$lib/features/inventory/types';
	import InventoryCard from '$lib/components/inventory/InventoryCard.svelte';
	import AdjustStockModal from '$lib/components/inventory/AdjustStockModal.svelte';
	import CreateItemModal from '$lib/components/inventory/CreateItemModal.svelte';

	let search = $state('');
	let filter = $state<'all' | 'low' | 'out' | 'expiring'>('all');
	let selectedItem = $state<InventoryItem | null>(null);
	let showCreate = $state(false);

	const items = $derived(inventory.items);
	const stats = $derived(inventory.stats);
	const lowStockItems = $derived(inventory.lowStockItems);
	const expiringItems = $derived(inventory.expiringItems);
	const isLoading = $derived(inventory.isLoading);

	const filtered = $derived.by(() => {
		let result = items;

		if (search) {
			result = result.filter((i) =>
				i.name.toLowerCase().includes(search.toLowerCase())
			);
		}

		if (filter === 'low') {
			result = result.filter((i) => i.quantity <= i.minimumStock && i.quantity > 0);
		} else if (filter === 'out') {
			result = result.filter((i) => i.quantity === 0);
		} else if (filter === 'expiring') {
			result = result.filter((i) => {
				if (!i.expiryDate) return false;
				const days = Math.ceil(
					(new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
				);
				return days <= 30 && days >= 0;
			});
		}

		return result;
	});

	// ═══════════════════════════════════════════════
	// Load All
	// ═══════════════════════════════════════════════
	async function loadAll() {
		await Promise.all([
			inventory.load(),
			inventory.loadStats(),
			inventory.loadLowStock(),
			inventory.loadExpiring()
		]);
	}

	onMount(loadAll);

	// ═══════════════════════════════════════════════
	// Handlers
	// ═══════════════════════════════════════════════
	function handleItemClick(item: InventoryItem) {
		selectedItem = item;
	}

	async function handleAdjusted() {
		selectedItem = null;
		await loadAll();
	}

	async function handleCreated() {
		showCreate = false;
		await loadAll();
	}

	function formatExpiryDays(dateStr: string): string {
		const days = Math.ceil(
			(new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
		);
		if (days < 0) return 'منقضی شده';
		if (days === 0) return 'امروز';
		return `${days} روز`;
	}
</script>

<svelte:head>
	<title>موجودی — سیستم مدیریت کلینیک</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class="flex items-center gap-3 px-4 py-3">
			<a
				href="/chat"
				aria-label="بازگشت به چت"
				class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</a>
			<h1 class="flex-1 text-lg font-bold text-gray-900">موجودی</h1>
			<button
				onclick={() => (showCreate = true)}
				class="flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				افزودن
			</button>
		</div>

		<!-- Stats -->
		{#if stats}
			<div class="grid grid-cols-4 gap-2 px-4 pb-3">
				<div class="rounded-lg bg-blue-50 p-2 text-center">
					<p class="text-[10px] text-blue-700">کل اقلام</p>
					<p class="text-base font-bold text-blue-900">{stats.totalItems}</p>
				</div>
				<div class="rounded-lg bg-yellow-50 p-2 text-center">
					<p class="text-[10px] text-yellow-700">موجودی کم</p>
					<p class="text-base font-bold text-yellow-900">{stats.lowStock}</p>
				</div>
				<div class="rounded-lg bg-red-50 p-2 text-center">
					<p class="text-[10px] text-red-700">تمام‌شده</p>
					<p class="text-base font-bold text-red-900">{stats.outOfStock}</p>
				</div>
				<div class="rounded-lg bg-orange-50 p-2 text-center">
					<p class="text-[10px] text-orange-700">نزدیک انقضا</p>
					<p class="text-base font-bold text-orange-900">{expiringItems.length}</p>
				</div>
			</div>
		{/if}

		<!-- Alerts -->
		{#if expiringItems.length > 0 && filter !== 'expiring'}
			<button
				onclick={() => (filter = 'expiring')}
				class="mx-4 mb-2 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-right transition hover:bg-orange-100"
			>
				<span class="text-lg">⏰</span>
				<div class="flex-1">
					<p class="text-sm font-bold text-orange-900">
						{expiringItems.length} قلم در آستانه انقضا
					</p>
					<p class="text-xs text-orange-700">طی ۳۰ روز آینده — برای مشاهده کلیک کنید</p>
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-600">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</button>
		{/if}

		{#if lowStockItems.length > 0 && filter !== 'low'}
			<button
				onclick={() => (filter = 'low')}
				class="mx-4 mb-2 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 text-right transition hover:bg-yellow-100"
			>
				<span class="text-lg">📦</span>
				<div class="flex-1">
					<p class="text-sm font-bold text-yellow-900">
						{lowStockItems.length} قلم موجودی کم
					</p>
					<p class="text-xs text-yellow-700">نیاز به سفارش مجدد</p>
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-yellow-600">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</button>
		{/if}

		<!-- Search -->
		<div class="px-4 pb-2">
			<input
				type="search"
				bind:value={search}
				placeholder="جستجو..."
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
			/>
		</div>

		<!-- Filters -->
		<div class="flex gap-1 overflow-x-auto px-4 pb-3">
			<button
				onclick={() => (filter = 'all')}
				class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
				class:bg-blue-600={filter === 'all'}
				class:text-white={filter === 'all'}
				class:bg-gray-100={filter !== 'all'}
				class:text-gray-700={filter !== 'all'}
			>
				همه
			</button>
			<button
				onclick={() => (filter = 'low')}
				class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
				class:bg-yellow-500={filter === 'low'}
				class:text-white={filter === 'low'}
				class:bg-gray-100={filter !== 'low'}
				class:text-gray-700={filter !== 'low'}
			>
				موجودی کم
			</button>
			<button
				onclick={() => (filter = 'out')}
				class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
				class:bg-red-600={filter === 'out'}
				class:text-white={filter === 'out'}
				class:bg-gray-100={filter !== 'out'}
				class:text-gray-700={filter !== 'out'}
			>
				تمام‌شده
			</button>
			<button
				onclick={() => (filter = 'expiring')}
				class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
				class:bg-orange-600={filter === 'expiring'}
				class:text-white={filter === 'expiring'}
				class:bg-gray-100={filter !== 'expiring'}
				class:text-gray-700={filter !== 'expiring'}
			>
				انقضا
			</button>
		</div>
	</header>

	<!-- Content -->
	<main class="mx-auto max-w-2xl p-4">
		{#if isLoading}
			<div class="space-y-2">
				{#each Array(5) as _}
					<div class="h-20 animate-pulse rounded-xl bg-gray-200"></div>
				{/each}
			</div>
		{:else if filtered.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900">آیتمی یافت نشد</h3>
				<p class="mt-1 text-sm text-gray-500">
					{search
						? 'نتیجه‌ای برای جستجو وجود ندارد'
						: filter === 'expiring'
							? 'هیچ قلمی نزدیک انقضا نیست'
							: 'هنوز آیتمی اضافه نشده است'}
				</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each filtered as item (item.id)}
					<div class="relative">
						<InventoryCard {item} onclick={() => handleItemClick(item)} />

						<!-- Expiry Badge (فقط در Filter انقضا) -->
						{#if filter === 'expiring' && item.expiryDate}
							<div class="pointer-events-none absolute left-3 top-3">
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
									class:bg-red-600={new Date(item.expiryDate).getTime() < Date.now()}
									class:bg-orange-500={new Date(item.expiryDate).getTime() >= Date.now()}
								>
									{formatExpiryDays(item.expiryDate)}
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Modals -->
	{#if selectedItem}
		<AdjustStockModal
			item={selectedItem}
			onClose={() => (selectedItem = null)}
			onSuccess={handleAdjusted}
		/>
	{/if}

	{#if showCreate}
		<CreateItemModal
			onClose={() => (showCreate = false)}
			onSuccess={handleCreated}
		/>
	{/if}
</div>