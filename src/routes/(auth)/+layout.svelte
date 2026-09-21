<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	
	onMount(async () => {
		// اگر کاربر قبلاً لاگین است، به Chat برو
		await auth.initialize();
		
		if (auth.isAuthenticated) {
			await goto('/chat');
		}
	});
</script>

{@render children()}