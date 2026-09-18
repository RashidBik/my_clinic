import type { SeedTemplate } from './types.js';

export const RECEPTION_TEMPLATES: SeedTemplate[] = [
	{
		name: 'ثبت بیمار و پرداخت',
		slug: 'reception-register-payment',
		description: 'ثبت بیمار جدید در پذیرش همراه با پرداخت',
		categorySlug: 'reception',
		roleSlug: 'reception',
		sortOrder: 1,
		textTemplate:
			'مریض بنام {patientName} در بخش {department} مبلغ {amount} افغانی را به‌صورت {paymentMethod} پرداخت کرد و {consumedItems} مصرف شد.',
		fields: [
			{
				key: 'patientName',
				type: 'text',
				label: 'نام مریض',
				placeholder: 'مثلاً: محمد علی',
				required: true,
				sortOrder: 1,
				validation: { minLength: 2, maxLength: 100 }
			},
			{
				key: 'department',
				type: 'select',
				label: 'بخش',
				required: true,
				sortOrder: 2,
				options: [
					{ value: 'examination', label: 'معاینه' },
					{ value: 'dental', label: 'دندان' },
					{ value: 'maternity', label: 'قابله‌گی' },
					{ value: 'laboratory', label: 'آزمایشگاه' }
				],
				defaultValue: 'examination'
			},
			{
				key: 'amount',
				type: 'currency',
				label: 'مبلغ (افغانی)',
				required: true,
				sortOrder: 3,
				validation: { min: 0 }
			},
			{
				key: 'paymentMethod',
				type: 'select',
				label: 'روش پرداخت',
				required: true,
				sortOrder: 4,
				options: [
					{ value: 'cash', label: 'نقدی' },
					{ value: 'card', label: 'کارت' },
					{ value: 'credit', label: 'قرض' }
				],
				defaultValue: 'cash'
			},
			{
				key: 'consumedItems',
				type: 'inventory_picker',
				label: 'مواد مصرفی',
				required: false,
				sortOrder: 5
			}
		],
		actions: [
			{
				type: 'find_or_create_patient',
				sortOrder: 1,
				config: {
					nameField: 'patientName'
				}
			},
			{
				type: 'create_record',
				sortOrder: 2,
				config: {
					workflowSlug: 'general-patient-flow',
					categorySlug: 'reception'
				}
			},
			{
				type: 'create_payment',
				sortOrder: 3,
				config: {
					amountField: 'amount',
					methodField: 'paymentMethod',
					categorySlug: 'reception'
				}
			},
			{
				type: 'consume_inventory',
				sortOrder: 4,
				config: {
					itemsField: 'consumedItems'
				}
			},
			{
				type: 'assign_to_role',
				sortOrder: 5,
				config: {
					roleSlug: 'doctor'
				}
			},
			{
				type: 'update_record_status',
				sortOrder: 6,
				config: {
					status: 'waiting'
				}
			}
		]
	}
];