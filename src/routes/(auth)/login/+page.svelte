<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	
	let phone = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $derived(auth.isLoading);
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		
		try {
			await auth.login(phone, password);
			await goto('/chat');
		} catch (err) {
			error = err instanceof Error ? err.message : 'خطای ناشناخته';
		}
	}
</script>

<svelte:head>
	<title>ورود — سیستم مدیریت کلینیک</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
	<div class="w-full max-w-md">
		<!-- Logo / Header -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2v20M2 12h20"/>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900">سیستم مدیریت کلینیک</h1>
			<p class="mt-1 text-sm text-gray-600">برای ادامه وارد شوید</p>
		</div>
		
		<!-- Card -->
		<div class="rounded-2xl bg-white p-6 shadow-xl">
			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Error -->
				{#if error}
					<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
						{error}
					</div>
				{/if}
				
				<!-- Phone -->
				<div>
					<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">
						شماره تلفن
					</label>
					<input
						id="phone"
						type="tel"
						bind:value={phone}
						required
						placeholder="07XXXXXXXX"
						dir="ltr"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-wider focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
				
				<!-- Password -->
				<div>
					<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
						رمز عبور
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						placeholder="••••••••"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>
				
				<!-- Submit -->
				<button
					type="submit"
					disabled={isLoading}
					class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if isLoading}
						در حال ورود...
					{:else}
						ورود
					{/if}
				</button>
			</form>
		</div>
		
		<!-- Footer -->
		<p class="mt-6 text-center text-xs text-gray-500">
			نسخه ۰.۱.۰ — MVP
		</p>
	</div>
</div>