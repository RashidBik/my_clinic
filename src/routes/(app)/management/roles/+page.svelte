<script lang="ts">
	import { onMount } from 'svelte';
	import { management } from '$lib/features/management/store.svelte';

	onMount(() => {
		management.loadRoles();
	});

	const roles = $derived(management.roles);

	const permissionLabels: Record<string, string> = {
		'org.view': 'مشاهده سازمان',
		'org.manage_members': 'مدیریت کارمندان',
		'record.view_all': 'مشاهده همه پرونده‌ها',
		'record.view_own': 'مشاهده پرونده‌های خود',
		'record.view_assigned': 'مشاهده پرونده‌های ارجاع‌شده',
		'record.create': 'ایجاد پرونده',
		'record.continue': 'ادامه پرونده',
		'chat.view': 'مشاهده چت',
		'chat.send': 'ارسال پیام',
		'chat.send_operational': 'ارسال پیام عملیاتی',
		'inventory.view': 'مشاهده موجودی',
		'inventory.consume': 'مصرف موجودی',
		'inventory.create': 'افزودن موجودی',
		'finance.payment_create': 'ثبت پرداخت',
		'reports.view': 'مشاهده گزارش‌ها'
	};
</script>

<main class="mx-auto max-w-3xl space-y-4 p-4">
	{#each roles as role (role.id)}
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-bold text-gray-900">{role.name}</h3>
					<p class="text-xs text-gray-500">{role.description || ''}</p>
				</div>
				<span
					class="rounded-full px-2.5 py-1 text-xs font-medium"
					class:bg-purple-100={role.baseRole === 'manager'}
					class:text-purple-700={role.baseRole === 'manager'}
					class:bg-blue-100={role.baseRole === 'reporter'}
					class:text-blue-700={role.baseRole === 'reporter'}
					class:bg-green-100={role.baseRole === 'operator'}
					class:text-green-700={role.baseRole === 'operator'}
				>
					{role.baseRole === 'manager' ? 'مدیر' :
					 role.baseRole === 'reporter' ? 'ثبت‌کننده' : 'مجری'}
				</span>
			</div>

			{#if role.permissions.length > 0}
				<div class="mt-3 flex flex-wrap gap-1">
					{#each role.permissions.slice(0, 6) as perm}
						<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
							{permissionLabels[perm] || perm}
						</span>
					{/each}
					{#if role.permissions.length > 6}
						<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
							+{role.permissions.length - 6} مورد
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</main>