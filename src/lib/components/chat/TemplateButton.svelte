<script lang="ts">
	import { templates } from '$lib/features/templates/store.svelte';
	import TemplateForm from '$lib/components/template/TemplateForm.svelte';
	import type { Template } from '$lib/features/templates/types';
	import { chat } from '$lib/features/chat/store.svelte';

	let isOpen = $state(false);
	let selectedTemplate = $state<Template | null>(null);

	const items = $derived(templates.items);

	async function open() {
		if (templates.items.length === 0) {
			await templates.load();
		}
		isOpen = true;
	}

	function pickTemplate(t: Template) {
		console.log('=== Picked Template ===');
		console.log('ID:', t.id);
		console.log('Slug:', t.slug);
		console.log('Fields:', t.fields.length);
		selectedTemplate = t;
		isOpen = false;
	}

	function handleSuccess(result: unknown) {
		selectedTemplate = null;
		// Chat خودکار پیام را نمایش می‌دهد از Socket
	}

	function closeForm() {
		selectedTemplate = null;
	}
</script>

<button
	onclick={open}
	class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 transition hover:bg-blue-200"
	aria-label="قالب‌های عملیاتی"
>
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<line x1="12" y1="5" x2="12" y2="19"></line>
		<line x1="5" y1="12" x2="19" y2="12"></line>
	</svg>
</button>

<!-- Template List -->
{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
		onclick={() => (isOpen = false)}
		role="presentation"
	>
		<div
			class="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			tabindex="-1"
			role="dialog"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-bold text-gray-900">قالب‌های عملیاتی</h2>
				<button
					onclick={() => (isOpen = false)}
					class="text-gray-500 hover:text-gray-700"
				>
					✕
				</button>
			</div>

			{#if templates.isLoading}
				<div class="py-8 text-center">
					<div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
				</div>
			{:else if items.length === 0}
				<p class="py-8 text-center text-sm text-gray-500">
					هیچ قالبی برای نقش شما تعریف نشده است
				</p>
			{:else}
				<div class="space-y-2">
					{#each items as t}
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
		</div>
	</div>
{/if}

<!-- Template Form -->
{#if selectedTemplate}
	<TemplateForm
		template={selectedTemplate}
		onClose={closeForm}
		onSuccess={handleSuccess}
	/>
{/if}