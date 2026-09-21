<script lang="ts">
	let {
		status,
		size = 'md'
	}: {
		status: string;
		size?: 'sm' | 'md';
	} = $props();

	const config = $derived.by(() => {
		switch (status) {
			case 'waiting':
				return {
					label: 'در انتظار',
					bg: 'bg-yellow-100',
					text: 'text-yellow-700',
					dot: 'bg-yellow-500'
				};
			case 'in_progress':
				return {
					label: 'در جریان',
					bg: 'bg-blue-100',
					text: 'text-blue-700',
					dot: 'bg-blue-500'
				};
			case 'completed':
				return {
					label: 'تکمیل‌شده',
					bg: 'bg-green-100',
					text: 'text-green-700',
					dot: 'bg-green-500'
				};
			case 'cancelled':
				return {
					label: 'لغو‌شده',
					bg: 'bg-red-100',
					text: 'text-red-700',
					dot: 'bg-red-500'
				};
			default:
				return {
					label: status,
					bg: 'bg-gray-100',
					text: 'text-gray-700',
					dot: 'bg-gray-500'
				};
		}
	});

	const sizeClasses = $derived(
		size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
	);
</script>

<span class="{config.bg} {config.text} {sizeClasses} inline-flex items-center gap-1.5 rounded-full font-medium">
	<span class="{config.dot} h-1.5 w-1.5 rounded-full"></span>
	<span>{config.label}</span>
</span>