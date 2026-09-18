import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { organizations, categories, roles } from './core';

// ═══════════════════════════════════════════════
// Templates
// ═══════════════════════════════════════════════

export const templates = sqliteTable('templates', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	categoryId: text('category_id')
		.references(() => categories.id, { onDelete: 'set null' }),
	roleId: text('role_id')
		.references(() => roles.id, { onDelete: 'set null' }),
	
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description'),
	textTemplate: text('text_template').notNull(),
	
	fields: text('fields', { mode: 'json' }).$type<TemplateField[]>().notNull().default(sql`'[]'`),
	actions: text('actions', { mode: 'json' }).$type<TemplateAction[]>().notNull().default(sql`'[]'`),
	
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	version: integer('version').notNull().default(1),
	sortOrder: integer('sort_order').notNull().default(0),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgSlugIdx: uniqueIndex('templates_org_slug_idx').on(table.organizationId, table.slug),
	orgIdx: index('templates_org_idx').on(table.organizationId),
	roleIdx: index('templates_role_idx').on(table.roleId),
	categoryIdx: index('templates_category_idx').on(table.categoryId)
}));

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

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
	type: TemplateActionType;
	config: Record<string, unknown>;
	sortOrder: number;
}

export type TemplateActionType =
	| 'find_or_create_patient'
	| 'create_record'
	| 'create_record_step'
	| 'create_payment'
	| 'create_expense'
	| 'consume_inventory'
	| 'increment_inventory'
	| 'update_record_status'
	| 'send_chat_message'
	| 'assign_to_role'
	| 'assign_to_user'
	| 'create_audit_log';

export const templatesRelations = relations(templates, ({ one }) => ({
	organization: one(organizations, {
		fields: [templates.organizationId],
		references: [organizations.id]
	}),
	category: one(categories, {
		fields: [templates.categoryId],
		references: [categories.id]
	}),
	role: one(roles, {
		fields: [templates.roleId],
		references: [roles.id]
	})
}));