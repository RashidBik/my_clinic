<script lang="ts">
	import { profile } from '$lib/features/profile/store.svelte';
	import { format } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';

	const data = $derived(profile.data);

	const roleLabels: Record<string, string> = {
		manager: 'مدیر',
		reporter: 'ثبت‌کننده',
		operator: 'مجری'
	};

	const orgTypeLabels: Record<string, string> = {
		clinic: 'کلینیک',
		store: 'فروشگاه',
		company: 'شرکت'
	};

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return format(new Date(dateStr), 'yyyy/MM/dd', { locale: faIR });
	}
</script>

<div class="rounded-2xl bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-base font-bold text-gray-900">اطلاعات</h2>

	<div class="space-y-4">
		<!-- Organization -->
		<div class="flex items-start justify-between border-b border-gray-100 pb-3">
			<div>
				<p class="text-xs text-gray-500">سازمان</p>
				<p class="mt-1 text-sm font-medium text-gray-900">
					{data?.organization.name || '—'}
				</p>
			</div>
			<span class="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
				{orgTypeLabels[data?.organization.type || ''] || data?.organization.type}
			</span>
		</div>

		<!-- Role -->
		<div class="flex items-start justify-between border-b border-gray-100 pb-3">
			<div>
				<p class="text-xs text-gray-500">نقش</p>
				<p class="mt-1 text-sm font-medium text-gray-900">
					{data?.role.name || '—'}
				</p>
			</div>
			<span class="rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700">
				{roleLabels[data?.role.baseRole || ''] || data?.role.baseRole}
			</span>
		</div>

		<!-- Last Login -->
		<div class="flex items-start justify-between border-b border-gray-100 pb-3">
			<div>
				<p class="text-xs text-gray-500">آخرین ورود</p>
				<p class="mt-1 text-sm font-medium text-gray-900">
					{formatDate(data?.user.lastLoginAt || null)}
				</p>
			</div>
		</div>

		<!-- Joined At -->
		<div class="flex items-start justify-between">
			<div>
				<p class="text-xs text-gray-500">تاریخ عضویت</p>
				<p class="mt-1 text-sm font-medium text-gray-900">
					{formatDate(data?.membership.joinedAt || null)}
				</p>
			</div>
			<span class="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
				{data?.membership.status === 'active' ? 'فعال' : 'غیرفعال'}
			</span>
		</div>
	</div>
</div>