<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// ⭐ فقط Manager
		if (!auth.isManager) {
			goto('/chat');
		}
	});
</script>

{#if auth.isManager}
	{@render children()}
{/if}