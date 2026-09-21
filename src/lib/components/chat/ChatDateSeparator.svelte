<script lang="ts">
	import { format, isToday, isYesterday, differenceInDays } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';
	
	let { date }: { date: Date | string | number } = $props();
	
	// تبدیل به Date
	const dateObj = $derived.by(() => {
		if (date instanceof Date) return date;
		const d = new Date(date);
		return isNaN(d.getTime()) ? new Date() : d;
	});
	
	const label = $derived.by(() => {
		try {
			if (isToday(dateObj)) return 'امروز';
			if (isYesterday(dateObj)) return 'دیروز';
			
			const days = differenceInDays(new Date(), dateObj);
			if (days < 7) return format(dateObj, 'EEEE', { locale: faIR });
			
			return format(dateObj, 'yyyy/MM/dd', { locale: faIR });
		} catch {
			return '';
		}
	});
</script>

{#if label}
	<div class="my-4 flex items-center gap-3 px-4">
		<div class="h-px flex-1 bg-gray-200"></div>
		<span class="text-xs text-gray-500">{label}</span>
		<div class="h-px flex-1 bg-gray-200"></div>
	</div>
{/if}