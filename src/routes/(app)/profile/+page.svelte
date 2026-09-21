<script lang="ts">
	import { onMount } from 'svelte';
	import { profile } from '$lib/features/profile/store.svelte';
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte';
	import ProfileInfoCard from '$lib/components/profile/ProfileInfoCard.svelte';
	import ProfilePermissionsCard from '$lib/components/profile/ProfilePermissionsCard.svelte';
	import EditProfileModal from '$lib/components/profile/EditProfileModal.svelte';
	import ChangePasswordModal from '$lib/components/profile/ChangePasswordModal.svelte';

	let showEditProfile = $state(false);
	let showChangePassword = $state(false);

	const isLoading = $derived(profile.isLoading);
	const error = $derived(profile.error);

	onMount(() => {
		profile.load();
	});
</script>

<svelte:head>
	<title>پروفایل — سیستم مدیریت کلینیک</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b bg-white shadow-sm">
		<div class="flex items-center gap-3 px-4 py-3">
			<a
				href="/chat"
				class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</a>
			<h1 class="text-lg font-bold text-gray-900">پروفایل</h1>
		</div>
	</header>

	<!-- Content -->
	<main class="mx-auto max-w-2xl space-y-4 p-4">
		{#if isLoading}
			<div class="space-y-4">
				<div class="h-40 animate-pulse rounded-2xl bg-gray-200"></div>
				<div class="h-64 animate-pulse rounded-2xl bg-gray-200"></div>
			</div>
		{:else if error}
			<div class="rounded-2xl bg-red-50 p-6 text-center text-red-700">
				<p class="font-medium">خطا در بارگذاری</p>
				<p class="mt-1 text-sm">{error}</p>
				<button
					onclick={() => profile.load()}
					class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
				>
					تلاش مجدد
				</button>
			</div>
		{:else if profile.data}
			<ProfileHeader onEdit={() => (showEditProfile = true)} />
			<ProfileInfoCard />
			<ProfilePermissionsCard />

			<!-- Security Section -->
			<div class="rounded-2xl bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-base font-bold text-gray-900">امنیت</h2>
				<button
					onclick={() => (showChangePassword = true)}
					class="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
				>
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
							</svg>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium text-gray-900">تغییر رمز عبور</p>
							<p class="text-xs text-gray-500">رمز خود را به‌روز کنید</p>
						</div>
					</div>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6"/>
					</svg>
				</button>
			</div>

			<!-- About -->
			<div class="rounded-2xl bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-base font-bold text-gray-900">درباره</h2>
				<div class="space-y-2 text-sm text-gray-600">
					<p>نسخه: ۰.۱.۰ (MVP)</p>
					<p>ساخته شده با ❤️ برای کلینیک‌ها</p>
				</div>
			</div>
		{/if}
	</main>

	<!-- Modals -->
	<EditProfileModal
		isOpen={showEditProfile}
		onClose={() => (showEditProfile = false)}
	/>
	<ChangePasswordModal
		isOpen={showChangePassword}
		onClose={() => (showChangePassword = false)}
	/>
</div>