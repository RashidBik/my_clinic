import type { SeedTemplate } from './types.js';

export const LABORATORY_TEMPLATES: SeedTemplate[] = [
	{
		name: 'انجام آزمایش',
		slug: 'laboratory-test',
		description: 'ثبت آزمایش و نتیجه',
		categorySlug: 'laboratory',
		roleSlug: 'laboratory',
		sortOrder: 1,
		textTemplate:
			'برای مریض بنام {patientName} آزمایش {test} انجام شد. نتیجه: {result}. مبلغ {amount} افغانی دریافت شد.',
		fields: [
			{
				key: 'patientName',
				type: 'text',
				label: 'نام مریض',
				required: true,
				sortOrder: 1
			},
			{
				key: 'test',
				type: 'text',
				label: 'نام آزمایش',
				required: true,
				sortOrder: 2
			},
			{
				key: 'result',
				type: 'textarea',
				label: 'نتیجه',
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
					categorySlug: 'laboratory'
				}
			},
			{
				type: 'create_record_step',
				sortOrder: 2,
				config: {
					categorySlug: 'laboratory'
				}
			}
		]
	}
];