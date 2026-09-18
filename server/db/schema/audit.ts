import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { organizations, users } from './core';

// ═══════════════════════════════════════════════
// Audit Logs
// ═══════════════════════════════════════════════

export const auditLogs = sqliteTable('audit_logs', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'set null' }),
	
	action: text('action').notNull(), // create, update, delete, cancel, reverse
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	
	oldValue: text('old_value', { mode: 'json' }).$type<Record<string, unknown>>(),
	newValue: text('new_value', { mode: 'json' }).$type<Record<string, unknown>>(),
	
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgCreatedIdx: index('audit_logs_org_created_idx').on(table.organizationId, table.createdAt),
	entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
	userIdx: index('audit_logs_user_idx').on(table.userId),
	actionIdx: index('audit_logs_action_idx').on(table.action)
}));

// ═══════════════════════════════════════════════
// Operations (Idempotency)
// ═══════════════════════════════════════════════

export const operations = sqliteTable('operations', {
	id: text('id').primaryKey(), // client_operation_id (UUID)
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	
	result: text('result', { mode: 'json' }).$type<Record<string, unknown>>(),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	userIdx: index('operations_user_idx').on(table.userId),
	createdIdx: index('operations_created_idx').on(table.createdAt)
}));

// ═══════════════════════════════════════════════
// Push Subscriptions
// ═══════════════════════════════════════════════

export const pushSubscriptions = sqliteTable('push_subscriptions', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	
	endpoint: text('endpoint').notNull().unique(),
	keys: text('keys', { mode: 'json' }).$type<{ p256dh: string; auth: string }>().notNull(),
	
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	lastUsedAt: integer('last_used_at', { mode: 'timestamp' })
}, (table) => ({
	userIdx: index('push_subs_user_idx').on(table.userId)
}));

// ═══════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	organization: one(organizations, {
		fields: [auditLogs.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	})
}));

export const operationsRelations = relations(operations, ({ one }) => ({
	organization: one(organizations, {
		fields: [operations.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [operations.userId],
		references: [users.id]
	})
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	})
}));