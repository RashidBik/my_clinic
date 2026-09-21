<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { profile } from '$lib/features/profile/store.svelte';
	import { goto } from '$app/navigation';

	let { onEdit }: { onEdit: () => void } = $props();

	const data = $derived(profile.data);

	async function handleLogout() {
		if (!confirm('آیا از حساب خود خارج می‌شوید؟')) return;
		await auth.logout();
		await goto('/login');
	}
</script>

<div class="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
	<div class="flex items-start gap-4">
		<!-- Avatar -->
		<button
			onclick={onEdit}
			class="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30"
		>
			{#if data?.user.avatar}
				<img
					src={data.user.avatar}
					alt={data.user.name}
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="flex h-full w-full items-center justify-center text-3xl font-bold">
					{data?.user.name.charAt(0) || '?'}
				</div>
			{/if}

			<div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 20h9"/>
					<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
				</svg>
			</div>
		</button>

		<!-- Info -->
		<div class="flex-1 min-w-0">
			<h1 class="text-xl font-bold truncate">{data?.user.name || '...'}</h1>
			<p class="mt-0.5 text-sm text-blue-100" dir="ltr">{data?.user.phone || ''}</p>
			<div class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
					<circle cx="12" cy="7" r="4"></circle>
				</svg>
				<span>{data?.role.name || ''}</span>
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="mt-4 flex gap-2">
		<button
			onclick={onEdit}
			class="flex-1 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30"
		>
			ویرایش پروفایل
		</button>
		<button
			onclick={handleLogout}
			class="rounded-lg bg-red-500/80 px-4 py-2 text-sm font-medium transition hover:bg-red-600"
		>
			خروج
		</button>
	</div>
</div>