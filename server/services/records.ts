import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { records, recordSteps, workflows } from '../db/schema/records.js';
import { templates } from '../db/schema/templates.js';
import { users, roles, categories } from '../db/schema/core.js';
import { payments } from '../db/schema/finance.js'; 
import { inventoryTransactions, inventoryItems } from '../db/schema/inventory.js';
// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface RecordListItem {
	id: string;
	referenceCode: string;
	status: string;
	createdAt: Date;
	createdBy: {
		id: string;
		name: string;
	};
	currentCategory: {
		id: string;
		name: string;
		slug: string;
		color: string | null;
	} | null;
	assignedToRole: {
		id: string;
		name: string;
		slug: string;
	} | null;
}

export interface RecordDetail {
	id: string;
	referenceCode: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
	metadata: Record<string, unknown>;
	createdBy: {
		id: string;
		name: string;
	};
	assignedToRole: {
		id: string;
		name: string;
		slug: string;
	} | null;
	steps: Array<{
		id: string;
		categoryId: string;
		categoryName: string;
		categorySlug: string;
		status: string;
		data: Record<string, unknown>;
		startedAt: Date;
		completedAt: Date | null;
		completedBy: string | null;
	}>;
	payments: Array<{
		id: string;
		amount: number;
		currency: string;
		paymentMethod: string;
		description: string | null;
		createdAt: Date;
		createdBy: string;
	}>;
	inventoryTransactions: Array<{
		id: string;
		itemName: string;
		type: string;
		quantity: number;
		createdAt: Date;
	}>;
}

// ═══════════════════════════════════════════════
// List Records (با Privacy Filter)
// ═══════════════════════════════════════════════

export async function listRecords(options: {
	organizationId: string;
	userId: string;
	roleId: string;
	baseRole: string;
	limit?: number;
	status?: string;
}): Promise<RecordListItem[]> {
	const limit = Math.min(options.limit ?? 50, 100);

	// Managers همه را می‌بینند، بقیه فقط آن‌چه به آن‌ها assign شده
	const conditions = [eq(records.organizationId, options.organizationId)];

	if (options.baseRole !== 'manager') {
		// Manager نباشی → فقط Assign‌شده به Role خودت
		conditions.push(eq(records.assignedToRoleId, options.roleId));
	}

	if (options.status) {
		conditions.push(eq(records.status, options.status));
	}

	const rows = await db
		.select({
			record: records,
			creator: users,
			role: roles
		})
		.from(records)
		.leftJoin(users, eq(records.createdBy, users.id))
		.leftJoin(roles, eq(records.assignedToRoleId, roles.id))
		.where(and(...conditions))
		.orderBy(desc(records.createdAt))
		.limit(limit);

	return rows.map((row) => ({
		id: row.record.id,
		referenceCode: row.record.referenceCode,
		status: row.record.status,
		createdAt: row.record.createdAt,
		createdBy: {
			id: row.creator?.id ?? '',
			name: row.creator?.name ?? 'نامشخص'
		},
		currentCategory: null, // TODO: Join با workflowSteps و categories
		assignedToRole: row.role
			? {
					id: row.role.id,
					name: row.role.name,
					slug: row.role.slug
				}
			: null
	}));
}

// ═══════════════════════════════════════════════
// Get Record Detail
// ═══════════════════════════════════════════════

export async function getRecord(
	recordId: string,
	options: {
		organizationId: string;
		userId: string;
		roleId: string;
		baseRole: string;
	}
): Promise<RecordDetail | null> {
	const [record] = await db
		.select({
			record: records,
			creator: users,
			role: roles
		})
		.from(records)
		.leftJoin(users, eq(records.createdBy, users.id))
		.leftJoin(roles, eq(records.assignedToRoleId, roles.id))
		.where(
			and(
				eq(records.id, recordId),
				eq(records.organizationId, options.organizationId)
			)
		)
		.limit(1);

	if (!record) return null;

	// Permission: Manager، یا creator، یا assign‌شده
	const isAllowed =
		options.baseRole === 'manager' ||
		record.record.createdBy === options.userId ||
		record.record.assignedToRoleId === options.roleId;

	if (!isAllowed) {
		return null;
	}

	// Load steps
	const steps = await db
		.select({
			step: recordSteps,
			category: categories
		})
		.from(recordSteps)
		.leftJoin(categories, eq(recordSteps.categoryId, categories.id))
		.where(eq(recordSteps.recordId, recordId))
		.orderBy(recordSteps.startedAt);

			// Load Payments
	const paymentRows = await db
		.select()
		.from(payments)
		.where(eq(payments.recordId, recordId))
		.orderBy(payments.createdAt);

	// Load Inventory Transactions
	const txRows = await db
		.select({
			tx: inventoryTransactions,
			item: inventoryItems
		})
		.from(inventoryTransactions)
		.leftJoin(inventoryItems, eq(inventoryTransactions.itemId, inventoryItems.id))
		.where(eq(inventoryTransactions.recordId, recordId))
		.orderBy(inventoryTransactions.createdAt);


	return {
		id: record.record.id,
		referenceCode: record.record.referenceCode,
		status: record.record.status,
		createdAt: record.record.createdAt,
		updatedAt: record.record.updatedAt,
		completedAt: record.record.completedAt,
		metadata: (record.record.metadata as Record<string, unknown>) || {},
		createdBy: {
			id: record.creator?.id ?? '',
			name: record.creator?.name ?? 'نامشخص'
		},
		assignedToRole: record.role
			? {
					id: record.role.id,
					name: record.role.name,
					slug: record.role.slug
				}
			: null,
		steps: steps.map((s) => ({
			id: s.step.id,
			categoryId: s.step.categoryId,
			categoryName: s.category?.name ?? 'نامشخص',
			categorySlug: s.category?.slug ?? '',
			status: s.step.status,
			data: s.step.data as Record<string, unknown>,
			startedAt: s.step.startedAt,
			completedAt: s.step.completedAt,
			completedBy: s.step.completedBy
		})),
		payments: paymentRows.map((p) => ({
			id: p.id,
			amount: p.amount,
			currency: p.currency,
			paymentMethod: p.paymentMethod,
			description: p.description,
			createdAt: p.createdAt,
			createdBy: p.createdBy
		})),
		inventoryTransactions: txRows.map((row) => ({
			id: row.tx.id,
			itemName: row.item?.name ?? 'نامشخص',
			type: row.tx.type,
			quantity: row.tx.quantity,
			createdAt: row.tx.createdAt
		}))
	};
}