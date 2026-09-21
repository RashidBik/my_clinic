<script lang="ts">
	import { inventory } from '$lib/features/inventory/store.svelte';
	import type { InventoryItem } from '$lib/features/inventory/types';

	let {
		item,
		onClose
	}: {
		item: InventoryItem;
		onClose: () => void;
	} = $props();

	let type = $state<'purchase' | 'sale' | 'consume' | 'adjust' | 'return'>('purchase');
	let quantity = $state(1);
	let unitPrice = $state<number | undefined>(undefined);
	let notes = $state('');
	let error = $state('');

	const isSaving = $derived(inventory.isSaving);

	const typeLabels: Record<string, string> = {
		purchase: 'خرید (افزودن)',
		sale: 'فروش (کاهش)',
		consume: 'مصرف (کاهش)',
		adjust: 'تنظیم دستی',
		return: 'برگشت (افزودن)'
	};

	async function handleSubmit() {
		error = '';

		if (quantity === 0) {
			error = 'تعداد نمی‌تواند صفر باشد';
			return;
		}

		// تعیین علامت بر اساس نوع
		let signedQuantity = quantity;
		if (type === 'sale' || type === 'consume') {
			signedQuantity = -Math.abs(quantity);
		} else if (type === 'purchase' || type === 'return') {
			signedQuantity = Math.abs(quantity);
		}
		// adjust: هر علامتی که کاربر داد

		try {
			await inventory.adjustStock({
				itemId: item.id,
				type,
				quantity: signedQuantity,
				unitPrice,
				notes: notes || undefined
			});
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در ثبت';
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
	onclick={onClose}
	onkeydown={(event) => event.key === 'Escape' && onClose()}
	role="presentation"
>
	<div
		class="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		tabindex="-1"
	>
		<h2 class="text-lg font-bold text-gray-900">تنظیم موجودی</h2>
		<p class="mt-1 text-sm text-gray-600">
			{item.name} — موجودی فعلی: <span class="font-bold">{item.quantity}</span> {item.unit}
		</p>

		{#if error}
			<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
		{/if}

		<div class="mt-4 space-y-3">
			<!-- Type -->
			<div>
				<div class="mb-1 block text-sm font-medium text-gray-700">نوع عملیات</div>
				<div class="grid grid-cols-2 gap-2">
					{#each Object.entries(typeLabels) as [value, label]}
						<button
							type="button"
							onclick={() => (type = value as typeof type)}
							class="rounded-lg border px-3 py-2 text-xs font-medium transition"
							class:border-blue-500={type === value}
							class:bg-blue-50={type === value}
							class:text-blue-700={type === value}
							class:border-gray-200={type !== value}
							class:text-gray-700={type !== value}
						>
							{label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Quantity -->
			<div>
				<label for="qty" class="mb-1 block text-sm font-medium text-gray-700">
					تعداد
				</label>
				<input
					id="qty"
					type="number"
					bind:value={quantity}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>

			<!-- Unit Price -->
			{#if type === 'purchase' || type === 'sale'}
				<div>
					<label for="price" class="mb-1 block text-sm font-medium text-gray-700">
						قیمت واحد (اختیاری)
					</label>
					<input
						id="price"
						type="number"
						bind:value={unitPrice}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
			{/if}

			<!-- Notes -->
			<div>
				<label for="notes" class="mb-1 block text-sm font-medium text-gray-700">
					یادداشت (اختیاری)
				</label>
				<input
					id="notes"
					type="text"
					bind:value={notes}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>
		</div>

		<div class="mt-5 flex gap-2">
			<button
				onclick={handleSubmit}
				disabled={isSaving}
				class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
			>
				{isSaving ? 'در حال ثبت...' : 'ثبت'}
			</button>
			<button
				onclick={onClose}
				disabled={isSaving}
				class="rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-200"
			>
				انصراف
			</button>
		</div>
	</div>
</div>