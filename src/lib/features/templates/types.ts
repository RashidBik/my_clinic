export interface TemplateField {
	key: string;
	type: TemplateFieldType;
	label: string;
	placeholder?: string;
	required?: boolean;
	defaultValue?: unknown;
	options?: Array<{ value: string; label: string }>;
	validation?: Record<string, unknown>;
	sortOrder: number;
}

export type TemplateFieldType =
	| 'text'
	| 'number'
	| 'currency'
	| 'select'
	| 'multiselect'
	| 'date'
	| 'datetime'
	| 'boolean'
	| 'textarea'
	| 'patient_picker'
	| 'user_picker'
	| 'product_picker'
	| 'inventory_picker';

export interface TemplateAction {
	type: string;
	config: Record<string, unknown>;
	sortOrder: number;
}

export interface Template {
	id: string;
	organizationId: string;
	categoryId: string | null;
	roleId: string | null;
	name: string;
	slug: string;
	description: string | null;
	textTemplate: string;
	fields: TemplateField[];
	actions: TemplateAction[];
	isActive: boolean;
	version: number;
	sortOrder: number;
}