<script lang="ts">
	import { management } from '$lib/features/management/store.svelte';
	import type { Member } from '$lib/features/management/types';

	let {
		member,
		onClose,
		onSuccess
	}: {
		member: Member;
		onClose: () => void;
		onSuccess: () => void;
	} = $props();

	let roleId = $state(member.roleId);
	let status = $state(member.status);
	let error = $state('');
	let showDelete = $state(false);

	const roles = $derived(management.roles);
	const isSaving = $derived(management.isSaving);

	async function handleSave() {
		error = '';
		try {
			await management.updateMember(member.id, { roleId, status });
			onSuccess();
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در ذخیره';
		}
	}

	async function handleDelete() {
		error = '';
		try {
			await management.deleteMember(member.id);
			onSuccess();
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در حذف';
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="presentation"
>
	<div
		class="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		tabindex="-1"
	>
		<h2 class="text-lg font-bold text-gray-900">ویرایش کارمند</h2>

		<div class="mt-3 rounded-lg bg-gray-50 p-3">
			<p class="font-bold text-gray-900">{member.name}</p>
			<p class="text-sm text-gray-500" dir="ltr">{member.phone}</p>
		</div>

		{#if error}
			<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
		{/if}

		<div class="mt-4 space-y-3">
			<div>
				<label for="role" class="mb-1 block text-sm font-medium text-gray-700">نقش</label>
				<select
					id="role"
					bind:value={roleId}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				>
					{#each roles as role}
						<option value={role.id}>{role.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="status" class="mb-1 block text-sm font-medium text-gray-700">وضعیت</label>
				<select
					id="status"
					bind:value={status}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				>
					<option value="active">فعال</option>
					<option value="inactive">غیرفعال</option>
					<option value="suspended">معلق</option>
				</select>
			</div>
		</div>

		<div class="mt-5 space-y-2">
			<button
				onclick={handleSave}
				disabled={isSaving}
				class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
			>
				{isSaving ? 'در حال ذخیره...' : 'ذخیره'}
			</button>

			{#if !showDelete}
				<button
					onclick={() => (showDelete = true)}
					class="w-full rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
				>
					حذف کارمند
				</button>
			{:else}
				<div class="rounded-lg border border-red-200 bg-red-50 p-3">
					<p class="text-sm text-red-800">مطمئنید؟ این عمل قابل بازگشت نیست.</p>
					<div class="mt-2 flex gap-2">
						<button
							onclick={handleDelete}
							disabled={isSaving}
							class="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
						>
							بله، حذف کن
						</button>
						<button
							onclick={() => (showDelete = false)}
							class="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
						>
							انصراف
						</button>
					</div>
				</div>
			{/if}

			<button
				onclick={onClose}
				class="w-full rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-200"
			>
				بستن
			</button>
		</div>
	</div>
</div>