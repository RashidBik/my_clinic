<script lang="ts">
	import { onMount } from 'svelte';
	import { inventory } from '$lib/features/inventory/store.svelte';
	import type { InventoryItem } from '$lib/features/inventory/types';
	import InventoryCard from '$lib/components/inventory/InventoryCard.svelte';
	import AdjustStockModal from '$lib/components/inventory/AdjustStockModal.svelte';
	import CreateItemModal from '$lib/components/inventory/CreateItemModal.svelte';

	let search = $state('');
	let filter = $state<'all' | 'low' | 'out'>('all');
	let selectedItem = $state<InventoryItem | null>(null);
	let showCreate = $state(false);

	const items = $derived(inventory.items);
	const stats = $derived(inventory.stats);
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
		}

		return result;
	});

	onMount(async () => {
		await Promise.all([inventory.load(), inventory.loadStats()]);
	});

	function handleItemClick(item: InventoryItem) {
		selectedItem = item;
	}

	async function handleAdjusted() {
		selectedItem = null;
		await Promise.all([inventory.load(), inventory.loadStats()]);
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
			<div class="grid grid-cols-3 gap-2 px-4 pb-3">
				<div class="rounded-lg bg-blue-50 p-2 text-center">
					<p class="text-xs text-blue-700">کل اقلام</p>
					<p class="text-base font-bold text-blue-900">{stats.totalItems}</p>
				</div>
				<div class="rounded-lg bg-yellow-50 p-2 text-center">
					<p class="text-xs text-yellow-700">موجودی کم</p>
					<p class="text-base font-bold text-yellow-900">{stats.lowStock}</p>
				</div>
				<div class="rounded-lg bg-red-50 p-2 text-center">
					<p class="text-xs text-red-700">تمام‌شده</p>
					<p class="text-base font-bold text-red-900">{stats.outOfStock}</p>
				</div>
			</div>
		{/if}

		<!-- Search & Filter -->
		<div class="px-4 pb-3">
			<input
				type="search"
				bind:value={search}
				placeholder="جستجو..."
				class="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
			/>

			<div class="flex gap-1">
				<button
					onclick={() => (filter = 'all')}
					class="flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition"
					class:bg-blue-600={filter === 'all'}
					class:text-white={filter === 'all'}
					class:bg-gray-100={filter !== 'all'}
					class:text-gray-700={filter !== 'all'}
				>
					همه
				</button>
				<button
					onclick={() => (filter = 'low')}
					class="flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition"
					class:bg-yellow-500={filter === 'low'}
					class:text-white={filter === 'low'}
					class:bg-gray-100={filter !== 'low'}
					class:text-gray-700={filter !== 'low'}
				>
					موجودی کم
				</button>
				<button
					onclick={() => (filter = 'out')}
					class="flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition"
					class:bg-red-600={filter === 'out'}
					class:text-white={filter === 'out'}
					class:bg-gray-100={filter !== 'out'}
					class:text-gray-700={filter !== 'out'}
				>
					تمام‌شده
				</button>
			</div>
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
					{search ? 'نتیجه‌ای برای جستجو وجود ندارد' : 'هنوز آیتمی اضافه نشده است'}
				</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each filtered as item (item.id)}
					<InventoryCard {item} onclick={() => handleItemClick(item)} />
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
			onSuccess={() => {
				showCreate = false;
				inventory.load();
				inventory.loadStats();
			}}
		/>
	{/if}
</div>