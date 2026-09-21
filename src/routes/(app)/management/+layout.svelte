<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (!auth.isManager) {
			goto('/chat');
		}
	});

	const tabs = [
		{ href: '/management', label: 'داشبورد' },
		{ href: '/management/members', label: 'کارمندان' },
		{ href: '/management/roles', label: 'نقش‌ها' }
	];

	const currentPath = $derived(page.url.pathname);
</script>

{#if auth.isManager}
	<div class="min-h-screen bg-gray-50 pb-20">
		<!-- Header -->
		<header class="sticky top-0 z-10 border-b bg-white shadow-sm">
			<div class="flex items-center justify-between px-4 py-3">
				<h1 class="text-lg font-bold text-gray-900">مدیریت</h1>
				<a
					href="/chat"
					class="text-sm text-blue-600 hover:text-blue-700"
				>
					بازگشت به چت
				</a>
			</div>

			<!-- Tabs -->
			<div class="flex gap-1 overflow-x-auto px-4 pb-2">
				{#each tabs as tab}
					<a
						href={tab.href}
						class="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition"
						class:bg-blue-600={currentPath === tab.href}
						class:text-white={currentPath === tab.href}
						class:bg-gray-100={currentPath !== tab.href}
						class:text-gray-700={currentPath !== tab.href}
					>
						{tab.label}
					</a>
				{/each}
			</div>
		</header>

		{@render children()}
	</div>
{/if}