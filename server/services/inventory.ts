import { eq, and, desc, sql, lte, isNotNull, or, like } from 'drizzle-orm';
import { db, sqlite } from '../db/client.js';
import { createId } from '@paralleldrive/cuid2';
import { inventoryItems, inventoryTransactions } from '../db/schema/inventory.js';
import { users, categories } from '../db/schema/core.js';
import { records } from '../db/schema/records.js';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface InventoryItem {
	id: string;
	organizationId: string;
	categoryId: string | null;
	categoryName: string | null;
	name: string;
	slug: string;
	description: string | null;
	unit: string;
	quantity: number;
	minimumStock: number;
	purchasePrice: number | null;
	salePrice: number | null;
	batchNumber: string | null;
	expiryDate: Date | null;
	supplier: string | null;
	metadata: Record<string, unknown> | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface InventoryTransaction {
	id: string;
	itemId: string;
	itemName: string;
	type: string;
	quantity: number;
	unitPrice: number | null;
	totalPrice: number | null;
	recordId: string | null;
	notes: string | null;
	userId: string;
	userName: string;
	createdAt: Date;
}

export interface CreateItemInput {
	organizationId: string;
	userId: string;
	name: string;
	categoryId?: string;
	description?: string;
	unit?: string;
	quantity?: number;
	minimumStock?: number;
	purchasePrice?: number;
	salePrice?: number;
	batchNumber?: string;
	expiryDate?: Date;
	supplier?: string;
}

export interface UpdateItemInput {
	name?: string;
	categoryId?: string | null;
	description?: string | null;
	unit?: string;
	minimumStock?: number;
	purchasePrice?: number | null;
	salePrice?: number | null;
	batchNumber?: string | null;
	expiryDate?: Date | null;
	supplier?: string | null;
	isActive?: boolean;
}

export interface AdjustStockInput {
	organizationId: string;
	userId: string;
	itemId: string;
	type: 'purchase' | 'sale' | 'consume' | 'adjust' | 'return';
	quantity: number; // مثبت یا منفی
	unitPrice?: number;
	notes?: string;
}

export class InventoryError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode = 400
	) {
		super(message);
		this.name = 'InventoryError';
	}
}

// ═══════════════════════════════════════════════
// List Items
// ═══════════════════════════════════════════════

export async function listItems(options: {
	organizationId: string;
	search?: string;
	categoryId?: string;
	lowStockOnly?: boolean;
	limit?: number;
}): Promise<InventoryItem[]> {
	const limit = Math.min(options.limit ?? 200, 500);
	const conditions = [
		eq(inventoryItems.organizationId, options.organizationId),
		eq(inventoryItems.isActive, true)
	];

	if (options.search) {
		conditions.push(like(inventoryItems.name, `%${options.search}%`));
	}

	if (options.categoryId) {
		conditions.push(eq(inventoryItems.categoryId, options.categoryId));
	}

	if (options.lowStockOnly) {
		conditions.push(
			sql`${inventoryItems.quantity} <= ${inventoryItems.minimumStock}`
		);
	}

	const rows = await db
		.select({
			item: inventoryItems,
			category: categories
		})
		.from(inventoryItems)
		.leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
		.where(and(...conditions))
		.orderBy(inventoryItems.name)
		.limit(limit);

	return rows.map((row) => ({
		id: row.item.id,
		organizationId: row.item.organizationId,
		categoryId: row.item.categoryId,
		categoryName: row.category?.name ?? null,
		name: row.item.name,
		slug: row.item.slug,
		description: row.item.description,
		unit: row.item.unit,
		quantity: row.item.quantity,
		minimumStock: row.item.minimumStock,
		purchasePrice: row.item.purchasePrice,
		salePrice: row.item.salePrice,
		batchNumber: row.item.batchNumber,
		expiryDate: row.item.expiryDate,
		supplier: row.item.supplier,
		metadata: row.item.metadata as Record<string, unknown> | null,
		isActive: row.item.isActive,
		createdAt: row.item.createdAt,
		updatedAt: row.item.updatedAt
	}));
}

// ═══════════════════════════════════════════════
// Get Item
// ═══════════════════════════════════════════════

export async function getItem(
	itemId: string,
	organizationId: string
): Promise<InventoryItem | null> {
	const rows = await listItems({ organizationId, limit: 1 });
	const items = await db
		.select({
			item: inventoryItems,
			category: categories
		})
		.from(inventoryItems)
		.leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
		.where(
			and(
				eq(inventoryItems.id, itemId),
				eq(inventoryItems.organizationId, organizationId)
			)
		)
		.limit(1);

	if (items.length === 0) return null;
	const row = items[0]!;

	return {
		id: row.item.id,
		organizationId: row.item.organizationId,
		categoryId: row.item.categoryId,
		categoryName: row.category?.name ?? null,
		name: row.item.name,
		slug: row.item.slug,
		description: row.item.description,
		unit: row.item.unit,
		quantity: row.item.quantity,
		minimumStock: row.item.minimumStock,
		purchasePrice: row.item.purchasePrice,
		salePrice: row.item.salePrice,
		batchNumber: row.item.batchNumber,
		expiryDate: row.item.expiryDate,
		supplier: row.item.supplier,
		metadata: row.item.metadata as Record<string, unknown> | null,
		isActive: row.item.isActive,
		createdAt: row.item.createdAt,
		updatedAt: row.item.updatedAt
	};
}

// ═══════════════════════════════════════════════
// Create Item
// ═══════════════════════════════════════════════

export async function createItem(input: CreateItemInput): Promise<string> {
	// Check duplicate name
	const [existing] = await db
		.select()
		.from(inventoryItems)
		.where(
			and(
				eq(inventoryItems.organizationId, input.organizationId),
				eq(inventoryItems.name, input.name.trim()),
				eq(inventoryItems.isActive, true)
			)
		)
		.limit(1);

	if (existing) {
		throw new InventoryError('DUPLICATE_NAME', 'این نام قبلاً ثبت شده است', 400);
	}

	const id = createId();
	const slug = input.name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w\u0600-\u06FF-]/g, '');
	const now = new Date();

	db.insert(inventoryItems)
		.values({
			id,
			organizationId: input.organizationId,
			categoryId: input.categoryId,
			name: input.name.trim(),
			slug,
			description: input.description,
			unit: input.unit ?? 'عدد',
			quantity: input.quantity ?? 0,
			minimumStock: input.minimumStock ?? 0,
			purchasePrice: input.purchasePrice,
			salePrice: input.salePrice,
			batchNumber: input.batchNumber,
			expiryDate: input.expiryDate,
			supplier: input.supplier,
			isActive: true,
			createdAt: now,
			updatedAt: now
		})
		.run();

	// ثبت initial transaction اگر quantity > 0
	if (input.quantity && input.quantity > 0) {
		db.insert(inventoryTransactions)
			.values({
				id: createId(),
				organizationId: input.organizationId,
				itemId: id,
				type: 'purchase',
				quantity: input.quantity,
				unitPrice: input.purchasePrice,
				totalPrice: input.purchasePrice ? input.purchasePrice * input.quantity : null,
				notes: 'موجودی اولیه',
				userId: input.userId,
				createdAt: now
			})
			.run();
	}

	return id;
}

// ═══════════════════════════════════════════════
// Update Item
// ═══════════════════════════════════════════════

export async function updateItem(
	itemId: string,
	organizationId: string,
	input: UpdateItemInput
): Promise<void> {
	const updates: Record<string, unknown> = {
		updatedAt: new Date()
	};

	if (input.name !== undefined) updates.name = input.name.trim();
	if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
	if (input.description !== undefined) updates.description = input.description;
	if (input.unit !== undefined) updates.unit = input.unit;
	if (input.minimumStock !== undefined) updates.minimumStock = input.minimumStock;
	if (input.purchasePrice !== undefined) updates.purchasePrice = input.purchasePrice;
	if (input.salePrice !== undefined) updates.salePrice = input.salePrice;
	if (input.batchNumber !== undefined) updates.batchNumber = input.batchNumber;
	if (input.expiryDate !== undefined) updates.expiryDate = input.expiryDate;
	if (input.supplier !== undefined) updates.supplier = input.supplier;
	if (input.isActive !== undefined) updates.isActive = input.isActive;

	const result = db
		.update(inventoryItems)
		.set(updates)
		.where(
			and(
				eq(inventoryItems.id, itemId),
				eq(inventoryItems.organizationId, organizationId)
			)
		)
		.run();

	if (result.changes === 0) {
		throw new InventoryError('NOT_FOUND', 'آیتم یافت نشد', 404);
	}
}

// ═══════════════════════════════════════════════
// Adjust Stock
// ═══════════════════════════════════════════════

export async function adjustStock(input: AdjustStockInput): Promise<void> {
	const { organizationId, userId, itemId, type, quantity, unitPrice, notes } = input;

	// Load item
	const [item] = await db
		.select()
		.from(inventoryItems)
		.where(
			and(
				eq(inventoryItems.id, itemId),
				eq(inventoryItems.organizationId, organizationId)
			)
		)
		.limit(1);

	if (!item) {
		throw new InventoryError('NOT_FOUND', 'آیتم یافت نشد', 404);
	}

	// محاسبه مقدار جدید
	const newQuantity = item.quantity + quantity;

	if (newQuantity < 0) {
		throw new InventoryError(
			'INSUFFICIENT_STOCK',
			`موجودی کافی نیست. موجودی فعلی: ${item.quantity}`,
			400
		);
	}

	const now = new Date();
	const totalPrice = unitPrice ? Math.abs(quantity) * unitPrice : null;

	// Transaction
	sqlite.transaction(() => {
		db.update(inventoryItems)
			.set({
				quantity: newQuantity,
				updatedAt: now
			})
			.where(eq(inventoryItems.id, itemId))
			.run();

		db.insert(inventoryTransactions)
			.values({
				id: createId(),
				organizationId,
				itemId,
				type,
				quantity,
				unitPrice,
				totalPrice,
				notes,
				userId,
				createdAt: now
			})
			.run();
	})();
}

// ═══════════════════════════════════════════════
// List Transactions
// ═══════════════════════════════════════════════

export async function listTransactions(options: {
	organizationId: string;
	itemId?: string;
	type?: string;
	limit?: number;
}): Promise<InventoryTransaction[]> {
	const limit = Math.min(options.limit ?? 100, 500);
	const conditions = [eq(inventoryTransactions.organizationId, options.organizationId)];

	if (options.itemId) {
		conditions.push(eq(inventoryTransactions.itemId, options.itemId));
	}

	if (options.type) {
		conditions.push(eq(inventoryTransactions.type, options.type));
	}

	const rows = await db
		.select({
			tx: inventoryTransactions,
			item: inventoryItems,
			user: users
		})
		.from(inventoryTransactions)
		.leftJoin(inventoryItems, eq(inventoryTransactions.itemId, inventoryItems.id))
		.leftJoin(users, eq(inventoryTransactions.userId, users.id))
		.where(and(...conditions))
		.orderBy(desc(inventoryTransactions.createdAt))
		.limit(limit);

	return rows.map((row) => ({
		id: row.tx.id,
		itemId: row.tx.itemId,
		itemName: row.item?.name ?? 'نامشخص',
		type: row.tx.type,
		quantity: row.tx.quantity,
		unitPrice: row.tx.unitPrice,
		totalPrice: row.tx.totalPrice,
		recordId: row.tx.recordId,
		notes: row.tx.notes,
		userId: row.tx.userId,
		userName: row.user?.name ?? 'نامشخص',
		createdAt: row.tx.createdAt
	}));
}

// ═══════════════════════════════════════════════
// Alerts
// ═══════════════════════════════════════════════

export async function getLowStockItems(
	organizationId: string
): Promise<InventoryItem[]> {
	return listItems({ organizationId, lowStockOnly: true });
}

export async function getExpiringSoonItems(
	organizationId: string,
	daysAhead = 30
): Promise<InventoryItem[]> {
	const threshold = new Date();
	threshold.setDate(threshold.getDate() + daysAhead);

	const rows = await db
		.select({
			item: inventoryItems,
			category: categories
		})
		.from(inventoryItems)
		.leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
		.where(
			and(
				eq(inventoryItems.organizationId, organizationId),
				eq(inventoryItems.isActive, true),
				isNotNull(inventoryItems.expiryDate),
				lte(inventoryItems.expiryDate, threshold)
			)
		)
		.orderBy(inventoryItems.expiryDate);

	return rows.map((row) => ({
		id: row.item.id,
		organizationId: row.item.organizationId,
		categoryId: row.item.categoryId,
		categoryName: row.category?.name ?? null,
		name: row.item.name,
		slug: row.item.slug,
		description: row.item.description,
		unit: row.item.unit,
		quantity: row.item.quantity,
		minimumStock: row.item.minimumStock,
		purchasePrice: row.item.purchasePrice,
		salePrice: row.item.salePrice,
		batchNumber: row.item.batchNumber,
		expiryDate: row.item.expiryDate,
		supplier: row.item.supplier,
		metadata: row.item.metadata as Record<string, unknown> | null,
		isActive: row.item.isActive,
		createdAt: row.item.createdAt,
		updatedAt: row.item.updatedAt
	}));
}

// ═══════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════

export async function getInventoryStats(organizationId: string) {
	const items = await listItems({ organizationId });

	const lowStock = items.filter((i) => i.quantity <= i.minimumStock).length;
	const outOfStock = items.filter((i) => i.quantity === 0).length;
	const totalValue = items.reduce(
		(sum, i) => sum + i.quantity * (i.purchasePrice ?? 0),
		0
	);

	return {
		totalItems: items.length,
		lowStock,
		outOfStock,
		totalValue
	};
}