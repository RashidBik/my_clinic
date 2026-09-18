import type { TemplateField, TemplateAction } from '../../schema/templates.js';

export interface SeedTemplate {
	name: string;
	slug: string;
	description?: string;
	categorySlug?: string;
	roleSlug?: string;
	textTemplate: string;
	fields: TemplateField[];
	actions: TemplateAction[];
	sortOrder: number;
}