import type { SeedTemplate } from './types.js';

export const DENTIST_TEMPLATES: SeedTemplate[] = [
	{
		name: 'خدمات دندان',
		slug: 'dentist-service',
		description: 'ثبت خدمات دندانپزشکی',
		categorySlug: 'dental',
		roleSlug: 'dentist',
		sortOrder: 1,
		textTemplate:
			'مریض بنام {patientName} در بخش دندان معاینه شد. خدمات انجام‌شده: {service}. مبلغ {amount} افغانی دریافت شد.',
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
					{ value: 'checkup', label: 'معاینه' },
					{ value: 'cleaning', label: 'جرم‌گیری' },
					{ value: 'filling', label: 'پرکردن' },
					{ value: 'extraction', label: 'کشیدن دندان' },
					{ value: 'root_canal', label: 'عصب‌کشی' }
				]
			},
			{
				key: 'description',
				type: 'textarea',
				label: 'توضیحات',
				required: false,
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
					categorySlug: 'dental'
				}
			},
			{
				type: 'create_record_step',
				sortOrder: 2,
				config: {
					categorySlug: 'dental'
				}
			}
		]
	}
];