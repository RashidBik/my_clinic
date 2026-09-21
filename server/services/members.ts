import { eq, and, ne, or, like, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, members, roles, organizations } from '../db/schema/core.js';
import { hashPassword } from './password.js';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface MemberListItem {
	id: string; // member id
	userId: string;
	name: string;
	phone: string;
	avatar: string | null;
	roleId: string;
	roleName: string;
	roleSlug: string;
	baseRole: string;
	isMember: boolean;
	status: 'active' | 'inactive' | 'suspended';
	joinedAt: Date;
	lastLoginAt: Date | null;
}

export interface CreateMemberInput {
	organizationId: string;
	name: string;
	phone: string;
	password: string;
	roleId: string;
}

export interface UpdateMemberInput {
	roleId?: string;
	status?: 'active' | 'inactive' | 'suspended';
	isMember?: boolean;
}

export class MemberError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode = 400
	) {
		super(message);
		this.name = 'MemberError';
	}
}

// ═══════════════════════════════════════════════
// List Members
// ═══════════════════════════════════════════════

export async function listMembers(options: {
	organizationId: string;
	search?: string;
	roleId?: string;
}): Promise<MemberListItem[]> {
	const conditions = [eq(members.organizationId, options.organizationId)];

	if (options.roleId) {
		conditions.push(eq(members.roleId, options.roleId));
	}

	if (options.search) {
		conditions.push(
			or(
				like(users.name, `%${options.search}%`),
				like(users.phone, `%${options.search}%`)
			)!
		);
	}

	const rows = await db
		.select({
			member: members,
			user: users,
			role: roles
		})
		.from(members)
		.innerJoin(users, eq(members.userId, users.id))
		.innerJoin(roles, eq(members.roleId, roles.id))
		.where(and(...conditions))
		.orderBy(roles.sortOrder, users.name);

	return rows.map((row) => ({
		id: row.member.id,
		userId: row.user.id,
		name: row.user.name,
		phone: row.user.phone,
		avatar: row.user.avatar,
		roleId: row.role.id,
		roleName: row.role.name,
		roleSlug: row.role.slug,
		baseRole: row.role.baseRole,
		isMember: row.member.isMember,
		status: row.member.status as MemberListItem['status'],
		joinedAt: row.member.joinedAt,
		lastLoginAt: row.user.lastLoginAt
	}));
}

// ═══════════════════════════════════════════════
// Create Member
// ═══════════════════════════════════════════════

export async function createMember(input: CreateMemberInput): Promise<string> {
	// ۱. چک کن Role در Org باشد
	const [role] = await db
		.select()
		.from(roles)
		.where(
			and(
				eq(roles.id, input.roleId),
				eq(roles.organizationId, input.organizationId)
			)
		)
		.limit(1);

	if (!role) {
		throw new MemberError('ROLE_NOT_FOUND', 'نقش یافت نشد', 404);
	}

	// ۲. آیا User با این phone هست؟
	let [user] = await db
		.select()
		.from(users)
		.where(eq(users.phone, input.phone))
		.limit(1);

	// ۳. اگر نیست، بساز
	if (!user) {
		const passwordHash = await hashPassword(input.password);

		[user] = await db
			.insert(users)
			.values({
				phone: input.phone,
				name: input.name,
				passwordHash
			})
			.returning();
	} else {
		// ۴. اگر هست، چک کن قبلاً عضو این Org نباشد
		const [existing] = await db
			.select()
			.from(members)
			.where(
				and(
					eq(members.organizationId, input.organizationId),
					eq(members.userId, user.id)
				)
			)
			.limit(1);

		if (existing) {
			throw new MemberError(
				'ALREADY_MEMBER',
				'این کاربر قبلاً عضو این سازمان است',
				400
			);
		}
	}

	// ۵. Add Member
	const [member] = await db
		.insert(members)
		.values({
			organizationId: input.organizationId,
			userId: user.id,
			roleId: input.roleId,
			isMember: true,
			status: 'active'
		})
		.returning();

	return member!.id;
}

// ═══════════════════════════════════════════════
// Update Member
// ═══════════════════════════════════════════════

export async function updateMember(
	memberId: string,
	organizationId: string,
	input: UpdateMemberInput
): Promise<void> {
	// چک کن Member وجود دارد
	const [member] = await db
		.select()
		.from(members)
		.where(
			and(
				eq(members.id, memberId),
				eq(members.organizationId, organizationId)
			)
		)
		.limit(1);

	if (!member) {
		throw new MemberError('NOT_FOUND', 'کارمند یافت نشد', 404);
	}

	// اگر Role عوض می‌شود، چک کن Role در Org باشد
	if (input.roleId) {
		const [role] = await db
			.select()
			.from(roles)
			.where(
				and(
					eq(roles.id, input.roleId),
					eq(roles.organizationId, organizationId)
				)
			)
			.limit(1);

		if (!role) {
			throw new MemberError('ROLE_NOT_FOUND', 'نقش یافت نشد', 404);
		}
	}

	const updates: Record<string, unknown> = {};
	if (input.roleId !== undefined) updates.roleId = input.roleId;
	if (input.status !== undefined) updates.status = input.status;
	if (input.isMember !== undefined) updates.isMember = input.isMember;

	await db.update(members).set(updates).where(eq(members.id, memberId));
}

// ═══════════════════════════════════════════════
// Delete Member
// ═══════════════════════════════════════════════

export async function deleteMember(
	memberId: string,
	organizationId: string,
	requestingUserId: string
): Promise<void> {
	const [member] = await db
		.select()
		.from(members)
		.where(
			and(
				eq(members.id, memberId),
				eq(members.organizationId, organizationId)
			)
		)
		.limit(1);

	if (!member) {
		throw new MemberError('NOT_FOUND', 'کارمند یافت نشد', 404);
	}

	// جلوگیری از حذف خود
	if (member.userId === requestingUserId) {
		throw new MemberError('CANNOT_DELETE_SELF', 'نمی‌توانید خودتان را حذف کنید', 400);
	}

	await db.delete(members).where(eq(members.id, memberId));
}

// ═══════════════════════════════════════════════
// List Roles (برای Dropdown)
// ═══════════════════════════════════════════════

export async function listRoles(organizationId: string) {
	return db
		.select()
		.from(roles)
		.where(
			and(
				eq(roles.organizationId, organizationId),
				eq(roles.isActive, true)
			)
		)
		.orderBy(roles.sortOrder);
}