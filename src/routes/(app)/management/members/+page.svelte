<script lang="ts">
	import { onMount } from 'svelte';
	import { management } from '$lib/features/management/store.svelte';
	import type { Member } from '$lib/features/management/types';
	import AddMemberModal from '$lib/components/management/AddMemberModal.svelte';
	import EditMemberModal from '$lib/components/management/EditMemberModal.svelte';

	let search = $state('');
	let showAdd = $state(false);
	let editingMember = $state<Member | null>(null);

	const members = $derived(management.members);
	const isLoading = $derived(management.isLoading);

	const filtered = $derived.by(() => {
		if (!search) return members;
		return members.filter(
			(m) =>
				m.name.toLowerCase().includes(search.toLowerCase()) ||
				m.phone.includes(search)
		);
	});

	onMount(() => {
		management.loadMembers();
	});

	function handleEdit(member: Member) {
		editingMember = member;
	}
</script>

<main class="mx-auto max-w-3xl p-4">
	<!-- Search + Add -->
	<div class="mb-4 flex gap-2">
		<input
			type="search"
			bind:value={search}
			placeholder="جستجوی نام یا شماره..."
			class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
		/>
		<button
			onclick={() => (showAdd = true)}
			class="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			افزودن
		</button>
	</div>

	<!-- List -->
	{#if isLoading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-20 animate-pulse rounded-xl bg-gray-200"></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="rounded-xl bg-white p-12 text-center shadow-sm">
			<p class="text-gray-500">
				{search ? 'نتیجه‌ای یافت نشد' : 'هنوز کارمندی اضافه نشده است'}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each filtered as member (member.id)}
				<button
					onclick={() => handleEdit(member)}
					class="w-full rounded-xl border border-gray-200 bg-white p-4 text-right transition hover:border-blue-300"
				>
					<div class="flex items-center gap-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
							{member.name.charAt(0)}
						</div>

						<div class="flex-1">
							<div class="flex items-center gap-2">
								<p class="font-bold text-gray-900">{member.name}</p>
								{#if member.status !== 'active'}
									<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
										{member.status === 'inactive' ? 'غیرفعال' : 'معلق'}
									</span>
								{/if}
							</div>
							<p class="text-sm text-gray-500" dir="ltr">{member.phone}</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
									{member.roleName}
								</span>
							</div>
						</div>

						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
							<path d="M15 18l-6-6 6-6"/>
						</svg>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</main>

{#if showAdd}
	<AddMemberModal
		onClose={() => (showAdd = false)}
		onSuccess={() => {
			showAdd = false;
			management.loadMembers();
		}}
	/>
{/if}

{#if editingMember}
	<EditMemberModal
		member={editingMember}
		onClose={() => (editingMember = null)}
		onSuccess={() => {
			editingMember = null;
			management.loadMembers();
		}}
	/>
{/if}