<script lang="ts">
	import { records } from '$lib/features/records/store.svelte';
	import { onMount } from 'svelte';
	import TemplateForm from '$lib/components/template/TemplateForm.svelte';
	import type { Template } from '$lib/features/templates/types';

	let {
		recordId,
		onClose
	}: {
		recordId: string;
		onClose: () => void;
	} = $props();

	let selectedTemplate = $state<Template | null>(null);
	let isLoadingRecord = $state(true);
	let loadError = $state('');

	const record = $derived(records.currentRecord);
	const templates = $derived(records.availableTemplates);
	const isLoadingTemplates = $derived(records.isLoadingTemplates);

	onMount(async () => {
		isLoadingRecord = true;
		loadError = '';
		try {
			await Promise.all([
				records.load(recordId),
				records.loadAvailableTemplates(recordId)
			]);
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'خطا در بارگذاری';
		} finally {
			isLoadingRecord = false;
		}
	});

	function pickTemplate(t: Template) {
		selectedTemplate = t;
	}

	function handleSuccess() {
		selectedTemplate = null;
		onClose();
	}
</script>

{#if selectedTemplate}
	<!-- Form باز شده -->
	<TemplateForm
		template={selectedTemplate}
		prefilledData={record?.metadata || {}}
		onClose={() => (selectedTemplate = null)}
		onSuccess={handleSuccess}
		recordId={recordId}
	/>
{:else}
	<!-- انتخاب Template -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="presentation"
	>
		<div
			class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
				<div>
					<h2 class="text-base font-bold text-gray-900">ادامه پرونده</h2>
					{#if record}
						<p class="text-xs text-gray-500" dir="ltr">
							{record.referenceCode}
						</p>
					{/if}
				</div>
				<button
					onclick={onClose}
					type="button"
					aria-label="بستن"
					class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="p-4">
				{#if isLoadingRecord}
					<div class="py-8 text-center">
						<div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
					</div>
				{:else if loadError}
					<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
						{loadError}
					</div>
				{:else if record}
					<!-- Record Info -->
					<div class="mb-4 rounded-lg bg-blue-50 p-3">
						<p class="text-xs font-medium text-blue-700">پرونده</p>
						<p class="mt-1 text-sm text-blue-900">
							{record.createdBy.name}
						</p>
						<div class="mt-2 flex items-center gap-2 text-xs text-blue-700">
							<span>وضعیت: {record.status}</span>
							{#if record.assignedToRole}
								<span>· مرحله: {record.assignedToRole.name}</span>
							{/if}
						</div>
						
						<!-- Steps History -->
						{#if record.steps.length > 0}
							<div class="mt-3 space-y-1">
								<p class="text-xs font-medium text-blue-700">مراحل طی‌شده:</p>
								{#each record.steps as step}
									<div class="flex items-center gap-1 text-xs text-blue-800">
										<span>✓</span>
										<span>{step.categoryName}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Templates -->
					{#if isLoadingTemplates}
						<div class="py-4 text-center">
							<div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
						</div>
					{:else if templates.length === 0}
						<div class="rounded-lg bg-yellow-50 p-4 text-center text-sm text-yellow-800">
							هیچ قالبی برای مرحله بعد تعریف نشده است
						</div>
					{:else}
						<p class="mb-2 text-xs font-medium text-gray-500">
							یک قالب انتخاب کنید:
						</p>
						<div class="space-y-2">
							{#each templates as t}
								<button
									onclick={() => pickTemplate(t)}
									class="w-full rounded-lg border border-gray-200 p-3 text-right transition hover:border-blue-300 hover:bg-blue-50"
								>
									<p class="font-medium text-gray-900">{t.name}</p>
									{#if t.description}
										<p class="mt-0.5 text-xs text-gray-500">{t.description}</p>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}