import type { SeedTemplate } from './types.js';

export const MIDWIFE_TEMPLATES: SeedTemplate[] = [
	{
		name: 'خدمات قابله‌گی',
		slug: 'midwife-service',
		description: 'ثبت خدمات قابله‌گی',
		categorySlug: 'maternity',
		roleSlug: 'midwife',
		sortOrder: 1,
		textTemplate:
			'برای مریض بنام {patientName} خدمات قابله‌گی {service} انجام شد. وضعیت مریض: {condition}. مبلغ {amount} افغانی دریافت شد.',
		fields: [
			{
				key: 'patientName',
				type: 'text',
				label: 'نام مریض',
				required: true,
				sortOrder: 1
			},
			{
				key: 'service',
				type: 'select',
				label: 'نوع خدمت',
				required: true,
				sortOrder: 2,
				options: [
					{ value: 'prenatal', label: 'مراقبت دوران بارداری' },
					{ value: 'delivery', label: 'زایمان' },
					{ value: 'postnatal', label: 'مراقبت پس از زایمان' },
					{ value: 'consultation', label: 'مشاوره' }
				]
			},
			{
				key: 'condition',
				type: 'textarea',
				label: 'وضعیت مریض',
				required: true,
				sortOrder: 3
			},
			{
				key: 'amount',
				type: 'currency',
				label: 'مبلغ (افغانی)',
				required: true,
				sortOrder: 4
			}
		],
		actions: [
			{
				type: 'create_payment',
				sortOrder: 1,
				config: {
					amountField: 'amount',
					categorySlug: 'maternity'
				}
			},
			{
				type: 'create_record_step',
				sortOrder: 2,
				config: {
					categorySlug: 'maternity'
				}
			}
		]
	}
];