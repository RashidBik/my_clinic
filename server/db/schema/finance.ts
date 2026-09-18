import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { organizations, users, categories } from './core';
import { records } from './records';

// ═══════════════════════════════════════════════
// Payments
// ═══════════════════════════════════════════════

export const payments = sqliteTable('payments', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	recordId: text('record_id')
		.references(() => records.id, { onDelete: 'set null' }),
	categoryId: text('category_id')
		.references(() => categories.id, { onDelete: 'set null' }),
	
	amount: real('amount').notNull(),
	currency: text('currency').notNull().default('AFN'),
	paymentMethod: text('payment_method').notNull().default('cash'), // cash, card, credit, online
	
	description: text('description'),
	
	createdBy: text('created_by').notNull()
		.references(() => users.id, { onDelete: 'restrict' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgCreatedIdx: index('payments_org_created_idx').on(table.organizationId, table.createdAt),
	recordIdx: index('payments_record_idx').on(table.recordId),
	categoryIdx: index('payments_category_idx').on(table.categoryId),
	methodIdx: index('payments_method_idx').on(table.paymentMethod)
}));

// ═══════════════════════════════════════════════
// Expenses
// ═══════════════════════════════════════════════

export const expenses = sqliteTable('expenses', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	categoryId: text('category_id')
		.references(() => categories.id, { onDelete: 'set null' }),
	
	amount: real('amount').notNull(),
	currency: text('currency').notNull().default('AFN'),
	
	description: text('description').notNull(),
	notes: text('notes'),
	
	createdBy: text('created_by').notNull()
		.references(() => users.id, { onDelete: 'restrict' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgCreatedIdx: index('expenses_org_created_idx').on(table.organizationId, table.createdAt),
	categoryIdx: index('expenses_category_idx').on(table.categoryId)
}));

// ═══════════════════════════════════════════════
// Debts
// ═══════════════════════════════════════════════

export const debts = sqliteTable('debts', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	recordId: text('record_id')
		.references(() => records.id, { onDelete: 'set null' }),
	
	amount: real('amount').notNull(),
	currency: text('currency').notNull().default('AFN'),
	paidAmount: real('paid_amount').notNull().default(0),
	
	creditorName: text('creditor_name'),
	creditorPhone: text('creditor_phone'),
	description: text('description'),
	
	status: text('status').notNull().default('unpaid'), // unpaid, partial, paid, cancelled
	dueDate: integer('due_date', { mode: 'timestamp' }),
	
	createdBy: text('created_by').notNull()
		.references(() => users.id, { onDelete: 'restrict' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgStatusIdx: index('debts_org_status_idx').on(table.organizationId, table.status),
	recordIdx: index('debts_record_idx').on(table.recordId)
}));

// ═══════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════

export const paymentsRelations = relations(payments, ({ one }) => ({
	organization: one(organizations, {
		fields: [payments.organizationId],
		references: [organizations.id]
	}),
	record: one(records, {
		fields: [payments.recordId],
		references: [records.id]
	}),
	category: one(categories, {
		fields: [payments.categoryId],
		references: [categories.id]
	}),
	createdByUser: one(users, {
		fields: [payments.createdBy],
		references: [users.id]
	})
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
	organization: one(organizations, {
		fields: [expenses.organizationId],
		references: [organizations.id]
	}),
	category: one(categories, {
		fields: [expenses.categoryId],
		references: [categories.id]
	}),
	createdByUser: one(users, {
		fields: [expenses.createdBy],
		references: [users.id]
	})
}));

export const debtsRelations = relations(debts, ({ one }) => ({
	organization: one(organizations, {
		fields: [debts.organizationId],
		references: [organizations.id]
	}),
	record: one(records, {
		fields: [debts.recordId],
		references: [records.id]
	}),
	createdByUser: one(users, {
		fields: [debts.createdBy],
		references: [users.id]
	})
}));