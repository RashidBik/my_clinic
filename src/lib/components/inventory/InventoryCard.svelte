<script lang="ts">
	import type { InventoryItem } from '$lib/features/inventory/types';

	let { item, onclick }: { item: InventoryItem; onclick: () => void } = $props();

	const isLowStock = $derived(item.quantity <= item.minimumStock && item.quantity > 0);
	const isOutOfStock = $derived(item.quantity === 0);

	const expiryDays = $derived.by(() => {
		if (!item.expiryDate) return null;
		const days = Math.ceil(
			(new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
		);
		return days;
	});
</script>

<button
	onclick={onclick}
	class="w-full rounded-xl border border-gray-200 bg-white p-3 text-right transition hover:border-blue-300 hover:shadow-sm"
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h3 class="truncate text-sm font-bold text-gray-900">{item.name}</h3>
				{#if isOutOfStock}
					<span class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
						تمام شده
					</span>
				{:else if isLowStock}
					<span class="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
						موجودی کم
					</span>
				{/if}
				{#if expiryDays !== null && expiryDays < 30}
					<span class="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
						انقضا: {expiryDays} روز
					</span>
				{/if}
			</div>

			<div class="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
				<span>
					موجودی: <span class="font-bold text-gray-900">{item.quantity}</span> {item.unit}
				</span>
				{#if item.salePrice && item.salePrice > 0}
					<span>·</span>
					<span>فروش: {item.salePrice} افغانی</span>
				{/if}
			</div>
		</div>

		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-1 flex-shrink-0 text-gray-400">
			<path d="M15 18l-6-6 6-6"/>
		</svg>
	</div>
</button>