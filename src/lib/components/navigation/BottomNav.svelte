<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';

	const currentPath = $derived(page.url.pathname);
	const isManager = $derived(auth.isManager);

	const items = $derived([
		{ href: '/chat', label: 'گفتگو', icon: 'chat' },
		{ href: '/records', label: 'پرونده‌ها', icon: 'file' },
		// ⭐ فقط Manager
		...(isManager
			? [{ href: '/inventory', label: 'موجودی', icon: 'box' }]
			: []),
		...(isManager
			? [{ href: '/management', label: 'مدیریت', icon: 'chart' }]
			: []),
		{ href: '/profile', label: 'پروفایل', icon: 'user' }
	]);

	function isActive(href: string): boolean {
		return currentPath === href || currentPath.startsWith(href + '/');
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-20 border-t bg-white shadow-lg">
	<div class="mx-auto flex max-w-md">
		{#each items as item}
			<a
				href={item.href}
				class="flex flex-1 flex-col items-center gap-0.5 py-2.5 transition"
				class:text-blue-600={isActive(item.href)}
				class:text-gray-500={!isActive(item.href)}
			>
				{#if item.icon === 'chat'}
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
				{:else if item.icon === 'file'}
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
				{:else if item.icon === 'box'}
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
					</svg>
				{:else if item.icon === 'user'}
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
				{:else if item.icon === 'chart'}
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="20" x2="18" y2="10"></line>
						<line x1="12" y1="20" x2="12" y2="4"></line>
						<line x1="6" y1="20" x2="6" y2="14"></line>
					</svg>
				{/if}
				<span class="text-[10px] font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>