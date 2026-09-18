import type { SeedTemplate } from './types.js';

export const DOCTOR_TEMPLATES: SeedTemplate[] = [
	{
		name: 'معاینه و نسخه',
		slug: 'doctor-examination',
		description: 'ثبت معاینه، تشخیص و نسخه',
		categorySlug: 'examination',
		roleSlug: 'doctor',
		sortOrder: 1,
		textTemplate:
			'مریض بنام {patientName} معاینه شد. وضعیت مریض: {condition}. تشخیص: {diagnosis} و نسخه: {prescription}.',
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
				required: true,
				sortOrder: 2
			},
			{
				key: 'diagnosis',
				type: 'textarea',
				label: 'تشخیص',
				required: true,
				sortOrder: 3
			},
			{
				key: 'prescription',
				type: 'textarea',
				label: 'نسخه',
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
				type: 'send_chat_message',
				sortOrder: 3,
				config: {
					type: 'operational'
				}
			}
		]
	}
];