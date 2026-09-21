import type { SeedTemplate } from './types.js';

// ═══════════════════════════════════════════════
// CLINIC TEMPLATES — همه Templateهای کلینیک
// ═══════════════════════════════════════════════

export const CLINIC_TEMPLATES: SeedTemplate[] = [
	// ═══════════════════════════════════════════════
	// 1. Reception — ثبت بیمار و پرداخت
	// ═══════════════════════════════════════════════
	{
		name: 'ثبت بیمار و پرداخت',
		slug: 'reception-register',
		description: 'ثبت بیمار جدید در پذیرش همراه با پرداخت اولیه',
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
				label: 'مواد مصرفی (اختیاری)',
				required: false,
				sortOrder: 5
			}
		],
		actions: [
			{
				type: 'create_record',
				sortOrder: 1,
				config: {
					workflowSlug: 'general-patient-flow',
					categorySlug: 'reception'
				}
			},
			{
				type: 'create_record_step',
				sortOrder: 2,
				config: {
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
	},

	// ═══════════════════════════════════════════════
	// 2. Doctor — معاینه و نسخه
	// ═══════════════════════════════════════════════
	{
		name: 'معاینه و نسخه',
		slug: 'doctor-examination',
		description: 'ثبت معاینه، تشخیص و نسخه',
		categorySlug: 'examination',
		roleSlug: 'doctor',
		sortOrder: 1,
		textTemplate:
			'مریض بنام {patientName} معاینه شد. وضعیت: {condition}. تشخیص: {diagnosis}. نسخه: {prescription}.',
		fields: [
			{
				key: 'patientName',
				type: 'text',
				label: 'نام مریض',
				required: true,
				sortOrder: 1
			},
			{
				key: 'condition',
				type: 'textarea',
				label: 'وضعیت مریض',
				placeholder: 'مثلاً: تب و سرفه',
				required: true,
				sortOrder: 2
			},
			{
				key: 'diagnosis',
				type: 'textarea',
				label: 'تشخیص',
				placeholder: 'مثلاً: سرماخوردگی',
				required: true,
				sortOrder: 3
			},
			{
				key: 'prescription',
				type: 'textarea',
				label: 'نسخه',
				placeholder: 'مثلاً: پاراستامول ۵۰۰ میلی‌گرم هر ۸ ساعت',
				required: false,
				sortOrder: 4
			}
		],
		actions: [
			{
				type: 'create_record_step',
				sortOrder: 1,
				config: {
					categorySlug: 'examination'
				}
			},
			{
				type: 'assign_to_role',
				sortOrder: 2,
				config: {
					roleSlug: 'pharmacy'
				}
			},
			{
				type: 'update_record_status',
				sortOrder: 3,
				config: {
					status: 'in_progress'
				}
			}
		]
	},

	// ═══════════════════════════════════════════════
	// 3. Pharmacy — فروش دارو
	// ═══════════════════════════════════════════════
	{
		name: 'فروش دارو',
		slug: 'pharmacy-sale',
		description: 'فروش دارو به مریض',
		categorySlug: 'pharmacy',
		roleSlug: 'pharmacy',
		sortOrder: 1,
		textTemplate:
			'برای مریض {patientName} تعداد {quantity} عدد {medicine} به مبلغ {amount} افغانی فروخته شد. پرداخت: {paymentMethod}.',
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
				type: 'text',
				label: 'نام دارو',
				placeholder: 'مثلاً: پاراستامول',
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
				sortOrder: 4,
				validation: { min: 0 }
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
				type: 'create_payment',
				sortOrder: 1,
				config: {
					amountField: 'amount',
					methodField: 'paymentMethod',
					categorySlug: 'pharmacy'
				}
			},
			{
				type: 'create_record_step',
				sortOrder: 2,
				config: {
					categorySlug: 'pharmacy'
				}
			},
			{
				type: 'update_record_status',
				sortOrder: 3,
				config: {
					status: 'completed'
				}
			}
		]
	},

	// ═══════════════════════════════════════════════
	// 4. Laboratory — انجام آزمایش
	// ═══════════════════════════════════════════════
	{
		name: 'انجام آزمایش',
		slug: 'laboratory-test',
		description: 'ثبت آزمایش و نتیجه',
		categorySlug: 'laboratory',
		roleSlug: 'laboratory',
		sortOrder: 1,
		textTemplate:
			'برای مریض {patientName} آزمایش {test} انجام شد. نتیجه: {result}. مبلغ {amount} افغانی دریافت شد.',
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
				placeholder: 'مثلاً: CBC',
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
	},

	// ═══════════════════════════════════════════════
	// 5. Midwife — خدمات قابله‌گی
	// ═══════════════════════════════════════════════
	{
		name: 'خدمات قابله‌گی',
		slug: 'midwife-service',
		description: 'ثبت خدمات قابله‌گی',
		categorySlug: 'maternity',
		roleSlug: 'midwife',
		sortOrder: 1,
		textTemplate:
			'برای مریض بنام {patientName} خدمات قابله‌گی {service} انجام شد. وضعیت: {condition}. مبلغ {amount} افغانی دریافت شد.',
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
	},

	// ═══════════════════════════════════════════════
	// 6. Dentist — خدمات دندان
	// ═══════════════════════════════════════════════
	{
		name: 'خدمات دندان',
		slug: 'dentist-service',
		description: 'ثبت خدمات دندانپزشکی',
		categorySlug: 'dental',
		roleSlug: 'dentist',
		sortOrder: 1,
		textTemplate:
			'مریض بنام {patientName} در بخش دندان معاینه شد. خدمات: {service}. مبلغ {amount} افغانی دریافت شد.',
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