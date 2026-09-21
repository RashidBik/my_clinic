<script lang="ts">
	import { profile } from '$lib/features/profile/store.svelte';

	const data = $derived(profile.data);

	const permissionGroups: Record<string, { label: string; icon: string }> = {
		'org.': { label: 'سازمان', icon: '🏢' },
		'record.': { label: 'پرونده‌ها', icon: '📋' },
		'chat.': { label: 'گفتگو', icon: '💬' },
		'inventory.': { label: 'موجودی', icon: '📦' },
		'finance.': { label: 'مالی', icon: '💰' },
		'reports.': { label: 'گزارش‌ها', icon: '📊' },
		'audit.': { label: 'حسابرسی', icon: '🔍' },
		'staff.': { label: 'کارکنان', icon: '👥' }
	};

	const grouped = $derived.by(() => {
		if (!data?.role.permissions) return [];
		
		const map = new Map<string, string[]>();
		for (const perm of data.role.permissions) {
			for (const [prefix, info] of Object.entries(permissionGroups)) {
				if (perm.startsWith(prefix)) {
					const existing = map.get(prefix) || [];
					existing.push(perm);
					map.set(prefix, existing);
					break;
				}
			}
		}

		return Array.from(map.entries()).map(([prefix, perms]) => ({
			...permissionGroups[prefix]!,
			count: perms.length,
			prefix
		}));
	});

	const isManager = $derived(data?.role.baseRole === 'manager');
</script>

<div class="rounded-2xl bg-white p-6 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-base font-bold text-gray-900">دسترسی‌ها</h2>
		{#if isManager}
			<span class="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
				⭐ دسترسی کامل
			</span>
		{:else}
			<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
				{data?.role.permissions.length || 0} دسترسی
			</span>
		{/if}
	</div>

	{#if isManager}
		<p class="text-sm text-gray-600">
			شما به عنوان مدیر، به همه بخش‌های سیستم دسترسی کامل دارید.
		</p>
	{:else if grouped.length > 0}
		<div class="grid grid-cols-2 gap-3">
			{#each grouped as group}
				<div class="rounded-lg border border-gray-100 bg-gray-50 p-3">
					<div class="flex items-center gap-2">
						<span class="text-lg">{group.icon}</span>
						<span class="text-sm font-medium text-gray-900">{group.label}</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">{group.count} مورد</p>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-gray-500">هیچ دسترسی تعریف نشده است.</p>
	{/if}
</div>