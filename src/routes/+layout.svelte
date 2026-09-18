<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} />
	<title>سیستم مدیریت کلینیک</title>
	<meta name="description" content="سیستم مدیریت ساده و هوشمند کلینیک" />
</svelte:head>
{@render children()}
