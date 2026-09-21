<script lang="ts">
	import type { RecordListItem } from '$lib/features/records/types';
	import RecordStatusBadge from './RecordStatusBadge.svelte';
	import { format } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';

	let { record }: { record: RecordListItem } = $props();

	function formatDate(dateStr: string): string {
		return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: faIR });
	}
</script>

<a
	href={`/records/${record.id}`}
	class="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<!-- Reference Code -->
			<div class="flex items-center gap-2">
				<span class="font-mono text-xs text-gray-500" dir="ltr">
					{record.referenceCode}
				</span>
				<RecordStatusBadge status={record.status} size="sm" />
			</div>

			<!-- Creator -->
			<p class="mt-2 text-sm font-medium text-gray-900">
				{record.createdBy.name}
			</p>

			<!-- Meta -->
			<div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
				<span>{formatDate(record.createdAt)}</span>
				{#if record.assignedToRole}
					<span>·</span>
					<span>مرحله: {record.assignedToRole.name}</span>
				{/if}
			</div>
		</div>

		<!-- Arrow -->
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-1 flex-shrink-0 text-gray-400">
			<path d="M15 18l-6-6 6-6"/>
		</svg>
	</div>
</a>