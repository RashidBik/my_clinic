<script lang="ts">
	import { format } from 'date-fns-jalali';
	import { faIR } from 'date-fns-jalali/locale';
	import { z } from 'zod';
	import { nanoid } from 'nanoid';
	import { ChevronLeft } from 'lucide-svelte';
	
	const today = new Date();
	const shamsiDate = format(today, 'yyyy/MM/dd', { locale: faIR });
	const testId = nanoid(8);
	
	// Zod Test
	const TestSchema = z.object({
		name: z.string().min(1),
		age: z.number().positive()
	});
	
	const testResult = TestSchema.safeParse({ name: 'محمد', age: 25 });
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
		<h1 class="text-2xl font-bold text-gray-900">
			سیستم مدیریت کلینیک
		</h1>
		
		<div class="space-y-2 text-sm text-gray-600">
			<p>📅 تاریخ امروز: <span class="font-bold">{shamsiDate}</span></p>
			<p>🔑 ID تست: <span class="font-mono">{testId}</span></p>
			<p>✅ Zod: <span class="font-bold">{testResult.success ? 'کار می‌کند' : 'خطا'}</span></p>
		</div>
		
		<button class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
			<ChevronLeft size={16} />
			<span>دکمه تست</span>
		</button>
	</div>
</div>