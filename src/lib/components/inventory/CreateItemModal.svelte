<script lang="ts">
	import { inventory } from '$lib/features/inventory/store.svelte';

	let { onClose }: { onClose: () => void } = $props();

	let name = $state('');
	let unit = $state('عدد');
	let quantity = $state(0);
	let minimumStock = $state(0);
	let purchasePrice = $state<number | undefined>(undefined);
	let salePrice = $state<number | undefined>(undefined);
	let supplier = $state('');
	let error = $state('');

	const isSaving = $derived(inventory.isSaving);

	async function handleSubmit() {
		error = '';
		if (!name.trim()) {
			error = 'نام الزامی است';
			return;
		}

		try {
			await inventory.createItem({
				name: name.trim(),
				unit,
				quantity,
				minimumStock,
				purchasePrice,
				salePrice,
				supplier: supplier || undefined
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
		class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		tabindex="-1"
	>
		<h2 class="text-lg font-bold text-gray-900">افزودن آیتم جدید</h2>

		{#if error}
			<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
		{/if}

		<div class="mt-4 space-y-3">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">نام</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="unit" class="mb-1 block text-sm font-medium text-gray-700">واحد</label>
					<input
						id="unit"
						type="text"
						bind:value={unit}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
				<div>
					<label for="qty" class="mb-1 block text-sm font-medium text-gray-700">موجودی اولیه</label>
					<input
						id="qty"
						type="number"
						bind:value={quantity}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
			</div>

			<div>
				<label for="min" class="mb-1 block text-sm font-medium text-gray-700">
					حداقل موجودی (هشدار)
				</label>
				<input
					id="min"
					type="number"
					bind:value={minimumStock}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="buy" class="mb-1 block text-sm font-medium text-gray-700">قیمت خرید</label>
					<input
						id="buy"
						type="number"
						bind:value={purchasePrice}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
				<div>
					<label for="sell" class="mb-1 block text-sm font-medium text-gray-700">قیمت فروش</label>
					<input
						id="sell"
						type="number"
						bind:value={salePrice}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
			</div>

			<div>
				<label for="supplier" class="mb-1 block text-sm font-medium text-gray-700">تأمین‌کننده</label>
				<input
					id="supplier"
					type="text"
					bind:value={supplier}
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
				{isSaving ? 'در حال ثبت...' : 'افزودن'}
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