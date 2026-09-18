import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { organizations, users, categories } from './core';
import { records } from './records';

// ═══════════════════════════════════════════════
// Inventory Items
// ═══════════════════════════════════════════════

export const inventoryItems = sqliteTable('inventory_items', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	categoryId: text('category_id')
		.references(() => categories.id, { onDelete: 'set null' }),
	
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description'),
	unit: text('unit').notNull().default('عدد'), // عدد، بسته، گرم، ...
	
	quantity: real('quantity').notNull().default(0),
	minimumStock: real('minimum_stock').notNull().default(0),
	
	purchasePrice: real('purchase_price'),
	salePrice: real('sale_price'),
	
	// برای Pharmacy
	batchNumber: text('batch_number'),
	expiryDate: integer('expiry_date', { mode: 'timestamp' }),
	supplier: text('supplier'),
	
	// برای انعطاف
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
	
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgSlugIdx: uniqueIndex('inventory_items_org_slug_idx').on(table.organizationId, table.slug),
	orgIdx: index('inventory_items_org_idx').on(table.organizationId),
	categoryIdx: index('inventory_items_category_idx').on(table.categoryId),
	expiryIdx: index('inventory_items_expiry_idx').on(table.expiryDate)
}));

// ═══════════════════════════════════════════════
// Inventory Transactions
// ═══════════════════════════════════════════════

export const inventoryTransactions = sqliteTable('inventory_transactions', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	organizationId: text('organization_id').notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	itemId: text('item_id').notNull()
		.references(() => inventoryItems.id, { onDelete: 'restrict' }),
	
	type: text('type').notNull(), // purchase, sale, consume, adjust, return
	quantity: real('quantity').notNull(), // + یا -
	
	unitPrice: real('unit_price'),
	totalPrice: real('total_price'),
	
	recordId: text('record_id')
		.references(() => records.id, { onDelete: 'set null' }),
	
	notes: text('notes'),
	userId: text('user_id').notNull()
		.references(() => users.id, { onDelete: 'restrict' }),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	orgCreatedIdx: index('inventory_tx_org_created_idx').on(table.organizationId, table.createdAt),
	itemIdx: index('inventory_tx_item_idx').on(table.itemId),
	recordIdx: index('inventory_tx_record_idx').on(table.recordId),
	typeIdx: index('inventory_tx_type_idx').on(table.type)
}));

// ═══════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [inventoryItems.organizationId],
		references: [organizations.id]
	}),
	category: one(categories, {
		fields: [inventoryItems.categoryId],
		references: [categories.id]
	}),
	transactions: many(inventoryTransactions)
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
	organization: one(organizations, {
		fields: [inventoryTransactions.organizationId],
		references: [organizations.id]
	}),
	item: one(inventoryItems, {
		fields: [inventoryTransactions.itemId],
		references: [inventoryItems.id]
	}),
	record: one(records, {
		fields: [inventoryTransactions.recordId],
		references: [records.id]
	}),
	user: one(users, {
		fields: [inventoryTransactions.userId],
		references: [users.id]
	})
}));