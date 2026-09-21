<script lang="ts">
	import { onMount } from 'svelte';
	import { records } from '$lib/features/records/store.svelte';
	import RecordCard from '$lib/components/record/RecordCard.svelte';

	let filter = $state<'all' | 'waiting' | 'in_progress' | 'completed'>('all');

	const items = $derived(records.items);
	const isLoading = $derived(records.isLoading);

	const filtered = $derived.by(() => {
		if (filter === 'all') return items;
		return items.filter((r) => r.status === filter);
	});

	const counts = $derived.by(() => ({
		all: items.length,
		waiting: items.filter((r) => r.status === 'waiting').length,
		in_progress: items.filter((r) => r.status === 'in_progress').length,
		completed: items.filter((r) => r.status === 'completed').length
	}));

	const filters = [
		{ value: 'all' as const, label: 'همه' },
		{ value: 'waiting' as const, label: 'در انتظار' },
		{ value: 'in_progress' as const, label: 'در جریان' },
		{ value: 'completed' as const, label: 'تکمیل‌شده' }
	];

	onMount(() => {
		records.list();
	});
</script>

<svelte:head>
	<title>پرونده‌ها — سیستم مدیریت کلینیک</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class="flex items-center gap-3 px-4 py-3">
			<a
				href="/chat"
				class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</a>
			<h1 class="text-lg font-bold text-gray-900">پرونده‌ها</h1>
		</div>

		<!-- Filter Tabs -->
		<div class="flex gap-1 overflow-x-auto px-4 pb-2">
			{#each filters as f}
				<button
					onclick={() => (filter = f.value)}
					class="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
					class:bg-blue-600={filter === f.value}
					class:text-white={filter === f.value}
					class:bg-gray-100={filter !== f.value}
					class:text-gray-700={filter !== f.value}
				>
					{f.label}
					{#if counts[f.value] !== undefined}
						<span
							class="ml-1 rounded-full px-1.5 text-[10px]"
							class:bg-white/30={filter === f.value}
							class:bg-gray-200={filter !== f.value}
						>
							{counts[f.value]}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</header>

	<!-- Content -->
	<main class="mx-auto max-w-2xl p-4">
		{#if isLoading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="h-24 animate-pulse rounded-xl bg-gray-200"></div>
				{/each}
			</div>
		{:else if filtered.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900">پرونده‌ای یافت نشد</h3>
				<p class="mt-1 text-sm text-gray-500">
					{filter === 'all' ? 'هنوز پرونده‌ای ثبت نشده است' : 'هیچ پرونده‌ای با این فیلتر وجود ندارد'}
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filtered as record (record.id)}
					<RecordCard {record} />
				{/each}
			</div>
		{/if}
	</main>
</div>