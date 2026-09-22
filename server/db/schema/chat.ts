import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { organizations, users } from './core';
import { records } from './records';
import { templates } from './templates';
import { roles } from './core';  // ← اضافه

// ═══════════════════════════════════════════════
// Chat Messages
// ═══════════════════════════════════════════════

export const chatMessages = sqliteTable('chat_messages', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	senderId: text('sender_id').notNull()
		.references(() => users.id, { onDelete: 'restrict' }),
	
	messageType: text('message_type').notNull(), // normal, operational, system
	content: text('content').notNull(),
	
	// اگر Operational باشد:
	recordId: text('record_id')
		.references(() => records.id, { onDelete: 'set null' }),
	templateId: text('template_id')
		.references(() => templates.id, { onDelete: 'set null' }),
	templateData: text('template_data', { mode: 'json' }).$type<Record<string, unknown>>(),
		// ⭐ فیلدهای جدید
	nextRoleId: text('next_role_id')
		.references(() => roles.id, { onDelete: 'set null' }),
	recordStatus: text('record_status'), // waiting, in_progress, completed, cancelled
	referenceCode: text('reference_code'),
	// برای نمایش سریع
	visibleToRoles: text('visible_to_roles', { mode: 'json' }).$type<string[]>(),
	
	editedAt: integer('edited_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgCreatedIdx: index('chat_org_created_idx').on(table.organizationId, table.createdAt),
	recordIdx: index('chat_record_idx').on(table.recordId),
	senderIdx: index('chat_sender_idx').on(table.senderId)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	organization: one(organizations, {
		fields: [chatMessages.organizationId],
		references: [organizations.id]
	}),
	sender: one(users, {
		fields: [chatMessages.senderId],
		references: [users.id]
	}),
	record: one(records, {
		fields: [chatMessages.recordId],
		references: [records.id]
	}),
	template: one(templates, {
		fields: [chatMessages.templateId],
		references: [templates.id]
	}),
		nextRole: one(roles, {   // ← اضافه
		fields: [chatMessages.nextRoleId],
		references: [roles.id]
	})
}));