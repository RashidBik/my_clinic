<script lang="ts">
	import { onMount } from 'svelte';
	import { management } from '$lib/features/management/store.svelte';
	import { records } from '$lib/features/records/store.svelte';
	import { inventory } from '$lib/features/inventory/store.svelte';

	onMount(async () => {
		await Promise.all([
			management.loadMembers(),
			records.list(),
			inventory.load(),
			inventory.loadStats()
		]);
	});

	const memberCount = $derived(management.members.length);
	const recordCount = $derived(records.items.length);
	const completedRecords = $derived(records.items.filter((r) => r.status === 'completed').length);
	const stats = $derived(inventory.stats);
</script>

<main class="mx-auto max-w-3xl space-y-4 p-4">
	<!-- Welcome -->
	<div class="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
		<h2 class="text-xl font-bold">خوش آمدید، مدیر</h2>
		<p class="mt-1 text-sm text-blue-100">
			خلاصه‌ای از وضعیت کلینیک شما
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 gap-3">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">کارمندان</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{memberCount}</p>
		</div>

		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">پرونده‌ها</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{recordCount}</p>
		</div>

		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">تکمیل‌شده</p>
			<p class="mt-1 text-2xl font-bold text-green-600">{completedRecords}</p>
		</div>

		{#if stats}
			<div class="rounded-xl bg-white p-4 shadow-sm">
				<p class="text-xs text-gray-500">موجودی کم</p>
				<p class="mt-1 text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
			</div>
		{/if}
	</div>

	<!-- Quick Links -->
	<div class="space-y-2">
		<a
			href="/management/members"
			class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
					👥
				</div>
				<div>
					<p class="font-medium text-gray-900">مدیریت کارمندان</p>
					<p class="text-xs text-gray-500">افزودن، ویرایش، تعیین نقش</p>
				</div>
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</a>

		<a
			href="/management/roles"
			class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
					🎭
				</div>
				<div>
					<p class="font-medium text-gray-900">نقش‌ها</p>
					<p class="text-xs text-gray-500">مشاهده Roleها و Permissions</p>
				</div>
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</a>
	</div>
</main>