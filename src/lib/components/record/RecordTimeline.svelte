<script lang="ts">
	import type { RecordStep } from '$lib/features/records/types';
	import { format } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';

	let { steps }: { steps: RecordStep[] } = $props();

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: faIR });
	}

	// برای نمایش داده‌های Step
	function getDisplayFields(data: Record<string, unknown>): Array<{ label: string; value: string }> {
		const fieldLabels: Record<string, string> = {
			patientName: 'نام مریض',
			department: 'بخش',
			amount: 'مبلغ',
			paymentMethod: 'روش پرداخت',
			condition: 'وضعیت',
			diagnosis: 'تشخیص',
			prescription: 'نسخه',
			medicine: 'دارو',
			quantity: 'تعداد',
			test: 'آزمایش',
			result: 'نتیجه',
			service: 'خدمت',
			description: 'توضیحات'
		};

		return Object.entries(data)
			.filter(([key]) => fieldLabels[key])
			.map(([key, value]) => ({
				label: fieldLabels[key]!,
				value: String(value)
			}));
	}
</script>

<div class="space-y-4">
	{#each steps as step, i (step.id)}
		<div class="relative flex gap-3">
			<!-- Line -->
			{#if i < steps.length - 1}
				<div class="absolute right-4 top-8 h-full w-0.5 bg-gray-200"></div>
			{/if}

			<!-- Dot -->
			<div class="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			</div>

			<!-- Content -->
			<div class="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-3">
				<div class="flex items-center justify-between">
					<h4 class="text-sm font-bold text-gray-900">{step.categoryName}</h4>
					<span class="text-xs text-gray-400">{formatDate(step.completedAt)}</span>
				</div>

				<!-- Data Fields -->
				{#if Object.keys(step.data).length > 0}
					<div class="mt-2 space-y-1">
						{#each getDisplayFields(step.data) as field}
							<div class="flex items-start gap-2 text-xs">
								<span class="text-gray-500">{field.label}:</span>
								<span class="flex-1 text-gray-900">{field.value}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>