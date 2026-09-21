<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { records } from '$lib/features/records/store.svelte';
	import RecordStatusBadge from '$lib/components/record/RecordStatusBadge.svelte';
	import RecordTimeline from '$lib/components/record/RecordTimeline.svelte';
	import RecordPayments from '$lib/components/record/RecordPayments.svelte';
	import ContinueRecordModal from '$lib/components/record/ContinueRecordModal.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { format } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';

	let showContinue = $state(false);
	let error = $state('');

	const recordId = $derived(page.params.id);
	const record = $derived(records.currentRecord);
	const isLoading = $derived(!record);

	const canContinue = $derived.by(() => {
		if (!record) return false;
		if (record.status === 'completed' || record.status === 'cancelled') return false;
		if (auth.isManager) return true;
		// TODO: بررسی دقیق‌تر
		return true;
	});

	onMount(async () => {
		try {
			await records.load(recordId!);
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطا در بارگذاری';
		}
	});

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: faIR });
	}

	function handleContinueSuccess() {
		showContinue = false;
		records.load(recordId!);
	}
</script>

<svelte:head>
	<title>{record?.referenceCode || 'پرونده'} — کلینیک</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class="flex items-center gap-3 px-4 py-3">
			<a
				href="/records"
				aria-label="بازگشت به پرونده‌ها"
				class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</a>
			<h1 class="flex-1 text-lg font-bold text-gray-900">جزئیات پرونده</h1>
		</div>
	</header>

	<!-- Content -->
	<main class="mx-auto max-w-2xl space-y-4 p-4">
		{#if error}
			<div class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
		{:else if isLoading}
			<div class="space-y-4">
				<div class="h-32 animate-pulse rounded-xl bg-gray-200"></div>
				<div class="h-48 animate-pulse rounded-xl bg-gray-200"></div>
			</div>
		{:else if record}
			<!-- Header Card -->
			<div class="rounded-xl bg-white p-4 shadow-sm">
				<div class="flex items-start justify-between">
					<div>
						<p class="font-mono text-xs text-gray-500" dir="ltr">
							{record.referenceCode}
						</p>
						<RecordStatusBadge status={record.status} />
					</div>
					<div class="text-left">
						<p class="text-xs text-gray-500">ایجاد</p>
						<p class="text-xs font-medium text-gray-700">{formatDate(record.createdAt)}</p>
					</div>
				</div>

				<div class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
					<div>
						<p class="text-xs text-gray-500">ایجادکننده</p>
						<p class="text-sm font-medium text-gray-900">{record.createdBy.name}</p>
					</div>
					{#if record.assignedToRole}
						<div>
							<p class="text-xs text-gray-500">مرحله فعلی</p>
							<p class="text-sm font-medium text-gray-900">{record.assignedToRole.name}</p>
						</div>
					{/if}
				</div>

				<!-- Patient Name از Metadata -->
				{#if record.metadata.patientName}
					<div class="mt-3 rounded-lg bg-blue-50 p-3">
						<p class="text-xs text-blue-700">مریض</p>
						<p class="text-base font-bold text-blue-900">
							{record.metadata.patientName}
						</p>
					</div>
				{/if}

				<!-- Continue Button -->
				{#if canContinue}
					<button
						onclick={() => (showContinue = true)}
						class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
					>
						ادامه این پرونده
					</button>
				{/if}
			</div>

			<!-- Payments -->
			<RecordPayments payments={record.payments} />

			<!-- Timeline -->
			<div class="rounded-xl bg-white p-4 shadow-sm">
				<h3 class="mb-3 text-sm font-bold text-gray-900">مراحل</h3>
				{#if record.steps.length === 0}
					<p class="py-4 text-center text-sm text-gray-500">هنوز مرحله‌ای ثبت نشده است</p>
				{:else}
					<RecordTimeline steps={record.steps} />
				{/if}
			</div>

			<!-- Inventory Transactions -->
			{#if record.inventoryTransactions.length > 0}
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<h3 class="mb-3 text-sm font-bold text-gray-900">مصرف مواد</h3>
					<div class="space-y-2">
						{#each record.inventoryTransactions as tx (tx.id)}
							<div class="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
								<div>
									<p class="text-sm font-medium text-gray-900">{tx.itemName}</p>
									<p class="text-xs text-gray-500">{tx.type}</p>
								</div>
								<span class="text-sm font-bold" class:text-red-600={tx.quantity < 0}>
									{tx.quantity}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</main>

	<!-- Continue Modal -->
	{#if showContinue && recordId}
		<ContinueRecordModal
			recordId={recordId}
			onClose={() => (showContinue = false)}
			onSuccess={handleContinueSuccess}
		/>
	{/if}
</div>