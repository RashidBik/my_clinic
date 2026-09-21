<script lang="ts">
	import { management } from '$lib/features/management/store.svelte';
	import { onMount } from 'svelte';

	let { onClose, onSuccess }: { onClose: () => void; onSuccess: () => void } = $props();

	let name = $state('');
	let phone = $state('');
	let password = $state('');
	let roleId = $state('');
	let error = $state('');

	const roles = $derived(management.roles);
	const isSaving = $derived(management.isSaving);

	onMount(() => {
		if (roles.length === 0) management.loadRoles();
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!name.trim() || !phone.trim() || !password || !roleId) {
			error = 'همه فیلدها الزامی هستند';
			return;
		}

		try {
			await management.createMember({
				name: name.trim(),
				phone: phone.trim(),
				password,
				roleId
			});
			onSuccess();
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در ثبت';
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
	role="presentation"
>
	<div
		class="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		tabindex="-1"
		role="dialog"
	>
		<h2 class="text-lg font-bold text-gray-900">افزودن کارمند جدید</h2>

		{#if error}
			<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
		{/if}

		<form onsubmit={handleSubmit} class="mt-4 space-y-3">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">نام</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>

			<div>
				<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">
					شماره تلفن
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phone}
					required
					placeholder="07XXXXXXXX"
					dir="ltr"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-center tracking-wider focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>

			<div>
				<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
					رمز عبور اولیه
				</label>
				<input
					id="password"
					type="text"
					bind:value={password}
					required
					minlength="6"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
				<p class="mt-1 text-xs text-gray-500">
					کارمند می‌تواند بعداً رمز خود را تغییر دهد
				</p>
			</div>

			<div>
				<label for="role" class="mb-1 block text-sm font-medium text-gray-700">نقش</label>
				<select
					id="role"
					bind:value={roleId}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
				>
					<option value="">انتخاب کنید...</option>
					{#each roles as role}
						<option value={role.id}>{role.name}</option>
					{/each}
				</select>
			</div>

			<div class="flex gap-2 pt-2">
				<button
					type="submit"
					disabled={isSaving}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isSaving ? 'در حال ثبت...' : 'افزودن'}
				</button>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-200"
				>
					انصراف
				</button>
			</div>
		</form>
	</div>
</div>