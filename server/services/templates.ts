import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { templates } from '../db/schema/templates.js';
import { records } from '../db/schema/records.js';

// ═══════════════════════════════════════════════
// List Templates (by Role)
// ═══════════════════════════════════════════════

export async function listTemplates(options: {
	organizationId: string;
	roleId: string;
	baseRole: string;
}) {
	const conditions = [
		eq(templates.organizationId, options.organizationId),
		eq(templates.isActive, true)
	];

	if (options.baseRole !== 'manager') {
		conditions.push(eq(templates.roleId, options.roleId));
	}

	return db
		.select()
		.from(templates)
		.where(and(...conditions))
		.orderBy(templates.sortOrder);
}

// ═══════════════════════════════════════════════
// Get Templates for a Specific Record
// ═══════════════════════════════════════════════

export async function getAvailableTemplatesForRecord(options: {
	organizationId: string;
	recordId: string;
	userId: string;
	roleId: string;
	baseRole: string;
}) {
	// Load Record
	const [record] = await db
		.select()
		.from(records)
		.where(
			and(
				eq(records.id, options.recordId),
				eq(records.organizationId, options.organizationId)
			)
		)
		.limit(1);

	if (!record) return [];

	// Permission check
	const canAccess =
		options.baseRole === 'manager' ||
		record.createdBy === options.userId ||
		record.assignedToRoleId === options.roleId;

	if (!canAccess) return [];

	// اگر Record به Role خاصی Assign شده → فقط Templateهای آن Role
	const targetRoleId = record.assignedToRoleId ?? options.roleId;

	if (record.assignedToRoleId) {
		return db
			.select()
			.from(templates)
			.where(
				and(
					eq(templates.organizationId, options.organizationId),
					eq(templates.roleId, record.assignedToRoleId),
					eq(templates.isActive, true)
				)
			)
			.orderBy(templates.sortOrder);
	}
}