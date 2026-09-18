import type { SeedTemplate } from './types.js';

export const PHARMACY_TEMPLATES: SeedTemplate[] = [
	{
		name: 'فروش دارو',
		slug: 'pharmacy-sale',
		description: 'فروش دارو به مریض',
		categorySlug: 'pharmacy',
		roleSlug: 'pharmacy',
		sortOrder: 1,
		textTemplate:
			'برای مریض بنام {patientName} تعداد {quantity} از داروی {medicine} به مبلغ {amount} افغانی فروخته شد و پرداخت به‌صورت {paymentMethod} انجام شد.',
		fields: [
			{
				key: 'patientName',
				type: 'text',
				label: 'نام مریض',
				required: true,
				sortOrder: 1
			},
			{
				key: 'medicine',
				type: 'product_picker',
				label: 'دارو',
				required: true,
				sortOrder: 2
			},
			{
				key: 'quantity',
				type: 'number',
				label: 'تعداد',
				required: true,
				sortOrder: 3,
				validation: { min: 1 }
			},
			{
				key: 'amount',
				type: 'currency',
				label: 'مبلغ کل (افغانی)',
				required: true,
				sortOrder: 4
			},
			{
				key: 'paymentMethod',
				type: 'select',
				label: 'روش پرداخت',
				required: true,
				sortOrder: 5,
				options: [
					{ value: 'cash', label: 'نقدی' },
					{ value: 'card', label: 'کارت' },
					{ value: 'credit', label: 'قرض' }
				],
				defaultValue: 'cash'
			}
		],
		actions: [
			{
				type: 'consume_inventory',
				sortOrder: 1,
				config: {
					itemField: 'medicine',
					quantityField: 'quantity'
				}
			},
			{
				type: 'create_payment',
				sortOrder: 2,
				config: {
					amountField: 'amount',
					methodField: 'paymentMethod',
					categorySlug: 'pharmacy'
				}
			},
			{
				type: 'create_record_step',
				sortOrder: 3,
				config: {
					categorySlug: 'pharmacy'
				}
			},
			{
				type: 'update_record_status',
				sortOrder: 4,
				config: {
					status: 'completed'
				}
			}
		]
	}
];