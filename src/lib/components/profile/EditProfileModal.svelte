<script lang="ts">
	import { profile } from '$lib/features/profile/store.svelte';

	let { isOpen, onClose }: { isOpen: boolean; onClose: () => void } = $props();

	let name = $state('');
	let avatar = $state('');
	let error = $state('');
	let isSaving = $derived(profile.isSaving);

	// Load current values when opens
	$effect(() => {
		if (isOpen && profile.data) {
			name = profile.data.user.name;
			avatar = profile.data.user.avatar || '';
			error = '';
		}
	});

	async function handleSave() {
		error = '';
		
		if (name.trim().length < 2) {
			error = 'نام باید حداقل ۲ کاراکتر باشد';
			return;
		}

		try {
			await profile.update({
				name: name.trim(),
				avatar: avatar.trim() || null
			});
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در ذخیره';
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={onClose}
		role="presentation"
	>
		<!-- Modal -->
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<h2 class="text-lg font-bold text-gray-900">ویرایش پروفایل</h2>

			{#if error}
				<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<div class="mt-4 space-y-4">
				<!-- Name -->
				<div>
					<label for="edit-name" class="mb-1 block text-sm font-medium text-gray-700">
						نام نمایشی
					</label>
					<input
						id="edit-name"
						type="text"
						bind:value={name}
						maxlength="100"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<!-- Avatar URL -->
				<div>
					<label for="edit-avatar" class="mb-1 block text-sm font-medium text-gray-700">
						آدرس تصویر (اختیاری)
					</label>
					<input
						id="edit-avatar"
						type="url"
						bind:value={avatar}
						placeholder="https://..."
						dir="ltr"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-left focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
			</div>

			<!-- Actions -->
			<div class="mt-6 flex gap-2">
				<button
					onclick={handleSave}
					disabled={isSaving}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isSaving ? 'در حال ذخیره...' : 'ذخیره'}
				</button>
				<button
					onclick={onClose}
					disabled={isSaving}
					class="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
				>
					انصراف
				</button>
			</div>
		</div>
	</div>
{/if}