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
			'برای مریض {patientName} تعداد {quantity} از {medicineName} به مبلغ {amount} افغانی فروخته شد.',
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
				type: 'inventory_picker',
				label: 'دارو',
				required: true,
				sortOrder: 2,
				validation: {
					// فقط آیتم‌هایی با salePrice > 0 را نشان بده (فروشی)
					hasSalePrice: true
				}
			},
			{
				// این فیلد خودکار پر می‌شود توسط InventoryPicker
				key: 'medicineName',
				type: 'hidden',
				label: 'نام دارو',
				required: false,
				sortOrder: 3
			},
			{
				key: 'quantity',
				type: 'number',
				label: 'تعداد',
				required: true,
				sortOrder: 4,
				validation: { min: 1 }
			},
			{
				key: 'amount',
				type: 'currency',
				label: 'مبلغ کل (افغانی)',
				required: true,
				sortOrder: 5
			},
			{
				key: 'paymentMethod',
				type: 'select',
				label: 'روش پرداخت',
				required: true,
				sortOrder: 6,
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