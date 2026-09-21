<script lang="ts">
	import { profile } from '$lib/features/profile/store.svelte';

	let { isOpen, onClose }: { isOpen: boolean; onClose: () => void } = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let isSaving = $derived(profile.isSaving);

	$effect(() => {
		if (isOpen) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			error = '';
			success = false;
		}
	});

	async function handleSave() {
		error = '';
		success = false;

		if (currentPassword.length < 6) {
			error = 'رمز فعلی باید حداقل ۶ کاراکتر باشد';
			return;
		}

		if (newPassword.length < 6) {
			error = 'رمز جدید باید حداقل ۶ کاراکتر باشد';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'رمز جدید و تکرار آن مطابقت ندارند';
			return;
		}

		if (currentPassword === newPassword) {
			error = 'رمز جدید باید متفاوت باشد';
			return;
		}

		try {
			await profile.changePassword(currentPassword, newPassword);
			success = true;
			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در تغییر رمز';
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={onClose}
		role="presentation"
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<h2 class="text-lg font-bold text-gray-900">تغییر رمز عبور</h2>

			{#if success}
				<div class="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
					✅ رمز با موفقیت تغییر کرد
				</div>
			{:else if error}
				<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<div class="mt-4 space-y-4">
				<div>
					<label for="current-password" class="mb-1 block text-sm font-medium text-gray-700">
						رمز فعلی
					</label>
					<input
						id="current-password"
						type="password"
						bind:value={currentPassword}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<div>
					<label for="new-password" class="mb-1 block text-sm font-medium text-gray-700">
						رمز جدید
					</label>
					<input
						id="new-password"
						type="password"
						bind:value={newPassword}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<div>
					<label for="confirm-password" class="mb-1 block text-sm font-medium text-gray-700">
						تکرار رمز جدید
					</label>
					<input
						id="confirm-password"
						type="password"
						bind:value={confirmPassword}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
			</div>

			<div class="mt-6 flex gap-2">
				<button
					onclick={handleSave}
					disabled={isSaving || success}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isSaving ? 'در حال تغییر...' : 'تغییر رمز'}
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