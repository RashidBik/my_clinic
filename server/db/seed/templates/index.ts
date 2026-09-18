import { RECEPTION_TEMPLATES } from './reception.js';
import { DOCTOR_TEMPLATES } from './doctor.js';
import { PHARMACY_TEMPLATES } from './pharmacy.js';
import { LABORATORY_TEMPLATES } from './laboratory.js';
import { MIDWIFE_TEMPLATES } from './midwife.js';
import { DENTIST_TEMPLATES } from './dentist.js';

export const CLINIC_TEMPLATES = [
	...RECEPTION_TEMPLATES,
	...DOCTOR_TEMPLATES,
	...PHARMACY_TEMPLATES,
	...LABORATORY_TEMPLATES,
	...MIDWIFE_TEMPLATES,
	...DENTIST_TEMPLATES
];

export type { SeedTemplate } from './types.js';