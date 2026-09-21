<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/navigation/BottomNav.svelte';

	let { children } = $props();

	onMount(async () => {
		await auth.initialize();
		if (!auth.isAuthenticated) {
			await goto('/login');
		}
	});

	const showBottomNav = $derived(
		auth.isAuthenticated && !page.url.pathname.startsWith('/chat')
	);
</script>

{#if auth.isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
	</div>
{:else if auth.isAuthenticated}
	{@render children()}
	{#if showBottomNav}
		<BottomNav />
	{/if}
{/if}