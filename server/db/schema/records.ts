import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { organizations, users, categories, roles } from './core';

// ═══════════════════════════════════════════════
// Workflows
// ═══════════════════════════════════════════════

export const workflows = sqliteTable('workflows', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	categoryId: text('category_id')
		.references(() => categories.id, { onDelete: 'set null' }),
	
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description'),
	
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgSlugIdx: uniqueIndex('workflows_org_slug_idx').on(table.organizationId, table.slug),
	orgIdx: index('workflows_org_idx').on(table.organizationId)
}));

// ═══════════════════════════════════════════════
// Workflow Steps
// ═══════════════════════════════════════════════

export const workflowSteps = sqliteTable('workflow_steps', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	workflowId: text('workflow_id').notNull()
		.references(() => workflows.id, { onDelete: 'cascade' }),
	
	stepOrder: integer('step_order').notNull(),
	categoryId: text('category_id').notNull()
		.references(() => categories.id, { onDelete: 'restrict' }),
	roleId: text('role_id')
		.references(() => roles.id, { onDelete: 'set null' }),
	templateId: text('template_id'),
	
	name: text('name').notNull(),
	description: text('description'),
	
	condition: text('condition', { mode: 'json' }).$type<Record<string, unknown>>(),
	isTerminal: integer('is_terminal', { mode: 'boolean' }).notNull().default(false),
	isOptional: integer('is_optional', { mode: 'boolean' }).notNull().default(false),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	workflowOrderIdx: uniqueIndex('workflow_steps_order_idx').on(table.workflowId, table.stepOrder),
	workflowIdx: index('workflow_steps_workflow_idx').on(table.workflowId)
}));

// ═══════════════════════════════════════════════
// Records (Cases)
// ═══════════════════════════════════════════════

export const records = sqliteTable('records', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	
	workflowId: text('workflow_id')
		.references(() => workflows.id, { onDelete: 'set null' }),
	currentStepId: text('current_step_id')
		.references(() => workflowSteps.id, { onDelete: 'set null' }),
	
	referenceCode: text('reference_code').notNull(),
	status: text('status').notNull().default('waiting'), // waiting, in_progress, completed, cancelled
	
	assignedToRoleId: text('assigned_to_role_id')
		.references(() => roles.id, { onDelete: 'set null' }),
	assignedToUserId: text('assigned_to_user_id')
		.references(() => users.id, { onDelete: 'set null' }),
	
	// برای Privacy
	visibleToRoles: text('visible_to_roles', { mode: 'json' }).$type<string[]>(),
	visibleToUsers: text('visible_to_users', { mode: 'json' }).$type<string[]>(),
	
	// داده Structured
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
	
	createdBy: text('created_by').notNull()
		.references(() => users.id, { onDelete: 'restrict' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	completedAt: integer('completed_at', { mode: 'timestamp' })
}, (table) => ({
	orgRefIdx: uniqueIndex('records_org_ref_idx').on(table.organizationId, table.referenceCode),
	orgStatusIdx: index('records_org_status_idx').on(table.organizationId, table.status),
	orgCreatedIdx: index('records_org_created_idx').on(table.organizationId, table.createdAt),
	assignedRoleIdx: index('records_assigned_role_idx').on(table.assignedToRoleId),
	assignedUserIdx: index('records_assigned_user_idx').on(table.assignedToUserId)
}));

// ═══════════════════════════════════════════════
// Record Steps (Visits)
// ═══════════════════════════════════════════════

export const recordSteps = sqliteTable('record_steps', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	recordId: text('record_id').notNull()
		.references(() => records.id, { onDelete: 'cascade' }),
	stepId: text('step_id')
		.references(() => workflowSteps.id, { onDelete: 'set null' }),
	categoryId: text('category_id').notNull()
		.references(() => categories.id, { onDelete: 'restrict' }),
	
	status: text('status').notNull().default('in_progress'), // in_progress, completed, cancelled
	data: text('data', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
	
	visibleToRole: text('visible_to_role'),
	
	startedAt: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	completedBy: text('completed_by')
		.references(() => users.id, { onDelete: 'set null' })
}, (table) => ({
	recordIdx: index('record_steps_record_idx').on(table.recordId),
	categoryIdx: index('record_steps_category_idx').on(table.categoryId),
	statusIdx: index('record_steps_status_idx').on(table.status)
}));

// ═══════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [workflows.organizationId],
		references: [organizations.id]
	}),
	category: one(categories, {
		fields: [workflows.categoryId],
		references: [categories.id]
	}),
	steps: many(workflowSteps)
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
	workflow: one(workflows, {
		fields: [workflowSteps.workflowId],
		references: [workflows.id]
	}),
	category: one(categories, {
		fields: [workflowSteps.categoryId],
		references: [categories.id]
	}),
	role: one(roles, {
		fields: [workflowSteps.roleId],
		references: [roles.id]
	})
}));

export const recordsRelations = relations(records, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [records.organizationId],
		references: [organizations.id]
	}),
	workflow: one(workflows, {
		fields: [records.workflowId],
		references: [workflows.id]
	}),
	currentStep: one(workflowSteps, {
		fields: [records.currentStepId],
		references: [workflowSteps.id]
	}),
	assignedToRole: one(roles, {
		fields: [records.assignedToRoleId],
		references: [roles.id]
	}),
	assignedToUser: one(users, {
		fields: [records.assignedToUserId],
		references: [users.id]
	}),
	createdByUser: one(users, {
		fields: [records.createdBy],
		references: [users.id]
	}),
	steps: many(recordSteps)
}));

export const recordStepsRelations = relations(recordSteps, ({ one }) => ({
	record: one(records, {
		fields: [recordSteps.recordId],
		references: [records.id]
	}),
	step: one(workflowSteps, {
		fields: [recordSteps.stepId],
		references: [workflowSteps.id]
	}),
	category: one(categories, {
		fields: [recordSteps.categoryId],
		references: [categories.id]
	}),
	completedByUser: one(users, {
		fields: [recordSteps.completedBy],
		references: [users.id]
	})
}));