<script lang="ts">
	import { inventory } from '$lib/features/inventory/store.svelte';
	import type { InventoryItem } from '$lib/features/inventory/types';
	import { onMount } from 'svelte';

	let {
		value,
		fieldKey,
		hasSalePrice = false,
		onChange
	}: {
		value: string;
		fieldKey: string;
		hasSalePrice?: boolean;
		onChange: (itemId: string, item: InventoryItem | null) => void;
	} = $props();

	let isOpen = $state(false);
	let search = $state('');
	let items = $state<InventoryItem[]>([]);
	let isLoading = $state(false);

	const selectedItem = $derived(items.find((i) => i.id === value) || null);

	const filtered = $derived.by(() => {
		let result = items;
		if (search) {
			result = result.filter((i) =>
				i.name.toLowerCase().includes(search.toLowerCase())
			);
		}
		if (hasSalePrice) {
			result = result.filter((i) => (i.salePrice ?? 0) > 0);
		}
		return result;
	});

	async function loadItems() {
		isLoading = true;
		try {
			await inventory.load();
			items = inventory.items;
		} finally {
			isLoading = false;
		}
	}

	async function open() {
		isOpen = true;
		if (items.length === 0) {
			await loadItems();
		}
	}

	function pick(item: InventoryItem) {
		onChange(item.id, item);
		isOpen = false;
		search = '';
	}

	function clear() {
		onChange('', null);
	}

	onMount(() => {
		if (inventory.items.length > 0) {
			items = inventory.items;
		} else {
			loadItems();
		}
	});
</script>

<div>
	{#if selectedItem}
		<div class="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 p-3">
			<div class="flex-1">
				<p class="text-sm font-medium text-blue-900">{selectedItem.name}</p>
				<div class="mt-0.5 flex items-center gap-3 text-xs text-blue-700">
					<span>موجودی: {selectedItem.quantity} {selectedItem.unit}</span>
					{#if selectedItem.salePrice}
						<span>· قیمت: {selectedItem.salePrice} افغانی</span>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={clear}
				class="flex h-7 w-7 items-center justify-center rounded-full text-blue-700 hover:bg-blue-100"
			>
				✕
			</button>
		</div>
	{:else}
		<button
			type="button"
			onclick={open}
			class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-right transition hover:border-blue-400"
		>
			<span class="text-sm text-gray-500">انتخاب دارو...</span>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
				<path d="M6 9l6 6 6-6"/>
			</svg>
		</button>
	{/if}
</div>

<!-- Picker Modal -->
{#if isOpen}
	<div
		class="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
		onclick={() => (isOpen = false)}
		role="presentation"
	>
		<div
			class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 border-b bg-white p-3">
				<div class="flex items-center justify-between">
					<h3 class="text-base font-bold text-gray-900">انتخاب دارو</h3>
					<button
						onclick={() => (isOpen = false)}
						class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
					>
						✕
					</button>
				</div>

				<input
					type="search"
					bind:value={search}
					placeholder="جستجو..."
					class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					autofocus
				/>
			</div>

			<!-- List -->
			<div class="p-2">
				{#if isLoading}
					<div class="space-y-2 p-2">
						{#each Array(3) as _}
							<div class="h-16 animate-pulse rounded-lg bg-gray-200"></div>
						{/each}
					</div>
				{:else if filtered.length === 0}
					<p class="py-8 text-center text-sm text-gray-500">
						{search ? 'نتیجه‌ای یافت نشد' : 'آیتمی موجود نیست'}
					</p>
				{:else}
					<div class="space-y-1">
						{#each filtered as item (item.id)}
							<button
								type="button"
								onclick={() => pick(item)}
								class="w-full rounded-lg border border-gray-100 bg-white p-3 text-right transition hover:border-blue-300 hover:bg-blue-50"
							>
								<div class="flex items-center justify-between">
									<p class="text-sm font-medium text-gray-900">{item.name}</p>
									{#if item.quantity === 0}
										<span class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
											تمام‌شده
										</span>
									{:else if item.quantity <= item.minimumStock}
										<span class="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
											موجودی کم
										</span>
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
									<span>موجودی: {item.quantity} {item.unit}</span>
									{#if item.salePrice}
										<span>· {item.salePrice} افغانی</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}