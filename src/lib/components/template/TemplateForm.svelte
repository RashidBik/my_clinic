<script lang="ts">
	import type { Template } from '$lib/features/templates/types';
	import { api } from '$lib/api/client';
	import InventoryPicker from './InventoryPicker.svelte';
	import type { InventoryItem } from '$lib/features/inventory/types';
	import { generateUUID } from '$lib/utils/uuid';

	let {
		template,
		prefilledData = {},
		recordId,
		onClose,
		onSuccess
	}: {
		template: Template;
		prefilledData?: Record<string, unknown>;
		recordId?: string;
		onClose: () => void;
		onSuccess: (result: unknown) => void;
	} = $props();

	// ═══════════════════════════════════════════════
	// State
	// ═══════════════════════════════════════════════
	let values = $state<Record<string, unknown>>({});
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let submitError = $state('');
	let initialized = $state(false);

	const sortedFields = $derived(
		[...template.fields].sort((a, b) => a.sortOrder - b.sortOrder)
	);

	// ═══════════════════════════════════════════════
	// Initialize (once)
	// ═══════════════════════════════════════════════
	$effect(() => {
	if (initialized) return;
	
	const initial: Record<string, unknown> = {};
	for (const field of template.fields) {
		if (prefilledData[field.key] !== undefined) {
			initial[field.key] = prefilledData[field.key];
		} else if (field.defaultValue !== undefined) {
			initial[field.key] = field.defaultValue;
		} else if (field.type === 'inventory_picker') {
			initial[field.key] = ''; // ← String خالی (نه Array)
		} else if (field.type === 'select' && field.options?.length) {
			initial[field.key] = field.options[0]!.value;
		} else if (field.type === 'number' || field.type === 'currency') {
			initial[field.key] = '';
		} else {
			initial[field.key] = '';
		}
	}
	values = initial;
	initialized = true;
});

	// ═══════════════════════════════════════════════
	// Preview
	// ═══════════════════════════════════════════════
	const preview = $derived.by(() => {
		return template.textTemplate.replace(/\{(\w+)\}/g, (_, key) => {
			const value = values[key];
			if (value === undefined || value === null || value === '') return '...';
			if (Array.isArray(value)) {
				return value.length > 0 ? `${value.length} قلم` : '...';
			}
			return String(value);
		});
	});

	// ═══════════════════════════════════════════════
	// Prepare Data for Server
	// ═══════════════════════════════════════════════
	function prepareData(): Record<string, unknown> {
	const clean: Record<string, unknown> = {};
	
	for (const field of sortedFields) {
		let value = values[field.key];

		// Number / Currency
		if (field.type === 'number' || field.type === 'currency') {
			if (value === '' || value === null || value === undefined) {
				if (field.required) errors[field.key] = 'این فیلد الزامی است';
				continue;
			}
			const num = Number(value);
			if (isNaN(num)) {
				errors[field.key] = 'عدد نامعتبر';
				continue;
			}
			clean[field.key] = num;
			continue;
		}

		// Inventory Picker — String (itemId)
		if (field.type === 'inventory_picker') {
			if (!value || value === '') {
				if (field.required) errors[field.key] = 'انتخاب الزامی است';
				continue;
			}
			clean[field.key] = String(value);
			continue;
		}

		// hidden — Skip validation, اما مقدار را بفرست
		if ((field.type as string) === 'hidden') {
			if (value !== undefined && value !== null && value !== '') {
				clean[field.key] = value;
			}
			continue;
		}

		// Text / Select / Textarea
		if (value === '' || value === null || value === undefined) {
			if (field.required) errors[field.key] = 'این فیلد الزامی است';
			continue;
		}

		clean[field.key] = value;
	}

	return clean;
}

	// ═══════════════════════════════════════════════
	// Submit
	// ═══════════════════════════════════════════════
	async function submitForm() {
		errors = {};
		submitError = '';

		const data = prepareData();

		if (Object.keys(errors).length > 0) {
			return;
		}

		isSubmitting = true;
		try {
			const clientOperationId = generateUUID();
			const endpoint = recordId
				? `/records/${recordId}/continue`
				: '/records/execute';

			const result = await api.post(endpoint, {
				templateId: template.id,
				data,
				clientOperationId
			});

			onSuccess(result);
			onClose();
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'خطا در ارسال';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();		
		await submitForm();
	}

	// ═══════════════════════════════════════════════
	// Keyboard
	// ═══════════════════════════════════════════════
	function handleKeydown(e: KeyboardEvent, fieldIndex: number) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();

			if (fieldIndex === sortedFields.length - 1) {
				submitForm();
				return;
			}

			const nextField = sortedFields[fieldIndex + 1];
			if (nextField) {
				const nextEl = document.getElementById(`field-${nextField.key}`);
				nextEl?.focus();
			}
		}
	}

	// ═══════════════════════════════════════════════
	// Update
	// ═══════════════════════════════════════════════
	function updateValue(key: string, value: unknown) {
		values = { ...values, [key]: value };
		if (errors[key]) {
			const newErrors = { ...errors };
			delete newErrors[key];
			errors = newErrors;
		}
	}

	function handleInventoryPick(
	fieldKey: string,
	itemId: string,
	item: InventoryItem | null
) {
	console.log('🎯 Pick:', fieldKey, itemId, item?.name);
	
	// فیلد اصلی = itemId (String)
	updateValue(fieldKey, itemId);

	// فیلد نام
	if (item) {
		updateValue(`${fieldKey}Name`, item.name);
		
		// Auto-fill amount
		const amountField = template.fields.find((f) => f.key === 'amount');
		if (amountField && item.salePrice) {
			const quantity = Number(values['quantity'] || 1);
			updateValue('amount', item.salePrice * quantity);
		}
	} else {
		updateValue(`${fieldKey}Name`, '');
	}
}


</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
	onclick={onClose}
	role="presentation"
>
	<!-- Modal -->
	<div
		class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Header -->
		<div class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
			<div>
				<h2 class="text-base font-bold text-gray-900">{template.name}</h2>
				{#if template.description}
					<p class="text-xs text-gray-500">{template.description}</p>
				{/if}
			</div>
			<button
				onclick={onClose}
				class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
				type="button"
				aria-label="بستن"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4 p-4">
			<!-- Preview -->
			<div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
				<p class="text-xs font-medium text-blue-700">پیش‌نمایش:</p>
				<p class="mt-1">{preview}</p>
			</div>

			<!-- Fields -->
			{#each sortedFields as field, i (field.key)}
				<!-- {#if field.type === 'hidden'}
				{:else} -->
					<div>
						<label
							for={`field-${field.key}`}
							class="mb-1 block text-sm font-medium text-gray-700"
						>
							{field.label}
							{#if field.required}
								<span class="text-red-500">*</span>
							{/if}
						</label>

						{#if field.type === 'select'}
							<select
								id={`field-${field.key}`}
								value={String(values[field.key] ?? '')}
								onchange={(e) => updateValue(field.key, e.currentTarget.value)}
								onkeydown={(e) => handleKeydown(e, i)}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
							>
								<option value="">انتخاب کنید...</option>
								{#each field.options || [] as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						{:else if field.type === 'textarea'}
							<textarea
								id={`field-${field.key}`}
								value={String(values[field.key] ?? '')}
								oninput={(e) => updateValue(field.key, e.currentTarget.value)}
								onkeydown={(e) => handleKeydown(e, i)}
								rows="3"
								placeholder={field.placeholder || ''}
								class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
							></textarea>
						{:else if field.type === 'number' || field.type === 'currency'}
							<input
								id={`field-${field.key}`}
								type="number"
								value={values[field.key] ?? ''}
								oninput={(e) => {
									const raw = e.currentTarget.value;
									if (raw === '') {
										updateValue(field.key, '');
									} else {
										const num = Number(raw);
										updateValue(field.key, isNaN(num) ? '' : num);
									}
								}}
								onkeydown={(e) => handleKeydown(e, i)}
								placeholder={field.placeholder || ''}
								inputmode="decimal"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
							/>
						{:else if field.type === 'inventory_picker'}
							<InventoryPicker
								value={values[field.key] as string}
								fieldKey={field.key}
								hasSalePrice={(field.validation as { hasSalePrice?: boolean })?.hasSalePrice ?? false}
								onChange={(itemId, item) => handleInventoryPick(field.key, itemId, item)}
							/>
						{:else}
							<input
								id={`field-${field.key}`}
								type="text"
								value={String(values[field.key] ?? '')}
								oninput={(e) => updateValue(field.key, e.currentTarget.value)}
								onkeydown={(e) => handleKeydown(e, i)}
								placeholder={field.placeholder || ''}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
							/>
						{/if}

						{#if errors[field.key]}
							<p class="mt-1 text-xs text-red-600">{errors[field.key]}</p>
						{/if}
					</div>
				<!-- {/if} -->
			{/each}

			<!-- Submit Error -->
			{#if submitError}
				<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
					{submitError}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-2 pt-2">
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isSubmitting ? 'در حال ارسال...' : 'ارسال'}
				</button>
				<button
					type="button"
					onclick={onClose}
					disabled={isSubmitting}
					class="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
				>
					انصراف
				</button>
			</div>
		</form>
	</div>
</div>