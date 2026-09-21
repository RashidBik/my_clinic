<script lang="ts">
	import type { RecordPayment } from '$lib/features/records/types';
	import { format } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';

	let { payments }: { payments: RecordPayment[] } = $props();

	const total = $derived(payments.reduce((sum, p) => sum + p.amount, 0));

	const methodLabels: Record<string, string> = {
		cash: 'نقدی',
		card: 'کارت',
		credit: 'قرض'
	};

	function formatDate(dateStr: string): string {
		return format(new Date(dateStr), 'HH:mm', { locale: faIR });
	}
</script>

<div class="rounded-xl bg-white p-4 shadow-sm">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-sm font-bold text-gray-900">پرداخت‌ها</h3>
		{#if total > 0}
			<span class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
				{total.toLocaleString('fa-IR')} افغانی
			</span>
		{/if}
	</div>

	{#if payments.length === 0}
		<p class="py-4 text-center text-sm text-gray-500">هیچ پرداختی ثبت نشده است</p>
	{:else}
		<div class="space-y-2">
			{#each payments as payment (payment.id)}
				<div class="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
					<div>
						<p class="text-sm font-medium text-gray-900">
							{payment.amount.toLocaleString('fa-IR')} {payment.currency}
						</p>
						<p class="text-xs text-gray-500">
							{methodLabels[payment.paymentMethod] || payment.paymentMethod}
						</p>
					</div>
					<span class="text-xs text-gray-400">
						{formatDate(payment.createdAt)}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>